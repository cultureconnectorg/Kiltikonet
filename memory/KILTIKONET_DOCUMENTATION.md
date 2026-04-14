# KILTIKONET CC2026 — Documentation Technique Post-Deploy
## Culture Connect 2026 · Fort-de-France, Martinique
### Version 1.0.0 · Deploye le 14 Avril 2026

---

# 1. VISION & CONTEXTE

## 1.1 Qu'est-ce que Kiltikonet ?
Kiltikonet est la plateforme numerique souveraine de **Culture Connect 2026** (CC2026), un evenement culturel international se tenant du 20 au 23 mai 2026 a Fort-de-France, Martinique. Elle reunit professionnels, artistes, institutions et public autour de la culture caribeenne et afro-descendante.

## 1.2 Objectifs strategiques
- **Monetisation** : Accreditations payantes (50-500EUR), billetterie (45-150EUR), partenariats, packs de jetons (Kilti-Tokens)
- **Communaute** : Reseau social professionnel culturel (Feed, Reels, Builder, Messaging)
- **Souverainete** : Infrastructure FREK (identite culturelle) invisible pour l'utilisateur, autorite silencieuse
- **Diaspora** : Multilinguisme (FR, EN, ES, PT, KW creole) pour toucher toutes les communautes
- **Evenementiel** : Programme 4 jours, catalogue artistes, appel a projets, concerts

## 1.3 Philosophie "Voiture neuve"
Chaque nouvel utilisateur commence a zero. Le contenu vit et evolue grace a la communaute reelle. Zero donnee fictive, zero ghost. L'experience grandit avec les arrivants, comme un vrai reseau social.

---

# 2. ARCHITECTURE TECHNIQUE

## 2.1 Stack
| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | React | 19.0.0 |
| Routing | react-router-dom | 7.5.1 |
| Styling | Tailwind CSS | 3.x |
| Animations | motion (Framer Motion) | 12.38.0 |
| 3D Globe | Three.js + react-globe.gl | 0.160.0 / 2.24.0 |
| Components | Shadcn/UI | Custom |
| i18n | react-i18next + i18next | 17.0.3 / 26.0.4 |
| Notifications | Sonner | 2.0.3 |
| Biometrie | @simplewebauthn/browser | 13.3.0 |
| HTTP Client | Axios | 1.8.4 |
| Backend | FastAPI (Python) | 0.115.x |
| Base de donnees | MongoDB (Motor async) | 7.x |
| Paiements | Stripe Checkout (LIVE) | API |
| Email | Brevo SMTP + Resend | API |
| IA | Claude Sonnet (Emergent LLM Key) | CVL Brain |
| Stockage | AWS S3 (Object Storage) | eu-west-1 |
| Push | Web Push (VAPID) | Standard |
| Geocoding | Nominatim (OpenStreetMap) | API libre |

## 2.2 Metriques du code
| Element | Quantite |
|---------|----------|
| Fichiers frontend (.jsx/.js) | 216 |
| Fichiers backend (.py) | 118 |
| Lignes frontend total | ~58 700 |
| Lignes backend (server.py) | 10 290 |
| Lignes backend (routes/) | 13 374 |
| Endpoints API | ~530 |
| Collections MongoDB | 50+ |
| Indexes MongoDB | 75+ |
| Dependances frontend (npm) | 70 |
| Dependances backend (pip) | 142 |
| Composants Omega (Espace Pro) | 20 |

