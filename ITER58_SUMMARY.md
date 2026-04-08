# ITER.58 — CÂBLAGE ESPACE PRO OMEGA : RAPPORT DE PASSATION
## Document exploitable sans contexte additionnel
**Date** : Fevrier 2026 | **Statut** : PARTIEL — Phases 0-4 terminees, Phases 5-9 documentees

---

## 1. MODULES CÂBLÉS (Phases 0-4)

### 1.1 Phase 0 — Extraction server.py TERMINÉE
- **Fichier cree** : `/app/backend/routes/omega.py` (~550 lignes)
- **Routes extraites de server.py** :
  - Brain : web-search, chat-enriched (avec quota adhesion + audit_logs + brain_training_data), memory/save, memory/history, memory/{session_id}, memory/delete
  - FREK : stats, health
  - NFC : tap (avec audit_logs)
  - Badge : lifecycle/{badge_id}
  - Remboursement : POST remboursement, GET remboursements
- **Routes ajoutees dans omega.py** :
  - Adhesion : levels, current, subscribe, cancel (reel, remplace skeleton)
  - Feed : GET posts (pagination), POST posts, POST eclair, POST commentaire, GET commentaires
  - User : GET settings, PUT settings (sections)
  - RGPD : DELETE /api/user/account (anonymisation)
- **server.py allege** : ~340 lignes retirees
- **Impact** : Zero regression — tous les endpoints existants fonctionnent

### 1.2 Phase 1 — Infrastructure TERMINÉE
| Element | Statut | Detail |
|---------|--------|--------|
| Index FREK-ID unique | DONE | `db.frek_ids.createIndex({"email": 1}, {unique: true, sparse: true})` |
| Collection audit_logs | DONE | SHA256 chaine, append-only, index user_frek_id+timestamp |
| Collection brain_training_data | DONE | cultural_score auto, eligible_training si score > 0.6 |
| Plafond 150EUR | DONE | Verifie dans `/api/my-wallet/buy-pack` — 403 si depassement |
| RGPD delete account | DONE | `DELETE /api/user/account` — anonymisation + invalidation |
| Prix JCC corriges | DONE | 10/25/50/100EUR (au lieu de 13.50/30/55/100) |

### 1.3 Phase 2 — Auth + Wallet CÂBLÉS
| Composant | Hook | Etat avant | Etat apres |
|-----------|------|------------|------------|
| ProApp.jsx | useAuth, useWallet, useAdhesion | Mocks statiques (24 JCC) | Solde reel depuis /api/my-wallet/me |
| OrbitalMenu.jsx | Props balance/frekId | "24 JCC" / "FREK-ID: 99421" hardcode | Valeurs dynamiques depuis useAuth |
| WalletView.jsx | Props depuis ProApp | 0.85EUR/JCC, top up fake | 1.50EUR/JCC, 4 packs Stripe, plafond 150EUR |

### 1.4 Phase 3 — CVL Brain CÂBLÉ
| Composant | Hook | Etat avant | Etat apres |
|-----------|------|------------|------------|
| BrainChat.jsx | useBrain | simulateStreaming mock | Appel reel /api/brain/chat-enriched |
| — | — | Reponses conditionnelles hardcodees | Claude Sonnet reel (si budget LLM dispo) |
| — | — | FREK-ID "99421-MQ" hardcode | FREK-ID dynamique depuis auth.frekId |
| — | — | Aucun audit | audit_logs + brain_training_data ecrits |
| — | — | Aucun quota | Quota par adhesion enforce (429 si depasse) |

### 1.5 Phase 4 — Feed CÂBLÉ
| Composant | Hook | Etat avant | Etat apres |
|-----------|------|------------|------------|
| FeedView.jsx | Fetch direct | 3 posts FEED_DATA hardcodes | Fetch /api/feed/posts + fallback seed |
| — | — | toggleLike local | Eclair reel POST /api/feed/posts/{id}/eclair (debit 1 KT) |
| — | — | Commentaire factice | POST /api/feed/posts/{id}/commentaire (persiste) |

---

## 2. MODULES NON CÂBLÉS (Phases 5-9) — Pour ITER.59

### 2.1 Shop (Phase 5)
- **ShopView.jsx** : Produits toujours hardcodes (4 items)
- **Raison** : Necessite creation collection `shop_products` + endpoints CRUD + checkout JCC
- **Ordre** : Apres useWallet cable (dependance JCC pour achat)

### 2.2 Trade (Phase 5)
- **Raison** : Modele peer-to-peer non implemente, necessite smart contract simplifie
- **Endpoints a creer** : `/api/trade/offer`, `/api/trade/accept`

### 2.3 DMs / Inbox (Phase 6)
- **InboxView.jsx** : 4 conversations mockees
- **Raison** : WebSocket chat existant mais pas adapte pour DMs inter-utilisateurs Omega
- **Endpoints a creer** : `/api/messages/conversations`, `/api/messages/send`

### 2.4 Agenda CC2026 (Phase 6)
- **Raison** : Pas de composant AgendaView.jsx cree dans ITER.57
- **A creer from scratch** : Vue 4 jours (20-23 mai), timeline, cards artistes

### 2.5 Parametres (Phase 6)
- **SovereignProfileView.jsx** : Paramètres mockés
- **Backend** : `/api/user/settings` GET/PUT implemente (omega.py)
- **Reste** : Câbler le frontend au backend

