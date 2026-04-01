# CC2026 — Culture Connect 2026
## Product Requirements Document

### Plateforme
- **Frontend** : React 19, Tailwind CSS, Shadcn UI
- **Backend** : FastAPI, MongoDB (Motor)
- **Integrations** : Stripe, FREKcore, AWS SES (sandbox), Cloudinary, hCaptcha, Anthropic (CVL BRAIN), Resend

### Fonctionnalites Implementees

#### Phase 1-4 — Core + Export PDF (DONE — Mars 2026)
- Inscription badges, generation visuelle, admin dashboard, CMS, PWA, Scanner NFC
- Smart Engine CVLN 8 flux, Social feed, Agents IA
- Espace Pro LinkedIn Culturel
- Export PDF invitations 14 templates calibres

#### Phase 5 — CVL BRAIN + Globe 3D (DONE — 1 Avril 2026)
- CVL BRAIN (Anthropic Claude), Globe 3D Premium
- Onglets Jetons/Trafic AdminDashboard
- Tests Iteration 40 — 100%

#### Phase 6 — Mgraph 3D + Notifications Push (DONE — 1 Avril 2026)
- Mgraph 3D interactif (D3.js v7 + Three.js r128 CDN)
- Notifications push admin WebSocket (badges, paiements)
- Tests Iteration 42 — 100%

#### Phase 7 — IA Recommandations Hybrides (DONE — 1 Avril 2026)
- **Moteur de recommandations hybride** (scoring interne + enrichissement CVL BRAIN) :
  - **Connexions participants** : matrice de compatibilite type/org/score, raisons personnalisees
  - **Evenements personnalises** : matching par type, tags, score culturel, taille evenement
  - **Partenariats organisations** : complementarite types, diversite, qualite scores
  - Enrichissement CVL BRAIN optionnel pour les top resultats (?enrich=true)
- **18 evenements CC2026** seedes (20-23 Mai 2026, La Savane, Fort-de-France)
- **Admin** — Onglet "Recommandations" dans Smart Engine (3 sous-tabs)
- **Utilisateur** — Widget dans UserDashboard
- **Tests Iteration 43 — Backend 15/15 (100%), Frontend 100%**

#### Phase 8 — Appel a Projet CC2026 (DONE — 1 Avril 2026)
- **Page publique `/appel-2026`** : Hero, Qui sommes-nous, Laureats CC, Eligibilite, Criteres de selection (C1-C5), Formulaire de candidature, Calendrier, Contact
- **Backend** : 6 endpoints (POST soumission, GET liste, PUT statut, GET export CSV, GET docs DOCX)
- **Admin Dashboard** : Onglet "Candidatures" avec tableau, filtres, changement de statut, export CSV
- **Fichiers DOCX** : 3 cahiers des charges telechargeables (FR, EN, KW) avec protection whitelist
- **Navigation** : Lien "Appel 2026" ajoute dans le Header
- **Correction affichage** : Page Jetons — padding-top pour le header fixe
- **Tests Iteration 44 — Backend 18/18 (100%), Frontend 100%**

#### Phase 8b — Immersion & Interactions Jetons + Appel a Projet (DONE — 1 Avril 2026)
- **JetonsPage** : Hero sombre anime (staggered), compteur a rebours CC2026, cartes packs avec hover (scale, shadow, border), icones animees, badge BEST VALUE VIP, section Stripe info
- **AppelPage** : Hero gradient avec particules flottantes, compteur deadline 30 avril, cartes laureats avec hover + rotation icone, cartes eligibilite avec border animate, criteres avec AnimatedNumber (%), timeline scroll-reveal, formulaire avec inputs focus glow
- **Navigation** : Bouton renomme "Appel a projet" (pas "Appel 2026")
- **Tests Iteration 45 — Backend 10/10 (100%), Frontend 100%**

### Architecture
| Fichier | Role |
|---------|------|
| `backend/routes/candidatures.py` | 6 endpoints appel a projet |
| `backend/routes/recommendations.py` | 5 endpoints recommandations |
| `backend/services/recommendations.py` | Moteur scoring hybride |
| `backend/services/seed_events.py` | 18 evenements CC2026 |
| `backend/services/cvl_brain.py` | Coeur IA Souveraine |
| `backend/routes/smart_engine.py` | 8 flux CVLN + Mgraph |
| `frontend/src/components/AppelPage.jsx` | Page publique appel a projet |
| `frontend/src/components/CandidaturesAdmin.jsx` | Gestion admin candidatures |
| `frontend/src/components/RecommendationsDashboard.jsx` | Dashboard admin recommandations |
| `frontend/src/components/UserRecommendations.jsx` | Widget utilisateur recommandations |
| `frontend/src/components/MgraphView.jsx` | Visualisation 3D Mgraph |
| `frontend/src/components/AdminNotifications.jsx` | Notifications push admin |

### Tests
- Iteration 39 : 100% (Export PDF)
- Iteration 40 : 100% (E2E Global)
- Iteration 41 : 100% (Mgraph initial)
- Iteration 42 : 100% (Mgraph 3D + Notifications)
- Iteration 43 : 100% (Recommandations IA — 15/15 backend, frontend 100%)
- Iteration 44 : 100% (Appel a Projet — 18/18 backend, frontend 100%)
- Iteration 45 : 100% (Immersion Jetons + Appel — 10/10 backend, frontend 100%)

### Backlog
- (P1) Verifier emails candidature (Resend vs Brevo SMTP)
- (P1) AWS SES : Sortir du Sandbox
- (P2) Dashboard Smart Engine 3D immersif complet
- (P3) PWA App Scan Staff
- (P3) Export PDF badges batch Twina
- (P3) Mode replay temporel Mgraph