## 2.3 Structure des fichiers
```
/app/
├── backend/
│   ├── server.py                  # Serveur principal FastAPI (10 290 lignes)
│   ├── routes/
│   │   ├── omega.py               # Espace Pro : builder, upload, publish, auth (72 endpoints)
│   │   ├── pro_feed.py            # Feed Instagram/Reels + Geolocalisation (11 endpoints)
│   │   ├── shared.py              # CMS, planning, pages publiques (30 endpoints)
│   │   ├── ghost_profiles.py      # Moteur de profils (desactive en prod)
│   │   ├── fintech.py             # Wallet, transactions KT (17 endpoints)
│   │   ├── brain.py               # CVL Brain IA (16 endpoints)
│   │   ├── doctrine.py            # Permissions par role (10 endpoints)
│   │   ├── badges.py              # Badges CC2026, QR codes (11 endpoints)
│   │   ├── shop_payments.py       # Stripe checkout, packs (10 endpoints)
│   │   ├── support.py             # FAQ + Tickets support (10 endpoints)
│   │   ├── site_analytics.py      # Analytics natif (3 endpoints)
│   │   ├── webauthn.py            # Face ID / Touch ID (6 endpoints)
│   │   ├── smart_engine.py        # Smart Engine node bridge (9 endpoints)
│   │   ├── ses.py                 # AWS SES email (5 endpoints)
│   │   ├── pro_social.py          # Connexions, messages (7 endpoints)
│   │   ├── wallet.py              # Wallet operations (5 endpoints)
│   │   ├── push_notifications.py  # Web Push VAPID (5 endpoints)
│   │   └── ... (29 fichiers route total)
│   ├── services/
│   │   └── object_storage.py      # AWS S3 integration
│   ├── scripts/
│   │   └── production_cleanup.py  # Purge ghost data
│   └── requirements.txt           # 142 packages figes
├── frontend/
│   └── src/
│       ├── App.js                 # Router principal (45+ routes)
│       ├── i18n.js                # Configuration 5 langues
│       ├── lib/
│       │   ├── smartTracker.js    # Analytics natif zero dependance
│       │   └── translations.js    # Traductions legacy
│       ├── context/
│       │   └── LanguageContext.js  # Contexte langue synchronise i18next
│       ├── hooks/
│       │   ├── useAuth.js         # Hook authentification
│       │   ├── useAnimations.js   # Intersection observers, Reveal
│       │   └── useNotificationSound.js
│       ├── components/
│       │   ├── omega/             # 20 composants Espace Pro
│       │   │   ├── ProApp.jsx         # Shell principal + tutoriel
│       │   │   ├── OrbitalMenu.jsx    # Menu orbital 3D
│       │   │   ├── FeedView.jsx       # Feed Instagram + Reels
│       │   │   ├── BuilderView.jsx    # Editeur multimedia
│       │   │   ├── WalletView.jsx     # Wallet KT
│       │   │   ├── ShopView.jsx       # Boutique
│       │   │   ├── AgendaView.jsx     # Agenda evenements
│       │   │   ├── InboxView.jsx      # Messagerie
│       │   │   ├── CockpitView.jsx    # Terminal admin
│       │   │   ├── SovereignProfileView.jsx # Profil utilisateur
│       │   │   ├── BrainChat.jsx      # CVL Brain IA
│       │   │   ├── ProTutorial.jsx    # Tutoriel 8 etapes
│       │   │   └── SplashScreen.jsx   # Video splash verte
│       │   ├── admin/
│       │   │   └── AdminSupportPanel.jsx # Admin FAQ + Tickets
│       │   ├── LandingPage.jsx        # Page d'accueil publique
│       │   ├── PricingPage.jsx        # Tarifs & accreditations
│       │   ├── PartnershipPage.jsx    # Partenariats
│       │   ├── RegistrationForm.jsx   # Inscription 3 etapes
│       │   ├── FAQPage.jsx            # FAQ publique
│       │   ├── SupportPage.jsx        # Formulaire tickets
│       │   ├── ConcertPage.jsx        # Programme concerts
│       │   ├── Globe3D.jsx            # Globe 3D interactif
│       │   ├── IntroSequence.jsx      # Animation d'intro "NOU."
│       │   ├── Header.jsx             # Navigation + selecteur langue
│       │   ├── AdminDashboard.jsx     # Dashboard admin complet
│       │   └── ... (179 composants total)
│       └── components/ui/            # 40+ composants Shadcn
├── smart-engine/                     # Service Node.js auxiliaire
├── memory/
│   └── PRD.md                        # Product Requirements
└── public/
    ├── manifest.json                 # PWA config
    ├── logo-kiltikonet.png
    └── videos/splash.mp4             # Video splash verte
```

