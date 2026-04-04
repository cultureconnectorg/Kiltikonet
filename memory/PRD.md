# PRD — Kiltikonet / CC2026

## Problème d'origine
Plateforme événementielle/culturelle premium omnicanale (React 19 + FastAPI + MongoDB) pour Culture Connect 2026. Intégration IA "CVL BRAIN", design system "Sovereign Onyx" (OLED/Premium), 14 écrans dans l'Espace Pro structurés comme un SaaS niveau Meta/Revolut/Claude.ai.

## Architecture 14 Écrans
1. CVL BRAIN rond d'or (bouton flottant)
2. Page Vitrine (landing dynamique)
3. Connexion (FREK + Google + GitHub)
4. Studios sidebar (4 studios slide gauche)
5. Feed LinkedIn culturel (ghost population 24/7)
6. Feed Reels/TikTok culturel (ghost population)
7. Boîte de réception immersive
8. CVL BRAIN complet (niveau Claude.ai)
9. Wallet KT (style Revolut)
10. Sovereign Corp Shop
11. Archives / Cloud
12. 3 Profils (Fiche, Gouvernance, SaaS)
13. Terminal code IA + API déploiement
14. Paramètres trading

## Stack
- **Frontend**: React 19, Tailwind CSS, Sovereign Onyx Design System
- **Backend**: FastAPI, MongoDB
- **Intégrations**: Stripe, Brevo, Anthropic Claude (Emergent LLM Key), Tavily
- **Design**: OLED `#0a0a0b`, Or `#E8D5A0`, Newsreader/Manrope, Material Symbols

## Implémenté (Avril 2026)

### Navigation & Structure ✅
- [x] Bottom nav 5 tabs : Feed, Reels, Brain (orb doré), Wallet, Profil
- [x] Hamburger menu : 13 sections (Vitrine, Feed, Reels, Inbox, Brain, Wallet, Studios, Shop, Archives, Profil, Gouvernance, Console, Paramètres)
- [x] Header : Studios icon + Inbox icon + KT balance badge

### Écran 2 — Page Vitrine ✅
- [x] Carrousel auto-rotatif de 5 actualités culturelles
- [x] Indicateurs dot interactifs
- [x] Barre de stats CC2026 (12 pays, 69 artistes, 4 jours, 10K+ visiteurs)
- [x] Grille de 5 articles (Musique, Événement, Technologie, Gastronomie, Patrimoine)
- [x] Tendances du réseau (posts ghost les plus populaires)
- [x] CTA "Rejoignez CC2026"

### Écran 4 — Studios Sidebar ✅
- [x] Animation slide depuis la gauche (CSS transition)
- [x] 4 Studios : LinkedIn, Feed/Reel, Shop, Preview+Terminal
- [x] Chaque studio : icône colorée, description, liste d'outils extensible
- [x] Panel étendu avec stats et activité récente
- [x] Navigation vers la section correspondante au clic
- [x] Accessible depuis header desktop + hamburger mobile

### Écran 5 — Feed LinkedIn ✅
- [x] Posts ghost auto-générés (60+ posts)
- [x] Proof of life bar (online count temps réel)
- [x] Create post bar
- [x] Actions LinkedIn (J'aime, Commenter, Republier, Envoyer)
- [x] Infinite scroll avec pagination

### Écran 6 — Reels/TikTok ✅
- [x] 25+ reels ghost auto-générés
- [x] Snap scroll vertical
- [x] Actions verticales (Like, Comment, Share, JCC)

### Écran 7 — Boîte de Réception Immersive ✅
- [x] Interface fullscreen style Instagram DMs
- [x] 7 conversations ghost (Simone, Mateo, Chiamaka, Diego, Amara, Yaël, Nadia)
- [x] Barre "En ligne" avec avatars et status dots
- [x] Chat view avec bulles dorées (messages envoyés) et sombres (reçus)
- [x] Auto-reply ghost après délai aléatoire
- [x] Recherche de conversations
- [x] Boutons d'action (appel, vidéo, info)
- [x] CvlBrainFloat masqué automatiquement quand inbox ouverte

### Écran 8 — CVL BRAIN ✅
- [x] Sphère dorée avec gradient radial + ondulations
- [x] Barre de commande "BRAIN v2.4"
- [x] Suggestions contextuelles
- [x] Module 1 : Mémoire Persistante (frontend+backend)
- [x] Module 2 : Web Search Tavily (backend, fallback gracieux)

### Écran 9 — Wallet KT ✅
- [x] Design Revolut : balance, sparkline chart, trend indicator
- [x] Quick actions : Recharger, Envoyer, Échanger, Trading
- [x] 3 tabs : Aperçu, Historique, Analyse

### Écran 12 — Profil Triptyque ✅
- [x] 3 onglets : Fiche, Gouvernance, SaaS
- [x] Fiche : Hero card, stats (vues, connexions, KT, score), badges, activité récente
- [x] Gouvernance : Pouvoir de vote (4,200 KT), propositions actives avec barres de progression, délégations
- [x] SaaS : Plan Pro Souverain (29€/mois), compteurs d'utilisation, historique de facturation, moyen de paiement

### Design Sovereign Onyx ✅
- [x] Global CSS : grain texture, ambient glow, tokens CSS
- [x] Material Symbols partout (0 Lucide React)
- [x] Typography : Newsreader serif / Manrope sans-serif
- [x] Cards : rounded-xl, ghost borders

### Infrastructure ✅
- [x] Ghost population : 200 profils + 60 posts + 25 reels + 7 conversations
- [x] Rate limiter whitelist : /api/pro, /api/brain, /api/auth, /api/growth
- [x] Login magic link avec bypass admin

## Backlog P1
- [ ] Écran 13 : Terminal code IA + API déploiement style Emergent
- [ ] Écran 10 : Sovereign Corp Shop amélioré
- [ ] Écran 11 : Archives/Cloud (stockage + entraînement CVL Brain)
- [ ] Écran 14 : Paramètres trading KT

## Backlog P2
- [ ] CVL BRAIN Modules 3-10
- [ ] Ghost LLM intelligent (réduction crédits)
- [ ] DNS IONOS personnalisé
- [ ] Wallet vrai mécanisme trading
- [ ] Refactoring server.py (~9500 lignes)
