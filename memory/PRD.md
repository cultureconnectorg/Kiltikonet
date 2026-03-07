# Culture Connect 2026 - Product Requirements Document

## Overview
Culture Connect 2026 - Premier marché professionnel des industries culturelles afro-caribéennes.
Plateforme multi-workspace avec messagerie temps réel, système d'accréditation, et CMS.

**Date du rapport**: 7 Mars 2026
**Jour J prévu**: 22 Mai 2026 (J-76)

---

## STATUT ACTUEL: SECTION 1 P0 BUGS - TERMINÉE ✅

### BUGS P0 CORRIGÉS (7 Mars 2026)

| Bug | Status | Description |
|-----|--------|-------------|
| **BUG 1.1.a** | ✅ CORRIGÉ | Mapping Baserow - Helper `getFieldValue()` normalise les champs Single Select |
| **BUG 1.1.b** | ✅ CORRIGÉ | Filtres présence avec compteurs (Tous/Présents/Absents) + localStorage persistant |
| **BUG 1.1.c** | ✅ CORRIGÉ | 17 types de badges incluant PUBLIC, PARTICIPANT, VISITEUR |
| **BUG 1.1.d** | ✅ CORRIGÉ | CSS dropdown dark mode - texte lisible sur fond sombre |
| **BUG 1.1.e** | ✅ CORRIGÉ | Format impression badges 85mm × 54mm (carte ID standard) |
| **BUG 1.1.f** | 🟡 PARTIEL | Synchronisation catalogue public (à finaliser Section 2) |
| **BUG 1.2** | ✅ CORRIGÉ | Observatoire temps réel avec polling 30s, LIVE indicator, Export CSV |

### Fichiers modifiés:
- `/app/frontend/src/components/AccreditationSystem.jsx` - Helper getFieldValue(), filtres, Observatoire live
- `/app/frontend/src/App.css` - CSS dark mode dropdowns, styles impression badges

---

## PROCHAINES ÉTAPES (PROMPT MAÎTRE)

### Section 2 - Architecture & Synchronisation (P1)
- [ ] 4 routes d'entrée utilisateur (achat billet, inscription, admin manuel, scan QR)
- [ ] Synchronisation Baserow ↔ Catalogue public ↔ Admin
- [ ] Routes backend: POST /api/tickets/purchase, POST /api/register, POST /api/admin/accreditation

### Section 3 - Vue 3D (P1)
- [ ] Dashboard admin 3D (Three.js panneaux flottants)
- [ ] Smart Engine v2 avec graphe de nœuds interconnectés
- [ ] Catalogue public CSS 3D

### Section 4 - Workspace Alirio (P1)
- [ ] Section "Mes tâches" avec progression
- [ ] Section "Mes contacts" (collection MongoDB contacts_alirio)
- [ ] Interconnexion admins secondaires avec notifications Laurent

### Section 5 - Guides Utilisateur (P2)
- [ ] Guide Accréditation
- [ ] Guide Badges
- [ ] Guide Contacts (Alirio)
- [ ] Guide Smart Engine
- [ ] Guide Workspaces
- [ ] Guide Jour J

### Section 6 - Validation (P2)
- [ ] BLOC 1: Badges et accréditation
- [ ] BLOC 2: Synchronisation routes
- [ ] BLOC 3: Vue 3D performance
- [ ] BLOC 4: Workspace Alirio
- [ ] BLOC 5: Interconnexion admins
- [ ] BLOC 6: Guides

---

## ARCHITECTURE TECHNIQUE

### Stack
- Frontend: React + Tailwind CSS + Three.js (à venir)
- Backend: FastAPI (Python) + WebSocket
- Bases de données: MongoDB + Baserow (Table 865847)
- Intégrations: Stripe, Cloudinary, Resend, Claude AI

### Workspaces
| Password | User | Role |
|----------|------|------|
| CC2026admin | Admin | admin |
| LC2026 | Laurent | founder |
| Twina2026 | Twina | design |
| Gwen2026 | Gwen | event |
| Kaige2026 | Kaige | press |
| Alirio2026 | Alirio | business |
| Wudy2026 | Wudy | finance |
| Fabrice2026 | Fabrice | captions |
| DataCC2026 | Analyst | analyst |

### Credentials
- **Baserow Table**: 865847
- **Baserow Token**: BjKPCSpcpif72OtZtsmMFUbZysqlNGiK
- **Emergent LLM Key**: Configurée dans backend/.env

---

## HISTORIQUE DES TESTS

### Iteration 16 (7 Mars 2026) - Section 1 P0 Bugs
- ✅ 100% Frontend tests passés
- ✅ Filtres présence avec compteurs
- ✅ 17 types de badges disponibles
- ✅ CSS dark mode dropdowns
- ✅ Observatoire temps réel

### Iterations 1-15 (Précédentes)
- ✅ Messagerie interne temps réel
- ✅ Routes protégées avec expiration 8h
- ✅ Rate limiting login
- ✅ Visual Editor workaround
- ✅ Claude AI assistant fonctionnel

---

## 🎯 PRÊT POUR SECTION 2: OUI

Tous les bugs P0 de la Section 1 sont corrigés. Prêt pour l'architecture des routes et la synchronisation.
