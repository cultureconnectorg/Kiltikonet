# ADHESION_AUDIT.md — Systeme d'Adhesion
# kiltikonet.fr — ITER.56 Phase 5.1
# Date : 2026-04-07

## Etat Actuel

### Systeme d'Adhesion : NON IMPLEMENTE

- Aucun endpoint `/api/adhesion/*`
- Aucune collection `adhesions` en base (collection existe mais 0 docs)
- Pas de niveaux d'adhesion definis
- Pas de Stripe Subscription
- Le concept de "membre" est implicite : toute personne inscrite dans `registrations` est un "membre"

### Niveaux de Facto (via `actor_role` doctrinal)
L'adhesion est de facto geree par la doctrine des 5 acteurs :

| Niveau de Facto | actor_role | Droits |
|---|---|---|
| Visiteur | Aucun | Pages publiques uniquement |
| Membre Libre | `consumer` | Feed (lecture), Brain (quota limite), DMs |
| Professionnel | `professional` | + Services, analyses, annuaire, networking |
| Createur | `creator` | + Studios, upload, distribution, revenu CC |
| Distributeur | `distributor` | + Catalogage, diffusion, commissions |
| Institutionnel | `institutional` | + Gouvernance, subventions, rapports |

### Ce qui Manque pour un Systeme d'Adhesion Formel

1. **Niveaux payants** avec prix mensuels/annuels
2. **Quotas par niveau** :
   - Requetes Brain par mois
   - KT offerts a l'inscription
   - Acces studio (nombre d'uploads)
   - Acces terminal (nombre de deploiements)
3. **Abonnement Stripe** avec renouvellement automatique
4. **Flow d'upgrade** dans l'Espace Pro
5. **Collection MongoDB** `adhesions` avec `user_id`, `level`, `started_at`, `expires_at`, `stripe_subscription_id`

### Proposition de Niveaux

| Niveau | Prix | KT Offerts | Brain Quota | Studios | Terminal | Gouvernance |
|---|---|---|---|---|---|---|
| FREE | 0 | 5 KT | 10 req/mois | Lecture | Non | Poids 1 |
| PRO | 9.90/mois | 50 KT | 100 req/mois | Upload | 10 deploy/mois | Poids 2 |
| PREMIUM | 24.90/mois | 200 KT | Illimite | Illimite | Illimite | Poids 3 |
| INSTITUTIONAL | Sur devis | 500 KT | Illimite | Illimite | Illimite | Poids 3 |

**A arbitrer par le porteur de projet.**

---

# GOUVERNANCE_AUDIT.md — Systeme de Gouvernance
# kiltikonet.fr — ITER.56 Phase 5.2
# Date : 2026-04-07

## Etat Actuel

### Systeme de Gouvernance : NON IMPLEMENTE

- Aucun endpoint `/api/gouvernance/*`
- Aucune collection `gouvernance_proposals` ou `gouvernance_votes` en base
- La section "Governance" dans le menu Pro est une coquille vide
- Le `governance_weight` est stocke dans `doctrine_permissions` (1 a 3) mais n'est utilise nulle part en pratique

### Donnees Existantes Exploitables

| Donnee | Source | Utilisation Governance |
|---|---|---|
| `governance_weight` | `doctrine_permissions` | Poids du vote par role doctrinal |
| `actor_role` | `registrations` | Qui peut voter |
| `frek_id` | `registrations` | Tracabilite du vote |
| `doctrine_audit` | Collection | Historique des actions de role |

### Poids de Vote Existants (doctrine)
| Role | governance_weight | Impact |
|---|---|---|
| creator | 3 | Vote x3 |
| institutional | 3 | Vote x3 |
| professional | 2 | Vote x2 |
| distributor | 2 | Vote x2 |
| consumer | 1 | Vote x1 |

### Ce qui Manque

1. **Propositions** :
   ```json
   {
     "id": "uuid",
     "title": "Titre de la proposition",
     "description": "Description detaillee",
     "author_frek_id": "FREK-XXXX-XXXX",
     "category": "budget | event | rule | partnership",
     "status": "open | closed | adopted | rejected",
     "votes_for": 0,
     "votes_against": 0,
     "votes_abstain": 0,
     "weighted_for": 0,
     "weighted_against": 0,
     "deadline": "ISO8601",
     "quorum_required": 10,
     "created_at": "ISO8601"
   }
   ```

2. **Votes** :
   ```json
   {
     "vote_id": "uuid",
     "proposal_id": "uuid",
     "voter_frek_id": "FREK-XXXX-XXXX",
     "voter_role": "creator",
     "vote": "for | against | abstain",
     "weight": 3,
     "timestamp": "ISO8601"
   }
   ```

3. **Endpoints** :
   - `GET /api/gouvernance/proposals` — Liste des propositions
   - `GET /api/gouvernance/proposals/{id}` — Detail + resultats
   - `POST /api/gouvernance/proposals` — Creer (require_permission: create_proposal)
   - `POST /api/gouvernance/vote` — Voter (require_permission: vote)
   - `GET /api/gouvernance/results/{id}` — Resultats detailles

4. **Lien avec l'association Kilti Konet (loi 1901)** :
   - Les votes on-platform NE SONT PAS des votes associatifs legaux
   - Ils servent de sondages consultatifs
   - Les votes AG (Assemblee Generale) restent hors plateforme
   - Un rapprochement est envisageable a terme (vote delegue)
