# Kiltikonet.fr — Hub Central Culture Connect 2026

## Description
Plateforme evenementielle complete pour Culture Connect 2026 (22 Mai 2026, Parc de La Savane, Fort-de-France, Martinique).
Entite legale: Factory Maker Studio (EURL) / CVLN Group.
Objectif: 40 000 FREK-IDs comme preuve de marche pour le Seed Round CVLN Group.

## Architecture
- **Frontend**: React 19 (PWA) + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + MongoDB (primary) + Baserow (mirror table 865847)
- **Auth**: JWT HS256 + workspace passwords + FORCE_VERIFY_BYPASS admin
- **Integrations**: Baserow, Stripe, Cloudinary, FREK API (frekcore.com), AWS SES, Resend (fallback)
- **Palette Terrain**: Terra #A65D47, Gold #C9A84C, Dark #1A1510, Cream #F4F0E8, Warm #E8E0D0
- **Palette Site**: #0C0818 (fond), #3B0764 (violet), #6B21A8, #C9A84C (or)

## FREK Integration
- Base URL: https://frekcore.com/api/v1
- Client ID: kiltikonet-cc2026
- Secret: pczBP49crCXSSSwSOShsXClzs9srhKe5S-xnraMPn-k
- Mode degrade: LOCAL-{uuid} si frekcore.com indisponible
- Retry queue async + reconciliation automatique

## Badges — 14 Types
Format: CC26-{TYPE}-{CODE5}
Types: ART, INT, STF, BNV, PRS, VIP, OFF, SPO, EXP-B, EXP-S, EXP-G, EXP-P, EXP-D, EXP-VIP
NFC: VIP, OFF, SPO, EXP-G, EXP-P, EXP-D, EXP-VIP

## Zones d'Acces (7)
- ENTREE_GENERALE: tous
- SCENE_PRINCIPALE: ART, OFF, VIP, STF
- VIP_LOUNGE: VIP, OFF, SPO, EXP-VIP
- BACKSTAGE: ART, STF
- EXPOSANTS: EXP-*, STF
- PRESSE: PRS, OFF
- ATELIERS_PREMIUM: 5 jetons minimum

## Jetons CC
1 Jeton = 1.50EUR | Rachat marchand: 1.35EUR
Packs: Decouverte 10J/13.50EUR, Culture 25J/30EUR, Diaspora 50J/55EUR, VIP 100J/100EUR

## Emails SES (7 templates)
send_bienvenue, send_wallet_recharge, send_rappel_j15, send_rappel_j1, send_jour_j, send_merci_j1, send_admin_alert

## Key API Endpoints
- POST /api/badges/inscrire — Inscription badge + FREK emit + Baserow mirror + SES welcome
- GET /api/activer-badge/{qr_token} — Activation badge
- POST /api/badges/scan — Zone access check
- POST /api/scan/debit — Unified scan: zone validation + jeton debit (staff_entree: montant=0)
- GET/POST /api/jetons/packs, /checkout, /wallet/{badge_id}, /spend
- POST /api/pro/request-access — Pro access with FORCE_VERIFY_BYPASS + SES/Resend fallback
- POST /api/pro/verify-code — Code verification with admin bypass (000000)
- GET /api/v1/dashboard/cc2026/live — Live stats (auto-refresh 10s)
- GET /api/admin/reconcile — Force sync MongoDB ↔ Baserow + FREK reconcile
- POST /api/admin/batch-email — Batch emails (J-15, J-1, J-0, J+1) with dry_run option

---

## Complete (13/03/2026)

### Phase Mode Expert — Correctif Pro + Terrain + Scan/Debit + Dashboard Live
- FORCE_VERIFY_BYPASS pour email admin (cc@kiltikonet.fr, code=000000)
- Migration envoi code Pro vers SES avec fallback Resend + logs [AWS_SES_DEBUG]
- Mode Terrain adapte charte Kiltikonet (Terra/Gold/Dark/Cream/Warm)
- Sélecteur de zone (7 zones) + rôles staff (Entrée/Bar/VIP)
- POST /api/scan/debit: scan unifie zone + debit jetons
- GET /api/v1/dashboard/cc2026/live: stats temps reel (badges, jetons, scans, FREK)
- Widget progression 40K FREK-IDs sur Mode Terrain
- GET /api/admin/reconcile: sync Baserow + FREK
- POST /api/admin/batch-email: campagnes auto (4 templates, dry_run)
- Testing: 18/18 tests passes (100%)

### Phase 0-4 — Badge + FREK + Jetons + SES + Frontend
- Backend services (frek_client, ses_service, baserow_service) + routes (badges, jetons)
- 14 types badges CC26-TYPE-CODE5 + FREK fallback + Baserow mirror
- 4 packs Stripe jetons + wallet + transactions
- 7 templates email SES
- Frontend: BadgeInscription, BadgeActivation, JetonsPage
- Testing: 25/25 tests passes (100%)

### Precedemment complete
- PWA, Dashboard admin, Smart Engine, Workspaces (7), SharedDataContext, CMS, Pro Space, Stripe, Badges PDF

---

## Taches restantes

### P1
- Migration SES production (sortie sandbox AWS)
- Verification delivrabilite email DKIM/SPF/DMARC kiltikonet.fr
- Integration NFC scan physique

### P2
- Refactorisation server.py (~8100 lignes → modules)
- Vue 3D admin (bloquee React 19/Three.js)
- Visual Editor iframe
- Dashboard analytics Jetons (graphiques Recharts connectes frekcore)

### P3
- Smart Engine → moteur recommandation/matchmaking
- Mode terrain NFC < 300ms
- Rollover CC2027 jetons

## Credentials
- Admin bypass: cc@kiltikonet.fr / code 000000
- Admin password: CC2026admin
- Workspaces: LC2026, Twina2026, Gwen2026, Kaige2026, Alirio2026, Wudy2026, Fabrice2026, DataCC2026
- FREK: kiltikonet-cc2026
- Baserow: BjKPCSpcpif72OtZtsmMFUbZysqlNGiK (table 865847)
