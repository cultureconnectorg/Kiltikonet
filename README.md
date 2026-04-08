# Kiltikonet — CC2026

Plateforme culturelle souveraine pour **Culture Connect 2026**, Martinique.
Application full-stack PWA : accréditations, paiements, badges NFC, IA culturelle, gouvernance communautaire.

## Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | React 19, Tailwind CSS 4, Framer Motion, Monaco Editor |
| Backend | FastAPI (Python 3.11), Motor (MongoDB async) |
| Base de données | MongoDB Atlas |
| Authentification | JWT cookies httpOnly 30j, WebAuthn (Face ID/Touch ID), Google OAuth, Magic Link |
| Paiements | Stripe (mode live) |
| Emails | Brevo (4 templates transactionnels) |
| IA | Claude Sonnet via Emergent LLM Key |
| Push | Web Push API (pywebpush, VAPID) |
| Stockage | Emergent Object Storage |
| NFC | Baserow sync (table 865847) |
| PWA | Service Worker, manifest, offline-first |

## Architecture

```
/pro                    → Espace Pro Omega (OrbitalMenu, 7 modules)
/admin/core             → Espace Admin (admin/founder uniquement)
/espace-pro/connexion   → Page de login (5 méthodes)
/scan                   → Scanner NFC terrain
/                       → Vitrine publique
```

## Variables d'environnement requises

### Backend (`/app/backend/.env`)
```
MONGO_URL=mongodb://...
DB_NAME=...
ENVIRONMENT=production
STRIPE_API_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
BREVO_API_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_PUBLIC_KEY=...
VAPID_CLAIM_EMAIL=cc@kiltikonet.fr
EMERGENT_API_KEY=...
BASEROW_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Frontend (`/app/frontend/.env`)
```
REACT_APP_BACKEND_URL=https://kiltikonet.fr
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_...
REACT_APP_VAPID_PUBLIC_KEY=...
REACT_APP_GOOGLE_CLIENT_ID=...
```

## Développement local

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd frontend
yarn install
yarn start
```

## Déploiement

L'application est déployée via Emergent Platform avec supervisor :
- Backend : port 8001 (géré par supervisor)
- Frontend : port 3000 (géré par supervisor)
- Ingress Kubernetes : `/api/*` → backend, `/*` → frontend

Pour un déploiement sur infrastructure propre :
1. Configurer toutes les variables d'environnement
2. Installer les dépendances Python et Node
3. Lancer le backend avec gunicorn/uvicorn
4. Build le frontend avec `yarn build`
5. Servir avec nginx (proxy `/api/` vers le backend)

## Documentation

- [Architecture complète](ARCHITECTURE.md)
- [Documentation API](API_DOCUMENTATION.md)
- [Guide développeur](ONBOARDING_DEV.md)
- [Guide opérationnel CC2026](GUIDE_OPERATIONNEL_CC2026.md)
- [Journal des décisions](DECISIONS.md)
- [Rapport ITER.60](ITER60_SUMMARY.md)
- [Rapport ITER.61](ITER61_SUMMARY.md)

## Tests

```bash
# Rapports de tests automatisés
ls /app/test_reports/iteration_*.json
# Dernier rapport : iteration_86.json — 100% (Backend 11/11, Frontend 100%)
```

## Licence

Propriétaire — Culture Connect / Kiltikonet.fr
