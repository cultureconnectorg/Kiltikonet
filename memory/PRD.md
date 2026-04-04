# PRD — Kiltikonet / CC2026

## Problème d'origine
Plateforme événementielle/culturelle premium omnicanale (React 19 + FastAPI + MongoDB) pour Culture Connect 2026. Intégration IA "CVL BRAIN", design system "Sovereign Onyx" (OLED/Premium sombre), accréditations, paiements Stripe, génération de badges, PWA offline.

## Architecture
- **Frontend**: React 19, Tailwind CSS, Design System Sovereign Onyx
- **Backend**: FastAPI, MongoDB
- **Intégrations**: Stripe, Brevo, Anthropic Claude (via Emergent LLM Key), Tavily (Web Search)
- **Design System**: Sovereign Onyx — Fonds OLED `#0a0a0b`, Or `#E8D5A0`, Newsreader serif / Manrope sans-serif, Material Symbols

## Fichiers Principaux
- `/app/frontend/src/components/ProSpaceDashboard.jsx` — Dashboard principal
- `/app/frontend/src/components/pro/MobileNavigation.jsx` — Nav mobile
- `/app/frontend/src/components/pro/CulturalCards.jsx` — Cartes culturelles
- `/app/frontend/src/components/pro/CulturalFeed.jsx` — Feed TikTok-style
- `/app/frontend/src/components/pro/ShopPage.jsx` — Shop/catalogue
- `/app/frontend/src/components/pro/SovereignSections.jsx` — Sections secondaires
- `/app/frontend/src/components/CvlBrainFloat.jsx` — Chat IA flottant
- `/app/backend/server.py` — API backend monolithique

## Ce qui est implémenté

### Design Sovereign Onyx (100% Stitch)
- [x] Header glassmorphique (blur 24px, saturate 1.6)
- [x] Mobile Bottom Nav — 5 tabs, gradient gold pill pour BRAIN
- [x] Brain page — Sphère dorée avec gradient radial, anneaux d'ondulation
- [x] Profile page — Grille compacte 12-colonnes (Stitch profil_optimisation)
- [x] Shop page — Layout éditorial héros + Material Symbols
- [x] Settings — Centre de Commande Sovereign avec navigation
- [x] Chat CVL BRAIN — Font serif Newsreader pour réponses IA
- [x] Cards culturelles — Material Symbols, typographie Manrope/Newsreader
- [x] Effets globaux — Texture grain, halo ambiant, tokens design CSS
- [x] Modals/Panneaux — Material Symbols partout

### CVL BRAIN
- [x] Module 1 — Mémoire Persistante (Backend + Frontend connectés)
- [x] Module 2 — Web Search via Tavily (Backend, fallback gracieux)
- [x] Chat interface avec historique, nouvelle conversation, suppression
- [x] Rate limiter whitelist pour routes /api/brain et /api/auth

### Infrastructure
- [x] Login magic link avec bypass admin (000000)
- [x] PWA Service Worker
- [x] Paiements Stripe
- [x] RGPD (export données, suppression compte)

## Backlog P1
- [ ] CVL BRAIN Modules 3-10 (Upload fichiers, Génération docs, Terminal, Agents, Génération multimédia)
- [ ] DNS IONOS personnalisé (en attente d'action utilisateur)
- [ ] Vérifier ajout TAVILY_API_KEY par l'utilisateur

## Backlog P2
- [ ] Graphe D3.js interactif
- [ ] Vue 3D SmartEngine
- [ ] Tests e2e complets de bout en bout

## Backlog P3
- [ ] Refactoring server.py (~9500 lignes)
- [ ] PWA App Scan Staff
- [ ] Export PDF badges batch
