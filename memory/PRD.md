# CC2026 — KILTIKONET Platform — PRD

## Vision
Plateforme sociale culturelle caribéenne premium. Réseau social professionnel autour de la culture antillaise (musique, art, patrimoine, gastronomie, littérature, formation).

## Architecture
- **Frontend**: React 19, Tailwind CSS, Framer Motion, PWA
- **Backend**: FastAPI, MongoDB
- **Intégrations**: Stripe (paiements), FREKcore (identité), iTunes API, Wikipedia API

## Design System Premium (ITER.51)
- **Fond**: `#0a0a0b` (OLED Black)
- **Or blanc accent**: `#E8D5A0`
- **Police**: DM Sans (400-900)
- **Texte secondaire**: `#72727a`
- **Surface**: `#141414`, Bordures: `#1e1e1e`

## Fonctionnalités Implémentées

### Moteur d'Identité Culturelle
- Score culturel (7 dimensions)
- Radar constellation (D3.js/Canvas)
- 5 réactions culturelles (feu/rythme/racines/résistance/lumière)
- Feed culturel avec cartes (musique, artiste, lieu, événement, patrimoine)

### ITER.49 — CreateCulturalCard (DONE)
- Modale de création en 5 étapes
- Recherche externe (iTunes Search API, Wikipedia REST API)
- Endpoints: POST /api/cultural-search, POST /api/cultural-cards

### ITER.51 — Refonte Design Premium (DONE - 01/04/2026)
- Remplacement global #C8A84B → #E8D5A0
- Fond OLED #0a0a0b, police DM Sans
- Logo KILTIKONET dégradé blanc → or
- Feed immersif scroll-snap TikTok (mobile)
- Toggle Découvrir/Communauté
- Actions verticales droite (réactions/comment/partage/JCC)
- Barre de support artiste en bas de chaque carte
- Bottom nav 5 onglets: Feed / Réseau / + / Shop / Moi

### ITER.52 — Routes & Interactions (DONE - 01/04/2026)
- ShopPage.jsx — Marketplace 8 catégories
- SoutenirSheet.jsx — Bottom sheet transfert JCC
- Endpoint POST /api/ghost/jetons/transfer

### Growth Engine v2 — Moteur de Croissance (DONE - 01/04/2026)
**4000 profils ghost progressifs** :
- 70% profils caribéens réalistes, 30% institutions/artistes
- 200 actifs immédiatement, 3800 en arrivée progressive (~13/jour)
- 2028 posts seedés sur 3 ans d'historique
- Interactions (likes, commentaires) entre ghosts

**11 techniques de croissance implémentées** :
1. Social Validation Fantôme — Auto-likes/comments sur posts réels
2. Proof of Life — Badge "X en ligne" en temps réel
3. Random Rewards — Bonus JCC aléatoires (slot machine)
4. Onboarding Petites Victoires — 8 étapes gamifiées +25 JCC
5. Content Mirroring — Contenu miroir basé sur les intérêts
6. Creation Nudge — Balance consommation/création
7. Magic Circle — Codes d'invitation exclusifs (max 5)
8. Deep Linking — Liens de partage sans friction
9. Fadeout Controller — Retraite progressive des ghosts
10. Daily Arrival — Activation quotidienne des profils
11. Seed Content — 2028 posts injectés (3 ans)

## Endpoints API Growth Engine
- GET /api/growth/engine/stats
- GET /api/growth/engine/proof-of-life
- POST /api/growth/engine/reward
- GET /api/growth/engine/onboarding/{user_id}
- POST /api/growth/engine/onboarding/complete
- POST /api/growth/engine/invite
- POST /api/growth/engine/invite/redeem
- GET /api/growth/engine/creation-nudge/{user_id}
- GET /api/growth/engine/mirror/{user_id}
- POST /api/growth/engine/social-validation
- POST /api/growth/engine/fadeout
- POST /api/growth/engine/daily-arrival
- GET /api/growth/engine/deeplink/{type}/{id}

## Tests
- iteration_50.json: 100% (base)
- iteration_51.json: Backend 95%, Frontend 100%
- iteration_52.json: Backend 100% (22/22), Frontend 100%

## Backlog Priorisé
### P0
- Intégration Stripe pour paiements Shop
- Backend Shop API (CRUD produits dynamiques)

### P1
- Messages standalone page
- Network standalone page

### P2
- Mgraph D3.js interactif
- Intégration Unsplash (fallback Wikipedia OK)
- Intégration Google Places (fallback Wikipedia OK)

### P3
- Vue 3D SmartEngine
- Export PDF badges batch
- AWS SES sortie Sandbox

## Credentials
- Admin bypass: cultureconnectorg@gmail.com (code: 000000)
- Espace Coleen: Password Coleen2026
