# Culture Connect 2026 - Product Requirements Document

## Overview
Culture Connect 2026 - Premier marché professionnel des industries culturelles afro-caribéennes.
Plateforme multi-workspace avec messagerie temps réel, système d'accréditation, CMS, et Dashboard Collaboratif.

**Date du rapport**: 9 Mars 2026
**Jour J prévu**: 22 Mai 2026 (Chimin Savann)

---

## STATUT: SECTIONS 1-5 + DASHBOARD CC2026 + TÂCHES 2-3 TERMINÉES ✅

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

### DASHBOARD CC2026 / CHIMIN SAVANN (9 Mars 2026)
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

### Tests effectués (iteration_18.json)
- ✅ Dashboard CC2026 Mobile (375px) - 100% passé
- ✅ Dashboard CC2026 Desktop (1920px) - 100% passé
- ✅ Header global masqué sur /dashboard-cc2026
- ✅ Pole Stats responsive (5 cols mobile, 9 cols desktop)

---

## TÂCHES FUTURES (BACKLOG)

### P2 - Vue 3D
- [ ] Résoudre incompatibilité React 19 / Three.js
- [ ] Réactiver Dashboard3D et SmartEngine3D

### P2 - Visual Editor
- [ ] Résoudre blocage iframe cross-origin
- [ ] Remplacer window.open par intégration iframe

---

## 🎯 PRÊT POUR PRODUCTION (Mobile + Desktop)
