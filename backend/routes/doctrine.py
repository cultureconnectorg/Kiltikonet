"""
Doctrine Routes — Couche doctrinale des 5 acteurs CVLN
======================================================
Additif uniquement. Ne modifie aucun champ existant.
Ref: /app/DOCTRINE.md
"""
import os
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional
import jwt as pyjwt

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/doctrine", tags=["doctrine"])

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]

# ═══════════════════════════════════════════════════════════
# MAPPING profile_type → actor_role
# ═══════════════════════════════════════════════════════════
PROFILE_TO_ACTOR = {
    "artist": "creator",
    "label": "distributor",
    "booking_agency": "distributor",
    "institution": "institutional",
    "press": "professional",
    "other": "professional",
    "admin": "professional",
}

VALID_ACTOR_ROLES = {"creator", "distributor", "institutional", "professional", "consumer"}

SESSION_COOKIE_NAME = "kk_session"
SESSION_SECRET = os.environ.get("SESSION_SECRET", "fallback-dev-secret")


# ═══════════════════════════════════════════════════════════
# GATE MIDDLEWARE — require_permission(action)
# ═══════════════════════════════════════════════════════════
def _decode_session(request: Request) -> dict | None:
    """Read the session from the httpOnly cookie (read-only, no modification)."""
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        return None
    try:
        return pyjwt.decode(token, SESSION_SECRET, algorithms=["HS256"])
    except (pyjwt.ExpiredSignatureError, pyjwt.InvalidTokenError):
        return None


# Permission cache (actor_role → can[]) — populated at startup
_permission_cache: dict[str, list[str]] = {}


async def _load_permission_cache():
    """Load all can[] lists into memory. Called once at startup."""
    global _permission_cache
    docs = await _db.doctrine_permissions.find({}, {"_id": 0, "actor_role": 1, "can": 1}).to_list(10)
    _permission_cache = {d["actor_role"]: d["can"] for d in docs}
    logger.info("Permission cache loaded: %s", list(_permission_cache.keys()))


def require_permission(action: str):
    """
    FastAPI dependency factory.
    Usage: @app.post("/route", dependencies=[Depends(require_permission("publish_content"))])
    """
    async def _guard(request: Request):
        session = _decode_session(request)
        if not session:
            raise HTTPException(401, "Authentification requise")

        email = session.get("email", "")
        is_admin = session.get("is_admin", False)

        # Admins bypass all doctrine gates
        if is_admin:
            return

        # Get actor_role from session or DB
        actor_role = session.get("actor_role")
        if not actor_role:
            reg = await _db.registrations.find_one(
                {"email": email}, {"_id": 0, "actor_role": 1}
            )
            actor_role = (reg or {}).get("actor_role", "consumer")

        # Check permission in cache first, then DB fallback
        allowed = _permission_cache.get(actor_role)
        if allowed is None:
            doc = await _db.doctrine_permissions.find_one(
                {"actor_role": actor_role}, {"_id": 0, "can": 1}
            )
            allowed = (doc or {}).get("can", [])

        if action not in allowed:
            # Audit the refusal
            await _db.doctrine_audit.insert_one({
                "entity": "permission_denied",
                "email": email,
                "actor_role": actor_role,
                "action_requested": action,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "reason": f"Role '{actor_role}' ne possede pas la permission '{action}'",
            })
            logger.warning("Permission denied: %s (%s) → %s", email, actor_role, action)
            raise HTTPException(
                403,
                f"Action non autorisee pour votre role ({actor_role}). "
                f"Permission requise : {action}."
            )

    return _guard

