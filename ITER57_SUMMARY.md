# ITER.57 — FONDATION OMEGA : RAPPORT D'INTÉGRATION
## Document de passation vers ITER.58 — Exploitable sans contexte additionnel
**Date** : Février 2026
**Statut** : TERMINÉ — Coquille visuelle 100% fonctionnelle, données MOCKÉES

---

## 1. ÉTAT PAR COMPOSANT

### 1.1 ProApp.jsx — Orchestrateur principal
- **Chemin** : `/app/frontend/src/components/omega/ProApp.jsx`
- **Conversion** : 100% JSX — Aucun warning résiduel
- **Lignes** : 105
- **Rôle** : Gère l'état `currentView` et la navigation entre les 11 vues Omega
- **Données mockées** :
  - `balance` : `24` (useState initial)
  - `transactions` : Tableau de 3 objets `{id, type, label, amount, date, status}`
    - `t1: {type:"receive", label:"Bonus Inscription", amount:"+10 JCC"}`
    - `t2: {type:"receive", label:"Récompense Brain", amount:"+5 JCC"}`
    - `t3: {type:"send", label:"Achat Shop", amount:"-3 JCC"}`
- **Hook ITER.58** : `useWallet` (pour balance + transactions réelles) + `useAuth` (pour le frek_id)
- **Dépendances inter-composants** : Importe TOUS les 11 composants enfants. Point d'entrée unique.

### 1.2 Background.jsx — Fond animé immersif
- **Chemin** : `/app/frontend/src/components/omega/Background.jsx`
- **Conversion** : 100% JSX — Warning SVG `d` corrigé (attribut `d` initial ajouté)
- **Lignes** : 155
- **Données mockées** : Aucune (composant purement visuel)
- **Hook ITER.58** : Aucun — Composant autonome
- **Dépendances** : `motion` (framer-motion). 40 particules `<motion.div>`, 3 paires de SVG path animées
- **Décision technique** : Les 6 `<motion.path>` utilisent désormais un attribut `d` initial explicite pour éviter les erreurs console `Expected moveto path command` au premier render de `motion`

### 1.3 OrbitalMenu.jsx — Menu orbital rotatif
- **Chemin** : `/app/frontend/src/components/omega/OrbitalMenu.jsx`
- **Conversion** : 100% JSX — Aucun warning résiduel
- **Lignes** : 116
- **Données mockées** :
  - Badge JCC header : `24 JCC` (hardcodé)
  - Badge FREK-ID header : `FREK-ID: 99421` (hardcodé)
- **Hook ITER.58** : `useWallet` (solde JCC dynamique) + `useAuth` (frek_id réel)
- **Dépendances** : `motion`, `lucide-react` (Wallet, Zap, Wrench, Gauge, ShoppingCart, MessageSquare, Coins)
- **CSS clé** : `.omega-animate-orbit` + `.omega-animate-counter-orbit` (rotation/contre-rotation 60s)

### 1.4 BrainChat.jsx — Interface IA CVL Brain
- **Chemin** : `/app/frontend/src/components/omega/BrainChat.jsx`
- **Conversion** : 100% JSX — Aucun warning résiduel
- **Lignes** : 210
- **Données mockées** :
  - Message initial assistant : Markdown de bienvenue CVL BRAIN v1.0
  - Historique sidebar : 3 entrées `{id, title, date}` hardcodées
  - Réponses IA : `simulateStreaming()` — Pas d'appel API. Réponses conditionnelles basées sur mots-clés (`code` → snippet FREK, `jcc` → tableau JCC)
  - Modèle affiché : `"Claude 3.5 Sonnet · Core Engine"` (texte statique)
  - Badge FREK-ID : `99421-MQ` (hardcodé)
- **Hook ITER.58** : `useBrain` (appels API `/api/brain/chat-enriched`), `useWallet` (solde dynamique), `useAuth` (frek_id)
- **Dépendances** : `react-markdown`, `remark-gfm`, `react-syntax-highlighter` (atomDark), `motion`, `lucide-react`
- **Risque ITER.58** : Le streaming mock simule mot-par-mot via `setTimeout`. L'API réelle utilise SSE ou streaming HTTP. Le `simulateStreaming()` devra être remplacé par un vrai consumer SSE. Le budget Emergent LLM Key était épuisé fin ITER.56 — vérifier le rechargement avant de tester.

