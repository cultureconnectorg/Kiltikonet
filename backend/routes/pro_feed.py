"""
Unified Pro Feed — LinkedIn-style feed mixing ghost + real content.
Endpoints:
  GET  /api/pro/feed          — Paginated feed
  POST /api/pro/feed/post     — Create a post (real user)
  POST /api/pro/feed/seed     — Generate ghost posts for active profiles
  GET  /api/pro/feed/reels    — Short-form content (TikTok/Reels style)
"""
import os, uuid, secrets, random
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/pro/feed", tags=["pro-feed"])
_db = None

def init_db(db):
    global _db
    _db = db

# ═══════════════════════════════════════════════════════════
# POST TEMPLATES — Ghost content generation
# ═══════════════════════════════════════════════════════════
LINKEDIN_TEMPLATES = [
    {"type": "insight", "templates": [
        "Le marché culturel caribéen représente un potentiel inexploité de {value}M€. Voici pourquoi les investisseurs commencent à s'y intéresser :\n\n1. Croissance de {pct}% du tourisme culturel\n2. Diaspora connectée et engagée\n3. Patrimoine UNESCO reconnu\n\n#CultureConnect #Investissement #Caraïbes",
        "J'ai passé {months} mois à étudier l'écosystème musical antillais. Ce que j'ai découvert va changer notre approche de la distribution :\n\nLe streaming ne capture que {pct}% de la valeur réelle. Le reste est dans le live, le merch, et surtout — la communauté.\n\n#Musique #Innovation #CC2026",
        "Retour d'expérience : comment nous avons multiplié par {mult}x l'engagement de notre communauté culturelle en {months} mois.\n\nLa clé ? L'authenticité. Pas de marketing artificiel, juste des histoires vraies.\n\n#Growth #Culture #Authenticité",
    ]},
    {"type": "question", "templates": [
        "Question pour la communauté :\n\nComment préservez-vous vos traditions culturelles tout en innovant ?\n\nJe travaille sur un projet qui mêle {art} traditionnel et technologie. Vos retours m'intéressent.\n\n#Innovation #Tradition #CC2026",
        "Débat : La tokenisation de la culture est-elle une opportunité ou une menace ?\n\nLes Kilti-Tokens montrent une voie intéressante. Mais jusqu'où peut-on aller ?\n\n#KiltiToken #Blockchain #Culture",
    ]},
    {"type": "announcement", "templates": [
        "Fier·e d'annoncer notre participation à Culture Connect 2026 !\n\nNotre équipe présentera {project} — un projet qui réunit {count} artistes de {regions} pays.\n\nRendez-vous en Martinique.\n\n#CC2026 #Kiltikonet #Culture",
        "Nouveau milestone : {count} créateurs ont rejoint notre plateforme ce mois-ci.\n\nChaque jour, la communauté grandit. Chaque jour, la culture caribéenne rayonne un peu plus.\n\nMerci à vous tous. Annou kontinié ! 🏝\n\n#Kiltikonet #Communauté",
    ]},
    {"type": "story", "templates": [
        "Il y a {years} ans, ma grand-mère me racontait des contes créoles au clair de lune.\n\nAujourd'hui, je digitalise ces histoires pour que mes enfants les découvrent. La technologie au service de la mémoire.\n\nQui d'autre porte cet héritage ?\n\n#Patrimoine #Créole #Mémoire",
        "De Fort-de-France à {city} : mon parcours d'artiste caribéen dans le monde.\n\nLes défis ? La visibilité. Les opportunités ? Infinies quand on est connecté à sa communauté.\n\nCC2026 change la donne.\n\n#Artiste #Diaspora #CC2026",
    ]},
    {"type": "tip", "templates": [
        "5 conseils pour les créateurs culturels qui veulent vivre de leur art :\n\n1. Construisez votre communauté AVANT de monétiser\n2. Documentez votre processus créatif\n3. Collaborez avec d'autres artistes\n4. Utilisez les KT pour financer vos projets\n5. Racontez VOTRE histoire, pas celle des autres\n\n#Conseils #Créateurs #CC2026",
    ]},
]

REEL_TEMPLATES = [
    {"dimension": "Musique", "titles": [
        "Session studio : nouveau riddim en préparation 🎵",
        "Quand le gwoka rencontre l'électro — fusion unique",
        "Cover créole d'un classique international",
        "Jam session improvisée au marché de Fort-de-France",
    ]},
    {"dimension": "Arts Visuels & Sceniques", "titles": [
        "Time-lapse : création d'une fresque murale caribéenne",
        "Danse traditionnelle revisitée — chorégraphie moderne",
        "Sculpture en bois flotté — de la plage à l'œuvre d'art",
        "Performance live au coucher de soleil",
    ]},
    {"dimension": "Gastronomie", "titles": [
        "Recette secrète : le colombo de ma grand-mère",
        "Street food martiniquaise — les incontournables",
        "Cocktail ti-punch revisité — mixologie créole",
        "Dégustation à l'aveugle : épices caribéennes",
    ]},
    {"dimension": "Patrimoine & Traditions", "titles": [
        "Les ruines de Saint-Pierre — mémoire vivante",
        "Conte créole du soir — la légende de Manman Dlo",
        "Carnaval 2026 — préparation des costumes",
        "Artisanat traditionnel : vannerie de Sainte-Anne",
    ]},
    {"dimension": "Langue Creole", "titles": [
        "Apprenez 5 expressions créoles en 60 secondes",
        "Poésie créole — Aimé Césaire revisité",
        "Le créole dans la tech — termes que vous devez connaître",
        "Chanté Noël — tradition musicale unique",
    ]},
]