# ═══════════════════════════════════════════════════════════
# SEED DATA — doctrine_permissions
# ═══════════════════════════════════════════════════════════
DOCTRINE_SEED = [
    {
        "actor_role": "creator",
        "label_fr": "Createur",
        "description": "Artiste ou producteur de contenu culturel original",
        "can": [
            "publish_content",
            "monetize",
            "apply_projects",
            "receive_royalties",
            "access_studio_full",
            "create_reels",
            "create_shop_products",
        ],
        "receives": [
            "algorithmic_visibility",
            "cultural_impact_score",
            "studio_full_access",
            "badge_creator",
            "royalty_payments",
        ],
        "cc_flow": {
            "earns_from": ["sales", "streaming", "donations", "royalties"],
            "spends_on": ["promotion", "tools", "collaborations"],
            "redistribution_rate": 0.70,
        },
        "platform_fee": 0.30,
        "governance_weight": 3,
    },
    {
        "actor_role": "distributor",
        "label_fr": "Distributeur",
        "description": "Label, agence de booking, editeur ou promoteur culturel",
        "can": [
            "sign_creators",
            "distribute_content",
            "manage_roster",
            "run_campaigns",
            "access_advanced_analytics",
            "bulk_token_purchase",
        ],
        "receives": [
            "roster_management_tools",
            "performance_dashboard",
            "api_access",
            "badge_distributor",
            "commission_on_sales",
        ],
        "cc_flow": {
            "earns_from": ["commission", "distribution_fees"],
            "spends_on": ["promotion", "visibility", "volume_packs"],
            "redistribution_rate": 0.0,
        },
        "platform_fee": 0.0,
        "governance_weight": 2,
    },
    {
        "actor_role": "institutional",
        "label_fr": "Institutionnel",
        "description": "Collectivite, fondation, ONG ou organisation publique",
        "can": [
            "fund_projects",
            "publish_calls",
            "accredit_events",
            "access_impact_reports",
            "vote_governance",
            "sponsor_creators",
        ],
        "receives": [
            "territorial_impact_reports",
            "institutional_visibility",
            "governance_dao_elevated",
            "badge_institutional",
            "custom_reporting",
        ],
        "cc_flow": {
            "earns_from": [],
            "spends_on": ["grants", "sponsorships", "events", "residencies"],
            "redistribution_rate": 0.0,
        },
        "platform_fee": 0.0,
        "governance_weight": 3,
    },
    {
        "actor_role": "professional",
        "label_fr": "Professionnel",
        "description": "Journaliste, curateur, consultant, technicien ou prestataire culturel",
        "can": [
            "offer_services",
            "publish_analyses",
            "respond_to_calls",
            "access_networking",
            "use_terminal_ia",
            "invoice_cc",
        ],
        "receives": [
            "catalog_visibility",
            "peer_rating",
            "invoicing_tools",
            "badge_professional",
            "networking_priority",
        ],
        "cc_flow": {
            "earns_from": ["services", "consulting", "training"],
            "spends_on": ["training", "tools", "subscriptions"],
            "redistribution_rate": 0.0,
        },
        "platform_fee": 0.0,
        "governance_weight": 2,
    },
    {
        "actor_role": "consumer",
        "label_fr": "Membre",
        "description": "Public, fan, amateur de culture, membre de la diaspora",
        "can": [
            "consume_content",
            "buy_tokens",
            "support_creators",
            "attend_events",
            "vote_governance_basic",
        ],
        "receives": [
            "free_and_premium_content",
            "personalized_recommendations",
            "support_history",
            "badge_member",
        ],
        "cc_flow": {
            "earns_from": [],
            "spends_on": ["content", "events", "merchandise", "donations"],
            "redistribution_rate": 0.0,
        },
        "platform_fee": 0.0,
        "governance_weight": 1,
    },
]


def resolve_actor_role(profile_type: str | None) -> str:
    """Resolve a profile_type to the corresponding actor_role."""
    if not profile_type:
        return "consumer"
    return PROFILE_TO_ACTOR.get(profile_type, "consumer")


# ═══════════════════════════════════════════════════════════
# STARTUP — Seed doctrine_permissions + index
# ═══════════════════════════════════════════════════════════
async def seed_doctrine():
    """Seed doctrine_permissions collection if empty and create indexes."""
    count = await _db.doctrine_permissions.count_documents({})
    if count == 0:
        for doc in DOCTRINE_SEED:
            doc["created_at"] = datetime.now(timezone.utc).isoformat()
            doc["updated_at"] = datetime.now(timezone.utc).isoformat()
        await _db.doctrine_permissions.insert_many(DOCTRINE_SEED)
        logger.info("Doctrine permissions seeded: %d roles", len(DOCTRINE_SEED))
    await _db.doctrine_permissions.create_index("actor_role", unique=True)
    await _db.registrations.create_index("actor_role", sparse=True)
    await _load_permission_cache()
    logger.info("Doctrine indexes ensured")


