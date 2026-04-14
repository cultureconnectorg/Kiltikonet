# CHANGELOG — Kiltikonet CC2026

## [1.0.0] — 2026-04-14 (LAUNCH)

### Infrastructure
- Import code source depuis ZIP GitHub (Kiltikonet-main)
- Preservation variables .env + reinitialisation indexes MongoDB
- Configuration Supervisor (frontend, backend, smart-engine, mongodb)
- PWA manifest (installable, splash video)

### Stripe Payments (P0)
- Fix double /api/api/ dans 8 fichiers frontend (PartnershipPage, RegistrationForm, PartnerConfirmation, ConfirmationScreen, PartnerManagement, ProSpaceDashboard, LandingPage, AdminDashboard)
- Verification : 16/16 tests backend PASS
- 4 types checkout : accreditation, partnership, ticket, jetons KT

### Feed & Content
- Refonte Feed Instagram (scroll cartes, avatars, actions like/comment/eclair)
- Mode Reels plein ecran (scroll-snap)
- Builder publish vers pro_posts avec images
- Fix fallback auteur si pas de registration
- Suppression ghost posts + ghost profiles (production cleanup)
- Empty state "Bienvenue dans le Feed" pour nouveaux utilisateurs

### Authentification
- Fix useAuth.js cookie fallback
- Face ID / Touch ID rendu silencieux (auto-trigger si email connu)
- Bouton WebAuthn retire de l'ecran de login
- Email sauve en localStorage pour biometrie automatique

### Permissions (Doctrine)
- buy_tokens, publish_content, support_creators ajoutes a tous les roles
- 5 roles : professional, creator, consumer, institutional, distributor

### UX & Design
- Clarification descriptions Tarifs (Visiteur = Marche uniquement + exclusions rouge)
- FREK masque sur toutes les pages (autorite silencieuse) — 15+ fichiers
- Email contact@kiltikonet.fr remplace cultureconnectorg@gmail.com
- Logo OrbitalMenu centre sur Desktop
- InboxView empty state anime
- Bouton "Site" discret dans OrbitalMenu (retour site public)
- "Espace Pro" retire du menu hamburger mobile
- Video splash verte restauree (1x par session)

### FAQ System
- Backend : GET /api/faq, POST/PUT/DELETE /api/admin/faq
- Frontend : /faq avec recherche, filtres categorie, accordeon
- 7 FAQ seedees par defaut au demarrage
- Admin : CRUD complet dans onglet Support du AdminDashboard

### Support Tickets
- Backend : POST /api/support/tickets, GET /api/admin/support/tickets
- Frontend : /support formulaire (4 categories)
- Confirmation avec reference TK-XXXXXXXX
- Admin : liste, filtres statut, stats, reponses directes, changement statut

### Tutoriel
- ProTutorial.jsx : 8 etapes tooltips animes
- Affiche 1 seule fois (localStorage kk_tutorial_done)
- Integre dans ProApp.jsx

### Geolocalisation (P3)
- Reverse geocoding Nominatim (GET /api/pro/feed/geo/reverse)
- Points geolocalises globe (GET /api/pro/feed/geo/points)
- Detection geoloc 1x au chargement Feed, cache localStorage
- Affichage MapPin + ville sous l'auteur (style Instagram)
- Globe3D : points dores dynamiques (refresh 30s)

### i18n (P4)
- react-i18next installe et configure
- 5 langues : FR, EN, ES, PT, KW (Creole)
- Selecteur dropdown 5 langues dans Header
- LanguageContext synchronise avec i18next + localStorage
- Traductions : navigation, pricing, tickets, FAQ, support, footer

### Analytics (P4)
- smartTracker.js : tracking natif zero dependance
- Events : page_view, page_exit, click, conversion, search, error
- Batch flush 10s via /api/analytics/batch
- Conversions Stripe tracees (ticket, partnership, accreditation)
- Session tracking, SPA route detection

### Production Readiness
- 75+ indexes MongoDB (compound, sparse, TTL)
- Rate limiter : 500 req/min/IP + exclusions completes
- TTL auto-cleanup : pro_access_logs (90j), workspace_logs (30j)
- production_cleanup.py : purge ghost data
- CORS : kiltikonet.fr + preview + production
- Health check : GET /api/health
- requirements.txt fige (142 packages)
- ShopView/AgendaView responsives
- 2 visuels exemples packs Shop
