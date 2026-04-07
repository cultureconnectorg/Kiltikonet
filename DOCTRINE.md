# DOCTRINE.md — Matrice des 5 Acteurs CVLN
# ============================================
# Ce fichier documente la couche doctrinale de kiltikonet.fr.
# Il DOIT etre lu en commentaire de chaque PR future.
# Derniere mise a jour : 2026-04-05

## Principe fondateur

L'ecosysteme CVLN repose sur 5 roles d'acteurs. Chaque utilisateur
de kiltikonet.fr est rattache a exactement un `actor_role`.
Ce champ coexiste avec `profile_type` (heritage CC2026) sans le remplacer.

## Matrice des 5 acteurs

### 1. CREATOR (`actor_role: "creator"`)

**Qui** : Artistes, musiciens, realisateurs, ecrivains, choristes,
danseurs, photographes, designers — tout individu dont l'activite
premiere est de produire du contenu culturel original.

**Ce qu'il peut faire** :
- Publier du contenu original (feed, reels, articles)
- Monetiser ses creations via le Jeton CC
- Participer aux appels a projets
- Recevoir des royalties et des dons

**Ce qu'il recoit** :
- Visibilite algorithmique prioritaire dans le feed
- Score Culturel (Cultural Impact Score)
- Acces au Studio complet (Feed, Reel, Shop)
- Badge "Createur" sur son profil

**Circulation Jeton CC** :
- Recoit des CC via ventes, streaming, dons, royalties
- Depense en services (promotion, outils, collaborations)
- Taux de redistribution : 70% createur / 30% ecosysteme (platform_fee)

**Mapping `profile_type`** : `artist` → `creator`

---

### 2. DISTRIBUTOR (`actor_role: "distributor"`)

**Qui** : Labels, agences de booking, editeurs, plateformes de
diffusion, promoteurs, managers, galleries — toute entite dont
l'activite est de distribuer, promouvoir ou commercialiser
du contenu culturel.

**Ce qu'il peut faire** :
- Signer et representer des createurs
- Distribuer du contenu sur la plateforme
- Creer des vitrines et des catalogues
- Gerer des campagnes de promotion
- Acceder aux analytics avances

