"""
Phase 2 — Nettoyage sélectif MongoDB : Culture Connect 2026
Exécute les suppressions validées par l'utilisateur.
Backup effectué dans : /app/backend/scripts/mongodb_backup_pre_phase2/
"""

import re
from datetime import datetime, timezone
from pymongo import MongoClient

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "culture_connect_2026"

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

results = {}

def clean(collection_name, filter_query, description):
    """Supprime les documents correspondant au filtre et enregistre le résultat."""
    before = db[collection_name].count_documents({})
    deleted = db[collection_name].delete_many(filter_query)
    after = db[collection_name].count_documents({})
    results[collection_name] = {
        "before": before,
        "deleted": deleted.deleted_count,
        "after": after,
        "description": description
    }
    print(f"  [{collection_name}] {before} → {after} ({deleted.deleted_count} supprimés) — {description}")

def drop_all(collection_name, description):
    """Supprime TOUS les documents d'une collection."""
    before = db[collection_name].count_documents({})
    deleted = db[collection_name].delete_many({})
    results[collection_name] = {
        "before": before,
        "deleted": deleted.deleted_count,
        "after": 0,
        "description": description
    }
    print(f"  [{collection_name}] {before} → 0 ({deleted.deleted_count} supprimés) — {description}")


print("=" * 70)
print("  PHASE 2 — NETTOYAGE SÉLECTIF MongoDB")
print(f"  {datetime.now(timezone.utc).isoformat()}")
print("=" * 70)
print()

# ═══════════════════════════════════════════════════════════════
# 1. COLLECTIONS À VIDER ENTIÈREMENT
# ═══════════════════════════════════════════════════════════════
print("--- Collections à vider entièrement ---")

drop_all("ghost_profiles_v2", "4000 profils ghost gv2_*")
drop_all("ghost_profiles", "20 profils ghost v1")
drop_all("candidatures_cc2026", "18 candidatures test")
drop_all("cc_scans", "27 scans liés à des badges test")
drop_all("cc_remboursements", "3 remboursements test")
drop_all("contacts", "4 contacts test")
drop_all("artistes", "2 artistes test (TEST_Persistence, TEST_Update)")
drop_all("shared_tasks", "2 tâches test")
drop_all("cms_pages", "1 page test")
drop_all("pro_opportunities", "1 opportunité test")
drop_all("deleted_accounts", "1 compte supprimé test")
drop_all("pro_messages", "6 messages test")
drop_all("cultural_reactions", "19 réactions test")
drop_all("jetons_transactions", "7 transactions jetons test")

print()

# ═══════════════════════════════════════════════════════════════
# 2. PRO_POSTS — Supprimer tous les posts ghost/test
# ═══════════════════════════════════════════════════════════════
print("--- pro_posts (suppression ghost + test) ---")

clean("pro_posts", {
    "$or": [
        {"author_id": {"$regex": "^gv2_", "$options": "i"}},
        {"author_id": {"$regex": "ghost", "$options": "i"}},
        {"content": {"$regex": "^Test post", "$options": "i"}},
        {"content": {"$regex": "^test_", "$options": "i"}},
    ]
}, "Posts d'auteurs ghost (gv2_*, ghost_*) et posts test")

print()

# ═══════════════════════════════════════════════════════════════
# 3. CC_BADGES — Supprimer les 71 badges test, garder les 6 réels
# ═══════════════════════════════════════════════════════════════
print("--- cc_badges (garder 6 réels) ---")

REAL_BADGE_EMAILS = [
    "factorymaker.records@gmai.com",
    "k@ff.fr",
    "reg@dfs.Fr",
    "gre@fd.f",
    "alirio.ardenne@cvln.fr",
    "laurent.coeurolan@cvln.fr",
]

clean("cc_badges", {
    "email": {"$nin": REAL_BADGE_EMAILS}
}, "Badges test (garder 6 emails réels)")

print()

# ═══════════════════════════════════════════════════════════════
# 4. REGISTRATIONS — Garder admin-bypass + securite_final
# ═══════════════════════════════════════════════════════════════
print("--- registrations (garder admin-bypass + securite_final) ---")

clean("registrations", {
    "id": {"$nin": ["admin-bypass", "pro_e2643d1b-e6b"]},
    "$and": [
        {"email": {"$ne": "securite_final@gmail.com"}}
    ]
}, "Registrations test (garder admin-bypass + securite_final)")

