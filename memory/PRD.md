# PRD — Kiltikonet.fr / CC2026
# ==============================

## Objectif
Plateforme culturelle caribéenne full-stack (React 19 + FastAPI + MongoDB).
Ecosystème "Stitch Sovereign Onyx" avec Espace Pro à 14 écrans, Wallet Stripe, CVL Brain IA,
Feed/Reels dynamiques, gouvernance associative, certification FREK-ID.

## Architecture
- Frontend: React 19 (CRA/Craco), TailwindCSS 3, shadcn/ui
- Backend: FastAPI, MongoDB (culture_connect_2026)
- Auth: FREK-ID, GitHub OAuth, Magic Links, OTP Email
- LLM: Claude Sonnet via Emergent LLM Key
- Paiements: Stripe Checkout

## ITER.56 — Audit Systeme Complet (2026-04-07) TERMINE

### Livrables Produits
22 documents d'ingénierie couvrant :
- Radiographie système (CORE_SNAPSHOT, ENDPOINT_MAP, MONGO_SCHEMA, AUTH_FLOW, BRAIN_AUDIT, PARAMS_AUDIT)
- Conflits ZIP Omega x Core (DEPENDENCY_RESOLUTION, CONFLICT_REPORT + MISSING_ENDPOINTS)
- FREK-ID & Traçabilité (FREK_AUDIT + BLOCKCHAIN_GAP + TRACABILITY_SCHEMA)
- Fintech (WALLET_AUDIT + JETON_STRATEGY + SHOP_AUDIT + TRADE_SPEC + FINTECH_COMPLIANCE)
- Adhésion & Gouvernance (ADHESION_AUDIT + GOUVERNANCE_AUDIT)
- Console Terminal (TERMINAL_SPEC + TERMINAL_ARCH)
- Architecture Cible (FILE_TREE_TARGET + omega.ts + 12 hooks + skeleton routes + NFC_APP_SPEC + BRAIN_FUSION_PLAN)
- Validation (ITER56_VALIDATION + EXEC_SUMMARY)

### Code Additif Créé
- `src/types/omega.ts` : 350+ lignes d'interfaces TypeScript (référence)
- `src/hooks/` : 12 hooks avec signatures complètes (useAuth, useWallet, useFeed, useBrain, useNFC, useShop, useTrade, useAdhesion, useGouvernance, useTerminal, useFrek, useSettings)
- `backend/routes/skeleton_omega.py` : 14 endpoints actifs avec mocks réalistes
- Fix Brain : prompt créole + coupure conversation (historique dans prompt)

### Découvertes Critiques
1. Brain rejouait l'historique via O(n) appels API → corrigé
2. FREK-ID = string aléatoire, pas DID, pas on-chain
3. Plafond 150€ non enforcé (risque réglementaire)
4. Adhésion/Gouvernance/Trade = 0% implémenté
5. 18 collections MongoDB vides
6. Settings = coquille vide

### 3 Décisions Business Remontées
1. Prix des packs Jeton CC (10/50/100 JCC)
2. Rollover CC2027 des jetons non utilisés
3. Timing création Holding (impact émetteur)

## Backlog Post-ITER.56

### iter.57 (P0) : Scaffolding React
- Installer dépendances (motion, react-markdown, @monaco-editor/react)
- Ajouter classes CSS Omega dans tailwind.config.js
- Créer AuthContext + WalletContext
- Convertir composants Omega TSX → JSX
- Créer ProApp.jsx et brancher /espace-pro

### iter.58 (P0) : Backend Complet
- Endpoints réels (remplacer mocks skeleton_omega)
- Collections MongoDB (adhesions, gouvernance, trade, terminal_deploys, audit_logs)
- Wallet CC séparé
- Plafond 150 EUR
- Stripe Subscriptions pour adhésion

### iter.59 (P1) : Intégration UI + Tests
- Connecter composants Omega aux endpoints
- Tests E2E complets
- PWA /scan terrain

### iter.60 (P1) : Production
- Performance (lazy loading, code splitting)
- Déploiement production
- Migration DNS kiltikonet.fr

### Backlog Technique
- (P2) Refactoring server.py (>9800 lignes)
- (P2) DNS IONOS
- (P3) AWS SES sortie sandbox
- (P3) Three.js vue 3D (bloqué React 19)
- (P3) RGPD : endpoint suppression de compte
