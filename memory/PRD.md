# CC2026 — KILTIKONET Platform — PRD

## Original Problem Statement
Plateforme événementielle/culturelle premium omnicanale (React 19 + FastAPI + MongoDB) pour Culture Connect 2026. Intégration IA avancée "CVL BRAIN", design premium "Sovereign Onyx".

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python) — `server.py` monolithique (~9000 lignes)
- **Database**: MongoDB (`culture_connect_2026`)
- **Auth**: HttpOnly cookies + Google OAuth (Emergent) + Magic Links (Brevo)
- **AI**: Claude Sonnet 4.5 via Emergent Integrations
- **PWA**: Service Worker avec offline support

## Design System — Sovereign Onyx
- **Fond**: `#0a0a0b` (OLED Black) → `#131314` (Surface) → `#1b1b1c` (Cards)
- **Or accent**: `#E8D5A0` / `#d8c591` / `#c8a84b`
- **Texte**: `#e5e2e3` (jamais #FFFFFF pur)
- **Muted**: `#72727a`
- **Typos**: Newsreader (serif italic pour titres) + Manrope (sans-serif pour labels)
- **Icônes**: Material Symbols Outlined
- **Règles**: No-Line (pas de bordures 1px), tonal layering, glassmorphism

## What's Been Implemented

### Phase GO-LIVE (Completed)
- Nettoyage DB, audit sécurité, rate limiting
- Migration AWS SES → Brevo HTTP API
- Magic Links (remplace OTP)
- Google OAuth (Emergent Integrations)
- Dashboard admin santé + invitations équipe
- PWA install prompt

### Élévation Visuelle Sovereign Onyx — Phase 1 & 2 (Completed — 2026-04-04)
**Phase 1 — Fondations visuelles**:
- Design System CSS variables + fonts (Newsreader, Manrope, Material Symbols)
- Header glassmorphique avec logo "*Kiltikonet*" italic + CVL BRAIN ACTIF badge
- Bottom Nav Mobile 5 onglets Material Symbols (Explore/Network/BRAIN/Shop/Profile)
- Desktop Nav 5 onglets Material Symbols avec états hover/actif
- CvlBrainFloat redesigné style Sovereign
- Cards sans bordures (no-line rule), tonal layering

**Phase 2 — Sections profondes**:
- **NetworkPage** : "L'Écho du Réseau" éditorial avec glass search panel, sidebar bento stats
- **ShopSection** : "Sovereign Core Shop" avec hero, editorial grid (Jetons CC + Intelligence Privée Onyx), manifesto, stats bento
- **Brain pleine page** : Message d'accueil créole, suggestions contextuelles, command bar (upload/mic/code)
- **EventsPage** : "Agenda Souverain" éditorial
- **OpportunitiesPage** : Style éditorial Sovereign
- **RecommendationsWidget** : Style Sovereign (profils suggérés)
- **ProOnboarding** : Bouton "Passer pour l'instant" (skip)
- **Rate Limiter** : Magic link routes whitelisted

## Prioritized Backlog

### P0 — En Cours
- (Aucun bloqueur)

### P1 — Prochaines Tâches
- CVL BRAIN Module 1: Mémoire Persistante (collection `brain_memory`, APIs sauvegarde/récupération)
- CVL BRAIN Module 2: Web Search Temps Réel (intégration Tavily API)
- Compléter les 42 écrans restants des maquettes Stitch (Archives, Vault, Gouvernance, Paramètres, Console de Pilotage, etc.)
- Problème DNS IONOS (config A/CNAME pour kiltikonet.fr — côté utilisateur)

### P2 — Backlog
- CVL BRAIN Modules 3-10: Upload fichiers, génération docs, terminal, agents autonomes, image/audio/vidéo
- Standalone NetworkPage (/espace-pro/reseau) styling update
- Déploiement production
- Export PDF badges batch

### P3 — Futur
- Mgraph D3.js interactif
- Vue 3D SmartEngine
- PWA App Scan Staff

## Key DB Schema
- `magic_links`: `{token, email, expires_at, used}`
- `invitations`: `{token, email, name, role, expires_at, used}`
- `brain_memory` (à créer): `{frek_id, session_id, messages, context_summary, created_at, updated_at, tags}`

## Key API Endpoints
- `POST /api/auth/magic/request` — Request magic link
- `GET /api/auth/magic/{token}` — Validate magic link + login
- `GET /api/auth/google/callback` — Google OAuth callback
- `/api/brain/*` — CVL Brain endpoints (Claude Sonnet)
- `/api/pro/social/*` — Social feed (posts, likes, comments)
- `/api/cultural-feed` — Cultural cards feed

## Credentials
- Admin: cultureconnectorg@gmail.com
- Bypass code: 000000

## 3rd Party Integrations
- Stripe (Paiements) — User API Key
- Brevo HTTP API (Emails) — Configuré
- Google OAuth — Emergent Integrations
- Anthropic Claude Sonnet — Emergent LLM Key
- (À venir) Tavily API, Replicate, Runway ML, ElevenLabs

## Test Reports
- `/app/test_reports/iteration_63.json` — GO-LIVE validé 100%
- `/app/test_reports/iteration_64.json` — Élévation Visuelle Phase 1 validée 100%
- `/app/test_reports/iteration_65.json` — Élévation Visuelle Phase 2 validée 100%
