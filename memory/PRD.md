# CC2026 — Plateforme Culture Connect

## Vision
Plateforme événementielle pour les industries culturelles caribéennes.
Stack : React 19 + FastAPI + MongoDB.

## Core Features (Stable)
- Accréditations avec 4 types de badges (Pro, Institu, Médias, VIP)
- Paiements Stripe intégrés
- Génération de badges via FREKcore
- PWA avec scan NFC hors-ligne
- Dashboard admin multi-espace (Coleen, Twina, Ghost)
- Système de Jetons CC (récompenses)
- Système Ghost Population (20 profils IA)
- Onboarding CVL Brain
- Emails via Resend

## Moteur d'Identité Culturelle (iter.49)

### Backend APIs
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/cultural-identity/{user_id}` | GET | Score culturel (0-100) + 7 dimensions + niveau |
| `/api/cultural-identity/{user_id}/recalculate` | POST | Recalcul dynamique du score |
| `/api/cultural-feed` | GET | Feed culturel non-chronologique, filtrable |
| `/api/cultural-reactions` | POST | Toggle réaction culturelle (5 types) |
| `/api/cultural-feed/seed` | POST | Seed 18 cartes culturelles |

### 7 Dimensions
Musique · Arts Visuels & Scéniques · Langue Créole · Patrimoine & Traditions · Gastronomie · Féminité & Matriarcat · Identité Diasporique

### 5 Niveaux
Initié (0-20) · Ancré (21-40) · Enraciné (41-60) · Transmetteur (61-80) · Pilier (81-100)

### 5 Réactions Culturelles
Feu · Rythme · Racines · Résistance · Lumière

### Frontend Components
| Composant | Fichier |
|-----------|---------|
| CulturalIdentityBar | `pro/CulturalIdentityBar.jsx` |
| ConstellationRadar | `pro/ConstellationRadar.jsx` |
| CulturalFeed | `pro/CulturalFeed.jsx` |
| CulturalCards | `pro/CulturalCards.jsx` |
| CulturalReactions | `pro/CulturalReactions.jsx` |
| MobileNavigation | `pro/MobileNavigation.jsx` |

## Design Premium (iter.50 — 1er Avril 2026)

### Design Tokens (CSS variables)
- `--bg-primary: #0a0a0a`
- `--bg-card: #141414`
- `--accent-gold: #C8A84B`
- `--text-primary: #FFFFFF`
- `--text-secondary: #888888`
- `--border-subtle: #1e1e1e`
- Font: Inter (Google Fonts)

### Refonte visuelle appliquée
- Avatars : dégradé radial #1e1e1e→#2a2a2a + anneau or au hover
- Score : masqué --/100 si 0 cartes, barre fine avec shimmer
- Level dots : connectés par ligne, tooltip au hover
- Cards : full media TikTok (280px image, overlay gradient, badge type)
- Posts : style X/Twitter dense (avatar 52px, badge rôle avec bordure)
- Réactions : burst coloré par type (orange/marron/rose/or/blanc)
- Profils suggérés : noms tronqués, "Membre CC2026" pour données test
- Boutons : "Rejoindre" au lieu de "Se connecter"
- J-50 : pulse animation (scale 1→1.03→1)
- Header : glassmorphism, nav avec underline or actif
- Mobile : bottom bar fixe, safe-area-inset, bouton Créer surélevé
- Skeleton loading sur tous les états de chargement
- prefers-reduced-motion support

## 18 Cartes Seedées
5 Musique (Kassav', Malavoi, Admiral T, Tabou Combo, Jacob Desvarieux)
4 Artistes (Ronald Selbonne, Hervé Beuze, Jocelyne Béroard, Maryse Condé)
3 Lieux (Habitation Clément, Citadelle Laferrière, Marché de la Darse)
3 Événements (CC2026, Biennale, Jounen Kwéyol)
3 Patrimoine (Le Bèlè, Le Colombo, Le Conte Créole)

## Test Status
- iter.49: Backend 14/14, Frontend 6/6
- iter.50: Backend 10/10, Frontend 100% visuel

## Backlog Prioritaire

### ITER.49 (en cours)
- P0: CreateCulturalCard.jsx (modal création cartes interactives)
- P0: POST /api/cultural-search (proxy Spotify/Wikipedia/Google Places/Unsplash)
- P0: POST /api/cultural-cards (création cartes + recalcul score)
- P0: Monétisation (sponsored cards, affiliation Spotify, analytics)
- P0: GET /api/analytics/cultural-trends + /cultural-profiles (admin)
- Clés requises : SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, GOOGLE_PLACES_API_KEY, UNSPLASH_ACCESS_KEY

### Backlog général
- P1: Emails candidature (Resend domain kiltikonet.fr)
- P2: Mgraph D3.js interactif
- P3: Vue 3D SmartEngine
- P4: Export PDF badges batch

## Contraintes
- Ne pas toucher : Smart Engine, badges, Jeton CC, Stripe, hCaptcha, exports PDF
- AWS SES bloqué en Sandbox (utiliser Resend)

## Credentials
- Admin bypass: cultureconnectorg@gmail.com (Code: 000000)
- Dashboard admin: CC2026admin
