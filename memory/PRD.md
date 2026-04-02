# CC2026 — KILTIKONET Platform — PRD

## Vision
Fintech culturelle du Sud Global. Plateforme sociale connectant l'Afrique, l'Amerique Latine et la Diaspora par la culture. Wallet Universel Kilti-Tokens, Stripe omnicanal.

## Architecture
- **Frontend**: React 19, Tailwind CSS, PWA (Service Worker v5.0)
- **Backend**: FastAPI, MongoDB, JWT via httpOnly cookies
- **Fintech**: Stripe Checkout omnicanal, Wallet Universel (KT), FREK-ID terminal
- **Auth**: httpOnly cookies (kk_session), CORS credentials=true, origines explicites

## Design System
- Fond: `#0a0a0b` (OLED Black), Or blanc: `#E8D5A0`, Police: DM Sans

## Implemented

### GO-LIVE Phase 1 — Audit MongoDB (DONE - 02/04/2026)
- Script audit `/app/backend/scripts/audit_mongodb.py` : scan de 57 collections
- Rapport détaillé avec classification par collection (test/réel/ambigu)
- Identification de 4233 documents test sur 7509 total
- Cartes culturelles : 18 cartes légitimes identifiées, 1 doublon détecté

### GO-LIVE Phase 2 — Nettoyage sélectif (DONE - 02/04/2026)
- Backup complet : `/app/backend/scripts/mongodb_backup_pre_phase2/`
- Script nettoyage `/app/backend/scripts/cleanup_phase2.py`
- 6326 documents supprimés : ghost_profiles_v2 (4000), pro_posts (2052), cc_badges (71/77), registrations (21/23), etc.
- Cartes culturelles : 18 gardées (17 uniques + 1 Culture Connect 2026), 1 doublon supprimé
- Données Stripe réelles préservées (14 payment_transactions)
- Base finale : ~1200 documents réels

### GO-LIVE Phase 3 — Sécurisation routes admin (DONE - 02/04/2026)
- Helpers `require_admin()` et `require_workspace()` créés (server.py L152-175)
- Routes admin protégées (403 sans cookie) : /admin/notifications, /admin/accreditation, /admin/reconcile, /admin/batch-email, /smart-engine/purge, /smart-engine/index-contacts, /smart-engine/check-alerts, /smart-engine/cron/check, /analytics/dashboard, /partners/admin, /partners/manual
- Routes workspace protégées : /workspace/logs, /workspace/sessions, /workspace/update-password, /smart-engine/profiles, /smart-engine/stats, /smart-engine/alerts/rules, /smart-engine/insights, /analytics/site, /analytics/behavior
- Ghost seed endpoint protégé : /ghost/seed (admin only)
- Login routes (verify/login) restent ouvertes

### GO-LIVE Phase 4 — Mode Production (DONE - 02/04/2026)
- Flag `ENVIRONMENT=development|production` ajouté (.env + server.py)
- Route `/api/pro/dev/get-code` retourne 404 en production
- Route `/api/admin/notifications/test` désactivée en production
- Rate limiting global : 120 req/IP/60s (middleware, activé en production uniquement)
- Tracking anonyme `/api/analytics/batch` reste ouvert (pas d'auth)

### GO-LIVE Phase 5 — Vitrine publique (DONE - 02/04/2026)
- Compteurs à 0 affichent '--' : AdminDashboard, NetworkPage
- Service Worker v5.0 : cache invalidation agressive, notification SW_UPDATED aux clients

### Auth Migration: localStorage → httpOnly Cookies (DONE - 02/04/2026)
- Backend: JWT signed session token (SESSION_SECRET), set_cookie httpOnly/secure/samesite=lax/max_age=7j
- 3 login endpoints set cookie: /api/admin/verify, /api/workspace/login, /api/pro/verify-code
- CORS: explicit origins, credentials=true
- Frontend: ZERO localStorage for auth, axios withCredentials=true

### PWA Configuration (DONE - 02/04/2026)
- manifest.json, theme-color, apple-touch-icon, Service Worker v5.0
- Offline scan queue (IndexedDB), background sync, push notifications

### Code Quality (DONE - 02/04/2026)
- 5 rounds d'audit : console.log cleanup, index-as-key fixes, AdminDashboard split (-40%), useMemo optimizations
- useRealtime.js: recursive log() fix (stack overflow)
- random → secrets dans modules fintech

## Tests
- iteration_62: Backend 100%, Frontend 100% (GO-LIVE Phases 2-5)
- iteration_61: Backend 100%, Frontend 100% (Auth Cookie Migration)
- iteration_59-60: Backend 100%, Frontend 100% (Code Quality)
- iteration_58: Backend 100%, Frontend 100% (PWA)

## Backlog
- (P2) Mgraph D3.js interactif
- (P3) Vue 3D SmartEngine
- (P3) AWS SES sortie Sandbox (action manuelle utilisateur)
- (P3) Ajout d'images aux 18 cartes culturelles

## Credentials
- Admin: password CC2026admin (via /api/admin/verify)
- Workspace Coleen: password Coleen2026 (via /api/workspace/login)
- Pro: cultureconnectorg@gmail.com / code OTP bypass 000000
- Backup MongoDB pre-phase2: /app/backend/scripts/mongodb_backup_pre_phase2/
