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
22 documents d'ingénierie (CORE_SNAPSHOT, ENDPOINT_MAP, MONGO_SCHEMA, AUTH_FLOW, etc.)

### Code Additif Créé
- `src/types/omega.ts` : 350+ lignes d'interfaces TypeScript (référence)
- `src/hooks/` : 12 hooks avec signatures complètes
- `backend/routes/skeleton_omega.py` : 14 endpoints actifs avec mocks réalistes

## ITER.57 — Fondation Omega (2026-04-07) TERMINE

### Livrables
- 13 composants JSX convertis depuis TSX dans `/app/frontend/src/components/omega/`
- Route `/pro` isolée du layout vitrine (fullscreen immersif, pas de Header/Footer)
- CSS Omega dans `index.css` + `tailwind.config.js` (mapping Tailwind v4 → v3)
- Dépendances ajoutées : `motion`, `react-markdown`, `remark-gfm`, `react-syntax-highlighter`
- Document de passation : `/app/ITER57_SUMMARY.md` (cartographie server.py, ordre câblage, risques)

### Tests
- testing_agent_v3_fork : 14/14 tests passés (iteration_79.json)
- Fix SVG console error (attribut `d` undefined → `initial={{ d: "..." }}`)

### Données MOCKÉES (toutes)
- Wallet balance (24 JCC), transactions, assets
- Brain chat (streaming simulé, pas d'appel API)
- Shop (4 produits), Feed (3 posts), Inbox (4 conversations)
- Builder (3 projets), Cockpit (logs mockés), Profile (identité fictive)

## Backlog Post-ITER.57

### iter.58 (P0) : Câblage réel des données
- Câbler useAuth → /api/auth/frek + /api/auth/me
- Câbler useWallet → solde réel + Stripe top up
- Câbler useBrain → /api/brain/chat-enriched (budget LLM à recharger)
- Câbler useFeed, useShop → créer endpoints /api/omega/*
- Plafond 150€ wallet (compliance)
- Ordre de câblage détaillé dans ITER57_SUMMARY.md section 3

### iter.59 (P1) : Intégration UI + Tests
- Connecter composants Omega aux endpoints
- Tests E2E complets
- PWA /scan terrain

### iter.60 (P1) : Production
- Performance (lazy loading, code splitting)
- Déploiement production
- Migration DNS kiltikonet.fr

### Backlog Technique
- (P2) Refactoring server.py (>9865 lignes)
- (P2) DNS IONOS
- (P3) AWS SES sortie sandbox
- (P3) RGPD : endpoint suppression de compte
- (P3) Rate limiter agressif (429 fréquents)
