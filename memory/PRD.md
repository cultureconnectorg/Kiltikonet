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

### Refactoring server.py (26/03/2026)
- **server.py : 8780 → 8317 lignes** (-463 lignes)
- `routes/shared.py` : Artistes, Prestataires, Tasks, Partners, Expenses, Contacts, Planning (CRUD complet)
- `routes/terrain.py` : validate-badge, affluence, search, manual-checkin, reset-presence
- Routes existantes : `routes/analytics.py`, `routes/badges.py`, `routes/jetons.py`, `routes/ses.py`

### PWA Scan Staff (26/03/2026)
- `BadgeScan.jsx` migré de Baserow vers MongoDB local
- **Scanner Dashboard** (`/badge-scan`) : Affluence en temps réel, recherche participant, check-in manuel, instructions
- **Validation Badge** (`/badge/{id}`) : Vérifie le badge, affiche BIENVENUE (vert) / DEJA SCANNE (orange) / INVALIDE (rouge)
- Zones d'accès affichées : Parc La Savane, Teyat Otonom Mawon, Espace Pro

### Export PDF Badges Batch (26/03/2026)
- Backend `GET /api/badges/export-pdf-batch?tier=X` : Génère PDF multi-pages (4 badges A6 par page A4)
- Backend `GET /api/badges/export-pdf-single/{id}` : Badge individuel
- Backend `GET /api/badges/export-stats` : Statistiques par tier
- **Workspace Twina** : Onglet "Export Badges PDF" avec stats et boutons d'export par catégorie

### Smart Engine & Analytics (26/03/2026)
- Tracking automatique (page views, IP, device, referrer, session)
- Dashboard admin `/admin/analytics/site` + bouton "Trafic" dans la barre admin
- Endpoint `GET /api/analytics/site?days=N`

### Espace Coleen (26/03/2026)
- CRUD complet : Partenaires (avec upload photo Cloudinary), Contacts, Budget
- Dashboard avec pipeline partenariats

### Formulaire Pro 3 étapes (26/03/2026)
- Identité → Activité pro (org, SIRET, bio, logo upload) → Objectifs (tags, RGPD)
- Tarifs : Gratuit / 50€ / 300€ / 500€

### Cache PWA (26/03/2026)
- Version cache : `cc2026-v3.0`

---

## Backlog

### P1 - À faire
- Catalogue : 0 inscriptions approuvées (normal, pas de bug)
- Déploiement production (kiltikonet.fr)

### P2 - Futur
- AWS SES sortir du sandbox
- Continuer refactoring server.py (Stripe, registrations, CMS, chat/WebSocket)

---

## Architecture fichiers
```
/app/backend/
  server.py          # Backend principal (~8317 lignes)
  routes/
    analytics.py     # Analytics events
    badges.py        # Badge system (FREKcore)
    jetons.py        # Jetons/tokens
    ses.py           # Email SES
    shared.py        # NEW: Partners, contacts, expenses, tasks, planning, artistes, prestataires
    terrain.py       # NEW: Badge scan, affluence, search, check-in
  services/
    baserow_service.py
    frek_client.py
    ses_service.py

/app/frontend/src/
  App.js
  components/
    BadgeScan.jsx           # REWRITTEN: PWA Scanner Staff
    SiteAnalyticsDashboard.jsx
    PricingPage.jsx
    RegistrationForm.jsx
    workspaces/
      ColeenWorkspace.jsx   # CRUD + photo upload
      WorkspaceTwina.jsx    # CMS + Export PDF
```

## Test Reports
- iteration_33: Smart Engine + Coleen (100%)
- iteration_34: Pricing + Registration + Upload (100%)
- iteration_35: Refactoring + Scan Staff + Export PDF (100%)
