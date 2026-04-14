"""
Unified Pro Feed — LinkedIn-style feed mixing ghost + real content.
Endpoints:
  GET  /api/pro/feed          — Paginated feed
  POST /api/pro/feed/post     — Create a post (real user)
  POST /api/pro/feed/seed     — Generate ghost posts for active profiles
  GET  /api/pro/feed/reels    — Short-form content (TikTok/Reels style)
"""
import os
import uuid
import secrets
import random
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Depends
from pydantic import BaseModel
from routes.doctrine import require_permission

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
        "Le marche culturel caribeen represente un potentiel inexploite de {value}M. Voici pourquoi les investisseurs commencent a s'y interesser :\n\n1. Croissance de {pct}% du tourisme culturel\n2. Diaspora connectee et engagee\n3. Patrimoine UNESCO reconnu\n\n#CultureConnect #Investissement #Caraibes",
        "J'ai passe {months} mois a etudier l'ecosysteme musical antillais. Ce que j'ai decouvert va changer notre approche de la distribution :\n\nLe streaming ne capture que {pct}% de la valeur reelle. Le reste est dans le live, le merch, et surtout — la communaute.\n\n#Musique #Innovation #CC2026",
        "Retour d'experience : comment nous avons multiplie par {mult}x l'engagement de notre communaute culturelle en {months} mois.\n\nLa cle ? L'authenticite. Pas de marketing artificiel, juste des histoires vraies.\n\n#Growth #Culture #Authenticite",
    ]},
    {"type": "question", "templates": [
        "Question pour la communaute :\n\nComment preservez-vous vos traditions culturelles tout en innovant ?\n\nJe travaille sur un projet qui mele {art} traditionnel et technologie. Vos retours m'interessent.\n\n#Innovation #Tradition #CC2026",
    ]},
    {"type": "debate", "templates": [
        "DEBAT : La tokenisation de la culture est-elle une opportunite ou une menace ?\n\nLes Jetons CC montrent une voie interessante. Mais jusqu'ou peut-on aller sans denaturer l'essence meme de la creation ?\n\nJe veux entendre vos arguments. Pour ou contre ?\n\n#KiltiToken #Culture #Debat",
        "DEBAT : Faut-il subventionner la culture ou la rendre autonome ?\n\n{pct}% des artistes caribeeens vivent sous le seuil de pauvrete. Pourtant, la culture genere {value}M annuellement dans la region.\n\nQuelle est la vraie solution ?\n\n#PolitiqueCulturelle #Autonomie",
        "DEBAT : Le creole doit-il devenir langue officielle ?\n\nAvec {pct}% de locuteurs natifs dans les Antilles, la question n'est plus si mais quand.\n\nVotre position ?\n\n#LangueCreole #Identite #Debat",
    ]},
    {"type": "video", "templates": [
        "Nouveau clip disponible — {months} mois de travail, {count} prises, et cette emotion pure qui ne s'invente pas.\n\nRegardez. Partagez. La culture caribeeenne merite d'etre vue.\n\n#NouveauClip #Musique #Caraibes",
        "LIVE REPLAY — {count} personnes ont suivi notre session studio en direct hier.\n\nOn a enregistre un morceau complet en {mult}h. Du gwoka fusion comme vous n'en avez jamais entendu.\n\nLe replay est la.\n\n#LiveSession #Studio #Gwoka",
        "DOCUMENTAIRE — 'Voix de la diaspora' Episode {mult}\n\nQuand {art} rencontre la modernite a {city}. {months} mois de tournage. Des histoires qui meritent d'etre racontees.\n\n#Documentaire #Diaspora #Culture",
    ]},
    {"type": "repost", "templates": [
        "Je partage cet article incroyable sur l'evolution du marche culturel caribeen.\n\n'{count} artistes ont genere {value}M en {months} mois grace au digital.'\n\nLa preuve que notre ecosysteme fonctionne.\n\n#Repost #MarcheCulturel #Digital",
        "A relire absolument — cette analyse du festival de {city} montre exactement pourquoi CC2026 sera different.\n\n{pct}% de satisfaction, {count} exposants, et une energie qu'on ne retrouve nulle part ailleurs.\n\n#FestivalCulturel #CC2026",
    ]},
    {"type": "interview", "templates": [
        "INTERVIEW EXCLUSIVE — Rencontre avec un·e pionnier·e de {art} a {city}.\n\n'La culture caribeeenne est la prochaine frontiere de l'innovation. Dans {years} ans, le monde entier parlera de ce que nous construisons ici.'\n\nLisez l'interview complete.\n\n#Interview #Innovation #Caraibes",
        "3 QUESTIONS A... un·e entrepreneur·e culturel·le qui a tout quitte pour revenir aux Antilles.\n\n'Mon grand-pere disait : la terre ou tu plantes, c'est la qui pousse. J'ai mis {years} ans a comprendre.'\n\n#RetourAuxSources #Entrepreneuriat",
    ]},
    {"type": "institution", "templates": [
        "COMMUNIQUE — Le Conseil Regional a valide un budget de {value}K pour le developpement culturel numerique.\n\n{count} projets seront finances, dont {mult} directement lies a CC2026.\n\nLes candidatures ouvrent le {pct}/01.\n\n#SubventionCulture #RegionMartinique #CC2026",
        "OFFICIEL — Le Ministere de la Culture reconnait kiltikonet comme plateforme de reference pour la diaspora caribeeenne.\n\nUn pas de plus vers la visibilite de nos createurs.\n\n#Reconnaissance #MinistreCulture #Kiltikonet",
        "PARTENARIAT — L'UNESCO et le Festival International des Arts Caribeeens signent un accord de cooperation.\n\n{count} artistes beneficieront d'un accompagnement sur {months} mois.\n\n#UNESCO #Partenariat #ArtsCaribeeens",
    ]},
    {"type": "announcement", "templates": [
        "Fier·e d'annoncer notre participation a Culture Connect 2026 !\n\nNotre equipe presentera {project} — un projet qui reunit {count} artistes de {regions} pays.\n\nRendez-vous en Martinique.\n\n#CC2026 #Kiltikonet #Culture",
        "Nouveau milestone : {count} createurs ont rejoint notre plateforme ce mois-ci.\n\nChaque jour, la communaute grandit. Chaque jour, la culture caribeeenne rayonne un peu plus.\n\nMerci a vous tous. Annou kontinie !\n\n#Kiltikonet #Communaute",
    ]},
    {"type": "story", "templates": [
        "Il y a {years} ans, ma grand-mere me racontait des contes creoles au clair de lune.\n\nAujourd'hui, je digitalise ces histoires pour que mes enfants les decouvrent. La technologie au service de la memoire.\n\nQui d'autre porte cet heritage ?\n\n#Patrimoine #Creole #Memoire",
        "De Fort-de-France a {city} : mon parcours d'artiste caribeen dans le monde.\n\nLes defis ? La visibilite. Les opportunites ? Infinies quand on est connecte a sa communaute.\n\nCC2026 change la donne.\n\n#Artiste #Diaspora #CC2026",
    ]},
    {"type": "tip", "templates": [
        "5 conseils pour les createurs culturels qui veulent vivre de leur art :\n\n1. Construisez votre communaute AVANT de monetiser\n2. Documentez votre processus creatif\n3. Collaborez avec d'autres artistes\n4. Utilisez les Jetons CC pour financer vos projets\n5. Racontez VOTRE histoire, pas celle des autres\n\n#Conseils #Createurs #CC2026",
    ]},
    {"type": "extrait", "templates": [
        "EXTRAIT — Chapitre 3 de mon livre 'Racines & Futur'\n\n'La diaspora n'est pas un exil. C'est un reseau. Chaque ile, chaque ville, chaque communaute est un noeud dans une toile invisible qui pulse au rythme du ka.'\n\n{pct} pages, {months} mois d'ecriture. Sortie prevue avant CC2026.\n\n#Litterature #Diaspora #Livre",
        "EXTRAIT SONORE — Preview de mon prochain album '{art} Session Vol.{mult}'\n\n{count} titres. {months} mois de production entre {city} et Fort-de-France.\n\nPremieres notes ici. L'album complet arrive pour CC2026.\n\n#Preview #Album #Musique",
    ]},
]

