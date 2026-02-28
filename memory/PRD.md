# KiltiKonet Smart Engine — PRD v3.2

## Vision 2026-2031
Infrastructure de données stratégique pour les marchés culturels afro-diasporiques.

---

## Ce qui a été implémenté (Sessions précédentes + actuelle)

### 1. Expérience Cinématique — TOUTES LES PAGES PUBLIQUES ✅ (MAJ 28/02/2026)
L'ensemble des pages publiques utilise maintenant les animations de scroll :

**Pages avec expérience cinématique complète :**
- **Landing Page (/)** : Hero, stats, countdown, programme, partenaires, CTA, contact
- **Programme (/programme)** : Timeline, day cards, slots animés
- **Pricing (/pricing)** : Hero, pricing cards avec hover
- **Partnership (/partnership)** : Hero, métriques, avantages, formules partenariat
- **Catalog (/catalog)** : Header animé, participant cards avec hover
- **Registration (/inscription)** : Header, stepper, formulaire multi-étapes

**Hooks d'animation utilisés :**
- `useIntersectionObserver` : Déclenche les animations à l'entrée dans le viewport
- `Reveal` : Composant wrapper avec direction, délai, durée
- `useCountUp` : Animation de comptage pour les chiffres
- `StaggerContainer` : Animation échelonnée des enfants

### 2. Intro Sequence "Ancestrale" ✅
Séquence sur première visite (localStorage kk_visited) :
- Step 1: Le Souffle (pulsation)
- Step 2: Le Tambour (son + vibration mobile)
- Step 3: Le Mot (NOU. + message territorial)
- Step 4: L'Image + Vérité (deux phrases)
- Step 5: Le Silence sacré
- Step 6: La Question des identités (5 choix)

### 3. CMS Complet ✅
Dans /admin/cms :
- **Design** : Thème, couleurs, typographie
- **Contenu** : Programme avec éditeur structuré
- **Pages** : Gestion des pages dynamiques
- **Intention** : Mot de l'année, images, messages territoriaux
- **Carte & Fonds** : Territoires, arrière-plans, animations (backend prêt)

### 4. Planisphère 2D ✅ (À remplacer par Globe 3D)
- Carte du monde SVG stylisée
- 10 territoires avec points colorés
- NOTE: Problème d'affichage en preview (fonctionne en production)

---

## Architecture Technique

### Stack
- **Backend Principal**: FastAPI Python (port 8001)
- **Smart Engine**: Node.js/Express (port 8002)
- **Frontend**: React + Tailwind CSS
- **Database**: MongoDB
- **LLM**: Claude via Emergent LLM Key
- **Media**: Cloudinary
- **PDF**: pdf-lib + qrcode

### Composants clés
- `/frontend/src/hooks/useAnimations.js` - Hooks pour animations scroll
- `/frontend/src/components/Planisphere.jsx` - Carte diaspora (à remplacer)
- `/frontend/src/components/CinematicElements.jsx` - Countdown, Particles
- `/frontend/src/components/IntroSequence.jsx` - Séquence d'accueil
- `/frontend/src/components/PartnershipPage.jsx` - Page partenariat cinématique
- `/frontend/src/components/CatalogPage.jsx` - Catalogue avec animations
- `/frontend/src/components/RegistrationForm.jsx` - Formulaire animé

### Collections MongoDB
- `annual_intention` - Intention de l'année pour intro sequence
- `cms_territories` - Configuration des territoires de la carte
- `cms_backgrounds` - Arrière-plans par section
- `cms_animations` - Configuration des animations

---

## Bugs connus

### Planisphère - Points invisibles (Preview uniquement)
- **Symptôme**: Les cercles des territoires sont dans le DOM mais ne s'affichent pas
- **Cause**: L'environnement Emergent Preview injecte des `<span>` dans le SVG
- **Impact**: Preview seulement - fonctionne en production
- **Résolution prévue**: Remplacement par Globe 3D interactif

---

## Prochaines Étapes

### P0 (Immédiat)
- **Remplacer le Planisphère 2D par un Globe 3D interactif**
  - Bibliothèque: react-globe.gl ou three.js
  - Affichage des territoires avec points et lignes vers Martinique
  - Intégration avec `/api/cms/territories`

### P1 (À venir)
- Compléter l'interface CMS "Carte & Fonds"
  - Gestion des territoires sur le globe
  - Gestion des arrière-plans de sections
  - Toggles d'animations

### P2 (Futur)
- Export PDF du programme officiel
- Configuration DNS kiltikonet.fr
- Extension white-label pour autres événements
- Refactoring CMSAdmin.jsx (fichier > 2000 lignes)

---

## Accès Admin

- **URL CMS**: `/admin/cms`
- **Mot de passe**: `CC2026admin`

---

*Dernière mise à jour: 28 février 2026*
