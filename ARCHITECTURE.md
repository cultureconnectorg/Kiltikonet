# Architecture — Kiltikonet CC2026

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 19 + Tailwind CSS + Framer Motion                    │
│                                                              │
│  /pro → ProApp.jsx → OrbitalMenu.jsx                        │
│    ├── BrainChat.jsx      (IA culturelle Claude)            │
│    ├── WalletView.jsx     (KT + JCC)                        │
│    ├── FeedView.jsx       (Feed social)                      │
│    ├── ShopView.jsx       (Packs JCC, marketplace)          │
│    ├── InboxView.jsx      (Messages directs)                │
│    ├── BuilderView.jsx    (Studio création + caméra)        │
│    ├── CockpitView.jsx    (Terminal + Santé + CC2026 Admin) │
│    ├── AgendaView.jsx     (Programme événement)             │
│    └── AccreditationView  (Badges CC2026)                   │
│                                                              │
│  /admin/core → ProSpaceDashboard.jsx (admin/founder)        │
│  /scan → ScannerView (agents terrain NFC)                   │
│  / → Vitrine publique (pages statiques)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS /api/*
┌──────────────────────────▼──────────────────────────────────┐
│                        BACKEND                               │
│  FastAPI + Motor (async MongoDB)                             │
│                                                              │
│  server.py (monolithe ~9800 lignes)                          │
│  + routes/                                                   │
│    ├── webauthn.py            (Face ID / Touch ID)           │
│    ├── push_notifications.py  (Web Push API)                 │
│    ├── admin_cc2026.py        (Dashboard + Users + Modér.)   │
│    ├── pro_feed.py            (Feed social + Éclair KT)      │
│    ├── pro_social.py          (Interactions sociales)        │
│    ├── omega.py               (Modules Omega CRUD)           │
│    └── doctrine.py            (Gouvernance)                  │
│  + services/                                                 │
│    ├── object_storage.py      (Emergent Object Storage)      │
│    └── brevo_templates.py     (Templates email HTML)         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                       MONGODB                                │
│                                                              │
│  Collections principales :                                   │
│  ├── kn_profiles         (utilisateurs, FREK-ID, rôle)      │
│  ├── kn_wallets          (balance_kt, balance_jcc)          │
│  ├── cc_badges           (badges CC2026, NFC, statut)       │
│  ├── pro_posts           (feed social, éclairs, reports)    │
│  ├── conversations       (messages directs)                  │
│  ├── messages             (contenu des messages)             │
│  ├── brain_sessions      (historique IA)                     │
│  ├── brain_messages      (messages IA)                       │
│  ├── terminal_projects   (projets code)                      │
│  ├── builder_projects    (projets créatifs)                  │
│  ├── audit_logs          (journal d'audit complet)           │
│  ├── stripe_payments     (paiements Stripe)                  │
│  ├── jcc_transactions    (mouvements JCC)                    │
│  ├── webauthn_credentials (clés biométriques)               │
│  ├── push_subscriptions  (abonnements push)                  │
│  ├── push_preferences    (préférences notification)          │
│  ├── analytics_events    (tracking frontend)                 │
│  ├── adhesions           (FREE/PRO/PREMIUM/INSTIT)          │
│  └── gouvernance_votes   (votes communautaires)              │
└─────────────────────────────────────────────────────────────┘
```

## Services externes

| Service | Usage | Authentification |
|---------|-------|------------------|
| **Stripe** | Paiements JCC + badges CC2026 | `sk_live_*` / webhook `whsec_*` |
| **Brevo** | Emails transactionnels (4 templates) | API Key |
| **Anthropic Claude** | CVL Brain (IA culturelle) | Emergent LLM Key |
| **Emergent Object Storage** | Upload médias (images, vidéos, audio) | Emergent LLM Key |
| **Baserow** | Sync NFC badges (table 865847) | API Key |
| **WebAuthn** | Face ID / Touch ID (py_webauthn + @simplewebauthn/browser) | VAPID keys |
| **Web Push** | Notifications push (pywebpush) | VAPID keys |
| **Google OAuth** | Connexion sociale | Client ID/Secret |

## Flux de données principaux

### 1. Inscription → Onboarding
```
Formulaire → POST /api/auth/register → kn_profiles (FREK-ID auto)
→ kn_wallets (10 KT bienvenue) → Brevo email bienvenue
→ Redirect /pro → SplashScreen → Modal bienvenue
```

### 2. Achat JCC
```
ShopView → POST /api/wallet/buy-jcc → Stripe Checkout
→ Webhook /api/wallet/webhook → jcc_transactions + kn_wallets
→ Brevo email confirmation → Push notification WALLET_CREDIT
```

### 3. Éclair KT (Feed)
```
FeedView → POST /api/pro/feed/posts/:id/eclair
→ kn_wallets (débit -1 KT caller, crédit +1 KT auteur)
→ audit_logs FEED_ECLAIR → Push notification → auteur du post
```

### 4. Scan NFC (Terrain)
```
/scan → QR scan → POST /api/scan/verify → cc_badges statut
→ Baserow sync → audit_logs NFC_SCAN → Confirmation verte
```

## Responsive (3 breakpoints)

| Breakpoint | Taille | Comportement |
|------------|--------|--------------|
| Mobile | < 768px | Défaut, plein écran, tabs |
| Tablette | md: 768px | Grille 2 colonnes (feed) |
| Desktop | lg: 1024px+ | Split views, panels latéraux, sidebar |