# Video thumbnail URLs for video posts (culturally relevant free images)
VIDEO_THUMBNAILS = [
    "https://images.pexels.com/photos/2531728/pexels-photo-2531728.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/1916818/pexels-photo-1916818.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/2747446/pexels-photo-2747446.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/2263410/pexels-photo-2263410.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/1749822/pexels-photo-1749822.jpeg?auto=compress&cs=tinysrgb&w=600",
]

# Pexels free video URLs for reels
REEL_VIDEO_URLS = [
    "https://videos.pexels.com/video-files/3015488/3015488-sd_640_360_24fps.mp4",
    "https://videos.pexels.com/video-files/3571264/3571264-sd_640_360_30fps.mp4",
    "https://videos.pexels.com/video-files/4763824/4763824-sd_640_360_25fps.mp4",
    "https://videos.pexels.com/video-files/5752729/5752729-sd_640_360_25fps.mp4",
    "https://videos.pexels.com/video-files/6010489/6010489-sd_640_360_25fps.mp4",
    "https://videos.pexels.com/video-files/4434242/4434242-sd_640_360_30fps.mp4",
    "https://videos.pexels.com/video-files/4253262/4253262-sd_640_360_25fps.mp4",
    "https://videos.pexels.com/video-files/5547573/5547573-sd_640_360_25fps.mp4",
    "https://videos.pexels.com/video-files/3209211/3209211-sd_640_360_25fps.mp4",
    "https://videos.pexels.com/video-files/5377700/5377700-sd_640_360_25fps.mp4",
]

