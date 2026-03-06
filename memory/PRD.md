# Culture Connect 2026 (CC2026) - PRD

## Project Overview
Premier marché professionnel des industries culturelles afro-descendantes.
- **Date**: 22 Mai 2026
- **Lieu**: La Savane, Fort-de-France, Martinique
- **Site**: kiltikonet.fr
- **Organisateur**: CVLN (Laurent Coeurvolan)

## Core Features Implemented

### 1. Public Website (kiltikonet.fr) ✅
- Landing page cinématique avec animations scroll
- Globe 3D interactif (react-globe.gl)
- Carousel partenaires animé
- Programme détaillé (/programme)
- Formulaire d'inscription avec paiement Stripe
- Catalogue des participants
- Pages légales (CGU, RGPD, Cookies)
- SEO complet (meta tags, JSON-LD, sitemap)

### 2. Admin Dashboard (/admin) ✅
- Authentification par mot de passe (CC2026admin)
- Gestion des inscriptions (CRUD)
- Validation/approbation des participants
- Export CSV des données
- Statistiques temps réel
- Envoi d'emails (Resend)

### 3. CMS Admin (/admin/cms) ✅
- Gestion du contenu du site
- Upload médias (Cloudinary)
- Configuration thème et couleurs
- Gestion partenaires

### 4. Système d'Accréditation (/admin/accreditation) ✅
- Intégration Baserow (Table 865847)
- Liste participants avec CRUD complet
- Générateur de badges professionnels (design CC2026)
- QR Code intégré pour validation
- Export CSV liste + Export PDF badge format événement
- Auto-validation présence sur scan (/badge/:id)

### 5. Système Multi-Workspaces ✅ (COMPLET)

| Membre | Mot de passe | Workspace | Fonctionnalités |
|--------|-------------|-----------|-----------------|
| **Admin** | CC2026admin | /admin | Dashboard admin existant |
| **Laurent (LC)** | LC2026 | /workspace/laurent | Vue d'ensemble, alertes temps réel, logs connexion, historique modifications, statut chantiers, accès rapide workspaces |
| **Twina** | Twina2026 | /workspace/twina | CMS visuel dédié, gestion visuels, section Hero/Partenaires/Programme |
| **Gwen** | Gwen2026 | /workspace/gwen | Gestion artistes (Kathy confirmée), formalités, planning jour J, logistique, notes production |
| **Kaïge-Jean** | Kaige2026 | /workspace/kaige | Communiqués de presse, carnet contacts médias, accréditations presse, couverture médiatique |
| **Alirio** | Alirio2026 | /workspace/alirio | **IA Claude intégrée**, registre partenaires, agenda, notes réunion, contacts |
| **Wudy** | Wudy2026 | /workspace/wudy | Budget prévisionnel (97 750€), dépenses réelles, documents financiers |
| **Fabrice** | Fabrice2026 | /workspace/fabrice | Régie live captions, séquenceur écrans, captation vidéo, photos |
| **Data Analyst** | DataCC2026 | /workspace/analyst | Réservé (poste à pourvoir) |

### 6. Système de Notifications Push ✅ (NOUVEAU)
- **Notifications temps réel** vers Laurent pour chaque action importante
- **Types de notifications** :
  - `artiste_confirmed` : Gwen confirme un artiste → alerte LC
  - `expense_added` : Wudy ajoute une dépense → alerte LC
  - `communique_sent` : Kaïge envoie un communiqué → alerte LC
  - `live_active` : Fabrice active la régie → alerte LC
  - `partner_added` : Alirio ajoute un partenaire → alerte LC
  - `urgent_message` : Message urgent depuis régie
- **NotificationBell** : Badge avec compteur dans l'en-tête
- **Logs MongoDB** : Toutes les notifications persistées

### 7. Assistant IA (Alirio) ✅
- Intégration Claude via Emergent LLM key
- Contexte CC2026 complet injecté (équipe, budget, partenaires, dates)
- Interface chat professionnelle avec questions suggérées

## Budget CC2026 (97 750€ HT)

