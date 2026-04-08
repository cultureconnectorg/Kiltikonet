# PRD — Kiltikonet CC2026

## Vision
Plateforme événementielle culturelle souveraine pour Culture Connect 2026, Martinique. Full-stack React 19 + FastAPI + MongoDB.

## Architecture
- `/pro` → OrbitalMenu Omega (7 modules + logo central animé) — session cookie 30j
- `/admin/core` → Ancien Espace Pro (admin/founder uniquement)
- `/admin/*` → Admin dashboards (accreditation, finance, CMS, analytics)
- `/espace-pro/connexion` → ProSpaceLogin (5 méthodes : Google, GitHub, FREK-ID, Face ID/Touch ID, Magic Link)

## Itérations complétées

### ITER.59 — Câblage et médias (100%)
- 34 boutons câblés avec Object Storage et APIs réelles
- Webhook Stripe, synchro NFC Baserow, export CSV Twina
- Splash Screen vidéo, sons de notification
- Tests : iteration_82, iteration_83

### ITER.60 — Finalisation (100%)
- Phase 0 : Onboarding complet, sessions persistantes 30j (httpOnly, Secure, SameSite=strict)
- Phase 1 : WebAuthn (Face ID / Touch ID) — backend + frontend
- Phase 2 : 4 templates transactionnels Brevo
- Phase 3 : Animation logo central, swipe navigation, micro dictée, caméra BuilderView, PWA prompt, manifest
- Phase 4 : Kilti-Health Dashboard, nettoyage console.log, rate limiter, ENVIRONMENT=production
- Phase 5 : Test global (iteration_85 : 100%), ITER60_SUMMARY.md
- Tests : iteration_84, iteration_85

## Backlog — ITER.61

### P0
- Endpoint eclair dans useFeed.js (débiter 1 KT)

### P1
- WebAuthn login : remplacer prompt() par modal UI
- Affiner transition double-tap → FeedView

### P2
- Refactoring server.py (9766 lignes → routeurs séparés)
- Rate limiter distribué (Redis)
- AWS SES sortie sandbox

### P3
- PWA tests terrain (scan staff)
- Export PDF badges batch Twina
- Tests WebAuthn sur appareils physiques

## Intégrations tierces
- Stripe (Paiements) — clé utilisateur
- Brevo (Emails) — clé utilisateur
- Object Storage (Uploads) — Emergent LLM Key
- Claude Sonnet (CVL Brain) — Emergent LLM Key

## Credentials de test
- Bypass Admin : cultureconnectorg@gmail.com (code 000000)
- Espace Coleen : password Coleen2026
