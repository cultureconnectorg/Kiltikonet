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
    """Récupérer le fil d'actualité (tous les posts ou filtré par connexions)"""
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
        query["author_id"] = {"$in": list(connected_ids)}

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
    return {"success": True, "post": post}


@router.post("/posts/{post_id}/like")
async def toggle_like(post_id: str, profile_id: str):
    """Toggle like sur un post"""
    post = await _db.pro_posts.find_one({"id": post_id}, {"_id": 0, "likes": 1})
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
    """Annuaire professionnel avec recherche avancée"""
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

    total = await _db.registrations.count_documents(query)

    # Get unique countries and types for filters
    countries = await _db.registrations.distinct("country", {"status": "approved", "country": {"$ne": None}})
    types = await _db.registrations.distinct("profile_type", {"status": "approved"})

    return {
        "professionals": professionals,
        "total": total,
        "filters": {"countries": [c for c in countries if c], "types": [t for t in types if t]}
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
