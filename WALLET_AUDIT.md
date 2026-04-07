# WALLET_AUDIT.md — Audit Complet Dual Wallet KT + CC
# kiltikonet.fr — ITER.56 Phase 4.1
# Date : 2026-04-07

## 1. Architecture Actuelle

### Wallets Existants
| Type | Collection | Statut |
|---|---|---|
| Kilti-Token (KT) | `kn_wallets` (4 docs) | ACTIF |
| Jeton CC | `cc_transactions` (15 docs) | LEGACY — pas de wallet dedie |

### Kilti-Token (KT) — Wallet Actif
- **Collection** : `kn_wallets`
- **Cle primaire** : `user_id` (pas `frek_id`)
- **Champs** : `wallet_id`, `user_id`, `frek_id` (souvent NULL), `balance`, `currency` ("KT"), `total_earned`, `total_purchased`, `total_received`, `total_spent`, `status`, `validity_extension`, `created_at`, `updated_at`

### Endpoints KT
| Endpoint | Methode | Fonction |
|---|---|---|
| `GET /api/my-wallet/me` | Cookie auth | Solde + infos wallet |
| `GET /api/my-wallet/history` | Cookie auth | Liste des transactions |
| `GET /api/my-wallet/analytics` | Cookie auth | Analytiques du wallet |
| `POST /api/my-wallet/buy-pack` | Cookie auth + doctrine gate | Achat d'un pack KT |
| `POST /api/my-wallet/transfer` | Cookie auth + doctrine gate | Transfert P2P de KT |

### Jeton CC — Ancien Systeme
- **Collection** : `cc_transactions` (15 docs)
- **Pas de wallet CC separe** — seules des transactions sont stockees
- **1 Jeton CC = 1.50 EUR** (hardcode dans les packs)
- **Packs CC** : Decouverte (10J, 13.50EUR), Culture (25J, 30EUR), Diaspora (50J, 55EUR), VIP (100J, 100EUR)

## 2. Logique de Debit par Action

| Action | Debite KT ? | Debite CC ? | Montant |
|---|---|---|---|
| CVL Brain query | NON | NON | Gratuit (budget API Emergent) |
| Shop purchase | NON directement | NON | Via Stripe (EUR) |
| Terminal deploy | NON | NON | Non implemente |
| NFC scan | NON | NON | Ne debite rien |
| Soutien (transfert P2P) | OUI (KT) | NON | Variable (choisi par user) |
| Eclair (reaction feed) | NON | NON | Non implemente (prevu 1 KT) |

**Observation** : Actuellement, les KT ne sont presque pas debites. Le seul debit reel est le transfert P2P.

## 3. Regles et Limites

| Regle | Enforcee ? | Comment |
|---|---|---|
| Conversion KT <-> CC | NON | Pas de taux de change, pas d'endpoint |
| Solde minimum | NON | Le solde peut descendre a 0 |
| Plafond wallet | NON | Aucun plafond enforced |
| Rollover CC2027 | OUI (mentionne) | `validity_extension: true` dans les packs |
| Wallets isoles | OUI | KT et CC sont dans des collections separees |

## 4. Transactions KT

Collection : `kn_transactions` (lie au wallet via `user_id`)
Champs : `tx_id`, `wallet_id`, `user_id`, `type` (credit/debit/purchase/transfer_in/transfer_out/consumption), `amount`, `balance_after`, `description`, `channel`, `metadata`, `created_at`

### Nouveaux champs cc_flow (ajoutes dans iter actuel) :
- `metadata.from_role` : Role doctrinal de l'emetteur
- `metadata.to_role` : Role doctrinal du recepteur
- `metadata.cc_flow_applied` : Type d'action (buy_tokens, support_creators, consume_content)

---

# JETON_STRATEGY.md — Strategie Jeton CC Phase 1
# Date : 2026-04-07

## 1. Etat Actuel

### 1 Jeton CC = 1.50 EUR
- Hardcode dans les packs (`jetons/packs`)
- Le prix est dans le code, pas en base
- Pas de validation backend du prix (le frontend affiche, le backend calcule)

### FMS comme Emetteur
- `legal_entity: "Factory Maker Studio EURL"` dans les packs KT
- FMS apparait dans les packs mais pas dans les transactions CC legacy
- Pas de modele d'emission formel

