# Culture Connect 2026 - Product Requirements Document

## Overview
Culture Connect 2026 est le premier marché professionnel des industries culturelles afro-caribéennes. La plateforme comprend un site public cinématique avec globe 3D interactif, un système CMS complet, une gestion des accréditations, et des espaces de travail dédiés pour chaque membre de l'équipe.

## Core Features

### 1. Public Website
- Landing page cinématique avec animations
- Globe 3D interactif (react-globe.gl)
- Pages : Accueil, Programme, Tarifs, Partenariat, Catalogue
- Formulaire d'inscription
- Pages légales (CGU, Mentions légales, etc.)

### 2. Admin Dashboard (/admin)
- **Accès** : Mot de passe `CC2026admin`
- Gestion des accréditations participants
- Statistiques et insights (conversion, profils, territoires)
- Export CSV
- Gestion des partenaires
- Accès CMS et Smart Engine

### 3. CMS System (/admin/cms)
- Gestion des médias (hero, logo, venue, gallery)
- Gestion des intervenants et partenaires
- Éditeur de contenu (pages, programme)
- Thème et design
- Éditeur visuel (avec solution popup pour contourner les restrictions iframe)

### 4. Workspace System (Multi-user)
Multi-user workspace platform with role-specific tools:

| Password | User | Role | Route |
|----------|------|------|-------|
| CC2026admin | Admin | admin | /admin |
| LC2026 | Laurent Coeurvolan | founder | /workspace/laurent |
| Twina2026 | Twina | design | /workspace/twina |
| Gwen2026 | Gwen | event | /workspace/gwen |
| Kaige2026 | Kaige-Jean | press | /workspace/kaige |
| Alirio2026 | Alirio | business | /workspace/alirio |
| Wudy2026 | Wudy | finance | /workspace/wudy |
| Fabrice2026 | Fabrice | captions | /workspace/fabrice |
| DataCC2026 | Data Analyst | analyst | /workspace/analyst |

### 5. Accreditation System (/admin/accreditation)
- Connexion Baserow (Table ID: 865847)
- Génération de badges avec QR codes
- Validation de présence par scan
- Export PDF/CSV
- Observatoire statistiques

### 6. Real-Time Features
- Notifications entre workspaces
- Logs d'activité et connexions
- WebSocket pour temps réel

## Technical Stack

### Frontend
- React 18 with React Router
- Tailwind CSS + Shadcn/UI
- react-globe.gl pour le globe 3D
- Socket.io-client pour temps réel
- Lucide React pour les icônes

### Backend
- FastAPI (Python)
- MongoDB (async motor)
- Cloudinary pour les médias
- Baserow API pour accréditations
- Anthropic Claude pour AI assistant (Emergent LLM Key)

### External Integrations
- **Baserow**: Accreditation database
- **Cloudinary**: Media storage
- **Stripe**: Payments (configured)
- **Anthropic Claude**: AI assistant in Alirio's workspace

## Recent Fixes (March 6, 2026)

### ✅ Bug Déconnexion - CORRIGÉ
- Admin et tous les workspaces redirigent correctement vers /admin
- SessionStorage et localStorage sont nettoyés à la déconnexion
- Endpoint `/api/workspace/logout` utilise un modèle simplifié (user, role seulement)

### ✅ Warning Hydration React - CORRIGÉ
- Suppression de `useTheme` de next-themes dans sonner.jsx
- Theme fixé à "dark" statiquement

### ✅ Visual Editor - SOLUTION DE CONTOURNEMENT
- Bouton "Ouvrir l'aperçu éditable" au lieu d'iframe bloqué
- Script de mode édition injecté dans index.js pour ?ve=1
- Communication via postMessage entre fenêtre popup et éditeur

## API Endpoints

### Authentication
- `POST /api/workspace/login` - Unified workspace login
- `POST /api/workspace/logout` - Logout with user/role only
- `POST /api/admin/verify` - Legacy admin verify

### Workspace
- `GET /api/workspace/logs` - Activity logs
- `POST /api/workspace/log` - Add log entry
- `GET /api/workspace/sessions` - Active sessions

### Notifications
- `POST /api/notifications` - Send notification
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/{id}/read` - Mark as read

### CMS
- `GET /api/cms/media` - Media management
- `GET /api/cms/content` - Content management
- `GET /api/cms/visual-editor/proxy` - Proxy for visual editor

## Testing Status (March 6, 2026)
- ✅ Backend: 100% tests passed
- ✅ Frontend: 100% tests passed
- ✅ Logout flows: All 3 types verified (admin, workspaces)
- ✅ Visual Editor: Popup button displayed correctly
- ✅ Sonner.jsx: No hydration warnings

## Known Issues (Resolved)
1. ~~Bug déconnexion~~ → CORRIGÉ
2. ~~Warning hydration~~ → CORRIGÉ
3. ~~Visual Editor iframe blocked~~ → CONTOURNÉ avec popup

## Minor Pre-existing Issues
- Hydration warning `<tr>` in `<span>` dans AdminDashboard (LOW priority, non-bloquant)

## Credentials
- Admin: `CC2026admin`
- Workspaces: `LC2026`, `Twina2026`, `Gwen2026`, `Kaige2026`, `Alirio2026`, `Wudy2026`, `Fabrice2026`, `DataCC2026`
- Baserow Token: `BjKPCSpcpif72OtZtsmMFUbZysqlNGiK`

## Future Tasks (Backlog)
1. Refactor `server.py` into modules (routes/, services/)
2. Refactor large React components (LaurentWorkspace, CMSAdmin)
3. Production deployment preparation
4. Fix minor hydration warning in AdminDashboard
