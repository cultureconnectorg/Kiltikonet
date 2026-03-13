# Kiltikonet.fr — Hub Central Culture Connect 2026

## Description
Plateforme evenementielle Culture Connect 2026 (22 Mai 2026, Parc de La Savane, Fort-de-France).
Factory Maker Studio (EURL) / CVLN Group. Objectif: 40 000 FREK-IDs.

## Architecture
- Frontend: React 19 PWA + Tailwind + Shadcn/UI
- Backend: FastAPI + MongoDB (primary) + Baserow (mirror 865847)
- Auth: JWT HS256 + workspace passwords + FORCE_VERIFY_BYPASS
- Integrations: Baserow, Stripe, Cloudinary, FREK API, AWS SES, Resend
- Palette: Terra #A65D47, Gold #C9A84C, Dark #1A1510, Cream #F4F0E8, Warm #E8E0D0

## 4 Composants — TOUS OPERATIONNELS

### Composant 1 — Email Ultra Premium (8 templates)
bienvenue, wallet_recharge, rappel_j30, rappel_j15, rappel_j7, rappel_j1, jour_j, merci_j1
Endpoints: /api/email/send, /campaign, /stats, /templates, /qr-generate

### Composant 2 — Badge Intelligent (14 types, 8 etapes lifecycle)
POST /api/badges/inscrire | GET /api/activer-badge/{qr_token} | POST /api/badges/scan
GET /api/badges/lifecycle/{id} | POST /api/badges/print-batch | POST /api/badges/archive-legacy

### Composant 3 — Jetons Digitaux (4 packs Stripe)
POST /api/jetons/checkout | GET /api/jetons/wallet/{id} | POST /api/jetons/spend
POST /api/scan/debit | POST /api/frek/nfc/tap | POST /api/jetons/remboursement

### Composant 4 — Evenement J-0
GET /api/v1/dashboard/cc2026/live | GET /api/stats/heatmap | GET /api/stats/export (CSV)
GET /api/stats/export/transactions | GET /api/stats/export/scans | Mode Terrain PWA

## Badge Lifecycle (8 etapes)
1-Inscription | 2-FREK emit | 3-Email SES | 4-Activation QR
5-Impression batch | 6-Remise J-0 (auto scan) | 7-NFC actif | 8-FREK Legacy

---

## Tests passes: 81/81 (100%)
- Iteration 28: 25/25 (badges, FREK, jetons, SES)
- Iteration 29: 18/18 (pro bypass, scan/debit, dashboard, terrain)
- Iteration 30: 16/16 (palette, lifecycle, remise)
- Iteration 31: 22/22 (email endpoints, NFC, remboursement, export, heatmap)

---

## P1 — Restant
- Migration SES sandbox → production (DKIM/SPF/DMARC)
- Mode offline scan staff (service worker + sync differee)
- Dashboard analytics Jetons (graphiques Recharts)

## P2
- Refactorisation server.py (~8500 lignes)
- Vue 3D admin (bloquee React 19/Three.js)
- Smart Engine recommandation

## Credentials
- Admin bypass: cc@kiltikonet.fr / code 000000
- Admin: CC2026admin
- Workspaces: LC2026, Twina2026, Gwen2026, Kaige2026, Alirio2026, Wudy2026, Fabrice2026, DataCC2026
