# MONGO_SCHEMA.md — Schema MongoDB Reel en Production
# kiltikonet.fr — ITER.56 Phase 1.3
# Date : 2026-04-07
# Methode : Inspection directe des collections MongoDB (pas des modeles Pydantic)
# DB : culture_connect_2026

## Synthese : 58 collections, ~1554 documents

---

## Collections Principales

### registrations (3 docs) — UTILISATEURS INSCRITS
| Champ | Type Reel | Notes |
|---|---|---|
| id | str | UUID genere |
| email | str | |
| full_name | str | |
| profile_type | str | professionnel_culture, artiste, etc. |
| status | str | approved, pending, rejected |
| actor_role | str | **Champ doctrinal** : creator, professional, etc. |
| actor_role_assigned_at | str | ISO timestamp |
| actor_role_previous | str | Role avant promotion |
| frek_id | str | FREK-XXX-XXXX (Index UNIQUE SPARSE) |
| jetons_solde | int | Solde ancien systeme |
| language | str | fr, en |
| auth_methods | list | ["email"] |
| cultural_practice | str | |
| genre_style | str | |
| cc2026_goal | str | |
| cultural_impact_score | int | Score calcule |
| is_onboarded | bool | |
| onboarding_completed | bool | |
| onboarding_date | str | |
| is_new_user | bool | |
| suspicious | bool | |
| validity_extension | bool | |
| registered_at | str | |
| registration_ip | str | |
| created_at | str | |
**Index** : frek_id_1 (UNIQUE SPARSE), email_1, status_1, profile_type_1, actor_role_1, country_1, tier_1, expertise_tags_1, show_in_catalog_1

**ECART vs TypeScript ZIP** : Le type `Badge` du ZIP n'a que `id, prenom, nom, email, type_badge, badge_id, statut, frek_id, jetons_solde, nfc_enabled, date_emission`. La realite est beaucoup plus riche (actor_role, auth_methods, cultural_impact_score, etc.).

### cc_badges (6 docs) — BADGES CC2026
| Champ | Type | Notes |
|---|---|---|
| badge_id | str | Identifiant du badge |
| prenom | str | |
| nom | str | |
| email | str | |
| type_badge | str | VIP, artiste, professionnel, etc. |
| frek_id | str | |
| organisation | str | |
| statut | str | actif, en_attente |
| jetons_solde | int | |
| nfc_enabled | bool | |
| nfc_uid | str | |
| qr_token | str | |
| imprime | bool | |
| remis | bool | |
| date_emission | str | |
| baserow_row_id | int | Miroir Baserow |
| created_at | str | |

### doctrine_permissions (5 docs) — MATRICE DOCTRINALE
| Champ | Type | Notes |
|---|---|---|
| actor_role | str | creator, distributor, institutional, professional, consumer |
| label_fr | str | Etiquette francaise |
| can | list | Actions autorisees (strings) |
| receives | list | Avantages recus |
| cc_flow | dict | {in: str, out: str} - flux de circulation |
| platform_fee | float | 0.0 a 0.30 |
| governance_weight | int | 1 a 3 |
| description | str | |
| created_at | str | |
| updated_at | str | |
**Index** : actor_role_1 (UNIQUE)

### kn_wallets (4 docs) — WALLETS KILTI-TOKENS
| Champ | Type | Notes |
|---|---|---|
| wallet_id | str | |
| user_id | str | Ref vers registrations.id |
| frek_id | NoneType/str | |
| balance | int | Solde actuel en KT |
| currency | str | "KT" |
| total_earned | int | |
| total_purchased | int | |
| total_received | int | |
| total_spent | int | |
| status | str | active |
| validity_extension | bool | |
| validity_note | str | |
| created_at | str | |
| updated_at | str | |

**ECART** : Pas de wallet CC separe. Un seul wallet KT existe. Le Jeton CC n'a pas encore de wallet dedie.

### cc_transactions (15 docs) — TRANSACTIONS JETONS CC (ancien systeme)
| Champ | Type | Notes |
|---|---|---|
| id | str | |
| type | str | credit, debit |
| email | str | |
| jetons | int | Nombre de jetons |
| amount_eur | int | Montant en EUR |
| pack | str | Nom du pack |
| label | str | Description |
| status | str | completed |
| timestamp | str | |

**ECART** : Les nouveaux champs cc_flow (from_role, to_role) ne sont PAS encore dans les transactions existantes — ils seront inscrits dans les futures transactions.