CITIES = ["Paris", "Montréal", "New York", "Londres", "Bruxelles", "Miami", "Toronto", "Genève"]
ARTS = ["le gwoka", "la peinture naïve", "la sculpture", "la danse bélé", "le conte créole", "la poterie", "le tissage"]
PROJECTS = ["une galerie numérique immersive", "un festival hybride", "une résidence d'artistes", "un programme de mentorat"]
REGIONS_COUNTS = [(3, 5), (4, 8), (6, 12)]


def _fill_template(tpl: str) -> str:
    rc = random.choice(REGIONS_COUNTS)
    return tpl.format(
        value=random.randint(50, 500),
        pct=random.randint(15, 85),
        months=random.randint(3, 18),
        mult=random.choice([2, 3, 4, 5]),
        art=random.choice(ARTS),
        project=random.choice(PROJECTS),
        count=random.randint(10, 200),
        regions=rc[1],
        years=random.randint(5, 25),
        city=random.choice(CITIES),
    )


async def _generate_batch_posts(count: int = 50):
    """Generate ghost LinkedIn-style posts from active ghost profiles."""
    active = await _db.ghost_profiles_v2.find(
        {"active": True}, {"_id": 0}
    ).to_list(200)
    if not active:
        return 0

    now = datetime.now(timezone.utc)
    posts = []
    for i in range(count):
        author = random.choice(active)
        cat = random.choice(LINKEDIN_TEMPLATES)
        tpl = random.choice(cat["templates"])
        content = _fill_template(tpl)

        # Spread posts over last 72 hours for realism
        post_time = now - timedelta(
            hours=random.randint(0, 72),
            minutes=random.randint(0, 59)
        )

        # Random engagement from other ghosts
        num_likes = random.randint(2, min(35, len(active)))
        likers = random.sample(
            [p["id"] for p in active if p["id"] != author["id"]],
            min(num_likes, len(active) - 1)
        )

        post = {
            "id": f"lnk_{str(uuid.uuid4())[:12]}",
            "author_id": author["id"],
            "author_name": author["full_name"],
            "author_title": author.get("specialty", "Professionnel culturel"),
            "author_image": author.get("image", ""),
            "author_country": author.get("country", ""),
            "content": content,
            "post_type": cat["type"],
            "dimension": random.choice(["Musique", "Arts Visuels & Sceniques", "Patrimoine & Traditions", "Gastronomie", "Langue Creole"]),
            "likes": likers,
            "likes_count": len(likers),
            "comments": [],
            "comments_count": random.randint(0, 8),
            "shares_count": random.randint(0, 5),
            "views_count": random.randint(50, 2000),
            "is_ghost": True,
            "is_reel": False,
            "created_at": post_time.isoformat(),
            "updated_at": post_time.isoformat(),
        }
        posts.append(post)

    if posts:
        await _db.pro_posts.insert_many(posts)
    return len(posts)


async def _generate_batch_reels(count: int = 20):
    """Generate ghost Reel/TikTok content."""
    active = await _db.ghost_profiles_v2.find(
        {"active": True}, {"_id": 0}
    ).to_list(200)
    if not active:
        return 0

    now = datetime.now(timezone.utc)
    reels = []
    for i in range(count):
        author = random.choice(active)
        dim = random.choice(REEL_TEMPLATES)
        title = random.choice(dim["titles"])
        post_time = now - timedelta(hours=random.randint(0, 168), minutes=random.randint(0, 59))

        reel = {
            "id": f"reel_{str(uuid.uuid4())[:12]}",
            "author_id": author["id"],
            "author_name": author["full_name"],
            "author_title": author.get("specialty", "Créateur"),
            "author_image": author.get("image", ""),
            "author_country": author.get("country", ""),
            "content": title,
            "post_type": "reel",
            "dimension": dim["dimension"],
            "duration": f"0:{random.randint(15, 59):02d}",
            "likes": [],
            "likes_count": random.randint(10, 500),
            "comments_count": random.randint(1, 30),
            "shares_count": random.randint(0, 20),
            "views_count": random.randint(200, 10000),
            "is_ghost": True,
            "is_reel": True,
            "created_at": post_time.isoformat(),
            "updated_at": post_time.isoformat(),
        }
        reels.append(reel)

    if reels:
        await _db.pro_posts.insert_many(reels)
    return len(reels)


