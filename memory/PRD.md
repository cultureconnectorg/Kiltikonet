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

### Smart Engine & Analytics (26/03/2026)
- Tracking automatique de toutes les visites (page views, IP, device, referrer, session)
- Service `SmartAnalytics.js` connecté dans `App.js` via hook `useAnalytics`
- Backend `POST /api/analytics/batch` avec capture IP serveur
- Backend `GET /api/analytics/site?days=N` : dashboard complet (KPIs, trafic quotidien, top pages, devices, referrers, hourly, activité récente)
- Dashboard admin accessible via `/admin/analytics/site` + bouton "Trafic" dans la barre admin

### Espace Coleen (26/03/2026)
- Workspace fonctionnel avec CRUD complet : Partenaires (add/edit status/delete), Contacts (add/delete), Budget/Dépenses (add/delete)
- Dashboard avec pipeline partenariats, KPIs, analytics CC2026
- **Upload photos partenaires** : cliquer sur la zone photo d'un partenaire → upload Cloudinary
- Route : `/workspace/coleen` (rôle partnerships)

### Formulaire d'inscription Pro (26/03/2026)
- Routage : Visiteur → `/badge-inscription` (simplifié), Payants → `/register-pro` (3 étapes)
- **Étape 1 - Identité** : Nom complet*, Email*, Téléphone*, Pays*
- **Étape 2 - Activité professionnelle** : Organisation*, Type de profil*, SIRET (opt), Site web (opt), Bio/Description du projet*, Upload logo/photo (Cloudinary), Stand request (oui/non)
- **Étape 3 - Objectifs & Réseautage** : Expertise tags (max 5), Comment connu CC*, RGPD*, Récapitulatif, Bouton paiement avec prix correct

### Tarifs corrigés (26/03/2026)
- Visiteur : Gratuit, Émergent : 50€, Professionnel : 300€ (Populaire), Institutionnel : 500€
- Prix correctement reflétés dans PricingPage.jsx ET RegistrationForm.jsx

### Cache PWA (26/03/2026)
- Version cache mise à jour : `cc2026-v3.0` dans `sw.js`

### Corrections précédentes
- IntroSequence : overlay vidéo corrigé
- Routes `/inscription` et `/register` → redirigent vers /tarifs
- Programme : "Tropiques Atrium" → "Teyat Otonom Mawon (TOM)"
- Header : pas de lien "Inscription" (Accueil, Programme, Concert, Tarifs, Partenariat, Jetons, Catalogue)

---

## Backlog priorité

### P1 - À faire
- Catalogue : actuellement vide car 0 inscriptions approuvées (normal, pas de bug). Se remplira automatiquement.

### P2 - Futur
- Déploiement production (kiltikonet.fr)
- AWS SES (sortir du sandbox pour emails)
- Refactoring `server.py` (>8600 lignes)
- PWA App Scan Staff (tests terrain)
- Export PDF badges batch Twina (J-15)

---

## Architecture fichiers clés
```
/app/backend/server.py          # Monolithe backend (~8770 lignes)
/app/frontend/src/App.js        # Routes + PageTracker analytics
/app/frontend/src/hooks/useAnalytics.js
/app/frontend/src/services/SmartAnalytics.js
/app/frontend/src/components/SiteAnalyticsDashboard.jsx
/app/frontend/src/components/workspaces/ColeenWorkspace.jsx
/app/frontend/src/components/PricingPage.jsx
/app/frontend/src/components/RegistrationForm.jsx
/app/frontend/src/components/BadgeInscription.jsx
/app/frontend/src/components/ProgramPage.jsx
/app/frontend/src/components/CatalogPage.jsx
/app/frontend/public/sw.js
```

## Test Reports
- `/app/test_reports/iteration_33.json` — Smart Engine + Coleen (100%)
- `/app/test_reports/iteration_34.json` — Pricing + Registration + Upload (100%)