# ═══════════════════════════════════════════════════════════
# MIGRATION — Backfill actor_role on existing registrations
# ═══════════════════════════════════════════════════════════
async def backfill_actor_roles():
    """
    One-time migration: set actor_role on all registrations
    that don't have one yet, based on their profile_type.
    Does NOT overwrite existing actor_role values.
    """
    cursor = _db.registrations.find(
        {"actor_role": {"$exists": False}},
        {"_id": 1, "profile_type": 1},
    )
    count = 0
    async for doc in cursor:
        role = resolve_actor_role(doc.get("profile_type"))
        await _db.registrations.update_one(
            {"_id": doc["_id"]},
            {"$set": {
                "actor_role": role,
                "actor_role_assigned_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
        count += 1
    return count


# ═══════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════

@router.get("/permissions")
async def get_all_permissions():
    """Return the full doctrine permissions matrix."""
    docs = await _db.doctrine_permissions.find({}, {"_id": 0}).to_list(10)
    return {"permissions": docs, "count": len(docs)}


@router.get("/permissions/{actor_role}")
async def get_permission(actor_role: str):
    """Return permissions for a specific actor_role."""
    if actor_role not in VALID_ACTOR_ROLES:
        raise HTTPException(400, f"Invalid actor_role. Valid: {sorted(VALID_ACTOR_ROLES)}")
    doc = await _db.doctrine_permissions.find_one({"actor_role": actor_role}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Permissions not found for this role")
    return doc


@router.get("/mapping")
async def get_mapping():
    """Return the profile_type → actor_role mapping table."""
    return {
        "mapping": PROFILE_TO_ACTOR,
        "valid_roles": sorted(VALID_ACTOR_ROLES),
    }


@router.get("/resolve/{profile_type}")
async def resolve_role(profile_type: str):
    """Resolve a profile_type to its actor_role."""
    return {
        "profile_type": profile_type,
        "actor_role": resolve_actor_role(profile_type),
    }


class ActorRoleUpdate(BaseModel):
    user_id: str
    actor_role: str
    reason: Optional[str] = None


@router.post("/assign")
async def assign_actor_role(body: ActorRoleUpdate):
    """
    Manually assign an actor_role to a user.
    Audited — previous role is logged.
    """
    if body.actor_role not in VALID_ACTOR_ROLES:
        raise HTTPException(400, f"Invalid actor_role. Valid: {sorted(VALID_ACTOR_ROLES)}")

    user = await _db.registrations.find_one({"id": body.user_id}, {"_id": 0, "actor_role": 1, "id": 1})
    if not user:
        raise HTTPException(404, "User not found")

    previous_role = user.get("actor_role")
    now = datetime.now(timezone.utc).isoformat()

    await _db.registrations.update_one(
        {"id": body.user_id},
        {"$set": {
            "actor_role": body.actor_role,
            "actor_role_assigned_at": now,
            "actor_role_previous": previous_role,
        }},
    )

    await _db.doctrine_audit.insert_one({
        "user_id": body.user_id,
        "action": "assign_actor_role",
        "previous_role": previous_role,
        "new_role": body.actor_role,
        "reason": body.reason or "",
        "timestamp": now,
    })

    return {
        "success": True,
        "user_id": body.user_id,
        "previous_role": previous_role,
        "new_role": body.actor_role,
    }


@router.post("/backfill")
async def run_backfill():
    """Run the backfill migration to assign actor_role to existing users."""
    count = await backfill_actor_roles()
    return {"success": True, "users_updated": count}


@router.get("/stats")
async def doctrine_stats():
    """Return distribution of actor_roles across registrations."""
    pipeline = [
        {"$group": {"_id": "$actor_role", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    results = await _db.registrations.aggregate(pipeline).to_list(10)
    distribution = {r["_id"] or "unassigned": r["count"] for r in results}
    total = sum(distribution.values())
    return {"distribution": distribution, "total": total}


@router.get("/my-permissions")
async def my_permissions(request: Request):
    """Return the can[], receives[], cc_flow of the authenticated user's actor_role."""
    session = _decode_session(request)
    if not session:
        raise HTTPException(401, "Authentification requise")

    email = session.get("email", "")
    is_admin = session.get("is_admin", False)

    # Get actor_role from DB (source of truth)
    reg = await _db.registrations.find_one(
        {"email": email}, {"_id": 0, "actor_role": 1, "profile_type": 1}
    )
    actor_role = (reg or {}).get("actor_role")
    if not actor_role:
        actor_role = resolve_actor_role((reg or {}).get("profile_type"))

    # Fetch permissions
    doc = await _db.doctrine_permissions.find_one(
        {"actor_role": actor_role}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(404, f"Permissions introuvables pour le role {actor_role}")

    return {
        "actor_role": actor_role,
        "label_fr": doc.get("label_fr", ""),
        "is_admin": is_admin,
        "can": doc.get("can", []),
        "receives": doc.get("receives", []),
        "cc_flow": doc.get("cc_flow", {}),
        "platform_fee": doc.get("platform_fee", 0.0),
        "governance_weight": doc.get("governance_weight", 1),
    }
