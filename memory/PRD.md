# PRD — Kiltikonet CC2026

## Vision
Plateforme evenementielle culturelle souveraine pour Culture Connect 2026, Martinique.

## Implemented (2026-04-14)

### Stripe Fix — Double /api/api/
- Fixed 8 files, tested 16/16 PASS

### UX Clarifications
- PricingPage: Visiteur = "Pre-inscription gratuite — Marche Culturel uniquement" + exclusions en rouge
- FREK masque partout (pages publiques + Espace Pro + OrbitalMenu header) — autorite silencieuse
- Email: contact@kiltikonet.fr partout

### FAQ System
- Backend: GET /api/faq, POST/PUT/DELETE /api/admin/faq
- Frontend: /faq page avec recherche, filtres, accordeon. 7 FAQ seedees.

### Support Tickets
- Backend: POST /api/support/tickets, GET /api/admin/support/tickets
- Frontend: /support page formulaire complet, confirmation avec ref TK-XXXX

### Tutoriel Premiere Connexion
- ProTutorial.jsx: 8 etapes tooltips animes. Affiche 1 seule fois (localStorage).

### Builder → Feed Fix
- Fallback: publie le post meme si pas de registration

### OrbitalMenu Fix
- Logo centre sur Desktop (lg:pr-[280px] au lieu de justify-start)
- Header: "Profil" au lieu de "FREK-ID: XXX"

### InboxView Empty State
- Animation elegante avec icone, texte explicatif et bouton "Nouvelle conversation"

### Photo de Profil
- Code complet: preview locale (URL.createObjectURL) + upload POST /api/user/avatar
- Endpoint protege par auth, sauvegarde dans registrations

## Key Endpoints
- POST /api/create-checkout-session
- GET /api/faq, POST /api/admin/faq
- POST /api/support/tickets, GET /api/admin/support/tickets
- POST /api/user/avatar
- POST /api/builder/publish

## Backlog
- P1: Admin panel FAQ + Tickets (valide par user, a faire apres)
- P2: Shop visuels packs, ShopView/AgendaView responsives
- P3: Geolocalisation (Leaflet.js)
- P4: i18n 8 langues, Smart Engine & Analytics

## Credentials
- Admin: cultureconnectorg@gmail.com / code 000000
