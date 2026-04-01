# CC2026 — KILTIKONET Platform — PRD

## Vision
Fintech culturelle du Sud Global. Plateforme sociale connectant l'Afrique, l'Amerique Latine et la Diaspora par la culture (musique, art, patrimoine, gastronomie, litterature, formation). Wallet Universel Kilti-Tokens, Stripe omnicanal, Growth Engine 4000 ghosts.

## Architecture
- **Frontend**: React 19, Tailwind CSS, PWA
- **Backend**: FastAPI, MongoDB
- **Fintech**: Stripe Checkout omnicanal, Wallet Universel (KT), FREK-ID terminal
- **Integrations**: Stripe, iTunes API, Wikipedia API

## Design System Premium
- Fond: `#0a0a0b` (OLED Black)
- Or blanc: `#E8D5A0`
- Police: DM Sans
- Texte secondaire: `#72727a`

## Implemente

### Fintech Centralisee — Monnaie Forte (DONE - 01/04/2026)
**Wallet Universel** :
- Creation on-demand par user_id
- Liaison FREK-ID (scan NFC CC2026)
- Lookup par FREK-ID pour terminaux
- Sync legacy (registrations.jetons_solde)
- Historique transactions par canal
- **validity_extension: true** — KT reportables CC2027

**Stripe Omnicanal — Monnaie Forte** :
- Checkout sessions (web + app + terminal)
- 5 packs KT Monnaie Forte :
  - Pack Decouverte: 10EUR → 15 KT (+50%)
  - Pack Culture: 25EUR → 40 KT (+60%)
  - Pack Diaspora: 50EUR → 85 KT (+70%)
  - Pack VIP: 100EUR → 180 KT (+80%)
  - Pack Partenaire: 500EUR → 1000 KT (+100%)
- Metadata Stripe: Factory Maker Studio EURL (Martinique/Bruxelles)
- Status polling avec credit automatique

**Shop CRUD** : 19 produits (8 categories)
**Terminal CC2026** : Debit par FREK-ID scan
**Dashboard Admin Financier** : Float/Passif/Cash, adoption par zone, revenue par pack, entite legale
**Ghost Bridge VIP** : DM automatique Artiste Certifie pour achat VIP/Diaspora
**Promesse 2027** : Badge UI + validity_extension DB
**Celebration** : Animation doree post-achat

### Growth Engine v2 (DONE)
- 4000 profils : 40% Afrique / 40% Latino / 20% Diaspora
- 2028 posts sur 3 ans
- 11 techniques de croissance implementees

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
- iteration_54: Backend 100% (23/23), Frontend 100% — Monnaie Forte + Admin Dashboard
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
- Admin Dashboard: kk_admin_auth localStorage
