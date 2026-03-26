# CC2026 - Culture Connect 2026

## Plateforme
Application full-stack pour la gestion d'un événement culturel caribéen (accreditations, paiements, badges, PWA offline).

**Stack** : React 19 + FastAPI + MongoDB
**URLs** : 
- Preview : `https://tarifs-update.preview.emergentagent.com`
- Production : `https://kiltikonet.fr`

## Comptes
- Admin : `CC2026admin`
- Laurent (founder) : `LC2026`
- Coleen (partenariats) : `Coleen2026`
- Twina (design) : `Twina2026`

---

## Ce qui est implémenté

### ConfirmationScreen enrichi (26/03/2026)
- Combine design de paiement + badge design
- Affiche: Header coloré avec tier, carte personne, détails paiement, Badge ID (copier), FREK-ID, zones d'accès, boutons Mon Espace/Accueil/Télécharger badge
- Prix corrigés: Pro 300€, Institu 500€
- Stripe cancel_url corrigé (pointe vers /tarifs au lieu de /inscription)

### Refactoring server.py (26/03/2026)
- **server.py : 8780 → 8317 lignes** (-463 lignes)
- `routes/shared.py` : Artistes, Prestataires, Tasks, Partners, Expenses, Contacts, Planning
- `routes/terrain.py` : validate-badge, affluence, search, manual-checkin, reset-presence

### PWA Scan Staff (26/03/2026)
- `BadgeScan.jsx` migré de Baserow vers MongoDB local
- Scanner Dashboard + Validation Badge (vert/orange/rouge)

### Export PDF Badges Batch (26/03/2026)
- Workspace Twina : onglet "Export Badges PDF" avec stats et export par tier

### Smart Engine & Analytics (26/03/2026)
- Tracking automatique + Dashboard admin `/admin/analytics/site`

### Espace Coleen (26/03/2026)
- CRUD complet avec upload photo Cloudinary

### Formulaire Pro 3 étapes (26/03/2026)
- Identité → Activité pro → Objectifs & Réseautage

---

## Backlog

### P1
- Déploiement production (kiltikonet.fr)

### P2
- AWS SES sortir du sandbox
- Continuer refactoring server.py (Stripe, registrations, CMS, chat)

---

## Test Reports
- iteration_33: Smart Engine + Coleen (100%)
- iteration_34: Pricing + Registration + Upload (100%)
- iteration_35: Refactoring + Scan Staff + Export PDF (100%)
