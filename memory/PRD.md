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
8. CVL BRAIN complet — **DONE** (v3: inline page, multi-turn, anticipation 5 niveaux, sage culturel, pare-feu info)
9. Wallet KT (style Revolut) — **DONE** (v2: donnees reelles MongoDB, achat packs Stripe, historique, analytics)
10. Sovereign Corp Shop — **DONE** (v2: marketplace diasporique, collections, Stripe checkout)
11. Archives / Cloud — **DONE** (v2: upload, dossiers, CVL Brain Data, datasets)
12. 3 Profils (Fiche, Gouvernance, SaaS) — **DONE**
13. Terminal code IA + API deploiement — **DONE**
14. Parametres trading — **DONE**

## Stack
- **Frontend**: React 19, Tailwind CSS, Sovereign Onyx Design System
- **Backend**: FastAPI, MongoDB
- **Integrations**: Stripe (paiements), Anthropic Claude Sonnet (Emergent LLM Key), Tavily
- **Design**: OLED #0a0a0b, Or #E8D5A0, Newsreader/Manrope, Material Symbols, JetBrains Mono

## Authentification — 3 methodes
- Google OAuth (Emergent-managed)
- FREK-ID (2-step OTP, admin bypass 000000)
- GitHub OAuth (necessite GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET)

## CVL BRAIN — Intelligence Culturelle (v3)
### Personnalite
- Sage culturel diasporique afro-descendant
- Cool, poli, tres smart, jamais defensif
- Melange francais et creole naturellement
- Se met dans la peau de differentes perspectives culturelles
### Pare-feu d'information
- S'entraine en silence, ne revele rien de strategique
- Redirige avec elegance (jamais de refus visible)
- Connait CVLN/GAFAM/FREK en profondeur mais ne le montre pas
### Anticipation contextuelle (5 niveaux)
- Anticipe les besoins jusqu'a 5 coups d'avance
- Mais laisse la place a l'utilisateur car il apprend aussi
- Propose la prochaine etape sous forme de question/suggestion douce
### Fonctionnalites
- Chat inline (page Brain) + bulle flottante (autres pages)
- Multi-turn conversation (historique complet)
- Contexte utilisateur (FREK-ID, profil)
- Archives Cloud alimentent le contexte
- 6 suggestions rapides
- Enrichissement web Tavily

## Wallet — v2 (Real DB + Stripe)
- GET /api/my-wallet/me — solde, chart, stats mensuels
- POST /api/my-wallet/buy-pack — achat direct (fallback)
- GET /api/my-wallet/history — historique transactions
- GET /api/my-wallet/analytics — repartition depenses
- Stripe Checkout via /api/shop/checkout/create (channel='wallet')
- 4 packs: Decouverte 10EUR/6CC, Culture 25EUR/16CC, Diaspora 50EUR/33CC, VIP 100EUR/66CC

## Smart Analytics — 100% Interne
- POST /api/analytics/track — tracking evenement unique
- POST /api/analytics/batch — tracking batch (SmartAnalytics.js)
- GET /api/analytics/site-stats — overview, top pages, devices, timeline
- Pas de Google Analytics ni outil tiers

## Backlog P1
- [ ] Archives Cloud : stockage reel (Object Storage) + connexion complete CVL Brain
- [ ] Ghost LLM intelligent (reduction credits)

## Backlog P2
- [ ] Shop : integration API reelles diasporiques
- [ ] DNS IONOS personnalise (attente action utilisateur)
- [ ] Trading settings : persistance backend

## Backlog P3
- [ ] Refactoring server.py (~9900 lignes)
- [ ] AWS SES : sortie sandbox (attente action utilisateur)
- [ ] Modules 03-10 (orchestration agents, base vectorielle, FinOps, Jeton CC complet, Dashboard admin, Smart Contracts, souverainete)
