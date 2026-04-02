"""
Espace Pro Social — Fil d'actualité & Recommandations
Routes /api/pro/social/ pour le LinkedIn Culturel CC2026
"""
import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pro/social", tags=["pro-social"])

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]


class PostCreate(BaseModel):
    author_id: str
    author_name: str
    author_image: Optional[str] = None
    author_type: Optional[str] = None
    content: str
    tags: Optional[list] = []


class CommentCreate(BaseModel):
    author_id: str
    author_name: str
    content: str


# ═══════════════════════════════════════════════════════════════
# FIL D'ACTUALITÉ — Posts, Likes, Commentaires
# ═══════════════════════════════════════════════════════════════
@router.get("/feed")
async def get_feed(profile_id: Optional[str] = None, limit: int = 30, skip: int = 0):
    """Récupérer le fil d'actualité (tous les posts, incluant les posts fantômes actifs)"""
    query = {}
    if profile_id:
        # Get connected profile IDs
        connections = await _db.pro_connections.find(
            {"$or": [{"from_profile": profile_id}, {"to_profile": profile_id}], "status": "accepted"},
            {"_id": 0, "from_profile": 1, "to_profile": 1}
        ).to_list(500)
        connected_ids = set()
        for c in connections:
            connected_ids.add(c["from_profile"])
            connected_ids.add(c["to_profile"])
        connected_ids.add(profile_id)

        # Include active ghost profiles (v1 + v2) in feed
        active_ghosts = await _db.ghost_profiles.find(
            {"active": True}, {"_id": 0, "id": 1}
        ).to_list(100)
        active_ghosts_v2 = await _db.ghost_profiles_v2.find(
            {"active": True}, {"_id": 0, "id": 1}
        ).to_list(500)
        ghost_ids = {g["id"] for g in active_ghosts} | {g["id"] for g in active_ghosts_v2}

        query["$or"] = [
            {"author_id": {"$in": list(connected_ids)}},
            {"author_id": {"$in": list(ghost_ids)}},
        ]

    posts = await _db.pro_posts.find(
        query, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    total = await _db.pro_posts.count_documents(query)

    return {"posts": posts, "total": total}


@router.post("/posts")
async def create_post(data: PostCreate):
    """Créer un post dans le fil d'actualité"""
    if not data.content.strip():
        raise HTTPException(status_code=400, detail="Contenu vide")

    post = {
        "id": str(uuid.uuid4()),
        "author_id": data.author_id,
        "author_name": data.author_name,
        "author_image": data.author_image,
        "author_type": data.author_type,
        "content": data.content,
        "tags": data.tags or [],
        "likes": [],
        "comments": [],
        "likes_count": 0,
        "comments_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await _db.pro_posts.insert_one(post)
    del post["_id"]

    # Trigger ghost auto-comment for real user posts (non-ghost)
    if not data.author_id.startswith("ghost_") and not data.author_id.startswith("gv2_"):
        import asyncio
        asyncio.create_task(_trigger_ghost_comment(post["id"]))
        asyncio.create_task(_trigger_social_validation(post["id"], data.author_id))
        # Reward: first post +5 Jetons
        asyncio.create_task(_trigger_reward(data.author_id, "first_post"))

    return {"success": True, "post": post}


async def _trigger_ghost_comment(post_id: str):
    """Delayed ghost comment on a real user's post."""
    import asyncio, secrets as _sec
    try:
        delay = _sec.randbelow(540) + 60  # 1-10 min
        await asyncio.sleep(delay)
        import httpx
        async with httpx.AsyncClient() as client:
            await client.post(
                f"http://localhost:8001/api/ghost/engine/auto-comment",
                json={"post_id": post_id},
                timeout=30
            )
    except Exception as e:
        logger.warning(f"Ghost auto-comment trigger failed: {e}")


async def _trigger_reward(user_id: str, event: str):
    """Trigger a Jetons CC reward via the ghost engine."""
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            await client.post(
                f"http://localhost:8001/api/ghost/rewards/trigger",
                json={"user_id": user_id, "event": event},
                timeout=10
            )
    except Exception as e:
        logger.warning(f"Reward trigger failed: {e}")

async def _trigger_social_validation(post_id: str, author_id: str):
    """Trigger growth engine social validation (v2 ghost engagement)."""
    try:
        import asyncio
        import secrets as _sec2
        await asyncio.sleep(_sec2.randbelow(50) + 10)
        import httpx
        async with httpx.AsyncClient() as client:
            await client.post(
                f"http://localhost:8001/api/growth/engine/social-validation",
                json={"post_id": post_id, "author_id": author_id},
                timeout=30
            )
    except Exception as e:
        logger.warning(f"Social validation trigger failed: {e}")




@router.post("/posts/{post_id}/like")
async def toggle_like(post_id: str, profile_id: str):
    """Toggle like sur un post"""
    post = await _db.pro_posts.find_one({"id": post_id}, {"_id": 0, "likes": 1, "author_id": 1})
    if not post:
        raise HTTPException(status_code=404, detail="Post non trouvé")

    likes = post.get("likes", [])
    if profile_id in likes:
        # Unlike
        await _db.pro_posts.update_one(
            {"id": post_id},
            {"$pull": {"likes": profile_id}, "$inc": {"likes_count": -1}}
        )
        return {"success": True, "liked": False}
    else:
        # Like
        await _db.pro_posts.update_one(
            {"id": post_id},
            {"$addToSet": {"likes": profile_id}, "$inc": {"likes_count": 1}}
        )
        # Reward author: +1 Jeton per like received
        if not post.get("author_id", "").startswith("ghost_"):
            import asyncio
            asyncio.create_task(_trigger_reward(post.get("author_id", ""), "like_received"))
        return {"success": True, "liked": True}


@router.post("/posts/{post_id}/comment")
async def add_comment(post_id: str, data: CommentCreate):
    """Ajouter un commentaire à un post"""
    comment = {
        "id": str(uuid.uuid4()),
        "author_id": data.author_id,
        "author_name": data.author_name,
        "content": data.content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await _db.pro_posts.update_one(
        {"id": post_id},
        {"$push": {"comments": comment}, "$inc": {"comments_count": 1}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Post non trouvé")
    # Reward post author: +2 Jetons per comment received
    post = await _db.pro_posts.find_one({"id": post_id}, {"_id": 0, "author_id": 1})
    if post and not post.get("author_id", "").startswith("ghost_") and data.author_id != post.get("author_id"):
        import asyncio
        asyncio.create_task(_trigger_reward(post["author_id"], "comment_received"))
    return {"success": True, "comment": comment}


@router.delete("/posts/{post_id}")
async def delete_post(post_id: str, author_id: str):
    """Supprimer un post (uniquement par son auteur)"""
    result = await _db.pro_posts.delete_one({"id": post_id, "author_id": author_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post non trouvé ou non autorisé")
    return {"success": True}


# ═══════════════════════════════════════════════════════════════
# ANNUAIRE AVANCÉ — Recherche avec filtres
# ═══════════════════════════════════════════════════════════════
@router.get("/directory")
async def get_directory(
    search: Optional[str] = None,
    profile_type: Optional[str] = None,
    country: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """Annuaire professionnel avec recherche avancée (inclut les profils fantômes actifs)"""
    query = {"status": "approved"}

    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"organization_name": {"$regex": search, "$options": "i"}},
            {"bio": {"$regex": search, "$options": "i"}},
        ]
    if profile_type:
        query["profile_type"] = profile_type
    if country:
        query["country"] = {"$regex": country, "$options": "i"}

    professionals = await _db.registrations.find(
        query,
        {"_id": 0, "id": 1, "full_name": 1, "profile_type": 1, "organization_name": 1,
         "country": 1, "image": 1, "bio": 1, "expertise_tags": 1}
    ).skip(skip).limit(limit).to_list(limit)

    # Add active ghost profiles to directory
    ghost_query = {"active": True, "retiring": False}
    if search:
        ghost_query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"organization_name": {"$regex": search, "$options": "i"}},
            {"bio": {"$regex": search, "$options": "i"}},
        ]
    if profile_type:
        ghost_query["profile_type"] = profile_type
    if country:
        ghost_query["country"] = {"$regex": country, "$options": "i"}

    ghosts = await _db.ghost_profiles.find(
        ghost_query,
        {"_id": 0, "id": 1, "full_name": 1, "profile_type": 1, "organization_name": 1,
         "country": 1, "image": 1, "bio": 1, "expertise_tags": 1}
    ).to_list(50)

    # Merge and shuffle slightly for natural feel
    import secrets as _sec3
    all_pros = professionals + ghosts
    if len(all_pros) > 2:
        # Fisher-Yates shuffle using secrets for unpredictability
        for i in range(len(all_pros) - 1, 0, -1):
            j = _sec3.randbelow(i + 1)
            all_pros[i], all_pros[j] = all_pros[j], all_pros[i]

    total = await _db.registrations.count_documents(query) + len(ghosts)

    # Get unique countries and types for filters
    countries = await _db.registrations.distinct("country", {"status": "approved", "country": {"$ne": None}})
    ghost_countries = await _db.ghost_profiles.distinct("country", {"active": True})
    all_countries = list(set(countries + ghost_countries))

    types = await _db.registrations.distinct("profile_type", {"status": "approved"})

    return {
        "professionals": all_pros,
        "total": total,
        "filters": {"countries": [c for c in all_countries if c], "types": [t for t in types if t]}
    }


# ═══════════════════════════════════════════════════════════════
# RECOMMANDATIONS — Suggestions basées sur le profil
# ═══════════════════════════════════════════════════════════════
@router.get("/recommendations/{profile_id}")
async def get_recommendations(profile_id: str, limit: int = 10):
    """Recommandations de connexions basées sur le profil"""
    # Get current profile
    profile = await _db.registrations.find_one({"id": profile_id}, {"_id": 0})
    if not profile:
        return {"recommendations": [], "reason": "Profil non trouvé"}

    # Get existing connections
    connections = await _db.pro_connections.find(
        {"$or": [{"from_profile": profile_id}, {"to_profile": profile_id}]},
        {"_id": 0, "from_profile": 1, "to_profile": 1}
    ).to_list(500)

    connected_ids = {profile_id}
    for c in connections:
        connected_ids.add(c["from_profile"])
        connected_ids.add(c["to_profile"])

    # Complementary types mapping
    complementary = {
        "artist": ["label", "booking_agency", "press", "institution"],
        "label": ["artist", "press", "booking_agency"],
        "booking_agency": ["artist", "label", "institution"],
        "institution": ["artist", "label", "press"],
        "press": ["artist", "label", "institution"],
    }

    target_types = complementary.get(profile.get("profile_type", ""), [])

    # Find potential matches
    query = {
        "status": "approved",
        "id": {"$nin": list(connected_ids)},
    }
    if target_types:
        query["profile_type"] = {"$in": target_types}

    candidates = await _db.registrations.find(
        query,
        {"_id": 0, "id": 1, "full_name": 1, "profile_type": 1, "organization_name": 1,
         "country": 1, "image": 1, "bio": 1, "expertise_tags": 1}
    ).limit(limit * 2).to_list(limit * 2)

    # Score and rank
    scored = []
    user_tags = set(profile.get("expertise_tags", []) or [])
    user_country = profile.get("country", "")

    for c in candidates:
        score = 0
        reasons = []

        # Same country bonus
        if c.get("country") == user_country and user_country:
            score += 3
            reasons.append("Même territoire")

        # Complementary type bonus
        if c.get("profile_type") in target_types:
            score += 5
            reasons.append(f"Profil complémentaire ({c['profile_type']})")

        # Shared tags bonus
        c_tags = set(c.get("expertise_tags", []) or [])
        shared = user_tags & c_tags
        if shared:
            score += len(shared) * 2
            reasons.append(f"Intérêts communs: {', '.join(list(shared)[:3])}")

        # Has bio bonus (more complete profile)
        if c.get("bio"):
            score += 1

        scored.append({**c, "match_score": score, "reasons": reasons})

    scored.sort(key=lambda x: x["match_score"], reverse=True)

    return {
        "recommendations": scored[:limit],
        "your_type": profile.get("profile_type"),
        "target_types": target_types,
    }