### Revenus prévisionnels
- Partenariat Or (x2) : 20 000€
- Partenariat Silver (x5) : 12 500€
- Partenariat Bronze (x10) : 10 000€
- Subvention CTM : 25 000€
- Subvention DAC : 10 000€
- France Travail : 5 000€
- Billetterie (500 places) : 7 500€
- Stands exposants (x10) : 5 000€
- Ventes annexes : 2 750€

### Dépenses prévisionnelles
- Cachets artistes : 25 000€
- Location scène + backline : 15 000€
- Sono + lumière : 12 000€
- Sécurité + SSIAP : 8 000€
- Communication print : 5 000€
- Communication digitale : 3 000€
- Logistique événement : 10 000€
- Assurances : 3 000€
- SACEM / GUSO : 4 000€
- Frais administratifs : 2 000€
- Captation vidéo : 5 000€
- Imprévus (5%) : 5 750€

## Technical Stack

### Frontend
- React 18
- React Router DOM
- Tailwind CSS + Shadcn/UI
- react-globe.gl (Globe 3D)
- qrcode (QR codes)
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
- Claude AI (assistant)

## Design System
- **Couleurs**: #1C1A14 (charbon), #C4714A (terracotta), #D4A84B (gold), #4A5D4E (forest), #8B1A4A (burgundy), #00BCD4 (teal), #9C27B0 (purple), #4CAF50 (green), #E91E63 (pink)
- **Fonts**: Syne, Cormorant Garamond

## API Endpoints

### Workspace System
- POST /api/workspace/login - Connexion avec redirection
- POST /api/workspace/log - Ajout log activité
- GET /api/workspace/logs - Récupération logs
- GET /api/workspace/sessions - Sessions actives
- POST /api/workspace/logout - Déconnexion

### Notification System
- POST /api/notifications/send - Envoyer notification
- GET /api/notifications/{target} - Récupérer notifications
- PATCH /api/notifications/{id}/read - Marquer comme lu
- PATCH /api/notifications/{target}/read-all - Tout marquer lu

### AI Assistant
- POST /api/ai/assistant - Chat avec Claude

## Completed This Session (06/03/2026)

### ÉTAPE 1 - Refonte Accréditation ✅
- Nouveau design badge professionnel
- CRUD complet avec Baserow
- Export CSV et PDF
- Auto-validation QR scan

### ÉTAPE 2 - Système Workspaces ✅
- 8 workspaces dédiés avec fonctionnalités complètes
- Login unifié par mot de passe
- IA Claude intégrée pour Alirio
- Budget 97 750€ pour Wudy

### ÉTAPE 3 - Admin Renforcé ✅
- Alertes récentes (notifications)
- Sessions équipe en temps réel
- Historique modifications
- Statut des chantiers

### ÉTAPE 4 - Notifications Push ✅
- Système de notifications temps réel
- Chaque action importante → alerte LC
- Badge compteur dans header
- Logs MongoDB persistés

## Backlog / Future Tasks

### P1 - Priorité Haute
- [ ] Tester synchronisation WebSocket end-to-end
- [ ] Résoudre iframe Visual Editor (bloqué)

### P2 - Priorité Moyenne
- [ ] Refactoring CMSAdmin.jsx et server.py
- [ ] Persistance données workspaces en MongoDB

### P3 - Améliorations
- [ ] Indicateurs présence utilisateurs temps réel
- [ ] Export badges en masse (batch PDF)
- [ ] Dashboard analytics pour Data Analyst

## Credentials
- **Admin**: CC2026admin
- **Laurent**: LC2026
- **Twina**: Twina2026
- **Gwen**: Gwen2026
- **Kaige**: Kaige2026
- **Alirio**: Alirio2026
- **Wudy**: Wudy2026
- **Fabrice**: Fabrice2026
- **DataAnalyst**: DataCC2026
- **Baserow Token**: BjKPCSpcpif72OtZtsmMFUbZysqlNGiK
- **Baserow Table**: 865847

## URLs
- **Preview**: https://role-access-hub-2.preview.emergentagent.com
- **Production**: https://kiltikonet.fr
