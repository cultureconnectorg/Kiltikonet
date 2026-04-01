"""
CC2026 Recommendation Engine — Hybrid (Internal scoring + CVL BRAIN enrichment)
3 axes: Connexions participants, Contenus/evenements, Partenariats organisations
"""
from datetime import datetime, timezone

# Badge type compatibility matrix — higher = more complementary
COMPATIBILITY = {
    ("ART", "SPO"): 0.9, ("ART", "VIP"): 0.8, ("ART", "EXP"): 0.7,
    ("ART", "INT"): 0.6, ("ART", "BNV"): 0.5, ("ART", "VIS"): 0.4,
    ("VIP", "SPO"): 0.85, ("VIP", "EXP"): 0.8, ("VIP", "INT"): 0.75,
    ("SPO", "EXP"): 0.9, ("SPO", "INT"): 0.7,
    ("INT", "OFF"): 0.8, ("BNV", "VIS"): 0.5,
}

def get_compatibility(t1, t2):
    if t1 == t2:
        return 0.6
    key = tuple(sorted([t1, t2]))
    return COMPATIBILITY.get(key, COMPATIBILITY.get((key[1], key[0]), 0.3))


async def get_connection_recommendations(db, badge_id, limit=10):
    """Recommend people to connect with based on profile matching"""
    badge = await db.cc_badges.find_one({"badge_id": badge_id}, {"_id": 0})
    if not badge:
        return {"recommendations": [], "badge_id": badge_id, "error": "Badge non trouve"}

    my_type = badge.get("type_badge", "VIS").split("-")[0]
    my_score = badge.get("cultural_impact_score", 0)
    my_org = badge.get("organisation", "")

    all_badges = await db.cc_badges.find(
        {"badge_id": {"$ne": badge_id}},
        {"_id": 0, "badge_id": 1, "prenom": 1, "nom": 1, "type_badge": 1,
         "organisation": 1, "cultural_impact_score": 1, "frek_id": 1, "statut": 1}
    ).to_list(200)

    scored = []
    for b in all_badges:
        b_type = b.get("type_badge", "VIS").split("-")[0]
        b_score = b.get("cultural_impact_score", 0)
        b_org = b.get("organisation", "")

        # Scoring
        s = 0.0
        # Type complementarity
        s += get_compatibility(my_type, b_type) * 35
        # Score proximity (similar level = relevant)
        score_diff = abs(my_score - b_score)
        s += max(0, 25 - score_diff * 0.3)
        # Same org boost
        if my_org and b_org and my_org.lower() == b_org.lower():
            s += 15
        # High score bonus
        if b_score >= 60:
            s += 10
        # Active status bonus
        if b.get("statut") in ("ACTIVE", "REMIS"):
            s += 5

        reason = []
        if get_compatibility(my_type, b_type) >= 0.7:
            reason.append(f"Profil complementaire ({b_type})")
        if my_org and b_org and my_org.lower() == b_org.lower():
            reason.append("Meme organisation")
        if score_diff < 15:
            reason.append("Impact culturel similaire")
        if b_score >= 70:
            reason.append("Haut potentiel culturel")

        scored.append({
            "badge_id": b["badge_id"],
            "frek_id": b.get("frek_id", ""),
            "name": f"{b.get('prenom', '')} {b.get('nom', '')}".strip(),
            "type": b_type,
            "full_type": b.get("type_badge", ""),
            "org": b_org,
            "score": b_score,
            "match_score": round(s, 1),
            "reasons": reason if reason else ["Decouverte"],
        })

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return {
        "badge_id": badge_id,
        "profile": {
            "name": f"{badge.get('prenom', '')} {badge.get('nom', '')}".strip(),
            "type": my_type,
            "score": my_score,
            "org": my_org,
        },
        "recommendations": scored[:limit],
        "total_candidates": len(scored),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


async def get_event_recommendations(db, badge_id, limit=8):
    """Recommend events based on badge type and profile"""
    badge = await db.cc_badges.find_one({"badge_id": badge_id}, {"_id": 0})
    if not badge:
        return {"recommendations": [], "badge_id": badge_id, "error": "Badge non trouve"}

    my_type = badge.get("type_badge", "VIS").split("-")[0]
    my_score = badge.get("cultural_impact_score", 0)

    events = await db.cc_events.find({}, {"_id": 0}).to_list(100)

    scored = []
    for evt in events:
        s = 0.0
        targets = evt.get("target_badges", [])

        # Type targeting
        if my_type in targets:
            s += 40
        # Extended type match (EXP-VIP -> EXP + VIP)
        full_type = badge.get("type_badge", "")
        for part in full_type.split("-"):
            if part in targets:
                s += 10

        # Tag-based scoring
        tags = evt.get("tags", [])
        if my_type == "ART" and any(t in tags for t in ["musique", "live", "creation"]):
            s += 15
        if my_type == "VIP" and any(t in tags for t in ["vip", "networking", "business"]):
            s += 15
        if my_type == "SPO" and any(t in tags for t in ["business", "partenaires", "networking"]):
            s += 15
        if my_type == "BNV" and any(t in tags for t in ["danse", "tradition", "bele"]):
            s += 10
        if my_type == "VIS" and any(t in tags for t in ["fete", "musique", "danse", "decouverte"]):
            s += 10
        if my_type in ("INT", "OFF") and any(t in tags for t in ["officiel", "bilan", "diaspora"]):
            s += 15

        # Cultural score bonus for intellectual events
        if my_score >= 50 and evt.get("type") in ("conference", "atelier"):
            s += 10

        # Capacity factor — smaller events = more exclusive
        cap = evt.get("capacity", 100)
        if cap <= 40:
            s += 8
        elif cap <= 100:
            s += 4

        reason = []
        if my_type in targets:
            reason.append(f"Recommande pour les {my_type}")
        if evt.get("type") == "atelier":
            reason.append("Atelier pratique")
        if evt.get("type") == "soiree":
            reason.append("Experience immersive")
        if "networking" in tags:
            reason.append("Opportunite de networking")

        scored.append({
            **evt,
            "match_score": round(s, 1),
            "reasons": reason if reason else ["A decouvrir"],
        })

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return {
        "badge_id": badge_id,
        "profile": {
            "name": f"{badge.get('prenom', '')} {badge.get('nom', '')}".strip(),
            "type": my_type,
            "score": my_score,
        },
        "recommendations": scored[:limit],
        "total_events": len(scored),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


async def get_partnership_recommendations(db, badge_id, limit=6):
    """Recommend organizations for partnerships based on complementarity"""
    badge = await db.cc_badges.find_one({"badge_id": badge_id}, {"_id": 0})
    if not badge:
        return {"recommendations": [], "badge_id": badge_id, "error": "Badge non trouve"}

    my_org = badge.get("organisation", "")
    my_type = badge.get("type_badge", "VIS").split("-")[0]

    # Get all organizations with their members
    all_badges = await db.cc_badges.find(
        {"organisation": {"$ne": ""}},
        {"_id": 0, "badge_id": 1, "type_badge": 1, "organisation": 1,
         "cultural_impact_score": 1, "prenom": 1, "nom": 1}
    ).to_list(200)

    org_map = {}
    for b in all_badges:
        org = b.get("organisation", "")
        if org and org.lower() != my_org.lower():
            if org not in org_map:
                org_map[org] = {"members": [], "types": set(), "total_score": 0}
            org_map[org]["members"].append(b)
            org_map[org]["types"].add(b.get("type_badge", "VIS").split("-")[0])
            org_map[org]["total_score"] += b.get("cultural_impact_score", 0)

    scored = []
    for org_name, data in org_map.items():
        s = 0.0
        members = data["members"]
        types = data["types"]
        avg_score = data["total_score"] / len(members) if members else 0

        # Complementarity — different types = more valuable partnership
        for t in types:
            s += get_compatibility(my_type, t) * 20
        # Diversity bonus
        s += len(types) * 8
        # Score quality
        s += min(avg_score * 0.3, 20)
        # Team size
        s += min(len(members) * 3, 15)

        reasons = []
        if any(t in types for t in ["SPO", "EXP"]):
            reasons.append("Potentiel sponsor/exposant")
        if any(t in types for t in ["ART"]):
            reasons.append("Talents artistiques")
        if avg_score >= 50:
            reasons.append("Haut impact culturel")
        if len(members) >= 3:
            reasons.append(f"Equipe de {len(members)} membres")

        scored.append({
            "org_name": org_name,
            "member_count": len(members),
            "types": list(types),
            "avg_score": round(avg_score, 1),
            "match_score": round(s, 1),
            "reasons": reasons if reasons else ["Collaboration potentielle"],
            "top_members": [
                {"name": f"{m.get('prenom','')} {m.get('nom','')}".strip(), "type": m.get("type_badge",""), "score": m.get("cultural_impact_score", 0)}
                for m in sorted(members, key=lambda x: x.get("cultural_impact_score", 0), reverse=True)[:3]
            ],
        })

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return {
        "badge_id": badge_id,
        "profile": {
            "name": f"{badge.get('prenom', '')} {badge.get('nom', '')}".strip(),
            "type": my_type,
            "org": my_org,
        },
        "recommendations": scored[:limit],
        "total_orgs": len(scored),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


async def get_admin_overview(db):
    """Admin overview — aggregated recommendation stats"""
    total_badges = await db.cc_badges.count_documents({})
    total_events = await db.cc_events.count_documents({})

    # Type distribution
    type_pipe = [{"$group": {"_id": "$type_badge", "count": {"$sum": 1}}}]
    types = await db.cc_badges.aggregate(type_pipe).to_list(20)
    type_dist = {t["_id"]: t["count"] for t in types}

    # Score distribution
    score_ranges = {
        "elite (80-100)": await db.cc_badges.count_documents({"cultural_impact_score": {"$gte": 80}}),
        "haut (60-79)": await db.cc_badges.count_documents({"cultural_impact_score": {"$gte": 60, "$lt": 80}}),
        "moyen (40-59)": await db.cc_badges.count_documents({"cultural_impact_score": {"$gte": 40, "$lt": 60}}),
        "debutant (0-39)": await db.cc_badges.count_documents({"cultural_impact_score": {"$lt": 40}}),
    }

    # Org stats
    org_pipe = [
        {"$match": {"organisation": {"$ne": ""}}},
        {"$group": {"_id": "$organisation", "count": {"$sum": 1}, "avg_score": {"$avg": "$cultural_impact_score"}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    orgs = await db.cc_badges.aggregate(org_pipe).to_list(10)
    top_orgs = [{"org": o["_id"], "members": o["count"], "avg_score": round(o.get("avg_score") or 0, 1)} for o in orgs]

    # Event stats
    evt_pipe = [{"$group": {"_id": "$type", "count": {"$sum": 1}}}]
    evt_types = await db.cc_events.aggregate(evt_pipe).to_list(20)
    event_dist = {e["_id"]: e["count"] for e in evt_types}

    # Potential connections
    potential = total_badges * (total_badges - 1) // 2

    return {
        "total_badges": total_badges,
        "total_events": total_events,
        "type_distribution": type_dist,
        "score_distribution": score_ranges,
        "top_organisations": top_orgs,
        "event_distribution": event_dist,
        "potential_connections": potential,
        "recommendation_axes": ["connexions", "evenements", "partenariats"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
