# Kiltikonet.fr — Hub Central Culture Connect 2026

## Description
Plateforme evenementielle pour Culture Connect 2026 (22 Mai 2026, Parc de La Savane, Fort-de-France, Martinique).
Factory Maker Studio (EURL) / CVLN Group. Objectif: 40 000 FREK-IDs.

## Architecture
- Frontend: React 19 PWA + Tailwind + Shadcn/UI
- Backend: FastAPI + MongoDB (primary) + Baserow (mirror 865847)
- Auth: JWT HS256 + workspace passwords + FORCE_VERIFY_BYPASS
- Integrations: Baserow, Stripe, Cloudinary, FREK API, AWS SES, Resend (fallback)
- Palette: Terra #A65D47, Gold #C9A84C, Dark #1A1510, Cream #F4F0E8, Warm #E8E0D0

## Badge Lifecycle (8 etapes)
1. Inscription (POST /api/badges/inscrire)
2. FREK-ID emis (frek_client.emit)
3. Email envoye (SES bienvenue + QR)
4. Activation (GET /api/activer-badge/{qr_token})
5. Impression (POST /api/badges/print-batch)
6. Remise J-0 (auto sur scan/debit ENTREE_GENERALE)
7. NFC actif (jetons + acces zones)
8. FREK Legacy (POST /api/badges/archive-legacy)

## Key Endpoints
- POST /api/badges/inscrire | GET /api/activer-badge/{qr_token} | POST /api/badges/scan
- POST /api/scan/debit (unified: zone + jetons)
- GET/POST /api/jetons/packs, /checkout, /wallet/{id}, /spend
- POST /api/pro/request-access (FORCE_VERIFY_BYPASS) | /api/pro/verify-code
- GET /api/v1/dashboard/cc2026/live (refresh 10s)
- GET /api/admin/reconcile | POST /api/admin/batch-email
- GET /api/badges/lifecycle/{badge_id} (8 etapes)

---

## Complete (13/03/2026)

### Iteration 3 — Correctif Pro + Palette + Lifecycle
- FORCE_VERIFY_BYPASS: cc@kiltikonet.fr auto-login sans code
- Palette beige/terracotta/noir: ZERO violet sur toutes les pages
- Cycle de vie 8 etapes complet + endpoints
- Bug fix: scan/debit UnboundLocalError
- Testing: 16/16 (iteration_30)

### Iteration 2 — Mode Terrain + Scan/Debit + Dashboard
- Mode Terrain adapte charte Kiltikonet
- POST /api/scan/debit, GET /api/v1/dashboard/cc2026/live
- GET /api/admin/reconcile, POST /api/admin/batch-email
- Testing: 18/18 (iteration_29)

### Iteration 1 — Badges + FREK + Jetons + SES
- 14 types badges, FREK fallback, 4 packs Stripe, 7 templates SES
- Frontend: BadgeInscription, BadgeActivation, JetonsPage
- Testing: 25/25 (iteration_28)

---

## P1 — Restant
- Migration SES production (sortie sandbox, DKIM/SPF/DMARC)
- NFC scan physique
- Dashboard analytics Jetons (Recharts connecte frekcore)

## P2
- Refactorisation server.py (~8200 lignes)
- Vue 3D (bloquee React 19/Three.js)
- Smart Engine → recommandation

## Credentials
- Admin bypass: cc@kiltikonet.fr / code 000000
- Admin password: CC2026admin
- Workspaces: LC2026, Twina2026, Gwen2026, Kaige2026, Alirio2026, Wudy2026, Fabrice2026, DataCC2026
