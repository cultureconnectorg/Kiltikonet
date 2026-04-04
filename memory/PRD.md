# PRD — Kiltikonet / CC2026

## Problème d'origine
Plateforme événementielle/culturelle premium omnicanale (React 19 + FastAPI + MongoDB) pour Culture Connect 2026. Intégration IA "CVL BRAIN", design system "Sovereign Onyx" (OLED/Premium), 14 écrans dans l'Espace Pro structurés comme un SaaS niveau Meta/Revolut/Claude.ai.

## Architecture 14 Écrans — État d'avancement
1. CVL BRAIN rond d'or (bouton flottant) — **DONE**
2. Page Vitrine (landing dynamique) — **DONE**
3. Connexion (FREK + Google + GitHub) — **DONE**
4. Studios sidebar (4 studios slide gauche) — **DONE**
5. Feed LinkedIn culturel (ghost population 24/7) — **DONE**
6. Feed Reels/TikTok culturel (ghost population) — **DONE**
7. Boîte de réception immersive — **DONE**
8. CVL BRAIN complet (niveau Claude.ai) — **PARTIAL** (basique)
9. Wallet KT (style Revolut) — **DONE**
10. Sovereign Corp Shop — **DONE** (base, à enrichir)
11. Archives / Cloud — **DONE** (base)
12. 3 Profils (Fiche, Gouvernance, SaaS) — **DONE**
13. Terminal code IA + API déploiement — **DONE**
14. Paramètres trading — **DONE**

## Stack
- **Frontend**: React 19, Tailwind CSS, Sovereign Onyx Design System
- **Backend**: FastAPI, MongoDB
- **Intégrations**: Stripe, Brevo, Anthropic Claude (Emergent LLM Key), Tavily
- **Design**: OLED `#0a0a0b`, Or `#E8D5A0`, Newsreader/Manrope, Material Symbols, JetBrains Mono (terminal)

## Implémenté (Avril 2026)

### Navigation & Structure
- [x] Bottom nav 5 tabs : Feed, Reels, Brain (orb doré), Wallet, Profil
- [x] Hamburger menu : 14 sections (+ Vitrine, Trading KT)
- [x] Header : Studios icon + Inbox icon + KT balance badge

### Écran 2 — Page Vitrine
- [x] Carrousel auto-rotatif 5 actualités culturelles
- [x] Barre de stats CC2026, grille articles, tendances ghost

### Écran 4 — Studios Sidebar
- [x] 4 Studios : LinkedIn, Feed/Reel, Shop, Preview+Terminal
- [x] Animation slide gauche, outils extensibles, panel de détails

### Écran 5 — Feed LinkedIn
- [x] Ghost population 60+ posts, proof of life bar

### Écran 6 — Reels/TikTok
- [x] 25+ reels ghost, snap scroll vertical

### Écran 7 — Boîte de Réception Immersive
- [x] Instagram DMs style, 7 ghost conversations, auto-reply

### Écran 9 — Wallet KT
- [x] Design Revolut, sparkline chart, quick actions, 3 tabs

### Écran 12 — Profil Triptyque
- [x] 3 onglets : Fiche, Gouvernance (4,200 KT voting), SaaS (29€/mois)

### Écran 13 — Terminal IA + Déploiement
- [x] Tab Terminal : Console interactive (help, status, whoami, neofetch, api list/call, brain, deploy, run, date, clear)
- [x] Tab API Explorer : Endpoints catégorisés, appels HTTP réels avec syntax highlighting
- [x] Tab Déploiement : 3 microservices (start/stop), logs en temps réel

### Écran 14 — Paramètres Trading KT
- [x] 4 paires de trading (KT/EUR, KT/CC, KT/USD, CC/EUR)
- [x] Auto-Trading CVL BRAIN (toggle + options)
- [x] Limites journalières (50-5000 KT) et hebdomadaires (100-20000 KT)
- [x] 3 profils de risque (Conservateur/Modéré/Agressif)
- [x] 4 alertes configurables (prix, volume, news, whale)
- [x] Paramètres avancés (slippage, frais, timeout)

### Design Sovereign Onyx
- [x] Global CSS : grain texture, ambient glow, tokens CSS
- [x] Material Symbols partout (0 Lucide React)
- [x] Typography : Newsreader serif / Manrope sans-serif

### Infrastructure
- [x] Ghost population : 200 profils + 60 posts + 25 reels + 7 conversations
- [x] Rate limiter whitelist : /api/pro, /api/brain, /api/auth, /api/growth
- [x] Login magic link avec bypass admin

## Backlog P1
- [ ] CVL BRAIN Modules avancés 3-10 (Claude Sonnet intégration complète)
- [ ] Shop amélioré avec API culturelles diasporiques (Etsy, CCCADI)
- [ ] Archives/Cloud : stockage réel + entraînement CVL Brain

## Backlog P2
- [ ] Ghost LLM intelligent (réduction crédits)
- [ ] DNS IONOS personnalisé (attente action utilisateur)
- [ ] Wallet vrai mécanisme trading réel vs données mockées
- [ ] Trading settings persistance backend
- [ ] Refactoring server.py (~9500 lignes)