## 2.4 Services et ports
| Service | Port interne | Gere par |
|---------|-------------|----------|
| Frontend React | 3000 | Supervisor (hot reload) |
| Backend FastAPI | 8001 | Supervisor (uvicorn --reload) |
| Smart Engine Node | 8002 | Supervisor |
| MongoDB | 27017 | Supervisor |
| Nginx Proxy | 80/443 | Kubernetes Ingress |

## 2.5 Variables d'environnement
### Frontend (.env)
- `REACT_APP_BACKEND_URL` : URL publique de l'app (utilisee pour toutes les requetes API)

### Backend (.env) — 41 variables
- `MONGO_URL`, `DB_NAME` : Connexion MongoDB
- `CORS_ORIGINS` : Domaines autorises (kiltikonet.fr, preview, production)
- `STRIPE_API_KEY`, `STRIPE_PUBLIC_KEY`, `STRIPE_WEBHOOK_SECRET` : Stripe LIVE
- `SESSION_SECRET` : Secret cookies httpOnly
- `EMERGENT_LLM_KEY` : Cle IA universelle (Claude Sonnet)
- `AWS_*` : S3 stockage fichiers
- `BREVO_*`, `RESEND_*`, `SES_*` : Services email
- `VAPID_*` : Push notifications
- `HCAPTCHA_SECRET` : Anti-bot
- `FREK_*` : Infrastructure identite culturelle
- `BASEROW_*` : Integration Baserow (badges)

---

# 3. FONCTIONNALITES DETAILLEES

## 3.1 Site Public (accessible sans connexion)

### Page d'accueil (LandingPage)
- Animation d'intro cinematique "NOU." (IntroSequence)
- Globe 3D interactif (Three.js) avec territoires caribeeens + points geolocalises des posts
- Sections : Hero, Programme, Partenaires, Concert, Newsletter
- Footer avec liens FAQ, Support, mentions legales

### Programme (/programme)
- 4 jours : 20-23 Mai 2026
- Planning detaille par creneau horaire
- Lieux : Bibliotheque Schoelcher, Parc de La Savane, Salle Aime Cesaire
- Sessions : Conferences, tables rondes, networking B2B, showcases, concerts

### Tarifs & Accreditations (/pricing)
- **Visiteur** (Gratuit) : Marche Culturel uniquement. Mention claire "Concerts & spectacles non inclus" en rouge
- **Emergent** (50EUR) : Conferences, badge officiel, networking, Savane
- **Professionnel** (300EUR) : Pack complet + B2B + backstage
- **Institutionnel** (500EUR) : Stand dedie, prise de parole, presse
- **Billetterie** : General (45EUR), VIP (150EUR) — acces concerts et spectacles

### Partenariat (/partners)
- Tiers : Bronze, Silver, Gold
- Formulaire de candidature
- Paiement Stripe integre

### Inscription (/badge-inscription)
- Formulaire 3 etapes : Profil, Details, Paiement
- Upload photo de profil
- Redirection Stripe Checkout

### FAQ (/faq)
- 7 questions par defaut (seedees au demarrage)
- Recherche en temps reel
- Filtres par categorie (General, Jetons, Technique, Evenement)
- Accordeon animé
- Lien vers Support si pas de reponse

### Support / Reclamations (/support)
- Formulaire : Nom, Email, Categorie (General, Reclamation, Technique, Facturation), Sujet, Message
- Confirmation avec reference ticket TK-XXXXXXXX
- Email de contact : contact@kiltikonet.fr

