# CC2026 — Culture Connect 2026
## Product Requirements Document

### Plateforme
- **Frontend** : React 19, Tailwind CSS, Shadcn UI
- **Backend** : FastAPI, MongoDB (Motor)
- **Integrations** : Stripe, FREKcore, AWS SES (sandbox), Cloudinary, hCaptcha (prod)

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
  - Correction bug canvas vide (showPage avant save)
  - Mapping complet : BNV, EXP-VIP, et tous les codes abbrevies
  - **Tests : Iteration 39 — 16/16 tests passes (100%)**
- **AWS SES** : Cles production injectees, domaine kiltikonet.fr verifie (SANDBOX — 200 emails/jour)

### Architecture
| Fichier | Role |
|---------|------|
| `backend/services/pdf_export.py` | Generation PDF invitations personnalisees |
| `backend/templates/PINT_TEMPLATE.pdf` | Template 14 pages |
| `backend/routes/smart_engine.py` | 8 flux CVLN |
| `backend/routes/pro_social.py` | Feed, annuaire, recommandations |
| `backend/routes/ai_agents.py` | Monitoring 10 agents |
| `backend/services/hcaptcha.py` | Verification captcha |
| `frontend/src/components/ProSpaceDashboard.jsx` | LinkedIn Culturel |
| `frontend/src/components/SmartEngineDashboard.jsx` | Dashboard CVLN |
| `frontend/src/components/AIAgentsDashboard.jsx` | Dashboard Agents IA |

### Tests
- Iteration 36-38 : Tous 100% (hCaptcha, 4 Chantiers, Refonte LinkedIn)
- Iteration 39 : 100% (Export PDF Invitations — 16/16 tests)

### Corrections recentes (30 Mars 2026)
- **Bug hCaptcha bloquant Stripe** : Verification captcha rendue non-bloquante pour les flux de paiement. Widget retire des formulaires payants.
- **Globe 3D Premium** : Composant Globe3D entierement reconstruit avec texture Blue Marble, arcs gradient, 4 sources de lumiere, fond etoile, lazy loading, camera responsive (mobile 1.6 / desktop 2.0), espacement compact.

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
| AWS SES | Sandbox (200/jour) |
| Anthropic (CVL BRAIN) | Production (claude-sonnet-4) |
| Cloudinary | Configures |