### Rachat Marchand 1.35 EUR J+3 SEPA
- **NON implemente** — Aucun endpoint de rachat
- Aucune collection `merchant_redemptions`
- Aucun lien SEPA

### Stripe Price IDs
- **Pas de Price ID Stripe fixe** dans le code — les checkouts sont crees dynamiquement avec le montant du pack
- Le pack est selectionne cote frontend, le montant est envoye au backend qui cree une session Stripe
- Pas de Products predefinis dans le dashboard Stripe (tout est dynamique)

## 2. Trois Decisions Ouvertes (Blocage iter.58)

### Decision 1 : Prix des Packs JCC
Les packs actuels sont des packs KT. Pour le Jeton CC :
- Pack 10 JCC : ? EUR (recommandation : 15 EUR = 10 x 1.50)
- Pack 50 JCC : ? EUR (recommandation : 67.50 EUR avec 10% de remise)
- Pack 100 JCC : ? EUR (recommandation : 120 EUR avec 20% de remise)
**A arbitrer par le porteur de projet**

### Decision 2 : Rollover CC2027
Les Jetons CC non utilises sont-ils reportes sur CC2027 ?
- Actuellement : `validity_extension: true` dans les packs (mentionne)
- Mais aucune logique de verification de validite en backend
- **Impact** : Si OUI, il faut un champ `valid_until` dans le wallet
**A arbitrer par le porteur de projet**

### Decision 3 : Timing Creation Holding
- Si une holding est creee avant CC2026, l'emetteur change de FMS EURL vers Holding
- Impact sur les mentions legales, les factures, les conditions de remboursement
- Pas d'impact technique majeur (changement de `legal_entity` dans les packs)
**A arbitrer par le porteur de projet**

---

# SHOP_AUDIT.md — Audit Shop / Marketplace
# Date : 2026-04-07

## 1. Items Existants en Base

### Collection : `shop_products` (19 docs)
Categories identifiees dans les produits :
- Packs KT (4 produits : Decouverte, Culture, Diaspora, VIP)
- Produits divers (categories : ticketing, musique, art, etc.)

### Packs KT Existants
| ID | Nom | Tokens | Prix EUR | Bonus | Legal Entity |
|---|---|---|---|---|---|
| kt-decouverte | Pack Decouverte | 15 KT | 10.00 | +50% | FMS EURL |
| kt-culture | Pack Culture | 40 KT | 25.00 | +60% | FMS EURL |
| kt-diaspora | Pack Diaspora | 85 KT | 50.00 | +70% | FMS EURL |
| kt-vip | Pack VIP Souverain | 200 KT | 100.00 | +100% | FMS EURL |

## 2. Stripe Configuration

### Cles
- `STRIPE_API_KEY` : env var (configuree)
- `STRIPE_PUBLIC_KEY` : env var (configuree)
- `STRIPE_WEBHOOK_SECRET` : env var (configuree)

### Webhook
- Route : `POST /api/webhook/stripe`
- Events ecoutes : `checkout.session.completed`, `checkout.session.expired`
- Action post-paiement : credit wallet KT + creation badge si applicable

### Flow Checkout Complet
1. Frontend selectionne un pack / produit
2. `POST /api/create-checkout-session` (ou `/api/fintech/create-checkout`)
3. Backend cree une session Stripe Checkout avec metadata
4. Redirect vers Stripe
5. Webhook `checkout.session.completed` → credit wallet
6. Redirect vers `/success`

## 3. Points d'Attention

### Stock Limite
- Champ `stock: -1` = illimite dans la plupart des produits
- Pas de gestion de stock decremente a l'achat
- Les tickets CC2026 n'ont pas de plafond enforced

### Remboursements
- Collection `cc_remboursements` existe mais est VIDE (0 docs)
- Pas d'endpoint de remboursement implemente
- En cas de litige Stripe, le remboursement serait manuel

---

# TRADE_SPEC.md — Specification Trading
# Date : 2026-04-07

## Etat Actuel

**Aucun systeme de trade n'existe.**
- Pas d'order book
- Pas de matching engine
- Pas d'endpoint `/api/trade/`
- La collection correspondante n'existe pas

