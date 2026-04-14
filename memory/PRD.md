# PRD — Kiltikonet CC2026

## Vision
Plateforme evenementielle culturelle souveraine pour Culture Connect 2026, Martinique.

## Bug Fixes Applied (2026-04-14)

### Stripe Payments — FIXED (Double /api/api/ Bug)
- **Root Cause**: Fichiers frontend avec `const API = '${BACKEND_URL}/api'` utilisaient `${API}/api/create-checkout-session`, formant des URLs `/api/api/...` → 404 silencieux
- **Fix**: Suppression du `/api/` en trop dans les appels fetch/axios de **8 fichiers**:
  - `PartnershipPage.jsx` — checkout partenariat
  - `RegistrationForm.jsx` — checkout accreditation + upload image
  - `PartnerConfirmation.jsx` — statut checkout
  - `ConfirmationScreen.jsx` — statut checkout
  - `PartnerManagement.jsx` — toutes les API partenaires (7 occurrences)
  - `ProSpaceDashboard.jsx` — auth/me + auth/logout (3 occurrences)
  - `LandingPage.jsx` — cms/partners
  - `AdminDashboard.jsx` — auth/me
- **Testing**: 16/16 tests backend PASS, frontend Playwright PASS, code review PASS

### Previous Fixes (Still Active)
- **Registration** (`RegistrationForm.jsx`): URL corrigee
- **Partnership** (`PartnershipPage.jsx`): URL corrigee
- **Confirmation** (`PartnerConfirmation.jsx`, `ConfirmationScreen.jsx`): URL corrigee
- **Shop** (`shop_payments.py`): Pack IDs `pack-*` → `kt-*`
- **Wallet** (`WalletView.jsx`): IDs + prix mis a jour
- **Jetons page**: Endpoints `/api/jetons/packs`, `/api/jetons/wallet/{id}`, `/api/jetons/checkout` crees
- **Rate limiter**: `/api/jetons` et `/api/create-checkout` exclus

### Permissions — FIXED
- `buy_tokens`, `publish_content`, `support_creators` ajoutes a TOUS les roles
- MongoDB `doctrine_permissions` mis a jour

### Feed Instagram + Reels — REWRITTEN
- FeedView style Instagram (scrollable, cartes, avatars, actions)
- Mode Reels/Shorts (plein ecran, scroll-snap)
- Toggle Feed/Reels, commentaires, eclairs

### Auth (`useAuth.js`) — FIXED
- Cookie fallback path ajout

## Key Endpoints
- POST /api/create-checkout-session (accreditation, partnership, ticket)
- POST /api/shop/checkout/create (kt-decouverte, kt-culture, kt-diaspora, kt-vip)
- GET /api/jetons/packs, POST /api/jetons/checkout
- GET /api/pro/feed, POST /api/pro/feed/post
- DELETE /api/pro/feed/posts/{id}?author_id=

## Backlog
- P1: Logo OrbitalMenu centre (Desktop), InboxView empty state, Profile photo preview
- P2: ShopView/AgendaView responsives
- P3: Geolocalisation (Leaflet.js)
- P4: i18n 8 langues
- P4: Smart Engine & Analytics

## Architecture Note
- Convention URL frontend: certains fichiers utilisent `const API = '${BACKEND_URL}/api'` (appels: `${API}/xxx`), d'autres `const API = process.env.REACT_APP_BACKEND_URL` (appels: `${API}/api/xxx`). Les deux conventions coexistent — ne pas melanger.

## Credentials
- Admin: cultureconnectorg@gmail.com / code 000000
- FREK Admin: FREK-ADM-0001