REEL_THUMBNAILS = [
    "https://images.pexels.com/photos/2531728/pexels-photo-2531728.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/1916818/pexels-photo-1916818.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/2747446/pexels-photo-2747446.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/2263410/pexels-photo-2263410.jpeg?auto=compress&cs=tinysrgb&w=400",
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
            "eclairs": [],
            "eclairs_count": 0,
            "comments": [],
            "comments_count": random.randint(0, 8),
            "shares_count": random.randint(0, 5),
            "views_count": random.randint(50, 2000),
            "is_ghost": True,
            "is_reel": False,
            "created_at": post_time.isoformat(),
            "updated_at": post_time.isoformat(),
        }
        # Add media for video/interview/repost types
        if cat["type"] in ("video", "interview", "extrait"):
            post["thumbnail_url"] = random.choice(VIDEO_THUMBNAILS)
        if cat["type"] == "video":
            post["video_url"] = random.choice(REEL_VIDEO_URLS)
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
            "video_url": random.choice(REEL_VIDEO_URLS),
            "thumbnail_url": random.choice(REEL_THUMBNAILS),
            "likes": [],
            "likes_count": random.randint(10, 500),
            "eclairs": [],
            "eclairs_count": 0,
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
    thumbnail_url: Optional[str] = None

@router.post("/post", dependencies=[Depends(require_permission("publish_content"))])
async def create_post(body: CreatePostBody):
    """Create a real user post."""
    user = await _db.registrations.find_one({"id": body.author_id}, {"_id": 0, "full_name": 1, "email": 1, "profile_type": 1, "image": 1, "frek_id": 1})
    if not user:
        raise HTTPException(404, "Utilisateur non trouvé")

    now = datetime.now(timezone.utc)
    post = {
        "id": f"post_{str(uuid.uuid4())[:12]}",
        "author_id": body.author_id,
        "author_frek_id": user.get("frek_id", ""),
        "author_name": user.get("full_name", "Utilisateur"),
        "author_title": user.get("profile_type", "Membre"),
        "author_image": user.get("image", ""),
        "content": body.content,
        "thumbnail_url": body.thumbnail_url or "",
        "post_type": body.post_type,
        "dimension": body.dimension,
        "likes": [],
        "likes_count": 0,
        "eclairs": [],
        "eclairs_count": 0,
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
@router.post("/like", dependencies=[Depends(require_permission("consume_content"))])
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


# ═══════════════════════════════════════════════════════════
# POST /api/pro/feed/posts/{post_id}/eclair — Éclair (⚡) a post
# Débit 1 KT du wallet de l'utilisateur, crédit 1 KT à l'auteur
# ═══════════════════════════════════════════════════════════
@router.post("/posts/{post_id}/eclair")
async def eclair_post(post_id: str, data: dict):
    """Eclair a post: debit 1 JCC from caller (registrations.jetons_solde), credit 1 JCC to author."""
    user_frek_id = data.get("frek_id")
    if not user_frek_id:
        raise HTTPException(400, "frek_id requis")

    # Find the post
    post = await _db.pro_posts.find_one({"id": post_id}, {"_id": 0, "author_id": 1, "author_frek_id": 1, "eclairs": 1, "eclairs_count": 1})
    if not post:
        raise HTTPException(404, "Post non trouve")

    # Prevent self-eclair
    if user_frek_id == post.get("author_frek_id"):
        raise HTTPException(400, "Impossible d'eclairer son propre post")

    # Check if already eclaired
    eclairs = post.get("eclairs") or []
    if user_frek_id in eclairs:
        raise HTTPException(400, "Deja eclaire")

    # Check caller balance from registrations (the balance users actually see)
    caller_reg = await _db.registrations.find_one({"frek_id": user_frek_id}, {"_id": 0, "jetons_solde": 1, "full_name": 1})
    if not caller_reg:
        raise HTTPException(404, "Utilisateur introuvable")
    if (caller_reg.get("jetons_solde") or 0) < 1:
        raise HTTPException(402, "Solde JCC insuffisant — rechargez votre wallet")

    now = datetime.now(timezone.utc).isoformat()

    # Debit 1 JCC from caller
    await _db.registrations.update_one(
        {"frek_id": user_frek_id},
        {"$inc": {"jetons_solde": -1}}
    )

    # Credit 1 JCC to author (if they have a registration)
    author_frek_id = post.get("author_frek_id") or ""
    if author_frek_id and not author_frek_id.startswith("ghost_"):
        await _db.registrations.update_one(
            {"frek_id": author_frek_id},
            {"$inc": {"jetons_solde": 1}}
        )

    # Update post eclairs
    eclairs.append(user_frek_id)
    await _db.pro_posts.update_one(
        {"id": post_id},
        {"$set": {"eclairs": eclairs, "eclairs_count": len(eclairs)}}
    )

    # Audit log
    await _db.audit_logs.insert_one({
        "action": "FEED_ECLAIR",
        "actor_frek_id": user_frek_id,
        "target_frek_id": author_frek_id,
        "post_id": post_id,
        "jcc_amount": 1,
        "timestamp": now,
    })

    # Push notification to post author
    try:
        from routes.push_notifications import send_event_push
        caller_name = (caller_reg or {}).get("full_name") or user_frek_id
        if author_frek_id:
            await send_event_push("FEED_ECLAIR", author_frek_id, actor_name=caller_name)
    except Exception:
        pass

    # Return updated count + new balance
    updated_reg = await _db.registrations.find_one({"frek_id": user_frek_id}, {"_id": 0, "jetons_solde": 1})
    return {
        "success": True,
        "eclairs_count": len(eclairs),
        "new_balance_jcc": (updated_reg or {}).get("jetons_solde", 0),
    }


# ═══════════════════════════════════════════════════════════
# GET  /api/pro/feed/posts/{post_id}/comments — Get comments
# POST /api/pro/feed/posts/{post_id}/comment  — Add comment
# ═══════════════════════════════════════════════════════════

@router.delete("/posts/{post_id}")
async def delete_post(post_id: str, author_id: str):
    """Delete a post — only the original author can delete their own post."""
    if not post_id or not author_id:
        raise HTTPException(400, "post_id et author_id requis")
    result = await _db.pro_posts.delete_one({"id": post_id, "author_id": author_id, "is_ghost": False})
    if result.deleted_count == 0:
        raise HTTPException(404, "Post introuvable ou non autorise")
    return {"success": True, "deleted": post_id}


@router.get("/posts/{post_id}/comments")
async def get_post_comments(post_id: str):
    """Return comments array for a feed post."""
    post = await _db.pro_posts.find_one({"id": post_id}, {"_id": 0, "comments": 1})
    return {"commentaires": (post.get("comments") or []) if post else []}


@router.post("/posts/{post_id}/comment")
async def add_post_comment(post_id: str, data: dict):
    """Append a comment to a feed post."""
    contenu = (data.get("contenu") or "").strip()
    if not contenu:
        raise HTTPException(400, "contenu requis")

    comment = {
        "id": str(uuid.uuid4())[:8],
        "prenom": (data.get("prenom") or "Anonyme").strip(),
        "contenu": contenu,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await _db.pro_posts.update_one(
        {"id": post_id},
        {"$push": {"comments": comment}, "$inc": {"comments_count": 1}},
    )
    return {"success": True, "comment": comment}
