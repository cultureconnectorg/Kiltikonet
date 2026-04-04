# CC2026 — KILTIKONET Platform — PRD

## Vision
Fintech culturelle du Sud Global. Plateforme sociale connectant l'Afrique, l'Amerique Latine et la Diaspora par la culture.

## Architecture
- **Frontend**: React 19, Tailwind CSS, PWA (Service Worker v5.0)
- **Backend**: FastAPI, MongoDB, JWT via httpOnly cookies
- **Email**: Brevo HTTP API (migration depuis AWS SES/Resend)
- **Auth**: Magic Link (15min token) + Google OAuth (Emergent-managed) + Admin password
- **Fintech**: Stripe Checkout, Wallet Universel (KT), FREK-ID

## Design System
- Fond: `#0a0a0b` (OLED Black), Or blanc: `#E8D5A0`, Police: DM Sans

---

## Implemented

### Problème 1 — Brevo SMTP + Magic Link (DONE - 04/04/2026)
- Migration email: AWS SES/Resend → Brevo HTTP API (`api.brevo.com/v3/smtp/email`)
- Magic Link remplace OTP: UUID token valide 15min, usage unique, stocké dans `magic_links` collection
- Route backend: `GET /api/auth/magic/{token}` → valide token → crée session cookie → retourne profil
- Email Brevo: template premium avec bouton "Acceder a mon Espace Pro"
- Bypass admin conservé pour `cultureconnectorg@gmail.com`

### Problème 2 — Google OAuth (DONE - 04/04/2026)
- Emergent-managed Google Auth (`auth.emergentagent.com`)
- Backend: `POST /api/auth/google/session` échange session_id contre données utilisateur
- FUSION automatique: si email Google = email existant → même FREK-ID, toutes données conservées
- Champ `auth_methods: ["magic_link"|"google"]` array multi-méthodes
- Frontend: bouton Google SVG standard + séparateur "ou"

### Problème 3 — Accès admin urgence (DONE - 04/04/2026)
- `GET /api/admin/emergency-access?secret=EMERGENCY_SECRET`
- Désactivé automatiquement si `ENVIRONMENT=production` (retourne 404)

### Problème 4 — Invitations équipe (DONE - 04/04/2026)
- `POST /api/admin/invite` → génère token 48h + envoie email Brevo
- `GET /api/invite/validate/{token}` → valide token → crée session
- Frontend: AdminTeamPanel.jsx (champ email/nom/rôle, bouton copier lien, liste status)
- 4 rôles: staff, workspace, viewer, admin

### Problème 5 — PWA Install Prompt (DONE - 04/04/2026)
- PWAInstallPrompt.jsx refait: bottom sheet premium, delay 30s
- iOS: instructions manuelles (partage → écran d'accueil)
- Android/Desktop: beforeinstallprompt + prompt natif Chrome
- Track PWA installs dans analytics_events

### Problème 6 — Kilti-Health Dashboard (DONE - 04/04/2026)
- `GET /api/admin/health-stats` : 13 métriques en temps réel
- AdminHealthPanel.jsx: grid 4 colonnes, refresh 30s, seuils couleur
- Métriques: latence, taux erreur, taille DB, uptime, emails 24h, Brevo status, etc.
- Middleware `track_latency_middleware` pour mesure latence/erreurs

### GO-LIVE Phases 1-5 (DONE - 02/04/2026)
- Phase 1: Audit MongoDB (7509 docs, 4233 test identifiés)
- Phase 2: Nettoyage sélectif (6326 docs supprimés, backup pré-nettoyage)
- Phase 3: Sécurisation routes admin (require_admin/require_workspace)
- Phase 4: Mode Production (ENVIRONMENT flag, rate limiting, dev routes disabled)
- Phase 5: Vitrine publique (compteurs 0→"--", SW v5.0 cache invalidation)

### Auth Migration (DONE - 02/04/2026)
- localStorage → httpOnly cookies (kk_session)
- CORS credentials=true, origines explicites

---

## Tests
- iteration_63: Backend 100%, Frontend 100% (6 problèmes urgents)
- iteration_62: Backend 100%, Frontend 100% (GO-LIVE Phases)
- iteration_61: Backend 100%, Frontend 100% (Auth Cookie Migration)

## Key Collections
- `magic_links`: {token, email, expires_at, used}
- `invitations`: {token, email, nom, role, expires_at, used}
- `registrations`: {email, full_name, auth_methods, google_id, frek_id}
- `email_logs`: {to, subject, provider, status, message_id, timestamp}

## Backlog
- (P0) Élévation visuelle globale (Design System, page /welcome, fonts)
- (P1) CVL BRAIN Espace Pro (10 modules: mémoire, web search, upload, docs, terminal, agents, image, audio, vidéo, browse)
- (P2) Mgraph D3.js interactif
- (P3) Vue 3D SmartEngine
- (P3) Vérification domaine IONOS

## Credentials
- Admin: CC2026admin (via /api/admin/verify)
- Workspace Coleen: Coleen2026
- Brevo API: xkeysib-ade11179... (dans .env)
- Emergency: KK26-EM-9f3a7b2c4d8e1f6a (dev only)
