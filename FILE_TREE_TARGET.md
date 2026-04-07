# FILE_TREE_TARGET.md — Arbre de Fichiers Cible post-iter.60
# kiltikonet.fr — ITER.56 Phase 7.1
# Date : 2026-04-07

## Structure Cible

```
src/
  components/
    omega/                       ← Composants Omega (Espace Pro v2)
      Background.jsx             ← Fond orbital visuel avec animations
      OrbitalMenu.jsx            ← Menu orbital (remplace sidebar)
      ContentDisplay.jsx         ← Container adaptatif pour affichage du contenu
      BrainChat.jsx              ← Chat CVL Brain fusionne (design Omega + outils existants + creole corrige)
      BuilderView.jsx            ← Editeur HTML/terminal avec Monaco Editor
      FeedView.jsx               ← Feed social avec Eclairs
      WalletView.jsx             ← Wallet KT + CC avec historique
      ShopView.jsx               ← Boutique/Marketplace
      ReseauView.jsx             ← DMs / Messagerie directe
      AgendaView.jsx             ← Agenda CC2026
      StudioView.jsx             ← Upload et gestion de contenu
      TerminalView.jsx           ← Console deploiement HTML
      GouvernanceView.jsx        ← Propositions + votes
      AdhesionView.jsx           ← Niveaux + abonnement
      ParametresView.jsx         ← Parametres utilisateur complets
      FrekView.jsx               ← Certification FREK-ID + oeuvres
      CockpitView.jsx            ← Dashboard analytique personnel
      SovereignProfileView.jsx   ← Profil complet (remplace ProfileTriptych)
    pro/                         ← Composants Pro existants (gardes pour compat)
      ProfileTriptych.jsx        ← Ancien profil (coexiste temporairement)
      WalletPage.jsx             ← Ancien wallet (coexiste temporairement)
      ReelsFeed.jsx              ← Ancien reels (coexiste temporairement)
      InboxPage.jsx              ← Ancien inbox (coexiste temporairement)
      SovereignSections.jsx      ← Sections existantes (settings, messages)
      TradingSettings.jsx        ← Trading placeholder existant
    (composants publics existants restent inchanges)
    Header.jsx                   ← Inchange
    Footer.jsx                   ← Inchange
    IntroSequence.jsx            ← Inchange
    PricingPage.jsx              ← Inchange
    ProgrammePage.jsx            ← Inchange
    CatalogPage.jsx              ← Inchange
    ProSpaceDashboard.jsx        ← EXISTANT — deviendra un wrapper vers ProApp.jsx

  pages/
    ProApp.jsx                   ← EspaceProApp (ex App.tsx du ZIP adapte)
    ScanApp.jsx                  ← Mini-app NFC terrain (/scan)

  types/
    omega.ts                     ← Toutes les interfaces TypeScript (reference)

  hooks/
    useAuth.js                   ← Auth context + session + doctrine
    useWallet.js                 ← Wallet KT + CC
    useFeed.js                   ← Feed social
    useBrain.js                  ← CVL Brain chat
    useNFC.js                    ← Scanner NFC/QR
    useShop.js                   ← Boutique/Marketplace
    useTrade.js                  ← Trading P2P
    useAdhesion.js               ← Niveaux adhesion
    useGouvernance.js            ← Votes et propositions
    useTerminal.js               ← Deploiement HTML
    useFrek.js                   ← Certification FREK-ID
    useSettings.js               ← Parametres utilisateur

  services/
    api.js                       ← Existant (BASE_URL, axios config)
    apiOmega.js                  ← Nouveaux endpoints Omega

  contexts/
    AuthContext.jsx              ← NOUVEAU — Context global auth + doctrine
    WalletContext.jsx            ← NOUVEAU — Context wallet

  App.js                         ← Routes publiques (inchange)
  index.js                       ← Entry point (inchange)
  index.css                      ← + Classes Omega (glass, animate-orbit, etc.)

backend/
  routes/
    doctrine.py                  ← Existant
    wallet.py                    ← Existant
    fintech.py                   ← Existant
    brain.py                     ← Existant + fix creole + fix coupure
    pro_feed.py                  ← Existant
    pro_social.py                ← Existant
    shop_payments.py             ← Existant
    ghost_profiles.py            ← Existant
    smart_engine.py              ← Existant
    analytics.py                 ← Existant
    shared_data.py               ← Existant
    skeleton_omega.py            ← NOUVEAU — Squelettes additifs (adhesion, gouvernance, trade, terminal, settings, frek certify)
    nfc_scan.py                  ← NOUVEAU — App scan terrain
  services/
    cvl_brain_knowledge.py       ← Existant + fix creole
    frek_client.py               ← Existant
  server.py                      ← Existant (monolithe, include skeleton_omega router)
```

## Strategie d'Integration

### iter.57 : Scaffolding
- Creer les fichiers `omega/` vides avec imports
- Creer `ProApp.jsx` et `AuthContext.jsx`
- Installer les dependances (motion, react-markdown, monaco-editor)
- Brancher les routes `/espace-pro` vers `ProApp`

### iter.58 : Cablage Backend
- Implementer les endpoints manquants (adhesion, gouvernance, trade, terminal, settings)
- Connecter chaque composant Omega a son endpoint

### iter.59 : Integration UI
- Fusionner les designs (couleurs, typo, animations)
- Tester chaque section

### iter.60 : Polish + Production
- Tests E2E complets
- Performance (lazy loading, code splitting)
- Deploiement production