### 1.5 WalletView.jsx — Portefeuille Jeton CC
- **Chemin** : `/app/frontend/src/components/omega/WalletView.jsx`
- **Conversion** : 100% JSX — Aucun warning résiduel
- **Lignes** : 250
- **Données mockées** :
  - `balance` : Reçu en prop depuis ProApp (`24`)
  - `assets` : 3 actifs hardcodés :
    - `{name:"Jeton CC", symbol:"JCC", balance: balance, value: balance*0.85+"€"}`
    - `{name:"Kilti Governance", symbol:"KGOV", balance: 150, value:"Voting Power"}`
    - `{name:"Reputation Score", symbol:"REP", balance: 98, value:"Tier 1"}`
  - Taux JCC→EUR : `0.85` (hardcodé)
  - Variation : `+2.4%` (hardcodé)
  - Adresse Kilti QR : `99421-MQ-SVR-ALCH` (hardcodé)
  - Top Up : `handleTopUp(amount)` — `setTimeout` de 1200ms, pas d'appel Stripe
- **Hook ITER.58** : `useWallet` (solde, transactions, taux de change réels), `useTrade` (swap), Stripe (top up)
- **Dépendances** : `motion`, `lucide-react`
- **Risque ITER.58** : Le top up doit être câblé à Stripe Checkout. Le swap JCC→EUR nécessite la logique de plafond 150€ non encore implémentée côté backend.

### 1.6 ShopView.jsx — Boutique Souveraine
- **Chemin** : `/app/frontend/src/components/omega/ShopView.jsx`
- **Conversion** : 100% JSX — Aucun warning résiduel
- **Lignes** : 115
- **Données mockées** :
  - `categories` : 5 catégories `["Tout", "Musique", "Vidéo", "Art", "Gastro"]`
  - `products` : 4 produits hardcodés avec images Unsplash :
    - `{title:"Ti' Punch & Identité Créole", author:"Ben ARRIS", price:12, category:"gastronomy", rating:4.9, sales:242}`
    - `{title:"Session Studio — Beat Zouk", author:"Kilti Maker", price:8, category:"music", rating:4.7, sales:156}`
    - `{title:"Architecture Luciole v2", author:"Core Engine", price:45, category:"art", rating:5.0, sales:89}`
    - `{title:"Diaspora Rhythms", author:"Global Sound", price:15, category:"music", rating:4.8, sales:312}`
  - Boutons "ACHETER" : Aucune action
- **Hook ITER.58** : `useShop` (produits réels, achat via JCC)
- **Dépendances** : `motion`, `lucide-react`. Images via Unsplash CDN (pas de stockage local)

### 1.7 FeedView.jsx — Feed vertical TikTok-style
- **Chemin** : `/app/frontend/src/components/omega/FeedView.jsx`
- **Conversion** : 100% JSX — Aucun warning résiduel
- **Lignes** : 129
- **Données mockées** :
  - `FEED_DATA` : 3 posts avec images Unsplash :
    - `{user:"Ben ARRIS", likes:"42.8K", comments:"1.2K", category:"BRUT", location:"GHANA"}`
    - `{user:"Kilti Maker", likes:"12.5K", comments:"450", category:"MUSIC", location:"MARTINIQUE"}`
    - `{user:"Core Engine", likes:"8.9K", comments:"120", category:"TECH", location:"CORE"}`
  - Commentaires : 2 commentaires hardcodés dans le modal
  - Like/Follow : État local uniquement, aucune persistance
- **Hook ITER.58** : `useFeed` (posts réels, likes/comments persistés)
- **Dépendances** : `motion`, `lucide-react`. Utilise `navigator.share` et `navigator.vibrate`

### 1.8 InboxView.jsx — Messagerie souveraine
- **Chemin** : `/app/frontend/src/components/omega/InboxView.jsx`
- **Conversion** : 100% JSX — Aucun warning résiduel
- **Lignes** : 111
- **Données mockées** :
  - `messages` : 4 conversations :
    - `{user:"Ben ARRIS", lastMessage:"Le nouveau beat est prêt...", time:"10:42", unread:2, online:true}`
    - `{user:"Kilti Maker", lastMessage:"Tu as vu les stats...", time:"Hier", unread:0, online:false}`
    - `{user:"Core Engine", lastMessage:"Mise à jour du protocole...", time:"Hier", unread:0, online:true}`
    - `{user:"Global Sound", lastMessage:"Proposition de collaboration...", time:"2 jours", unread:0, online:false}`
  - Messages du chat sélectionné : 3 bulles hardcodées (2 reçues, 1 envoyée)
  - Envoi de message : Aucune action
