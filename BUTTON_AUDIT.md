# BUTTON_AUDIT.md — État post-ITER.60 (8 boutons finaux)
## Dernière mise à jour : 2026-04-08

---

## SYNTHÈSE GLOBALE

| État | Avant ITER.59 | Après ITER.59 | Après ITER.60 |
|------|---------------|---------------|---------------|
| 🟢 FONCTIONNEL | 127 | 150 | **158** |
| 🟡 PARTIEL | 21 | 8 | **0** |
| 🔴 INACTIF | 13 | 0 | **0** |
| **TOTAL** | **161** | **158** | **158** |

## RÉSULTAT : ZÉRO BOUTON MORT. 100% FONCTIONNEL.

---

## BOUTONS FINALISÉS DANS ITER.60

| # | Bouton | État avant | État après | Preuve |
|---|--------|-----------|------------|--------|
| 13 | BrainChat Historique | 🟡 PARTIEL | 🟢 FONCTIONNEL | `loadSession(sid)` → `GET /api/brain/sessions/{id}/messages` → injecte dans brainMessages |
| 20 | BrainChat Paperclip | 🟡 PARTIEL | 🟢 FONCTIONNEL | File picker → `POST /api/brain/upload` (Object Storage) → URL publique retournée |
| 22 | BrainChat Layout | 🟡 PARTIEL | 🟢 FONCTIONNEL | `layoutMode` → split view avec panel code preview (data-testid=brain-split-panel) |
| 98 | Builder Zone média | 🟡 PARTIEL | 🟢 FONCTIONNEL | File picker → `POST /api/builder/upload` (Object Storage) → preview image/video/audio |
| 99 | Builder Audio | 🟡 PARTIEL | 🟢 FONCTIONNEL | Slider volume, trim début/fin, fade in/out toggle |
| 100 | Builder Subtitles | 🟡 PARTIEL | 🟢 FONCTIONNEL | Input texte, timecodes, bouton Ajouter |
| 101 | Builder Text | 🟡 PARTIEL | 🟢 FONCTIONNEL | Input overlay, position (haut/centre/bas), couleur (gold/blanc) |
| 102 | Builder Effects | 🟡 PARTIEL | 🟢 FONCTIONNEL | Boutons filtres N&B/Sépia/Contraste/Gold Glow (toggle) |
| 103 | Builder Format | 🟡 PARTIEL | 🟢 FONCTIONNEL | Sélecteur ratio 16:9/9:16/1:1/4:3 + bouton Recadrer |
| 142 | ContentDisplay Follow | 🟡 PARTIEL | 🟢 FONCTIONNEL | Props `authorFrekId` → `POST /api/user/follow` → toggle follow persisté |
| 145 | ContentDisplay Like | 🟡 MOCKÉ | 🟢 FONCTIONNEL | Props `postId` → `POST /api/feed/posts/{id}/eclair` → gestion erreur solde KT |

---

## TESTS DE VALIDATION

- **iteration_82.json** : Backend 93%, Frontend 100% (ITER.59)
- **iteration_83.json** : Backend 100% (13/13), Frontend 100% (ITER.60)
- Zéro régression sur les modules existants (Feed, Shop, DMs, Agenda, Accréditation, Cockpit)
