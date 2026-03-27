# CC2026 — Culture Connect 2026
## Product Requirements Document

### Plateforme
- **Frontend** : React 19, Tailwind CSS, Shadcn UI
- **Backend** : FastAPI, MongoDB (Motor)
- **Intégrations** : Stripe, FREKcore, AWS SES (sandbox), Cloudinary, hCaptcha (prod)

### Fonctionnalités Implémentées

#### Phase 1 — Core (DONE)
- Inscription badges (Visiteur gratuit, Pro payant via Stripe)
- Génération visuelle de badges avec QR code
- Admin Dashboard (Coleen, Twina, Gwen, etc.)
- CMS multi-pages, PWA, Staff Scanner NFC

#### Phase 2 — Chantiers initiaux (DONE)
- hCaptcha production (sitekey: 778827a6..., secret: ES_9d64...)
- Smart Engine CVLN 8 flux
- Social feed + Recommandations
- Dashboard Agents IA (10 agents)

#### Phase 3 — Refonte LinkedIn + Admin (DONE — 27 Mars 2026)
- **Espace Pro LinkedIn Culturel** : header bannière/photo/badges, feed, annuaire filtres, messagerie panel, recommandations
- **Smart Engine triple accès** : Admin principal, DashboardCC2026, route /smart-engine
- **Agents IA dans admin** : onglet dédié dans Admin principal

#### Phase 4 — Export PDF + Config Production (DONE — 27 Mars 2026)
- **hCaptcha production** : clé secrète configurée dans backend/.env
- **Export PDF invitations** :
  - Template PINT_TEMPLATE.pdf (14 pages, 14 types de badges)
  - Superposition données participant (NOM, REPRÉSENTANT DE, ACCÈS, etc.)
  - `GET /api/invitations/export-single/{badge_id}` — PDF unique
  - `GET /api/invitations/export-batch?type_badge=VIP&limit=100` — PDF multi-pages
  - Positions calibrées visuellement pour chaque type de layout

### Architecture
| Fichier | Rôle |
|---------|------|
| `backend/services/pdf_export.py` | Génération PDF invitations personnalisées |
| `backend/templates/PINT_TEMPLATE.pdf` | Template 14 pages |
| `backend/routes/smart_engine.py` | 8 flux CVLN |
| `backend/routes/pro_social.py` | Feed, annuaire, recommandations |
| `backend/routes/ai_agents.py` | Monitoring 10 agents |
| `backend/services/hcaptcha.py` | Vérification captcha |
| `frontend/src/components/ProSpaceDashboard.jsx` | LinkedIn Culturel |
| `frontend/src/components/SmartEngineDashboard.jsx` | Dashboard CVLN |
| `frontend/src/components/AIAgentsDashboard.jsx` | Dashboard Agents IA |

### Tests
- Iteration 36-38 : Tous 100%

### Backlog
- (P0) Brevo SMTP fallback (en attente clés utilisateur)
- (P1) AWS SES production (sortir Sandbox)
- (P2) Visualisation Mgraph interactive
- (P2) IA externe pour recommandations (Phase 2 post-CC2026)
- (P3) Vue 3D SmartEngine
