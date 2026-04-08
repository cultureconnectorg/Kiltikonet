# PRD — Kiltikonet CC2026 / Espace Pro Omega (ITER.58)

## Probleme original
Plateforme evenementielle full-stack pour Culture Connect 2026. L'ITER.58 vise a rendre les 13 composants statiques de l'Espace Pro totalement fonctionnels ("zero bouton mort") en les connectant au backend.

## Architecture
- **Frontend**: React 19, Framer Motion, Monaco Editor, Tailwind CSS
- **Backend**: FastAPI, MongoDB
- **Auth**: JWT + Magic Link bypass
- **Integrations**: Stripe (paiements), Claude Sonnet (Brain IA), Brevo (emails — a cabler)

## Ce qui est implemente (8 avril 2026)

### Phase 0 — Extraction server.py
- Routes extraites vers `/app/backend/routes/omega.py` (1800+ lignes)
- `server.py` allege

### Phase 1 — Infrastructure
- Collections immuables `audit_logs`, `brain_training_data`
- Plafond reglementaire 150EUR JCC
- Index MongoDB sparse

### Phase 2-3 — Hooks cables
- useAuth, useWallet, useBrain, useAdhesion cables
- Brain IA teste 20/20 (Francais + Creole)
- Tracking IA pour collecte de donnees d'entrainement

### Phase 4 — Feed Infini (DONE)
- Seed de 20 posts avec images, auteurs, tags
- Scroll snap vertical (IntersectionObserver)
- Bouton Eclair (debit 1 KT)
- Commentaires + Partage natif
- Creation de posts

### Phase 5 — Shop + Packs JCC (DONE)
- 4 packs JCC: Decouverte 10/10EUR, Culture 25/25EUR, Diaspora 50/50EUR, VIP 100/100EUR
- Endpoint `/api/shop/packs` + `/api/shop/products`
- Checkout Stripe (test mode)
- Marketplace avec categories

### Phase 6 — DMs (DONE)
- Conversations + Messages
- Polling 5s temps reel
- Nouvelle conversation modal
- Read receipts

### Phase 7.3 — Terminal Monaco (DONE)
- CockpitView avec Monaco Editor
- CVL Brain Agent integre (generation de code)
- Deploy HTML sandbox via `/api/terminal/deploy`
- Historique des deploiements

### Phase 7 — Agenda CC2026 (DONE)
- 4 jours (20-23 mai 2026)
- 20 evenements (concerts, conferences, ateliers, hackathon)
- Kathy-Liana Bravo confirmee 22h le 22 mai
- Detail modal par evenement

### Phase 8 — Accreditation CC2026 (DONE)
- Flux 7 etapes (Identite → Type → Paiement → Soumission → Validation → Badge → Impression)
- 6 types: PRO 300EUR, INSTITUTIONNEL 500EUR, VIP 800EUR, VISITEUR 50EUR, ARTISTE/PRESSE gratuit
- Admin validation + generation badge automatique (CC26-XXX-XXXXX)
- Badge NFC pour types premium

### PWA NFC /scan (DONE)
- Route `/scan` standalone
- Auth agent (code CC2026agent)
- 7 zones de scan
- Saisie manuelle badge_id
- Historique local des scans
- Resultat ACCES AUTORISE / REFUSE

### Gouvernance (DONE)
- 4 propositions seedees
- Votes ponderes par niveau d'adhesion (FREE=1, PRO=3, PREMIUM=5, INSTITUTIONNEL=10)
- Creation de propositions

### Parametres (DONE)
- Edition profil (nom, bio)
- Choix de langue (FR/CR/EN)
- Notifications (email, push)
- Confidentialite (profil public)
- Suppression compte RGPD

### Route /pro corrigee (DONE)
- `/pro` → OrbitalMenu Omega (fullscreen immersif)
- Ancien Espace Pro deplace vers `/admin/core` (SUPER_ADMIN only)
- Badge CC2026 dans le header orbital

## Backlog Restant

### P0 — Bloquant CC2026 (J-42)
- [ ] Accreditation: webhook Stripe pour confirmation auto du paiement
- [ ] NFC /scan: integration Baserow table 865847

### P1 — Important
- [ ] FrekView: Cultural Impact Score + historique FREK-ID
- [ ] Studio/BuilderView: Upload medias via Object Storage + certification FREK Genesis
- [ ] Trade peer-to-peer: Order book, matching, historique
- [ ] Brevo: 4 templates emails transactionnels (Accreditation, Bienvenue, Newsletter, Reset)

### P2 — Ameliorations
- [ ] Gouvernance frontend: composant GouvernanceView dans ProApp
- [ ] Documents manquants: FREK_BLOCKCHAIN_GAP.md, TRACABILITY_SCHEMA.md, etc. (10 docs)
- [ ] ITER58_SUMMARY.md final
- [ ] Deploiement production

### P3 — Futur
- [ ] PWA offline sync
- [ ] cultural_score NLP avance
- [ ] Export PDF badges batch Twina

## Donnees actives MongoDB
- feed_posts: 20 docs
- gouvernance_proposals: 4 docs
- accreditations_cc2026: 2 docs
- cc_badges: 6 docs
- kn_wallets: 6 docs
- shop_products: 19 docs

## Credentials de test
- Login: cultureconnectorg@gmail.com (Magic link bypass code: 000000)
- NFC Agent: CC2026agent
- Espace Coleen: Coleen2026
