# KiltiKonet Smart Engine — PRD v2.0

## Vision 2026-2031
Infrastructure de données stratégique pour les marchés culturels afro-diasporiques.

## Architecture Implementée

### Phase 1 — Foundation ✅
- **Multi-tenant**: `tenant_id` ajouté à toutes les tables
- **Tenant par défaut**: `culture-connect-2026`
- **Nouvelles collections MongoDB**:
  - `matching_events` — Capture chaque recommandation
  - `territorial_flows` — Agrégation des flux entre territoires
  - `collaboration_outcomes` — Résultats business déclarés
  - `attestations` — Certifications générées
  - `tenant_config` — Configuration white-label

### Phase 2 — Intelligence API ✅
- `GET /api/v1/intelligence/territorial-flows` — Top corridors territoriaux
- `GET /api/v1/intelligence/sector-heatmap` — Matrice de connexions par secteur
- `GET /api/v1/intelligence/conversion-rates` — Taux par tranche de score
- `GET /api/v1/intelligence/emerging-markets` — Marchés sous-exploités
- `GET /api/v1/intelligence/impact` — Résumé économique global

### Phase 3 — Certification Engine ✅
- Génération d'attestations avec UUID unique
- QR code dans les PDFs avec lien de vérification
- `GET /api/v1/verify/:attestationId` — Endpoint public de vérification
- Signature numérique et horodatage

### Phase 4 — Admin Dashboard Intelligence ✅
- Nouvel onglet "Intelligence" dans Smart Engine
- 5 panels interactifs:
  - Vue d'ensemble (KPIs)
  - Flux Territoriaux
  - Heatmap Secteurs
  - Taux de Conversion
  - Marchés Émergents

## Matching Engine — Claude-Based
Au lieu d'embeddings vectoriels OpenAI, le système utilise **Claude** pour:
- Comparer sémantiquement les profils
- Générer des scores de compatibilité (0-100%)
- Produire des `matchReason` riches en français
- Identifier les genres communs et la complémentarité

**Caching**: Les résultats sont mis en cache 7 jours dans `matching_events`.

## Profils Indexés (10)
1. Tropical Sound Records (label, Martinique)
2. Afropicks Colombia (agent, Colombie)
3. Gwo Ka Studio (artist, Guadeloupe)
4. Llorona Records (label, Colombie)
5. Trace Urban Caraibes (media, Martinique)
6. Haitian Roots Foundation (institution, Haiti)
7. ZZK Records (label, Argentine)
8. Skillfor Campus Martinique (institution, Martinique)
9. Grace Torres (artist, Colombie)
10. Diaspora Prod Paris (producer, France)

## Statistiques Actuelles
- **10 profils** indexés
- **9 matching events** générés
- **6 territoires** connectés
- **83% score moyen** de compatibilité

## Stack Technique
- **Backend Smart Engine**: Node.js/Express (port 8002)
- **Backend Principal**: FastAPI Python (port 8001) — proxy vers Smart Engine
- **Frontend**: React + Tailwind CSS
- **Database**: MongoDB (multi-collection)
- **LLM**: Claude via Emergent LLM Key
- **PDF**: PDFKit + QRCode

## URLs d'Accès
- **Smart Engine**: `/smart-engine`
- **Admin Dashboard**: `/admin` → bouton "Smart Engine"
- **Vérification publique**: `/api/v1/verify/:attestationId`

## Prochaines Étapes
1. Déploiement en production
2. Configuration DNS kiltikonet.fr
3. Test avec utilisateurs réels lors de Culture Connect 2026
4. Extension white-label pour autres événements (2027+)

---
*Dernière mise à jour: 27 février 2026*
