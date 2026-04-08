# BUTTON_AUDIT.md — État post-ITER.59
## Dernière mise à jour : 2026-04-08

---

## SYNTHÈSE GLOBALE

| État | Avant ITER.59 | Après ITER.59 |
|------|---------------|---------------|
| 🟢 FONCTIONNEL | 127 | 150 |
| 🟡 PARTIEL (onClick existe, logique incomplète) | 21 | 8 |
| 🔴 INACTIF (aucun onClick) | 13 | 0 |
| **TOTAL** | **161** | **158** *(3 boutons fusionnés dans la refonte BuilderView)* |

**Résultat ITER.59 : 0 bouton inactif restant. 8 boutons partiellement câblés.**

---

## BOUTONS RESTANTS À FINALISER POUR ITER.60

*Seuls les boutons qui ne sont PAS encore 🟢 FONCTIONNEL à 100%.*

---

### BrainChat.jsx — 3 boutons partiels

| # | Bouton | État ITER.58 | État ITER.59 | Problème exact | Action ITER.60 |
|---|--------|-------------|-------------|----------------|----------------|
| 13 | Historique items (sidebar) | 🔴 INACTIF | 🟡 PARTIEL | `GET /api/brain/sessions` est appelé et la liste s'affiche. MAIS le `onClick` sur chaque session est `() => { /* Load session via reset + reload */ }` — commentaire placeholder, aucune logique de chargement. | Implémenter : `onClick → reset() + fetch /api/brain/sessions/{id}/messages → injecter dans brainMessages` |
| 20 | Paperclip (footer) | 🔴 INACTIF | 🟡 PARTIEL | `fileInputRef.current?.click()` ouvre le file picker. Le `onChange` ajoute `[Fichier: nom]` en texte dans l'input. Aucun upload réel vers le backend. | Implémenter : `POST /api/brain/upload` (multipart) → retourner l'URL du fichier → l'inclure dans le contexte du message Brain. |
| 22 | Layout (footer) | 🔴 INACTIF | 🟡 PARTIEL | `setLayoutMode('split'/'default')` toggle le state. MAIS `layoutMode` n'est jamais lu dans le JSX pour changer l'affichage. Le layout reste identique quel que soit le toggle. | Implémenter : Quand `layoutMode === 'split'`, diviser la vue en 2 colonnes (chat à gauche, code preview à droite). Ou supprimer le bouton si non pertinent. |

---

### BuilderView.jsx — 3 boutons partiels

| # | Bouton | État ITER.58 | État ITER.59 | Problème exact | Action ITER.60 |
|---|--------|-------------|-------------|----------------|----------------|
| 98 | Zone média (upload) | 🟡 MOCKÉ | 🟡 PARTIEL | `fileInputRef.current?.click()` ouvre le file picker natif. `onChange` fait `setMediaLoaded(true)`. Le fichier sélectionné n'est PAS uploadé vers un Object Storage ni sauvegardé en base. Le `media_url` du projet reste vide. | Implémenter : upload vers Object Storage via `POST /api/builder/upload` → stocker l'URL retournée → `PUT /api/builder/projects/{id}` avec `media_url`. |
| 99-103 | 5 outils Studio (Audio, Subtitles, Text, Effects, Format) | 🟡 MOCKÉ | 🟡 PARTIEL | Les boutons togglent correctement le panel actif. Chaque panel affiche des labels contextuels (Volume, Trim, Fade In, etc.). MAIS ces labels sont des `<div>` statiques sans aucune interactivité — pas de sliders, pas d'inputs, pas de logique métier. | Implémenter : Ajouter des contrôles fonctionnels (range sliders, inputs) dans chaque panel, ou au minimum transformer les labels en boutons qui appliquent un effet (même si l'effet est simulé côté frontend en attendant un vrai pipeline média). |

---

### ContentDisplay.jsx — 2 boutons partiels

| # | Bouton | État ITER.58 | État ITER.59 | Problème exact | Action ITER.60 |
|---|--------|-------------|-------------|----------------|----------------|
| 142 | Follow/Following | 🟡 MOCKÉ | 🟡 PARTIEL | `POST /api/user/follow` est bien appelé. MAIS le `target_frek_id` est hardcodé à `'content-author-frek'` (ligne 30). Ce frek_id fictif n'existe dans aucune base. Le follow est persisté en base mais sur une cible inexistante. | Fix : ContentDisplay doit recevoir le `frek_id` réel de l'auteur du contenu affiché via props (`authorFrekId`), et l'utiliser dans le body de la requête. |
| 145 | Like / Éclair (Bolt) | 🟡 MOCKÉ | 🟡 MOCKÉ | `handleLike` (lignes 14-20) : toggle local `isLiked` + incrément/décrément `likesCount`. Le `try/catch` est VIDE — commentaire `// Eclair uses FeedView eclair endpoint pattern` mais aucun appel API. Le compteur `42800` est hardcodé. | Fix : Appeler `POST /api/feed/posts/{post_id}/eclair` avec le vrai `post_id` du contenu affiché. Recevoir le `post_id` via props. |

---

## BOUTONS CONFIRMÉS 🟢 APRÈS ITER.59

*Tous les autres boutons du BUTTON_AUDIT original sont maintenant 🟢 FONCTIONNEL.*

### Confirmés dans cette itération (34 boutons passés de 🔴/🟡 à 🟢) :

| Vue | Boutons confirmés 🟢 | Preuve |
|-----|----------------------|--------|
| BrainChat | #14 Activité Récente, #19 Copier code, #21 Globe | `fetch /api/brain/activity`, `navigator.clipboard.writeText()`, `setUseWeb()` passé à `send()` |
| WalletView | #38 Confirmer l'envoi, #39 Exécuter le Swap | `POST /api/wallet/transfer`, `POST /api/wallet/swap` |
| BuilderView | #92 NOUVEAU PROJET, #93 Filtrer, #94 Cartes projets, #96 Titre, #97 Save, #104 Description, #105 CERTIFIER (nav), #106 PUBLIER (nav), #107 SOUMETTRE AU WORKSHOP, #108-110 Canaux radio, #111 PUBLIER MAINTENANT, #112 Analytics | `POST /api/builder/projects`, dropdown filtre, `GET /api/builder/projects`, auto-save `PUT`, `POST /api/frek/certify`, `setPublishCanal()` avec état visuel, `POST /api/builder/publish`, `GET /api/builder/analytics` |
| ContentDisplay | #148 More (3 points) | Menu contextuel animé : Signaler / Partager / Copier lien |

---

## VERDICT ITER.60

**8 boutons à finaliser. 0 bouton mort.**

| Priorité | Boutons | Effort estimé |
|----------|---------|---------------|
| HAUTE | #142 Follow (fix frek_id), #145 Like (fix API call) | 15 min — juste passer les bons props |
| HAUTE | #13 Historique Brain (charger session) | 30 min — endpoint GET messages + inject |
| MOYENNE | #20 Paperclip (upload réel) | 45 min — Object Storage + endpoint |
| MOYENNE | #98 Zone média (upload réel) | 30 min — même pipeline que #20 |
| BASSE | #22 Layout (split view) | 20 min — CSS conditionnel |
| BASSE | #99-103 Outils studio (contrôles) | 45 min — sliders/inputs dans chaque panel |
