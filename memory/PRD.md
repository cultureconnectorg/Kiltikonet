# CC2026 — Culture Connect 2026
## Product Requirements Document

### Plateforme
- **Frontend** : React 19, Tailwind CSS, Shadcn UI
- **Backend** : FastAPI, MongoDB (Motor)
- **Integrations** : Stripe, FREKcore, AWS SES (sandbox), Cloudinary, hCaptcha (prod), Anthropic (CVL BRAIN)

### Fonctionnalites Implementees

#### Phase 1 — Core (DONE)
- Inscription badges (Visiteur gratuit, Pro payant via Stripe)
- Generation visuelle de badges avec QR code
- Admin Dashboard (Coleen, Twina, Gwen, etc.)
- CMS multi-pages, PWA, Staff Scanner NFC

#### Phase 2 — Chantiers initiaux (DONE)
- hCaptcha production (sitekey: 778827a6..., secret: ES_9d64...)
- Smart Engine CVLN 8 flux
- Social feed + Recommandations
- Dashboard Agents IA (10 agents)

#### Phase 3 — Refonte LinkedIn + Admin (DONE — 27 Mars 2026)
- **Espace Pro LinkedIn Culturel** : header banniere/photo/badges, feed, annuaire filtres, messagerie panel, recommandations
- **Smart Engine triple acces** : Admin principal, DashboardCC2026, route /smart-engine
- **Agents IA dans admin** : onglet dedie dans Admin principal

#### Phase 4 — Export PDF + Config Production (DONE — 30 Mars 2026)
- **hCaptcha production** : cle secrete configuree dans backend/.env
- **Export PDF invitations** :
  - Template PINT_TEMPLATE.pdf (14 pages, 14 types de badges)
  - Superposition donnees participant (NOM, REPRESENTANT DE, ACCES, etc.)
  - `GET /api/invitations/export-single/{badge_id}` — PDF unique
  - `GET /api/invitations/export-batch?type_badge=VIP&limit=100` — PDF multi-pages
  - Positions calibrees visuellement pour chaque type de layout (grilles de reference)
  - Couleur GOLD pour pages EXPOSANT sombres (Platine, Diamant, VIP)
  - **Tests : Iteration 39 — 16/16 tests passes (100%)**
- **AWS SES** : Cles production injectees, domaine kiltikonet.fr verifie (SANDBOX — 200 emails/jour)

#### Phase 5 — CVL BRAIN + Globe 3D + Admin Tabs (DONE — 1 Avril 2026)
- **CVL BRAIN (Intelligence Souveraine)** :
  - Backend: `cvl_brain.py` (API Anthropic Claude), `cvl_brain_agents.py` (10 agents connectes)
  - Routes: `brain.py` (4 endpoints: analyse, entreprise, evenement, alerte)
  - DB: Collection `cvl_brain_analyses`
  - UI: Badge BRAIN dans AIAgentsDashboard
- **Globe 3D Premium** : Composant Globe3D refait avec `react-globe.gl`, textures Blue Marble, arcs gradient, 4 sources de lumiere, fond etoile, lazy loading, camera responsive
- **Fix hCaptcha** : Widget retire des formulaires payants, verification non-bloquante
- **Onglets Jetons/Trafic** : Migres en onglets natifs dans AdminDashboard (plus de routes isolees)
- **Cles AWS SES** : Mises a jour (AKIAVJWEWGHLHYFRKEHY)
- **Tests : Iteration 40 — Backend 14/14 (100%), Frontend 100%**

### Architecture
| Fichier | Role |
|---------|------|
| `backend/services/pdf_export.py` | Generation PDF invitations personnalisees |
| `backend/services/cvl_brain.py` | Coeur IA Souveraine (Anthropic Claude) |
| `backend/services/cvl_brain_agents.py` | Logique des 10 agents IA |
| `backend/routes/brain.py` | Endpoints CVL BRAIN |
| `backend/routes/smart_engine.py` | 8 flux CVLN |
| `backend/routes/pro_social.py` | Feed, annuaire, recommandations |
| `backend/routes/ai_agents.py` | Monitoring 10 agents |
| `backend/services/hcaptcha.py` | Verification captcha |
| `backend/templates/PINT_TEMPLATE.pdf` | Template 14 pages |
| `frontend/src/components/AdminDashboard.jsx` | Dashboard Admin (6 onglets) |
| `frontend/src/components/Globe3D.jsx` | Globe 3D Blue Marble |
| `frontend/src/components/AIAgentsDashboard.jsx` | Dashboard Agents IA + CVL BRAIN |
| `frontend/src/components/JetonsAnalyticsDashboard.jsx` | Analytics Jetons |
| `frontend/src/components/SiteAnalyticsDashboard.jsx` | Analytics Trafic |

### Tests
- Iteration 36-38 : Tous 100% (hCaptcha, 4 Chantiers, Refonte LinkedIn)
- Iteration 39 : 100% (Export PDF Invitations — 16/16 tests)
- Iteration 40 : 100% (E2E Global — Backend 14/14, Frontend 100%)

### Backlog
- (P1) AWS SES : Sortir du Sandbox (action manuelle utilisateur dans console AWS)
- (P2) Visualisation Mgraph interactive (D3.js)
- (P2) IA externe pour recommandations (Phase 2 post-CC2026)
- (P3) Vue 3D SmartEngine

### Integrations
| Service | Status |
|---------|--------|
| Stripe | Configures (live) |
| hCaptcha | Production |
| AWS SES | Sandbox (200/jour) — nouvelles cles configurees |
| Anthropic (CVL BRAIN) | Production (claude-sonnet-4) |
| Cloudinary | Configures |
