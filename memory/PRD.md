# PRD — Kiltikonet CC2026

## Vision
Plateforme evenementielle culturelle souveraine pour Culture Connect 2026, Martinique.

## Bug Fixes Applied (2026-04-14)

### Stripe Payments — FIXED (Double /api/api/ Bug)
- **Root Cause**: Fichiers frontend avec `const API = '${BACKEND_URL}/api'` utilisaient `${API}/api/create-checkout-session`, formant des URLs `/api/api/...` → 404 silencieux
- **Fix**: Suppression du `/api/` en trop dans les appels fetch/axios de **8 fichiers**
- **Testing**: 16/16 tests backend PASS, frontend Playwright PASS

### UX Clarifications (2026-04-14)
- **PricingPage**: Description Visiteur clarifiee ("Pre-inscription gratuite — Marche Culturel uniquement"), exclusions affichees en rouge ("Concerts & spectacles non inclus", "Conferences non incluses")
- **FREK masque**: Mentions "FREK-ID" retirees des pages publiques (PricingPage, ConfirmationScreen, BadgeInscription). FREK reste en backend et dans l'Espace Pro comme autorite silencieuse.

### Previous Fixes (Still Active)
- Shop pack IDs `pack-*` → `kt-*`, Wallet IDs + prix mis a jour
- Jetons endpoints crees, Rate limiter exclusions
- Permissions buy_tokens/publish_content/support_creators tous roles
- Feed Instagram + Reels rewrite, Feed Delete fix, Auth useAuth.js fix

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
- P4: i18n 8 langues, Smart Engine & Analytics

## Architecture Note
- Convention URL frontend: certains fichiers utilisent `const API = '${BACKEND_URL}/api'` (appels: `${API}/xxx`), d'autres `const API = process.env.REACT_APP_BACKEND_URL` (appels: `${API}/api/xxx`). Les deux conventions coexistent.
- FREK = autorite silencieuse. Ne pas mentionner sur les pages publiques.

## Credentials
- Admin: cultureconnectorg@gmail.com / code 000000
- FREK Admin: FREK-ADM-0001
