# NFC_APP_SPEC.md — Mini-App NFC /scan — Architecture et Specification
# kiltikonet.fr — ITER.56 Phase 7.6
# Date : 2026-04-07

## Architecture

### 3 Ecrans

```
[ECRAN 1: AUTH]              [ECRAN 2: SCANNER]           [ECRAN 3: CONFIRMATION]
┌───────────────┐            ┌───────────────┐            ┌───────────────┐
│               │            │               │            │               │
│  Logo KN      │            │  Camera QR    │            │  PHOTO BADGE  │
│               │            │  ┌─────────┐  │            │  ┌─────────┐  │
│  Email        │    →       │  │ QR View │  │    →       │  │         │  │
│  [________]   │            │  └─────────┘  │            │  │  Jean D.│  │
│               │            │               │            │  └─────────┘  │
│  Code PIN     │            │  OU           │            │               │
│  [____]       │            │  Badge ID:    │            │  Type: VIP    │
│               │            │  [________]   │            │  Statut: OK   │
│  [CONNEXION]  │            │               │            │  Scan #3      │
│               │            │  [NFC] si web │            │               │
│               │            │  NFC actif    │            │  [SCAN SUIV.] │
└───────────────┘            └───────────────┘            └───────────────┘
```

## Ecran 1 : Auth Agent

### Composant : `ScanLogin.jsx`
- Input email agent
- Input code PIN (6 chiffres)
- Bouton connexion
- Logo Kiltikonet minimaliste
- Auth via `POST /api/pro/request-access` + `POST /api/pro/verify-code`
- Verification que l'agent a le role `agent_terrain` ou `admin`

## Ecran 2 : Scanner

### Composant : `ScanCamera.jsx`
- Camera QR via `html5-qrcode` (deja installe dans le projet)
- Champ de saisie manuelle du badge_id
- Bouton NFC via Web NFC API (`navigator.nfc`) si disponible
- Selection de la zone d'acces (dropdown) : Entree, VIP, Backstage, Technique
- Selection du jour : J1, J2, J3, J4
- Bouton "Scanner" pour la saisie manuelle

### Flow de Scan :
1. QR decode → badge_id extrait automatiquement
2. OU saisie manuelle → badge_id tape
3. OU NFC tap → badge_id lu via Web NFC
4. → `POST /api/terrain/scan` (endpoint existant + Omega skeleton)
5. → Resultat affiche sur Ecran 3

## Ecran 3 : Confirmation

### Composant : `ScanResult.jsx`
- Photo du badge (si disponible)
- Nom complet
- Type de badge
- Statut mis a jour (NFC_ACTIF / DEJA_SCANNE / INCONNU)
- Nombre de scans aujourd'hui
- Bouton "Scan suivant" → retour Ecran 2
- Couleur de fond :
  - Vert : scan valide
  - Orange : deja scanne aujourd'hui
  - Rouge : badge inconnu ou bloque

## Endpoint Backend

```python
POST /api/terrain/scan
# Deja existant dans server.py, mais aussi dans skeleton_omega.py (mock)
# A iter.58 : connecter le scan reel avec :
# 1. Verification badge dans cc_badges
# 2. Update statut → NFC_ACTIF
# 3. Ecriture dans audit_log
# 4. Ecriture dans Baserow (table 865847) si configure
```

## PWA Configuration

- `manifest.json` : `"display": "standalone"`, `"orientation": "portrait"`
- Offline : Cache les assets statiques, afficher message "hors connexion" si pas de reseau
- Le scan necessit le reseau pour valider le badge cote serveur

## Route Frontend
- `/scan` → `ScanApp.jsx` (composant independant, pas dans l'Espace Pro)

---

# BRAIN_FUSION_PLAN.md — Plan de Fusion CVL Brain
# Date : 2026-04-07

## Objectif
Fusionner le design du BrainChat.tsx (ZIP Omega) avec la logique backend existante (endpoints, auth, thought process).

## Ce qui vient du ZIP Omega (UI)
- Split panel : sidebar historique (gauche) + chat (droite)
- Boutons feedback (thumbs up/down)
- Copie de la reponse
- Support Markdown (react-markdown + Prism)
- Indicateurs de typing anime
- Toggle sidebar
- 4 outils : Terminal, Code, Layout, Globe
- Design : OLED black, gold accents, font Space Grotesk + Noto Serif

## Ce qui vient du Core Existant (Logique)
- Endpoint `/api/brain/chat` (session_id persistant)
- Endpoint `/api/brain/chat-enriched` (multi-turn + web search + archives)
- Thought process visible ("Premye bagay...", "Apre sa...")
- Auth via cookie kk_session + doctrine gate `use_terminal_ia`
- Prompt systeme complet (`cvl_brain_knowledge.py`)
- Gestion memoire (`brain_memory` collection)
- 12 outils/endpoints Brain (analyse, web-search, etc.)

## Plan de Fusion

### Etape 1 : Creer `omega/BrainChat.jsx`
- Convertir BrainChat.tsx en JSX (retirer les types TypeScript)
- Garder le layout split panel + sidebar

### Etape 2 : Connecter aux endpoints existants
- Remplacer les appels API mockés du ZIP par les vrais endpoints :
  - Chat : `/api/brain/chat` (avec session_id)
  - Memoire : `/api/brain/memory/*`
  - Recherche web : `/api/brain/web-search`

### Etape 3 : Ajouter les outils existants
- Enrichir la barre d'outils avec les 12 endpoints Brain existants
- Chaque outil envoie le message avec un `tool_type` specifique

### Etape 4 : Integrer le thought process
- Afficher le "thinking" du Brain dans un bloc collapsible
- Style : italic, couleur attenuee, icone cerveau

### Etape 5 : Auth + Doctrine
- Utiliser le hook `useAuth()` pour verifier `can["use_terminal_ia"]`
- Afficher "Acces reserve" si pas les permissions

## Fichiers concernes
- `/app/frontend/src/components/omega/BrainChat.jsx` (NOUVEAU)
- `/app/frontend/src/hooks/useBrain.js` (EXISTANT — enrichir)
- `/app/backend/routes/brain.py` (EXISTANT — ne pas modifier)
- `/app/backend/services/cvl_brain_knowledge.py` (MODIFIE — prompt creole)
- `/app/backend/server.py` (MODIFIE — fix coupure conversation)
