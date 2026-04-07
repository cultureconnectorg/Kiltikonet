# CORE_SNAPSHOT.md — Arbre de Dependances React Complet
# kiltikonet.fr — ITER.56 Phase 1.1
# Date : 2026-04-07

## 1. Composants Principaux (Pages / Entrypoints)

### App.js (`/frontend/src/App.js`)
- **Parent** : `index.js`
- **Exporte** : `<App />` (default)
- **Imports internes** : `Header`, `Footer`, `IntroSequence`, `ProSpaceDashboard`, `PricingPage`, `ProgrammePage`, `CatalogPage`, `AboutPage`, `PartnersPage`, `BadgeActivation`, `SmartAnalytics`, `FAQ`, `Contact`, `CGV`, `PolitiqueConfidentialite`, `MentionsLegales`
- **Endpoints consommes** : Aucun directement (deleguee aux composants enfants)
- **State** : React Router v7, pas de contexte global (chaque page gere son propre state)
- **Routes** : `/`, `/tarifs`, `/programme`, `/catalogue`, `/partenaires`, `/a-propos`, `/faq`, `/contact`, `/espace-pro`, `/cgv`, `/politique-confidentialite`, `/mentions-legales`, `/activer-badge/:token`, `/analytics`

### ProSpaceDashboard.jsx (`/frontend/src/components/ProSpaceDashboard.jsx`)
- **Parent** : `App.js` (route `/espace-pro`)
- **Exporte** : `<ProSpaceDashboard />` (default)
- **Imports internes** : `ProfileTriptych`, `WalletPage`, `ReelsFeed`, `InboxPage`, `SettingsPage`, `TerminalConsole`, `StudioPage`, `VitrinePage`, `FeedPage`
- **Endpoints** : `POST /api/pro/request-access`, `POST /api/pro/verify-code`, `GET /api/auth/me`, `GET /api/doctrine/my-permissions`
- **State local** : `session`, `activeSection`, `doctrine`, `showLoginModal`
- **Contexte global** : Aucun (tout passe par props aux enfants)
- **Sections (14 onglets)** : feed, reels, wallet, inbox, profil, parametres, terminal, studio, vitrine, reseau, shop, trading, governance, archives

## 2. Composants Pro (Espace Pro — `/frontend/src/components/pro/`)

| Fichier | Parent | Endpoints | State |
|---|---|---|---|
| `ProfileTriptych.jsx` | ProSpaceDashboard | Inline (session props) | doctrine.can[], doctrine.receives[] |
| `WalletPage.jsx` | ProSpaceDashboard | `GET /api/my-wallet/me`, `GET /api/my-wallet/history`, `POST /api/my-wallet/buy-pack`, `POST /api/my-wallet/transfer` | solde, transactions, showModal |
| `ReelsFeed.jsx` | ProSpaceDashboard | `GET /api/pro/feed/reels` | reels, activeIndex |
| `InboxPage.jsx` | ProSpaceDashboard | `GET /api/pro/messages/{profile_id}`, `POST /api/pro/messages/send`, `POST /api/pro/messages/read` | conversations, activeConv |
| `SettingsPage.jsx` | ProSpaceDashboard | Aucun (coquille vide) | Hardcoded placeholders |
| `TerminalConsole.jsx` | ProSpaceDashboard | `POST /api/brain/chat` | messages, sessionId, input |
| `StudioPage.jsx` | ProSpaceDashboard | Aucun (coquille vide) | tabs |
| `VitrinePage.jsx` | ProSpaceDashboard | Aucun (coquille vide) | mode |
| `FeedPage.jsx` | ProSpaceDashboard | `GET /api/pro/feed` | posts |

## 3. Composants Publics (`/frontend/src/components/`)

