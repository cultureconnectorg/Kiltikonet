# PRD — Kiltikonet.fr / CC2026
# ==============================

## Objectif
Plateforme culturelle caribéenne full-stack (React 19 + FastAPI + MongoDB).
Ecosystème "Stitch Sovereign Onyx" avec Espace Pro, Wallet Stripe, CVL Brain IA,
Feed/Reels dynamiques, et gouvernance associative.

## Architecture
- Frontend: React 19, design Sovereign Onyx
- Backend: FastAPI, MongoDB (culture_connect_2026)
- Auth: FREK-ID, GitHub OAuth, Google OAuth, Magic Links
- LLM: Claude Sonnet via Emergent LLM Key
- Paiements: Stripe Checkout

## Couche Doctrinale (2026-04-07)
Matrice des 5 acteurs CVLN implementee :
- `actor_role` ajoute a `registrations` (creator|distributor|institutional|professional|consumer)
- Collection `doctrine_permissions` avec capacites, revenus, flux CC par role
- `platform_fee` documente la marge CVLN sur chaque role (creator: 30%)
- `governance_weight` reequilibre (creator:3, distributor:2, institutional:3, professional:2, consumer:1)
- **Gate middleware `require_permission(action)`** applique les `can[]` en conditions reelles sur **57 routes** POST/PUT/DELETE
- Routes CMS (32), pro (7), wallet (2), brain (1), shop_payments (4), fintech (8), pro_feed (2), brain (1)
- Routes publiques GET : zero impact, aucune gate
- Endpoint `GET /api/doctrine/my-permissions` retourne les permissions du user connecte
- **Frontend** : badge `label_fr` affiche dans le header navbar, le sidebar desktop, et le profil. Liste des `can[]` visible sur la fiche profil (un seul fetch, zero double appel).
- Mapping automatique `profile_type` -> `actor_role` a l'inscription
- Backfill des utilisateurs existants au startup
- Audit trail dans `doctrine_audit` (assignations + refus de permission)
- Ref: /app/DOCTRINE.md

## Phases completees (session courante)
- Phase 1: Feed vivant + Reels avec videos reelles (video_url, thumbnail_url)
- Phase 2: Wallet complet (Envoyer/Echanger/Trading modales, bouton +, historique banque)
- Phase 3: Inbox mark-as-read en base
- Phase 4: Studio renomme (LinkedIn -> Reseau), Terminal thought process, API masquees
- Phase 5: CVL Brain upgrade (c'est genial, thinking messages, thought process)
- Phase 6: Profil Gouvernance (Association Kiltikonet, logo vert, hierarchie adherant)
- Couche Doctrinale: Matrice 5 acteurs, routes API, backfill, audit

## Backlog
- (P1) Settings page cablage complet
- (P1) Smart Engine & Analytics 100% interne
- (P2) Refactoring server.py (>9800 lignes)
- (P2) DNS IONOS domain
- (P3) AWS SES sortie sandbox
- (P3) Three.js vue 3D (bloque React 19)
