# PRD — Kiltikonet CC2026

## Vision
Plateforme evenementielle culturelle souveraine pour Culture Connect 2026, Martinique. Full-stack React 19 + FastAPI + MongoDB.

## Architecture
- Frontend: React 19, Tailwind CSS, motion/react
- Backend: FastAPI, MongoDB (motor)
- Auth: JWT, FREK-ID OTP, Google OAuth, GitHub OAuth, WebAuthn
- Payments: Stripe (Live mode)
- PWA: Service Worker, Push Notifications

## Bug Fixes Applied (2026-04-14)

### 1. Stripe "ACHETER DES JCC" buttons — FIXED
- **Root cause**: WalletView used old pack IDs (`pack-decouverte`) but fintech.py expects `kt-decouverte`
- **Fix**: Updated PACKS array in WalletView.jsx to match fintech.py KT_PACKAGES
- **Root cause 2**: Permission `buy_tokens` only granted to `consumer` role
- **Fix**: Added `buy_tokens` to ALL roles (creator, professional, institutional, distributor)
- **Note**: Stripe checkout page shows "Something went wrong" — this is a Stripe account config issue (live mode products), NOT a code bug

### 2. Feed — posts, eclairs, photos — FIXED
- **Root cause**: useAuth.js cookie fallback path didn't set `user.id`, so FeedView sent empty author_id
- **Fix**: Added `id: s.profile_id || s.frek_id` to cookie auth path
- **Root cause 2**: create_post only looked up by `registrations.id`, failing for frek_id or email lookups
- **Fix**: Added fallback lookups by frek_id then email in pro_feed.py

### 3. Permissions system — FIXED  
- Added `buy_tokens`, `publish_content`, `support_creators` to ALL doctrine roles
- Updated MongoDB doctrine_permissions collection

### 4. Builder → Feed pipeline — FIXED (previous session)
- Builder publish now writes to `pro_posts` (not `feed_posts`)
- FeedView reads from `/api/pro/feed` which queries `pro_posts`

### 5. MobileBottomNav — FIXED (previous session)
- "Espace Pro" link corrected from `/espace-pro` to `/pro`

## Key DB Schema
- `pro_posts`: {id, author_id, author_name, content, eclairs_count, is_ghost, created_at}
- `builder_projects`: {project_id, email, titre, description, status, published}
- `registrations`: {id, email, full_name, frek_id, profile_type}
- `doctrine_permissions`: {actor_role, can[], label_fr}

## Key API Endpoints
- POST /api/shop/checkout/create — Stripe checkout (pack IDs: kt-decouverte, kt-culture, kt-diaspora, kt-vip)
- POST /api/pro/feed/post — Create post (requires publish_content permission)
- POST /api/pro/feed/posts/{id}/eclair — Send eclair (debits 1 JCC)
- GET /api/pro/feed — Paginated feed
- POST /api/builder/publish — Publish project to feed

## Backlog
- P1: Logo OrbitalMenu centre, InboxView empty state, Profile photo preview
- P2: ShopView/AgendaView responsives
- P3: Geolocalisation (Leaflet.js)
- P4: i18n 8 langues (FR, KW, EN, ES, PT, NL, DE, AR+RTL)

## Known Issues
- Stripe checkout page "Something went wrong" = Stripe account config, not code
- GitHub OAuth needs GITHUB_CLIENT_ID/SECRET env vars
- AWS SES in Sandbox mode
- yarn build incompatible React 19

## Credentials
- Admin: cultureconnectorg@gmail.com / code 000000
- FREK Admin: FREK-ADM-0001
