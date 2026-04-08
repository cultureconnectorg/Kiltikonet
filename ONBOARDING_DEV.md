# Onboarding Développeur — Kiltikonet CC2026

## Bienvenue

Kiltikonet est une plateforme culturelle souveraine pour l'événement Culture Connect 2026 en Martinique. Ce guide te permettra de contribuer au projet rapidement et sans casser l'existant.

## Prérequis

- Node.js 18+ et Yarn
- Python 3.11+
- MongoDB (local ou Atlas)
- Git

## Installation

```bash
# Clone
git clone <repo-url>
cd kiltikonet

# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Remplir les variables
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend (nouveau terminal)
cd frontend
yarn install
yarn start
```

L'app tourne sur http://localhost:3000 (frontend) et http://localhost:8001 (backend).

## Règles absolues

### 1. Additif uniquement, zéro régression
Ne modifie jamais un fichier sans l'avoir lu en entier. Ne supprime jamais de code fonctionnel. Ajoute, ne remplace pas.

### 2. Lister les fichiers avant de toucher
Avant de modifier un composant, vérifie qu'il n'est pas importé ailleurs. Un changement d'interface casse les consommateurs.

### 3. Zéro bouton mort
Chaque bouton, chaque action doit être câblé à une vraie API. Pas de `console.log('TODO')`, pas de mock en production.

### 4. Tests avant merge
Chaque fonctionnalité doit être testée (curl pour le backend, screenshot pour le frontend). Les rapports de tests sont dans `/app/test_reports/`.

### 5. Pas de `console.log` en production
Utilise `console.error` uniquement dans les blocs catch. Jamais de `console.log` ou `console.warn`.

## Architecture du code

```
/app/
├── backend/
│   ├── server.py          # Monolithe principal (~9800 lignes)
│   ├── routes/            # Routeurs extraits
│   │   ├── webauthn.py
│   │   ├── push_notifications.py
│   │   ├── admin_cc2026.py
│   │   ├── pro_feed.py
│   │   ├── pro_social.py
│   │   ├── omega.py
│   │   └── doctrine.py
│   ├── services/
│   │   ├── object_storage.py
│   │   └── brevo_templates.py
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── omega/     # Composants Espace Pro Omega
│   │   │   └── ui/        # Shadcn UI
│   │   └── hooks/         # Custom hooks React
│   ├── public/
│   │   ├── sw.js          # Service Worker PWA
│   │   └── manifest.json
│   └── .env
└── test_reports/           # Rapports de tests automatisés
```

## Décisions techniques clés

1. **React 19** : On utilise les dernières APIs, pas de class components.
2. **Framer Motion** : Import via `motion/react` (pas `framer-motion`).
3. **MongoDB ObjectId** : TOUJOURS exclure `_id` des projections (`{"_id": 0}`).
4. **Dates** : `datetime.now(timezone.utc).isoformat()` partout.
5. **Auth** : Cookie httpOnly, pas de JWT dans le localStorage.
6. **Couleurs** : `#0a0a0b` (fond), `#f2ca50` (accent gold), `#1B4D47` (vert Kiltikonet).

## Pièges à éviter

1. **Service Worker cache** : Si tu modifies le frontend et que ça ne se met pas à jour, le SW sert l'ancienne version. Incrémente la version du cache dans `sw.js`.

2. **server.py monolithique** : Ne rajoute PAS de code dans `server.py`. Crée un nouveau fichier dans `routes/` et importe-le.

3. **React 19 + build** : `yarn build` peut échouer sur `unstable_act`. C'est un bug connu React 19 / react-scripts. Le mode dev fonctionne parfaitement.

4. **Stripe live** : Les clés sont en mode LIVE. Ne fais JAMAIS de test de paiement avec des vraies cartes.

5. **FREK-ID** : Identifiant unique de l'utilisateur dans tout le système. Ne pas confondre avec l'email ou le MongoDB `_id`.

## Comptes de test

| Compte | Email | Accès |
|--------|-------|-------|
| Admin bypass | cultureconnectorg@gmail.com | Code: 000000 |
| Espace Coleen | — | Password: Coleen2026 |

## Liens utiles

- Rapports de tests : `/app/test_reports/iteration_*.json`
- Documentation API : `/app/API_DOCUMENTATION.md`
- Décisions : `/app/DECISIONS.md`
- Architecture : `/app/ARCHITECTURE.md`
