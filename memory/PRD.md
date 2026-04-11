# PRD — Kiltikonet CC2026

## Vision
Plateforme evenementielle culturelle souveraine pour Culture Connect 2026, Martinique. Full-stack React 19 + FastAPI + MongoDB.

## Architecture
- Frontend: React 19, Tailwind CSS, motion/react (Framer Motion)
- Backend: FastAPI, MongoDB (motor)
- Auth: JWT local, FREK-ID OTP, Google OAuth, GitHub OAuth, WebAuthn
- PWA: Service Worker, Push Notifications, Offline support

## Implemented Features

### Auth Sas /pro (DONE - 2026-04-11)
- ProProtectedRoute inline: affiche ProSpaceLogin si non connecte
- Methodes: Google OAuth, GitHub OAuth, FREK-ID OTP, Face ID/Touch ID, Email magic link
- Registration avec generation FREK-ID automatique
- Bypass admin: cultureconnectorg@gmail.com + code 000000
- Flow: SplashScreen → Auth check → ProSpaceLogin ou ProApp

### Builder (DONE - 2026-04-11)
- Creation de projets avec titre/description
- Import media (video, audio, image) avec upload
- Camera integrée (enregistrement + preview)
- Outils: Audio, Subtitles, Text overlay, Effects, Crop, Camera
- Auto-save avec debounce
- Certification FREK-ID (soumission au Workshop)
- Publication vers 3 canaux: Feed Public, Espace Pro, Shop + Jeton CC
- **FIX CRITIQUE**: Publication ecrit maintenant dans `pro_posts` (pas `feed_posts`)
- Redirect automatique vers le Feed apres publication

### Feed (DONE - 2026-04-11)
- FeedView lit depuis `/api/pro/feed` (collection `pro_posts`)
- Auto-seed de 60+ posts ghost caribéens si vide
- Scroll snap vertical (style TikTok)
- CRUD complet: Create, Edit (PUT), Delete, Report
- Eclair system (debit/credit KT entre utilisateurs)
- Commentaires avec chargement dynamique
- Menu "More" contextuel (auteur vs autre)
- UserAvatar universel avec fallback initiale

### OrbitalMenu (DONE)
- Menu orbital immersif: WALLET, AGENDA, SHOP, FEED, BUILD, INBOX, COCKPIT
- Background animé avec particules
- Welcome modal pour premier login

### Mobile Navigation (FIX - 2026-04-11)
- MobileBottomNav: lien "Espace Pro" pointe vers `/pro` (corrige de `/espace-pro`)
- Header hamburger fonctionnel sur mobile (< lg breakpoint)

### Audit Global Correctifs (DONE - 2026-04-10)
1. UserAvatar universel (UserAvatar.jsx)
2. Feed CRUD complet (FeedView.jsx + omega.py)
3. credentials: 'include' 100% couvert
4. Mapping champs API corriges

### 6 Correctifs UI Initiaux (DONE)
- Splash screen video fonctionnel
- Terminal mobile
- Brain desktop
- Inbox UI
- Photo profil base
- Splash depuis vitrine

## Key DB Schema
- `pro_posts`: {id, author_id, author_name, author_title, author_image, author_email, author_frek_id, content, post_type, dimension, likes_count, eclairs_count, comments_count, is_ghost, is_reel, created_at}
- `builder_projects`: {project_id, email, frek_id, titre, description, media_url, status, canal, published, frek_certified, created_at, updated_at}
- `registrations`: {id, email, full_name, profile_type, frek_id, photo_url, avatar_url}

## Key API Endpoints
- POST /api/pro/request-access → Request login code
- POST /api/pro/verify-code → Verify code + set session
- POST /api/auth/frek → FREK-ID login initiation
- POST /api/auth/frek/verify → FREK-ID OTP verification
- GET /api/pro/feed → Paginated feed (pro_posts)
- POST /api/pro/feed/post → Create post directly
- POST /api/builder/projects → Create builder project
- POST /api/builder/publish → Publish project to feed/pro/shop
- PUT /api/feed/posts/{id} → Edit post (dual-collection lookup)
- DELETE /api/feed/posts/{id} → Delete post

## Backlog

### P1 (Next)
- Logo centre dans le noeud central OrbitalMenu (Desktop)
- InboxView: Etat vide elegant (0 conversations)
- SovereignProfileView: Preview locale photo de profil avant upload

### P2
- ShopView et AgendaView responsives (grille lg:grid-cols-2)

### P3
- Geolocalisation (Reverse geocoding au 1er post, affichage Leaflet.js)

### P4
- i18n: 8 langues (FR, KW, EN, ES, PT, NL, DE, AR avec support RTL) via react-i18next

### Known Issues
- GitHub OAuth necessite GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET (non configure)
- AWS SES en mode Sandbox (emails non fonctionnels)
- yarn build incompatible React 19 (contourne)
- server.py monolithique (>8600 lignes)

## Credentials
- Bypass Admin: cultureconnectorg@gmail.com (code 000000)
- Espace Coleen: Coleen2026
- FREK Admin: FREK-ADM-0001

## Test Reports
- /app/test_reports/iteration_87.json (6 correctifs UI)
- /app/test_reports/iteration_88.json (Builder + Auth + Feed - 100% pass)
