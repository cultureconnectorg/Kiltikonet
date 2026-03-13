# Kiltikonet.fr — Hub Central Culture Connect 2026

## Description
Plateforme evenementielle Culture Connect 2026 (22 Mai 2026, Parc de La Savane, Fort-de-France).
Factory Maker Studio (EURL) / CVLN Group. Objectif: 40 000 FREK-IDs.

## Architecture
- Frontend: React 19 PWA + Tailwind + Shadcn/UI + Recharts
- Backend: FastAPI + MongoDB (primary) + Baserow (mirror 865847)
- Auth: JWT HS256 + workspace passwords + FORCE_VERIFY_BYPASS
- Integrations: Baserow, Stripe, Cloudinary, FREK API, AWS SES, Resend
- Palette: Terra #A65D47, Gold #C9A84C, Dark #1A1510, Cream #F4F0E8, Warm #E8E0D0

## Composants Operationnels

### Composant 1 — Email Ultra Premium (8 templates + SES Domain)
bienvenue, wallet_recharge, rappel_j30, rappel_j15, rappel_j7, rappel_j1, jour_j, merci_j1
Endpoints: /api/email/send, /campaign, /stats, /templates, /qr-generate
SES Domain: /api/ses/domain/status, /api/ses/domain/verify, /api/ses/domain/enable-dkim, /api/ses/production-request

### Composant 2 — Badge Intelligent (15 types incl. VIS, 8 etapes lifecycle)
POST /api/badges/inscrire | GET /api/activer-badge/{qr_token} | POST /api/badges/scan
GET /api/badges/lifecycle/{id} | POST /api/badges/print-batch | POST /api/badges/archive-legacy
Types: VIS (Visiteur, 0€), ART, INT, STF, BNV, PRS, VIP, OFF, SPO, EXP-B/S/G/P/D/VIP

### Composant 3 — Jetons Digitaux (4 packs Stripe + Analytics)
POST /api/jetons/checkout | GET /api/jetons/wallet/{id} | POST /api/jetons/spend
POST /api/scan/debit | POST /api/frek/nfc/tap | POST /api/jetons/remboursement
Analytics: GET /api/analytics/jetons/overview (Recharts connected)

### Composant 4 — Evenement J-0 (Mode Terrain + Offline)
GET /api/v1/dashboard/cc2026/live | GET /api/stats/heatmap | GET /api/stats/export (CSV)
Mode Terrain PWA avec mode offline (Service Worker scan queue + IndexedDB + sync differee)

## Badge Lifecycle (8 etapes)
1-Inscription | 2-FREK emit | 3-Email SES | 4-Activation QR
5-Impression batch | 6-Remise J-0 (auto scan) | 7-NFC actif | 8-FREK Legacy

## Pages Frontend
- / : Landing Page (sans line-up)
- /programme : Programme officiel (sans line-up)
- /concert : Page Concert dedicee avec line-up artistes
- /tarifs : 4 cartes (Visiteur 0€, Emergent 50€, Professionnel 150€, Institutionnel 300€)
- /badge-inscription : Formulaire inscription badge (pre-selectionne Visiteur si venant de /tarifs)
- /admin/analytics/jetons : Dashboard Jetons avec graphiques Recharts + FREK core status
- /admin/terrain : Mode Terrain avec mode offline

---

## Tests passes: 98/98 (100%)
- Iterations 28-31: 81/81 (badges, FREK, jetons, SES, palette, lifecycle)
- Iteration 32: 17/17 (Visiteur, Concert page, line-up removal, analytics, SES domain)

---

## P1 — Restant
- DNS records a configurer pour SES production (DKIM/SPF/DMARC kiltikonet.fr)
- Mode offline scan: tester en conditions reelles (couper reseau)
- Dashboard analytics Jetons: ajouter export PDF des graphiques

## P2
- Refactorisation server.py (~8500 lignes)
- Vue 3D admin (bloquee React 19/Three.js)
- Smart Engine recommandation
- Mode offline scan staff: service worker + sync differee

## Credentials
- Admin bypass: cc@kiltikonet.fr / code 000000
- Admin: CC2026admin
- Workspaces: LC2026, Twina2026, Gwen2026, Kaige2026, Alirio2026, Wudy2026, Fabrice2026, DataCC2026
