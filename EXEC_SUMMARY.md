# EXEC_SUMMARY.md — Resume Executif ITER.56
# kiltikonet.fr — Phase 8.2
# Date : 2026-04-07

## Ce qui a ete Decouvert

### Surprises
1. **Brain O(n²)** : L'historique multi-turn rejouait TOUS les messages via des appels API reels a chaque echange. C'est la cause racine combinee du budget exceeded ET de la coupure apres 3 echanges.
2. **FREK-ID = string aleatoire** : Pas un DID, pas on-chain, pas un hash. FREKcore pointe vers lui-meme. Zero blockchain.
3. **Plafond 150 EUR non enforce** : Risque reglementaire. Un utilisateur peut acheter des montants illimites sans KYC.
4. **18 collections MongoDB vides** : Creees mais jamais peuplees.
5. **Pas de wallet CC separe** : Seul le KT existe comme vrai wallet.

### Risques
1. **TW4 vs TW3** : Migration impossible. Chaque classe TW4 du ZIP doit etre traduite manuellement.
2. **TypeScript vs JSX** : Le core est en JSX pur. Les composants Omega devront etre convertis.
3. **Rate limiter agressif** : 200 req/60s bloque les tests et potentiellement les utilisateurs actifs.
4. **Budget LLM** : Le Brain est inutilisable tant que le budget n'est pas recharge.

### Manques Significatifs
- **Adhesion** : Aucun systeme — ni endpoint, ni collection, ni Stripe Subscription
- **Gouvernance** : Aucun systeme — le governance_weight existe mais n'est cable a rien
- **Trade** : Aucun systeme — zero order book
- **Terminal** : Pas d'editeur Monaco, pas de preview iframe, pas de deploiement
- **Settings** : 100% coquille vide — aucun endpoint connecte

## Conflits Resolus

| Conflit | Resolution |
|---|---|
| TW4 vs TW3 | Garder TW3. Ajouter les variables Omega dans tailwind.config.js |
| TSX vs JSX | Convertir les composants Omega en JSX |
| ProSpaceDashboard vs MonEspace | ProSpaceDashboard deviendra wrapper vers ProApp |
| BrainChat vs TerminalConsole | Fusion : UI Omega + logique backend existante |
| motion vs framer-motion | Installer `motion` (successor compatible) |

## 3 Decisions Jeton CC a Arbitrer Avant iter.58

### Decision 1 : Prix des Packs JCC
- **Question** : Quels prix pour les packs 10, 50, 100 JCC ?
- **Recommandation** : 15 EUR / 67.50 EUR / 120 EUR (avec decote volume)

### Decision 2 : Rollover CC2027
- **Question** : Les JCC non utilises sont-ils reportes ?
- **Recommandation** : OUI, avec date d'expiration CC2027+3mois

### Decision 3 : Timing Holding
- **Question** : FMS EURL ou Holding comme emetteur ?
- **Recommandation** : FMS EURL en phase 1, migration holding quand creee (changement de `legal_entity` dans les packs uniquement)

## Ordre d'Integration Recommande

### iter.57 : Scaffolding React
1. Installer les dependances (motion, react-markdown, monaco-editor)
2. Ajouter les classes CSS Omega dans tailwind.config.js + index.css
3. Creer AuthContext et WalletContext
4. Convertir les composants Omega TSX → JSX
5. Creer ProApp.jsx et brancher la route /espace-pro

### iter.58 : Backend Complet
1. Implementer les endpoints reels (remplacer les mocks skeleton_omega)
2. Creer les collections MongoDB manquantes (adhesions, gouvernance, trade, terminal_deploys)
3. Cabler les wallets CC separes
4. Implementer le plafond 150 EUR

### iter.59 : Integration UI + Tests
1. Connecter chaque composant Omega a son endpoint reel
2. Tests E2E complets
3. PWA /scan terrain

### iter.60 : Production
1. Performance (lazy loading, code splitting)
2. Deploiement production
3. Migration DNS kiltikonet.fr

## Estimation de Complexite par Module

| Module | Complexite (1-5) | Notes |
|---|---|---|
| Feed / Reels | 2 | Existant, migration UI seule |
| Wallet KT | 2 | Existant, migration UI seule |
| Wallet CC | 3 | Nouveau wallet a creer |
| Brain Chat | 3 | Fusion complexe (design + logique) |
| Shop / Marketplace | 2 | Existant, migration UI |
| DMs / Inbox | 2 | Existant, migration UI |
| Agenda | 2 | Existant (shared/planning) |
| Studio | 3 | Coquille vide a remplir |
| Terminal Console | 4 | Monaco Editor + iframe + deploiement |
| Gouvernance | 3 | Nouveau systeme complet |
| Adhesion | 4 | Nouveau + Stripe Subscriptions |
| Trade | 3 | Nouveau order book simplifie |
| NFC Scan | 2 | Simple (3 ecrans, 1 endpoint) |
| Settings | 3 | Nombreux champs a cabler |
| FREK Certification | 4 | Fingerprinting + stages + audit |
| Profil Souverain | 2 | Fusion ProfileTriptych + Omega |
| Cockpit / Analytics | 2 | Existant (smart engine) |

## Points d'Attention iter.57-60

1. **Budget LLM** : Recharger avant iter.57 pour tester le Brain corrige
2. **Rate limiter** : Augmenter le seuil ou exclure les routes /api/omega/ pendant le dev
3. **Stripe** : Les Subscriptions necessitent des Products predefinis — les creer en amont
4. **Baserow** : L'integration NFC/scan necessite l'acces API Baserow (table 865847)
5. **RGPD** : Priorite haute sur le droit a l'oubli (endpoint de suppression de compte)
