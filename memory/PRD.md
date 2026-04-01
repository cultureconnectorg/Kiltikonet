# CC2026 — Culture Connect 2026
## Product Requirements Document

### Plateforme
- **Frontend** : React 19, Tailwind CSS, Shadcn UI
- **Backend** : FastAPI, MongoDB (Motor)
- **Integrations** : Stripe, FREKcore, AWS SES (sandbox), Cloudinary, hCaptcha, Anthropic (CVL BRAIN)

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
- **18 evenements CC2026** seedes (20-23 Mai 2026, La Savane, Fort-de-France) :
  - Ateliers Bele, Conferences Diaspora, Music Business Summit, Workshops Audiovisuel
  - Diaspora Nights (Zouk/Kompa, Dancehall/Afrobeats), Showcase Artistes, Exposition Art
  - Networking VIP, Brunch Bilan, Grand Concert de cloture
- **Admin** — Onglet "Recommandations" dans Smart Engine (3 sous-tabs) :
  - Vue globale : stats cards, distribution impact culturel, types evenements, top orgs
  - Par profil : selecteur participant, 3 colonnes (Connexions/Evenements/Partenariats), bouton CVL BRAIN
  - Agenda CC2026 : 4 jours expandables avec details (lieu, horaires, capacite, badges cibles)
- **Utilisateur** — Widget dans UserDashboard :
  - Onglets "Evenements pour vous" et "Connexions suggerees"
  - Scores de matching, raisons, types badges colores
- **API Endpoints** :
  - GET /api/recommendations/connections/{badge_id}
  - GET /api/recommendations/events/{badge_id}
  - GET /api/recommendations/partnerships/{badge_id}
  - GET /api/recommendations/admin/overview
  - GET /api/recommendations/events
- **Tests Iteration 43 — Backend 15/15 (100%), Frontend 100%**

### Architecture
| Fichier | Role |
|---------|------|
| `backend/routes/recommendations.py` | 5 endpoints recommandations |
| `backend/services/recommendations.py` | Moteur scoring hybride |
| `backend/services/seed_events.py` | 18 evenements CC2026 |
| `backend/services/cvl_brain.py` | Coeur IA Souveraine |
| `backend/routes/smart_engine.py` | 8 flux CVLN + Mgraph |
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

### Backlog
- (P1) AWS SES : Sortir du Sandbox
- (P2) Dashboard Smart Engine 3D immersif complet
- (P3) Mode replay temporel Mgraph
