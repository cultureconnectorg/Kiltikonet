# CC2026 — KILTIKONET Platform — PRD

## Vision
Fintech culturelle du Sud Global. Plateforme sociale connectant l'Afrique, l'Amérique Latine et la Diaspora par la culture (musique, art, patrimoine, gastronomie, littérature, formation). Wallet Universel Kilti-Tokens, Stripe omnicanal, Growth Engine 4000 ghosts.

## Architecture
- **Frontend**: React 19, Tailwind CSS, PWA
- **Backend**: FastAPI, MongoDB
- **Fintech**: Stripe Checkout omnicanal, Wallet Universel (KT), FREK-ID terminal
- **Intégrations**: Stripe, iTunes API, Wikipedia API

## Design System Premium
- Fond: `#0a0a0b` (OLED Black)
- Or blanc: `#E8D5A0`
- Police: DM Sans
- Texte secondaire: `#72727a`

## Implémenté

### Fintech Centralisée (DONE - 01/04/2026)
**Wallet Universel** :
- Création on-demand par user_id
- Liaison FREK-ID (scan NFC CC2026)
- Lookup par FREK-ID pour terminaux
- Sync legacy (registrations.jetons_solde)
- Historique transactions par canal

**Stripe Omnicanal** :
- Checkout sessions (web + app + terminal)
- 5 packs KT : 10/50/100/250(Diaspora)/500(Mécène)
- Status polling avec crédit automatique
- Metadata canal + FREK-ID + ecosystem

**Shop CRUD** : 19 produits (8 catégories)
**Terminal CC2026** : Débit par FREK-ID scan
**Dashboard Admin** : Revenus, wallets, transactions, par canal
**Ghost Bridge** : Feedback post-achat (notification institution ghost)
**Célébration** : Animation dorée post-achat

### Growth Engine v2 (DONE)
- 4000 profils : 40% Afrique (Lagos, Dakar, Abidjan) / 40% Latino (Salvador, Carthagène, La Havane) / 20% Diaspora
- 2028 posts sur 3 ans
- 11 techniques de croissance implémentées

### Design Premium ITER.51 (DONE)
- Feed TikTok scroll-snap, Bottom nav 5 tabs, Logo KILTIKONET gradient

## Endpoints Fintech
- GET/POST /api/wallet/{user_id}
- GET /api/wallet/frek/{frek_id}
- POST /api/wallet/link-frek
- POST /api/wallet/transfer
- POST /api/wallet/consume
- GET /api/shop/packages
- POST /api/shop/checkout/create
- GET /api/shop/checkout/status/{id}
- GET/POST /api/shop/products
- GET /api/fintech/dashboard

## Tests
- iteration_53: Backend 100% (21/21), Frontend 100%

## Backlog
### P1
- Messages standalone page
- Network standalone page

### P2
- Mgraph D3.js interactif
- Export PDF badges batch

### P3
- Vue 3D SmartEngine
- AWS SES sortie Sandbox

## Credentials
- Admin: cultureconnectorg@gmail.com / 000000
