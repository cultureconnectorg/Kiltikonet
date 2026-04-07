# BRAIN_AUDIT.md — Audit Complet CVL BRAIN
# kiltikonet.fr — ITER.56 Phase 1.5
# Date : 2026-04-07

## 1. Design de l'Interface Brain Actuelle

### Localisation : Terminal Console (Espace Pro)
- **Composant** : `TerminalConsole.jsx` (appele depuis ProSpaceDashboard section "terminal")
- **Layout** : Colonne unique avec historique de messages scrollable + champ de saisie en bas
- **Couleurs** : Background #0a0a0b, texte #e5e2e3, accents gold #d8c591
- **Typographie** : Manrope pour le body, Newsreader serif italic pour les titres
- **Style** : "Thought process" visible — le Brain montre son raisonnement avant la reponse finale

### Composant ZIP Omega : `BrainChat.tsx` (386 lignes)
- **Layout** : Split panel — sidebar historique (gauche) + chat (droite)
- **Fonctionnalites supplementaires** :
  - Sidebar avec historique des conversations passees
  - Boutons de feedback (thumbs up/down)
  - Copie de la reponse
  - Support Markdown avec syntax highlighting (react-markdown + Prism)
  - Indicateurs de typing avec animation
  - Toggle sidebar (PanelLeftOpen/PanelLeftClose)
  - 4 outils proposes : Terminal, Code, Layout, Globe
- **Design** : Plus abouti et moderne que la version actuelle

## 2. Outils dans la Barre de Discussion

### Version actuelle (TerminalConsole.jsx) :
Aucun outil specifique dans la barre — c'est un simple champ texte avec envoi.

### Version Brain routes (`/api/brain/`) :
| Outil/Endpoint | Methode | Logique |
|---|---|---|
| `/api/brain/chat` | POST | Chat simple via terminal (Emergent LlmChat) |
| `/api/brain/chat-enriched` | POST | Chat avec historique multi-turn + enrichissement web (Tavily) + archives utilisateur |
| `/api/brain/analyse` | POST | Analyse de profil/contexte |
| `/api/brain/entreprise` | POST | Analyse specifique entreprise |
| `/api/brain/evenement` | POST | Analyse evenement |
| `/api/brain/alerte` | POST | Alerte operationnelle |
| `/api/brain/web-search` | POST | Recherche web autonome (Tavily) |
| `/api/brain/smart-engine-flux` | POST | Analyse smart engine |
| `/api/brain/enrich-badge` | POST | Enrichissement badge IA |
| `/api/brain/daily-report` | POST | Rapport quotidien |
| `/api/brain/batch-process` | POST | Traitement batch profils |
| `/api/brain/memory/save` | POST | Sauvegarder conversation |
| `/api/brain/memory/history` | GET | Historique des conversations sauvegardees |
| `/api/brain/memory/{id}` | GET/DELETE | Lire/supprimer une conversation |

## 3. Prompt Systeme Actuel (Copie exacte)

Fichier : `/app/backend/services/cvl_brain_knowledge.py` (219 lignes)

### Structure en 4 blocs :
1. **_INTERNAL_CONTEXT** (secret) : Connaissance strategique (architecture, FREKcore, plans blockchain, IPO 2028). Ne jamais reveler.
2. **CVLN_KNOWLEDGE_BASE** (personnalite publique) : Qui est CVL Brain, style conversationnel, ancrage culturel diasporique, anticipation contextuelle 5 niveaux, enthousiasme "c'est genial", thought process visible.
3. **CVLN_RESPONSE_RULES** : Regle d'or — "Tu es un sage, pas un garde".
4. **build_cvl_brain_prompt()** : Assemble les 3 blocs + contexte utilisateur + contexte web.

### Points cles du prompt :
- Detection automatique de la langue (francais/creole/anglais)
- Melanges creole martiniquais/guadeloupeen attendus naturellement
- JAMAIS dire "je suis une IA"
- Anticiper les besoins utilisateur sur 5 niveaux
- Montrer le processus de reflexion ("Premye bagay...", "Apre sa...")
- Utiliser "c'est genial" regulierement

