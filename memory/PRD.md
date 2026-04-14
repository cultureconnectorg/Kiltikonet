# PRD — Kiltikonet CC2026

## Vision
Plateforme evenementielle culturelle souveraine pour Culture Connect 2026, Martinique.

## Implemented (2026-04-14)

### Stripe Fix — 8 fichiers, 16/16 PASS
### UX — Visiteur "Marche uniquement" + exclusions rouge, FREK masque partout, email contact@kiltikonet.fr
### FAQ System — /faq, /api/faq, 7 FAQ seedees, recherche + filtres
### Support Tickets — /support, /api/support/tickets, formulaire + ref TK-XXXX
### Tutoriel — ProTutorial 8 etapes tooltips
### Builder → Feed Fix — Fallback sans registration
### OrbitalMenu — Logo centre Desktop, header "Profil" au lieu de FREK-ID
### InboxView — Empty state anime avec CTA "Nouvelle conversation"
### Photo de Profil — Preview locale + upload /api/user/avatar
### Admin Support Panel — Onglet "Support" dans AdminDashboard avec:
  - Gestion FAQ: CRUD (ajouter, editer, supprimer, publier/depublier)
  - Gestion Tickets: liste, filtres par statut, stats, reponse directe, changement statut
### ShopView/AgendaView Responsives — Grid lg:grid-cols-4 shop, lg:grid-cols-2 agenda
### Shop Visuels Exemples — 2 packs (Culture, VIP) avec images Unsplash

## Key Endpoints
- POST /api/create-checkout-session
- GET /api/faq, POST/PUT/DELETE /api/admin/faq
- POST /api/support/tickets, GET /api/admin/support/tickets
- PUT /api/admin/support/tickets/{id}/status, POST /api/admin/support/tickets/{id}/reply
- POST /api/user/avatar
- POST /api/builder/publish

## Backlog
- P3: Geolocalisation (Leaflet.js)
- P4: i18n 8 langues, Smart Engine & Analytics

## Credentials
- Admin: cultureconnectorg@gmail.com / code 000000
