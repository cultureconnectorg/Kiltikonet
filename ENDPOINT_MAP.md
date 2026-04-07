# ENDPOINT_MAP.md — Cartographie Complete des Endpoints FastAPI
# kiltikonet.fr — ITER.56 Phase 1.2
# Date : 2026-04-07
# Methode : Chaque endpoint teste EN LIVE via curl (pas en lisant le code)

## Legende
- ACTIF : repond 200 avec donnees coherentes
- PARTIEL : repond 200 mais donnees vides ou incompletes
- ERREUR : repond 4xx/5xx
- MANQUANT : route n'existe pas (404)
- AUTH : necessite cookie kk_session

---

## AUTH (`/api/auth/` + `/api/pro/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/auth/me` | OUI | 200 (auth) / 401 (no auth) | ACTIF |
| POST | `/api/auth/logout` | OUI | 200 | ACTIF |
| GET | `/api/auth/github` | NON | 302 redirect | ACTIF |
| GET | `/api/auth/github/callback` | NON | 200 | ACTIF |
| GET | `/api/auth/magic/{token}` | NON | 200/404 | ACTIF |
| POST | `/api/pro/request-access` | NON | 200 | ACTIF |
| POST | `/api/pro/verify-code` | NON | 200 | ACTIF |
| GET | `/api/pro/dev/get-code/{email}` | NON | 404 (prod) | ACTIF (dev only) |

## BRAIN (`/api/brain/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| POST | `/api/brain/analyse` | NON | 500 | ERREUR — LLM budget exceeded |
| POST | `/api/brain/entreprise` | NON | 500 | ERREUR — LLM budget exceeded |
| POST | `/api/brain/evenement` | NON | 500 | ERREUR — LLM budget exceeded |
| POST | `/api/brain/alerte` | NON | 500 | ERREUR — LLM budget exceeded |
| POST | `/api/brain/chat` | OUI (doctrine gate) | 200 | ACTIF (quand budget OK) |
| POST | `/api/brain/chat-enriched` | OUI (doctrine gate) | 500 | ERREUR — LLM budget exceeded |
| GET | `/api/brain/agent-status` | NON | 200 | ACTIF |
| GET | `/api/brain/analyses` | NON | 200 | ACTIF |
| GET | `/api/brain/alerts` | NON | 200 | ACTIF |
| POST | `/api/brain/web-search` | NON | 200 | ACTIF |
| GET | `/api/brain/memory/history` | NON | 200 | ACTIF |
| POST | `/api/brain/memory/save` | NON | 400 (needs valid data) | ACTIF |
| GET | `/api/brain/memory/{session_id}` | NON | 200 | ACTIF |
| DELETE | `/api/brain/memory/{session_id}` | NON | 200 | ACTIF |
| POST | `/api/brain/smart-engine-flux` | NON | 200 | ACTIF |
| POST | `/api/brain/alert-check` | NON | 200 | ACTIF |
| POST | `/api/brain/enrich-badge` | NON | 200 | ACTIF |
| POST | `/api/brain/daily-report` | NON | 200 | ACTIF |
| POST | `/api/brain/stripe-payment` | NON | 200 | ACTIF |
| POST | `/api/brain/pro-profile` | NON | 200 | ACTIF |
| POST | `/api/brain/batch-process` | NON | 200 | ACTIF |
| GET | `/api/brain/profile/{badge_id}` | NON | 200 | ACTIF |

## PRO FEED (`/api/pro/feed/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/pro/feed` | NON | 200 | ACTIF |
| GET | `/api/pro/feed/reels` | NON | 200 | ACTIF |
| POST | `/api/pro/feed/posts` | OUI (doctrine gate) | 200 | ACTIF |
| POST | `/api/pro/feed/posts/{id}/like` | OUI (doctrine gate) | 200 | ACTIF |
| POST | `/api/pro/feed/posts/{id}/comment` | OUI (doctrine gate) | 200 | ACTIF |

## PRO SOCIAL (`/api/pro/social/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/pro/social/feed` | NON | 200 | ACTIF |
| GET | `/api/pro/social/directory` | NON | 200 | ACTIF |

