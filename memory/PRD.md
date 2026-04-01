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

#### Phase 9 — Audit Accessibilite WCAG (DONE — 1 Avril 2026)
- **Phase 1 — Audit** : 42 violations identifiees (14 critiques, 22 majeures, 6 mineures) sur 14 pages
- **Phase 2 — Corrections CRITIQUES** :
  - 6 images alt descriptifs (AdminDashboard, AdminMobileDashboard, ProSpaceDashboard, RegistrationForm, AccreditationSystem QR)
  - 10 boutons icones aria-label (AccreditationSystem, ProSpaceDashboard, CMSAdmin)
  - 9 champs de formulaire aria-label (recherche, commentaire, candidature)
  - Globe 3D : role=img + aria-label descriptif complet
  - Title dynamique par route (17 routes)
- **Phase 2 — Corrections MAJEURES** :
  - 17 modales : role=dialog + aria-modal=true + aria-label
  - Header : aria-expanded sur menu mobile et dropdown compte, role=menu, role=menuitem
  - MgraphView : role=dialog en plein ecran
- **Phase 3** : Page /accessibilite creee (declaration RGAA 4.1 / WCAG 2.1 AA)
- **Phase 4** : Correction responsive — breakpoint nav header de md (768px) a lg (1024px)
- **Tests Iteration 46 — Backend 12/12 (100%), Frontend 100%**

#### Phase 10 — Photos Catalogue, Routage & Finitions (DONE — 1 Avril 2026)
- **Admin photo upload** : Bouton camera dans le modal admin pour changer la photo d'un participant via Cloudinary (PATCH /api/registrations/{id}/photo)
- **Formulaire inscription** : Toggle "Apparaitre dans le catalogue pro" (show_in_catalog). Si coche, photo obligatoire avec message d'erreur explicite. Si decoche, photo optionnelle.
- **Footer legal** : Lien "Accessibilite" ajoute discretement a cote des Mentions legales, CGU, Cookies
- **Routage corrige** : /espace-coleen → /workspace/coleen (AIAgentsDashboard + SmartEngineDashboard)
- **Audit routage** : Tous les liens internes verifies et fonctionnels
- **Tests Iteration 47 — Backend 9/9 (100%), Frontend 100%**

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

| `frontend/src/components/AccessibilitePage.jsx` | Declaration RGAA accessibilite |

### Tests
- Iteration 39 : 100% (Export PDF)
- Iteration 40 : 100% (E2E Global)
- Iteration 41 : 100% (Mgraph initial)
- Iteration 42 : 100% (Mgraph 3D + Notifications)
- Iteration 43 : 100% (Recommandations IA — 15/15 backend, frontend 100%)
- Iteration 44 : 100% (Appel a Projet — 18/18 backend, frontend 100%)
- Iteration 45 : 100% (Immersion Jetons + Appel — 10/10 backend, frontend 100%)
- Iteration 46 : 100% (Audit Accessibilite WCAG — 12/12 backend, frontend 100%)
- Iteration 47 : 100% (Photos Catalogue, Routage, Finitions — 9/9 backend, frontend 100%)

### Backlog
- (P1) Verifier emails candidature (Resend vs Brevo SMTP)
- (P1) AWS SES : Sortir du Sandbox
- (P2) Dashboard Smart Engine 3D immersif complet
- (P3) PWA App Scan Staff
- (P3) Export PDF badges batch Twina
- (P3) Mode replay temporel Mgraph
