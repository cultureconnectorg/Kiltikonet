# PRD — Kiltikonet CC2026 — LAUNCH READY

## Vision
Plateforme evenementielle culturelle souveraine pour Culture Connect 2026, Martinique.
Chaque utilisateur commence a zero. Le contenu vit et evolue avec la communaute.

## LAUNCH CHECKLIST ✅
- [x] Stripe payments (partnership, accreditation, ticket, jetons)
- [x] Auth (email magic link, Google, GitHub, WebAuthn silent)
- [x] Feed Instagram + Reels (real content only, no ghosts)
- [x] Builder (publish to feed with images)
- [x] Wallet (KT tokens)
- [x] Shop (packs + products)
- [x] FAQ (7 seedees, admin editable)
- [x] Support tickets (public form + admin panel)
- [x] Tutorial first login (8 steps tooltips)
- [x] Geolocation (reverse geocoding on posts + globe)
- [x] i18n (FR, EN, ES, PT, KW)
- [x] Analytics tracker (page views, clicks, conversions, scroll depth)
- [x] FREK silent authority (hidden from UI)
- [x] Face ID / Touch ID silent auto-trigger
- [x] Production indexes (40+ indexes for 100k+ users)
- [x] Ghost data purged (0 ghost posts, 0 ghost profiles)
- [x] Rate limiter production (500 req/min/IP)
- [x] TTL indexes for auto-cleanup (logs 30d, access 90d)
- [x] Empty states for new users (feed, inbox, reels)
- [x] Email: contact@kiltikonet.fr everywhere

## Architecture
- React 19 + Tailwind + motion/react
- FastAPI + MongoDB (motor async)
- Stripe Checkout (live keys)
- Nominatim reverse geocoding
- Native analytics (no 3rd party)
- PWA with splash video

## Credentials
- Admin: cultureconnectorg@gmail.com / code 000000
