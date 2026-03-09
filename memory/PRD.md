# Culture Connect 2026 - Product Requirements Document

## Overview
Culture Connect 2026 - Premier marché professionnel des industries culturelles afro-caribéennes.
Plateforme multi-workspace avec messagerie temps réel, système d'accréditation, CMS, Dashboard Collaboratif, **Espace Pro** et **Application Mobile PWA**.

**Date du rapport**: 9 Mars 2026
**Jour J prévu**: 22 Mai 2026 (Chimin Savann)

---

## STATUT: ESPACE PRO + PWA MOBILE COMPLETS ✅

### APPLICATION MOBILE PWA (9 Mars 2026) ✅ COMPLET
- ✅ **Service Worker** (sw.js) avec stratégies de cache :
  - Cache-first pour assets statiques
  - Network-first pour APIs
  - Stale-while-revalidate pour contenu dynamique
- ✅ **Navigation mobile** (bottom nav) - UNIQUEMENT < 768px :
  - Navigation publique : Accueil, Catalogue, Programme, (Espace Pro/Admin)
  - Navigation admin : Accueil, Scanner, Inscrits, Config
  - Navigation pro : Profil, Réseau, Offres, Agenda
- ✅ **Admin Mobile Dashboard** :
  - Scanner QR Code (html5-qrcode)
  - Stats : Total, Aujourd'hui, En attente
  - Dernières inscriptions avec temps relatif
  - Design élégant fond clair (#F4F1EA)
- ✅ **Mode hors-ligne** :
  - IndexedDB via OfflineCache.js
  - Sync queue pour actions en attente
  - Indicateur de statut connexion
- ✅ **Détection appareil** (useDeviceDetect) :
  - isMobile < 768px
  - isTablet 768-1024px
  - isDesktop > 1024px
- ✅ **Vérification des rôles** :
  - Admin/Founder → Navigation admin
  - Pro → Navigation pro
  - Public → Navigation publique
- ✅ **Tests passés 100%** (iteration_22.json) : 16/16 features

**Routes API Analytics & Notifications :**
| Route | Description |
|-------|-------------|
| POST /api/analytics/batch | Envoi batch d'événements tracking |
| GET /api/analytics/dashboard | Dashboard analytics admin |
| GET /api/analytics/behavior/{id} | Analyse comportement utilisateur |
| GET /api/team/notifications | Liste notifications équipe |
| POST /api/team/notifications/create | Créer notification manuelle |
| POST /api/team/notifications/mark-all-read | Marquer toutes lues |
| GET /api/pro/recommendations/{id} | Recommandations personnalisées |

### ESPACE PRO CC2026 - LinkedIn Culturel (9 Mars 2026) ✅ COMPLET
- ✅ Page de connexion via code d'accès email (magic link)
- ✅ Dashboard professionnel avec 5 sections FONCTIONNELLES :
  - Mon Profil (édition bio, liens, recherches/offres)
  - Réseau Pro (annuaire avec filtres, connexions)
  - Messages (messagerie privée)
  - Opportunités (7 offres réelles - Booking, Business, Subvention, Formation, Emploi)
  - Agenda (7 événements CC2026 du 20-23 Mai 2026)
- ✅ Protection des données de contact (email/téléphone visibles uniquement aux connectés)
- ✅ Bouton "Espace Pro" ajouté dans le header du site public
- ✅ Couleurs cohérentes avec le site public (charbon, gold, terracotta, cream)
- ✅ Tests passés à 100% (iteration_19.json, iteration_20.json)

**Fonctionnalités Opportunités :**
- Filtres par type (Booking, Business, Subvention, Formation, Emploi)
- Indicateur de jours restants avant deadline
- Bouton Postuler avec formulaire de candidature
- Modal création d'opportunité
- Badges de type colorés

**Fonctionnalités Agenda :**
- Vue timeline groupée par date
- Filtres par type (Networking, Formation, Conférence, Concert, Atelier)
- Inscription aux événements avec jauge de places
- Indicateur "Inscrit" après inscription

**Routes API Espace Pro :**
| Route | Description |
|-------|-------------|
| POST /api/pro/request-access | Demande de code d'accès par email |
| POST /api/pro/verify-code | Vérification du code et authentification |
| GET /api/pro/profile/{id} | Récupération du profil |
| PUT /api/pro/profile/{id} | Mise à jour du profil |
| GET /api/pro/connections/{id} | Liste des connexions |
| POST /api/pro/connect | Demande de connexion |
| GET/POST /api/pro/messages/{id} | Gestion des messages |
| GET /api/pro/opportunities | Liste des opportunités |
| GET /api/pro/events | Liste des événements |

### TÂCHE 2 - INTÉGRATION DASHBOARD WORKSPACES (9 Mars 2026) ✅
- ✅ Bouton "Dashboard CC2026" ajouté dans AdminDashboard header
- ✅ Bouton "CC2026" ajouté dans GwenWorkspace header
- ✅ Bouton "CC2026" ajouté dans FabriceWorkspace header
- ✅ Bouton "CC2026" ajouté dans KaigeWorkspace header
- ✅ Bouton "CC2026" ajouté dans AlirioWorkspace header
- ✅ Bouton "CC2026" ajouté dans WudyWorkspace header
- ✅ Tous les workspaces ont un accès direct au dashboard

### TÂCHE 3 - MOBILE RESPONSIVE DASHBOARD CC2026 (9 Mars 2026) ✅
- ✅ Top Bar condensé en mobile (stats en scroll horizontal)
- ✅ Boutons "Mon Pôle" / "Vue Globale" adaptés
- ✅ Week Headers compacts avec badges phase abrégés (📍 Métro)
- ✅ Task Cards avec layout flexible (badges inline sur mobile)
- ✅ Pole Stats en grille 5 colonnes mobile / 9 colonnes desktop
- ✅ Header global masqué sur /dashboard-cc2026
- ✅ Banner Jour J responsive
- ✅ Test 100% passés (iteration_18.json)

### SECTION 1 - BUGS P0 CORRIGÉS (7 Mars 2026)
| Bug | Status | Description |
|-----|--------|-------------|
| 1.1.a | ✅ | Mapping Baserow - `getFieldValue()` helper |
| 1.1.b | ✅ | Filtres présence avec compteurs (Tous/Présents/Absents) |
| 1.1.c | ✅ | 17 types de badges (PUBLIC, PARTICIPANT, VISITEUR inclus) |
| 1.1.d | ✅ | CSS dropdown dark mode |
| 1.1.e | ✅ | Format impression badges 85×54mm |
| 1.2 | ✅ | Observatoire temps réel avec polling 30s, Export CSV |

### SECTION 2 - ROUTES & SYNCHRONISATION (9 Mars 2026)
| Route | Status | Description |
|-------|--------|-------------|
| POST /api/tickets/purchase | ✅ | Achat billet → Baserow + MongoDB |
| POST /api/register | ✅ | Inscription site → MongoDB + Baserow |
| POST /api/admin/accreditation | ✅ | Admin ajoute → Baserow uniquement |
| GET/PATCH /api/badge/{id} | ✅ | Scan QR → validation présence < 3s |
| GET /api/catalog/sync | ✅ | Catalogue public synchronisé |

### SECTION 3 - VUE 3D (9 Mars 2026) ⚠️ EN PAUSE
- ✅ Dashboard3D.jsx - Panneaux 3D flottants avec Three.js (lazy loaded)
- ✅ SmartEngine3D.jsx - Graphe de nœuds interconnectés
- ✅ Fallback automatique 2D si WebGL désactivé
- ⚠️ BLOCAGE: Incompatibilité React 19 / Three.js - Fallback 2D actif

### SECTION 4 - WORKSPACE ALIRIO (9 Mars 2026)
- ✅ Onglet "Mes tâches" avec progression et filtres
- ✅ Onglet "Mes contacts" avec ajout et promotion partenaire
- ✅ Routes backend /api/contacts/alirio

### SECTION 5 - GUIDES UTILISATEUR (9 Mars 2026)
- ✅ 6 guides intégrés (UserGuides.jsx)
- ✅ Boutons "?" accessibles dans chaque interface
- ✅ Guide Accréditation, Badges, Contacts, Smart Engine, Workspaces, Jour J

### SYSTÈME DE PERMISSIONS GRANULAIRES (9 Mars 2026) ✅
- ✅ 28 permissions définies dans 9 catégories
- ✅ Interface de gestion pour Laurent (Fondateur)
- ✅ Permissions par défaut par rôle
- ✅ Personnalisation par checkbox (activer/désactiver)
- ✅ Sauvegarde locale (localStorage)
- ✅ Hook `usePermissions()` pour intégration facile
- ✅ Composant `<PermissionGate>` pour rendu conditionnel

**Catégories de permissions :**
| Catégorie | Permissions |
|-----------|-------------|
| Données | Voir/Modifier/Supprimer inscriptions, Exporter |
| Business | Voir/Modifier/Supprimer contacts, Promouvoir partenaires |
| Finances | Voir/Modifier finances, Approuver dépenses |
| Accréditations | Voir/Modifier, Imprimer/Scanner badges |
| Événementiel | Voir/Modifier artistes, Gérer planning |
| Communication | Communiqués, Presse, CMS |
| Dashboard | Voir, Modifier ses tâches, Modifier toutes |
| Administration | Activité équipe, Workspaces, Mots de passe, Messages |
| Régie | Activer live, Sous-titres |

### CENTRE DE CONTRÔLE FONDATEUR (9 Mars 2026) ✅
- ✅ Navigation inter-workspaces (accès direct à 8 workspaces)
- ✅ Gestion des mots de passe (afficher/masquer/modifier)
- ✅ Logs d'activité de toute l'équipe
- ✅ Gestion des inscriptions site public (voir/supprimer)
- ✅ Accès rapides: Dashboard CC2026, Accréditations, CMS

### PERSISTANCE DES SESSIONS (9 Mars 2026) ✅
- ✅ Option "Se souvenir de moi" (30 jours)
- ✅ Sessions stockées dans localStorage
- ✅ Expiration automatique configurable
- ✅ Backward compatible avec sessionStorage

### AUDIT & OPTIMISATION UX (9 Mars 2026) ✅
- ✅ Création d'un système de design tokens partagés (`/app/frontend/src/lib/design-tokens.js`)
- ✅ Création d'un composant Header unifié (`WorkspaceHeader.jsx`)
- ✅ Harmonisation des 8 workspaces avec headers cohérents
- ✅ Bouton CC2026 unifié (style or, même design partout)
- ✅ Avatar coloré par rôle avec glow subtil
- ✅ Ajout du workspace Twina au Dashboard CC2026
- ✅ Correction du workspace Laurent (accès CC2026 ajouté)

**Workspaces mis à jour :**
| Workspace | Couleur | Bouton CC2026 |
|-----------|---------|---------------|
| Laurent   | Or      | ✅ |
| Twina     | Rose    | ✅ |
| Gwen      | Vert    | ✅ |
| Kaige     | Cyan    | ✅ |
| Alirio    | Terracotta | ✅ |
| Wudy      | Vert    | ✅ |
| Fabrice   | Violet  | ✅ |
- ✅ DashboardCC2026.jsx - Dashboard collaboratif complet
- ✅ 115 tâches réparties sur 11 semaines (S1 à S11)
- ✅ 9 pôles (Fondateur, Financement, Juridique, Gwen, Fabrice, Comm, Business, Admin, Digital)
- ✅ Vue "Mon Pôle" - édition des tâches du workspace
- ✅ Vue "Globale" - lecture seule (sauf admin)
- ✅ Polling 30 secondes pour sync temps réel
- ✅ Checkpoints et deadlines visuelles
- ✅ Routes protégées par workspace
- ✅ Design fidèle au HTML de référence
- ✅ **RESPONSIVE MOBILE** (9 Mars 2026)

---

## ARCHITECTURE

### Stack
- Frontend: React 19 + Tailwind CSS + Three.js (lazy)
- Backend: FastAPI (Python) + WebSocket
- Bases de données: MongoDB + Baserow (Table 865847)
- Intégrations: Stripe, Cloudinary, Claude AI

### Routes Dashboard CC2026
| Route | Workspace | Pôles éditables |
|-------|-----------|-----------------|
| /dashboard-cc2026 | CC2026admin | TOUS |
| /dashboard-cc2026/gwen | Gwen2026 | gwen |
| /dashboard-cc2026/fabrice | Fabrice2026 | fabrice |
| /dashboard-cc2026/kaige | Kaige2026 | digital |
| /dashboard-cc2026/alirio | Alirio2026 | digital |
| /dashboard-cc2026/wudy | Wudy2026 | comm |

### Workspaces
| Password | User | Role |
|----------|------|------|
| CC2026admin | Admin | admin |
| LC2026 | Laurent | founder |
| Gwen2026 | Gwen | event |
| Fabrice2026 | Fabrice | captions |
| Kaige2026 | Kaige | press |
| Alirio2026 | Alirio | business |
| Wudy2026 | Wudy | finance |

---

## PROBLÈMES CONNUS

### React 19 / Three.js Incompatibilité (P2)
- **Status**: BLOQUÉ - Contournement 2D en place
- **Cause**: @react-three/fiber incompatible avec React 19
- **Solution temporaire**: Fallback 2D automatique

### Visual Editor iframe (P2)
- **Status**: Contournement window.open actif
- **Cause**: Blocage cross-origin
- **Solution temporaire**: Ouverture dans nouvel onglet

---

## TESTS DE VALIDATION

### Tests effectués (iteration_21.json) - PWA Mobile
- ✅ Navigation mobile 4 onglets fonctionnelle
- ✅ Service Worker enregistré et actif
- ✅ POST /api/analytics/batch fonctionne
- ✅ GET /api/analytics/dashboard fonctionne
- ✅ GET /api/team/notifications fonctionne
- ✅ Manifest.json avec shortcuts valides
- ✅ Login Espace Pro sur mobile fonctionne
- ✅ Backend 100% (21/21), Frontend 100%

### Tests effectués (iteration_20.json) - Espace Pro Opportunités & Agenda
- ✅ 7 opportunités réelles affichées avec filtres par type
- ✅ 7 événements CC2026 (20-23 Mai 2026) avec vue timeline
- ✅ Bouton Postuler fonctionne avec formulaire candidature
- ✅ Bouton S'inscrire fonctionne pour événements
- ✅ Modal création opportunité fonctionnel
- ✅ Navigation entre toutes les sections
- ✅ Backend 100% (17/17 tests), Frontend 100%

### Tests effectués (iteration_19.json) - Espace Pro Base
- ✅ Page connexion Pro affichage correct avec couleurs
- ✅ Bouton 'Espace Pro' visible dans header site public
- ✅ API /api/pro/request-access fonctionne pour emails approuvés
- ✅ API /api/pro/verify-code valide les codes
- ✅ ProfileModal masque contacts aux non-connectés
- ✅ Dashboard Pro accessible après connexion
- ✅ Navigation latérale fonctionnelle

### Tests effectués (iteration_18.json) - Dashboard CC2026
- ✅ Dashboard CC2026 Mobile (375px) - 100% passé
- ✅ Dashboard CC2026 Desktop (1920px) - 100% passé
- ✅ Header global masqué sur /dashboard-cc2026
- ✅ Pole Stats responsive (5 cols mobile, 9 cols desktop)

---

## TÂCHES FUTURES (BACKLOG)

### P1 - Mode Hors-Ligne Dashboard CC2026 ✅ TERMINÉ
- [x] Cache local des tâches avec IndexedDB
- [x] Sync différée quand connexion rétablie
- [x] Indicateur visuel mode offline/online

### P2 - Vue 3D (Prochaine session)
- [ ] Vérifier si solution React 19 / Three.js disponible
- [ ] SI solution disponible → Réactiver Dashboard3D et SmartEngine3D
- [ ] SINON → Conserver fallback 2D actuel
- **Note** : Ne pas forcer la 3D si incompatibilité persiste

### P2 - Visual Editor
- [ ] Résoudre blocage iframe cross-origin
- [ ] Remplacer window.open par intégration iframe

---

## 📅 SESSION TERMINÉE - 9 Mars 2026

### ✅ COMPLÉTÉ AUJOURD'HUI - Performances + Mobile + Sécurité

**1. Tableau de Bord des Performances ✅ NOUVEAU**
- `/admin/performance` - Dashboard complet pour suivre conversions et engagement
- 6 KPIs temps réel : Inscriptions, Approuvées, En attente, Pages vues, Profils, Utilisateurs actifs
- Funnel de Conversion avec taux %
- Engagement Espace Pro (interactions, connexions, messages)
- Pages populaires et alertes trafic
- Auto-refresh toutes les 60 secondes
- Bouton "Performances" ajouté dans WorkspaceLaurent

**2. Mode Terrain Sécurisé ✅**
- Retiré le lien `/admin/mobile` de la navigation publique
- Le Mode Terrain est maintenant accessible UNIQUEMENT aux admins connectés
- Commentaires ajoutés pour clarifier que c'est un accès PRIVÉ

**3. Workspaces Responsive Mobile ✅**
- `WorkspaceHeader.jsx` - Menu hamburger mobile ajouté
- `WorkspaceLaurent.jsx` - KPIs grille 2x2, onglets abrégés, bouton Performances
- `WorkspaceGwen.jsx` - Onglets scrollables, header compact
- `WorkspaceKaige.jsx` - Stats responsive, onglets courts
- `WorkspaceTwina.jsx` - Navigation horizontale mobile

**4. Optimisations Backend ✅**
- N+1 query corrigé dans `/api/pro/recommendations`
- `DB_NAME` changé à "culture_connect_2026"
- `SENDER_EMAIL` format .env corrigé
- `BACKEND_API_URL` ajouté au smart-engine
- Tous les bloquants déploiement résolus

**Tests passés à 100%** (iteration_24.json, iteration_25.json):
- Performance Dashboard ✅
- Navigation mobile 4 onglets ✅
- Mode Terrain privé ✅
- 4 workspaces responsive ✅
- APIs analytics/registrations ✅

---

## TÂCHES RESTANTES

### P0 - Smart Engine Avancé (En cours - Bases posées)
1. **✅ Analytics Tracking** - Service frontend + routes backend en place
2. **✅ Recommandations Pro** - Route `/api/pro/recommendations/{id}` fonctionnelle
3. **✅ Performance Dashboard** - Suivi conversions et engagement complet
4. **À ENRICHIR** : Notifications automatiques pour anomalies détectées

### P2 - Vue 3D (En pause)
- Incompatibilité React 19 / Three.js - Fallback 2D actif

### P2 - Visual Editor
- Blocage iframe cross-origin - window.open en contournement

---

## 🎯 APPLICATION PRÊTE POUR DÉPLOIEMENT + PWA MOBILE STABILISÉE
