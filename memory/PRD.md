# PRD — Kiltikonet / CC2026

## Problème d'origine
Plateforme événementielle/culturelle premium omnicanale (React 19 + FastAPI + MongoDB) pour Culture Connect 2026. Intégration IA "CVL BRAIN", design system "Sovereign Onyx" (OLED/Premium), 14 écrans dans l'Espace Pro structurés comme un SaaS niveau Meta/Revolut/Claude.ai.

## Architecture 14 Écrans — TOUS COMPLÉTÉS
1. CVL BRAIN rond d'or (bouton flottant) — **DONE**
2. Page Vitrine (landing dynamique) — **DONE**
3. Connexion (FREK + Google + GitHub) — **DONE**
4. Studios sidebar (4 studios slide gauche) — **DONE**
5. Feed LinkedIn culturel (ghost population 24/7) — **DONE**
6. Feed Reels/TikTok culturel (ghost population) — **DONE**
7. Boîte de réception immersive — **DONE** (v2: groupes, vocaux, musique, typing, réactions)
8. CVL BRAIN complet — **PARTIAL** (basique, modules avancés en backlog)
9. Wallet KT (style Revolut) — **DONE**
10. Sovereign Corp Shop — **DONE** (v2: marketplace diasporique, collections, 9 produits)
11. Archives / Cloud — **DONE** (v2: upload, dossiers, CVL Brain Data, datasets)
12. 3 Profils (Fiche, Gouvernance, SaaS) — **DONE**
13. Terminal code IA + API déploiement — **DONE**
14. Paramètres trading — **DONE**

## Stack
- **Frontend**: React 19, Tailwind CSS, Sovereign Onyx Design System
- **Backend**: FastAPI, MongoDB
- **Intégrations**: Stripe, Brevo, Anthropic Claude (Emergent LLM Key), Tavily
- **Design**: OLED `#0a0a0b`, Or `#E8D5A0`, Newsreader/Manrope, Material Symbols, JetBrains Mono (terminal)

## Détail des Écrans Implémentés

### Écran 7 — Inbox Immersive v2
- [x] 9 conversations (7 individuelles + 2 groupes)
- [x] Groupes : CC2026 Équipe Org, Gwoka Studio Collab
- [x] Messages vocaux avec waveform + play button
- [x] Partage musique avec titre/artiste/durée
- [x] Typing indicator (3 dots animés) avant auto-reply ghost
- [x] Réactions emoji (6 emojis : coeur, feu, applaudissements, 100, musique, poing)
- [x] Noms d'expéditeur dans les conversations de groupe

### Écran 10 — Sovereign Marketplace v2
- [x] 9 catégories (Tout, KT, Mode, Art, Musique, Gastronomie, Littérature, Billetterie, Formation)
- [x] 4 Collections curatées (CC2026 Officiel, Patrimoine, Saveurs, Musique)
- [x] 9 produits diasporiques (Madras, peinture, rhum, vinyle, bijou, café, livre, sculpture, panier)
- [x] Modal détail produit (origine, artisan, rating, avis, description, badges confiance)
- [x] Recherche + filtrage catégorie + toggle grille/liste
- [x] Packs KT avec intégration Stripe existante

### Écran 11 — Archives Cloud v2
- [x] 2 onglets : Fichiers + CVL Brain Data
- [x] 6 dossiers (Tous, Documents, Médias, Musique, Archives, CVL Brain)
- [x] 10 fichiers simulés avec icônes par type
- [x] Upload via bouton + drag & drop zone
- [x] Compteur stockage (2.4/10 GB)
- [x] 4 datasets d'entraînement CVL Brain (indexé, en traitement, en attente)
- [x] Stats entraînement (19,750 entrées, 3 modèles, 94% précision)

## Backlog P1
- [ ] CVL BRAIN Modules avancés 3-10 (Claude Sonnet intégration complète)
- [ ] Shop : intégration API réelles (Etsy/sites diaspora)
- [ ] Archives : stockage réel (Object Storage)

## Backlog P2
- [ ] Ghost LLM intelligent (réduction crédits)
- [ ] DNS IONOS personnalisé (attente action utilisateur)
- [ ] Wallet : vrai mécanisme trading
- [ ] Trading settings : persistance backend
- [ ] Refactoring server.py (~9500 lignes)