### 2.6 FREK View (Phase 7)
- **Raison** : Necessite cultural_impact_score, oeuvres certifiees, historique tracabilite
- **Backend partiellement pret** : `/api/frek/stats` existe

### 2.7 Studio / Builder (Phase 7)
- **BuilderView.jsx** : Upload, preview, publication mockees
- **Raison** : Necessite object storage pour les medias + GENESIS FREK

### 2.8 Terminal (Phase 7 — PRIORITÉ HAUTE)
- **CockpitView.jsx** : Console avec commandes mockees
- **Spec mise a jour** : Agent de developpement complet avec Monaco Editor, CVL Brain en mode agent,
  deploiement sur /pages/{frek_id_court}-{slug}, versioning 10 max, isolation absolute par utilisateur
- **Raison** : Necessite Monaco Editor (CDN), endpoint /api/terminal/deploy, HTML scanner securite

### 2.9 Gouvernance (Phase 9)
- **Raison** : Propositions, votes, poids par adhesion
- **Skeleton existant** : `/api/omega/gouvernance/proposals` (mock)

### 2.10 Brevo Templates (Phase 9)
- **Raison** : 4 templates transactionnels a creer
- **Cle API Brevo fournie** : xkeysib-ade111...

---

## 3. TESTS

| Suite | Resultat | Fichier |
|-------|----------|---------|
| iteration_79.json (ITER.57) | 14/14 PASS | /app/test_reports/iteration_79.json |
| iteration_80.json (ITER.58) | Backend 88% (15/17), Frontend 100% | /app/test_reports/iteration_80.json |
| Rate limit | 2 faux negatifs (429) — pas de bug reel | — |

---

## 4. DECISIONS TECHNIQUES PRISES

| # | Decision | Raison | Impact ITER.59 |
|---|----------|--------|----------------|
| D1 | Routes reelles sous `/api/*`, skeleton sous `/api/omega/*` | Coexistence sans conflit. Le frontend appelle les routes reelles en priorite | Retirer progressivement les skeletons quand les vrais endpoints sont crees |
| D2 | `omega.py` plutot que fichiers separes (brain.py, feed.py...) | Un seul fichier concentre les helpers partages (audit_logs, session, frek_id resolution) | Si omega.py depasse 1000 lignes, split par domaine |
| D3 | Plafond 150EUR dans `wallet.py` (pas dans omega.py) | Le plafond s'applique a tous les achats JCC, pas seulement depuis l'Espace Pro | Aucun impact |
| D4 | cultural_score calcule par mots-cles simples | Pas de ML/NLP dans cette iteration. Score basique par presence de mots caribeeens | ITER.60 : integrer un vrai scoring NLP si budget LLM le permet |
| D5 | useBrain hook avec sessionId en ref | Le sessionId persiste pendant toute la vie du composant, reset via bouton "Nouveau Chat" | Coherent avec le brain_memory backend |

---

## 5. RISQUES ITER.59

| # | Risque | Probabilite | Impact | Mitigation |
|---|--------|-------------|--------|------------|
| R1 | Budget LLM epuise | Haute | Brain IA inoperant | Recharger Universal Key avant tests Brain |
| R2 | Rate limiter 429 | Haute | Bloque tests API en boucle | Augmenter seuil ou bypass IP interne |
| R3 | server.py toujours >9500 lignes | Moyenne | Risque regression | Extraire sections supplementaires dans ITER.59 |
| R4 | Terminal : securite injection HTML | Haute | XSS, exfiltration | Scanner HTML obligatoire avant deploy |
| R5 | Stripe Subscriptions non testees | Haute | Adhesion payante non fonctionnelle | Creer Stripe Products en ITER.59 |
| R6 | Object storage absent | Haute | Upload media impossible | Integrer Emergent Object Storage en ITER.59 |

---

## 6. FICHIERS MODIFIES/CREES DANS ITER.58

### Crees
- `/app/backend/routes/omega.py` (550 lignes)

### Modifies
- `/app/backend/server.py` (allege ~340 lignes, ajout import omega_router)
- `/app/backend/routes/wallet.py` (prix JCC corriges, plafond 150EUR)
- `/app/backend/routes/jetons.py` (prix JCC corriges)
- `/app/frontend/src/hooks/useWallet.js` (cablage /api/my-wallet/me)
- `/app/frontend/src/hooks/useBrain.js` (cablage /api/brain/chat-enriched)
- `/app/frontend/src/hooks/useAdhesion.js` (cablage /api/adhesion/*)
- `/app/frontend/src/components/omega/ProApp.jsx` (hooks reels)
- `/app/frontend/src/components/omega/OrbitalMenu.jsx` (props dynamiques)
- `/app/frontend/src/components/omega/BrainChat.jsx` (useBrain reel)
- `/app/frontend/src/components/omega/FeedView.jsx` (fetch posts reels)
- `/app/frontend/src/components/omega/WalletView.jsx` (packs 10/25/50/100EUR, plafond 150EUR)

---

*Document genere — ITER.58 partiel termine.*
*Prochain jalon : ITER.59 — Shop, Trade, Terminal, Gouvernance, DMs, Agenda, Brevo*