**Ce qu'il recoit** :
- Outils de gestion de roster (liste d'artistes)
- Dashboard de performance des createurs
- Acces API pour integration avec leurs systemes
- Badge "Distributeur" sur son profil

**Circulation Jeton CC** :
- Recoit une commission sur les ventes des createurs (negociable)
- Investit en promotion et en visibilite
- Peut acheter des packs de tokens en volume

**Mapping `profile_type`** : `label`, `booking_agency` → `distributor`

---

### 3. INSTITUTIONAL (`actor_role: "institutional"`)

**Qui** : Collectivites territoriales, ministeres de la culture,
fondations, ONG culturelles, ambassades, organisations
internationales (UNESCO, Francophonie), universites.

**Ce qu'il peut faire** :
- Financer des projets culturels via le Jeton CC
- Publier des appels a projets
- Accrediter des evenements
- Acceder aux rapports d'impact territorial
- Participer a la gouvernance (vote sur les propositions)

**Ce qu'il recoit** :
- Rapports d'impact culturel territorialise
- Visibilite institutionnelle (logo, partenariat)
- Acces a la gouvernance DAO (poids de vote superieur)
- Badge "Institutionnel" sur son profil

**Circulation Jeton CC** :
- Injecte des CC dans l'ecosysteme (subventions, bourses)
- Finance des evenements et des residences
- Peut sponsoriser des createurs directement

**Mapping `profile_type`** : `institution` → `institutional`

---

### 4. PROFESSIONAL (`actor_role: "professional"`)

**Qui** : Journalistes culturels, critiques, curateurs, consultants,
formateurs, techniciens du spectacle, ingenieurs son/lumiere,
prestataires de services culturels.

**Ce qu'il peut faire** :
- Offrir des services professionnels sur la plateforme
- Publier des analyses et des critiques
- Repondre aux appels a projets
- Acceder au reseau professionnel (networking)
- Utiliser le Terminal IA pour ses projets

**Ce qu'il recoit** :
- Visibilite dans le catalogue professionnel
- Systeme de notation par les pairs
- Outils de facturation (Jeton CC ↔ EUR)
- Badge "Professionnel" sur son profil

**Circulation Jeton CC** :
- Recoit des CC pour ses prestations
- Depense en formation, outils, abonnements
- Peut echanger CC ↔ EUR via le Wallet

**Mapping `profile_type`** : `press`, `other` → `professional`

---

### 5. CONSUMER (`actor_role: "consumer"`)

**Qui** : Public general, fans, amateurs de culture, membres
de la diaspora, touristes culturels, etudiants — toute personne
qui consomme du contenu culturel sans en produire professionnellement.

**Ce qu'il peut faire** :
- Consommer du contenu (feed, reels, evenements)
- Acheter des Jetons CC
- Soutenir des createurs (dons, achats)
- Participer aux evenements (billets)
- Voter sur les propositions de gouvernance (poids standard)

**Ce qu'il recoit** :
- Acces au contenu gratuit et premium
- Recommandations personnalisees
- Historique de soutien (quels createurs soutenus)
- Badge "Membre" sur son profil

**Circulation Jeton CC** :
- Achete des CC via les packs (Decouverte, Culture, Diaspora, VIP)
- Depense en contenu, evenements, merchandising
- Peut offrir des CC a des createurs

**Mapping `profile_type`** : aucun `profile_type` specifique,
ou tout `profile_type` non mappe ailleurs → `consumer`

---

## Regles de mapping `profile_type` → `actor_role`

```
profile_type    | actor_role
----------------|---------------
artist          | creator
label           | distributor
booking_agency  | distributor
institution     | institutional
press           | professional
other           | professional
admin           | professional
(absent/null)   | consumer
```

## Regles de coexistence

1. `actor_role` est un AJOUT. `profile_type` reste inchange.
2. Un utilisateur a exactement un `actor_role` a tout instant.
3. Le changement d'`actor_role` est possible mais audite.
4. `actor_role` determine les permissions doctrinales.
   `profile_type` determine le type de badge CC2026.
5. Les deux systemes coexistent indefiniment.

## Circulation du Jeton CC — Vue globale

```
[CONSUMER] --achete--> [CC] --soutien--> [CREATOR]
                                             |
                                      commission (30%)
                                             |
                                             v
                                      [DISTRIBUTOR]
                                             |
                                      reinvestit
                                             v
[INSTITUTIONAL] --subvention--> [CC] --finance--> [CREATOR/PROFESSIONAL]
                                             |
                                        prestation
                                             v
                                      [PROFESSIONAL]
```

## Index MongoDB

- `registrations.actor_role` : index simple (non unique)
- `registrations.frek_id` : index unique sparse (deja en place)
- `doctrine_permissions.actor_role` : index unique

## Governance Weight (mis a jour 2026-04-07)

| actor_role     | governance_weight | Justification                                    |
|----------------|-------------------|--------------------------------------------------|
| creator        | 3                 | Source de valeur — poids decisionnaire fort       |
| distributor    | 2                 | Relais actif de la chaine culturelle              |
| institutional  | 3                 | Autorite, pas superiorite sur le createur          |
| professional   | 2                 | Service actif dans l'ecosysteme                   |
| consumer       | 1                 | Participation citoyenne de base                   |

## Platform Fee (marge CVLN)

| actor_role     | platform_fee | Explication                                       |
|----------------|--------------|---------------------------------------------------|
| creator        | 30%          | Complement du redistribution_rate 70%              |
| distributor    | 0%           | Pas de marge plateforme sur les distributeurs      |
| institutional  | 0%           | Les institutions injectent, ne generent pas        |
| professional   | 0%           | Pas de marge sur les prestations directes          |
| consumer       | 0%           | Le consommateur achete, pas de marge additionnelle |

La `platform_fee` du creator (30%) est le complement exact de son
`redistribution_rate` (70%). Sur chaque transaction generee par un
createur, 70% lui revient et 30% alimente l'ecosysteme CVLN
(maintenance, developpement, gouvernance).

## Collection `doctrine_permissions`

Chaque document definit les capacites d'un `actor_role` :

```json
{
  "actor_role": "creator",
  "label_fr": "Createur",
  "can": ["publish_content", "monetize", "apply_projects", "receive_royalties"],
  "receives": ["algorithmic_visibility", "cultural_score", "studio_full", "badge_creator"],
  "cc_flow": {
    "earns_from": ["sales", "streaming", "donations", "royalties"],
    "spends_on": ["promotion", "tools", "collaborations"],
    "redistribution_rate": 0.70
  },
  "platform_fee": 0.30,
  "governance_weight": 3
}
```
