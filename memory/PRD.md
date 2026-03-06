# Culture Connect 2026 (CC2026) - PRD

## Project Overview
Premier marché professionnel des industries culturelles afro-descendantes.
- **Date**: 22 Mai 2026
- **Lieu**: La Savane, Fort-de-France, Martinique
- **Site**: kiltikonet.fr
- **Organisateur**: CVLN (Laurent Coeurvolan)

## Core Features Implemented

### 1. Public Website (kiltikonet.fr)
- ✅ Landing page cinématique avec animations scroll
- ✅ Globe 3D interactif (react-globe.gl)
- ✅ Carousel partenaires animé
- ✅ Programme détaillé (/programme)
- ✅ Formulaire d'inscription avec paiement Stripe
- ✅ Catalogue des participants
- ✅ Pages légales (CGU, RGPD, Cookies)
- ✅ SEO complet (meta tags, JSON-LD, sitemap)

### 2. Admin Dashboard (/admin)
- ✅ Authentification par mot de passe (CC2026admin)
- ✅ Gestion des inscriptions (CRUD)
- ✅ Validation/approbation des participants
- ✅ Export CSV des données
- ✅ Statistiques temps réel
- ✅ Envoi d'emails (Resend)

### 3. CMS Admin (/admin/cms)
- ✅ Gestion du contenu du site
- ✅ Upload médias (Cloudinary)
- ✅ Configuration thème et couleurs
- ✅ Gestion partenaires

### 4. Système d'Accréditation (/admin/accreditation) - NOUVEAU
- ✅ Intégration Baserow (Table 865847)
- ✅ Liste participants avec CRUD complet
- ✅ Générateur de badges professionnels
- ✅ Design badge basé sur flyer CC2026
- ✅ QR Code intégré pour validation
- ✅ Export CSV liste participants
- ✅ Export PDF badge individuel
- ✅ Filtres par type de badge et présence
- ✅ Validation présence en un clic

### 5. Page Scan Badge (/badge/:id) - NOUVEAU
- ✅ Auto-validation présence via PATCH Baserow
- ✅ Affichage informations participant
- ✅ Design cohérent CC2026

### 6. Système Multi-Workspaces - NOUVEAU
Accès par mot de passe unique sur la page de connexion admin.

| Membre | Mot de passe | Workspace | Fonctionnalités |
|--------|-------------|-----------|-----------------|
| Admin | CC2026admin | /admin | Dashboard admin existant |
| Laurent (LC) | LC2026 | /workspace/laurent | Vue d'ensemble, logs connexion, historique modifications |
| Twina | Twina2026 | /workspace/twina | CMS visuel dédié, gestion visuels |
| Gwen | Gwen2026 | /workspace/gwen | Gestion Chimin Savann, artistes, formalités |
| Kaïge-Jean | Kaige2026 | /workspace/kaige | Espace presse, communiqués, contacts médias |
| Alirio | Alirio2026 | /workspace/alirio | Business, IA assistant Claude intégrée |
| Wudy | Wudy2026 | /workspace/wudy | Comptabilité, budget prévisionnel/réel |
| Fabrice | Fabrice2026 | /workspace/fabrice | Captions live jour J, WebSocket |
| Data Analyst | DataCC2026 | /workspace/analyst | Réservé (poste à pourvoir) |

### 7. Assistant IA (Alirio) - NOUVEAU
- ✅ Intégration Claude via Emergent LLM key
- ✅ Contexte CC2026 injecté
- ✅ Interface chat professionnelle
- ✅ Questions fréquentes pré-définies

### 8. Logs & Monitoring (Admin Laurent) - NOUVEAU
- ✅ Logs connexion tous les membres
- ✅ Historique modifications en temps réel
- ✅ Sessions actives
- ✅ Accès rapide aux workspaces

## Technical Stack

### Frontend
- React 18
- React Router DOM
- Tailwind CSS + Shadcn/UI
- react-globe.gl (Globe 3D)
- qrcode.react (QR codes)
- axios
- sonner (toasts)

### Backend
- FastAPI
- MongoDB (Motor async)
- WebSocket/SSE
- emergentintegrations (Claude AI)

### External Services
- Baserow (accréditations)
- Cloudinary (médias)
- Stripe (paiements)
- Resend (emails)

## Design System
- **Couleurs**: #1C1A14 (charbon), #C4714A (terracotta), #D4A84B (gold), #4A5D4E (forest), #8B1A4A (burgundy)
- **Fonts**: Syne, Cormorant Garamond

## API Endpoints

### Workspace System
- POST /api/workspace/login - Connexion avec redirection
- POST /api/workspace/log - Ajout log activité
- GET /api/workspace/logs - Récupération logs
- GET /api/workspace/sessions - Sessions actives
- POST /api/workspace/logout - Déconnexion

### AI Assistant
- POST /api/ai/assistant - Chat avec Claude

### Baserow Integration (Frontend direct)
- GET /api/database/rows/table/865847/
- POST /api/database/rows/table/865847/
- PATCH /api/database/rows/table/865847/{id}/
- DELETE /api/database/rows/table/865847/{id}/

## Completed This Session (06/03/2026)

### ÉTAPE 1 - Refonte Accréditation ✅
- Nouveau design badge professionnel
- CRUD complet avec Baserow
- Export CSV et PDF
- Auto-validation QR scan

### ÉTAPE 2 - Système Workspaces ✅
- 8 workspaces dédiés
- Login unifié par mot de passe
- Logs et monitoring pour admin

### ÉTAPE 3 - Admin Renforcé ✅
- Tableau connexions
- Historique modifications
- Accès rapide workspaces

## Backlog / Future Tasks

### P1 - Priorité Haute
- [ ] Tester synchronisation WebSocket end-to-end
- [ ] Guide déploiement utilisateur
- [ ] Résoudre iframe Visual Editor (bloqué)

### P2 - Priorité Moyenne
- [ ] Refactoring CMSAdmin.jsx (monolithique)
- [ ] Refactoring server.py (monolithique)
- [ ] Persistance données workspaces en MongoDB

### P3 - Améliorations
- [ ] Indicateurs présence utilisateurs temps réel
- [ ] Export badges en masse (batch PDF)
- [ ] Intégration Stripe pour badges payants
- [ ] Dashboard analytics pour Data Analyst

## Credentials
- **Admin**: CC2026admin
- **Baserow Token**: BjKPCSpcpif72OtZtsmMFUbZysqlNGiK
- **Baserow Table**: 865847

## URLs
- **Preview**: https://badge-scan-portal.preview.emergentagent.com
- **Production**: https://kiltikonet.fr