### Catalogue (/catalogue)
- Listing des artistes et professionnels inscrits
- Filtres par type de profil, pays, expertise

### Appel a projets (/appel-2026)
- Formulaire de candidature
- Description des criteres

### Concert (/concert)
- Programme musical
- Artistes confirmes

### Pages legales
- Mentions legales, Politique de confidentialite, Politique cookies, Accessibilite, Conditions KT

## 3.2 Espace Pro (/pro) — Reseau social culturel

### Authentification
- **Email Magic Link** : saisie email → lien de connexion par email
- **Google OAuth** : connexion rapide
- **GitHub OAuth** : connexion dev
- **Identifiant culturel** : connexion par ID + code OTP
- **Face ID / Touch ID** : WebAuthn silencieux — se declenche automatiquement si l'utilisateur est deja connu (email en localStorage). Aucun bouton visible.
- **Session** : cookie httpOnly (7 jours), sessionStorage pour la SPA

### Splash & Tutoriel
- **Video splash verte** (splash.mp4) : jouee 1 fois par session a l'ouverture de /pro
- **Tutoriel premiere connexion** (ProTutorial) : 8 etapes tooltips animes (Welcome, Feed, Builder, Wallet, Shop, Brain, Profil, Ready). Affiche 1 seule fois (localStorage `kk_tutorial_done`).

### Menu Orbital (OrbitalMenu)
- Navigation 3D avec 8 noeuds orbitaux : Feed, Builder, Wallet, Agenda, Shop, Inbox, Cockpit, Profil
- Logo central anime (rotation 60s, pulse 4s)
- Double-tap sur le centre = CVL Brain IA
- Header : bouton "Site" discret (retour site public), badges CC2026, JCC, Profil
- Panel lateral droit (desktop) : soldes KT/JCC, impact culturel, activite recente

