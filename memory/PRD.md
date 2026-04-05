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
8. CVL BRAIN complet — **PARTIAL** (basique, modules avances en backlog)
9. Wallet KT (style Revolut) — **DONE**
10. Sovereign Corp Shop — **DONE** (v2: marketplace diasporique, collections, 9 produits)
11. Archives / Cloud — **DONE** (v2: upload, dossiers, CVL Brain Data, datasets)
12. 3 Profils (Fiche, Gouvernance, SaaS) — **DONE**
13. Terminal code IA + API deploiement — **DONE**
14. Parametres trading — **DONE**

## Stack
- **Frontend**: React 19, Tailwind CSS, Sovereign Onyx Design System
- **Backend**: FastAPI, MongoDB
- **Integrations**: Stripe, Brevo, Anthropic Claude (Emergent LLM Key), Tavily
- **Design**: OLED `#0a0a0b`, Or `#E8D5A0`, Newsreader/Manrope, Material Symbols, JetBrains Mono (terminal)

## Authentification — 3 methodes implementees
### Google OAuth (Emergent-managed)
- Bouton "Continuer avec Google" -> redirect auth.emergentagent.com
- Callback: POST /api/auth/google/session avec session_id
- Fusion de comptes si email deja existant

### FREK-ID (2-step OTP)
- POST /api/auth/frek : lookup FREK-ID -> envoie OTP a l'email associe
- POST /api/auth/frek/verify : verification FREK-ID + code -> session
- Admin bypass : code 000000 pour emails admin
- OTP cooldown 60s, expiration 10 min

### GitHub OAuth
- GET /api/auth/github : redirect GitHub authorize URL
- GET /api/auth/github/callback : echange code -> session + redirect frontend
- Necessite GITHUB_CLIENT_ID et GITHUB_CLIENT_SECRET dans .env (non configure actuellement)

## Backlog P1
- [ ] CVL BRAIN Modules avances 3-10 (Claude Sonnet integration complete)
- [ ] Wallet : remplacer historique mocke par vraie logique DB/trading
- [ ] Smart Engine & Analytics personnalises (tracking 100% interne)

## Backlog P2
- [ ] Shop : integration API reelles (Etsy/sites diaspora)
- [ ] Archives : stockage reel (Object Storage)
- [ ] Ghost LLM intelligent (reduction credits)
- [ ] DNS IONOS personnalise (attente action utilisateur)
- [ ] Trading settings : persistance backend

## Backlog P3
- [ ] Refactoring server.py (~9600 lignes)
- [ ] AWS SES : sortie sandbox (attente action utilisateur)
- [ ] CVL Brain connexion Archives Cloud pour entrainement reel
