"""
Phase 1 — Audit MongoDB : Culture Connect 2026
Génère un rapport détaillé de toutes les données de test/démo/seed
AUCUNE SUPPRESSION — rapport uniquement.
"""

import os
import re
import json
from datetime import datetime, timezone
from pymongo import MongoClient

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "culture_connect_2026")

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Cartes culturelles validées par l'admin (à GARDER absolument)
VALIDATED_CARD_TITLES = [
    "kassav", "malavoi", "jacob desvarieux", "jocelyne béroard",
    "habitation clément", "le bèlè", "le colombo", "fabienne confiant",
    "aimé césaire", "edouard glissant", "patrick chamoiseau",
    "raphaël confiant", "maryse condé", "frantz fanon", "le zouk",
    "la biguine", "le madras"
]

# Patterns de détection de données de test
TEST_PATTERNS = [
    re.compile(r"test", re.IGNORECASE),
    re.compile(r"ghost", re.IGNORECASE),
    re.compile(r"demo", re.IGNORECASE),
    re.compile(r"seed", re.IGNORECASE),
    re.compile(r"placeholder", re.IGNORECASE),
    re.compile(r"fake", re.IGNORECASE),
    re.compile(r"dummy", re.IGNORECASE),
    re.compile(r"lorem", re.IGNORECASE),
    re.compile(r"exemple", re.IGNORECASE),
    re.compile(r"sample", re.IGNORECASE),
]

def is_test_string(value):
    """Vérifie si une chaîne contient un pattern de test"""
    if not isinstance(value, str):
        return False
    return any(p.search(value) for p in TEST_PATTERNS)

def is_validated_card(doc):
    """Vérifie si une carte culturelle fait partie des 17 validées"""
    title = (doc.get("title") or doc.get("name") or doc.get("titre") or "").lower().strip()
    for validated in VALIDATED_CARD_TITLES:
        if validated in title:
            return True
    # Vérifier aussi created_by
    created_by = (doc.get("created_by") or "").lower()
    if "admin_seed_validated" in created_by or "admin" in created_by:
        return True
    return False

def classify_card(doc):
    """Classifie une carte culturelle : garder / supprimer / ambigu"""
    title = doc.get("title") or doc.get("name") or doc.get("titre") or ""
    image_url = doc.get("image_url") or doc.get("image") or doc.get("cover_image") or ""
    created_by = doc.get("created_by") or ""
    
    # Carte validée → GARDER
    if is_validated_card(doc):
        return "GARDER", f"Carte validée: '{title}'"
    
    # Créée par un utilisateur TEST_ → SUPPRIMER
    if is_test_string(created_by):
        return "SUPPRIMER", f"Créée par utilisateur test: '{created_by}'"
    
    # Titre générique ou placeholder → SUPPRIMER
    if is_test_string(title):
        return "SUPPRIMER", f"Titre test/placeholder: '{title}'"
    
    # Pas d'image réelle → SUPPRIMER
    if not image_url or image_url in ["", "null", "undefined", "placeholder"]:
        return "SUPPRIMER", f"Pas d'image réelle: '{title}'"
    
    # Sinon → AMBIGU (à montrer à l'utilisateur)
    return "AMBIGU", f"'{title}' (created_by: '{created_by}', image: {'oui' if image_url else 'non'})"

def classify_user(doc):
    """Classifie un utilisateur : réel / test"""
    name = doc.get("display_name") or doc.get("name") or doc.get("full_name") or ""
    email = doc.get("email") or ""
    
    # Flags explicites
    if doc.get("is_test") or doc.get("is_demo"):
        return "TEST", f"Flag is_test/is_demo: '{name}' ({email})"
    
    # Nom commence par TEST_
    if name.upper().startswith("TEST_") or name.upper().startswith("TEST "):
        return "TEST", f"Nom test: '{name}' ({email})"
    
    # Email de test
    if is_test_string(email) and "@" in email:
        return "TEST", f"Email test: '{name}' ({email})"
    
    # Nom avec pattern de test
    if is_test_string(name):
        return "AMBIGU", f"Nom suspect: '{name}' ({email})"
    
    return "RÉEL", f"'{name}' ({email})"

def classify_post(doc):
    """Classifie un post : réel / test"""
    content = doc.get("content") or doc.get("text") or doc.get("body") or ""
    author = doc.get("author") or doc.get("author_id") or doc.get("user_id") or ""
    
    if doc.get("is_test") or doc.get("is_system"):
        return "TEST", f"Flag is_test/is_system"
    
    if is_test_string(str(content)):
        return "TEST", f"Contenu test: '{content[:60]}...'"
    
    if is_test_string(str(author)):
        return "TEST", f"Auteur test: '{author}'"
    
    return "RÉEL", f"'{content[:60]}...' (par {author})"