### Feed (FeedView)
- **Mode Feed** : scroll vertical style Instagram avec cartes, avatars, actions (like, commentaire, eclair, partage)
- **Mode Reels** : plein ecran scroll-snap style TikTok
- **Publication** : texte + image, geolocalisation automatique (MapPin sous l'auteur)
- **Suppression** : posts propres uniquement
- **Empty state** : "Bienvenue dans le Feed — Soyez le premier a partager" pour les nouveaux utilisateurs
- **Contenu reel uniquement** : zero ghost posts en production

### Builder (BuilderView)
- Editeur multimedia : texte, photo (upload + camera), certification
- Publication vers Feed ou Shop
- Gestion de projets (draft, publie)
- Statistiques : nombre de projets, certifies

### Wallet (WalletView)
- Affichage solde Kilti-Tokens (KT) et Jetons CC (JCC)
- Historique des transactions
- Envoi d'Eclairs (soutien aux createurs)
- Design carte de credit fintech

### Shop (ShopView)
- 4 packs de jetons : Decouverte (15 KT/5EUR), Culture (40 KT/12EUR), Diaspora (120 KT/30EUR), VIP (500 KT/100EUR)
- Produits culturels (marketplace)
- Paiement Stripe integre
- Grille responsive (2 cols mobile → 4 cols desktop)
- 2 packs avec visuels exemples (Culture, VIP)

### Agenda (AgendaView)
- Evenements CC2026 avec horaires, lieux
- Grille responsive (1 col mobile → 2 cols desktop)
- Filtre par jour

### Inbox (InboxView)
- Messagerie entre utilisateurs
- Conversations en temps reel
- Empty state elegant anime avec CTA "Nouvelle conversation"

### CVL Brain (BrainChat)
- Assistant IA (Claude Sonnet via Emergent LLM Key)
- Questions sur CC2026, jetons, plateforme
- Suggestions de questions predefinies
- Memoire de conversation (brain_memory)

### Cockpit (CockpitView)
- Terminal d'administration
- Deploiement, historique
- Preview mobile
- Integration CVL Brain

### Profil (SovereignProfileView)
- Photo de profil avec preview locale (URL.createObjectURL) + upload
- Informations personnelles editables
- Score d'impact culturel
- Parametres de confidentialite
- Suppression de compte (RGPD)
- Identifiant culturel certifie (silencieux)

## 3.3 Administration (/admin)

### Dashboard Admin
- **Onglet Inscriptions** : Liste des registrations, statuts, filtres
- **Onglet Partenaires** : Gestion CRUD des partenaires, sponsoring
- **Onglet Finance** : Transactions, revenus, analytics
- **Onglet Equipe** : Gestion des membres admin
- **Onglet Sante** : Monitoring systeme
- **Onglet Support** : 
  - Tickets : liste, filtres par statut (Ouvert/En cours/Resolu/Ferme), stats, reponses directes, changement de statut
  - FAQ : CRUD complet (ajouter, editer, supprimer, publier/depublier), categories

## 3.4 PWA (Progressive Web App)
- **Manifest** : name "Kiltikonet", start_url "/pro", display "standalone"
- **Couleurs** : background #0a0a0b, theme #f2ca50
- **Installable** sur mobile (icone ecran d'accueil)
- **Splash** : video verte au lancement

---

# 4. SYSTEME DE PAIEMENT STRIPE

## 4.1 Flux de paiement
1. Frontend → `POST /api/create-checkout-session` avec type, tier, donnees
2. Backend cree une Stripe Checkout Session (mode LIVE)
3. Backend retourne l'URL Stripe
4. Frontend redirige l'utilisateur vers Stripe
5. Apres paiement → redirection vers page de confirmation
6. Webhook Stripe → mise a jour du statut en base

## 4.2 Types de checkout
| Type | Endpoint | Tiers disponibles |
|------|----------|-------------------|
| Accreditation | `/api/create-checkout-session` | visiteur (gratuit), emerging (50EUR), professional (300EUR), institutional (500EUR) |
| Partenariat | `/api/create-checkout-session` | bronze, silver, gold |
| Billetterie | `/api/create-checkout-session` | general (45EUR), vip (150EUR) |
| Jetons KT | `/api/shop/checkout/create` | kt-decouverte (5EUR), kt-culture (12EUR), kt-diaspora (30EUR), kt-vip (100EUR) |

## 4.3 Cles Stripe
- Mode : **LIVE** (transactions reelles)
- Les cles sont dans `/app/backend/.env` (sk_live_*, pk_live_*)
- Webhook secret configure

---

# 5. SYSTEME D'IDENTITE FREK

## 5.1 Concept
FREK est l'infrastructure d'identite culturelle de Kiltikonet. C'est une **autorite silencieuse** : elle gere l'identification, la certification et les permissions en arriere-plan sans jamais etre mentionnee dans l'interface utilisateur.

## 5.2 Regles d'affichage
- **Pages publiques** : ZERO mention de "FREK" ou "FREK-ID"
- **Espace Pro** : "Identifiant" ou "ID Certifie" au lieu de "FREK-ID"
- **Backend** : les champs `frek_id`, `frek_status` restent en base
- **Politique** : "Politique Identite" au lieu de "Politique FREK-ID"

## 5.3 Permissions (Doctrine)
| Role | buy_tokens | publish_content | consume_content | support_creators |
|------|-----------|----------------|-----------------|-----------------|
| professional | oui | oui | oui | oui |
| creator | oui | oui | oui | oui |
| consumer | oui | oui | oui | oui |
| institutional | oui | oui | oui | oui |

---

# 6. INTERNATIONALISATION (i18n)

## 6.1 Langues supportees
| Code | Langue | Public cible |
|------|--------|-------------|
| fr | Francais | Base, Martinique, France |
| en | English | Diaspora UK/US, international |
| es | Espanol | Caraibes hispaniques (Cuba, Republique Dominicaine, Porto Rico) |
| pt | Portugues | Bresil, Cap-Vert |
| kw | Kreyol | Martinique, Guadeloupe, Haiti |

## 6.2 Implementation
- **Librairie** : react-i18next + i18next
- **Fichier** : `/app/frontend/src/i18n.js` (toutes les traductions inline)
- **Persistance** : `localStorage` cle `kk_i18n_lang`
- **Selecteur** : Dropdown 5 langues dans le Header (FR, EN, ES, PT, KW)
- **Synchronisation** : LanguageContext.js synchronise i18next et le contexte React
- **Scope** : Navigation, pricing, tickets, FAQ, support, footer, elements communs

---

# 7. ANALYTICS & TRACKING

## 7.1 SmartTracker (natif, zero dependance externe)
- **Fichier** : `/app/frontend/src/lib/smartTracker.js`
- **Events** :
  - `page_view` : URL, referrer, titre, taille ecran
  - `page_exit` : temps passe (secondes), profondeur de scroll (%)
  - `click` : data-testid, href, texte, tag HTML
  - `conversion` : nom (ticket_checkout, partnership_checkout, accreditation_checkout), valeur
  - `search`, `error` : tracking complementaire
- **Batch** : flush toutes les 10s via `POST /api/analytics/batch` (keepalive)
- **Session** : ID unique par session (sessionStorage)
- **SPA** : detection automatique des changements de route via MutationObserver
- **Privacy** : IP hashee cote serveur, aucun cookie tiers

## 7.2 Endpoints analytics
- `POST /api/analytics/batch` : reception des events
- `GET /api/analytics/site-stats` : overview, top pages, devices, timeline, visiteurs uniques

---

# 8. GEOLOCALISATION

## 8.1 Flux
1. A l'ouverture du Feed, `navigator.geolocation.getCurrentPosition()` est demandee (1 seule fois)
2. Si acceptee → reverse geocoding via Nominatim (`GET /api/pro/feed/geo/reverse?lat=X&lng=Y`)
3. Resultat cache en `localStorage` (`kk_user_location`)
4. Chaque post envoie `location_lat`, `location_lng`, `location_name`
5. Affichage : icone MapPin + nom de ville sous l'auteur (style Instagram)

## 8.2 Globe 3D
- Les posts geolocalises apparaissent comme points dores sur le globe
- Refresh automatique toutes les 30 secondes
- Merge avec les territoires caribeeens pre-definis

---

# 9. BASE DE DONNEES

## 9.1 Collections principales (avec donnees en production)
| Collection | Documents | Description |
|-----------|----------|-------------|
| registrations | 6 | Inscriptions utilisateurs |
| pro_posts | 9 | Posts du feed (reels uniquement) |
| builder_projects | 21 | Projets du builder |
| partners | 4 | Partenaires |
| cc_events | 18 | Evenements CC2026 |
| planning | 10 | Creneaux du programme |
| payment_transactions | 35 | Transactions Stripe |
| kn_wallets | 10 | Wallets KT |
| kn_checkout_sessions | 10 | Sessions checkout |
| faqs | 7 | Questions frequentes |
| shop_products | 19 | Produits boutique |
| doctrine_permissions | 5 | Permissions par role |
| cms_content | 8 | Contenu CMS |
| cultural_cards | 18 | Cartes culturelles |
| pro_access_logs | 365 | Logs d'acces (TTL 90j) |
| site_events | 846 | Evenements site |

## 9.2 Indexes (75+ au total)
- **pro_posts** : 8 indexes (created_at, author_id, is_ghost, is_reel compound, geoloc, builder_project_id)
- **registrations** : 11 indexes (email, frek_id unique, status, profile_type, country, tier, expertise_tags, actor_role)
- **analytics_events** : 6 indexes (session_id, type, timestamp, compounds)
- **support_tickets** : 4 indexes (status, email, status+created_at compound)
- **payment_transactions** : 3 indexes (session_id unique, status)
- **TTL** : pro_access_logs (90 jours), workspace_logs (30 jours)

## 9.3 Schema principal : pro_posts
```json
{
  "id": "post_xxxxxxxxxxxx",
  "author_id": "REG-XXXX",
  "author_frek_id": "FREK-XXX-XXXX",
  "author_name": "Nom Complet",
  "author_title": "Artiste",
  "author_image": "/api/files/...",
  "content": "Texte du post",
  "thumbnail_url": "/api/files/.../image.jpg",
  "post_type": "creation|insight|event",
  "dimension": "Arts Visuels & Sceniques",
  "location_lat": 14.6,
  "location_lng": -61.0,
  "location_name": "Fort-de-France, France",
  "likes": [], "likes_count": 0,
  "eclairs": [], "eclairs_count": 0,
  "comments": [], "comments_count": 0,
  "is_ghost": false,
  "is_reel": false,
  "builder_project_id": "PRJ-XXXXXXXX",
  "created_at": "2026-04-14T12:00:00Z"
}
```

---

# 10. SECURITE

## 10.1 Authentification
- Cookies httpOnly (SESSION_SECRET) — pas de token en localStorage
- WebAuthn (Face ID / Touch ID) silencieux
- OTP par email (magic links, expiration)
- Brute force protection (5 tentatives, cooldown)
- hCaptcha sur les formulaires publics

## 10.2 Autorisations
- Doctrine : systeme de permissions par role (5 roles)
- Rate limiter : 500 req/min/IP (in-memory, toutes routes publiques couvertes)
- CORS : whitelist stricte (kiltikonet.fr, preview, production)

## 10.3 Donnees
- RGPD : droit d'acces, rectification, effacement, portabilite
- Suppression de compte : anonymisation des donnees personnelles
- Chiffrement : HTTPS (TLS) via Kubernetes Ingress
- Pas de tracking tiers (analytics natif uniquement)

---

# 11. PERFORMANCE & SCALABILITE

## 11.1 Optimisations en place
- 75+ indexes MongoDB (compound, sparse, TTL)
- Rate limiter 500 req/min/IP
- Batch analytics (flush 10s, pas de requete par event)
- Cache geolocalisation (localStorage, 1 seule requete)
- Lazy loading composants React (Suspense + lazy)
- Images WebP/JPEG compressees
- Scroll-snap CSS natif pour Reels (pas de JS scroll)

## 11.2 TTL (auto-nettoyage)
- `pro_access_logs` : 90 jours
- `workspace_logs` : 30 jours

## 11.3 Capacite cible
- Concu pour **100 000+ utilisateurs simultanes**
- MongoDB async (motor) — non-bloquant
- FastAPI async — ASGI haute performance
- WebSocket pour temps reel (sync, notifications)

---

# 12. HISTORIQUE DES CORRECTIONS

## 12.1 Fix Stripe (P0 — Critique)
- **Probleme** : Double `/api/api/` dans les URLs Axios de 8 fichiers frontend
- **Cause** : `const API = '${BACKEND_URL}/api'` + `${API}/api/xxx` = `/api/api/xxx` → 404 silencieux
- **Fix** : Suppression du `/api/` en trop dans tous les appels
- **Fichiers** : PartnershipPage, RegistrationForm, PartnerConfirmation, ConfirmationScreen, PartnerManagement, ProSpaceDashboard, LandingPage, AdminDashboard
- **Test** : 16/16 backend PASS, Playwright PASS

## 12.2 Fix Builder → Feed
- **Probleme** : Posts publies sans images, publication echouant silencieusement si pas de `registration`
- **Fix** : Fallback auteur depuis email, copie `media_url` dans `thumbnail_url`

## 12.3 UX Tarifs
- **Avant** : "Acces a l'entree generale" = confusion avec acces concerts
- **Apres** : "Pre-inscription gratuite — Marche Culturel uniquement" + exclusions en rouge

## 12.4 FREK Masquage
- Remplacement de toutes les mentions "FREK-ID" par "Identifiant" ou "ID Certifie"
- 15+ fichiers modifies (pages publiques + Espace Pro + Omega)

## 12.5 Email
- Remplacement `cultureconnectorg@gmail.com` par `contact@kiltikonet.fr` partout

## 12.6 Rate Limiter
- Ajout de toutes les routes manquantes dans les exclusions (shared, cms, faq, support, geo, files, etc.)
- Augmentation 200 → 500 req/min/IP

## 12.7 Production Cleanup
- Suppression : 110 ghost posts, 200 ghost profiles, 27 feed_posts legacy, 563 analytics test, 430 workspace logs
- Feed reel uniquement (plus d'auto-generation de ghosts)

---

# 13. DEPLOIEMENT

## 13.1 Environnement
- **Preview** : `https://tarifs-update.preview.emergentagent.com`
- **Production** : `https://tarifs-update.emergent.host`
- **Domaine custom** : `https://kiltikonet.fr` (a configurer DNS)

## 13.2 CORS configure pour
- `https://kiltikonet.fr`
- `https://www.kiltikonet.fr`
- `https://tarifs-update.preview.emergentagent.com`
- `https://tarifs-update.emergent.host`

## 13.3 Supervisor
```
backend   RUNNING (uvicorn, port 8001, hot reload)
frontend  RUNNING (yarn start, port 3000)
smart-engine RUNNING (node, port 8002)
mongodb   RUNNING (port 27017)
```

## 13.4 Health Check
- `GET /api/health` → `{"status": "ok", "db": "connected", "version": "1.0.0"}`

---

# 14. CREDENTIALS & ACCES

## 14.1 Admin
- **Email** : cultureconnectorg@gmail.com
- **Code bypass** : 000000
- **FREK Admin** : FREK-ADM-0001

## 14.2 Contact public
- **Email** : contact@kiltikonet.fr

## 14.3 Services externes
- **Stripe** : Live keys (sk_live_*, pk_live_*)
- **Brevo** : SMTP (cultureconnectorg@gmail.com)
- **Resend** : API key (re_*)
- **AWS S3** : eu-west-1 (AKIA*)
- **Emergent LLM** : sk-emergent-* (Claude Sonnet)
- **hCaptcha** : ES_* secret
- **Baserow** : Token pour badges

---

# 15. CHECKLIST LANCEMENT

- [x] Stripe LIVE fonctionne (partnership, accreditation, ticket, jetons)
- [x] Auth complete (email, Google, GitHub, WebAuthn silent, identifiant)
- [x] Feed reel (zero ghost, empty state premier utilisateur)
- [x] Builder publie avec images vers Feed
- [x] Wallet KT operationnel
- [x] Shop 4 packs + marketplace
- [x] FAQ 7 questions (admin editable)
- [x] Support tickets (formulaire public + admin)
- [x] Tutoriel premiere connexion (8 etapes)
- [x] Geolocalisation posts + globe 3D
- [x] i18n 5 langues (FR, EN, ES, PT, KW)
- [x] Analytics natif (pages, clics, conversions, scroll)
- [x] FREK autorite silencieuse
- [x] Face ID / Touch ID silencieux
- [x] 75+ indexes MongoDB production
- [x] Ghost data purge (zero donnee fictive)
- [x] Rate limiter 500 req/min/IP
- [x] TTL auto-cleanup (logs 30-90j)
- [x] Empty states (feed, inbox, reels)
- [x] CORS production configure
- [x] Health check endpoint
- [x] PWA installable
- [x] Email contact@kiltikonet.fr partout
- [x] Retour site public discret depuis Espace Pro
- [x] Programme 4 jours complet
- [x] Video splash verte (1x par session)

---

*Document genere le 14 Avril 2026 — Kiltikonet CC2026 v1.0.0*
*Plateforme construite avec Emergent Agent*