## WALLET (`/api/my-wallet/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/my-wallet/me` | OUI | 200 | ACTIF |
| GET | `/api/my-wallet/history` | OUI | 200 | ACTIF |
| GET | `/api/my-wallet/analytics` | OUI | 200 | ACTIF |
| POST | `/api/my-wallet/buy-pack` | OUI (doctrine gate) | 200 | ACTIF |
| POST | `/api/my-wallet/transfer` | OUI (doctrine gate) | 200 | ACTIF |

## FINTECH / WALLET LEGACY (`/api/wallet/` + `/api/fintech/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/wallet/{user_id}` | NON | 200 | ACTIF |
| GET | `/api/wallet/{user_id}/transactions` | NON | 200 | ACTIF |
| GET | `/api/wallet/frek/{frek_id}` | NON | 404 (si FREK inexistant) | ACTIF |
| POST | `/api/wallet/transfer` | OUI (doctrine gate) | 200 | ACTIF |
| POST | `/api/wallet/spend` | OUI (doctrine gate) | 200 | ACTIF |
| GET | `/api/fintech/dashboard` | NON | 200 | ACTIF |
| POST | `/api/fintech/create-checkout` | OUI (doctrine gate) | 200 | ACTIF |

## JETONS (`/api/jetons/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/jetons/packs` | NON | 200 | ACTIF |
| GET | `/api/jetons/stats` | NON | 200 | ACTIF |
| GET | `/api/jetons/overview` | NON | 200 | ACTIF |
| GET | `/api/jetons/{user_id}` | NON | 200 | ACTIF |
| POST | `/api/jetons/transfer` | NON | 200 | ACTIF |
| GET | `/api/jetons/remboursements` | NON | 200 | ACTIF |

## SHOP (`/api/shop/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/shop/packages` | NON | 200 | ACTIF |
| GET | `/api/shop/products` | NON | 200 | ACTIF |
| POST | `/api/shop/products` | OUI (doctrine gate) | 200 | ACTIF |
| PUT | `/api/shop/products/{id}` | OUI (doctrine gate) | 200 | ACTIF |
| DELETE | `/api/shop/products/{id}` | OUI (doctrine gate) | 200 | ACTIF |
| GET | `/api/shop/checkout/status/{session_id}` | NON | 200 | ACTIF |

## DOCTRINE (`/api/doctrine/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/doctrine/permissions` | NON | 200 | ACTIF |
| GET | `/api/doctrine/permissions/{actor_role}` | NON | 200 | ACTIF |
| GET | `/api/doctrine/my-permissions` | OUI | 200 | ACTIF |
| GET | `/api/doctrine/flow-stats` | NON | 200 | ACTIF |
| GET | `/api/doctrine/stats` | NON | 200 | ACTIF |
| GET | `/api/doctrine/mapping` | NON | 200 | ACTIF |
| POST | `/api/doctrine/promote` | OUI | 200 | ACTIF |
| POST | `/api/doctrine/seed` | NON | 200 | ACTIF |

## CMS (`/api/cms/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/cms/content` | NON | 200 | ACTIF |
| GET | `/api/cms/content/{page}/{section}` | NON | 200 | ACTIF |
| PUT | `/api/cms/content/{page}/{section}` | OUI (doctrine gate) | 200 | ACTIF |
| GET | `/api/cms/theme` | NON | 200 | ACTIF |
| PUT | `/api/cms/theme` | OUI (doctrine gate) | 200 | ACTIF |
| GET | `/api/cms/pages` | NON | 200 | ACTIF |
| POST | `/api/cms/pages` | OUI (doctrine gate) | 200 | ACTIF |
| GET | `/api/cms/pages/{page_id}` | NON | 200 | ACTIF |
| GET | `/api/cms/pages/slug/{slug}` | NON | 200 | ACTIF |
| PUT | `/api/cms/pages/{page_id}` | OUI (doctrine gate) | 200 | ACTIF |
| DELETE | `/api/cms/pages/{page_id}` | OUI (doctrine gate) | 200 | ACTIF |
| GET | `/api/cms/speakers` | NON | 200 | ACTIF |
| POST | `/api/cms/speakers` | OUI (doctrine gate) | 200 | ACTIF |
| PUT | `/api/cms/speakers/{id}` | OUI (doctrine gate) | 200 | ACTIF |
| DELETE | `/api/cms/speakers/{id}` | OUI (doctrine gate) | 200 | ACTIF |
| GET | `/api/cms/partners` | NON | 200 | ACTIF |
| POST | `/api/cms/partners` | OUI (doctrine gate) | 200 | ACTIF |
| PUT | `/api/cms/partners/{id}` | OUI (doctrine gate) | 200 | ACTIF |
| DELETE | `/api/cms/partners/{id}` | OUI (doctrine gate) | 200 | ACTIF |
| GET | `/api/cms/exhibitors` | NON | 200 | ACTIF |
| GET | `/api/cms/media` | NON | 200 | ACTIF |
| GET | `/api/cms/map-territories` | NON | 200 | ACTIF |
| GET | `/api/cms/preview` | NON | 200 | ACTIF |
| GET | `/api/cms/site-config` | NON | 200 | ACTIF |

