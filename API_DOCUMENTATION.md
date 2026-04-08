# API Documentation — Kiltikonet CC2026

Base URL : `https://kiltikonet.fr/api`
Auth : Cookie de session httpOnly (30 jours) sauf indication contraire.

---

## Auth

| Méthode | Route | Auth | Body | Réponse |
|---------|-------|------|------|---------|
| POST | `/auth/register` | Non | `{email, name, password?}` | `{success, frek_id, profile}` |
| POST | `/pro/request-access` | Non | `{email}` | `{success, bypass?}` |
| POST | `/pro/verify-otp` | Non | `{email, code}` | `{success, profile}` + Set-Cookie |
| POST | `/auth/logout` | Oui | — | `{success}` + Clear-Cookie |
| GET | `/auth/me` | Oui | — | `{profile}` |
| POST | `/auth/google` | Non | `{credential}` | `{success, profile}` + Set-Cookie |

## WebAuthn

| Méthode | Route | Auth | Body | Réponse |
|---------|-------|------|------|---------|
| POST | `/auth/webauthn/register/begin` | Oui | — | Options WebAuthn |
| POST | `/auth/webauthn/register/complete` | Oui | `{credential}` | `{success}` |
| POST | `/auth/webauthn/login/begin` | Non | `{email}` | Options WebAuthn |
| POST | `/auth/webauthn/login/complete` | Non | `{email, credential}` | `{success, profile}` + Set-Cookie |
| GET | `/auth/webauthn/devices` | Oui | — | `{devices: [...]}` |
| POST | `/auth/webauthn/revoke/:credential_id` | Oui | — | `{success}` |

## Brain (IA)

| Méthode | Route | Auth | Body | Réponse |
|---------|-------|------|------|---------|
| POST | `/brain/chat` | Oui | `{message, session_id?}` | `{response, session_id, kt_cost}` |
| GET | `/brain/sessions` | Oui | — | `{sessions: [...]}` |
| GET | `/brain/sessions/:id/messages` | Oui | — | `{messages: [...]}` |

## Feed

| Méthode | Route | Auth | Body | Réponse |
|---------|-------|------|------|---------|
| GET | `/pro/feed?page=X&limit=Y` | Oui | — | `{posts, total, page}` |
| POST | `/pro/feed/post` | Oui | `{content, media_url?, type?}` | `{success, post}` |
| POST | `/pro/feed/posts/:id/eclair` | Oui | `{frek_id}` | `{success, eclairs_count, new_balance_kt}` |
| POST | `/pro/feed/posts/:id/comment` | Oui | `{content}` | `{success, comment}` |

## Wallet

| Méthode | Route | Auth | Body | Réponse |
|---------|-------|------|------|---------|
| GET | `/my-wallet` | Oui | — | `{balance_kt, balance_jcc, transactions}` |
| POST | `/wallet/buy-jcc` | Oui | `{pack_id, amount}` | `{checkout_url}` |
| POST | `/wallet/webhook` | Stripe | Stripe event | `{received}` |

## Shop

| Méthode | Route | Auth | Body | Réponse |
|---------|-------|------|------|---------|
| GET | `/shop/packs` | Oui | — | `{packs: [...]}` |
| POST | `/shop/checkout` | Oui | `{item_id, quantity}` | `{checkout_url}` |

## Badges CC2026

| Méthode | Route | Auth | Body | Réponse |
|---------|-------|------|------|---------|
| POST | `/admin/accreditation` | Admin | `{type_badge, frek_id, ...}` | `{success, badge}` |
| POST | `/scan/verify` | Agent | `{badge_id, scan_type}` | `{success, badge_info}` |
| POST | `/scan/debit` | Agent | `{badge_id, amount, reason}` | `{success, new_balance}` |

## FREK

| Méthode | Route | Auth | Body | Réponse |
|---------|-------|------|------|---------|
| GET | `/frek/profile/:frek_id` | Oui | — | `{profile, cultural_impact_score}` |
| PUT | `/frek/profile` | Oui | `{name?, avatar?, ...}` | `{success}` |

## Notifications Push

| Méthode | Route | Auth | Body | Réponse |
|---------|-------|------|------|---------|
| POST | `/notifications/push/subscribe` | Oui | `{subscription: PushSubscription}` | `{success}` |
| POST | `/notifications/push/unsubscribe` | Oui | — | `{success}` |
| GET | `/notifications/push/preferences` | Oui | — | `{push_enabled, feed_eclair, ...}` |
| PUT | `/notifications/push/preferences` | Oui | `{feed_eclair?, message_recu?, ...}` | `{success}` |
| POST | `/notifications/push/send` | Admin | `{frek_ids?, title, body, url?}` | `{sent, failed}` |

## Admin

| Méthode | Route | Auth | Body | Réponse |
|---------|-------|------|------|---------|
| GET | `/admin/cc2026/stats` | Admin | — | `{badges_emis, revenus_total, countdown_jours, ...}` |
| GET | `/admin/users?page=X&search=Y` | Admin | — | `{users, total, page, pages}` |
| PUT | `/admin/users/:frek_id/role` | Admin | `{role}` | `{success}` |
| POST | `/admin/users/:frek_id/suspend` | Admin | — | `{success}` |
| DELETE | `/admin/users/:frek_id` | Admin | — | `{success, anonymized}` (RGPD) |
| GET | `/admin/feed/reported` | Admin | — | `{posts, total}` |
| DELETE | `/admin/feed/posts/:id` | Admin | — | `{success}` |
| POST | `/admin/feed/posts/:id/restore` | Admin | — | `{success}` |
| POST | `/admin/users/:frek_id/ban` | Admin | — | `{success}` |
| GET | `/admin/health-stats` | Admin | — | `{latence_moyenne_ms, taux_erreur_pct, ...}` |
| POST | `/admin/batch-email` | Admin | `{subject, content, segment}` | `{success}` |

## Terminal

| Méthode | Route | Auth | Body | Réponse |
|---------|-------|------|------|---------|
| POST | `/terminal/deploy` | Oui | `{html, slug}` | `{success, url}` |
| GET | `/terminal/projects` | Oui | — | `{projects}` |
| GET | `/terminal/projects/:id` | Oui | — | `{project}` |

## Analytics

| Méthode | Route | Auth | Body | Réponse |
|---------|-------|------|------|---------|
| POST | `/analytics/track` | Non | `{event_type, ...metadata}` | `{tracked}` |

## Upload

| Méthode | Route | Auth | Body | Réponse |
|---------|-------|------|------|---------|
| POST | `/upload` | Oui | FormData (file) | `{url, type, size}` |
| POST | `/builder/upload` | Oui | FormData (file) | `{url, type}` |
