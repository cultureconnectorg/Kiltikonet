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
- Mapping automatique `profile_type` -> `actor_role` a l'inscription
- Backfill des utilisateurs existants au startup
- Audit trail dans `doctrine_audit`
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