| Fichier | Parent | Endpoints | Statut |
|---|---|---|---|
| `Header.jsx` | App.js | Aucun | ACTIF |
| `Footer.jsx` | App.js | Aucun | ACTIF |
| `IntroSequence.jsx` | App.js | Aucun | ACTIF (video overlay) |
| `PricingPage.jsx` | App.js | Aucun (hardcode) | ACTIF |
| `ProgrammePage.jsx` | App.js | `GET /api/shared/planning` | ACTIF |
| `CatalogPage.jsx` | App.js | `GET /api/catalog/live` | ACTIF |
| `AboutPage.jsx` | App.js | Aucun | ACTIF |
| `PartnersPage.jsx` | App.js | Aucun (hardcode) | ACTIF |
| `FAQ.jsx` | App.js | Aucun | ACTIF |
| `Contact.jsx` | App.js | Aucun | ACTIF |
| `BadgeActivation.jsx` | App.js | `GET /api/activer-badge/{token}` | ACTIF |

## 4. Composants Admin/Dashboard (`/frontend/src/components/`)

| Fichier | Parent | Endpoints |
|---|---|---|
| `AIAgentsDashboard.jsx` | App.js | `/api/brain/*`, `/api/smart-engine/*` |
| `SmartAnalytics.js` | App.js | `/api/analytics/site-stats`, `/api/analytics/site` |
| `AdminDashboard.jsx` | Route admin | `/api/registrations`, `/api/catalog`, `/api/stats/*` |
| `RegistrationForm.jsx` | Routes publiques | `POST /api/create-checkout-session` |

## 5. Services (`/frontend/src/services/`)

| Fichier | Utilise par |
|---|---|
| `SmartEngineService.js` | SmartAnalytics, AIAgentsDashboard |
| `api.js` (si present) | Composants divers |

## 6. Composants Orphelins Identifies

- `StudioPage.jsx` : 3 onglets hardcodes mais aucune fonctionnalite reelle
- `VitrinePage.jsx` : Affiche un placeholder statique
- `SettingsPage.jsx` : Formulaire non connecte a un endpoint

## 7. Doublons Potentiels avec ZIP Omega

| Composant Emergent | Composant ZIP Omega | Conflit |
|---|---|---|
| `ProSpaceDashboard.jsx` | `MonEspace.tsx` | CONFLIT — les 2 sont le layout principal de l'Espace Pro |
| `TerminalConsole.jsx` | `BrainChat.tsx` | CONFLIT — les 2 gerent le chat CVL Brain |
| `WalletPage.jsx` | `WalletView.tsx` | CONFLIT — les 2 affichent le wallet |
| `FeedPage.jsx` | `FeedView.tsx` | CONFLIT — les 2 affichent le feed |
| `InboxPage.jsx` | `InboxView.tsx` | CONFLIT — les 2 gerent la messagerie |
| `VitrinePage.jsx` | `ShopView.tsx` | CONFLIT — les 2 gèrent le shop |
| Aucun equivalent | `Background.tsx` | NOUVEAU — fond orbital visuel |
| Aucun equivalent | `OrbitalMenu.tsx` | NOUVEAU — menu orbital (remplace sidebar classique) |
| Aucun equivalent | `ContentDisplay.tsx` | NOUVEAU — container d'affichage adaptatif |
| Aucun equivalent | `BuilderView.tsx` | NOUVEAU — editeur de contenu/terminal |
| Aucun equivalent | `CockpitView.tsx` | NOUVEAU — cockpit/dashboard analytique |
| Aucun equivalent | `SovereignProfileView.tsx` | PARTIEL — plus riche que ProfileTriptych |
| `Header.jsx` | `Layout.tsx` | CONFLIT PARTIEL — Layout.tsx inclut un header/nav |

## 8. Architecture State Management

- **Pas de contexte global React** (pas de Redux, pas de Zustand, pas de Context API)
- **State local uniquement** : Chaque composant gere ses propres `useState`
- **Auth** : Session cookie httpOnly (`kk_session`), pas de token en localStorage
- **Pattern** : Fetch dans `useEffect` → state local → props drilling vers enfants
- **Impact** : Pour integrer Omega, il faudra soit :
  a) Continuer le props drilling (simple mais fragile)
  b) Introduire un `AuthContext` minimal pour partager session/doctrine (recommande)
