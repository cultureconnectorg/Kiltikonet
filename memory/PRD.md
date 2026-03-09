# Culture Connect 2026 - PRD

## Description du projet
Plateforme événementielle complète pour Culture Connect 2026, un marché professionnel des industries culturelles en Martinique (20-23 mai 2026). Inclut une landing page publique, un système d'accréditation, des espaces de travail collaboratifs, et un Smart Engine analytique.

## Architecture technique
- **Frontend**: React 19 (PWA) + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + MongoDB (+ db.json pour données partagées legacy)
- **Authentification**: JWT pour admin, mots de passe par workspace
- **Intégrations**: Baserow, Anthropic Claude, Stripe, Cloudinary, html5-qrcode

## Workspaces et rôles
| Workspace | Rôle | Mot de passe | Données gérées |
|-----------|------|-------------|----------------|
| Laurent | Fondateur | LC2026 | Vue d'ensemble, logs |
| Gwen | Événementiel | Gwen2026 | Artistes, Prestataires, Planning |
| Alirio | Business | Alirio2026 | Partenaires, Tâches, Contacts |
| Wudy | Comptabilité | Wudy2026 | Budget, Dépenses |
| Fabrice | Captation live | Fabrice2026 | Captions, Séquences |
| Kaige | Presse | Kaige2026 | Communiqués, Médias |
| Twina | Design | Twina2026 | CMS, Visuels |

## Données partagées (SharedDataContext)
Entités centralisées via `/api/shared/*`:
- artistes, prestataires, partners, tasks, expenses, contacts, planning
- Polling automatique toutes les 10 secondes
- CRUD complet via React Context (useSharedData hook)

---

## Complété

### P0 - Synchronisation des données (10/03/2026)
- SharedDataContext créé avec CRUD complet pour 7 entités
- SharedDataProvider intégré dans App.js (wraps toute l'app)
- WorkspaceGwen: utilise useSharedData() pour artistes, prestataires, planning
- WorkspaceAlirio: utilise useSharedData() pour partners, tasks, contacts
- WorkspaceWudy: utilise useSharedData() pour expenses
- WorkspaceLaurent: utilise useSharedData() pour afficher compteurs live
- WorkspaceFabrice: connecté au contexte (artistes, planning)
- Pages publiques (LandingPage, ProgramPage): section Line-up avec artistes partagés
- Bug critique MongoDB ObjectId résolu (33/33 tests passés)

### Précédemment complété
- PWA avec interface mobile
- Dashboard admin avec Mode Terrain
- Smart Engine Dashboard
- Responsivité de tous les workspaces
- Permissions des workspaces (Gwen, Alirio, Wudy)
- Système de notifications internes

---

## Tâches restantes

### P1 - Déploiement
- Prêt pour déploiement après validation P0

### P2 - Améliorations futures
- Vue 3D admin (bloquée: React 19 + Three.js incompatibilité)
- Visual Editor iframe (contournement window.open actif)
- Refactorisation backend (server.py monolithique)
- WebSocket pour synchronisation temps réel (au lieu du polling 10s)
