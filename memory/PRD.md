# PRD — Kiltikonet.fr / CC2026

## Objectif
Plateforme culturelle caribéenne full-stack (React 19 + FastAPI + MongoDB).
Ecosystème "Stitch Sovereign Onyx" avec Espace Pro à 14 écrans, Wallet Stripe, CVL Brain IA,
Feed/Reels dynamiques, gouvernance associative, certification FREK-ID.

## Architecture
- Frontend: React 19 (CRA/Craco), TailwindCSS 3, shadcn/ui, motion (Framer)
- Backend: FastAPI, MongoDB (culture_connect_2026)
- Auth: FREK-ID, GitHub OAuth, Magic Links, OTP Email
- LLM: Claude Sonnet via Emergent LLM Key
- Paiements: Stripe Checkout

## Business Rules
- 1 JCC = 1.50 EUR face value
- Packs JCC: Decouverte 10/10EUR, Culture 25/25EUR, Diaspora 50/50EUR, VIP 100/100EUR
- Rollover: JCC reportes indefiniment
- Brain: 2 KT/requete, FREE=10/jour, PRO=50, PREMIUM=illimite, INSTIT=illimite
- Adhesion: FREE 0EUR, PRO 10EUR/mois, PREMIUM 30EUR/mois, INSTIT 150EUR/mois
- Plafond 150EUR DSP2 enforce (sauf kyc_validated=true)

## ITER.56 — Audit Systeme TERMINÉ
- 22 documents d'ingenierie

## ITER.57 — Fondation Omega TERMINÉ
- 13 composants JSX convertis TSX→JSX
- Route /pro isolée du layout vitrine
- 14/14 tests passes

## ITER.58 — Câblage Espace Pro PARTIEL (Phases 0-4 sur 10)

### Phase 0 — Extraction server.py TERMINÉ
- omega.py cree (550 lignes), server.py allege ~340 lignes

### Phase 1 — Infrastructure TERMINÉ
- Index unique FREK-ID, audit_logs SHA256, brain_training_data, plafond 150EUR, RGPD DELETE, prix JCC corriges

### Phase 2 — Auth + Wallet TERMINÉ
- useAuth/useWallet/useAdhesion cables dans ProApp/OrbitalMenu/WalletView
- Packs JCC (10/25/50/100EUR) avec plafond 150EUR

### Phase 3 — CVL Brain TERMINÉ
- BrainChat cable sur /api/brain/chat-enriched (Claude Sonnet reel)
- Quota par adhesion, audit_logs, brain_training_data

### Phase 4 — Feed TERMINÉ
- FeedView cable avec eclair (debit 1 KT), commentaire, fetch reel

### Tests ITER.58
- Backend: 88% (15/17 — 2 rate limited)
- Frontend: 100%

## Backlog Post-ITER.58

### ITER.59 (P0) — Modules restants
- Shop cable (produits reels, checkout JCC)
- Terminal (Monaco Editor + CVL Brain agent + deploy /pages)
- Parametres cables (SovereignProfileView ↔ /api/user/settings)
- DMs / Inbox cables (WebSocket)
- Agenda CC2026 (4 jours: 20-23 mai)
- Trade peer-to-peer
- Gouvernance (votes, poids adhesion)
- Brevo 4 templates transactionnels
- Accreditation CC2026 flux 7 etapes
- NFC /scan mini-app PWA

### ITER.60 (P1) — Production
- Performance (lazy loading, code splitting)
- Deploiement production + DNS
- Tests E2E complets

### Backlog technique
- (P2) Refactoring server.py (>9500 lignes)
- (P2) Stripe Subscriptions reelles pour adhesion
- (P3) AWS SES sortie sandbox (remplace par Brevo)
- (P3) Object storage pour upload media
- (P3) cultural_score NLP avance
