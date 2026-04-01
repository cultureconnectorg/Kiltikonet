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

### ITER.49 — CreateCulturalCard (✅ Terminé)
- Modale de création en 5 étapes
- Recherche externe (iTunes Search API, Wikipedia REST API)
- Bouton flottant "+" dans le feed
- Endpoints: POST /api/cultural-search, POST /api/cultural-cards
- Analytics d'événements culturels

### ITER.51 — Refonte Design Premium (✅ Terminé - 01/04/2026)
- Remplacement global #C8A84B → #E8D5A0 (46 occurrences)
- Fond OLED #0a0a0b, police DM Sans
- Logo KILTIKONET dégradé blanc → or
- Feed immersif scroll-snap TikTok (mobile)
- Toggle "Découvrir / Communauté" (mobile)
- Cartes plein écran avec image overlay
- Actions verticales droite (réactions / commentaire / partager / JCC)
- Barre de support artiste en bas de chaque carte
- Bottom nav 5 onglets: Feed / Réseau / + / Shop / Moi
- Layout desktop 3 colonnes (sidebar identité / feed / recommandations)

### ITER.52 — Routes & Interactions (✅ Terminé - 01/04/2026)
- ShopPage.jsx — Marketplace 8 catégories (Billetterie, Jetons CC, Musique, Art, Gastronomie, Mode, Littérature, Formation)
- 14 produits seed (Jetons CC packs, Pass CC2026, albums, art, mode, formations)
- SoutenirSheet.jsx — Bottom sheet transfert JCC (sélection montant, affichage solde, envoi)
- Endpoint POST /api/ghost/jetons/transfer (débit/crédit avec logs transactions)
- Lien "Acheter des Jetons CC" si solde insuffisant

### Système Social
- Posts sociaux (création, fil d'actualité)
- Profils ghost (10 profils seed caribéens)
- Connexions et recommandations
- Messages (panel latéral)
- Onboarding interactif

### Système Événementiel CC2026
- Accréditations Pro (300€) / Institutionnel (500€)
- Badges avec génération FREKcore
- NFC, QR Code, Jetons CC (économie interne)
- Countdown J-49

## Produits Shop (Seed)
| ID | Nom | Prix | Catégorie |
|---|---|---|---|
| jcc-10 | 10 Jetons CC | 15€ | jetons |
| jcc-50 | 50 Jetons CC | 67.50€ | jetons |
| jcc-100 | 100 Jetons CC | 120€ | jetons |
| ticket-cc2026 | Pass CC2026 Général | 45€ | billetterie |
| ticket-cc2026-vip | Pass CC2026 VIP | 150€ | billetterie |

## Endpoints API Clés
- POST /api/cultural-search (proxy iTunes + Wikipedia)
- POST /api/cultural-cards (publication)
- GET /api/cultural-feed (avec filtres card_type)
- POST /api/cultural-reactions (5 types)
- GET /api/cultural-identity/{user_id}
- POST /api/ghost/jetons/transfer (soutien JCC)
- GET /api/ghost/jetons/{user_id}
- GET /api/pro/social/feed
- GET /api/pro/social/recommendations

## Tests
- iteration_50.json: 100% (base)
- iteration_51.json: Backend 95% (20/21), Frontend 100%

## Backlog Priorisé
### P1
- Backend Shop API (remplacer les produits seed frontend)
- Messages standalone page
- Network standalone page

### P2
- Mgraph D3.js interactif
- Intégration Unsplash (nécessite clé API)
- Intégration Google Places (nécessite clé API)

### P3
- Vue 3D SmartEngine
- Export PDF badges batch
- AWS SES sortie Sandbox (action utilisateur requise)

## Credentials
- Admin bypass: cultureconnectorg@gmail.com (code: 000000)
- Espace Coleen: Password Coleen2026
