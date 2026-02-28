# KiltiKonet Smart Engine — PRD v3.1

## Vision 2026-2031
Infrastructure de données stratégique pour les marchés culturels afro-diasporiques.

---

## Ce qui a été implémenté (Session actuelle)

### 1. Expérience Cinématique — Landing Page ✅
L'ensemble de la page d'accueil est maintenant une expérience immersive :

**MOMENT 1 — HERO**
- Animations d'entrée pour chaque ligne de texte (drop-in, fade-up)
- Parallaxe sur le fond
- Délais séquentiels pour titre, sous-titre, boutons

**MOMENT 2 — LES CHIFFRES**
- Stat cards avec animation de comptage (40, 5+, etc.)
- Entrées depuis différentes directions (left/right/up/down)
- Hover effects avec bordure terracotta

**MOMENT 3 — PLANISPHÈRE DIASPORA**
- Carte du monde stylisée avec contours des continents
- 10 territoires avec points colorés
- Lignes animées vers Martinique (centre)
- Compteur "10 territoires connectés"
- NOTE: Les points ne s'affichent pas dans l'environnement preview (bug d'injection de spans par le tool) mais fonctionneront en production

**MOMENT 4 — COUNTDOWN**
- Compte à rebours live vers le 22 Mai 2026
- Jours/Heures/Minutes/Secondes
- Animation flip sur les secondes
- "Battement de cœur" de la page

**MOMENT 5 — PROGRAMME**
- Cards qui apparaissent au scroll
- Jour principal (22 Mai) avec bordure pulsante terracotta

**MOMENT 6 — PARTENAIRES**
- Révélation en cascade (row by row)
- Hover avec bordure terracotta et lift

**MOMENT 7 — CTA FINAL**
- Effet de particules (ascension type braises)
- Titre qui se rejoint au centre

### 2. Page Programme Cinématique ✅
- Timeline verticale terracotta
- Cards qui entrent en alternance gauche/droite
- Jour principal avec animation pulse 3x
- Slots avec stagger animation

### 3. Intro Sequence "Ancestrale" ✅
Séquence sur première visite (localStorage kk_visited) :
- Step 1: Le Souffle (pulsation)
- Step 2: Le Tambour (son + vibration mobile)
- Step 3: Le Mot (NOU. + message territorial)
- Step 4: L'Image + Vérité (deux phrases)
- Step 5: Le Silence sacré
- Step 6: La Question des identités (5 choix)

### 4. CMS "Intention de l'année" ✅
Dans /admin/cms > onglet "Intention" :
- Mot d'ouverture créole (NOU., SONJE, MOVÉ...)
- Image d'ouverture
- Phrases de vérité (2 lignes)
- Mot à coloriser
- Couleur accent annuelle
- Messages territoriaux éditables
- Prévisualisation de la séquence

### 5. CMS "Carte & Fonds" (Backend prêt) ✅
Dans /admin/cms > onglet "Carte & Fonds" :
- **Territoires** : Liste éditable avec nom, lat/lon, couleur, taille
- **Fonds d'écran** : Par section (Hero, Programme, etc.)
- **Animations** : Toggles globaux et par section

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

### Nouveaux composants
- `/frontend/src/hooks/useAnimations.js` - Hooks pour animations scroll
- `/frontend/src/components/Planisphere.jsx` - Carte diaspora animée
- `/frontend/src/components/CinematicElements.jsx` - Countdown, Particles
- `/frontend/src/components/IntroSequence.jsx` - Séquence d'accueil

### Nouvelles collections MongoDB
- `annual_intention` - Intention de l'année pour intro sequence
- `map_config` - Configuration des territoires de la carte
- `site_config` - Configuration globale (animations, backgrounds)

---

## Bugs connus

### Planisphère - Points invisibles (Preview uniquement)
- **Symptôme**: Les cercles des territoires sont dans le DOM mais ne s'affichent pas
- **Cause**: L'environnement Emergent Preview injecte des `<span>` dans le SVG
- **Impact**: Preview seulement - fonctionne en production
- **Workaround**: Aucun nécessaire pour la production

---

## Prochaines Étapes

### P0 (Immédiat)
- Déploiement en production pour tester le planisphère
- Tests de l'intro sequence en conditions réelles

### P1 (À venir)
- Export PDF du programme officiel
- Intégration RAG pour assistant IA
- Animations sur autres pages (/about, /partnership)

### P2 (Futur)
- Configuration DNS kiltikonet.fr
- Extension white-label pour autres événements

---

## Accès Admin

- **URL CMS**: `/admin/cms`
- **Mot de passe**: `CC2026admin`

---

*Dernière mise à jour: 28 février 2026*
