# KiltiKonet Smart Engine — PRD v3.3

## Vision 2026-2031
Infrastructure de données stratégique pour les marchés culturels afro-diasporiques.

---

## Ce qui a été implémenté (Sessions précédentes + actuelle)

### 1. Expérience Cinématique — TOUTES LES PAGES PUBLIQUES ✅ (28/02/2026)
L'ensemble des pages publiques utilise maintenant les animations de scroll :

**Pages avec expérience cinématique complète :**
- **Landing Page (/)** : Hero, stats, countdown, programme, partenaires, CTA, contact
- **Programme (/programme)** : Timeline, day cards, slots animés
- **Pricing (/pricing)** : Hero, pricing cards avec hover
- **Partnership (/partnership)** : Hero, métriques, avantages, formules partenariat
- **Catalog (/catalog)** : Header animé, participant cards avec hover
- **Registration (/inscription)** : Header, stepper, formulaire multi-étapes

### 2. Globe 3D Interactif ✅ (28/02/2026) - NOUVEAU
Remplacement du planisphère 2D par un globe 3D immersif :

**Caractéristiques :**
- Globe terrestre avec texture réaliste (earth-dark.jpg)
- 10 territoires avec points colorés et labels au survol
- Arcs animés reliant chaque territoire à la Martinique (centre)
- Effet pulse circulaire autour de Fort-de-France
- Atmosphère avec halo terracotta
- Compteur animé "10 territoires connectés"
- Interaction utilisateur : rotation, zoom, survol
- Bibliothèque : react-globe.gl v2.37.0

**Territoires affichés :**
- Martinique (centre - terracotta)
- Paris, Londres, New York (diaspora - blanc/doré)
- Haïti, Guadeloupe (Caraïbes - terracotta)
- Sénégal, Nigeria, Brésil, Colombie (Afrique/Amérique du Sud - doré)

### 3. Intro Sequence "Ancestrale" ✅
Séquence sur première visite (localStorage kk_visited) :
- Step 1: Le Souffle (pulsation)
- Step 2: Le Tambour (son + vibration mobile)
- Step 3: Le Mot (NOU. + message territorial)
- Step 4: L'Image + Vérité (deux phrases)
- Step 5: Le Silence sacré
- Step 6: La Question des identités (5 choix)

### 4. CMS Complet ✅
Dans /admin/cms :
- **Design** : Thème, couleurs, typographie
- **Contenu** : Programme avec éditeur structuré
- **Pages** : Gestion des pages dynamiques
- **Intention** : Mot de l'année, images, messages territoriaux
- **Carte & Fonds** : ✅ Interface complète pour gérer le globe 3D
  - Gestion des territoires (nom, label, lat/lon, couleur, taille)
  - Présets de couleurs (Terracotta, Doré, Blanc, Sage)
  - Activation/désactivation des points
  - Bouton "Voir le globe" pour prévisualiser

---

## Architecture Technique

### Stack
- **Backend Principal**: FastAPI Python (port 8001)
- **Smart Engine**: Node.js/Express (port 8002)
- **Frontend**: React + Tailwind CSS
- **Database**: MongoDB
- **LLM**: Claude via Emergent LLM Key
- **Media**: Cloudinary
- **3D Globe**: react-globe.gl (Three.js/WebGL)
- **PDF**: pdf-lib + qrcode

### Composants clés
- `/frontend/src/hooks/useAnimations.js` - Hooks pour animations scroll
- `/frontend/src/components/Globe3D.jsx` - Globe 3D interactif (NOUVEAU)
- `/frontend/src/components/CinematicElements.jsx` - Countdown, Particles
- `/frontend/src/components/IntroSequence.jsx` - Séquence d'accueil
- `/frontend/src/components/PartnershipPage.jsx` - Page partenariat cinématique
- `/frontend/src/components/CatalogPage.jsx` - Catalogue avec animations
- `/frontend/src/components/RegistrationForm.jsx` - Formulaire animé

### Collections MongoDB
- `annual_intention` - Intention de l'année pour intro sequence
- `cms_territories` - Configuration des territoires du globe
- `cms_backgrounds` - Arrière-plans par section
- `cms_animations` - Configuration des animations

---

## Prochaines Étapes

### P0 (Immédiat)
- ✅ Animations cinématiques sur toutes les pages - COMPLÉTÉ
- ✅ Globe 3D interactif - COMPLÉTÉ

### P1 (À venir)
- Compléter l'interface CMS "Carte & Fonds"
  - Gestion des territoires sur le globe (lat/lng, couleur, taille)
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