- **Hook ITER.58** : WebSocket existant (`/api/ws/chat`) + `useRealtime` pour les messages temps réel
- **Dépendances** : `motion`, `lucide-react`

### 1.9 BuilderView.jsx — Éditeur de projets créatifs
- **Chemin** : `/app/frontend/src/components/omega/BuilderView.jsx`
- **Conversion** : 100% JSX — Aucun warning résiduel
- **Lignes** : 203
- **Données mockées** :
  - Statistiques header : `{projets:3, vues:"16.8K", JCC:24, FREK:"2/5"}`
  - Projets : 3 projets hardcodés :
    - `{title:"Ti' Punch & Identité Créole", cat:"Gastronomie", views:"3,312", status:"Publié"}`
    - `{title:"Session Studio — Beat Zouk", cat:"Musique", views:"1,242", status:"Staging"}`
    - `{title:"Untitled — Court métrage", cat:"Vidéo", views:"0", status:"Brouillon"}`
  - Studio : Import média simulé (click toggle). Outils : Audio, Subtitles, Text, Effects, Format
  - FREK certification : 4 étapes (Genesis=complété, Workshop=en cours, 2 verrouillés)
  - Publication : 3 canaux (Feed Public, Espace Pro, Shop+JCC). Aucune action réelle
- **Hook ITER.58** : `useFrek` (certification), `useShop` (publication Shop), `useFeed` (publication Feed)
- **Dépendances** : `motion`, `lucide-react`

### 1.10 CockpitView.jsx — Console développeur
- **Chemin** : `/app/frontend/src/components/omega/CockpitView.jsx`
- **Conversion** : 100% JSX — Aucun warning résiduel
- **Lignes** : 158
- **Données mockées** :
  - Logs initiaux : 3 lignes `{timestamp, type, message}` hardcodées
  - Commandes : `deploy`, `status`, `clear`, `help`. Toutes mockées avec `setTimeout`
  - Deploy : Animation de progression 4s avec 5 messages séquentiels
  - System Health : 4 services tous "Operational" sauf "Edge Cache: Syncing"
  - API Endpoints : 4 endpoints mockés avec latences fictives
  - Hardware : `CPU: 12.4%`, `Memory: 4.2GB/16GB`
- **Hook ITER.58** : `useTerminal` (commandes réelles, deploy, logs serveur)
- **Dépendances** : `motion`, `lucide-react`

### 1.11 SovereignProfileView.jsx — Profil souverain + Paramètres
- **Chemin** : `/app/frontend/src/components/omega/SovereignProfileView.jsx`
- **Conversion** : 100% JSX — Aucun warning résiduel
- **Lignes** : 183
- **Données mockées** :
  - Identité : `Souverain #99421`, `Membre depuis Avril 2026`, `core@kiltikonet.io`
  - Security Layers : 4 couches `{Signature Luciole, Empreinte Culturelle, Protocole Omega, Souveraineté}`
  - Gouvernance : `{Pouvoir de Vote: 12.5%, Réputation: 98/100, Propositions: 14}`
  - Paramètres : 6 sections (Compte, Sécurité, Notifications, Confidentialité, Réseau, Système)
    - Seuls "Compte" et "Système" ont du contenu. Les 4 autres affichent "Module en cours d'optimisation"
  - Mode sombre : Toggle visuel sans effet
  - Bouton Déconnexion : Aucune action
- **Hook ITER.58** : `useAuth` (profil réel, déconnexion), `useSettings` (préférences), `useGouvernance` (stats)
- **Dépendances** : `motion`, `lucide-react`

### 1.12 ContentDisplay.jsx — Vue contenu plein écran
- **Chemin** : `/app/frontend/src/components/omega/ContentDisplay.jsx`
- **Conversion** : 100% JSX — Aucun warning résiduel
- **Lignes** : 173
- **Données mockées** :
  - Producteur affiché : `Ben ARRIS`
  - Likes : `42.8K` (compteur local)
  - Comments : `1.2K` (statique)
  - Tags : `BRUT`, `GHANA`
  - Navigation sidebar : 7 items de navigation (CVL BRAIN, QUICK FEED, INBOX, WALLET, FREK-ID, COCKPIT, ADMIN)
  - Badge JCC/FREK : Identiques à OrbitalMenu (hardcodés)
