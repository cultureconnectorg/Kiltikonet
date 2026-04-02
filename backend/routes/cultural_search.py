"""
Cultural Search & Cards Creation — CC2026 Espace Pro
POST /api/cultural-search      — Proxy search (iTunes, Wikipedia)
POST /api/cultural-cards        — Create user card + recalculate score
GET  /api/analytics/cultural-trends
GET  /api/analytics/cultural-profiles
"""
import os
import uuid
import logging
import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(tags=["cultural-search"])

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]

DIMENSIONS = [
    "Musique", "Arts Visuels & Scéniques", "Langue Créole",
    "Patrimoine & Traditions", "Gastronomie",
    "Féminité & Matriarcat", "Identité Diasporique",
]

CARD_TYPES = ["musique", "artiste", "lieu", "evenement", "patrimoine"]

# Default dimension suggestion per card type
DEFAULT_DIMENSION = {
    "musique": "Musique",
    "artiste": "Arts Visuels & Scéniques",
    "lieu": "Patrimoine & Traditions",
    "evenement": "Musique",
    "patrimoine": "Patrimoine & Traditions",
}


# ═══════════════════════════════════════════════════════════════
# POST /api/cultural-search
# ═══════════════════════════════════════════════════════════════
class SearchBody(BaseModel):
    type: str
    query: str


@router.post("/api/cultural-search")
async def cultural_search(body: SearchBody):
    if body.type not in CARD_TYPES:
        raise HTTPException(400, f"Type invalide. Types: {', '.join(CARD_TYPES)}")

    if not body.query or len(body.query.strip()) < 2:
        raise HTTPException(400, "Requête trop courte (min 2 caractères)")

    query = body.query.strip()

    if body.type == "musique":
        return {"results": await _search_itunes(query)}
    elif body.type == "artiste":
        return {"results": await _search_wikipedia(query, "artiste")}
    elif body.type == "lieu":
        return {"results": await _search_wikipedia(query, "lieu")}
    elif body.type == "patrimoine":
        return {"results": await _search_wikipedia(query, "patrimoine")}
    elif body.type == "evenement":
        return {"results": await _search_internal_events(query)}

    return {"results": []}


async def _search_itunes(query: str) -> list:
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(
                "https://itunes.apple.com/search",
                params={"term": query, "media": "music", "limit": 5, "country": "FR"},
            )
            resp.raise_for_status()
            data = resp.json()

        results = []
        for item in data.get("results", []):
            artwork = item.get("artworkUrl100", "")
            artwork_hq = artwork.replace("100x100", "600x600") if artwork else ""

            results.append({
                "id": f"itunes-{item.get('trackId', '')}",
                "titre": item.get("trackName", ""),
                "sous_titre": item.get("artistName", ""),
                "image_url": artwork_hq,
                "preview_url": item.get("previewUrl", ""),
                "source": "itunes",
                "metadata": {
                    "album": item.get("collectionName", ""),
                    "genre": item.get("primaryGenreName", ""),
                    "duration_ms": item.get("trackTimeMillis", 0),
                    "artist_id": item.get("artistId", ""),
                    "track_id": item.get("trackId", ""),
                },
            })
        return results
    except Exception as e:
        logger.error(f"iTunes search error: {e}")
        return []


