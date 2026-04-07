# TERMINAL_SPEC.md — Specification Fonctionnelle Console Terminal
# kiltikonet.fr — ITER.56 Phase 6.1
# Date : 2026-04-07

## Etat Actuel

### Composant existant : `TerminalConsole.jsx`
- Chat simple avec CVL Brain
- Pas d'editeur de code
- Pas de preview iframe
- Pas de deploiement

### Composant ZIP Omega : `BuilderView.tsx`
- Layout plus structure mais aussi limité à un chat
- Pas d'editeur Monaco
- Pas de preview

## Specification Fonctionnelle Cible

### Interface — 3 Zones

```
┌──────────────────┬────────────────────┐
│                  │                    │
│   EDITEUR        │   PREVIEW          │
│   Monaco Editor  │   iframe sandbox   │
│   HTML/CSS/JS    │   auto-refresh     │
│                  │                    │
├──────────────────┴────────────────────┤
│  TERMINAL OUTPUT — logs deploiement   │
│  ────────────────────────────────────  │
│  [CVL Brain] "Genere moi un header"   │
│  > HTML genere. [Inserer dans editeur]│
└───────────────────────────────────────┘
```

### Zone 1 : Editeur (gauche)
- **Engine** : Monaco Editor (`@monaco-editor/react`)
- **Languages** : HTML, CSS, JavaScript
- **Theme** : `vs-dark` (coherent avec Sovereign Onyx)
- **Features** : Syntax highlighting, autocompletion, minimap, bracket matching
- **Taille** : 50% de la largeur, pleine hauteur moins terminal

### Zone 2 : Preview (droite)
- **Element** : `<iframe sandbox="allow-scripts allow-same-origin" />`
- **Attributs sandbox** :
  - `allow-scripts` : pour executer le JS
  - `allow-same-origin` : pour les CSS relatifs
  - PAS de `allow-forms`, `allow-popups`, `allow-top-navigation`
- **Auto-refresh** : Debounce 500ms apres chaque modification
- **Implementation** : `srcDoc` avec le contenu HTML de l'editeur

### Zone 3 : Terminal (bas)
- Console de sortie avec logs de deploiement
- Panel CVL Brain integre :
  - Prompt "Genere moi un header responsive..."
  - Brain recoit le prompt + slug actuel + HTML existant comme contexte
  - Genere du HTML/CSS propre
  - Bouton "Inserer dans l'editeur" en un clic
  - Prompt systeme specifique : generation HTML/CSS/JS propre, identite Sovereign Onyx (OLED black, gold), responsive, sans dependances externes

## Deploiement

### Endpoint : `POST /api/terminal/deploy`
```json
// Request
{ "slug": "my-page", "html": "<html>...</html>", "title": "Ma Page" }

// Response
{
  "deploy_id": "uuid",
  "url": "/pages/my-page",
  "version": 3,
  "timestamp": "ISO8601"
}
```

### Stockage des Deploiements
- **Collection MongoDB** : `terminal_deploys`
- **Schema** :
  ```json
  {
    "deploy_id": "uuid",
    "user_frek_id": "FREK-XXXX-XXXX",
    "user_id": "uuid",
    "slug": "my-page",
    "title": "Ma Page",
    "html": "<html>...</html>",
    "version": 3,
    "is_current": true,
    "created_at": "ISO8601"
  }
  ```
- Chaque deploiement cree une nouvelle version
- `is_current: true` seulement pour la derniere version
- Rollback = mettre `is_current: true` sur une version ancienne

### Route Publique : `/pages/{slug}`
- **Servie par** : Route FastAPI qui lit le HTML depuis MongoDB et le renvoie
- **Type de reponse** : `HTMLResponse` directe
- **Cache** : Header `Cache-Control: no-cache` pour eviter les versions perimees

### Historique des Deploiements
```
GET /api/terminal/deploys
Response: { deploys: [{ deploy_id, slug, title, version, url, created_at }] }
```

## Droits d'Acces

| Niveau | Acces | Quota |
|---|---|---|
| consumer | Lecture seule (voir les pages deployees) | 0 deploy |
| professional | Deploiement | 10/mois |
| creator | Deploiement | Illimite |
| distributor | Deploiement | Illimite |
| institutional | Deploiement | Illimite |

### Debit KT par Deploiement
- Suggestion : 5 KT par deploiement (a arbitrer)
- Le premier deploiement est gratuit

## Tracabilite
- Chaque deploiement logue dans `audit_log` avec FREK-ID
- Moderation : Scan automatique du HTML (recherche `<script src="externe">`, iframes cachees, etc.)

---

# TERMINAL_ARCH.md — Architecture Technique Console Terminal
# Date : 2026-04-07

## 1. Monaco Editor

### Installation
```bash
yarn add @monaco-editor/react
```

### Import
```jsx
import Editor from '@monaco-editor/react';
```

### Usage
```jsx
<Editor
  height="100%"
  defaultLanguage="html"
  theme="vs-dark"
  value={htmlContent}
  onChange={(value) => setHtmlContent(value)}
  options={{
    minimap: { enabled: true },
    fontSize: 14,
    wordWrap: 'on',
    automaticLayout: true,
  }}
/>
```

## 2. Sandbox iframe

```jsx
<iframe
  sandbox="allow-scripts"
  srcDoc={htmlContent}
  style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
  title="Preview"
/>
```

### Securite
- `allow-scripts` : le JS utilisateur s'execute dans le sandbox
- PAS de `allow-same-origin` en production (isole le DOM)
- PAS de `allow-forms` (empeche les soumissions de formulaire)
- PAS de `allow-popups` (empeche les ouvertures de fenetre)
- PAS de `allow-top-navigation` (empeche la navigation hors iframe)

## 3. Stockage des Deploiements

- **MongoDB** : collection `terminal_deploys`
- Le HTML est stocke directement dans le document MongoDB (pas de S3/filesystem)
- Pour des pages > 16MB (limite BSON), utiliser GridFS (cas extremement rare)
- Index : `user_frek_id` + `slug` + `is_current`

## 4. Route /pages/{slug}

```python
@app.get("/pages/{slug}")
async def serve_deployed_page(slug: str):
    deploy = await db.terminal_deploys.find_one(
        {"slug": slug, "is_current": True},
        {"_id": 0, "html": 1, "title": 1}
    )
    if not deploy:
        raise HTTPException(404, "Page non trouvee")
    return HTMLResponse(content=deploy["html"])
```

- Servi directement par FastAPI
- Pas de build, pas de compilation — le HTML brut est renvoye
- Le slug est sanitize (alphanumerique + tirets uniquement)

## 5. Moderation HTML

```python
import re
BLOCKED_PATTERNS = [
    r'<script\s+src\s*=\s*["\']http',  # Scripts externes
    r'<iframe\s',                       # Iframes cachees
    r'document\.cookie',                # Vol de cookies
    r'eval\s*\(',                       # Eval JS
    r'fetch\s*\(["\']http',             # Requetes externes
    r'XMLHttpRequest',                  # Ajax externe
]

def is_html_safe(html: str) -> bool:
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, html, re.IGNORECASE):
            return False
    return True
```