- **Hook ITER.58** : `useFeed` (contenu réel), `useAuth` (identité)
- **Dépendances** : `motion`, `lucide-react`
- **Note** : Ce composant n'est actuellement accessible que via `currentView === "content"` dans ProApp, qui n'est pas déclenché directement par le menu orbital. Pourrait devenir une vue de détail de post Feed en ITER.58.

### 1.13 Logo.jsx — Logo SVG animé Kiltikonet
- **Chemin** : `/app/frontend/src/components/omega/Logo.jsx`
- **Conversion** : 100% JSX — Aucun warning résiduel
- **Lignes** : 65
- **Données mockées** : Aucune (composant purement visuel)
- **Hook ITER.58** : Aucun — Composant autonome
- **Dépendances** : `motion`
- **Note** : Non utilisé actuellement par ProApp. Disponible pour le header ou le splash screen.

---

## 2. SERVER.PY — CARTOGRAPHIE CIBLÉE (9865 lignes)

### 2.1 Sections par domaine (lignes début → fin)

| Section | Début | Fin | Lignes | Description |
|---------|-------|-----|--------|-------------|
| **Config & Middleware** | 1 | 197 | ~200 | Env, session, cookies, rate limiter, CORS |
| **WebSocket & Realtime** | 198 | 350 | ~150 | ConnectionManager, SSE, broadcast_event |
| **Pricing & Email** | 352 | 758 | ~400 | Templates email, send_email_async, Cloudinary |
| **Models (Pydantic)** | 759 | 1027 | ~270 | RegistrationResponse, CMS models, SiteConfig |
| **Stripe** | 1027 | 1381 | ~350 | checkout_session, webhook, process_successful_payment |
| **Registrations CRUD** | 1381 | 1672 | ~290 | create/get/update/delete registrations |
| **Batch Operations** | 1672 | 1934 | ~260 | Batch approve, send badges, email logs |
| **Badge PDF** | 2002 | 2153 | ~150 | generate_badge_pdf_buffer |
| **Workspace Auth & Logs** | 2154 | 2360 | ~200 | workspace_login, rate_limit, password mgmt |
| **Internal Chat (WS)** | 2360 | 2650 | ~290 | ChatManager, chat_websocket, DM |
| **AI Assistant (LLM)** | 2649 | 2681 | ~30 | Ancien endpoint embeddings |
| **Notifications** | 2681 | 2797 | ~120 | NotificationCreate, SSE stream |
| **Public Profile & Badge** | 2797 | 2972 | ~175 | Profil public, badge PDF render |
| **Partner Management** | 2972 | 3110 | ~140 | CRUD partenaires, link/unlink sponsor |
| **Statistics & Intelligence** | 3110 | 3662 | ~550 | Public stats, analytics avancés, smart matching |
| **LLM Services (Embeddings)** | 3662 | 3745 | ~80 | Embeddings, LLM chat (legacy) |
| **CC2026 Badge & Jetons** | 3746 | 3864 | ~120 | Badge activation, FREK stats, health |
| **CMS** | 3864 | 4642 | ~780 | Media, speakers, partners, pages, publish |
| **Visual Editor** | 4155 | 4335 | ~180 | Proxy, save changes |
| **CMS Theme & Content** | 4336 | 4642 | ~300 | Theme, content, dynamic pages |
| **Public CMS** | 4642 | 4716 | ~70 | Endpoints publics theme/content |
| **Map Territories** | 4716 | 4804 | ~90 | CRUD territoires carte |
| **Section Backgrounds** | 4804 | 4900 | ~100 | Backgrounds sections, site config |
| **Annual Intention** | 4897 | ~4950 | ~50 | Intention annuelle |
| **Doctrine Permissions** | ~4950 | ~6160 | ~1200 | Système de rôles, permissions FREK |
| **Dashboard CC2026 Tasks** | 6159 | 6268 | ~110 | Tâches collaboratives, toggle statut |
| **Espace Pro (LinkedIn)** | 6268 | 6597 | ~330 | Pro access, OTP, verify code |
| **Auth (Magic Link, Google, FREK, GitHub)** | 6597 | 7078 | ~480 | Magic link, Google OAuth, FREK auth, GitHub |
| **Admin & Invitations** | 7078 | 7194 | ~120 | Emergency access, team invitations |
| **Health Dashboard** | 7194 | 7305 | ~110 | Latency tracking, health stats |
| **Pro Profile & RGPD** | 7305 | 7665 | ~360 | Profils Pro, connections, messages, opportunities, events |
| **Badges Export PDF** | 7693 | 7920 | ~230 | Export batch/single, invitations |
| **Scan Debit (Terrain)** | 7920 | 8044 | ~120 | NFC scan + débit jetons |
| **Badge Lifecycle** | 8042 | 8115 | ~70 | 8 étapes cycle de vie |
| **Dashboard Live** | 8112 | 8173 | ~60 | Dashboard CC2026 temps réel |
| **Admin Reconcile & Batch Email** | 8173 | 8434 | ~260 | Sync Baserow, campagnes email |
| **Email Endpoints** | 8434 | 8435 | ~150 | Send, campaign, stats, QR |
| **NFC Tap** | 8435 | 8509 | ~75 | Paiement NFC |
| **Remboursement** | 8509 | 8551 | ~40 | Admin refund |
| **Stats Export** | 8551 | 8638 | ~90 | CSV/PDF export |
| **Heatmap** | 8638 | 8674 | ~35 | Fréquentation par zone |
| **Site Analytics** | 8674 | 9031 | ~360 | Analytics batch, dashboard, behavior |
| **Team Notifications** | 9031 | 9092 | ~60 | Alertes équipe |
| **Smart Recommendations** | 9092 | 9198 | ~110 | Matchmaking Pro |
| **Smart Engine** | 9198 | 9649 | ~450 | Alertes, insights, cron |
| **CVL Brain (Web Search + Memory)** | 9649 | 9865 | ~215 | Web search, chat enrichi, mémoire |

