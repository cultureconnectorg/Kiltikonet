# PARAMS_AUDIT.md — Etat Existant des Parametres Utilisateur
# kiltikonet.fr — ITER.56 Phase 1.6
# Date : 2026-04-07

## Composant Frontend : `SettingsSovereign`
**Fichier** : `/app/frontend/src/components/pro/SovereignSections.jsx` (L.236-295)
**Statut global** : COQUILLE VIDE — UI affichee mais aucun endpoint backend connecte

## Parametres Existants dans l'UI

### Section 1 : Compte
| Parametre | Label | Etat | Endpoint | Donnees |
|---|---|---|---|---|
| Profil Public | Modifier nom, bio, photo | PARTIEL — click redirige vers section "profile" | `PUT /api/pro/profile/{id}` | Oui (modifie nom, bio) |
| Securite | Mot de passe, sessions actives | COQUILLE VIDE | Aucun | Non |
| Notifications | Alertes et emails | COQUILLE VIDE | Aucun | Non |

### Section 2 : Preferences
| Parametre | Label | Etat | Endpoint | Donnees |
|---|---|---|---|---|
| Langue | Francais / Creole | COQUILLE VIDE — click navigue vers settings-detail | Aucun | registrations.language = "fr" |
| Apparence | Theme Sovereign Onyx | COQUILLE VIDE | Aucun | Non |
| Confidentialite | Visibilite profil | COQUILLE VIDE | Aucun | Non |

### Section 3 : Ecosysteme
| Parametre | Label | Etat | Endpoint | Donnees |
|---|---|---|---|---|
| Kilti-Tokens | Historique transactions | PARTIEL — info affichee | `GET /api/my-wallet/history` | Oui |
| FREK-ID | Identifiant unique | AFFICHAGE SEUL | Inline (session.frek_id) | Oui |
| A propos | Version | STATIQUE | Aucun | Non |

### Action : Deconnexion
| Action | Etat | Endpoint |
|---|---|---|
| Se deconnecter | ACTIF | `POST /api/auth/logout` |

## Parametres Stockes en Base (registrations)

| Champ | Present en base | Expose en settings | Modifiable |
|---|---|---|---|
| full_name | OUI | OUI (via profil) | OUI |
| email | OUI | NON | NON |
| language | OUI ("fr") | AFFICHE mais non modifiable | NON |
| profile_type | OUI | NON | NON |
| actor_role | OUI | NON (affiche en badge) | OUI (via promote) |
| frek_id | OUI | OUI (affichage) | NON |
| cultural_practice | OUI | NON | NON |
| genre_style | OUI | NON | NON |
| cc2026_goal | OUI | NON | NON |
| auth_methods | OUI | NON | NON |

## Ce qui Manque pour l'Espace Pro Omega

### Endpoint requis : `GET /api/user/settings` et `PUT /api/user/settings`
```json
// GET /api/user/settings
{
  "profile": {
    "full_name": "...",
    "bio": "...",
    "photo_url": "...",
    "language": "fr",
    "frek_id": "FREK-...",
    "actor_role": "professional"
  },
  "notifications": {
    "email_enabled": true,
    "push_enabled": false,
    "in_app_enabled": true,
    "brain_suggestions": true
  },
  "privacy": {
    "profile_public": true,
    "frek_id_public": false,
    "show_in_catalog": true,
    "show_in_directory": true
  },
  "preferences": {
    "language": "fr",
    "brain_language": "fr",
    "theme": "sovereign_onyx",
    "currency_display": "EUR"
  },
  "security": {
    "two_factor_enabled": false,
    "active_sessions": 1,
    "last_login": "2026-04-07T..."
  },
  "connections": {
    "github_linked": false,
    "frekcore_linked": true
  },
  "wallet": {
    "solde_kt": 100,
    "solde_cc": 0,
    "alert_low_balance": true,
    "alert_threshold": 10
  }
}
```

### Fonctionnalites manquantes :
1. **Modification de la langue** : Endpoint + UI select
2. **Notifications** : Systeme de preferences en base + push web
3. **Confidentialite** : Toggle show_in_catalog, show_in_directory
4. **Securite** : Historique des sessions, deconnexion a distance
5. **2FA** : Non implemente
6. **Preferences Brain** : Langue de reponse par defaut
7. **Photo de profil** : Upload via Cloudinary (endpoint existe mais pas cable dans settings)
8. **Connexions tierces** : GitHub lie/non lie, FREKcore lie/non lie
9. **Export RGPD** : Endpoint `GET /api/pro/export-data/{user_id}` existe mais pas accessible depuis settings
10. **Suppression de compte** : Collection `deleted_accounts` existe mais aucun endpoint