## Specification Simplifiee pour iter.58

### Modele : Echange P2P avec validation manuelle

#### Collection : `trade_orders`
```json
{
  "order_id": "uuid",
  "user_frek_id": "FREK-XXXX-XXXX",
  "user_id": "uuid",
  "offer_type": "buy | sell",
  "token_type": "KT | CC",
  "amount": 50,
  "price_eur_per_token": 1.5,
  "total_eur": 75.0,
  "status": "pending | matched | completed | cancelled",
  "matched_with": "uuid (autre order_id)",
  "created_at": "ISO8601",
  "completed_at": "ISO8601 | null"
}
```

#### Endpoints
- `POST /api/trade/order` — Creer un ordre
- `GET /api/trade/orders` — Lister les ordres actifs
- `POST /api/trade/match` — Matcher deux ordres (admin)
- `DELETE /api/trade/order/{id}` — Annuler un ordre

#### Frais de Transaction
- Suggestion : 2% par transaction (1% acheteur + 1% vendeur)
- Tracabilite FREK-ID sur chaque ordre

---

# FINTECH_COMPLIANCE.md — Conformite Fintech
# Date : 2026-04-07

## Etat de Conformite REEL (pas optimiste)

### DSP2 — Directive Services de Paiement

| Point | Statut | Detail |
|---|---|---|
| FMS comme emetteur d'instrument prepaye | NON CONFORME | FMS EURL n'est pas un etablissement de paiement agree. Pour emettre des instruments prepays en France, il faut soit une licence EME (Etablissement de Monnaie Electronique) soit operer sous exemption. |
| Exemption possible | A VERIFIER | L'exemption "reseau limite" (art. L521-3 CMF) pourrait s'appliquer si le jeton n'est utilisable que dans un reseau ferme (CC2026). A valider avec un avocat. |
| SCA (Strong Customer Auth) | PARTIEL | OTP email implemente mais pas 2FA. Stripe gere le SCA pour les paiements carte. |

### KYC/AML — Verification d'Identite

| Point | Statut | Detail |
|---|---|---|
| Verification email | OUI | Email verifie via OTP |
| Verification identite | NON | Pas de piece d'identite demandee |
| KYC pour montants > 150 EUR | NON IMPLEMENTE | Pas de plafond enforced |
| AML screening | NON | Pas de verification anti-blanchiment |

### Plafonds Reglementaires

| Regle | Appliquee ? | Detail |
|---|---|---|
| Instruments prepays anonymes < 150 EUR (art. L315-9 CMF) | NON ENFORCED | Aucun plafond dans le code. Un utilisateur peut acheter des packs illimites. |
| Plafond par transaction | NON | Pas de limite de montant |
| Plafond cumule mensuel | NON | Pas de tracking |
| Identification obligatoire > 150 EUR | NON | Pas de KYC progressif |

### Conservation des Logs

| Obligation | Duree legale | Statut | Detail |
|---|---|---|---|
| Transactions de paiement | 5 ans | PARTIEL | Les transactions sont stockees en MongoDB sans TTL — elles persistent, mais pas de garantie d'archivage a 5 ans |
| Donnees comptables | 10 ans | NON GERE | Pas d'archivage formel |
| Audit trail | 5 ans | PARTIEL | Logs disperses dans 7 collections |

### RGPD — Protection des Donnees

| Droit | Implemente ? | Endpoint |
|---|---|---|
| Acces aux donnees | OUI | `GET /api/pro/export-data/{user_id}` |
| Rectification | PARTIEL | `PUT /api/pro/profile/{id}` (nom, bio) |
| Effacement | NON | Collection `deleted_accounts` existe mais pas d'endpoint |
| Portabilite | PARTIEL | Export JSON disponible mais pas au format standardise |
| Opposition | NON | Pas de mecanisme d'opt-out |

## Recommandations Prioritaires

1. **Juridique** : Consulter un avocat fintech pour valider l'exemption "reseau limite" du CMF
2. **Plafond 150 EUR** : Implementer un plafond d'achat anonyme (sans KYC) a 150 EUR max
3. **Droit a l'oubli** : Creer l'endpoint de suppression de compte (RGPD)
4. **Archivage** : Mettre en place un archivage des transactions (backup MongoDB + retention policy)
