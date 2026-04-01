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
- Moteur de recommandations hybride (scoring interne + enrichissement CVL BRAIN)
- 18 evenements CC2026 seedes (20-23 Mai 2026, La Savane, Fort-de-France)
- Admin — Onglet "Recommandations" dans Smart Engine
- Tests Iteration 43 — 100%

#### Phase 8 — Appel a Projet CC2026 (DONE — 1 Avril 2026)
- Page publique /appel-2026, Backend 6 endpoints, Admin Dashboard candidatures
- Fichiers DOCX telechargeables
- Tests Iteration 44 — 100%

#### Phase 8b — Immersion & Interactions (DONE — 1 Avril 2026)
- JetonsPage et AppelPage immersives avec animations
- Tests Iteration 45 — 100%

#### Phase 9 — Audit Accessibilite WCAG (DONE — 1 Avril 2026)
- 42 violations corrigees sur 14 pages
- Page /accessibilite creee (RGAA 4.1 / WCAG 2.1 AA)
- Tests Iteration 46 — 100%

#### Phase 10 — Photos Catalogue, Routage & Finitions (DONE — 1 Avril 2026)
- Admin photo upload Cloudinary
- Toggle show_in_catalog dans formulaire inscription
- Correction routage /espace-coleen vers /workspace/coleen
- Tests Iteration 47 — 100%

#### Phase 11 — Ghost Population & Espace Pro Immersif (DONE — 1 Avril 2026)
- **Ghost Population System** : 20 profils fantomes caribeeens/africains authentiques
  - Noms realistes diaspora (Martinique, Guadeloupe, Guyane, Senegal, Cote d'Ivoire, UK, Colombie, France)
  - FREK-IDs uniques, Cultural Impact Scores, bios en francais/creole
  - 12 seed posts realistes (bele, zouk, gwoka, cuisine creole, agriculture, cinema, mode, sculpture)
  - Commentaires croises entre fantomes
  - Auto-commentaire CVL BRAIN sur les posts reels (delai 1-10min)
  - Demandes de connexion automatiques aux nouveaux utilisateurs
  - Systeme de retrait progressif (0-50 users: 20 ghosts, 50-150: 15, 150-300: 10, 300-500: 5, 500+: 0)
  - Dashboard admin : stats, liste profils, toggle systeme, retrait manuel
- **Onboarding Interactif CVL BRAIN** :
  - Modale 3 etapes (pratique culturelle, genre/style, objectif CC2026)
  - Evaluation CVL BRAIN en temps reel via Anthropic Claude
  - Animation constellation d'etoiles dorees (HTML Canvas)
  - Generation FREK-ID unique (FREK-{PRACTICE}-{XXXX})
  - Attribution 10 Jetons CC de bienvenue
- **Compteur Jetons CC en Or** : Badge dore dans la navigation pro avec solde JCC
- **Bouton Flottant CVL BRAIN** :
  - Chat IA en temps reel avec CVL BRAIN (Anthropic Claude)
  - Notifications periodiques contextuelles
  - Messages d'accueil en creole/francais
- **Feed Vivant** : Posts fantomes melanges avec posts reels dans le fil d'actualite
- **Directory Enrichi** : Profils fantomes melanges avec vrais utilisateurs dans l'annuaire
- **Tests Iteration 48 — Backend 13/13 (100%), Frontend 100%**

### Architecture
| Fichier | Role |
|---------|------|
| `backend/routes/ghost_profiles.py` | Ghost Population System (seed, admin, onboarding, retirement, auto-comment) |
| `backend/routes/pro_social.py` | Feed social enrichi avec fantomes, directory mixte |
| `frontend/src/components/ProSpaceDashboard.jsx` | Dashboard pro avec onboarding, jetons, CVL BRAIN |
| `frontend/src/components/ProOnboarding.jsx` | Modale onboarding 3 etapes + constellation |
| `frontend/src/components/CvlBrainFloat.jsx` | Bouton flottant chat CVL BRAIN |
| `backend/routes/candidatures.py` | 6 endpoints appel a projet |
| `backend/routes/recommendations.py` | 5 endpoints recommandations |
| `backend/services/recommendations.py` | Moteur scoring hybride |
| `backend/services/cvl_brain.py` | Coeur IA Souveraine |
| `frontend/src/components/MgraphView.jsx` | Visualisation 3D Mgraph |

### Tests
- Iteration 39-47 : 100% (Phases precedentes)
- Iteration 48 : 100% (Ghost Population + Espace Pro Immersif — 13/13 backend, frontend 100%)

### Backlog
- (P1) Verifier emails candidature (Resend vs Brevo SMTP)
- (P1) AWS SES : Sortir du Sandbox
- (P2) Dashboard Smart Engine 3D immersif complet
- (P2) Admin Ghost Dashboard tab dans AdminDashboard
- (P3) PWA App Scan Staff
- (P3) Export PDF badges batch Twina
- (P3) Mode replay temporel Mgraph
