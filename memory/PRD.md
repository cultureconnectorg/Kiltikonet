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

## Moteur d'Identité Culturelle (iter.49 — 1er Avril 2026)

### Backend APIs
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/cultural-identity/{user_id}` | GET | Score culturel (0-100) + 7 dimensions + niveau |
| `/api/cultural-identity/{user_id}/recalculate` | POST | Recalcul dynamique du score |
| `/api/cultural-feed` | GET | Feed culturel non-chronologique, filtrable par type/dimension |
| `/api/cultural-reactions` | POST | Toggle réaction culturelle (5 types) |
| `/api/cultural-feed/seed` | POST | Seed 18 cartes culturelles |

### 7 Dimensions
Musique · Arts Visuels & Scéniques · Langue Créole · Patrimoine & Traditions · Gastronomie · Féminité & Matriarcat · Identité Diasporique

### 5 Niveaux
Initié (0-20) · Ancré (21-40) · Enraciné (41-60) · Transmetteur (61-80) · Pilier (81-100)

### 5 Réactions Culturelles
🔥 Feu · 🥁 Rythme · 🌺 Racines · ✊ Résistance · 💫 Lumière

### Frontend Components (Phase 2)
| Composant | Fichier | Statut |
|-----------|---------|--------|
| CulturalIdentityBar | `components/pro/CulturalIdentityBar.jsx` | DONE |
| ConstellationRadar | `components/pro/ConstellationRadar.jsx` | DONE |
| CulturalFeed | `components/pro/CulturalFeed.jsx` | DONE |
| CulturalCards | `components/pro/CulturalCards.jsx` | DONE |
| CulturalReactions | `components/pro/CulturalReactions.jsx` | DONE |
| MobileNavigation | `components/pro/MobileNavigation.jsx` | DONE |

### Design Tokens
- Fond: `#0a0a0a`
- Or accent: `#C8A84B`
- Texte: `#FFFFFF` / `#888888`
- Surface: `#141414`
- Police: DM Sans / Inter

### 18 Cartes Seedées
5 Musique (Kassav', Malavoi, Admiral T, Tabou Combo, Jacob Desvarieux)
4 Artistes (Ronald Selbonne, Hervé Beuze, Jocelyne Béroard, Maryse Condé)
3 Lieux (Habitation Clément, Citadelle Laferrière, Marché de la Darse)
3 Événements (CC2026, Biennale, Jounen Kwéyol)
3 Patrimoine (Le Bèlè, Le Colombo, Le Conte Créole)

## Test Status
- iter.49: Backend 14/14 ✅, Frontend 6/6 ✅

## Backlog Prioritaire
- P1: Emails candidature (Resend vs Brevo SMTP)
- P2: Mgraph D3.js interactif
- P3: Vue 3D SmartEngine
- P4: Export PDF badges batch

## Contraintes
- Ne pas toucher : Smart Engine, badges, Jeton CC, Stripe, hCaptcha, exports PDF
- AWS SES bloqué en Sandbox (utiliser Resend)
- Three.js incompatible React 19

## Credentials
- Admin bypass: cultureconnectorg@gmail.com (Code: 000000)
- Dashboard admin: CC2026admin
