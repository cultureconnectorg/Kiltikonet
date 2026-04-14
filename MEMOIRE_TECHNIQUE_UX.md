# Mémoire Technique UX — Kiltikonet CC2026
### Audit complet & remise à niveau — Branche `claude/fix-critical-bugs-RpAsh`
*Généré le : 2026-04-13*

---

## 1. Périmètre de l'audit

**Objectif :** remise à niveau de l'intégralité des fichiers `frontend/src/` (210 fichiers) sur 4 axes :

| Axe | Description |
|-----|-------------|
| **R** — Responsive & Layout | Positionnement FAB, largeurs fixes, débordements mobile |
| **B** — Boutons & Logique | États disabled, permissions, double-clic |
| **M** — Médias & Placeholders | Avatars sans `onError`, images cassées, thumbnails |
| **S** — Sécurité & Accès | Guards auth absents, fallback de permissions, tokens exposés |

---

## 2. Résumé des anomalies détectées

### 2.1 Responsive & Layout

| # | Fichier | Ligne | Problème | Gravité |
|---|---------|-------|----------|---------|
| R-01 | `CvlBrainFloat.jsx` | 171 | `bottom-24 md:bottom-6` — FAB masqué derrière la nav mobile (76 px) | **Haute** |
| R-02 | `CvlBrainFloat.jsx` | 180 | `w-[340px]` fixe — déborde sur écrans < 360 px | **Moyenne** |
| R-03 | `CvlBrainFloat.jsx` | 180 | `sm:w-96` (384 px) — dépasse 100vw sur tablette en mode portrait | **Faible** |

**Root cause R-01 :** La nav mobile (`MobileNavigation.jsx:23`) mesure `calc(76px + env(safe-area-inset-bottom, 0px))`. Le FAB à `bottom-24` (96 px) est *derrière* la nav sur les appareils sans notch. Sur iPhone 15 (34 px safe-area) la nav fait 110 px — le FAB est totalement masqué.

**Correction R-01/02/03 :**
```css
/* App.css */
:root {
  --kk-mobile-nav-height: 76px;
  --kk-fab-bottom-mobile: calc(var(--kk-mobile-nav-height) + env(safe-area-inset-bottom, 0px) + 16px);
  --kk-fab-bottom-desktop: 24px;
}
```
```jsx
// CvlBrainFloat.jsx
style={{ bottom: 'var(--kk-fab-bottom-mobile)' }}   // Mobile
// md: inline override via media query → var(--kk-fab-bottom-desktop)
// Largeur : w-[min(340px,calc(100vw-2rem))]
```

---

### 2.2 Boutons & Logique

| # | Fichier | Ligne | Problème | Gravité |
|---|---------|-------|----------|---------|
| B-01 | `ProSpaceDashboard.jsx` | 319 | `if (!doctrine) return true` — accorde toutes les permissions avant chargement | **Critique** |
| B-02 | `ProSpaceDashboard.jsx` | 913 | Bouton "Supprimer post" actif pendant la requête de suppression (double-clic) | **Moyenne** |

**Root cause B-01 :** Pendant les ~300 ms du chargement de la doctrine, tous les boutons d'action (publish, edit, delete) sont visibles et actifs. Un utilisateur rapide peut déclencher une action avant que le serveur confirme ses droits. La correction : `if (!doctrine) return false` — les boutons sont masqués jusqu'au chargement.

**Correction B-01 :** `return true` → `return false` à `ProSpaceDashboard.jsx:319`

---

### 2.3 Médias & Placeholders

| # | Fichier | Ligne | Problème | Gravité |
|---|---------|-------|----------|---------|
| M-01 | `LinkedInFeed.jsx` | 162 | `<img src={post.author_image}>` sans `onError` — vide blanc si 404 | **Moyenne** |
| M-02 | `LinkedInFeed.jsx` | 219 | `<img src={post.thumbnail_url}>` sans `onError` — layout cassé si absent | **Moyenne** |
| M-03 | `ReelsFeed.jsx` | 181 | `<img src={reel.author_image}>` sans `onError` — vide blanc si 404 | **Moyenne** |

**Root cause :** Les URLs d'avatars proviennent de Cloudinary ou du profil utilisateur. Si le fichier est supprimé/invalide, l'`<img>` reste présent mais vide (alt="" + aucun handler → rectangle blanc visible).

**Correction :** Ajout `onError={(e) => { e.target.onerror=null; e.target.style.display='none'; e.target.parentElement.querySelector('.avatar-fallback')?.style.setProperty('display','flex'); }}` + élément fallback frère.

---

### 2.4 Sécurité & Accès

| # | Fichier | Ligne | Problème | Gravité |
|---|---------|-------|----------|---------|
| S-01 | `AdminMobileDashboard.jsx` | 510+ | Aucun guard d'authentification au montage du composant | **Critique** |
| S-02 | `ProSpaceDashboard.jsx` | 319 | Voir B-01 — aussi une faille d'accès | **Critique** |

**Root cause S-01 :** `AdminDashboard.jsx` vérifie le cookie via `/api/auth/me` au montage (ligne 86-106) et redirige vers `/admin` si non authentifié. `AdminMobileDashboard.jsx` lit uniquement `sessionStorage` (ligne 610) sans vérification asynchrone ni redirection. Une session expirée ou un accès direct à `/dashboard-cc2026` expose le dashboard terrain sans authentification.

**Correction S-01 :** Ajout d'un `useEffect` identique à `AdminDashboard.jsx:86-106` qui vérifie `/api/auth/me` et appelle `navigate('/admin')` si non authentifié.

