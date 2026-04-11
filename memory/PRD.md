# PRD — Kiltikonet CC2026

## Vision
Plateforme événementielle culturelle souveraine pour Culture Connect 2026, Martinique. Full-stack React 19 + FastAPI + MongoDB.

## Audit Global Session Courante — 2026-04-11

### Correctifs 🔴 CRITIQUES (TERMINÉS)

1. **UserAvatar universel** (`/src/components/omega/UserAvatar.jsx`)
   - Composant partagé : photo si URL valide, initiale gold sur fond rgba si absent, fallback onError automatique
   - Intégré dans : FeedView, InboxView (remplace tous les avatars manuels)
   - Props: src, name, size, border, className

2. **Feed CRUD complet** (FeedView.jsx + omega.py)
   - Menu "More" (3 points ⋮) sur chaque post
   - Posts de l'auteur : Modifier (PUT /api/feed/posts/:id) + Supprimer (DELETE /api/feed/posts/:id)
   - Posts des autres : Signaler (POST /api/feed/posts/:id/report) + Copier le lien
   - Modals confirmation pour edit/delete
   - Badge "Modifié" sur les posts édités
   - Toasts gold : "Post modifié", "Post supprimé", "Post signalé"
   - Backend cherche dans pro_posts ET feed_posts (compatibilité dual-collection)

3. **credentials: 'include' — 100% couvert**
   - Vérifié sur les 19 composants omega
   - 1 seul vrai manquant corrigé (ScanApp.jsx L46)
   - Tous les fetch() ont maintenant credentials: 'include'

4. **Mapping champs API corrigé**
   - FeedView utilise maintenant les vrais champs API: id, content, author_name, author_image, eclairs_count, comments_count
   - Endpoint POST /api/pro/feed/post pour création
   - Endpoint POST /api/pro/feed/posts/:id/eclair pour éclairs

### Correctifs 🟡 MOYENS (EN ATTENTE)
- ShopView : Ajouter breakpoints responsive lg:
- AgendaView : Ajouter breakpoints responsive lg:
- BuilderView : disabled sur bouton PUBLIER pendant loading
- CC2026Dashboard : Confirmation modal pour suppression

### Backlog P0-P4 (non audit)
- P0: Sas auth /pro, Builder publication, Seed contenu caribéen
- P1: Logo centré, DMs état vide, Photo profil preview
- P2: Feed CRUD (DONE), Géolocalisation
- P3: i18n 8 langues
- P4: Seed contenu caribéen

## Credentials
- Bypass Admin : cultureconnectorg@gmail.com (code 000000)
- Espace Coleen : Coleen2026
