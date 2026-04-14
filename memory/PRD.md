# PRD — Kiltikonet CC2026

## Vision
Plateforme evenementielle culturelle souveraine pour Culture Connect 2026, Martinique.

## Bug Fixes Applied (2026-04-14)

### Stripe Payments — FIXED
- **Registration** (`RegistrationForm.jsx`): URL manquait `/api` prefix → `${API}/api/create-checkout-session`
- **Partnership** (`PartnershipPage.jsx`): Meme fix `/api` prefix
- **Confirmation** (`PartnerConfirmation.jsx`, `ConfirmationScreen.jsx`): Fix prefix `/api/checkout/status`
- **Upload** (`RegistrationForm.jsx`): Fix prefix `/api/upload-image`
- **Shop** (`shop_payments.py`): Pack IDs changes `pack-*` → `kt-*` pour correspondre a `fintech.py`
- **Wallet** (`WalletView.jsx`): Meme fix IDs + prix mis a jour
- **Jetons page**: Endpoints `/api/jetons/packs`, `/api/jetons/wallet/{id}`, `/api/jetons/checkout` CREES dans `server.py`
- **Rate limiter**: `/api/jetons` et `/api/create-checkout` ajoutes aux exclusions

### Permissions — FIXED
- `buy_tokens`, `publish_content`, `support_creators` ajoutes a TOUS les roles
- MongoDB `doctrine_permissions` mis a jour

### Feed Instagram + Reels — REWRITTEN
- FeedView reecrit style Instagram (scrollable, cartes, avatars, actions)
- Mode **Reels/Shorts** ajoute (plein ecran, scroll-snap, gradient backgrounds, actions laterales)
- Toggle Feed/Reels en haut
- Images: n'affiche le container que si URL > 5 chars, parent hidden si image erreur
- Commentaires: fonctionnels (modal bottom sheet, envoi + affichage immediat)
- Eclairs: feedback toast (succes, erreur, solde insuffisant)

### Feed Delete — FIXED
- `pro_feed.py`: Fallback par `author_frek_id`, `author_email`, puis lookup en registrations
- L'admin peut supprimer ses propres posts

### Auth (`useAuth.js`) — FIXED
- Cookie fallback path: ajout `id: s.profile_id || s.frek_id`
- `pro_feed.py create_post`: Fallback lookup par `frek_id` puis `email`

## Key Endpoints
- POST /api/create-checkout-session (accreditation, partnership, ticket)
- POST /api/shop/checkout/create (kt-decouverte, kt-culture, kt-diaspora, kt-vip)
- GET /api/jetons/packs, POST /api/jetons/checkout
- GET /api/pro/feed, POST /api/pro/feed/post
- DELETE /api/pro/feed/posts/{id}?author_id=

## Backlog
- P1: Logo OrbitalMenu, InboxView empty state, Profile photo preview
- P2: ShopView/AgendaView responsives
- P3: Geolocalisation (Leaflet.js)
- P4: i18n 8 langues

## Credentials
- Admin: cultureconnectorg@gmail.com / code 000000
- FREK Admin: FREK-ADM-0001