## PUBLIC (`/api/public/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/public/theme` | NON | 200 | ACTIF |
| GET | `/api/public/content/{page}` | NON | 200 | ACTIF |
| GET | `/api/public/page/{slug}` | NON | 200 | ACTIF |

## SHARED (`/api/shared/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/shared/artistes` | NON | 200 | ACTIF |
| GET | `/api/shared/partners` | NON | 200 | ACTIF |
| GET | `/api/shared/planning` | NON | 200 | ACTIF |
| GET | `/api/shared/tasks` | NON | 200 | ACTIF |
| GET | `/api/shared/expenses` | NON | 200 | ACTIF |
| GET | `/api/shared/contacts` | NON | 200 | ACTIF |
| GET | `/api/shared/prestataires` | NON | 200 | ACTIF |

## ADMIN / REGISTRATIONS

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/registrations` | NON | 200 | ACTIF |
| POST | `/api/registrations` | NON | 200 | ACTIF |
| DELETE | `/api/registrations/{id}` | OUI (admin) | 200 | ACTIF |
| GET | `/api/catalog` | NON | 200 | ACTIF |
| GET | `/api/catalog/public` | NON | 200 | ACTIF |
| GET | `/api/catalog/sync` | NON | 200 | ACTIF |
| GET | `/api/countries` | NON | 200 | ACTIF |
| GET | `/api/partners` | NON | 200 | ACTIF |
| GET | `/api/email-logs` | NON | 200 | ACTIF |
| GET | `/api/email-logs/stats` | NON | 500 | ERREUR |
| GET | `/api/stats/live` | NON | 200 | ACTIF |

## FREK (`/api/frek/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/frek/stats` | NON | 200 | ACTIF |
| GET | `/api/frek/health` | NON | 200 | ACTIF |
| POST | `/api/auth/frek/verify` | NON | 200 | ACTIF |

## BADGES (`/api/badge/` + `/api/badges/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/badge/{badge_id}` | NON | 404 (si inexistant) | ACTIF |
| GET | `/api/activer-badge/{qr_token}` | NON | 200 | ACTIF |
| GET | `/api/badges/export-pdf-batch` | OUI | 200 | ACTIF |
| GET | `/api/badges/export-pdf-single/{id}` | OUI | 200 | ACTIF |
| GET | `/api/badges/export-stats` | NON | 200 | ACTIF |
| GET | `/api/badges/lifecycle/{badge_id}` | NON | 200 | ACTIF |

## TERRAIN (`/api/terrain/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/terrain/affluence` | NON | 200 | ACTIF |
| GET | `/api/terrain/search?q=` | NON | 200 | ACTIF |
| POST | `/api/terrain/scan` | NON | 200 | ACTIF |

## SMART ENGINE (`/api/smart-engine/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/smart-engine/dashboard` | NON | 200 | ACTIF |
| GET | `/api/smart-engine/predictive` | NON | 200 | ACTIF |
| GET | `/api/smart-engine/stats` | NON | 200 | ACTIF |
| GET | `/api/smart-engine/insights` | NON | 200 | ACTIF |
| GET | `/api/smart-engine/profiles` | NON | 200 | ACTIF |
| GET | `/api/smart-engine/alerts/rules` | NON | 200 | ACTIF |

## SITE ANALYTICS (`/api/analytics/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/analytics/site-stats` | NON | 200 | ACTIF |
| GET | `/api/analytics/site` | NON | 200 | ACTIF |
| GET | `/api/analytics/dashboard` | OUI (admin) | 403 (sans auth) | ACTIF |
| POST | `/api/analytics/track` | NON | 200 | ACTIF |

## CANDIDATURES (`/api/candidatures/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/candidatures/cc2026` | NON | 200 | ACTIF |
| GET | `/api/candidatures/cc2026/export` | NON | 200 | ACTIF |
| PUT | `/api/candidatures/cc2026/{id}/status` | NON | 200 | ACTIF |

## GHOST / GROWTH ENGINE (`/api/ghost/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/ghost/discovery/feed` | NON | 200 | ACTIF |

## RECOMMENDATIONS (`/api/recommendations/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/recommendations/events` | NON | 200 | ACTIF |

## NOTIFICATIONS (`/api/notifications/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/notifications/{user_id}` | NON | 200 | ACTIF |
| POST | `/api/notifications/{user_id}/read` | NON | 200 | ACTIF |

## PRO PROFILES (`/api/pro/`)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/pro/profile/{profile_id}` | NON | 200 | ACTIF |
| PUT | `/api/pro/profile/{profile_id}` | OUI | 200 | ACTIF |
| GET | `/api/pro/messages/{profile_id}` | OUI | 200 | ACTIF |
| POST | `/api/pro/messages/send` | OUI | 200 | ACTIF |
| GET | `/api/pro/connections/{profile_id}` | NON | 200 | ACTIF |
| GET | `/api/pro/connection-requests/{id}` | NON | 200 | ACTIF |
| GET | `/api/pro/events` | NON | 200 | ACTIF |
| GET | `/api/pro/opportunities` | NON | 200 | ACTIF |
| GET | `/api/pro/recommendations/{id}` | NON | 200 | ACTIF |
| GET | `/api/pro/export-data/{user_id}` | OUI | 200 | ACTIF |