### 2.2 Fonctions appelées par les hooks Omega en ITER.58

| Hook Omega | Endpoints backend | Lignes server.py | Collection MongoDB |
|------------|------------------|-------------------|-------------------|
| `useAuth` | `POST /api/auth/frek`, `POST /api/auth/frek/verify`, `GET /api/auth/me` | 6744-6908, 162-170 | `pro_profiles`, `sessions` |
| `useWallet` | `GET /api/my-wallet/*`, `POST /api/wallet/*` | **Routes externes** (`routes/wallet.py` si existant, sinon dans `routes/brain.py` includes) | `cc_badges` (champ `jetons_solde`) |
| `useBrain` | `POST /api/brain/chat-enriched`, `POST /api/brain/memory/save`, `GET /api/brain/memory/history` | 9699-9780, 9785-9865 | `brain_memory` |
| `useFeed` | Pas d'endpoint dédié actuellement | — | — (à créer en ITER.58) |
| `useShop` | Pas d'endpoint dédié actuellement | — | — (à créer en ITER.58) |
| `useFrek` | `GET /api/frek/stats`, `GET /api/frek/health` | 3852-3864 | `cc_badges` |
| `useTerminal` | Pas d'endpoint dédié actuellement | — | — (à créer en ITER.58) |
| `useSettings` | `POST /api/pro/update-language`, `PUT /api/pro/profile/{id}` | 7292-7416 | `pro_profiles` |
| `useGouvernance` | Pas d'endpoint dédié actuellement | — | — (à créer en ITER.58) |
| `useAdhesion` | Pas d'endpoint dédié actuellement | — | — (à créer en ITER.58) |
| `useTrade` | Pas d'endpoint dédié actuellement | — | — (à créer en ITER.58) |
| `useNFC` | `POST /api/frek/nfc/tap` | 8445-8505 | `nfc_taps`, `cc_badges` |

### 2.3 Sections à NE PAS TOUCHER sous peine de régression vitrine