def classify_generic(doc, collection_name):
    """Classification générique pour les autres collections"""
    # Vérifier les flags de test
    if doc.get("is_test") or doc.get("is_demo") or doc.get("is_seed"):
        return "TEST", "Flag is_test/is_demo/is_seed"
    
    # Chercher des patterns de test dans les champs principaux
    for field in ["name", "title", "display_name", "email", "content", "description"]:
        val = doc.get(field)
        if val and is_test_string(str(val)):
            return "TEST", f"Champ '{field}' contient pattern test: '{str(val)[:60]}'"
    
    return "RÉEL", ""


def run_audit():
    """Exécute l'audit complet de toutes les collections"""
    collections = db.list_collection_names()
    
    report = {
        "date": datetime.now(timezone.utc).isoformat(),
        "database": DB_NAME,
        "total_collections": len(collections),
        "collections": {}
    }
    
    grand_total = 0
    grand_test = 0
    grand_real = 0
    grand_ambiguous = 0
    
    for coll_name in sorted(collections):
        coll = db[coll_name]
        total = coll.count_documents({})
        
        if total == 0:
            report["collections"][coll_name] = {
                "total": 0,
                "test_count": 0,
                "real_count": 0,
                "ambiguous_count": 0,
                "details_test": [],
                "details_ambiguous": [],
                "details_real_sample": []
            }
            continue
        
        test_docs = []
        real_docs = []
        ambiguous_docs = []
        
        for doc in coll.find({}, {"_id": 0}):
            doc_id = str(doc.get("id") or doc.get("badge_id") or doc.get("email") or "")
            
            if coll_name in ["cultural_cards", "culturalcards", "cards"]:
                status, reason = classify_card(doc)
            elif coll_name in ["users", "registrations", "participants"]:
                status, reason = classify_user(doc)
            elif coll_name in ["posts", "articles", "comments"]:
                status, reason = classify_post(doc)
            else:
                status, reason = classify_generic(doc, coll_name)
            
            entry = {"id": doc_id, "reason": reason}
            
            if status == "TEST" or status == "SUPPRIMER":
                test_docs.append(entry)
            elif status == "AMBIGU":
                ambiguous_docs.append(entry)
            else:
                real_docs.append(entry)
        
        report["collections"][coll_name] = {
            "total": total,
            "test_count": len(test_docs),
            "real_count": len(real_docs),
            "ambiguous_count": len(ambiguous_docs),
            "details_test": test_docs[:20],  # Limiter à 20 pour lisibilité
            "details_ambiguous": ambiguous_docs,
            "details_real_sample": [r for r in real_docs[:5]]  # Échantillon
        }
        
        grand_total += total
        grand_test += len(test_docs)
        grand_real += len(real_docs)
        grand_ambiguous += len(ambiguous_docs)
    
    report["summary"] = {
        "grand_total_documents": grand_total,
        "total_test_to_delete": grand_test,
        "total_real_to_keep": grand_real,
        "total_ambiguous_to_review": grand_ambiguous
    }
    
    return report


if __name__ == "__main__":
    print("=" * 70)
    print("  PHASE 1 — AUDIT MongoDB : Culture Connect 2026")
    print("  RAPPORT UNIQUEMENT — AUCUNE SUPPRESSION")
    print("=" * 70)
    print()
    
    report = run_audit()
    
    # Sauvegarder le rapport JSON complet
    report_path = "/app/backend/scripts/audit_report_phase1.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2, default=str)
    
    # Afficher le résumé formaté
    print(f"Base de données : {report['database']}")
    print(f"Collections analysées : {report['total_collections']}")
    print()
    
    for coll_name, data in report["collections"].items():
        if data["total"] == 0:
            print(f"  [{coll_name}] : VIDE (0 documents)")
            continue
        
        print(f"  [{coll_name}] : {data['total']} documents total")
        print(f"    → À SUPPRIMER (test/seed) : {data['test_count']}")
        print(f"    → À GARDER (réels)        : {data['real_count']}")
        print(f"    → CAS AMBIGUS             : {data['ambiguous_count']}")
        
        if data["details_test"]:
            print(f"    --- Détails test ---")
            for d in data["details_test"][:10]:
                print(f"       • {d['reason']}")
        
        if data["details_ambiguous"]:
            print(f"    --- Cas ambigus (à valider) ---")
            for d in data["details_ambiguous"]:
                print(f"       ⚠ {d['reason']}")
        
        print()
    
    summary = report["summary"]
    print("=" * 70)
    print("  RÉSUMÉ GLOBAL")
    print("=" * 70)
    print(f"  Total documents dans la base : {summary['grand_total_documents']}")
    print(f"  À SUPPRIMER (test/démo/seed) : {summary['total_test_to_delete']}")
    print(f"  À GARDER (données réelles)   : {summary['total_real_to_keep']}")
    print(f"  CAS AMBIGUS (votre validation): {summary['total_ambiguous_to_review']}")
    print()
    print(f"  Rapport JSON complet : {report_path}")
    print()
    print("⚠ AUCUNE DONNÉE N'A ÉTÉ SUPPRIMÉE.")
    print("  Validez ce rapport, puis confirmez pour lancer la Phase 2.")
