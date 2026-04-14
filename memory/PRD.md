# PRD — Kiltikonet CC2026

## Vision
Plateforme evenementielle culturelle souveraine pour Culture Connect 2026, Martinique.

## Implemented

### P0 — Stripe Fix (8 fichiers, 16/16 PASS)
### P1 — UX: Visiteur "Marche uniquement", FREK masque, email contact@kiltikonet.fr
### P1 — FAQ System (/faq, /api/faq, 7 seedees, admin CRUD)
### P1 — Support Tickets (/support, /api/support/tickets, ref TK-XXXX)
### P1 — Tutoriel premiere connexion (8 etapes tooltips)
### P1 — Builder → Feed fix, OrbitalMenu centre, InboxView empty state
### P1 — Admin Support Panel (onglet dans AdminDashboard: FAQ CRUD + Tickets)
### P2 — ShopView/AgendaView responsives + 2 visuels exemples

### P3 — Geolocalisation (2026-04-14)
- Backend: reverse geocoding via Nominatim (GET /api/pro/feed/geo/reverse)
- Backend: points geolocalises pour le globe (GET /api/pro/feed/geo/points)
- Frontend Feed: detection geoloc au 1er post, cache localStorage, envoi lat/lng/name avec chaque post
- Frontend Feed: affichage MapPin + location_name sous le nom d'auteur (style Instagram)
- Globe3D: charge dynamiquement les posts geolocalises et les affiche comme points dores

### P4 — i18n 5 langues (2026-04-14)
- Langues: FR, EN, ES, PT, KW (Creole martiniquais)
- react-i18next installe et configure (i18n.js)
- LanguageContext synchronise avec i18next + localStorage persistance
- Header: dropdown 5 langues (remplace toggle FR/EN)
- Traductions: navigation, common, pricing, tickets, FAQ, support, footer

### P4 — Smart Analytics Tracker (2026-04-14)
- smartTracker.js: tracking natif zero dependance
- Events: page_view, page_exit (time + scroll depth), click (data-testid), conversion
- Batch flush toutes les 10s via /api/analytics/batch
- Session tracking, SPA route detection, privacy-first (IP hashed server-side)
- Conversions Stripe tracees: ticket_checkout, partnership_checkout, accreditation_checkout
- Backend: /api/analytics/site-stats (overview, top_pages, devices, timeline, unique visitors)

## Key Endpoints
- POST /api/create-checkout-session
- GET /api/faq, POST/PUT/DELETE /api/admin/faq
- POST /api/support/tickets, GET /api/admin/support/tickets
- GET /api/pro/feed/geo/reverse, GET /api/pro/feed/geo/points
- POST /api/analytics/batch, GET /api/analytics/site-stats
- POST /api/user/avatar, POST /api/builder/publish

## Backlog (tout livre)
Aucune tache restante dans le plan initial.

## Credentials
- Admin: cultureconnectorg@gmail.com / code 000000