| Section | Lignes | Raison |
|---------|--------|--------|
| **Rate Limiter** | 124-160 | Protège toute l'API. Modifier = casser tout le backend |
| **Session Cookie Middleware** | 152-160 | Authentification globale |
| **Stripe Routes** | 1027-1381 | Paiements production. Zero tolérance |
| **Registrations CRUD** | 1381-1672 | Flux d'inscription vitrine (formulaires publics) |
| **Workspace Auth** | 2154-2360 | Authentification des 9 workspaces collaborateurs |
| **CMS** | 3864-4642 | Tout le contenu éditorial de la vitrine (speakers, médias, pages) |
| **Public CMS** | 4642-4716 | Ce que la vitrine affiche |
| **Badges Export** | 7693-7920 | Twina utilise ça activement |
| **Scan Debit (Terrain)** | 7920-8044 | App terrain utilisée en conditions réelles |

### 2.4 Routes externes (hors server.py)

```
/app/backend/routes/
├── brain.py          # Routes CVL Brain principales (chat, history, sessions)
├── shared.py         # Données partagées workspace (artistes, prestataires, tâches)
├── terrain.py        # Routes scan terrain
├── skeleton_omega.py # 14 endpoints mockés 200 (créés en ITER.56)
└── wallet.py         # Routes wallet (si existant)
```

---

## 3. ORDRE DE CÂBLAGE ITER.58

### Principe : Câbler par dépendances ascendantes

```
Phase 1 : FONDATIONS (aucune dépendance)
  ├── useAuth           → Expose frek_id, email, session_token
  └── useSettings       → Expose langue, préférences (dépend de useAuth pour profile_id)

Phase 2 : FINANCE (dépend de useAuth)
  ├── useWallet         → Dépend de frek_id (useAuth) pour identifier le wallet
  ├── useTrade          → Dépend de useWallet pour le solde et les plafonds
  └── useNFC            → Dépend de useWallet pour le débit jeton

Phase 3 : CONTENU (dépend de useAuth)
  ├── useBrain          → Dépend de frek_id + session pour l'historique
  ├── useFeed           → Dépend de frek_id pour like/follow
  └── useShop           → Dépend de useWallet pour achat JCC

Phase 4 : GOUVERNANCE (dépend de useAuth + useWallet)
  ├── useAdhesion       → Dépend de Stripe (adhésion payante)
  ├── useGouvernance    → Dépend de KGOV balance (useWallet)
  └── useFrek           → Dépend de useAuth + certification

Phase 5 : INFRASTRUCTURE
  └── useTerminal       → Dépend de tout (logs, deploy, commandes)
```

### Ordre d'implémentation recommandé

| # | Hook | Endpoints à créer/câbler | Effort estimé | Pré-requis |
|---|------|--------------------------|---------------|------------|
| 1 | `useAuth` | Câbler `/api/auth/frek` + `/api/auth/me` existants | Faible | Aucun |
| 2 | `useSettings` | Câbler `/api/pro/profile/{id}` + `/api/pro/update-language` existants | Faible | useAuth |
| 3 | `useWallet` | Créer `/api/omega/wallet` (balance, historique) ou étendre `cc_badges.jetons_solde` | Moyen | useAuth |
| 4 | `useBrain` | Câbler `/api/brain/chat-enriched` + `/api/brain/memory/*` existants | Moyen | useAuth, budget LLM |
| 5 | `useFrek` | Câbler `/api/frek/stats` existant + étendre avec certification | Faible | useAuth |
| 6 | `useNFC` | Câbler `/api/frek/nfc/tap` existant | Faible | useWallet |
| 7 | `useFeed` | Créer `/api/omega/feed` (CRUD posts, likes, comments) | Élevé | useAuth |
| 8 | `useShop` | Créer `/api/omega/shop` (produits, achat JCC) | Élevé | useWallet |
| 9 | `useTrade` | Créer `/api/omega/trade` (swap JCC↔EUR, plafond 150€) | Élevé | useWallet, compliance |
| 10 | `useAdhesion` | Créer `/api/omega/adhesion` (Stripe Subscriptions) | Élevé | Stripe |
| 11 | `useGouvernance` | Créer `/api/omega/gouvernance` (votes, propositions) | Élevé | useWallet |
| 12 | `useTerminal` | Créer `/api/omega/terminal` (commandes, logs, deploy) | Moyen | useAuth (admin) |

---

## 4. RISQUES IDENTIFIÉS

### 4.1 Risques techniques (haute probabilité)

