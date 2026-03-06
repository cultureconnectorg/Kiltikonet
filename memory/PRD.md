# Culture Connect 2026 - Product Requirements Document

## Overview
Culture Connect 2026 est le premier marché professionnel des industries culturelles afro-caribéennes. La plateforme comprend un site public cinématique, un système multi-workspace pour l'équipe, une messagerie interne temps réel, et un système d'accréditation.

## Core Features

### 1. Public Website
- Landing page cinématique avec animations
- Globe 3D interactif (react-globe.gl)
- Pages : Accueil, Programme, Tarifs, Partenariat, Catalogue
- Formulaire d'inscription
- Pages légales

### 2. Admin Dashboard (/admin)
- **Accès** : Mot de passe `CC2026admin`
- Gestion des accréditations participants
- Statistiques et insights
- Export CSV
- Accès CMS et Smart Engine

### 3. Multi-User Workspace System (NEW)
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

### 4. Internal Messaging System (NEW - March 6, 2026)
**Type**: Chat temps réel style Slack

**Canaux thématiques**:
- #général
- #urgences
- #logistique
- #communication
- #presse

**Fonctionnalités**:
- ✅ Messages privés 1-to-1
- ✅ Broadcast à tous (canaux)
- ✅ Notifications sonores
- ✅ Indicateur "en train d'écrire"
- ✅ Pièces jointes (images, PDF)
- ✅ WebSocket temps réel
- ✅ **Laurent voit TOUS les messages** (DMs et canaux) via onglet "Tout voir"

### 5. Security Features (NEW - March 6, 2026)
- ✅ Routes protégées (ProtectedRoute component)
- ✅ Accès croisé bloqué (Gwen ne peut pas voir /workspace/wudy)
- ✅ SessionStorage pour sessions (non persistant)
- ✅ Déconnexion propre avec nettoyage session
- ✅ Rate limiting login (5 tentatives, blocage 5 min)
- ✅ Bouton retour sécurisé après logout

### 6. Accreditation System
- Connexion Baserow (Table ID: 865847)
- Génération badges QR
- Validation présence par scan
- Export PDF/CSV

## Technical Stack

### Frontend
- React 18 with React Router
- Tailwind CSS + Shadcn/UI
- react-globe.gl
- Socket.io-client (messagerie)
- Lucide React

### Backend
- FastAPI (Python)
- MongoDB (async motor)
- WebSocket (chat temps réel)
- Cloudinary (médias)
- Anthropic Claude (AI assistant)

## API Endpoints

### Authentication
- `POST /api/workspace/login` - Login avec rate limiting
- `POST /api/workspace/logout` - Logout avec log

### Messaging (NEW)
- `WS /api/ws/chat` - WebSocket temps réel
- `GET /api/chat/messages/channel/{channel}` - Messages d'un canal
- `GET /api/chat/messages/dm/{user_id}` - Messages privés
- `POST /api/chat/messages` - Envoyer message
- `POST /api/chat/upload` - Upload pièces jointes
- `GET /api/chat/online` - Utilisateurs en ligne

### Workspace
- `POST /api/workspace/log` - Log activité
- `GET /api/workspace/logs` - Historique activités

## Testing Status (March 6, 2026)

### BLOC 1 - Sécurité : ✅ 100% PASS
| Test | Résultat |
|------|----------|
| 1.1 Accès direct sans auth | ✅ PASS |
| 1.2 Accès croisé workspaces | ✅ PASS |
| 1.3 Rate limiting | ✅ IMPLÉMENTÉ |
| 1.4 SessionStorage | ✅ PASS |
| 1.5 Bouton retour après logout | ✅ PASS |

### Messagerie : ✅ 100% PASS
| Test | Résultat |
|------|----------|
| Bouton chat visible | ✅ PASS |
| Fenêtre chat ouvre | ✅ PASS |
| 5 canaux affichés | ✅ PASS |
| "Tout voir" founder only | ✅ PASS |
| API REST | ✅ PASS |
| WebSocket | ✅ PASS |

## Tests Restants (Plan Expert)

### BLOC 2 - Synchronisation Temps Réel
- [ ] TEST 2.1 - Latence notification < 2s
- [ ] TEST 2.2 - Sync accréditation live
- [ ] TEST 2.3 - Modifications simultanées
- [ ] TEST 2.4 - Volume notifications (5 simultanées)

### BLOC 3 - Résilience Réseau (CRITIQUE)
- [ ] TEST 3.1 - Reconnexion WebSocket auto
- [ ] TEST 3.2 - Réseau lent (3G)
- [ ] TEST 3.3 - Perte connexion pendant action
- [ ] TEST 3.4 - Reconnexion après inactivité

### BLOC 4 - Charge et Performance
- [ ] TEST 4.1 - 8 connexions simultanées
- [ ] TEST 4.2 - Stress notifications (20 en 60s)
- [ ] TEST 4.3 - Accréditation sous charge (50 scans)
- [ ] TEST 4.4 - Performance mobile/tablette

### BLOC 5 - Intégrité des Données
- [ ] TEST 5.1 - Cohérence Baserow
- [ ] TEST 5.2 - Export CSV cohérence
- [ ] TEST 5.3 - Logs exhaustifs

### BLOC 6 - Scénario Jour J
- [ ] Simulation complète 15 minutes

## Credentials
- Admin: `CC2026admin`
- Workspaces: `LC2026`, `Twina2026`, `Gwen2026`, `Kaige2026`, `Alirio2026`, `Wudy2026`, `Fabrice2026`, `DataCC2026`
- Baserow Token: `BjKPCSpcpif72OtZtsmMFUbZysqlNGiK`

## Files Reference
- `/app/frontend/src/components/InternalMessaging.jsx` - Messagerie
- `/app/frontend/src/App.js` - Routes protégées
- `/app/backend/server.py` - APIs messaging & rate limiting
- `/app/test_reports/iteration_14.json` - Résultats tests
