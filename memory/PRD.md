# CC2026 — Culture Connect 2026
## Product Requirements Document

### Plateforme
- **Frontend** : React 19, Tailwind CSS, Shadcn UI
- **Backend** : FastAPI, MongoDB (Motor)
- **Integrations** : Stripe, FREKcore, AWS SES (sandbox), Cloudinary, hCaptcha, Anthropic (CVL BRAIN)

### Fonctionnalites Implementees

#### Phase 1 — Core (DONE)
- Inscription badges (Visiteur gratuit, Pro payant via Stripe)
- Generation visuelle de badges avec QR code
- Admin Dashboard + CMS multi-pages, PWA, Staff Scanner NFC

#### Phase 2 — Smart Engine + Social (DONE)
- Smart Engine CVLN 8 flux, Social feed, Recommandations, Dashboard 10 Agents IA

#### Phase 3 — Refonte LinkedIn + Admin (DONE — 27 Mars 2026)
- Espace Pro LinkedIn Culturel, Smart Engine triple acces

#### Phase 4 — Export PDF + Config Production (DONE — 30 Mars 2026)
- Export PDF invitations 14 templates calibres, AWS SES production (sandbox)
- Tests Iteration 39 — 16/16 (100%)

#### Phase 5 — CVL BRAIN + Globe 3D + Admin Tabs (DONE — 1 Avril 2026)
- CVL BRAIN (Anthropic Claude), Globe 3D Premium, Fix hCaptcha, Onglets Jetons/Trafic
- Tests Iteration 40 — Backend 14/14, Frontend 100%

#### Phase 6 — Mgraph 3D + Notifications Push (DONE — 1 Avril 2026)
- **Mgraph 3D interactif** dans Smart Engine :
  - D3.js v7 force simulation + Three.js r128 via CDN
  - 58 noeuds / 165 liens depuis MongoDB en temps reel
  - Noeuds spheres 3D : ART=#FFD700, VIP=#9B59B6, STF=#3498DB, SPO=#2ECC71, INT=#FFFFFF, VIS=#00FFFF, BNV=#E67E22
  - Momentum/inertie sur rotation, auto-rotation douce
  - Pulsation amplitude + frequence selon Cultural Impact Score
  - 3 couches de particules dorees ambiantes (150+100+60)
  - Halos glow radiaux (texture canvas gradient)
  - Touch: 1 doigt rotation, pinch zoom, tap popup, double-tap isolation, long press CVL BRAIN
  - Popup profil : nom, FREK-ID, type, Cultural Impact Score, organisation, statut, barre score, analyse BRAIN
  - Isolation noeud : edges connectees visibles, reste dim
  - Hover highlight, curseur dynamique
  - Fallback 2D SVG, mode plein ecran, reset vue, refresh 30s
- **Notifications Push Admin (WebSocket)** :
  - Cloche dans le header AdminDashboard avec badge unread
  - Panneau dark theme avec liste de notifications
  - Temps reel via WebSocket /api/ws/sync channel admin_notifications
  - Broadcast automatique lors de : paiement Stripe recu, nouvelle inscription, badge remis
  - Bouton test, marquer tout lu
  - Reconnexion automatique
  - Endpoints : GET /api/admin/notifications, POST /api/admin/notifications/read-all, POST /api/admin/notifications/test
- **Cles AWS SES** mises a jour (AKIAVJWEWGHLHYFRKEHY)
- **Tests Iteration 41+42 — Backend 100%, Frontend 100%**

### Architecture
| Fichier | Role |
|---------|------|
| `backend/server.py` | API principale + WebSocket + notifications |
| `backend/routes/smart_engine.py` | 8 flux CVLN + Mgraph enrichi |
| `backend/services/cvl_brain.py` | Coeur IA Souveraine |
| `backend/routes/brain.py` | Endpoints CVL BRAIN |
| `frontend/src/components/MgraphView.jsx` | Visualisation 3D Mgraph |
| `frontend/src/components/AdminNotifications.jsx` | Notifications push admin |
| `frontend/src/components/AdminDashboard.jsx` | Dashboard Admin (6 onglets + notifications) |
| `frontend/src/components/SmartEngineDashboard.jsx` | Dashboard CVLN |

### Tests
- Iteration 39 : 100% (Export PDF — 16/16)
- Iteration 40 : 100% (E2E Global — 14/14)
- Iteration 41 : 100% (Mgraph initial — 13/13)
- Iteration 42 : 100% (Mgraph 3D + Notifications — 11/11 backend, frontend 100%)

### Backlog
- (P1) AWS SES : Sortir du Sandbox (action manuelle console AWS)
- (P2) IA recommandations combinees (connexions + contenus + partenariats)
- (P2) Dashboard Smart Engine 3D immersif complet
- (P3) Mode replay temporel Mgraph