| # | Risque | Impact | Mitigation |
|---|--------|--------|------------|
| R1 | **Budget Emergent LLM Key épuisé** | CVL Brain IA inopérant (erreur 500 sur `/api/brain/chat-enriched`) | Recharger via Profil → Universal Key → Add Balance AVANT de câbler useBrain |
| R2 | **Rate limiter agressif** (429) | Bloque les tests API en boucle après ~20 requêtes/minute | Augmenter le seuil dans `rate_limit_middleware` (L.130) ou ajouter un bypass pour les IPs internes |
| R3 | **server.py monolithique** (9865 lignes) | Risque élevé de régression à chaque modification. Le grep est lent, les conflits de merge sont fréquents | Extraire les nouveaux endpoints Omega dans `/routes/omega.py` plutôt que d'ajouter dans server.py |
| R4 | **Plafond 150€ non enforcé** | Risque réglementaire si le wallet est câblé sans cette logique | Implémenter le contrôle plafond dans `useWallet` + backend AVANT de mettre en production |

### 4.2 Risques CSS / UI (moyenne probabilité)

| # | Risque | Impact | Mitigation |
|---|--------|--------|------------|
| R5 | **Fuite CSS Omega vers la vitrine** | Les classes `.omega-glass`, `.omega-animate-orbit` pourraient fuiter si un composant vitrine importe accidentellement du CSS partagé | Toutes les classes Omega sont préfixées `omega-` et confinées dans `index.css`. Vérifier l'absence de conflit avec `tailwind.config.js` |
| R6 | **Images Unsplash CDN** | 9 images viennent d'Unsplash CDN. En production, les images doivent être stockées localement ou sur Cloudinary | Migrer vers Cloudinary lors du câblage `useFeed`/`useShop` en ITER.58 |
| R7 | **`referrerPolicy="no-referrer"` partout** | Nécessaire pour éviter les erreurs 403 Unsplash, mais devra être retiré quand les images seront locales | Retirer quand les images sont migrées |

### 4.3 Risques de dépendances circulaires (faible probabilité)

| # | Risque | Composants concernés | Mitigation |
|---|--------|---------------------|------------|
| R8 | **ProApp ↔ sous-vues** | Chaque sous-vue appelle `onSelect("wallet")` ou `onSelect("frek_id")` pour naviguer vers d'autres vues, ce qui repasse par ProApp | Architecture correcte (lifting state up). Pas de dépendance circulaire réelle, mais attention si des hooks partagent un contexte React |
| R9 | **useWallet ↔ useTrade** | Le swap dans WalletView devrait appeler useTrade, mais useTrade dépend de useWallet pour le solde | Résoudre en faisant de useWallet le provider unique du solde, et useTrade un consumer |

---

## 5. DÉCISIONS TECHNIQUES PRISES

### 5.1 Écarts entre le ZIP original Omega et l'implémentation Emergent

| # | ZIP Original | Implémentation Emergent | Raison | Impact ITER.58 |
|---|-------------|------------------------|--------|----------------|
| D1 | **TSX** (TypeScript) | **JSX** (JavaScript pur) | Le projet Emergent utilise CRA sans TypeScript. Conversion manuelle de tous les types, interfaces, et generics | Les hooks ITER.58 devront aussi être en JS. Les interfaces `omega.ts` de l'ITER.56 servent de référence mais ne sont pas importées |
| D2 | **Tailwind v4** (`bg-bg`, `text-bg/50`, `inset-shadow-*`, `backdrop-blur-xs`) | **Tailwind v3** + CSS custom dans `index.css` | Tailwind v4 n'est pas compatible avec la config CRA actuelle. Les classes v4-only ont été mappées en CSS explicite dans `index.css` ou converties en `style={{}}` inline | Aucun impact — le mapping est stable. Les nouvelles classes devront continuer d'utiliser la même convention |
| D3 | **`@/components/ui/*`** imports | Imports relatifs `../components/ui/*` | Le ZIP utilisait des path aliases TypeScript (`@/`). CRA utilise `craco` avec alias `@` configuré, mais les composants Omega sont dans un sous-dossier donc les imports sont relatifs | Aucun impact |
| D4 | **framer-motion** (ancien package) | **`motion`** (nouveau package `motion/react`) | Le ZIP importait `framer-motion`. Le package installé est `motion` (successeur), avec des imports `from "motion/react"` | Aucun impact — l'API est identique |
| D5 | **Route `/espace-pro`** | **Route `/pro`** | Deux routes coexistent : `/espace-pro` (ancien LinkedIn Culturel, toujours dans AppLayout) et `/pro` (nouveau Omega, HORS AppLayout). Ils sont indépendants | En ITER.58, décider si `/espace-pro` est déprécié au profit de `/pro`, ou s'ils coexistent. Le menu header affiche "Espace Pro" qui pointe vers `/pro` |
| D6 | **Données via hooks réels** | **Données 100% mockées** | ITER.57 = coquille visuelle. Aucun appel API n'est effectué par les composants Omega | ITER.58 devra câbler chaque mock au hook correspondant (voir section 3) |
| D7 | **Fond CSS `bg-bg`** | **`style={{ background: '#050505' }}`** | La couleur `bg` de Tailwind v4 a été remplacée par des styles inline avec la valeur exacte `#050505` ou `#0e0e0e` | Aucun impact — cohérent avec la palette Omega |
| D8 | **Glassmorphism via `glass` utility** | **`.omega-glass` dans index.css** | Classe CSS custom : `background: rgba(10,10,10,0.6); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08)` | Aucun impact |

