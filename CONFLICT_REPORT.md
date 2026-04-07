# CONFLICT_REPORT.md — Conflits ZIP Omega x Core + MISSING_ENDPOINTS.md
# kiltikonet.fr — ITER.56 Phase 2.2 & 2.3
# Date : 2026-04-07

---

## PARTIE 1 : CONFLITS DE NOMMAGE

### 1.1 — Composants en Conflit

| Composant ZIP | Composant Core | Strategie |
|---|---|---|
| `App.tsx` (MonEspace) | `ProSpaceDashboard.jsx` | **REMPLACER** : Le layout Omega (orbital, sections) remplace le dashboard actuel pour /espace-pro |
| `BrainChat.tsx` | `TerminalConsole.jsx` | **FUSIONNER** : Design Omega + logique existante (endpoints, auth, thought process) |
| `WalletView.tsx` | `WalletPage.jsx` | **FUSIONNER** : UI Omega + endpoints existants (my-wallet/*) |
| `FeedView.tsx` | `FeedPage.jsx` + `ReelsFeed.jsx` | **FUSIONNER** : UI Omega + endpoints existants (pro/feed/*) |
| `InboxView.tsx` | `InboxPage.jsx` | **FUSIONNER** : UI Omega + endpoints existants (pro/messages/*) |
| `ShopView.tsx` | `VitrinePage.jsx` | **REMPLACER** : Omega est plus complet |
| `SovereignProfileView.tsx` | `ProfileTriptych.jsx` | **FUSIONNER** : Profil Omega + donnees doctrine existantes |
| `Layout.tsx` | `Header.jsx` | **COEXISTENCE** : Layout Omega pour /espace-pro, Header pour pages publiques |
| `Logo.tsx` | Aucun logo composant | **NOUVEAU** : Pas de conflit |
| `Background.tsx` | Aucun equivalent | **NOUVEAU** : Pas de conflit |
| `OrbitalMenu.tsx` | Sidebar dans ProSpaceDashboard | **REMPLACER** : L'orbital remplace la sidebar classique |
| `ContentDisplay.tsx` | Aucun equivalent | **NOUVEAU** : Container adaptatif pour le contenu |
| `BuilderView.tsx` | Aucun equivalent | **NOUVEAU** : Editeur/terminal avance |
| `CockpitView.tsx` | `SmartAnalytics.js` | **COEXISTENCE** : Cockpit dans /espace-pro, SmartAnalytics dans /analytics |

### 1.2 — Classes CSS en Collision

| Classe ZIP (TW4) | Existence Core | Resolution |
|---|---|---|
| `bg-bg` | NON | Ajouter `bg: '#0e0e0e'` dans tailwind.config.js |
| `text-gold` | NON | Ajouter `gold: '#f2ca50'` |
| `border-gold` | NON | Idem |
| `text-gold-dim` | NON | Ajouter `gold-dim: '#d4af37'` |
| `font-headline` | NON | Ajouter fontFamily headline |
| `font-label` | NON | Ajouter fontFamily label |
| `font-mono` | OUI (natif TW) | Pas de conflit |
| `glass` | NON | Ajouter comme classe CSS custom |
| `animate-orbit` | NON | Ajouter keyframes + classe |
| `animate-counter-orbit` | NON | Ajouter keyframes + classe |
| `bg-surface` | NON | Ajouter `surface: '#1c1b1b'` |

### 1.3 — Routes en Conflit

| Route ZIP | Route Core | Resolution |
|---|---|---|
| `/` (Home) | `/` (Landing) | **COEXISTENCE** : Landing = public, MonEspace = /espace-pro |
| `/badge/:id` (BadgeInscription) | `/activer-badge/:token` | **RENOMMER** : Garder la route Core. L'inscription badge Omega sera sur /espace-pro/badge |
| `/mon-espace` (MonEspace) | `/espace-pro` | **UNIFIER** : `/espace-pro` reste la route officielle |

### 1.4 — Variables CSS en Doublon

Le Core utilise des couleurs en constantes JS (dans chaque composant) :
```js
const G = '#d8c591'; // Gold accent
const C = { gold: '#E8D5A0', bg: '#131314', surface: '#1c1b1c', ... };
```

Le ZIP utilise des CSS custom properties :
```css
--color-gold: #f2ca50;
--color-bg: #0e0e0e;
```

**Resolution** : Les couleurs ne sont pas exactement les memes !
- Core gold : `#d8c591` / `#E8D5A0` (plus chaud, plus mat)
- ZIP gold : `#f2ca50` (plus vif, plus sature)
- Core bg : `#0a0a0b` / `#131314` (presque noir)
- ZIP bg : `#0e0e0e` (presque noir aussi)

**Decision** : Adopter les couleurs du ZIP Omega (`#f2ca50`, `#0e0e0e`) comme standard. Mettre a jour les constantes Core progressivement lors de la fusion.

---

## PARTIE 2 : ENDPOINTS MANQUANTS POUR ITER.58

### Feed

```
GET  /api/feed/posts?page=X&limit=10
  → Existe comme : GET /api/pro/feed (200 ACTIF)
  → Format retourne : { posts: [...], total: N }

POST /api/feed/posts/:id/eclair
  → MANQUANT — "Eclair" = reaction rapide (equivalent Like premium)
  → Body : { user_id: string }
  → Response : { success: true, eclair_count: number }
  → Logique : Debiter 1 KT du wallet, incrementer eclair_count du post

POST /api/feed/posts/:id/commentaire
  → Existe comme : POST /api/pro/feed/posts/{id}/comment (ACTIF)
```

### Messages / DMs

```
GET  /api/messages/conversations
  → Existe comme : GET /api/pro/messages/{profile_id} (ACTIF)
  → Mais pas au format attendu par le ZIP

GET  /api/messages/conversations/:id
  → MANQUANT — Charger une conversation specifique avec messages
  → Response : { id, participants: [], messages: [{role, content, timestamp}], unread: 0 }

POST /api/messages/send
  → Existe comme : POST /api/pro/messages/send (ACTIF)
```

### Planning / Agenda

```
GET  /api/planning/cc2026
  → Existe comme : GET /api/shared/planning (ACTIF)
  → Format retourne : { planning: [...] }
  → Ecart : Le ZIP attend { days: [{ date, slots: [...] }] }
```

### Shop / Marketplace

```
GET  /api/shop/packs
  → Existe comme : GET /api/shop/packages (ACTIF)

GET  /api/shop/items?category=X
  → Existe comme : GET /api/shop/products (ACTIF)
  → Mais pas de filtre par categorie

POST /api/shop/checkout
  → Existe comme : POST /api/fintech/create-checkout (ACTIF)
```

### Trade

```
POST /api/trade/order
  → MANQUANT — Creer un ordre d'echange P2P
  → Body : { offer_type: 'buy'|'sell', token_type: 'KT'|'CC', amount: number, price_eur: number }
  → Response : { order_id, status: 'pending' }

GET  /api/trade/orders
  → MANQUANT — Lister les ordres actifs
  → Response : { orders: [], my_orders: [] }
```

### Adhesion

```
GET  /api/adhesion/levels
  → MANQUANT — Lister les niveaux d'adhesion
  → Response : { levels: [{ id, name, price_eur, benefits: [], quota_kt, quota_cc }] }

POST /api/adhesion/subscribe
  → MANQUANT — Souscrire a un niveau
  → Body : { level_id: string, payment_method: 'stripe'|'kt' }
```

### Gouvernance

```
GET  /api/gouvernance/proposals
  → MANQUANT — Lister les propositions de vote
  → Response : { proposals: [{ id, title, description, status, votes_for, votes_against, deadline }] }

POST /api/gouvernance/vote
  → MANQUANT — Voter sur une proposition
  → Body : { proposal_id: string, vote: 'for'|'against'|'abstain' }
```

### Terminal / Console

```
POST /api/terminal/deploy
  → MANQUANT — Deployer du HTML
  → Body : { slug: string, html: string, title: string }
  → Response : { deploy_id, url: string, timestamp }

GET  /api/terminal/deploys
  → MANQUANT — Historique des deploiements
  → Response : { deploys: [{ id, slug, url, title, created_at }] }
```

### Admin / NFC Scan

```
POST /api/admin/scan
  → Existe comme : POST /api/terrain/scan (ACTIF)
  → Mais le format peut differer
```

### User Settings

```
GET  /api/user/settings
  → MANQUANT — Recuperer tous les parametres
  → Voir PARAMS_AUDIT.md pour le format attendu

PUT  /api/user/settings
  → MANQUANT — Mettre a jour les parametres
  → Body : { notifications: {...}, privacy: {...}, preferences: {...} }
```

### FREK Certification

```
GET  /api/frek/works/:frek_id
  → MANQUANT — Lister les oeuvres certifiees d'un FREK-ID
  → Response : { works: [{ id, title, type, stage, fingerprint, created_at }] }

POST /api/frek/certify
  → MANQUANT — Certifier une oeuvre
  → Body : { title: string, type: string, file_hash: string, metadata: {} }
  → Response : { work_id, frek_id, stage: 'GENESIS', fingerprint: string }
```

---

## Synthese des Endpoints Manquants

| Module | Endpoint | Priorite |
|---|---|---|
| Feed | POST eclair (reaction premium) | P1 |
| Messages | GET conversation specifique | P1 |
| Trade | POST order + GET orders | P2 |
| Adhesion | GET levels + POST subscribe | P2 |
| Gouvernance | GET proposals + POST vote | P2 |
| Terminal | POST deploy + GET deploys | P1 |
| User Settings | GET + PUT settings | P1 |
| FREK | GET works + POST certify | P2 |
| **TOTAL** | **12 endpoints manquants** | — |
