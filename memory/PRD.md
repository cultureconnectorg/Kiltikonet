# PRD — Kiltikonet / CC2026

## Probleme d'origine
Plateforme evenementielle/culturelle premium omnicanale (React 19 + FastAPI + MongoDB) pour Culture Connect 2026. Integration IA "CVL BRAIN", design system "Sovereign Onyx" (OLED/Premium), 14 ecrans dans l'Espace Pro structures comme un SaaS niveau Meta/Revolut/Claude.ai.

## Architecture 14 Ecrans — TOUS COMPLETES
1. CVL BRAIN rond d'or (bouton flottant) — **DONE**
2. Page Vitrine (landing dynamique) — **DONE**
3. Connexion (FREK + Google + GitHub) — **DONE** (v2: FREK-ID 2-step OTP, GitHub OAuth, Google OAuth)
4. Studios sidebar (4 studios slide gauche) — **DONE**
5. Feed LinkedIn culturel (ghost population 24/7) — **DONE**
6. Feed Reels/TikTok culturel (ghost population) — **DONE**
7. Boite de reception immersive — **DONE** (v2: groupes, vocaux, musique, typing, reactions)
8. CVL BRAIN complet — **DONE** (v3: multi-turn, knowledge base 16 modules, quick actions, contexte utilisateur)
9. Wallet KT (style Revolut) — **DONE**
10. Sovereign Corp Shop — **DONE** (v2: marketplace diasporique, collections, 9 produits)
11. Archives / Cloud — **DONE** (v2: upload, dossiers, CVL Brain Data, datasets)
12. 3 Profils (Fiche, Gouvernance, SaaS) — **DONE**
13. Terminal code IA + API deploiement — **DONE**
14. Parametres trading — **DONE**

## Stack
- **Frontend**: React 19, Tailwind CSS, Sovereign Onyx Design System
- **Backend**: FastAPI, MongoDB
- **Integrations**: Stripe, Brevo, Anthropic Claude Sonnet (Emergent LLM Key), Tavily
- **Design**: OLED #0a0a0b, Or #E8D5A0, Newsreader/Manrope, Material Symbols, JetBrains Mono (terminal)

## Authentification — 3 methodes implementees
### Google OAuth (Emergent-managed)
- Bouton "Continuer avec Google" → redirect auth.emergentagent.com
- Callback: POST /api/auth/google/session avec session_id

### FREK-ID (2-step OTP)
- POST /api/auth/frek : lookup FREK-ID → envoie OTP a l'email associe
- POST /api/auth/frek/verify : verification FREK-ID + code → session
- Admin bypass : code 000000, pas de cooldown

### GitHub OAuth
- GET /api/auth/github : redirect GitHub authorize URL
- GET /api/auth/github/callback : echange code → session
- Necessite GITHUB_CLIENT_ID et GITHUB_CLIENT_SECRET (non configure)

## CVL BRAIN — Intelligence Culturelle (v3)
### Base de connaissances (pare-feu d'information)
- Connait l'ecosysteme complet en interne mais ne revele que les infos publiques
- INTERDIT de mentionner : entites meres, strategies internes, architecture technique, plans futurs non publics
- INTERDIT de donner : codes d'acces, FREK-IDs d'autres utilisateurs, details FREKcore
- Repond en creole martiniquais quand il refuse : "Man pa ka pale de sa"

### Connaissances publiques partagees
- kiltikonet.fr et ses fonctionnalites
- CC2026 (dates, lieu, programme)
- Jeton CC (packs, prix, usage)
- FREK-ID (identifiant personnel, usage basique)
- Espace Pro (Feed, Reels, Wallet, Shop, Archives, Messagerie)

### Fonctionnalites techniques
- Multi-turn conversation (historique envoye a chaque requete)
- Contexte utilisateur (nom, FREK-ID propre, type profil)
- 6 suggestions rapides (Kiltikonet, Profil, Jeton CC, CC2026, FREK-ID, Espace Pro)
- Enrichissement web via Tavily
- Memoire persistante MongoDB

## Backlog P1
- [ ] Wallet : remplacer historique mocke par vraie logique DB/trading
- [ ] Smart Engine & Analytics personnalises (tracking 100% interne)

## Backlog P2
- [ ] Archives Cloud : connexion reelle au contexte CVL Brain
- [ ] Shop : integration API reelles diasporiques
- [ ] Ghost LLM intelligent (reduction credits)
- [ ] DNS IONOS personnalise (attente action utilisateur)
- [ ] Trading settings : persistance backend

## Backlog P3
- [ ] Refactoring server.py (~9800 lignes)
- [ ] AWS SES : sortie sandbox (attente action utilisateur)
- [ ] Module 03 : Orchestration agents (event-driven, pub/sub)
- [ ] Module 04 : Base vectorielle partagee (ChromaDB)
- [ ] Module 05 : FinOps IA (model router 4 tiers)
- [ ] Module 06-07 : Jeton CC complet + Flywheel
- [ ] Module 08 : Dashboard Admin Logs (SSE temps reel)
- [ ] Module 09 : Smart Contracts Polygon (Phase 4, 2027+)
- [ ] Module 10 : Souverainete GAFAM (Mistral local, IPFS)