async def _search_wikipedia(query: str, card_type: str) -> list:
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            # Use Wikipedia search API for multiple results
            resp = await client.get(
                "https://fr.wikipedia.org/w/api.php",
                params={
                    "action": "opensearch",
                    "search": query,
                    "limit": 5,
                    "namespace": 0,
                    "format": "json",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        titles = data[1] if len(data) > 1 else []
        descriptions = data[2] if len(data) > 2 else []

        results = []
        for i, title in enumerate(titles[:5]):
            # Get summary for image
            image_url = ""
            try:
                async with httpx.AsyncClient(timeout=5) as client:
                    summ = await client.get(
                        f"https://fr.wikipedia.org/api/rest_v1/page/summary/{title.replace(' ', '_')}"
                    )
                    if summ.status_code == 200:
                        summ_data = summ.json()
                        image_url = summ_data.get("thumbnail", {}).get("source", "")
            except Exception:
                pass

            results.append({
                "id": f"wiki-{uuid.uuid4().hex[:8]}",
                "titre": title,
                "sous_titre": descriptions[i] if i < len(descriptions) else "",
                "image_url": image_url,
                "preview_url": None,
                "source": "wikipedia",
                "metadata": {
                    "wiki_title": title,
                    "type": card_type,
                },
            })
        return results
    except Exception as e:
        logger.error(f"Wikipedia search error: {e}")
        return []


async def _search_internal_events(query: str) -> list:
    try:
        # Search in cultural_cards for events
        regex = {"$regex": query, "$options": "i"}
        events = await _db.cultural_cards.find(
            {"card_type": "evenement", "$or": [{"title": regex}, {"description": regex}]},
            {"_id": 0},
        ).to_list(5)

        # Also search in registrations/events collections
        reg_events = await _db.events.find(
            {"$or": [{"name": regex}, {"description": regex}]},
            {"_id": 0},
        ).to_list(5)

        results = []
        for ev in events:
            results.append({
                "id": ev.get("id", f"evt-{uuid.uuid4().hex[:8]}"),
                "titre": ev.get("title", ""),
                "sous_titre": ev.get("subtitle", ""),
                "image_url": ev.get("image_url", ""),
                "preview_url": None,
                "source": "internal",
                "metadata": ev.get("meta", {}),
            })

        for ev in reg_events:
            results.append({
                "id": f"evt-{uuid.uuid4().hex[:8]}",
                "titre": ev.get("name", ""),
                "sous_titre": ev.get("description", "")[:100],
                "image_url": ev.get("image_url", ""),
                "preview_url": None,
                "source": "internal",
                "metadata": {"date": ev.get("date", ""), "lieu": ev.get("location", "")},
            })

        return results[:5]
    except Exception as e:
        logger.error(f"Internal events search error: {e}")
        return []


# ═══════════════════════════════════════════════════════════════
# POST /api/cultural-cards — Create a user card
# ═══════════════════════════════════════════════════════════════
class CreateCardBody(BaseModel):
    user_id: str
    type: str
    source_id: Optional[str] = ""
    titre: str
    sous_titre: Optional[str] = ""
    image_url: Optional[str] = ""
    preview_url: Optional[str] = None
    description: Optional[str] = ""
    metadata: Optional[dict] = {}
    dimension_culturelle: Optional[str] = "Musique"


@router.post("/api/cultural-cards")
async def create_cultural_card(body: CreateCardBody):
    if body.type not in CARD_TYPES:
        raise HTTPException(400, f"Type invalide. Types: {', '.join(CARD_TYPES)}")

    dim = body.dimension_culturelle if body.dimension_culturelle in DIMENSIONS else DEFAULT_DIMENSION.get(body.type, "Musique")

    card = {
        "id": f"user-card-{uuid.uuid4().hex[:12]}",
        "card_type": body.type,
        "dimension": dim,
        "title": body.titre,
        "subtitle": body.sous_titre or "",
        "description": body.description or "",
        "image_url": body.image_url or "",
        "preview_url": body.preview_url,
        "meta": body.metadata or {},
        "source_id": body.source_id or "",
        "author_id": body.user_id,
        "is_sponsored": False,
        "sponsor_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if body.type == "musique" and body.preview_url:
        duration_ms = (body.metadata or {}).get("duration_ms", 0)
        if duration_ms:
            secs = duration_ms // 1000
            card["duration"] = f"{secs // 60}:{secs % 60:02d}"

    await _db.cultural_cards.insert_one({**card})

    # Log cultural event (anonymized for monetization)
    await _db.cultural_events.insert_one({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "card_created",
        "card_type": body.type,
        "dimension_culturelle": dim,
        "source_api": _get_source(body.type),
    })

    # Recalculate user score
    score_result = await _recalculate_user_score(body.user_id)

    return {
        "success": True,
        "card": card,
        "score": score_result,
        "message": "Ta carte enrichit la mémoire caribéenne",
    }


def _get_source(card_type: str) -> str:
    return {"musique": "itunes", "artiste": "wikipedia", "lieu": "wikipedia",
            "patrimoine": "wikipedia", "evenement": "internal"}.get(card_type, "unknown")


async def _recalculate_user_score(user_id: str) -> dict:
    from routes.cultural_identity import REACTION_DIMENSION_BOOST, _get_level

    reactions_given = await _db.cultural_reactions.count_documents({"user_id": user_id})
    reactions_received = await _db.cultural_reactions.count_documents({"target_author_id": user_id})
    posts_count = await _db.pro_posts.count_documents({"author_id": user_id})
    cards_count = await _db.cultural_cards.count_documents({"author_id": user_id})

    user_reactions = await _db.cultural_reactions.find(
        {"user_id": user_id}, {"_id": 0, "reaction_type": 1}
    ).to_list(1000)

    dimensions = {dim: 0.0 for dim in DIMENSIONS}

    for reaction in user_reactions:
        rtype = reaction.get("reaction_type", "")
        boosts = REACTION_DIMENSION_BOOST.get(rtype, {})
        for dim_name, value in boosts.items():
            dimensions[dim_name] = min(100, dimensions[dim_name] + value)

    for dim_name in DIMENSIONS:
        dimensions[dim_name] = min(100, dimensions[dim_name] + posts_count * 0.5 + cards_count * 2.0)
        dimensions[dim_name] = min(100, dimensions[dim_name] + reactions_received * 0.3)

    total = sum(dimensions.values())
    score = min(100, round(total / len(DIMENSIONS), 1))
    level = _get_level(score)
    now = datetime.now(timezone.utc).isoformat()

    await _db.cultural_scores.update_one(
        {"user_id": user_id},
        {"$set": {"score": score, "dimensions": dimensions, "level": level,
                  "reactions_given": reactions_given, "reactions_received": reactions_received,
                  "posts_count": posts_count, "cards_count": cards_count, "updated_at": now},
         "$setOnInsert": {"user_id": user_id, "created_at": now}},
        upsert=True,
    )

    return {"score": score, "level": level, "dimensions": dimensions}


# ═══════════════════════════════════════════════════════════════
# Analytics endpoints (admin)
# ═══════════════════════════════════════════════════════════════
analytics_router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@analytics_router.get("/cultural-trends")
async def get_cultural_trends():
    """Tendances culturelles — admin only"""
    pipeline = [
        {"$group": {
            "_id": "$card_type",
            "count": {"$sum": 1},
            "dimensions": {"$push": "$dimension_culturelle"},
        }},
        {"$sort": {"count": -1}},
    ]
    events_by_type = await _db.cultural_events.aggregate(pipeline).to_list(20)

    # Top dimensions
    dim_pipeline = [
        {"$group": {"_id": "$dimension_culturelle", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 7},
    ]
    top_dims = await _db.cultural_events.aggregate(dim_pipeline).to_list(7)

    total_events = await _db.cultural_events.count_documents({})
    total_cards = await _db.cultural_cards.count_documents({})
    total_reactions = await _db.cultural_reactions.count_documents({})

    return {
        "total_events": total_events,
        "total_cards": total_cards,
        "total_reactions": total_reactions,
        "events_by_type": [{k: v for k, v in e.items() if k != "dimensions"} for e in events_by_type],
        "top_dimensions": [{"dimension": d["_id"], "count": d["count"]} for d in top_dims if d["_id"]],
    }


@analytics_router.get("/cultural-profiles")
async def get_cultural_profiles():
    """Profils culturels agrégés — admin only"""
    pipeline = [
        {"$group": {
            "_id": None,
            "avg_score": {"$avg": "$score"},
            "total_users": {"$sum": 1},
            "avg_musique": {"$avg": "$dimensions.Musique"},
            "avg_arts": {"$avg": "$dimensions.Arts Visuels & Scéniques"},
            "avg_creole": {"$avg": "$dimensions.Langue Créole"},
            "avg_patrimoine": {"$avg": "$dimensions.Patrimoine & Traditions"},
            "avg_gastro": {"$avg": "$dimensions.Gastronomie"},
            "avg_feminite": {"$avg": "$dimensions.Féminité & Matriarcat"},
            "avg_diaspora": {"$avg": "$dimensions.Identité Diasporique"},
        }},
    ]
    result = await _db.cultural_scores.aggregate(pipeline).to_list(1)
    if not result:
        return {"total_users": 0, "avg_score": 0, "dimensions_avg": {}}

    r = result[0]
    return {
        "total_users": r.get("total_users", 0),
        "avg_score": round(r.get("avg_score", 0) or 0, 1),
        "dimensions_avg": {
            "Musique": round(r.get("avg_musique", 0) or 0, 1),
            "Arts Visuels & Scéniques": round(r.get("avg_arts", 0) or 0, 1),
            "Langue Créole": round(r.get("avg_creole", 0) or 0, 1),
            "Patrimoine & Traditions": round(r.get("avg_patrimoine", 0) or 0, 1),
            "Gastronomie": round(r.get("avg_gastro", 0) or 0, 1),
            "Féminité & Matriarcat": round(r.get("avg_feminite", 0) or 0, 1),
            "Identité Diasporique": round(r.get("avg_diaspora", 0) or 0, 1),
        },
    }


# ═══════════════════════════════════════════════════════════════
# Sponsored card seed
# ═══════════════════════════════════════════════════════════════
@router.post("/api/cultural-cards/seed-sponsored")
async def seed_sponsored():
    existing = await _db.cultural_cards.find_one({"is_sponsored": True, "sponsor_id": "cc2026"})
    if existing:
        return {"message": "Carte sponsorisée déjà existante"}

    card = {
        "id": "sponsored-cc2026",
        "card_type": "evenement",
        "dimension": "Musique",
        "title": "Culture Connect 2026",
        "subtitle": "20–23 Mai · La Savane · Fort-de-France",
        "description": "Le rendez-vous majeur des industries culturelles caribéennes. Networking, showcases, conférences et expériences immersives.",
        "image_url": "",
        "preview_url": None,
        "meta": {"date": "2026-05-20", "lieu": "Fort-de-France, Martinique", "type_event": "Festival"},
        "is_sponsored": True,
        "sponsor_id": "cc2026",
        "sponsored_position": 5,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await _db.cultural_cards.insert_one({**card})
    return {"success": True, "card_id": card["id"]}
