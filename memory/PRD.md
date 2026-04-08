# PRD — Kiltikonet CC2026

## Vision
Plateforme événementielle culturelle souveraine pour Culture Connect 2026, Martinique. Full-stack React 19 + FastAPI + MongoDB.

## Architecture
- `/pro` → SplashScreen (2s) → ProProtectedRoute → OrbitalMenu Omega (7 modules + logo central animé) — session cookie 30j
- `/admin/core` → Ancien Espace Pro (admin/founder uniquement)
- `/admin/*` → Admin dashboards
- `/espace-pro/connexion` → ProSpaceLogin (5 méthodes auth : Google, GitHub, FREK-ID, Face ID/Touch ID, Magic Link)

## Itérations complétées

### ITER.59 — Câblage et médias (100%)
- 34 boutons câblés avec Object Storage et APIs réelles
- Webhook Stripe, synchro NFC Baserow, export CSV Twina
- Splash Screen vidéo, sons de notification

### ITER.60 — Finalisation (100%)
- Onboarding complet, sessions persistantes 30j
- WebAuthn (Face ID / Touch ID) backend + frontend
- 4 templates transactionnels Brevo
- Animation logo central, swipe navigation, micro dictée, caméra BuilderView, PWA prompt
- Kilti-Health Dashboard, nettoyage production

### ITER.61 — Responsive + Admin + Push (100%)
- P0 : Éclair KT (débit/crédit 1 KT + audit + push auto) + WebAuthn modal UI (remplace prompt())
- P1 : Responsive 3 breakpoints (OrbitalMenu panel desktop, BrainChat split, FeedView grille+sidebar, InboxView Slack-style, WalletView côte à côte)
- P2 : Notifications push Web Push API (pywebpush, VAPID, event-driven, preferences par type, broadcast admin)
- P3 : Admin CC2026 (dashboard stats, gestion utilisateurs CRUD+RGPD, modération feed, broadcast email/push)

### Correctifs Session Courante (En cours)
- **CORRECTIF 1 (DONE)** : SplashScreen réécrit — logo animé (scale 1.0→1.03→1.0, glow gold), fond #0a0a0b, zéro texte, durée 2s. "OMEGA PROTOCOL..." supprimé. ProSplashWrapper intégré dans App.js avec reset splashDone sur chaque navigation /pro.

## Backlog — 5 Correctifs Restants

### P0 (À faire immédiatement)
- **CORRECTIF 2** : Terminal mobile — Brain sidebar cachée, toggle overlay AnimatePresence, Monaco plein écran
- **CORRECTIF 3** : CVL Brain desktop — sidebar 280px fixe, texte tronqué 2 lignes, zone conversation flex:1
- **CORRECTIF 4** : Inbox/DMs — bulles stylisées (reçu: blanc 5%, envoyé: gold), timestamps, indicateur "Lu", badge notification animé, polling 5s
- **CORRECTIF 5** : Photo de profil — avatar cliquable 80px, file picker, preview, upload Object Storage POST /api/user/avatar, propagation partout
- **CORRECTIF 6** : Splash depuis vitrine — déjà inclus dans CORRECTIF 1 (ProSplashWrapper + useEffect reset)

### P1
- Tests responsive visuels 4 breakpoints
- Refactoring server.py

### P2
- Tests E2E 5 parcours
- Rate limiter Redis

### P3
- AWS SES sortie sandbox
- Tests WebAuthn appareils physiques
- PWA tests terrain
- Export PDF badges Twina

## Intégrations tierces
- Stripe (Paiements) — clé utilisateur (MODE LIVE)
- Brevo (Emails) — clé utilisateur
- Object Storage (Uploads) — Emergent LLM Key
- Claude Sonnet (CVL Brain) — Emergent LLM Key
- pywebpush (Push Notifications) — VAPID keys générées

## Credentials de test
- Bypass Admin : cultureconnectorg@gmail.com (code 000000)
- Espace Coleen : password Coleen2026
