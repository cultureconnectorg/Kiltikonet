"""
Cultural Identity Engine — CC2026 Espace Pro
POST /api/cultural-identity/{user_id}/recalculate
GET  /api/cultural-identity/{user_id}
GET  /api/cultural-feed
POST /api/cultural-reactions
"""
import os
import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cultural-identity", tags=["cultural-identity"])

_client = AsyncIOMotorClient(os.environ.get("MONGO_URL", ""))
_db = _client[os.environ.get("DB_NAME", "kiltikonet")]

DIMENSIONS = [
    "Musique",
    "Arts Visuels & Scéniques",
    "Langue Créole",
    "Patrimoine & Traditions",
    "Gastronomie",
    "Féminité & Matriarcat",
    "Identité Diasporique",
]

LEVELS = [
    {"name": "Initié", "min": 0, "max": 20},
    {"name": "Ancré", "min": 21, "max": 40},
    {"name": "Enraciné", "min": 41, "max": 60},
    {"name": "Transmetteur", "min": 61, "max": 80},
    {"name": "Pilier", "min": 81, "max": 100},
]

REACTION_TYPES = ["feu", "rythme", "racines", "resistance", "lumiere"]

REACTION_LABELS = {
    "feu": "Feu",
    "rythme": "Rythme",
    "racines": "Racines",
    "resistance": "Résistance",
    "lumiere": "Lumière",
}

REACTION_EMOJIS = {
    "feu": "🔥",
    "rythme": "🥁",
    "racines": "🌺",
    "resistance": "✊",
    "lumiere": "💫",
}

# Dimension weights for reaction types
REACTION_DIMENSION_BOOST = {
    "feu": {"Musique": 2, "Arts Visuels & Scéniques": 1},
    "rythme": {"Musique": 3, "Patrimoine & Traditions": 1},
    "racines": {"Patrimoine & Traditions": 2, "Langue Créole": 1, "Gastronomie": 1},
    "resistance": {"Féminité & Matriarcat": 2, "Identité Diasporique": 2},
    "lumiere": {"Identité Diasporique": 2, "Arts Visuels & Scéniques": 1, "Langue Créole": 1},
}

CARD_TYPES = ["musique", "artiste", "lieu", "evenement", "patrimoine"]


def _get_level(score: float) -> dict:
    score = max(0, min(100, score))
    for level in LEVELS:
        if level["min"] <= score <= level["max"]:
            return {"name": level["name"], "min": level["min"], "max": level["max"]}
    return LEVELS[0]


