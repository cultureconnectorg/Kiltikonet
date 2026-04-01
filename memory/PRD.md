# CC2026 — KILTIKONET Platform — PRD

## Vision
Fintech culturelle du Sud Global. Plateforme sociale connectant l'Afrique, l'Amerique Latine et la Diaspora par la culture. Wallet Universel Kilti-Tokens, Stripe omnicanal, Growth Engine 4000 ghosts.

## Architecture
- **Frontend**: React 19, Tailwind CSS, PWA
- **Backend**: FastAPI, MongoDB
- **Fintech**: Stripe Checkout omnicanal, Wallet Universel (KT), FREK-ID terminal

## Design System Premium
- Fond: `#0a0a0b` (OLED Black)
- Or blanc: `#E8D5A0`
- Police: DM Sans
- Texte secondaire: `#72727a`

## Implemente

### Login/Inscription Unifie (DONE - 02/04/2026)
- **Magic Link** : saisie email, envoi OTP, verification
- **Auto-inscription** : si email inconnu, creation profil + FREK-ID unique (FREK-XXXX-XXXX)
- **Admin bypass** : cultureconnectorg@gmail.com / 000000
- **Footer Legal** : Mentions Legales (Factory Maker Studio EURL), Conditions KT, Politique FREK-ID, Confidentialite
- **Trust Signals** : Chiffre E2E, RGPD, KT Ecosystem

### Profil & Parametres (DONE - 02/04/2026)
- **FREK-ID** visible dans profil (badge violet)
- **Selecteur de langue** : FR, EN, ES, PT
- **Ecosysteme KT** : mention validite etendue (CC2026, CC2027 et suivants)
- **RGPD** : Export donnees JSON + Suppression de compte (irreversible, KT non rembourses)

### Fintech — Monnaie Forte (DONE - 01/04/2026)
- 5 packs : Decouverte 10EUR→15KT, Culture 25EUR→40KT, Diaspora 50EUR→85KT, VIP 100EUR→180KT, Partenaire 500EUR→1000KT
- Metadata Stripe : Factory Maker Studio EURL
- Promesse ecosysteme : KT valables toutes editions CC
- Ghost Bridge VIP : DM Artiste Certifie pour achats >=50EUR
- Dashboard Admin Financier : Float/Passif/Cash, adoption par zone, revenue par pack

### Growth Engine v2 (DONE)
- 4000 profils : 40% Afrique / 40% Latino / 20% Diaspora
- 2028 posts sur 3 ans

## Endpoints
### Auth/Pro
- POST /api/pro/request-access (auto-register)
- POST /api/pro/verify-code
- POST /api/pro/update-language
- POST /api/pro/delete-account
- GET /api/pro/export-data/{user_id}

### Fintech
- GET/POST /api/wallet/{user_id}
- GET /api/shop/packages
- POST /api/shop/checkout/create
- GET /api/fintech/dashboard

## Tests
- iteration_55: Backend 100% (19/19), Frontend 100% — Login/Settings/RGPD
- iteration_54: Backend 100% (23/23), Frontend 100% — Monnaie Forte
- iteration_53: Backend 100% (21/21), Frontend 100%

## Backlog
### P1
- Messages standalone page
- Network standalone page

### P2
- Mgraph D3.js interactif

### P3
- Vue 3D SmartEngine
- AWS SES sortie Sandbox

## Credentials
- Admin: cultureconnectorg@gmail.com / 000000