# ═══════════════════════════════════════════════════════════
# GET /api/pro/feed — Paginated LinkedIn-style feed
# ═══════════════════════════════════════════════════════════
@router.get("")
async def get_pro_feed(
    limit: int = Query(default=20, le=50),
    skip: int = Query(default=0, ge=0),
    post_type: Optional[str] = None,
    dimension: Optional[str] = None,
):
    """Unified LinkedIn-style feed with ghost + real posts."""
    # Auto-seed if empty
    total = await _db.pro_posts.count_documents({"is_reel": {"$ne": True}})
    if total < 10:
        await _generate_batch_posts(60)
        await _generate_batch_reels(25)

    query = {"is_reel": {"$ne": True}}
    if post_type:
        query["post_type"] = post_type
    if dimension:
        query["dimension"] = dimension

    posts = await _db.pro_posts.find(
        query, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    total = await _db.pro_posts.count_documents(query)

    return {
        "posts": posts,
        "total": total,
        "has_more": skip + limit < total,
    }


# ═══════════════════════════════════════════════════════════
# GET /api/pro/feed/reels — Short-form content
# ═══════════════════════════════════════════════════════════
@router.get("/reels")
async def get_reels(
    limit: int = Query(default=15, le=30),
    skip: int = Query(default=0, ge=0),
    dimension: Optional[str] = None,
):
    """TikTok/Reels-style short content feed."""
    query = {"is_reel": True}
    if dimension:
        query["dimension"] = dimension

    # Auto-seed if empty
    total = await _db.pro_posts.count_documents(query)
    if total < 5:
        await _generate_batch_reels(25)

    reels = await _db.pro_posts.find(
        query, {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    total = await _db.pro_posts.count_documents(query)

    return {
        "reels": reels,
        "total": total,
        "has_more": skip + limit < total,
    }


# ═══════════════════════════════════════════════════════════
# POST /api/pro/feed/post — Create a real user post
# ═══════════════════════════════════════════════════════════
class CreatePostBody(BaseModel):
    author_id: str
    content: str
    post_type: str = "insight"
    dimension: str = "Musique"
    is_reel: bool = False

@router.post("/post")
async def create_post(body: CreatePostBody):
    """Create a real user post."""
    user = await _db.registrations.find_one({"id": body.author_id}, {"_id": 0, "full_name": 1, "email": 1, "profile_type": 1, "image": 1})
    if not user:
        raise HTTPException(404, "Utilisateur non trouvé")

    now = datetime.now(timezone.utc)
    post = {
        "id": f"post_{str(uuid.uuid4())[:12]}",
        "author_id": body.author_id,
        "author_name": user.get("full_name", "Utilisateur"),
        "author_title": user.get("profile_type", "Membre"),
        "author_image": user.get("image", ""),
        "content": body.content,
        "post_type": body.post_type,
        "dimension": body.dimension,
        "likes": [],
        "likes_count": 0,
        "comments": [],
        "comments_count": 0,
        "shares_count": 0,
        "views_count": 0,
        "is_ghost": False,
        "is_reel": body.is_reel,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    await _db.pro_posts.insert_one({**post})
    post.pop("_id", None)

    return {"success": True, "post": post}


# ═══════════════════════════════════════════════════════════
# POST /api/pro/feed/like — Like/unlike a post
# ═══════════════════════════════════════════════════════════
@router.post("/like")
async def toggle_like(data: dict):
    """Toggle like on a post."""
    post_id = data.get("post_id")
    user_id = data.get("user_id")
    if not post_id or not user_id:
        raise HTTPException(400, "post_id et user_id requis")

    post = await _db.pro_posts.find_one({"id": post_id}, {"_id": 0, "likes": 1})
    if not post:
        raise HTTPException(404, "Post non trouvé")

    likes = post.get("likes", [])
    if user_id in likes:
        likes.remove(user_id)
        action = "unliked"
    else:
        likes.append(user_id)
        action = "liked"

    await _db.pro_posts.update_one(
        {"id": post_id},
        {"$set": {"likes": likes, "likes_count": len(likes)}}
    )

    return {"success": True, "action": action, "likes_count": len(likes)}


# ═══════════════════════════════════════════════════════════
# POST /api/pro/feed/seed — Manual ghost content generation
# ═══════════════════════════════════════════════════════════
@router.post("/seed")
async def seed_feed_content(data: dict = None):
    """Generate ghost LinkedIn posts + reels."""
    if data is None:
        data = {}
    posts_count = data.get("posts", 60)
    reels_count = data.get("reels", 25)

    p = await _generate_batch_posts(posts_count)
    r = await _generate_batch_reels(reels_count)

    return {"success": True, "posts_created": p, "reels_created": r}
