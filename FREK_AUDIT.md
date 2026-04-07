# FREK_AUDIT.md — Audit Implementation FREK-ID
# kiltikonet.fr — ITER.56 Phase 3.1
# Date : 2026-04-07

## 1. Comment le FREK-ID est Genere Aujourd'hui

### Methode : Aleatoire cryptographique (PAS un DID, PAS on-chain)

```python
# server.py L.6274
async def generate_unique_frek_id() -> str:
    for _ in range(20):
        seg1 = ''.join(secrets.choice(FREK_ALPHABET) for _ in range(4))
        seg2 = ''.join(secrets.choice(FREK_ALPHABET) for _ in range(4))
        frek_id = f"FREK-{seg1}-{seg2}"
        existing = await db.registrations.find_one({"frek_id": frek_id})
        if not existing:
            return frek_id
```

### Format : `FREK-XXXX-XXXX`
- 8 caracteres alphanumeriques aleatoires (2 segments de 4)
- `FREK_ALPHABET` = string.ascii_uppercase + string.digits
- Genere via `secrets.choice()` (cryptographiquement sur)
- Anti-collision : Verification en base avant attribution (20 tentatives max)

### Ce que c'est REELLEMENT :
- **Un identifiant aleatoire unique** genere cote serveur
- **Stocke uniquement dans MongoDB** (collection `registrations`, champ `frek_id`)
- **PAS un UUID** standard (format custom FREK-XXXX-XXXX)
- **PAS un DID W3C** (Decentralized Identifier)
- **PAS un hash deterministe** de l'email
- **PAS on-chain** — aucune blockchain impliquee
- **PAS d'empreinte biometrique ou de signature numerique**

### Cas speciaux de generation :
- **Admin bypass** : `f"FREK-ADM-{email[:4].upper()}"` (hardcode)
- **GitHub OAuth** : `f"FREK-{google_email[:3].upper()}-{str(uuid.uuid4())[:6].upper()}"` (format different)
- **FREKcore** : Le client (`frek_client.py`) tente de se connecter a FREKcore pour obtenir un FREK-ID, mais en cas d'echec, un ID local est genere.

## 2. Ou est-il Stocke

| Emplacement | Collection | Champ | Index |
|---|---|---|---|
| MongoDB | `registrations` | `frek_id` | UNIQUE SPARSE |
| MongoDB | `cc_badges` | `frek_id` | Non indexe |
| MongoDB | `ghost_profiles_v2` | `frek_id` | Non indexe |
| JWT Token | Cookie `kk_session` | `frek_id` | N/A |
| FREKcore | API externe | `frek_id` | Theoriquement |

**Pas on-chain** : Aucune transaction blockchain trouvee dans le code.

## 3. Unicite : 1 Email = 1 FREK-ID

### Est-ce enforced ?
- **OUI** par un index MongoDB unique sparse sur `registrations.frek_id`
- Le sparse permet aux documents sans frek_id de coexister
- La generation avec collision check (`find_one` avant insert) est un double verrou

### Que se passe-t-il en cas de doublon ?
- L'index unique MongoDB rejetterait l'insertion avec `DuplicateKeyError`
- Le code ne gere PAS explicitement cette erreur — il crasherait en 500
- C'est un point faible : pas de fallback gracieux si le doublon passe la verification in-memory

## 4. Chaine FREK-ID <-> Badge <-> Wallet

| Lien | Implemente ? | Comment |
|---|---|---|
| FREK-ID → Registration | OUI | `registrations.frek_id` |
| FREK-ID → Badge CC2026 | OUI | `cc_badges.frek_id` |
| FREK-ID → Wallet KT | PARTIEL | `kn_wallets.frek_id` existe mais souvent NULL — le wallet est lie par `user_id` |
| FREK-ID → Wallet CC | NON | Pas de wallet CC separe |
| Badge → Wallet | INDIRECT | Via le meme `user_id` |

### Coherence : PARTIELLE
Le `frek_id` est present dans les registrations et badges mais le wallet utilise `user_id` comme cle primaire, pas `frek_id`. L'endpoint `GET /api/wallet/frek/{frek_id}` existe mais renvoie 404 car `kn_wallets.frek_id` est souvent NULL.

## 5. Anti-Duplication Cross-Platform

**Pas implemente.** Si un utilisateur s'inscrit sur kiltikonet.fr et sur un autre client FREKcore, deux FREK-ID differents seraient generes. Il n'y a pas de mecanisme de reconciliation cross-platform.

---

# FREK_BLOCKCHAIN_GAP.md — Gap On-Chain vs Off-Chain
# Date : 2026-04-07

## Ce qui est Reellement On-Chain Aujourd'hui

**RIEN.** Zero transaction blockchain. Zero smart contract. Zero DID on-chain.

Le prompt systeme du CVL Brain mentionne "plans blockchain Polygon" et "DID souverain", mais ce sont des objectifs strategiques, pas des implementations.

