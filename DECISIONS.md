# Journal des Décisions — Kiltikonet CC2026

Toutes les décisions techniques et business prises pour le projet, classées chronologiquement.

---

## Économie des jetons

### JCC (Jeton Culture Connect)
- **Valeur** : 1 JCC = 1,50 EUR
- **Packs disponibles** :
  - Découverte : 10 EUR (6 JCC + 1 bonus)
  - Explorateur : 25 EUR (16 JCC + 2 bonus)
  - Ambassadeur : 50 EUR (33 JCC + 5 bonus)
  - Mécène : 100 EUR (66 JCC + 12 bonus)
- **Rollover** : Indéfini — les JCC ne périment jamais
- **Holding post-CC2026** : Les JCC restent actifs après l'événement pour usage dans l'écosystème Kiltikonet

### KT (Kilti Token)
- **Usage** : Monnaie interne pour les interactions
- **Bienvenue** : 10 KT offerts à l'inscription
- **Coût Brain** : 2 KT par requête IA
- **Éclair** : 1 KT débité du caller, 1 KT crédité à l'auteur du post
- **Non achetable** : Les KT se gagnent par l'activité, pas par achat

---

## Adhésion

| Niveau | Prix | Avantages |
|--------|------|-----------|
| FREE | Gratuit | Accès basique, 10 KT bienvenue |
| PRO | 15 EUR/an | +50 KT, priorité support, badge PRO |
| PREMIUM | 50 EUR/an | +200 KT, Brain illimité, accès VIP |
| INSTIT | 500 EUR/an | Accès institutionnel, API, support dédié |

---

## Stack technique

| Décision | Choix | Raison |
|----------|-------|--------|
| Frontend | React 19 | Dernière version, hooks modernes, concurrent features |
| Backend | FastAPI | Performance async, OpenAPI auto, Python natif |
| Base de données | MongoDB | Flexibilité schéma, Motor async, Atlas managed |
| Paiements | Stripe | Standard industrie, mode live, webhooks fiables |
| Emails | Brevo (ex-Sendinblue) | Remplace AWS SES (bloqué en sandbox), templates transactionnels, API simple |
| IA | Claude Sonnet (Anthropic) | Meilleure compréhension du créole martiniquais, contexte culturel |
| Auth primaire | Cookie httpOnly 30j | Plus sécurisé que JWT localStorage, SameSite=strict |
| Auth biométrique | WebAuthn | Standard W3C, Face ID/Touch ID natif, py_webauthn + @simplewebauthn |
| Push | Web Push API | Standard navigateur, pas de service tiers, VAPID keys auto-générées |
| Stockage | Emergent Object Storage | Intégré à la plateforme, pas de configuration S3 supplémentaire |
| NFC | Baserow | API simple, table partageable avec l'équipe terrain |

---

## Design

| Décision | Valeur |
|----------|--------|
| Fond principal | `#0a0a0b` (OLED black) |
| Accent | `#f2ca50` (gold Kiltikonet) |
| Vert identitaire | `#1B4D47` (vert Martinique) |
| Typographie | Space Grotesk (UI), Noto Serif (titres) |
| Mode | Dark-only (pas de light mode) |
| Responsive | 3 breakpoints : mobile (<768), tablette (768), desktop (1024+) |
| Animations | Framer Motion, `prefers-reduced-motion` respecté |
| PWA | Standalone, portrait, offline-first |

---

## Architecture

| Décision | Choix | Date |
|----------|-------|------|
| OrbitalMenu comme hub central | Remplace le dashboard linéaire | ITER.59 |
| Logo animé au centre | 5 états Framer Motion (repos, hover, tap, double-tap, notification) | ITER.60 |
| Suppression texte "Kiltikonet" du header | Uniquement CC2026 + JCC + FREK-ID | ITER.60 |
| Panel contextuel desktop | 280px droite avec wallet + impact + activité | ITER.61 |
| CockpitView = 3 onglets | Terminal + Santé + CC2026 Admin | ITER.61 |
| Event-driven push | Chaque audit_log déclenche auto la notification push | ITER.61 |
| RGPD anonymisation | DELETE /api/admin/users/:id remplace PII par données anonymes | ITER.61 |

---

## Décisions business

| Décision | Détail | Date |
|----------|--------|------|
| Date événement | 20 mai 2026 | Fixe |
| Lieu | La Savane, Fort-de-France, Martinique | Fixe |
| Badges NFC | Puce NFC intégrée, scan par agents terrain | ITER.59 |
| Export Twina | CSV formaté pour impression badges physiques, J-15 | ITER.59 |
| Sessions 30 jours | Cookie persistant pour éviter re-login fréquent | ITER.60 |
| Notifications auto | Zéro envoi manuel, tout est event-driven | ITER.61 |
| Modération feed | Signalement → review admin → suppression/restauration/ban | ITER.61 |

---

## Décisions reportées

| Sujet | Raison | Priorité |
|-------|--------|----------|
| Rate limiter Redis | Nécessite Redis managed, suffisant en mémoire pour le moment | P2 |
| Refactoring server.py | 9800+ lignes, extraction progressive en routeurs, pas de restructuration massive | P1 |
| AWS SES production | Bloqué en sandbox, Brevo utilisé comme alternative | P3 |
| Light mode | Pas de demande utilisateur, identité dark-only assumée | P4 |
