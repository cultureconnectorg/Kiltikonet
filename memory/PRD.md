# CC2026 — Culture Connect 2026
## Product Requirements Document

### Plateforme
- **Frontend** : React 19, Tailwind CSS, Shadcn UI
- **Backend** : FastAPI, MongoDB (Motor)
- **Intégrations** : Stripe, FREKcore, AWS SES, Cloudinary, hCaptcha

### Fonctionnalités Implémentées

#### Phase 1 — Core (DONE)
- Inscription badges (Visiteur gratuit, Pro payant via Stripe)
- Génération visuelle de badges avec QR code
- Admin Dashboard (Coleen, Twina, Gwen, etc.)
- CMS multi-pages dynamique
- PWA hors-ligne + Staff Scanner NFC

#### Phase 2 — Chantiers CC2026 (DONE — 27 Mars 2026)

**Chantier 1 — hCaptcha (P0)** ✅
- Widget hCaptcha sur 4 formulaires : Inscription Pro, Badge Visiteur, Contact, Partenariat
- Vérification serveur via `services/hcaptcha.py`
- Clés de test actives — clés production à fournir avant go-live

**Chantier 2 — Espace Pro "LinkedIn Culturel" (P1)** ✅
- Fil d'actualité : Posts, likes, commentaires (`/api/pro/social/feed`)
- Annuaire professionnel avec recherche avancée (`/api/pro/social/directory`)
- Recommandations de connexions basées sur profil (`/api/pro/social/recommendations`)

**Chantier 3 — Dashboard Agents IA (P1)** ✅
- Cartographie de 10 agents automatisés avec statut ON/OFF
- Monitoring : endpoints, exécutions 24h, erreurs, logs temps réel
- Toggle activer/désactiver par agent
- Route admin : `/admin/ai-agents`

**Chantier 4 — Smart Engine CVLN (P0)** ✅
- 8 flux de données centralisés via `/api/smart-engine/`:
  1. Analyse Prédictive — Tendances et projections
  2. Mgraph — Graphe relationnel pros
  3. Live Audience — Sessions temps réel
  4. Creation Origin — Origines géographiques
  5. Cultural Diffusion — Engagement et partages
  6. Conversion — Funnel visite→inscription→paiement
  7. Verified Identity — Badges, NFC, FREK
  8. Creative Network — Collaborations et matchmaking
- Dashboard unifié avec navigation par onglets

### Fichiers Clés
| Fichier | Rôle |
|---------|------|
| `backend/routes/smart_engine.py` | 8 flux CVLN |
| `backend/routes/pro_social.py` | Feed social, annuaire, recommandations |
| `backend/routes/ai_agents.py` | Monitoring 10 agents |
| `backend/services/hcaptcha.py` | Vérification captcha serveur |
| `frontend/src/components/SmartEngineDashboard.jsx` | Dashboard CVLN |
| `frontend/src/components/AIAgentsDashboard.jsx` | Dashboard Agents IA |
| `frontend/src/components/HCaptchaWidget.jsx` | Widget captcha réutilisable |
| `frontend/src/components/ProSpaceDashboard.jsx` | Espace Pro LinkedIn |

### Tests
- Iteration 36 : hCaptcha — 100%
- Iteration 37 : 4 Chantiers complets — 100% (23/23 backend, frontend OK)

### Backlog
- (P0) Fournir les clés hCaptcha production avant go-live
- (P1) AWS SES : sortir du mode Sandbox (vérifier domaine kiltikonet.fr)
- (P2) Visualisation interactive du Mgraph (D3.js ou vis.js)
- (P2) Recommandations IA avec LLM (Phase 2 post-CC2026)
- (P3) Export PDF batch badges Twina (J-15)
- (P3) Vue 3D SmartEngine (bloquée par Three.js / React 19)
