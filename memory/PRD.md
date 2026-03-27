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

#### Phase 2 — Chantiers initiaux (DONE — 27 Mars 2026)
- hCaptcha sur 4 formulaires (Pro, Visiteur, Contact, Partenariat)
- Smart Engine CVLN initial (8 flux de données)
- Fil d'actualité + Recommandations social (Espace Pro)
- Dashboard Agents IA (10 agents cartographiés)

#### Phase 3 — Refonte LinkedIn + Intégrations Admin (DONE — 27 Mars 2026)

**Chantier A — Espace Pro LinkedIn Culturel** ✅
- Refonte complète design sombre kiltikonet.fr
- Header profil LinkedIn : bannière, photo, nom, titre, localisation, nb connexions
- Badges "Accrédité CC2026" et "FREK Vérifié"
- Feed LinkedIn : posts, likes, commentaires, zone rédaction, cards avatar/nom/titre
- Annuaire : filtres discipline/territoire/type, cards LinkedIn, bouton connexion
- Messagerie : panel latéral bottom-right, conversations, badge non-lu
- Recommandations : widget "Profils suggérés", scoring par complémentarité
- Sections profil : À propos (dépliable), Compétences (tags), Je recherche/Je propose, Liens

**Chantier B — Smart Engine Triple Accès** ✅
- Onglet "Smart Engine" dans Admin principal (data-testid: tab-smart-engine)
- Bouton "Smart Engine" dans DashboardCC2026 (vue toggle)
- Route dédiée /smart-engine toujours active
- Même API `/api/smart-engine/` pour les 3 points d'accès

**Chantier C — Agents IA dans Admin** ✅
- Onglet "Agents IA" dans Admin principal (data-testid: tab-ai-agents)
- 10 agents cartographiés, 9 actifs, 1 inactif (SES Sandbox)

**Chantier D — hCaptcha Production** ✅
- Clé site production : 778827a6-199c-40b0-bf16-1912baf494ae
- Secret key à fournir via variables d'environnement Emergent

### Architecture Fichiers
| Fichier | Rôle |
|---------|------|
| `backend/routes/smart_engine.py` | 8 flux CVLN |
| `backend/routes/pro_social.py` | Feed social, annuaire, recommandations |
| `backend/routes/ai_agents.py` | Monitoring 10 agents |
| `backend/services/hcaptcha.py` | Vérification captcha serveur |
| `frontend/src/components/ProSpaceDashboard.jsx` | Espace Pro LinkedIn complet |
| `frontend/src/components/SmartEngineDashboard.jsx` | Dashboard CVLN 8 streams |
| `frontend/src/components/AIAgentsDashboard.jsx` | Dashboard Agents IA |
| `frontend/src/components/AdminDashboard.jsx` | Admin avec onglets SE + IA |
| `frontend/src/components/DashboardCC2026.jsx` | Dashboard CC avec vue SE |

### Tests
- Iteration 36 : hCaptcha — 100%
- Iteration 37 : Smart Engine + Social — 100%
- Iteration 38 : Refonte LinkedIn + Admin tabs — 100% (21/21)

### Backlog
- (P0) Fournir `HCAPTCHA_SECRET` en production (variable environnement Emergent)
- (P1) AWS SES : sortir du mode Sandbox
- (P2) Visualisation interactive Mgraph (D3.js)
- (P2) Intégration IA externe pour recommandations (Phase 2 post-CC2026)
- (P3) Export PDF batch badges Twina
