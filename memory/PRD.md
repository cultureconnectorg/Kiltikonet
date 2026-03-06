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
- Éditeur visuel (iframe - issue connue avec cross-origin)

### 4. Workspace System (NEW - March 2026)
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

## API Endpoints

### Authentication
- `POST /api/workspace/login` - Unified workspace login
- `POST /api/admin/verify` - Legacy admin verify

### Workspace
- `GET /api/workspace/logs` - Activity logs
- `POST /api/workspace/log` - Add log entry
- `GET /api/workspace/sessions` - Active sessions

### Notifications
- `POST /api/notifications` - Send notification
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/{id}/read` - Mark as read

### Registrations
- `GET /api/registrations` - List participants
- `POST /api/registrations/manual` - Add participant
- `PATCH /api/registrations/{id}/status` - Update status

### CMS
- `GET /api/cms/media` - Media management
- `GET /api/cms/content` - Content management
- `PUT /api/cms/theme` - Theme settings

## Testing Status (March 2026)
- ✅ Backend: 24/24 tests passed (100%)
- ✅ Frontend: All flows working
- ✅ All 9 credentials verified
- ✅ Notifications API working
- ✅ Workspace logs working

## Known Issues
1. **Visual Editor iframe** (P1) - Cross-origin security blocks iframe content
2. **Hydration warning** (LOW) - `<tr>` inside `<span>` in AccreditationSystem

## Credentials for Testing
- Admin: `CC2026admin`
- Workspaces: `LC2026`, `Twina2026`, `Gwen2026`, `Kaige2026`, `Alirio2026`, `Wudy2026`, `Fabrice2026`, `DataCC2026`
- Baserow Token: `BjKPCSpcpif72OtZtsmMFUbZysqlNGiK`

## Future Tasks (Backlog)
1. Refactor `server.py` into modules
2. Fix Visual Editor iframe issue
3. Refactor large React components
4. Production deployment preparation
