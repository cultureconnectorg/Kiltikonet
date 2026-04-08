# PRD — Kiltikonet CC2026

## Vision
Plateforme événementielle culturelle souveraine pour Culture Connect 2026, Martinique. Full-stack React 19 + FastAPI + MongoDB.

## Architecture
- `/pro` → ProSplashWrapper (vidéo splash → login/OrbitalMenu Omega)
- `/admin/core` → Ancien Espace Pro (admin/founder)
- Vitrine publique → IntroSequence → Landing Page

## Itérations complétées

### ITER.59 — Câblage et médias (100%)
### ITER.60 — Finalisation (100%)
### ITER.61 — Responsive + Admin + Push (100%)

### Session Courante — 6 Correctifs (100%)
Date: 2026-04-08

1. **CORRECTIF 1 — Splash Screen** : Vidéo MOV convertie en MP4/WebM, placée dans `/public/videos/`. SplashScreen.jsx réécrit avec fallback logo animé (scale 1.0→1.03→1.0 + glow gold). "OMEGA PROTOCOL..." supprimé. ProSplashWrapper dans App.js.
2. **CORRECTIF 2 — Terminal Mobile** : Brain sidebar hidden par défaut sur mobile (<768px). Toggle overlay plein écran AnimatePresence slide depuis la droite. Éditeur Monaco plein écran. Preview séparé par toggle.
3. **CORRECTIF 3 — CVL Brain Desktop** : Sidebar gauche 280px fixe (min/max-width). "1 JCC PAR REQUETE" en gold. Conversation flex:1 min-w-0 overflow-hidden.
4. **CORRECTIF 4 — Inbox/DMs** : Bulles reçues rgba(255,255,255,0.05) + border 0.5px, bulles envoyées #f2ca50 noir. Timestamps 10px visibles. Double tick gold "Lu". Badge notification gold pulsant sur icône INBOX (OrbitalMenu). Polling 5s avec son de notification.
5. **CORRECTIF 5 — Photo de profil** : Avatar cliquable 80px (initiales gold ou photo). File picker image/*. Preview + confirmation modal. Upload POST /api/user/avatar (Object Storage). Propagation avatar_url en DB.
6. **CORRECTIF 6 — Splash depuis vitrine** : ProSplashWrapper reset splashDone via useEffect sur location.pathname.

**Son de notification** : WAV converti en MP3/OGG dans `/public/sounds/`. useNotificationSound.js pointé vers nouveaux fichiers. Intégré dans InboxView (nouveau DM) et FeedView (éclair).

## Backlog

### P1
- Tests responsive visuels 4 breakpoints
- Refactoring server.py (>9700 lignes)

### P2
- Tests E2E 5 parcours
- Rate limiter Redis
- Fix yarn build (React 19 / CRA incompatibilité)

### P3
- AWS SES sortie sandbox
- Tests WebAuthn appareils physiques
- PWA tests terrain
- Export PDF badges Twina

## Intégrations tierces
- Stripe (MODE LIVE)
- Brevo (Emails)
- Object Storage (Uploads)
- Claude Sonnet (CVL Brain)
- pywebpush (Push Notifications VAPID)

## Credentials
- Bypass Admin : cultureconnectorg@gmail.com (code 000000)
- Espace Coleen : Coleen2026

## Test Reports
- iteration_84.json → 100%
- iteration_85.json → 100%
- iteration_86.json → 100%
- iteration_87.json → 100% (6 correctifs session courante)
