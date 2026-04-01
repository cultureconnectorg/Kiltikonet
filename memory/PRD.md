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
- Espace Pro LinkedIn Culturel
- Smart Engine triple acces
- Agents IA dans admin

#### Phase 4 — Export PDF + Config Production (DONE — 30 Mars 2026)
- Export PDF invitations (14 templates, calibrage 100%)
- AWS SES config production (sandbox)
- Tests : Iteration 39 — 16/16 (100%)

#### Phase 5 — CVL BRAIN + Globe 3D + Admin Tabs (DONE — 1 Avril 2026)
- CVL BRAIN (Intelligence Souveraine Anthropic)
- Globe 3D Premium (react-globe.gl, Blue Marble)
- Fix hCaptcha non-bloquant pour Stripe
- Onglets Jetons/Trafic dans AdminDashboard
- Tests : Iteration 40 — Backend 14/14, Frontend 100%

#### Phase 6 — Mgraph 3D Visualisation (DONE — 1 Avril 2026)
- **Mgraph 3D interactif** dans Smart Engine onglet Mgraph
  - D3.js v7 force simulation (layout + physique)
  - Three.js r128 via CDN cdnjs.cloudflare.com
  - Canvas WebGL isole du DOM React (useRef)
  - 58 noeuds / 165 liens depuis MongoDB
  - Noeuds = spheres 3D lumineuses par type :
    - ART=#FFD700, VIP=#9B59B6, STF=#3498DB, SPO=#2ECC71
    - INT=#FFFFFF, VIS=#00FFFF, BNV=#E67E22, EXP=#FFD700
  - Pulsation selon Cultural Impact Score
  - Liens lumineux (org=terracotta, type=gold, brain=violet)
  - Particules ambiantes dorees (200 particules)
  - Halo glow radial sur chaque noeud
  - Interactions : rotation 1 doigt, pinch zoom, pan 2 doigts
  - Tap noeud = popup profil (FREK-ID, score, type, org)
  - Double tap = isole noeud + connexions
  - Long press = analyse CVL BRAIN temps reel
  - Refresh auto 30 secondes
  - Mode plein ecran
  - Fallback 2D SVG si WebGL indisponible
  - Cleanup propre sur unmount
- **Backend** : Endpoint /api/smart-engine/mgraph enrichi
  - Noeuds depuis cc_badges (58 badges)
  - Edges generees : org (meme organisation), type (meme badge), brain (high score)
- **Cles AWS SES** mises a jour (AKIAVJWEWGHLHYFRKEHY)
- **Tests : Iteration 41 — Backend 13/13 (100%), Frontend 100%**

### Architecture
| Fichier | Role |
|---------|------|
| `backend/routes/smart_engine.py` | 8 flux CVLN + Mgraph enrichi |
| `backend/services/cvl_brain.py` | Coeur IA Souveraine |
| `backend/services/pdf_export.py` | Generation PDF invitations |
| `backend/routes/brain.py` | Endpoints CVL BRAIN |
| `frontend/src/components/MgraphView.jsx` | Visualisation 3D Mgraph |
| `frontend/src/components/SmartEngineDashboard.jsx` | Dashboard CVLN |
| `frontend/src/components/AdminDashboard.jsx` | Dashboard Admin (6 onglets) |
| `frontend/src/components/Globe3D.jsx` | Globe 3D Blue Marble |

### Tests
- Iteration 36-38 : 100% (hCaptcha, 4 Chantiers, Refonte LinkedIn)
- Iteration 39 : 100% (Export PDF — 16/16)
- Iteration 40 : 100% (E2E Global — 14/14 backend, frontend 100%)
- Iteration 41 : 100% (Mgraph 3D — 13/13 backend, frontend 100%)

### Backlog
- (P1) AWS SES : Sortir du Sandbox (action manuelle console AWS)
- (P2) IA externe pour recommandations (Phase 2 post-CC2026)
- (P3) Vue 3D SmartEngine (variantes supplementaires)

### Integrations
| Service | Status |
|---------|--------|
| Stripe | Configures (live) |
| hCaptcha | Production |
| AWS SES | Sandbox (200/jour) — nouvelles cles |
| Anthropic (CVL BRAIN) | Production (claude-sonnet-4) |
| Cloudinary | Configures |