## Ce qui est Simule en MongoDB

| Fonctionnalite | Simulation MongoDB | Equivalent On-Chain Cible |
|---|---|---|
| FREK-ID | String aleatoire unique | DID W3C (`did:frek:XXXX-XXXX`) |
| Certification oeuvre | Non implemente | Hash SHA256 + anchor on-chain |
| Stages Luciole | Partiellement implemente via `frek_client.record_stage()` | Smart contract lifecycle |
| Transactions | Collections `cc_transactions`, `kn_wallets` | Token ERC-20 ou equivalent |
| Droits culturels | Non implemente | NFT ou SBT (Soulbound Token) |
| Audit trail | Collections `doctrine_audit`, `workspace_logs` | Blockchain append-only |
| Gouvernance | Non implemente | DAO / Snapshot |

## FREKcore — Client API

Le fichier `frek_client.py` tente de se connecter a une API FREKcore externe. En pratique :
- L'URL de l'API FREKcore pointe vers... **la meme application** (tarifs-update.preview.emergentagent.com)
- Les appels d'authentification echouent silencieusement
- Le mode fallback genere des IDs locaux avec prefixe `LOCAL-`
- FREKcore semble etre un projet parallele non encore deploye

## Roadmap Technique vers le DID Souverain

### Phase 0 (actuelle) : Identifiant Off-Chain
- FREK-ID = string aleatoire dans MongoDB
- Unicite enforcee localement

### Phase 1 (iter.58+) : Fingerprint & Certification
- Generer un fingerprint SHA256 pour chaque oeuvre soumise
- Stocker le hash + metadata dans une collection `frek_certifications`
- Le fingerprint est l'embryon de la preuve d'anteriorite
- **Pas encore on-chain** mais le hash est immuable (append-only, pas de DELETE)

### Phase 2 (futur) : Ancrage Blockchain
- Ancrer periodiquement un Merkle root des certifications sur Polygon
- Un seul hash on-chain valide N certifications off-chain
- Cout minimal : 1 transaction / jour suffit

### Phase 3 (cible) : DID W3C Complet
- Migrer FREK-XXXX-XXXX vers `did:frek:XXXX-XXXX`
- Document DID auto-heberge sur IPFS ou resolu via Universal Resolver
- Cle publique associee au FREK-ID pour signature numerique
- Le FREK-ID devient un identifiant souverain verifiable

---

# TRACABILITY_SCHEMA.md — Schema de Tracabilite Complet
# Date : 2026-04-07

## Collections d'Audit Existantes

| Collection | Docs | Contenu | Immuable |
|---|---|---|---|
| `doctrine_audit` | 11 | Changements de role doctrinal | OUI (append-only) |
| `workspace_logs` | 394 | Actions admin | OUI (append-only) |
| `pro_access_logs` | 264 | Connexions Espace Pro | OUI (append-only) |
| `agent_logs` | 8 | Logs agents IA | OUI (append-only) |
| `email_logs` | 21 | Emails envoyes | OUI (append-only) |
| `analytics_events` | 563 | Tracking site | OUI (append-only) |
| `site_events` | 259 | Events site v2 | OUI (append-only) |

**Manque** : Un schema d'audit UNIFIE couvrant TOUTES les actions avec tracabilite FREK-ID.

## Schema d'Audit Log Unifie Propose

```json
{
  "log_id": "uuid-v4",
  "user_frek_id": "FREK-XXXX-XXXX",
  "action_type": "ENUM",
  "object_id": "id-de-l-objet-concerne",
  "object_type": "post|badge|wallet|order|...",
  "metadata": {},
  "timestamp": "ISO8601",
  "hash": "SHA256-du-log-precedent",
  "session_id": "session-uuid"
}
```

### Actions Types (enum)
```
FREK_CERTIFY | FEED_POST | FEED_ECLAIR | FEED_COMMENT |
BRAIN_QUERY | WALLET_CREDIT | WALLET_DEBIT | TRADE_ORDER |
SHOP_PURCHASE | ADHESION_SUBSCRIBE | GOUVERNANCE_VOTE |
TERMINAL_DEPLOY | NFC_SCAN | BADGE_EMIT | BADGE_SCAN |
SETTINGS_UPDATE | AUTH_LOGIN | AUTH_LOGOUT
```

### Garanties d'Immuabilite
1. **Pas d'endpoint DELETE** sur la collection `audit_logs`
2. **Hash chaine** : Chaque log inclut le SHA256 du log precedent (blockchain locale)
3. **Ecriture append-only** : Seul `insert_one` est autorise, pas d'update
4. **Index** : `user_frek_id` + `action_type` + `timestamp` pour requetes rapides

### Etat actuel : La collection `audit_logs` n'existe PAS encore
Les logs d'audit sont disperses dans 7 collections differentes sans schema unifie ni chainee de hash.
A creer en iter.57.