### pro_posts (110 docs) — FEED SOCIAL
| Champ | Type | Notes |
|---|---|---|
| id | str | |
| author_id | str | |
| author_name | str | |
| author_image | str | URL |
| author_title | str | |
| author_country | str | |
| content | str | Texte du post |
| post_type | str | text, video, reel |
| is_reel | bool | |
| video_url | str | URL video |
| thumbnail_url | str | |
| duration | str | |
| dimension | str | |
| likes | list | Liste d'IDs |
| likes_count | int | |
| comments_count | int | |
| shares_count | int | |
| views_count | int | |
| is_ghost | bool | Ghost profile generated |
| created_at | str | |
| updated_at | str | |

### brain_memory (10 docs) — MEMOIRE CVL BRAIN
| Champ | Type | Notes |
|---|---|---|
| session_id | str | |
| user_id | str | |
| title | str | |
| messages | list | Liste de {role, content} |
| message_count | int | |
| tags | list | |
| created_at | str | |
| updated_at | str | |

### shop_products (19 docs) — BOUTIQUE
| Champ | Type | Notes |
|---|---|---|
| id | str | |
| name | str | |
| description | str | |
| price | float | En EUR |
| currency | str | EUR |
| category | str | |
| badge | str | Tag visuel |
| stock | int | -1 = illimite |
| order | int | Tri |
| active | bool | |
| created_at | str | |

### payment_transactions (14 docs) — PAIEMENTS STRIPE
| Champ | Type | Notes |
|---|---|---|
| id | str | |
| session_id | str | Stripe Session ID |
| type | str | accreditation, partnership, pack |
| tier | str | |
| amount | float | |
| currency | str | eur |
| payment_status | str | completed, pending |
| metadata | dict | Donnees libres |
| created_at | str | |
**Index** : session_id_1 (UNIQUE)

---

## Collections Secondaires

### analytics_events (563 docs) — Tracking site
| Champ | Type |
|---|---|
| id, event_type, data, user_id, session_id, ip, user_agent, timestamp, created_at | str/dict/None |

### site_events (259 docs) — Events site (nouveau systeme)
| Champ | Type |
|---|---|
| event, page, device, ip_hash, user_id, session_id, data, timestamp | str/dict/Int64/None |

### pro_access_logs (264 docs) — Logs d'acces Pro
| Champ | Type |
|---|---|
| email, profile_id, action, timestamp | str |

### workspace_logs (394 docs) — Logs admin
| Champ | Type |
|---|---|
| id, user, role, action, details, timestamp, session_start | str |

### ghost_profiles_v2 (200 docs) — Profils fantomes (test social proof)
Profils generes pour peupler le feed et la communaute.

### pro_connections (16 docs) — Connexions entre profils Pro
| Champ | Type |
|---|---|
| id, from_profile, to_profile, from_name, to_name, status, is_ghost, created_at | str/bool |

### doctrine_audit (11 docs) — Audit des changements de role
| Champ | Type |
|---|---|
| user_id, action, previous_role, new_role, reason, timestamp | str |

---

## Collections Vides (0 docs)

| Collection | Cree mais vide | Usage prevu |
|---|---|---|
| artistes | Oui | Artistes CMS |
| attestations | Oui | Certifications FREK |
| candidatures_cc2026 | Oui | Candidatures evenement |
| cc_remboursements | Oui | Remboursements jetons |
| cc_scans | Oui | Scans NFC terrain |
| cms_pages | Oui | Pages CMS dynamiques |
| contacts | Oui | Contacts CRM |
| cultural_reactions | Oui | Reactions culturelles |
| deleted_accounts | Oui | RGPD |
| ghost_profiles | Oui | V1 ghost (remplace par v2) |
| matching_events | Oui | Matching IA |
| pro_messages | Oui | DMs Pro |
| pro_opportunities | Oui | Opportunites Pro |
| shared_tasks | Oui | Taches partagees |
| smart_documents | Oui | Documents IA |
| smart_profiles | Oui | Profils IA |
| territorial_flows | Oui | Flux territoriaux |
| collaboration_outcomes | Oui | Resultats collaborations |

## Volume Total : ~1554 documents dans 58 collections

## Ecarts Critiques vs Types TypeScript du ZIP Omega

| Type ZIP | Collection Reelle | Ecart |
|---|---|---|
| `Badge` (6 champs) | `registrations` (27 champs) + `cc_badges` (17 champs) | Le type ZIP est tres simplifie. 2 collections differentes. |
| `Transaction` (5 champs) | `cc_transactions` (9 champs) + `payment_transactions` (9 champs) + `kn_wallets` (14 champs) | 3 systemes de transactions coexistent |
| `JetonPack` (4 champs) | `shop_products` (11 champs) | Les packs sont dans la boutique |
| Pas de type `DM` | `pro_messages` (0 docs) | Collection existe mais vide |
| Pas de type `FeedPost` | `pro_posts` (110 docs) | Deja peuple par les ghosts |
| Pas de type `Wallet` | `kn_wallets` (4 docs) | Existe mais pas de wallet CC separe |