## 4. BUG 1 — CREOLE MARTINIQUAIS

### Analyse de la cause racine :
Le prompt systeme dit : "Tu detectes automatiquement la langue de l'utilisateur". Cependant :

1. **Le prompt ne donne pas d'instruction EXPLICITE** pour forcer la reponse en creole quand l'utilisateur ecrit en creole. Il dit "Tu melanges francais et creole avec aisance" — ce qui signifie que le LLM peut choisir de repondre en francais meme si l'utilisateur ecrit en creole.

2. **Il n'y a pas de detection de langue explicite** dans le code backend. Le message utilisateur est envoye tel quel au LLM sans analyse prealable de la langue.

3. **Le modele Claude** a une tendance naturelle a repondre en francais quand le prompt systeme est en francais, meme si le message utilisateur est en creole.

### Correction requise :
Modifier le prompt systeme pour ajouter une instruction de detection de langue plus stricte :
```
"Tu detectes automatiquement la langue de l'utilisateur.
 Si l'utilisateur ecrit en creole martiniquais, tu reponds
 EXCLUSIVEMENT en creole martiniquais (pa an francais,
 pa an anglais — an kreyol matjinik selman)."
```

### Fichier a modifier : `/app/backend/services/cvl_brain_knowledge.py`
- Zone : `CVLN_KNOWLEDGE_BASE`, section "=== QUI TU ES ==="
- Ajouter apres la ligne "Tu melanges francais et creole..." une instruction stricte de detection + reponse dans la meme langue.

## 5. BUG 2 — COUPURE APRES 3 ECHANGES

### Analyse de la cause racine :

**Cause principale identifiee : Option A — L'historique est rejoue a chaque requete (O(n^2) d'appels API)**

Dans `brain_chat_enriched` (server.py L.9756-9764) :
```python
if messages_history:
    for hist_msg in messages_history[:-1]:
        if hist_msg.get("role") == "user":
            hist_user = UserMessage(text=hist_msg["content"])
            try:
                await chat_obj.send_message(hist_user)  # <-- APPEL API REEL pour chaque message historique !
            except Exception:
                pass  # History replay best-effort
```

**Probleme** : A chaque nouveau message, TOUS les messages precedents sont renvoyes au LLM un par un via `chat_obj.send_message()`. Chaque `send_message()` fait un appel API reel a Anthropic. Donc :
- Echange 1 : 1 appel API
- Echange 2 : 1 (historique) + 1 (nouveau) = 2 appels API
- Echange 3 : 2 (historique) + 1 (nouveau) = 3 appels API
- Echange 4 : 3 (historique) + 1 (nouveau) = 4 appels API
- ...

Avec le budget Emergent LLM Key deja bas, cela epuise rapidement les credits API. De plus, la latence augmente lineairement : au 10eme echange, il faut attendre 9 reponses intermediaires avant d'obtenir la vraie reponse.

**Facteur aggravant** : Un nouveau `LlmChat` est cree a chaque requete avec un `session_id=str(uuid.uuid4())` — donc AUCUNE persistance de session cote API. L'historique doit etre rejoue a chaque fois.

### Pour `/api/brain/chat` (simpler endpoint) :
Le `session_id` est passe par le frontend, ce qui permet theoriquement la persistance de session cote Emergent. Mais si le session_id change ou si le frontend ne le renvoie pas, meme probleme.

### Correction requise :
1. **Dans `brain_chat_enriched`** : NE PAS rejouer l'historique via des appels API. Utiliser le `session_id` du frontend pour la persistance de session.
2. **Dans `brain_chat`** : S'assurer que le `session_id` est bien persistant entre les appels (ne pas regenerer un nouveau UUID a chaque fois si le frontend en fournit un).
3. **Alternative** : Construire l'historique comme une liste de messages dans le prompt systeme plutot que de les envoyer un par un.

### Fichiers a modifier :
- `/app/backend/server.py` (L.9744-9771) : `brain_chat_enriched`
- `/app/backend/routes/brain.py` (L.128-155) : `brain_chat`
