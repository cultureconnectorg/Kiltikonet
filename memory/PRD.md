# KiltiKonet Smart Engine — PRD v3.0

## Vision 2026-2031
Infrastructure de données stratégique pour les marchés culturels afro-diasporiques.

---

## Ce qui a été implémenté

### Phase 1 — Foundation ✅
- **Multi-tenant**: `tenant_id` ajouté à toutes les tables
- **Tenant par défaut**: `culture-connect-2026`
- **Collections MongoDB**:
  - `matching_events` — Capture chaque recommandation
  - `territorial_flows` — Agrégation des flux entre territoires
  - `collaboration_outcomes` — Résultats business déclarés
  - `attestations` — Certifications générées
  - `tenant_config` — Configuration white-label

### Phase 2 — Intelligence API ✅
- `GET /api/v1/intelligence/territorial-flows`
- `GET /api/v1/intelligence/sector-heatmap`
- `GET /api/v1/intelligence/conversion-rates`
- `GET /api/v1/intelligence/emerging-markets`
- `GET /api/v1/intelligence/impact`

### Phase 3 — Certification Engine ✅
- Génération d'attestations avec UUID unique
- QR code dans les PDFs avec lien de vérification
- `GET /api/v1/verify/:attestationId`

### Phase 4 — Admin Dashboard Intelligence ✅
- Onglet "Intelligence" dans Smart Engine
- 5 panels interactifs

### Phase 5 — CMS Complet ✅ (Février 2026)

#### Section Médias
- Upload bannière hero, logo, photos sites, galerie
- Cloudinary integration

#### Section Exposants
- Photos pour profils Smart Engine et participants
- Initiales auto-générées

#### Section Intervenants
- Nom, rôle, photo, bio
- Drag & drop réordonnement

#### Section Partenaires
- Logos avec URLs
- Ordre d'affichage

#### Section Design (NOUVEAU ✅)
- **Couleurs du thème**: 5 color pickers
  - Principale (#A65D47 Terracotta)
  - Secondaire (#C8922A Or)
  - Accent (#4A5D4E Sauge)
  - Fond (#1A1A1A Charbon)
  - Texte (#F4F1EA Crème)
- **Typographie**: 5 polices (Inter, Poppins, DM Sans, Montserrat, Source Sans Pro)
- **Section Hero**: Image de fond, titre, sous-titre
- **Prévisualisation en direct**

#### Section Contenu (NOUVEAU ✅)
- **Page Accueil**: Hero, Introduction, Chiffres clés
- **Page Programme**: Introduction + Programme Officiel structuré
- **Page À propos**: Histoire, Mission, Vision

#### Programme Officiel (NOUVEAU ✅)
Structure exacte:
```
DAY 1 — Mardi 20 Mai 2026
  Site: Bibliothèque Schoelcher
  Slots: [time] [title] [description] [speaker]

DAY 2 — Mercredi 21 Mai 2026
  Site: Bibliothèque Schoelcher + Tropiques Atrium
  Slots: [time] [title] [description] [speaker]

DAY 3 — Jeudi 22 Mai 2026 (JOURNÉE ABOLITION)
  Site: Tropiques Atrium + La Savane
  → Mis en évidence en terracotta #A65D47
  Slots: [time] [title] [description] [speaker]

DAY 4 — Vendredi 23 Mai 2026
  Site: Tropiques Atrium
  Slots: [time] [title] [description] [speaker]
```
- Ajouter / éditer / supprimer / réordonner créneaux
- Alimente: Page /programme, PDF, Assistant IA (RAG)

#### Section Pages Dynamiques (NOUVEAU ✅)
- Création de pages personnalisées
- Accessible via `/p/{slug}`
- Titre, Slug URL, Meta description SEO
- Contenu HTML
- Publication/dépublication

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

### Collections MongoDB CMS
- `cms_media` — Images et médias
- `cms_exhibitor_photos` — Photos exposants
- `cms_speakers` — Intervenants
- `cms_partner_banners` — Logos partenaires
- `tenant_config` — Thème et configuration
- `cms_content` — Contenu éditorial
- `cms_pages` — Pages dynamiques

### Routes Frontend
- `/` — Page d'accueil
- `/programme` — Programme officiel (depuis CMS)
- `/inscription` — Formulaire d'inscription
- `/admin` — Dashboard administrateur
- `/admin/cms` — CMS Admin
- `/smart-engine` — Intelligence Dashboard
- `/p/:slug` — Pages dynamiques CMS

---

## Prochaines Étapes

### P0 (Immédiat)
- ✅ Section Contenu avec Programme Officiel
- ✅ Section Pages dynamiques
- ✅ Section Design
- ✅ Connexion pages publiques au CMS

### P1 (À venir)
- Export PDF du programme officiel
- Intégration RAG pour assistant IA
- Page /programme avec mode impression

### P2 (Futur)
- Déploiement en production
- Configuration DNS kiltikonet.fr
- Extension white-label pour autres événements

---

## Accès Admin

- **URL CMS**: `/admin/cms`
- **Mot de passe**: `CC2026admin`

---

*Dernière mise à jour: 27 février 2026*
