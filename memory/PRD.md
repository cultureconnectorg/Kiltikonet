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
- Route : `/workspace/coleen` (rôle partnerships)

### Corrections précédentes
- IntroSequence : overlay vidéo corrigé (bouton Passer immédiat)
- Routes `/inscription` et `/register` retirées
- Programme : "Tropiques Atrium" remplacé par "Teyat Otonom Mawon (TOM)" dans le code

---

## Backlog priorité

### P0 - En attente
- **Formulaire Pro incomplet** : il manque les étapes (Informations personnelles → Activité professionnelle avec org, SIRET, bio, logo → Objectifs & Réseautage avec tags expertises, source CC)
- **Upload photos partenaires** : pouvoir uploader les vraies photos depuis l'espace admin
- **Upload photo à l'inscription** : les participants doivent charger leur photo lors de l'inscription

### P1 - À faire
- Catalogue vide (`/api/catalog/live` renvoie vide)
- Page Tarifs à vérifier (Pro 300€, Institu 500€)
- Cache PWA (`sw.js`) : l'utilisateur voit encore l'ancien site sur kiltikonet.fr

### P2 - Futur
- Déploiement production
- PWA App Scan Staff
- Export PDF badges batch Twina
- AWS SES (sortir du sandbox)
- Refactoring `server.py` (>8600 lignes)

---

## Architecture fichiers clés
```
/app/backend/server.py          # Monolithe backend
/app/frontend/src/App.js        # Routes + PageTracker analytics
/app/frontend/src/hooks/useAnalytics.js
/app/frontend/src/services/SmartAnalytics.js
/app/frontend/src/components/SiteAnalyticsDashboard.jsx
/app/frontend/src/components/workspaces/ColeenWorkspace.jsx
/app/frontend/src/components/ProgramPage.jsx
/app/frontend/src/components/PricingPage.jsx
/app/frontend/src/components/CatalogPage.jsx
```