print()

# ═══════════════════════════════════════════════════════════════
# 5. COLLECTIONS AVEC SUPPRESSION PARTIELLE
# ═══════════════════════════════════════════════════════════════
print("--- Suppressions partielles ---")

# admin_notifications — 5 test
clean("admin_notifications", {
    "title": {"$regex": "test", "$options": "i"}
}, "Notifications test")

# contact_messages — 7 test
clean("contact_messages", {
    "name": {"$regex": "test", "$options": "i"}
}, "Messages de contact test")

# pro_access_logs — 13 test
clean("pro_access_logs", {
    "email": {"$regex": "(test|example\\.com)", "$options": "i"}
}, "Logs d'accès test")

# kn_wallets — garder admin-bypass uniquement
clean("kn_wallets", {
    "user_id": {"$ne": "admin-bypass"}
}, "Wallets test (garder admin-bypass)")

# kn_checkout_sessions — tout test
drop_all("kn_checkout_sessions", "12 sessions checkout test")

# cultural_scores — 5 test
clean("cultural_scores", {
    "user_id": {"$regex": "test", "$options": "i"}
}, "Scores culturels test")

# partners — 3 test
clean("partners", {
    "name": {"$regex": "^TEST_", "$options": "i"}
}, "Partenaires test")

# shop_products — 2 test
clean("shop_products", {
    "name": {"$regex": "test", "$options": "i"}
}, "Produits boutique test")

# team_notifications — 2 test
clean("team_notifications", {
    "title": {"$regex": "test", "$options": "i"}
}, "Notifications équipe test")

# onboarding_progress — garder admin-bypass
clean("onboarding_progress", {
    "user_id": {"$ne": "admin-bypass"}
}, "Onboarding test (garder admin-bypass)")

# payment_transactions — supprimer les 2 test_user
clean("payment_transactions", {
    "user_id": "test_user"
}, "Transactions test_user (garder 14 Stripe réelles)")

# pro_connections — tous ont des champs vides, probablement test
# On les garde car pas explicitement demandé de les supprimer

print()

# ═══════════════════════════════════════════════════════════════
# 6. CULTURAL_CARDS — Supprimer 1 doublon "Culture Connect 2026"
# ═══════════════════════════════════════════════════════════════
print("--- cultural_cards (supprimer 1 doublon) ---")

# Trouver les doublons "Culture Connect 2026"
cc2026_cards = list(db["cultural_cards"].find({"title": "Culture Connect 2026"}))
if len(cc2026_cards) > 1:
    # Garder le premier, supprimer le reste
    ids_to_delete = [c["_id"] for c in cc2026_cards[1:]]
    before = db["cultural_cards"].count_documents({})
    deleted = db["cultural_cards"].delete_many({"_id": {"$in": ids_to_delete}})
    after = db["cultural_cards"].count_documents({})
    results["cultural_cards"] = {
        "before": before,
        "deleted": deleted.deleted_count,
        "after": after,
        "description": f"Doublon 'Culture Connect 2026' supprimé ({deleted.deleted_count})"
    }
    print(f"  [cultural_cards] {before} → {after} ({deleted.deleted_count} doublons supprimés)")
else:
    print(f"  [cultural_cards] Aucun doublon trouvé")

print()

# ═══════════════════════════════════════════════════════════════
# VÉRIFICATION POST-NETTOYAGE
# ═══════════════════════════════════════════════════════════════
print("=" * 70)
print("  VÉRIFICATION POST-NETTOYAGE")
print("=" * 70)
print()

total_deleted = 0
total_remaining = 0

for coll_name in sorted(db.list_collection_names()):
    count = db[coll_name].count_documents({})
    total_remaining += count
    marker = ""
    if coll_name in results:
        r = results[coll_name]
        total_deleted += r["deleted"]
        marker = f" (était {r['before']}, -{r['deleted']})"
    print(f"  {coll_name}: {count} documents{marker}")

print()
print("=" * 70)
print(f"  TOTAL SUPPRIMÉ : {total_deleted} documents")
print(f"  TOTAL RESTANT  : {total_remaining} documents")
print(f"  BACKUP         : /app/backend/scripts/mongodb_backup_pre_phase2/")
print("=" * 70)
