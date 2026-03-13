# Kiltikonet.fr — Hub Central Culture Connect 2026

## Description
Plateforme evenementielle complete pour Culture Connect 2026 (22 Mai 2026, Parc de La Savane, Fort-de-France, Martinique).
Entite legale: Factory Maker Studio (EURL) / CVLN Group.
Objectif: 40 000 FREK-IDs comme preuve de marche pour le Seed Round CVLN Group.

## Architecture
- **Frontend**: React 19 (PWA) + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + MongoDB (primary) + Baserow (mirror table 865847)
- **Auth**: JWT HS256 + workspace passwords
- **Integrations**: Baserow, Stripe, Cloudinary, FREK API (frekcore.com), AWS SES, Resend (legacy)
- **Palette**: #0C0818 (fond), #3B0764 (violet), #6B21A8 (violet clair), #C9A84C (or)

## FREK Integration
- Base URL: https://frekcore.com/api/v1
- Client ID: kiltikonet-cc2026
- Mode degrade: LOCAL-{uuid} si frekcore.com indisponible
- Retry queue async + reconciliation automatique

## Badges — 14 Types
Format: CC26-{TYPE}-{CODE5}
Types: ART, INT, STF, BNV, PRS, VIP, OFF, SPO, EXP-B, EXP-S, EXP-G, EXP-P, EXP-D, EXP-VIP
NFC: VIP, OFF, SPO, EXP-G, EXP-P, EXP-D, EXP-VIP

## Zones d'Acces
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

---

## Complete (13/03/2026)

### Phase 0-4: Badge + FREK + Jetons + SES + Frontend
- Backend: Services (frek_client, ses_service, baserow_service) + Routes (badges, jetons)
- 14 types de badges avec format CC26-TYPE-CODE5
- FREK API client avec mode degrade (LOCAL-{uuid})
- Matrice d'acces 7 zones
- 4 packs Stripe jetons
- 7 templates email SES (palette #0C0818/#3B0764/#C9A84C)
- Baserow mirror (table 865847)
- Frontend: BadgeInscription, BadgeActivation, JetonsPage
- Testing: 25/25 tests passes (100%)

### Precedemment complete
- PWA avec interface mobile
- Dashboard admin avec Mode Terrain
- Smart Engine Dashboard
- Workspaces (Laurent, Gwen, Alirio, Wudy, Fabrice, Kaige, Twina)
- SharedDataContext (synchronisation temps reel)
- CMS Admin + Visual Editor
- Pro Space (LinkedIn Culturel)
- Stripe integration (accreditations + partenariats)
- Badge PDF generation + email

---

## Taches restantes

### P1 - Phase 5: Dashboard FREK + Tests integration
- Widget stats FREK sur dashboard admin
- Integration end-to-end badge -> jetons -> scan

### P2 - Ameliorations
- Batch emails SES (rappels J-15, J-1, Jour J, Merci J+1)
- NFC scan integration
- Mode terrain QR scanner avec verification zone
- Reconciliation FREK automatique (cron)
- Dashboard analytics Jetons (graphiques Recharts)

### P3 - Technique
- Refactorisation server.py (7800+ lignes -> modules)
- Vue 3D admin (bloquee: React 19 + Three.js)
- Visual Editor iframe
- Migration vers SES production (sortie sandbox)

## Credentials
- Admin: CC2026admin
- Workspaces: LC2026, Twina2026, Gwen2026, Kaige2026, Alirio2026, Wudy2026, Fabrice2026, DataCC2026
- FREK Client: kiltikonet-cc2026
- Baserow Token: BjKPCSpcpif72OtZtsmMFUbZysqlNGiK (table 865847)