### 5.2 Dépendances ajoutées au package.json

| Package | Version | Raison |
|---------|---------|--------|
| `motion` | ^12.x | Animations Framer Motion (successeur de `framer-motion`) |
| `react-markdown` | ^9.x | Rendu Markdown dans BrainChat |
| `remark-gfm` | ^4.x | Support tables/strikethrough dans Markdown |
| `react-syntax-highlighter` | ^15.x | Coloration syntaxique code dans BrainChat |

### 5.3 CSS ajouté dans index.css (mapping Tailwind v4 → v3)

```css
/* Animations Omega */
@keyframes omega-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes omega-counter-orbit { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
.omega-animate-orbit { animation: omega-orbit 60s linear infinite; }
.omega-animate-counter-orbit { animation: omega-counter-orbit 60s linear infinite; }

/* Glassmorphism Omega */
.omega-glass {
  background: rgba(10,10,10,0.6);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.08);
}

/* Shimmer + Glow */
@keyframes omega-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
.omega-animate-shimmer { ... }
.omega-orbital-glow { ... }
```

### 5.4 Couleurs ajoutées dans tailwind.config.js

```js
gold: "#f2ca50",
'gold-dim': "#D4AF37",
'omega-bg': "#0e0e0e",
'omega-surface': "#1c1b1b",
```

---

## ANNEXE : Arbre des fichiers créés/modifiés

```
/app/frontend/
├── src/
│   ├── components/omega/        # CRÉÉ (13 fichiers)
│   │   ├── ProApp.jsx           # 105 lignes — Orchestrateur
│   │   ├── Background.jsx       # 155 lignes — Fond animé SVG
│   │   ├── OrbitalMenu.jsx      # 116 lignes — Menu orbital
│   │   ├── BrainChat.jsx        # 210 lignes — Chat IA
│   │   ├── WalletView.jsx       # 250 lignes — Portefeuille
│   │   ├── ShopView.jsx         # 115 lignes — Boutique
│   │   ├── FeedView.jsx         # 129 lignes — Feed vertical
│   │   ├── InboxView.jsx        # 111 lignes — Messagerie
│   │   ├── BuilderView.jsx      # 203 lignes — Éditeur projets
│   │   ├── CockpitView.jsx      # 158 lignes — Console dev
│   │   ├── SovereignProfileView.jsx # 183 lignes — Profil + paramètres
│   │   ├── ContentDisplay.jsx   # 173 lignes — Vue contenu
│   │   └── Logo.jsx             # 65 lignes — Logo SVG
│   ├── App.js                   # MODIFIÉ — Route /pro hors AppLayout
│   ├── index.css                # MODIFIÉ — CSS Omega ajouté
│   └── tailwind.config.js       # MODIFIÉ — Couleurs Omega ajoutées
└── package.json                 # MODIFIÉ — 4 dépendances ajoutées
```

**Total** : ~1973 lignes de code JSX + ~30 lignes CSS + ~20 lignes config = ~2023 lignes ajoutées.

---

*Document généré le 2026-02-XX — ITER.57 FONDATION OMEGA terminé.*
*Prochain jalon : ITER.58 — Câblage réel des données.*