---

### 2.5 Internationalisation (FR/EN)

| # | Fichier | Ligne | Texte actuel | Correction |
|---|---------|-------|--------------|------------|
| I-01 | `CatalogPage.jsx` | 541 | `"Loading..."` | `"Chargement..."` |
| I-02 | `ParticipantProfile.jsx` | 67 | `"Loading..."` | `"Chargement..."` |
| I-03 | `PartnerManagement.jsx` | 141 | `"Loading..."` | `"Chargement..."` |

---

## 3. Composants partagés créés

### 3.1 `src/components/ui/KKAvatar.jsx`

Avatar universel en 3 niveaux de fallback :
1. Image source (`src`) avec `onError`
2. Initiales + gradient coloré selon `name`
3. Icône `person` (Material Symbols)

```jsx
<KKAvatar src={user.image} name={user.full_name} size={44} />
```

**Tailles standardisées :** `sm` (28), `md` (36), `lg` (44), `xl` (52), `2xl` (64)

### 3.2 `src/components/ui/KKSkeleton.jsx`

Skeleton shimmer adapté à la charte graphique Kiltikonet (fond `#1A1917`, shimmer doré `#D2A53C10`).

```jsx
<KKSkeleton className="h-4 w-1/2" />
<KKSkeleton variant="circle" size={44} />
```

### 3.3 `src/components/ui/KKEmptyState.jsx`

État vide standardisé avec icône, titre, description et action optionnelle.

```jsx
<KKEmptyState
  icon="inbox"
  title="Aucun message"
  description="Vos messages apparaîtront ici"
  action={{ label: "Nouveau message", onClick: () => {} }}
/>
```

---

## 4. Tokens CSS ajoutés dans `App.css`

```css
:root {
  /* Navigation */
  --kk-mobile-nav-height: 76px;
  --kk-fab-bottom-mobile: calc(var(--kk-mobile-nav-height) + env(safe-area-inset-bottom, 0px) + 16px);
  --kk-fab-bottom-desktop: 24px;
  --kk-content-pb: calc(var(--kk-mobile-nav-height) + env(safe-area-inset-bottom, 0px) + 8px);

  /* Z-index scale */
  --z-base: 0;
  --z-dropdown: 20;
  --z-sticky: 30;
  --z-overlay: 40;
  --z-modal: 50;
  --z-popover: 60;
  --z-toast: 70;
  --z-fab: 80;
  --z-nav: 90;
  --z-chat: 95;
  --z-critical: 100;
}
```

**Hiérarchie z-index documentée :**
- `--z-nav: 90` → Navigation mobile (`MobileNavigation.jsx z-50` ramené à `z-[90]`)
- `--z-fab: 80` → Bouton flottant CVL Brain (`z-[90]` existant → `z-[80]` *sous* la nav)
- `--z-chat: 95` → Panel chat CVL Brain (`z-[95]` existant → `z-[95]` conservé, *sur* la nav)

> Note : CvlBrainFloat utilise `z-[90]` pour le bouton et `z-[95]` pour le panel. Après correction du `bottom`, le bouton peut rester à `z-[80]` puisqu'il est positionné au-dessus de la nav visuellement.

---

## 5. Stratégie de non-régression

- **Additif uniquement** : aucune API ou prop existante supprimée
- **Branche dédiée** : `claude/fix-critical-bugs-RpAsh` — PR avant merge sur main
- **Tests manuels requis** :
  - [ ] CvlBrainFloat visible sur iPhone SE (375 px)
  - [ ] CvlBrainFloat visible sur Pixel 4 (360 px)
  - [ ] AdminMobileDashboard redirige vers `/admin` sans session
  - [ ] ProSpaceDashboard : boutons masqués jusqu'au chargement doctrine
  - [ ] Avatars : fallback visible si URL 404 (tester avec une URL invalide)
  - [ ] Textes : aucun "Loading..." visible dans l'UI française

---

## 6. Fichiers modifiés

| Fichier | Type | Axe |
|---------|------|-----|
| `frontend/src/App.css` | Modifié | R |
| `frontend/src/components/ui/KKAvatar.jsx` | Créé | M |
| `frontend/src/components/ui/KKSkeleton.jsx` | Créé | M |
| `frontend/src/components/ui/KKEmptyState.jsx` | Créé | M |
| `frontend/src/components/CvlBrainFloat.jsx` | Modifié | R |
| `frontend/src/components/ProSpaceDashboard.jsx` | Modifié | B, S |
| `frontend/src/components/AdminMobileDashboard.jsx` | Modifié | S |
| `frontend/src/components/pro/LinkedInFeed.jsx` | Modifié | M |
| `frontend/src/components/pro/ReelsFeed.jsx` | Modifié | M |
| `frontend/src/components/CatalogPage.jsx` | Modifié | I |
| `frontend/src/components/ParticipantProfile.jsx` | Modifié | I |
| `frontend/src/components/PartnerManagement.jsx` | Modifié | I |

---

## 7. Commits

Toutes les corrections sont sur la branche `claude/fix-critical-bugs-RpAsh`.

| Commit | Description |
|--------|-------------|
| `2de5da4` | fix: corriger tous les bugs critiques bloquant les 4 flux utilisateurs |
| *(ce commit)* | ux: audit UX complet — responsive, sécurité, médias, i18n |

---

*Ce document est généré automatiquement lors de l'audit. Mettre à jour à chaque sprint.*
