"""
Admin CC2026 — Dashboard, User Management, Feed Moderation
GET  /api/admin/cc2026/stats
GET  /api/admin/users
PUT  /api/admin/users/:frek_id/role
POST /api/admin/users/:frek_id/suspend
DELETE /api/admin/users/:frek_id
GET  /api/admin/feed/reported
DELETE /api/admin/feed/posts/:id
POST /api/admin/feed/posts/:id/restore
POST /api/admin/users/:frek_id/ban
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException

router = APIRouter(prefix="/api/admin", tags=["admin-cc2026"])

_db = None


def init_admin_cc2026(db):
    global _db
    _db = db


async def _require_admin(request: Request):
    session = request.state.__dict__.get("session") or {}
    role = session.get("role", "user")
    if role not in ("admin", "founder"):
        raise HTTPException(403, "Acces reserve aux administrateurs")
    return session


# ═══════════════════════════════════════════
# CC2026 STATS DASHBOARD
# ═══════════════════════════════════════════
@router.get("/cc2026/stats")
async def cc2026_stats(request: Request):
    await _require_admin(request)
    now = datetime.now(timezone.utc)
    day_ago = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

    # Badge counts
    pipeline_badges = [{"$group": {"_id": "$type_badge", "count": {"$sum": 1}}}]
    badge_agg = await _db.cc_badges.aggregate(pipeline_badges).to_list(20)
    badges_by_type = {r["_id"]: r["count"] for r in badge_agg if r["_id"]}

    total_badges = await _db.cc_badges.count_documents({})
    validated = await _db.cc_badges.count_documents({"statut": "valide"})
    printed = await _db.cc_badges.count_documents({"statut": "imprime"})
    delivered = await _db.cc_badges.count_documents({"statut": "remis"})
    nfc_active = await _db.cc_badges.count_documents({"nfc_enabled": True})

    # JCC sold
    jcc_pipeline = [{"$group": {"_id": None, "total": {"$sum": "$amount_jcc"}}}]
    jcc_agg = await _db.jcc_transactions.aggregate(jcc_pipeline).to_list(1)
    jcc_sold = jcc_agg[0]["total"] if jcc_agg else 0

    # Revenue
    rev_pipeline = [{"$match": {"status": "completed"}}, {"$group": {"_id": None, "total": {"$sum": "$amount_eur"}}}]
    rev_agg = await _db.stripe_payments.aggregate(rev_pipeline).to_list(1)
    revenue = rev_agg[0]["total"] if rev_agg else 0

    # 24h metrics
    inscriptions_24h = await _db.kn_profiles.count_documents({"created_at": {"$gte": day_ago.isoformat()}})
    scans_24h = await _db.audit_logs.count_documents({"action": "NFC_SCAN", "timestamp": {"$gte": day_ago.isoformat()}})

    # Artists
    artistes = await _db.cc_badges.count_documents({"type_badge": {"$in": ["artiste", "ART"]}})

    # Countdown
    event_date = datetime(2026, 5, 20, tzinfo=timezone.utc)
    days_until = max(0, (event_date - now).days)

    return {
        "badges_emis": total_badges,
        "badges_by_type": badges_by_type,
        "badges_valides": validated,
        "badges_imprimes": printed,
        "badges_remis": delivered,
        "nfc_actifs": nfc_active,
        "jcc_vendus": jcc_sold,
        "revenus_total": revenue,
        "inscriptions_24h": inscriptions_24h,
        "scans_nfc_24h": scans_24h,
        "artistes_confirmes": artistes,
        "countdown_jours": days_until,
    }


# ═══════════════════════════════════════════
# USER MANAGEMENT
# ═══════════════════════════════════════════
@router.get("/users")
async def list_users(request: Request, page: int = 1, limit: int = 20, search: str = ""):
    await _require_admin(request)
    query = {}
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
            {"full_name": {"$regex": search, "$options": "i"}},
            {"frek_id": {"$regex": search, "$options": "i"}},
        ]
    total = await _db.kn_profiles.count_documents(query)
    users = await _db.kn_profiles.find(query, {"_id": 0}).sort("created_at", -1).skip((page - 1) * limit).limit(limit).to_list(limit)
    return {"users": users, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}


@router.put("/users/{frek_id}/role")
async def change_user_role(request: Request, frek_id: str, data: dict):
    await _require_admin(request)
    new_role = data.get("role")
    if new_role not in ("user", "pro", "admin", "founder"):
        raise HTTPException(400, "Role invalide")
    await _db.kn_profiles.update_one({"frek_id": frek_id}, {"$set": {"role": new_role}})
    now = datetime.now(timezone.utc).isoformat()
    session = request.state.__dict__.get("session") or {}
    await _db.audit_logs.insert_one({"action": "ADMIN_ROLE_CHANGE", "actor": session.get("email"), "target_frek_id": frek_id, "new_role": new_role, "timestamp": now})
    return {"success": True, "frek_id": frek_id, "role": new_role}


@router.post("/users/{frek_id}/suspend")
async def suspend_user(request: Request, frek_id: str):
    await _require_admin(request)
    await _db.kn_profiles.update_one({"frek_id": frek_id}, {"$set": {"suspended": True, "suspended_at": datetime.now(timezone.utc).isoformat()}})
    session = request.state.__dict__.get("session") or {}
    await _db.audit_logs.insert_one({"action": "ADMIN_SUSPEND", "actor": session.get("email"), "target_frek_id": frek_id, "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"success": True, "suspended": True}


@router.delete("/users/{frek_id}")
async def anonymize_user(request: Request, frek_id: str):
    """RGPD anonymization — replace PII with anonymous data."""
    await _require_admin(request)
    now = datetime.now(timezone.utc).isoformat()
    await _db.kn_profiles.update_one({"frek_id": frek_id}, {"$set": {
        "email": f"anonymized_{frek_id}@deleted",
        "name": "Utilisateur supprime",
        "full_name": "Utilisateur supprime",
        "phone": None,
        "avatar": None,
        "anonymized": True,
        "anonymized_at": now,
    }})
    session = request.state.__dict__.get("session") or {}
    await _db.audit_logs.insert_one({"action": "ADMIN_ANONYMIZE_RGPD", "actor": session.get("email"), "target_frek_id": frek_id, "timestamp": now})
    return {"success": True, "anonymized": True}


# ═══════════════════════════════════════════
# FEED MODERATION
# ═══════════════════════════════════════════
@router.get("/feed/reported")
async def get_reported_posts(request: Request):
    await _require_admin(request)
    posts = await _db.pro_posts.find(
        {"reports_count": {"$gt": 0}},
        {"_id": 0}
    ).sort("reports_count", -1).limit(50).to_list(50)
    return {"posts": posts, "total": len(posts)}


@router.delete("/feed/posts/{post_id}")
async def admin_delete_post(request: Request, post_id: str):
    await _require_admin(request)
    await _db.pro_posts.update_one({"id": post_id}, {"$set": {"deleted": True, "deleted_at": datetime.now(timezone.utc).isoformat()}})
    session = request.state.__dict__.get("session") or {}
    await _db.audit_logs.insert_one({"action": "ADMIN_DELETE_POST", "actor": session.get("email"), "post_id": post_id, "timestamp": datetime.now(timezone.utc).isoformat()})
    return {"success": True, "deleted": post_id}


@router.post("/feed/posts/{post_id}/restore")
async def admin_restore_post(request: Request, post_id: str):
    await _require_admin(request)
    await _db.pro_posts.update_one({"id": post_id}, {"$unset": {"deleted": "", "deleted_at": ""}})
    return {"success": True, "restored": post_id}


@router.post("/users/{frek_id}/ban")
async def ban_user_from_feed(request: Request, frek_id: str):
    await _require_admin(request)
    now = datetime.now(timezone.utc).isoformat()
    await _db.kn_profiles.update_one({"frek_id": frek_id}, {"$set": {"feed_banned": True, "feed_banned_at": now}})
    session = request.state.__dict__.get("session") or {}
    await _db.audit_logs.insert_one({"action": "ADMIN_BAN_FEED", "actor": session.get("email"), "target_frek_id": frek_id, "timestamp": now})
    return {"success": True, "banned": True}
