# AUTH_FLOW.md — Dissection Complete du Systeme d'Authentification
# kiltikonet.fr — ITER.56 Phase 1.4
# Date : 2026-04-07

## 1. Mecanisme de Token

### Type : JWT signe (HS256) dans un cookie httpOnly
- **Librairie** : `pyjwt` (backend)
- **Secret** : `SESSION_SECRET` (env var, fallback `fallback-dev-secret`)
- **Cookie** : `kk_session`
- **Attributs cookie** :
  - `httponly=True` (non accessible par JS frontend)
  - `secure=True` (HTTPS uniquement)
  - `samesite=lax`
  - `max_age=SESSION_MAX_AGE` (non defini dans le code visible, probablement 30 jours)
  - `path=/`

### Stockage cote navigateur
- **Cookie** : OUI — `kk_session` (httpOnly, invisible au JS)
- **localStorage** : NON
- **sessionStorage** : NON
- **Memoire React** : Le resultat de `GET /api/auth/me` est stocke dans `useState` de `ProSpaceDashboard`

## 2. Payload du Token JWT

```json
{
  "role": "pro",
  "email": "user@example.com",
  "name": "Nom Complet",
  "profile_id": "uuid-or-badge-id",
  "profile_type": "professionnel_culture|artiste|exposant|...",
  "is_admin": false,
  "frek_id": "FREK-XXX-XXXX",
  "iat": "2026-04-07T...",
  "exp": "2026-05-07T..."
}
```

## 3. Ce que le Frontend Recoit

### Via `GET /api/auth/me`
Retourne le contenu decore du JWT :
```json
{
  "authenticated": true,
  "session": {
    "role": "pro",
    "email": "...",
    "name": "...",
    "profile_id": "...",
    "profile_type": "...",
    "is_admin": true/false,
    "frek_id": "FREK-..."
  }
}
```

### Via `GET /api/doctrine/my-permissions`
Retourne les droits doctrinaux enrichis :
```json
{
  "actor_role": "professional",
  "label_fr": "Professionnel",
  "can": ["offer_services", "publish_analyses", ...],
  "receives": ["catalog_visibility", "networking_priority", ...],
  "governance_weight": 2
}
```

### Donnees NON exposees au frontend actuellement
- `solde_kt` : Non dans le token, recupere via `GET /api/my-wallet/me`
- `solde_cc` : Non expose (pas de wallet CC separe encore)
- `adhesion_level` : Non gere
- `badge_cc2026_id` : Non dans le token (frek_id sert de reference)

## 4. Flow d'Authentification — Espace Pro

### Etape 1 : Demande de code
```
POST /api/pro/request-access
Body: { "email": "user@example.com" }
```
- Genere un code OTP a 6 chiffres
- Stocke en memoire (`pro_access_codes[email]`)
- Expiration : 5 minutes
- Envoi par email via Resend (ou AWS SES si configure)
- **Bypass Admin** : Si email dans `BYPASS_EMAILS`, code = `000000`

### Etape 2 : Verification du code
```
POST /api/pro/verify-code
Body: { "email": "user@example.com", "code": "123456" }
```
- Verifie le code + expiration
- Cherche le profil dans : `registrations` → `cc_badges` → bypass admin
- Set le cookie `kk_session` via `set_session_cookie()`
- Retourne `{ success: true, profile: {...} }`

### Etape 3 : Verification de session
```
GET /api/auth/me
Cookie: kk_session=<jwt>
```
- Middleware `session_cookie_middleware` decode le JWT a chaque requete
- Peuple `request.state.session`
- Retourne la session ou 401

### Etape 4 : Deconnexion
```
POST /api/auth/logout
```
- Supprime le cookie `kk_session`

## 5. Autres Methodes d'Auth

### Auth GitHub OAuth
- `GET /api/auth/github` → redirect GitHub
- `GET /api/auth/github/callback` → callback, cree session
- Status : IMPLEMENTE mais peu utilise

### Magic Link
- `GET /api/auth/magic/{token}` → login par lien unique
- Status : IMPLEMENTE

### Workspace Login (Admin)
- `POST /api/workspace/login` → email + mot de passe classique
- Pour le dashboard admin/workspace
- Roles : `admin`, `super_admin`, `workspace_admin`, `agent_terrain`

## 6. Gestion des Roles Existants

### Roles dans le JWT
| Role | Source | Acces |
|---|---|---|
| `pro` | Espace Pro login | Composants Pro |
| `admin` | Workspace login | Tout |
| `super_admin` | Workspace login | Tout + config |
| `workspace_admin` | Workspace login | Dashboard |
| `agent_terrain` | Workspace login | App NFC scan |

### Roles Doctrinaux (actor_role)
| Role | Description |
|---|---|
| `creator` | Artistes, producteurs — plein acces creatif |
| `distributor` | Diffuseurs, medias — acces distribution |
| `institutional` | Institutions, collectivites — acces gouvernance |
| `professional` | Professionnels culturels — acces services |
| `consumer` | Public general — acces basique |

### Coexistence `role` (JWT) vs `actor_role` (doctrine)
- `role` dans le JWT est **toujours "pro"** pour l'Espace Pro
- `actor_role` est un champ dans `registrations` et `doctrine_permissions`
- Les deux coexistent sans conflit : `role` pour l'auth, `actor_role` pour les permissions

## 7. Mecanisme de Refresh

- **Aucun refresh token** implemente
- Le JWT a une duree fixe (`SESSION_MAX_AGE`)
- A expiration, l'utilisateur doit se reconnecter
- Pas de renouvellement automatique

## 8. Ce qu'il faut Injecter dans Chaque Composant Omega

Pour que les composants Omega aient acces aux donnees utilisateur, il faut :

1. **Creer un `AuthContext`** qui expose :
   ```ts
   {
     user: { email, name, profile_id, profile_type, frek_id, is_admin },
     doctrine: { actor_role, label_fr, can[], receives[], governance_weight },
     wallet: { solde_kt },
     isAuthenticated: boolean,
     login: (email) => Promise<void>,
     logout: () => void
   }
   ```

2. **Wrapper les composants Omega** dans `<AuthProvider>` au niveau de `ProApp.tsx`

3. **Chaque composant** consomme le context via `useAuth()` au lieu de recevoir des props

4. **Route protegee `/pro`** : Verifier `isAuthenticated` avant le rendu, sinon afficher le formulaire de login (deja gere dans ProSpaceDashboard mais pas exporte en context)

## 9. Vulnerabilites Identifiees

- **Bypass admin hardcode** : Les emails bypass sont en dur dans le code — acceptable pour le dev mais a retirer en production
- **Pas de refresh token** : Sessions longues = risque si le JWT est compromis
- **Pas de rate limiting sur /api/pro/verify-code** : Brute force possible (le rate limiter global protege partiellement)
- **Code OTP en memoire** : Perte si le serveur redemarr — acceptable pour la phase actuelle
- **Pas de 2FA** : Aucun second facteur
