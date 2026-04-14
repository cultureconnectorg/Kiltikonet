# PRD — Kiltikonet CC2026

## Vision
Plateforme evenementielle culturelle souveraine pour Culture Connect 2026, Martinique.

## Implemented (2026-04-14)

### Stripe Fix — Double /api/api/
- Root cause: Frontend files with `const API = '${BACKEND_URL}/api'` using `${API}/api/xxx` → 404
- Fixed 8 files, tested 16/16 PASS

### UX Clarifications
- PricingPage: Visiteur = "Pre-inscription gratuite — Marche Culturel uniquement" + exclusions en rouge
- FREK masque sur toutes pages publiques ET Espace Pro (autorite silencieuse)
- Email remplace: contact@kiltikonet.fr partout (ancien: cultureconnectorg@gmail.com)

### FAQ System (NEW)
- Backend: GET /api/faq (public), POST/PUT/DELETE /api/admin/faq (admin)
- Frontend: /faq page avec recherche, filtres par categorie, accordeon
- 7 FAQ par defaut seedees au demarrage
- Categories: general, jetons, technique, evenement

### Support Tickets (NEW)
- Backend: POST /api/support/tickets (public), GET /api/admin/support/tickets (admin)
- Frontend: /support page avec formulaire (nom, email, categorie, sujet, message)
- Categories: general, complaint, technical, billing
- Ecran de confirmation avec reference ticket TK-XXXX

### Tutoriel Premiere Connexion (NEW)
- ProTutorial.jsx: 8 etapes tooltips animees (Welcome, Feed, Builder, Wallet, Shop, Brain, Profile, Ready)
- Affiche 1 seule fois (localStorage kk_tutorial_done)
- Integre dans ProApp.jsx, remplace l'ancien welcome modal

### Builder → Feed Fix
- Fallback: publie le post meme si pas de registration (utilise email comme auteur)

## Key Endpoints
- POST /api/create-checkout-session (accreditation, partnership, ticket)
- GET /api/faq, POST /api/admin/faq
- POST /api/support/tickets, GET /api/admin/support/tickets
- GET /api/pro/feed, POST /api/pro/feed/post
- POST /api/builder/publish

## Architecture Note
- FREK = autorite silencieuse. Jamais affiche cote utilisateur.
- Convention URL: `const API = '${BACKEND_URL}/api'` (appels: `${API}/xxx`) vs `const API = BACKEND_URL` (appels: `${API}/api/xxx`)

## Backlog
- P1: Logo OrbitalMenu centre, InboxView empty state, Profile photo preview test e2e
- P2: ShopView/AgendaView responsives, Shop visuels packs
- P3: Geolocalisation (Leaflet.js)
- P4: i18n 8 langues, Smart Engine & Analytics

## Credentials
- Admin: cultureconnectorg@gmail.com / code 000000