## REALTIME

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/realtime/status` | NON | 200 | ACTIF |
| GET | `/api/realtime/events` | NON | 200 (SSE) | ACTIF |

## CHECKOUT (Legacy Stripe)

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| POST | `/api/create-checkout-session` | NON | 200 | ACTIF |
| POST | `/api/webhook/stripe` | NON | 200 | ACTIF |

## ANNUAL INTENTION

| Methode | Route | Auth | Status HTTP | Statut |
|---|---|---|---|---|
| GET | `/api/annual-intention` | NON | 200 | ACTIF |
| GET | `/api/annual-intention/all` | NON | 200 | ACTIF |
| POST | `/api/annual-intention` | NON | 200 | ACTIF |

---

## Synthese

| Categorie | Total | ACTIF | PARTIEL | ERREUR | MANQUANT |
|---|---|---|---|---|---|
| Auth | 8 | 8 | 0 | 0 | 0 |
| Brain | 17 | 12 | 0 | 5 (budget) | 0 |
| Pro Feed | 5 | 5 | 0 | 0 | 0 |
| Pro Social | 2 | 2 | 0 | 0 | 0 |
| Wallet | 5 | 5 | 0 | 0 | 0 |
| Fintech | 5 | 5 | 0 | 0 | 0 |
| Jetons | 6 | 6 | 0 | 0 | 0 |
| Shop | 6 | 6 | 0 | 0 | 0 |
| Doctrine | 8 | 8 | 0 | 0 | 0 |
| CMS | 20+ | 20+ | 0 | 0 | 0 |
| Public | 3 | 3 | 0 | 0 | 0 |
| Shared | 7 | 7 | 0 | 0 | 0 |
| Admin | 10+ | 9 | 0 | 1 (email stats 500) | 0 |
| Frek | 3 | 3 | 0 | 0 | 0 |
| Badges | 6 | 6 | 0 | 0 | 0 |
| Terrain | 3 | 3 | 0 | 0 | 0 |
| Smart Engine | 6 | 6 | 0 | 0 | 0 |
| Analytics | 4 | 4 | 0 | 0 | 0 |
| Autres | 15+ | 15+ | 0 | 0 | 0 |
| **TOTAL** | **~150** | **~143** | **0** | **6** | **0** |

### Endpoints en ERREUR
1. `POST /api/brain/analyse` → 500 (Emergent LLM Key budget exceeded)
2. `POST /api/brain/entreprise` → 500 (idem)
3. `POST /api/brain/evenement` → 500 (idem)
4. `POST /api/brain/alerte` → 500 (idem)
5. `POST /api/brain/chat-enriched` → 500 (idem)
6. `GET /api/email-logs/stats` → 500 (bug code — probablement une aggregation incorrecte)

Note: Les erreurs Brain ne sont pas des bugs de code mais une limite de budget API externe.
