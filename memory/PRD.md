# PRD — Kiltikonet.fr / CC2026

## Vision
Plateforme culturelle souveraine pour la diaspora afro-caribéenne. Espace Pro Omega avec 8 modules interconnectés (Feed, Shop, DMs, Agenda, Accréditation, Builder, Cockpit, CVL Brain), système d'identité FREK-ID, jetons JCC/KT, et gouvernance communautaire.

## Architecture
- **Frontend**: React 19, Framer Motion (`motion/react`), Monaco Editor, Shadcn UI
- **Backend**: FastAPI, MongoDB (`culture_connect_2026`)
- **Auth**: Magic link + code OTP (bypass admin: `000000`)
- **Paiements**: Stripe (test mode)
- **IA**: CVL Brain via Claude Sonnet (Emergent LLM Key)
- **Identité**: FREK-ID (système souverain)

## Itérations complétées

### ITER.58 (Terminé)
- Route `/pro` corrigée → OrbitalMenu Omega
- Ancien Espace Pro déplacé → `/admin/core`
- 8 modules câblés : Feed, Shop, DMs, Agenda, Accréditation, Builder, Cockpit, CVL Brain
- Gouvernance (propositions + votes)
- PWA `/scan` NFC
- Tests 100% front, 89% back (iter_81)

### ITER.59 (Terminé — 2026-04-08)
- Webhook Stripe étendu pour accreditation omega + JCC packs
- Baserow NFC sync après scan validé
- Export CSV Twina (UTF-8 BOM, `;`)
- 34 boutons câblés (13 inactifs → actifs, 21 mockés → fonctionnels)
- Splash Screen (vidéo 2s WebM+MP4)
- Son de notification (Web Audio API, toggle Paramètres)
- FrekView Cultural Impact Score
- Trade P2P (create/list/accept offers)
- 15 nouveaux endpoints backend
- Tests 93% back, 100% front (iter_82)

## Backlog P0/P1/P2

### P0 — Bloquants CC2026
- [x] Webhook Stripe Accréditation
- [x] Baserow NFC /scan
- [x] Export CSV Twina
- [x] 13 boutons inactifs

### P1 — Fonctionnalités importantes
- [x] 21 boutons mockés
- [x] FrekView Cultural Impact Score
- [x] Trade P2P
- [x] Splash Screen + Son notification
- [ ] Brevo 4 templates transactionnels
- [ ] Onboarding nouveau utilisateur complet

### P2 — UX avancée
- [ ] Swipe navigation OrbitalMenu
- [ ] Double tap Brain → Feed
- [ ] Animations orbitales distinctes par module
- [ ] PWA Installation prompt
- [ ] Kilti-Health Dashboard admin
- [ ] Nettoyage production (console.log, rate limiter)

## Collections MongoDB
`users`, `cc_badges`, `feed_posts`, `shop_products`, `kn_wallets`, `gouvernance_proposals`, `audit_logs`, `brain_sessions`, `builder_projects`, `frek_certifications`, `user_follows`, `trade_offers`, `accreditations_cc2026`, `nfc_scans_backup`

## Credentials de test
- Bypass Admin: `cultureconnectorg@gmail.com` (Code: `000000`)
- Espace Coleen: `Coleen2026`
- NFC Agent: `CC2026agent`

## Fichiers clés
- `/app/backend/routes/omega.py` — Tous les endpoints Omega (~2200 lignes)
- `/app/backend/server.py` — Monolithe principal (~9600 lignes)
- `/app/frontend/src/components/omega/` — 17 composants React
- `/app/ITER59_SUMMARY.md` — Rapport détaillé iter.59
- `/app/test_reports/iteration_82.json` — Dernier rapport de test