# ═══════════════════════════════════════════════════════════════
# GET /api/cultural-identity/{user_id}
# ═══════════════════════════════════════════════════════════════
@router.get("/{user_id}")
async def get_cultural_identity(user_id: str):
    """Retourne le score culturel (0-100) + les 7 dimensions"""
    identity = await _db.cultural_scores.find_one(
        {"user_id": user_id}, {"_id": 0}
    )

    if not identity:
        # Initialize with zeros
        identity = {
            "user_id": user_id,
            "score": 0,
            "dimensions": {dim: 0 for dim in DIMENSIONS},
            "level": _get_level(0),
            "reactions_given": 0,
            "reactions_received": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await _db.cultural_scores.insert_one({**identity})

    identity["level"] = _get_level(identity.get("score", 0))
    return identity


# ═══════════════════════════════════════════════════════════════
# POST /api/cultural-identity/{user_id}/recalculate
# ═══════════════════════════════════════════════════════════════
@router.post("/{user_id}/recalculate")
async def recalculate_score(user_id: str):
    """Recalcule le score selon les interactions de l'utilisateur"""

    # Count reactions given by user
    reactions_given = await _db.cultural_reactions.count_documents(
        {"user_id": user_id}
    )

    # Count reactions received on user's content
    reactions_received = await _db.cultural_reactions.count_documents(
        {"target_author_id": user_id}
    )

    # Count posts by user
    posts_count = await _db.pro_posts.count_documents(
        {"author_id": user_id}
    )

    # Get dimension boosts from reactions given
    user_reactions = await _db.cultural_reactions.find(
        {"user_id": user_id}, {"_id": 0, "reaction_type": 1}
    ).to_list(1000)

    dimensions = {dim: 0.0 for dim in DIMENSIONS}

    for reaction in user_reactions:
        rtype = reaction.get("reaction_type", "")
        boosts = REACTION_DIMENSION_BOOST.get(rtype, {})
        for dim, value in boosts.items():
            dimensions[dim] = min(100, dimensions[dim] + value)

    # Boost from posts authored
    for dim in DIMENSIONS:
        dimensions[dim] = min(100, dimensions[dim] + posts_count * 0.5)

    # Boost from reactions received
    for dim in DIMENSIONS:
        dimensions[dim] = min(100, dimensions[dim] + reactions_received * 0.3)

    # Global score = weighted average of dimensions
    total = sum(dimensions.values())
    score = min(100, round(total / len(DIMENSIONS), 1))

    level = _get_level(score)
    now = datetime.now(timezone.utc).isoformat()

    update = {
        "$set": {
            "score": score,
            "dimensions": dimensions,
            "level": level,
            "reactions_given": reactions_given,
            "reactions_received": reactions_received,
            "posts_count": posts_count,
            "updated_at": now,
        },
        "$setOnInsert": {
            "user_id": user_id,
            "created_at": now,
        },
    }

    await _db.cultural_scores.update_one(
        {"user_id": user_id}, update, upsert=True
    )

    return {
        "user_id": user_id,
        "score": score,
        "dimensions": dimensions,
        "level": level,
        "reactions_given": reactions_given,
        "reactions_received": reactions_received,
        "posts_count": posts_count,
    }


# ═══════════════════════════════════════════════════════════════
# GET /api/cultural-feed  (separate prefix to avoid path conflict)
# ═══════════════════════════════════════════════════════════════

# We use a separate router for /api/cultural-feed
feed_router = APIRouter(tags=["cultural-feed"])


@feed_router.get("/api/cultural-feed")
async def get_cultural_feed(
    user_id: Optional[str] = None,
    card_type: Optional[str] = None,
    dimension: Optional[str] = None,
    limit: int = Query(default=20, le=50),
    skip: int = Query(default=0, ge=0),
):
    """Feed non-chronologique basé sur affinités culturelles"""
    query = {}

    if card_type and card_type in CARD_TYPES:
        query["card_type"] = card_type

    if dimension and dimension in DIMENSIONS:
        query["dimension"] = dimension

    # Base feed: get cultural cards
    cards = await _db.cultural_cards.find(
        query, {"_id": 0}
    ).to_list(200)

    # If user_id provided, score cards by affinity
    if user_id:
        identity = await _db.cultural_scores.find_one(
            {"user_id": user_id}, {"_id": 0, "dimensions": 1}
        )
        user_dims = identity.get("dimensions", {}) if identity else {}

        for card in cards:
            card_dim = card.get("dimension", "")
            affinity = user_dims.get(card_dim, 0)
            # Higher affinity = higher ranking, but also boost underexplored dims
            card["_affinity"] = affinity
            # Mix: 60% affinity-based, 40% discovery (inverse)
            card["_rank"] = affinity * 0.6 + (100 - affinity) * 0.4

        cards.sort(key=lambda c: c.get("_rank", 50), reverse=True)

        # Remove internal scoring fields
        for card in cards:
            card.pop("_affinity", None)
            card.pop("_rank", None)
    else:
        # Default: shuffle for discovery
        import random
        random.shuffle(cards)

    # Enrich with reaction counts
    for card in cards:
        card_id = card.get("id", "")
        reactions = await _db.cultural_reactions.find(
            {"card_id": card_id}, {"_id": 0, "reaction_type": 1}
        ).to_list(500)

        reaction_counts = {rt: 0 for rt in REACTION_TYPES}
        for r in reactions:
            rt = r.get("reaction_type", "")
            if rt in reaction_counts:
                reaction_counts[rt] += 1

        card["reactions"] = reaction_counts
        card["total_reactions"] = sum(reaction_counts.values())

    # Inject sponsored cards at every 5th position
    sponsored = await _db.cultural_cards.find(
        {"is_sponsored": True}, {"_id": 0}
    ).to_list(10)

    if sponsored:
        enriched = []
        organic_idx = 0
        for i in range(len(cards) + len(sponsored)):
            if (i + 1) % 6 == 0 and sponsored:
                sp = sponsored.pop(0)
                sp["is_sponsored"] = True
                enriched.append(sp)
            elif organic_idx < len(cards):
                enriched.append(cards[organic_idx])
                organic_idx += 1
        cards = enriched

    paginated = cards[skip:skip + limit]

    return {
        "cards": paginated,
        "total": len(cards),
        "has_more": skip + limit < len(cards),
    }


# ═══════════════════════════════════════════════════════════════
# POST /api/cultural-reactions
# ═══════════════════════════════════════════════════════════════
class ReactionBody(BaseModel):
    user_id: str
    card_id: str
    reaction_type: str
    target_author_id: Optional[str] = None


reactions_router = APIRouter(tags=["cultural-reactions"])


@reactions_router.post("/api/cultural-reactions")
async def add_cultural_reaction(body: ReactionBody):
    """Enregistre une réaction culturelle (5 types)"""
    if body.reaction_type not in REACTION_TYPES:
        raise HTTPException(
            400,
            f"Type de réaction invalide. Types valides: {', '.join(REACTION_TYPES)}",
        )

    # Check if user already reacted with this type on this card
    existing = await _db.cultural_reactions.find_one(
        {
            "user_id": body.user_id,
            "card_id": body.card_id,
            "reaction_type": body.reaction_type,
        }
    )

    if existing:
        # Toggle off: remove reaction
        await _db.cultural_reactions.delete_one({"_id": existing["_id"]})
        return {
            "success": True,
            "action": "removed",
            "reaction_type": body.reaction_type,
            "emoji": REACTION_EMOJIS.get(body.reaction_type, ""),
            "label": REACTION_LABELS.get(body.reaction_type, ""),
        }

    # Insert new reaction
    reaction = {
        "id": str(uuid.uuid4()),
        "user_id": body.user_id,
        "card_id": body.card_id,
        "reaction_type": body.reaction_type,
        "target_author_id": body.target_author_id or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await _db.cultural_reactions.insert_one({**reaction})

    # Get updated counts for this card
    reactions = await _db.cultural_reactions.find(
        {"card_id": body.card_id}, {"_id": 0, "reaction_type": 1}
    ).to_list(500)

    counts = {rt: 0 for rt in REACTION_TYPES}
    for r in reactions:
        rt = r.get("reaction_type", "")
        if rt in counts:
            counts[rt] += 1

    return {
        "success": True,
        "action": "added",
        "reaction_type": body.reaction_type,
        "emoji": REACTION_EMOJIS.get(body.reaction_type, ""),
        "label": REACTION_LABELS.get(body.reaction_type, ""),
        "counts": counts,
        "total": sum(counts.values()),
    }


# ═══════════════════════════════════════════════════════════════
# Seed data preview (does NOT insert — just returns proposed cards)
# ═══════════════════════════════════════════════════════════════
@feed_router.get("/api/cultural-feed/seed-preview")
async def seed_preview():
    """Retourne la liste proposée de cartes culturelles SANS les insérer"""
    return {"cards": SEED_CARDS, "total": len(SEED_CARDS)}


@feed_router.post("/api/cultural-feed/seed")
async def seed_cards():
    """Insère les cartes culturelles pré-approuvées"""
    existing = await _db.cultural_cards.count_documents({})
    if existing > 0:
        return {"message": "Cartes déjà seedées", "count": existing}

    for card in SEED_CARDS:
        card_doc = {**card, "created_at": datetime.now(timezone.utc).isoformat()}
        await _db.cultural_cards.insert_one(card_doc)

    return {"success": True, "inserted": len(SEED_CARDS)}


# ═══════════════════════════════════════════════════════════════
# PROPOSED SEED DATA (awaiting user validation)
# ═══════════════════════════════════════════════════════════════
SEED_CARDS = [
    # --- MUSIQUE (4 cartes) ---
    {
        "id": "card-mus-01",
        "card_type": "musique",
        "dimension": "Musique",
        "title": "Kassav' — Zouk la sé sèl médikaman nou ni",
        "subtitle": "L'hymne fondateur du zouk mondial",
        "description": "Sorti en 1984, ce titre de Kassav' a posé les bases du zouk et reste l'un des morceaux les plus emblématiques de la musique caribéenne.",
        "image_url": "",
        "duration": "4:32",
        "meta": {"genre": "Zouk", "year": "1984", "origin": "Guadeloupe"},
    },
    {
        "id": "card-mus-02",
        "card_type": "musique",
        "dimension": "Musique",
        "title": "Malavoi — Apartheid",
        "subtitle": "Le souffle orchestral martiniquais",
        "description": "Malavoi, orchestre de musique créole fondé en 1969, mêle biguine, mazurka et jazz dans une oeuvre engagée et raffinée.",
        "image_url": "",
        "duration": "5:10",
        "meta": {"genre": "Biguine / Jazz créole", "year": "1988", "origin": "Martinique"},
    },
    {
        "id": "card-mus-03",
        "card_type": "musique",
        "dimension": "Musique",
        "title": "Admiral T — I Am the Admiral",
        "subtitle": "Le dancehall caribéen contemporain",
        "description": "Figure majeure du dancehall guadeloupéen, Admiral T porte la culture créole sur les scènes internationales.",
        "image_url": "",
        "duration": "3:45",
        "meta": {"genre": "Dancehall", "year": "2012", "origin": "Guadeloupe"},
    },
    {
        "id": "card-mus-04",
        "card_type": "musique",
        "dimension": "Musique",
        "title": "Tabou Combo — New York City",
        "subtitle": "Le kompa haïtien qui a conquis le monde",
        "description": "Tabou Combo, groupe fondé en 1968 à Pétion-Ville, a popularisé le kompa direct à travers les Amériques et l'Europe.",
        "image_url": "",
        "duration": "6:20",
        "meta": {"genre": "Kompa", "year": "1975", "origin": "Haïti"},
    },
    # --- ARTISTE (4 cartes) ---
    {
        "id": "card-art-01",
        "card_type": "artiste",
        "dimension": "Arts Visuels & Scéniques",
        "title": "Ronald Selbonne",
        "subtitle": "Peintre et plasticien martiniquais",
        "description": "Artiste majeur de la scène caribéenne, Ronald Selbonne explore l'identité créole à travers la peinture et l'installation.",
        "image_url": "",
        "meta": {"discipline": "Peinture / Installation", "origin": "Martinique"},
    },
    {
        "id": "card-art-02",
        "card_type": "artiste",
        "dimension": "Arts Visuels & Scéniques",
        "title": "Hervé Beuze",
        "subtitle": "Sculpteur et performeur",
        "description": "Hervé Beuze questionne la mémoire et l'espace caribéen à travers des installations monumentales et des performances.",
        "image_url": "",
        "meta": {"discipline": "Sculpture / Performance", "origin": "Martinique"},
    },
    {
        "id": "card-art-03",
        "card_type": "artiste",
        "dimension": "Féminité & Matriarcat",
        "title": "Jocelyne Béroard",
        "subtitle": "La voix du zouk, icône caribéenne",
        "description": "Chanteuse emblématique de Kassav', Jocelyne Béroard incarne la puissance féminine dans la musique antillaise depuis plus de 40 ans.",
        "image_url": "",
        "meta": {"discipline": "Chant / Musique", "origin": "Martinique"},
    },
    {
        "id": "card-art-04",
        "card_type": "artiste",
        "dimension": "Identité Diasporique",
        "title": "Maryse Condé",
        "subtitle": "Grande Dame des lettres caribéennes",
        "description": "Romancière guadeloupéenne, prix Nobel alternatif de littérature 2018, Maryse Condé a exploré la diaspora noire à travers une oeuvre monumentale.",
        "image_url": "",
        "meta": {"discipline": "Littérature", "origin": "Guadeloupe"},
    },
    # --- LIEU (3 cartes) ---
    {
        "id": "card-lieu-01",
        "card_type": "lieu",
        "dimension": "Patrimoine & Traditions",
        "title": "Habitation Clément",
        "subtitle": "Le Francois, Martinique",
        "description": "Ancienne habitation sucrière devenue centre d'art contemporain et distillerie. Un lieu de mémoire et de création au coeur de la Martinique.",
        "image_url": "",
        "meta": {"type_lieu": "Patrimoine / Art", "commune": "Le François", "ile": "Martinique"},
    },
    {
        "id": "card-lieu-02",
        "card_type": "lieu",
        "dimension": "Patrimoine & Traditions",
        "title": "Citadelle Laferrière",
        "subtitle": "Milot, Haïti",
        "description": "Forteresse construite au début du XIXe siècle, classée au patrimoine mondial de l'UNESCO. Symbole de la résistance haïtienne.",
        "image_url": "",
        "meta": {"type_lieu": "Monument historique", "commune": "Milot", "ile": "Haïti"},
    },
    {
        "id": "card-lieu-03",
        "card_type": "lieu",
        "dimension": "Gastronomie",
        "title": "Marché de la Darse",
        "subtitle": "Pointe-à-Pitre, Guadeloupe",
        "description": "Marché aux poissons et épices en bord de mer. Le coeur battant de la gastronomie guadeloupéenne.",
        "image_url": "",
        "meta": {"type_lieu": "Marché", "commune": "Pointe-à-Pitre", "ile": "Guadeloupe"},
    },
    # --- ÉVÉNEMENT (3 cartes) ---
    {
        "id": "card-evt-01",
        "card_type": "evenement",
        "dimension": "Musique",
        "title": "Culture Connect 2026",
        "subtitle": "20-23 Mai 2026 · Parc de La Savane",
        "description": "Le rendez-vous majeur des industries culturelles caribéennes. Networking, showcases, conférences et expériences immersives.",
        "image_url": "",
        "meta": {"date": "2026-05-20", "lieu": "Fort-de-France, Martinique", "type_event": "Festival / Convention"},
    },
    {
        "id": "card-evt-02",
        "card_type": "evenement",
        "dimension": "Arts Visuels & Scéniques",
        "title": "Biennale de la Caraïbe",
        "subtitle": "Art contemporain caribéen",
        "description": "Exposition itinérante réunissant les artistes visuels de l'arc caribéen. Peinture, sculpture, vidéo, installation.",
        "image_url": "",
        "meta": {"date": "2026-11-15", "lieu": "Martinique / Guadeloupe", "type_event": "Biennale"},
    },
    {
        "id": "card-evt-03",
        "card_type": "evenement",
        "dimension": "Langue Créole",
        "title": "Jounen Kwéyol Entènasyonal",
        "subtitle": "28 Octobre — Journée internationale du créole",
        "description": "Célébration mondiale de la langue créole. Ateliers, contes, musique et gastronomie dans toute la Caraïbe.",
        "image_url": "",
        "meta": {"date": "2026-10-28", "lieu": "Toute la Caraïbe", "type_event": "Journée culturelle"},
    },
    # --- MUSIQUE (5e carte ajoutée) ---
    {
        "id": "card-mus-05",
        "card_type": "musique",
        "dimension": "Musique",
        "title": "Jacob Desvarieux — Ou lé",
        "subtitle": "Le guitariste fondateur du zouk",
        "description": "Co-fondateur de Kassav', Jacob Desvarieux a inventé le son du zouk avec sa guitare. Disparu en 2021, il reste le pilier de la musique caribéenne moderne.",
        "image_url": "",
        "duration": "4:15",
        "meta": {"genre": "Zouk", "year": "1985", "origin": "Guadeloupe"},
    },
    # --- PATRIMOINE (3 cartes) ---
    {
        "id": "card-pat-01",
        "card_type": "patrimoine",
        "dimension": "Patrimoine & Traditions",
        "title": "Le Bèlè",
        "subtitle": "Danse-musique-chant des mornes",
        "description": "Tradition musicale et dansée martiniquaise héritée des esclaves. Le bèlè mêle tambour, chant responsorial et danse au sol.",
        "image_url": "",
        "meta": {"categorie": "Danse / Musique traditionnelle", "origin": "Martinique"},
    },
    {
        "id": "card-pat-02",
        "card_type": "patrimoine",
        "dimension": "Gastronomie",
        "title": "Le Colombo",
        "subtitle": "L'épice-identité des Antilles",
        "description": "Mélange d'épices apporté par les travailleurs indiens au XIXe siècle, devenu le plat emblématique de la cuisine antillaise.",
        "image_url": "",
        "meta": {"categorie": "Gastronomie", "origin": "Antilles françaises"},
    },
    {
        "id": "card-pat-03",
        "card_type": "patrimoine",
        "dimension": "Langue Créole",
        "title": "Le Conte Créole — Tim Tim !",
        "subtitle": "Bwa sèk ! — La tradition orale vivante",
        "description": "Art du conteur (kontè) qui transmet sagesse et histoire à travers des récits mêlant humour, morale et créole. Compère Lapin, Ti Jean, Diab la...",
        "image_url": "",
        "meta": {"categorie": "Tradition orale", "origin": "Caraïbe francophone"},
    },
]
