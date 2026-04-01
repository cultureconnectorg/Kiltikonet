"""
Ghost Population System — CC2026 Espace Pro
Collection: ghost_profiles
20 profils fantômes culturellement authentiques.
Retrait progressif quand de vrais utilisateurs arrivent.
"""
import os
import uuid
import random
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ghost", tags=["ghost-population"])

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]

# ═══════════════════════════════════════════════════════════════
# 20 PROFILS FANTÔMES — Diaspora caribéenne & africaine
# ═══════════════════════════════════════════════════════════════
GHOST_PROFILES_SEED = [
    {
        "id": "ghost_001", "full_name": "Maryse Célimène", "profile_type": "artist",
        "organization_name": "Compagnie Bèlè Nou", "country": "Martinique",
        "bio": "Danseuse bèlè depuis 20 ans. Man ka dansé pou tè-a, pou moun-la, pou nanm nou. Le bèlè est ma prière et mon combat. Formatrice au Sermac.",
        "expertise_tags": ["bèlè", "danse traditionnelle", "patrimoine immatériel", "formation"],
        "frek_id": "FREK-GH-MC01", "cultural_impact_score": 82, "jetons_solde": 25,
        "seeking": "Résidences de création internationales", "offering": "Ateliers bèlè, masterclass",
    },
    {
        "id": "ghost_002", "full_name": "Joël Kancel", "profile_type": "label",
        "organization_name": "Kancel Music Group", "country": "Guadeloupe",
        "bio": "Producteur et arrangeur zouk depuis Pointe-à-Pitre. J'ai vu le zouk naître, grandir, voyager. Aujourd'hui je veux qu'il revienne chez nous avec sa valeur intacte.",
        "expertise_tags": ["zouk", "production musicale", "arrangement", "distribution"],
        "frek_id": "FREK-GH-JK02", "cultural_impact_score": 75, "jetons_solde": 30,
        "seeking": "Artistes zouk nouvelle génération", "offering": "Production, distribution caribéenne",
    },
    {
        "id": "ghost_003", "full_name": "Fabienne Confiant", "profile_type": "artist",
        "organization_name": "", "country": "Martinique",
        "bio": "Poétesse et romancière. J'écris en français et en créole martiniquais. La langue créole est un acte de résistance, chaque mot porte la mémoire de nos ancêtres.",
        "expertise_tags": ["littérature créole", "poésie", "écriture", "édition"],
        "frek_id": "FREK-GH-FC03", "cultural_impact_score": 88, "jetons_solde": 20,
        "seeking": "Éditeurs caribéens, traducteurs créole", "offering": "Ateliers d'écriture créole",
    },
    {
        "id": "ghost_004", "full_name": "Thierry Labbé", "profile_type": "artist",
        "organization_name": "Mas Ka Klé", "country": "Guadeloupe",
        "bio": "Tanbouyé gwoka. Lè tanbou-a ka palé, sé nanm-nou ki ka réponn. Le gwoka est notre ADN sonore. 30 ans de pratique, de Sainte-Anne au monde entier.",
        "expertise_tags": ["gwoka", "percussion", "tradition orale", "musique sacrée"],
        "frek_id": "FREK-GH-TL04", "cultural_impact_score": 91, "jetons_solde": 35,
        "seeking": "Festivals internationaux, collaborations intercaribbéennes", "offering": "Concerts gwoka, ateliers ka",
    },
    {
        "id": "ghost_005", "full_name": "Aminata Sow", "profile_type": "other",
        "organization_name": "Afrik'Haute Couture", "country": "Sénégal",
        "bio": "Styliste mode afro-contemporaine. Du wax de Dakar aux podiums de Paris, je crée des ponts textiles entre l'Afrique et sa diaspora. La mode est politique.",
        "expertise_tags": ["mode afro", "stylisme", "wax", "fashion week"],
        "frek_id": "FREK-GH-AS05", "cultural_impact_score": 73, "jetons_solde": 15,
        "seeking": "Distributeurs Caraïbes, collaborations designers", "offering": "Collections capsules, défilés",
    },
    {
        "id": "ghost_006", "full_name": "Kévin Thibault", "profile_type": "artist",
        "organization_name": "", "country": "Guyane",
        "bio": "Rappeur et slameur guyanais. Mes textes parlent de la forêt amazonienne, de Cayenne, de notre identité entre trois continents. Le rap créole existe.",
        "expertise_tags": ["rap caribéen", "slam", "écriture", "performance"],
        "frek_id": "FREK-GH-KT06", "cultural_impact_score": 67, "jetons_solde": 12,
        "seeking": "Scènes ouvertes, producteurs", "offering": "Performances live, ateliers slam jeunesse",
    },
    {
        "id": "ghost_007", "full_name": "Ludivine Pinville", "profile_type": "other",
        "organization_name": "Kaz Kréyol", "country": "Martinique",
        "bio": "Cheffe cuisine créole et ambassadrice du patrimoine culinaire martiniquais. Du blaff au colombo, chaque plat raconte notre histoire de résistance et de créativité.",
        "expertise_tags": ["cuisine créole", "gastronomie", "patrimoine culinaire", "food"],
        "frek_id": "FREK-GH-LP07", "cultural_impact_score": 70, "jetons_solde": 18,
        "seeking": "Partenaires restauration événementielle CC2026", "offering": "Traiteur créole haut de gamme, ateliers",
    },
    {
        "id": "ghost_008", "full_name": "Patrick Zobel", "profile_type": "press",
        "organization_name": "Karib Films", "country": "Martinique",
        "bio": "Réalisateur documentaire. Je filme les Antilles qu'on ne montre jamais : les résistances, les innovations, les créateurs. Notre image nous appartient.",
        "expertise_tags": ["documentaire", "audiovisuel", "réalisation", "production"],
        "frek_id": "FREK-GH-PZ08", "cultural_impact_score": 79, "jetons_solde": 22,
        "seeking": "Financements documentaire, diffuseurs", "offering": "Captation événementielle, documentaires",
    },
    {
        "id": "ghost_009", "full_name": "Nadia Jernidier", "profile_type": "artist",
        "organization_name": "Théâtre Aimé Césaire", "country": "Martinique",
        "bio": "Comédienne et metteuse en scène. Le théâtre créole est vivant. Je mets en scène Césaire, Glissant, Chamoiseau — mais aussi les voix d'aujourd'hui.",
        "expertise_tags": ["théâtre", "mise en scène", "création contemporaine", "littérature"],
        "frek_id": "FREK-GH-NJ09", "cultural_impact_score": 84, "jetons_solde": 20,
        "seeking": "Coproductions théâtrales caribéennes", "offering": "Mise en scène, coaching acteurs",
    },
    {
        "id": "ghost_010", "full_name": "Samuel Gustave", "profile_type": "other",
        "organization_name": "DiaspoTech Ltd", "country": "United Kingdom",
        "bio": "Entrepreneur tech de la diaspora. Depuis Londres, je construis des ponts numériques entre la Caraïbe et le monde. La tech au service de la souveraineté culturelle.",
        "expertise_tags": ["entrepreneuriat diaspora", "tech", "fintech", "innovation"],
        "frek_id": "FREK-GH-SG10", "cultural_impact_score": 71, "jetons_solde": 40,
        "seeking": "Partenaires tech Caraïbes, investisseurs impact", "offering": "Conseil tech, mentoring startups diaspora",
    },
    {
        "id": "ghost_011", "full_name": "Roseline Nilor", "profile_type": "other",
        "organization_name": "Jardin Péyi", "country": "Guadeloupe",
        "bio": "Agricultrice bio et militante de la souveraineté alimentaire. Nou pé nouri kò-nou. La terre guadeloupéenne peut nourrir la Guadeloupe. Je le prouve chaque jour.",
        "expertise_tags": ["agriculture bio", "souveraineté alimentaire", "permaculture", "créole"],
        "frek_id": "FREK-GH-RN11", "cultural_impact_score": 76, "jetons_solde": 15,
        "seeking": "Partenaires distribution circuits courts", "offering": "Produits bio locaux, formations permaculture",
    },
    {
        "id": "ghost_012", "full_name": "Jean-Michel Bossard", "profile_type": "artist",
        "organization_name": "Atelier Bwa Flotté", "country": "Côte d'Ivoire",
        "bio": "Sculpteur sur bois flotté. Mes œuvres voyagent d'Abidjan aux galeries de la Caraïbe. Le bois raconte la même histoire des deux côtés de l'Atlantique.",
        "expertise_tags": ["sculpture", "bois", "art contemporain africain", "installation"],
        "frek_id": "FREK-GH-JB12", "cultural_impact_score": 80, "jetons_solde": 18,
        "seeking": "Galeries caribéennes, résidences artistiques", "offering": "Expositions, sculptures sur commande",
    },
    {
        "id": "ghost_013", "full_name": "Stéphanie Melyon", "profile_type": "artist",
        "organization_name": "Digital Kréol Studio", "country": "France",
        "bio": "Artiste numérique afro-descendante basée à Paris. Je code notre culture en pixels. Art génératif inspiré des motifs madras et des paysages antillais.",
        "expertise_tags": ["art numérique", "NFT", "design", "innovation créative"],
        "frek_id": "FREK-GH-SM13", "cultural_impact_score": 65, "jetons_solde": 22,
        "seeking": "Expositions numériques, galeries Caraïbes", "offering": "Installations numériques, formation art digital",
    },
    {
        "id": "ghost_014", "full_name": "Yannick Grandisson", "profile_type": "artist",
        "organization_name": "Gwoka Fusion Lab", "country": "Guadeloupe",
        "bio": "Musicien gwoka fusion. Je mélange le ka avec l'électronique, le jazz, les rythmes d'Afrique de l'Ouest. Tradition et innovation ne s'opposent pas.",
        "expertise_tags": ["gwoka fusion", "musique électronique", "jazz", "world music"],
        "frek_id": "FREK-GH-YG14", "cultural_impact_score": 78, "jetons_solde": 28,
        "seeking": "Labels world music, festivals fusion", "offering": "Concerts, DJ sets gwoka électro",
    },
    {
        "id": "ghost_015", "full_name": "Christelle Appolinaire", "profile_type": "institution",
        "organization_name": "Guyane Créative", "country": "Guyane",
        "bio": "Directrice de Guyane Créative, incubateur culturel à Cayenne. Nous accompagnons les entrepreneurs culturels guyanais vers l'autonomie économique.",
        "expertise_tags": ["entrepreneuriat culturel", "incubation", "gestion culturelle", "formation"],
        "frek_id": "FREK-GH-CA15", "cultural_impact_score": 85, "jetons_solde": 30,
        "seeking": "Financements européens, partenaires institutionnels", "offering": "Accompagnement projets culturels, mise en réseau",
    },
    {
        "id": "ghost_016", "full_name": "Alioune Diop", "profile_type": "press",
        "organization_name": "Africa Lens", "country": "Sénégal",
        "bio": "Cinéaste documentaire sénégalais. Je documente les liens invisibles entre l'Afrique et sa diaspora caribéenne. Le cinéma comme acte de réconciliation.",
        "expertise_tags": ["cinéma documentaire", "Afrique-Caraïbes", "production", "journalisme"],
        "frek_id": "FREK-GH-AD16", "cultural_impact_score": 74, "jetons_solde": 20,
        "seeking": "Coproductions Afrique-Caraïbes", "offering": "Réalisation documentaire, formation audiovisuelle",
    },
    {
        "id": "ghost_017", "full_name": "Marlène Réno", "profile_type": "artist",
        "organization_name": "Compagnie Mabouya", "country": "Martinique",
        "bio": "Chorégraphe danse contemporaine caribéenne. Mon corps est un territoire. Ma danse est un manifeste. Entre tradition bèlè et danse contemporaine.",
        "expertise_tags": ["danse contemporaine", "chorégraphie", "bèlè contemporain", "création"],
        "frek_id": "FREK-GH-MR17", "cultural_impact_score": 81, "jetons_solde": 16,
        "seeking": "Festivals danse contemporaine, résidences", "offering": "Spectacles, ateliers chorégraphiques",
    },
    {
        "id": "ghost_018", "full_name": "Frédéric Lubin", "profile_type": "artist",
        "organization_name": "Caribe Bass Collective", "country": "Colombie",
        "bio": "DJ et producteur électronique afro-colombien. De Cali à Fort-de-France, je mixe les basses caribéennes avec les rythmes du Pacifique colombien. La musique n'a pas de frontières.",
        "expertise_tags": ["DJ", "musique électronique", "afro-colombien", "bass music"],
        "frek_id": "FREK-GH-FL18", "cultural_impact_score": 69, "jetons_solde": 14,
        "seeking": "Booking festivals Caraïbes et Europe", "offering": "DJ sets, production musicale",
    },
    {
        "id": "ghost_019", "full_name": "Cécile Barthélémy", "profile_type": "artist",
        "organization_name": "", "country": "France",
        "bio": "Peintre afro-caribéenne basée à Marseille. Mes toiles sont des fenêtres ouvertes sur la Martinique de mon enfance. Couleurs tropicales, récits de mémoire.",
        "expertise_tags": ["peinture", "art caribéen", "galerie", "exposition"],
        "frek_id": "FREK-GH-CB19", "cultural_impact_score": 72, "jetons_solde": 19,
        "seeking": "Galeries d'art, collectionneurs caribéens", "offering": "Expositions, œuvres sur commande",
    },
    {
        "id": "ghost_020", "full_name": "Issa Konaté", "profile_type": "artist",
        "organization_name": "Griot Moderne", "country": "Côte d'Ivoire",
        "bio": "Griot et musicien mandingue. Je porte la parole des ancêtres dans le monde moderne. La kora connecte l'Afrique à la Caraïbe à travers la mémoire du son.",
        "expertise_tags": ["musique traditionnelle", "kora", "griot", "tradition orale"],
        "frek_id": "FREK-GH-IK20", "cultural_impact_score": 90, "jetons_solde": 32,
        "seeking": "Collaborations musiciens caribéens", "offering": "Concerts kora, contes musicaux",
    },
]

# ═══════════════════════════════════════════════════════════════
# SEED POSTS — 10+ posts réalistes Français/Créole
# ═══════════════════════════════════════════════════════════════
GHOST_POSTS_SEED = [
    {
        "author_id": "ghost_001", "author_name": "Maryse Célimène",
        "author_type": "artist",
        "content": "Hier soir au Sermac, 40 jeunes ont découvert le bèlè pour la première fois. Quand le tambour a commencé à parler, j'ai vu leurs yeux changer. Yonn pa ni pon moun ki pé di'w sa bèlè ka fè'w si ou pa dansé'y. La transmission continue.\n\n#CC2026 c'est ça : donner à notre jeunesse les outils de sa propre culture. Pas dans un musée. Sur le sol, pieds nus, cœur ouvert.",
        "tags": ["bèlè", "transmission", "jeunesse", "Martinique"],
    },
    {
        "author_id": "ghost_004", "author_name": "Thierry Labbé",
        "author_type": "artist",
        "content": "Sé lè tanbou-a ka palé ki tout bagay ka channjé. 🪘\n\nJe reviens de Sainte-Anne où on a joué gwoka toute la nuit sous les étoiles. Pas de scène, pas de micro, pas de billetterie. Juste le ka, la voix, et le cercle.\n\nC'est ça le gwoka originel. Et c'est ça qu'on doit protéger à CC2026. Pas le gwoka de festival avec lumières LED. Le gwoka du sol, celui qui fait trembler la terre.",
        "tags": ["gwoka", "tradition", "Guadeloupe", "patrimoine"],
    },
    {
        "author_id": "ghost_003", "author_name": "Fabienne Confiant",
        "author_type": "artist",
        "content": "J'ai terminé mon nouveau recueil. 47 poèmes en créole martiniquais. Chak mo sé an grenn sab ki ka rakonté listwa-nou.\n\nLe créole n'est pas un \"dialecte\". C'est une langue née de la résistance. Chaque fois qu'on écrit en créole, on répare un peu le monde.\n\nRecherche éditeur caribéen qui comprend ça. Pas un éditeur parisien qui veut du \"folklore\".",
        "tags": ["littérature", "créole", "édition", "résistance"],
    },
    {
        "author_id": "ghost_010", "author_name": "Samuel Gustave",
        "author_type": "other",
        "content": "Depuis Londres, je vois la diaspora caribéenne créer de la valeur partout — musique, food, tech, mode — mais cette valeur ne revient jamais au pays.\n\nC'est pour ça que j'ai créé DiaspoTech : reconnecter les talents de la diaspora avec les territoires. Le Jeton CC est exactement l'outil qu'il nous faut.\n\n1 Jeton = 1.50€ de valeur culturelle qui RESTE dans l'écosystème. Pas d'extraction. Pas de fuite de capital. La récupération commence.",
        "tags": ["diaspora", "tech", "économie", "jetons"],
    },
    {
        "author_id": "ghost_007", "author_name": "Ludivine Pinville",
        "author_type": "other",
        "content": "Colombo, court-bouillon, blaff, accras, féroce d'avocat... Chaque plat créole est un livre d'histoire.\n\nPour CC2026, je prépare un espace gastronomique immersif. Pas un \"food court\". Une EXPÉRIENCE. Vous allez goûter la Martinique des mornes, des marchés de Fort-de-France, des cuisines de grand-mère.\n\nKi moun ki vlé vin manjé ?! 🍛",
        "tags": ["gastronomie", "cuisine créole", "CC2026", "Martinique"],
    },
    {
        "author_id": "ghost_015", "author_name": "Christelle Appolinaire",
        "author_type": "institution",
        "content": "Guyane Créative a accompagné 12 projets culturels cette année. 8 sont devenus viables économiquement.\n\nLa culture n'est pas un \"coût\". C'est un investissement. Quand on donne aux créateurs les outils de gestion, de marketing, de distribution — ils font le reste.\n\nCC2026 est l'occasion de montrer que la Guyane existe sur la carte culturelle caribéenne. Nous arrivons avec des projets solides.",
        "tags": ["Guyane", "entrepreneuriat", "CC2026", "incubation"],
    },
    {
        "author_id": "ghost_016", "author_name": "Alioune Diop",
        "author_type": "press",
        "content": "Mon nouveau documentaire \"Les Fils de l'Eau\" suit 5 familles entre le Sénégal et la Martinique. La même eau qui a séparé nos ancêtres nous reconnecte aujourd'hui.\n\nJe serai à CC2026 pour la projection. Le film a été tourné en 3 ans, entre Gorée, Saint-Pierre et Fort-de-France.\n\nRecherche partenaires diffusion Caraïbes. Le film doit être vu là où il a été vécu.",
        "tags": ["documentaire", "Afrique-Caraïbes", "cinéma", "mémoire"],
    },
    {
        "author_id": "ghost_014", "author_name": "Yannick Grandisson",
        "author_type": "artist",
        "content": "Gwoka + synthétiseur modulaire = 🔥\n\nNouveau morceau en ligne. Le ka dialogue avec les machines. Les puristes vont crier. Tant mieux.\n\nLe gwoka n'est pas figé dans le passé. Nos ancêtres étaient des innovateurs. Ils ont créé un langage musical à partir de RIEN. Alors moi, je continue d'innover.\n\nÉcoutez. Jugez. Dansez.",
        "tags": ["gwoka", "électronique", "fusion", "innovation"],
    },
    {
        "author_id": "ghost_020", "author_name": "Issa Konaté",
        "author_type": "artist",
        "content": "La kora a 21 cordes. 21 chemins pour raconter la même histoire : celle du départ forcé, de la traversée, de la réinvention.\n\nDepuis Abidjan, je joue pour ceux qui sont partis et ceux qui sont restés. CC2026 sera ma première fois en Martinique. Je viens chercher le son que la mer a emporté.\n\nSi an moun ka konprann sa man ka di — c'est que le lien n'est pas coupé.",
        "tags": ["kora", "Afrique", "Caraïbes", "musique"],
    },
    {
        "author_id": "ghost_011", "author_name": "Roseline Nilor",
        "author_type": "other",
        "content": "Récolte du jour : ignames, patates douces, christophines, giraumons. Tout bio. Tout local. Tout guadeloupéen. 🌱\n\nNou pé nouri kò-nou. On peut se nourrir nous-mêmes. Mais il faut que les restaurants, les hôtels, les événements comme CC2026 s'engagent à acheter LOCAL.\n\nPas des tomates de Rungis. Des tomates de Marie-Galante.\n\nQui est partant pour un CC2026 100% approvisionnement local ?",
        "tags": ["agriculture", "souveraineté alimentaire", "local", "Guadeloupe"],
    },
    {
        "author_id": "ghost_005", "author_name": "Aminata Sow",
        "author_type": "other",
        "content": "Collection \"Retour aux Sources\" — wax sénégalais + madras martiniquais.\n\nDeux tissus. Deux continents. La même histoire.\n\nJe prépare un défilé spécial CC2026 sur la Savane. 15 mannequins de la diaspora. Pas des professionnels. Des vraies personnes. Des corps qui portent l'histoire.\n\nQui veut défiler ? DM ouverts. 🧵",
        "tags": ["mode", "wax", "madras", "défilé"],
    },
    {
        "author_id": "ghost_012", "author_name": "Jean-Michel Bossard",
        "author_type": "artist",
        "content": "Nouvelle installation : \"Traversée\". 7 sculptures en bois flotté récupéré sur les plages d'Assinie et de Grand-Rivière.\n\nLe même océan dépose le même bois des deux côtés. L'Atlantique ne sépare pas — il connecte.\n\nExposition prévue au TOM pendant CC2026. L'art n'a pas besoin de traduction.",
        "tags": ["sculpture", "Côte d'Ivoire", "Martinique", "art"],
    },
]

# ═══════════════════════════════════════════════════════════════
# RETIREMENT THRESHOLDS
# ═══════════════════════════════════════════════════════════════
RETIREMENT_THRESHOLDS = [
    (0, 50, 20),     # 0–50 vrais users → 20 ghosts actifs
    (50, 150, 15),   # 50–150 → 15
    (150, 300, 10),  # 150–300 → 10
    (300, 500, 5),   # 300–500 → 5
    (500, 999999, 0) # 500+ → 0
]


def get_target_ghost_count(real_user_count: int) -> int:
    for low, high, ghosts in RETIREMENT_THRESHOLDS:
        if low <= real_user_count < high:
            return ghosts
    return 0


def ghost_avatar_url(name: str) -> str:
    return f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=4A5D4E&color=F4F1EA&size=256&bold=true"


# ═══════════════════════════════════════════════════════════════
# SEED — Injecter les 20 profils + posts dans MongoDB
# ═══════════════════════════════════════════════════════════════
@router.post("/seed")
async def seed_ghost_profiles():
    """Seed les 20 profils fantômes et leurs posts. Idempotent."""
    existing = await _db.ghost_profiles.count_documents({})
    if existing >= 20:
        return {"success": True, "message": f"{existing} profils fantômes déjà présents", "seeded": False}

    # Clear & reseed
    await _db.ghost_profiles.delete_many({})
    await _db.pro_posts.delete_many({"is_ghost": True})

    now = datetime.now(timezone.utc)
    profiles_to_insert = []
    for p in GHOST_PROFILES_SEED:
        profiles_to_insert.append({
            **p,
            "image": ghost_avatar_url(p["full_name"]),
            "email": f"{p['id']}@ghost.kiltikonet.local",
            "is_ghost": True,
            "active": True,
            "status": "approved",
            "retiring": False,
            "retirement_date": None,
            "created_at": (now - timedelta(days=random.randint(7, 60))).isoformat(),
            "last_activity": now.isoformat(),
            "activity_count": 0,
        })

    await _db.ghost_profiles.insert_many(profiles_to_insert)

    # Seed posts with staggered dates
    posts_to_insert = []
    for i, post_data in enumerate(GHOST_POSTS_SEED):
        ghost = next((p for p in GHOST_PROFILES_SEED if p["id"] == post_data["author_id"]), None)
        if not ghost:
            continue
        days_ago = random.randint(1, 14)
        hours_ago = random.randint(0, 23)
        post_time = now - timedelta(days=days_ago, hours=hours_ago)
        likes_count = random.randint(2, 15)
        ghost_likers = random.sample([g["id"] for g in GHOST_PROFILES_SEED if g["id"] != post_data["author_id"]], min(likes_count, 18))
        posts_to_insert.append({
            "id": f"ghost_post_{i+1:03d}",
            "author_id": post_data["author_id"],
            "author_name": post_data["author_name"],
            "author_image": ghost_avatar_url(post_data["author_name"]),
            "author_type": post_data.get("author_type", "other"),
            "content": post_data["content"],
            "tags": post_data.get("tags", []),
            "likes": ghost_likers,
            "likes_count": len(ghost_likers),
            "comments": [],
            "comments_count": 0,
            "is_ghost": True,
            "created_at": post_time.isoformat(),
        })

    # Add cross-comments between ghost profiles
    comment_templates = [
        ("ghost_004", "Thierry Labbé", "Bèl travay ! Sa ka fè kè-mwen kontan. La tradition vit."),
        ("ghost_003", "Fabienne Confiant", "Magnifique. C'est exactement le genre de projets dont la Caraïbe a besoin."),
        ("ghost_010", "Samuel Gustave", "From London, this is inspiring. Exactly what CC2026 should amplify."),
        ("ghost_001", "Maryse Célimène", "Man ka soutni'w ! Fòs épi kouraj."),
        ("ghost_015", "Christelle Appolinaire", "Guyane Créative soutient ce type d'initiatives. Contactez-nous."),
        ("ghost_020", "Issa Konaté", "Le lien entre l'Afrique et la Caraïbe est plus fort que l'océan."),
    ]

    for post in posts_to_insert:
        num_comments = random.randint(0, 3)
        available = [c for c in comment_templates if c[0] != post["author_id"]]
        chosen = random.sample(available, min(num_comments, len(available)))
        for c_id, c_name, c_content in chosen:
            comment_time = datetime.fromisoformat(post["created_at"]) + timedelta(hours=random.randint(1, 48))
            post["comments"].append({
                "id": str(uuid.uuid4()),
                "author_id": c_id,
                "author_name": c_name,
                "content": c_content,
                "created_at": comment_time.isoformat(),
            })
        post["comments_count"] = len(post["comments"])

    if posts_to_insert:
        await _db.pro_posts.insert_many(posts_to_insert)

    return {
        "success": True,
        "profiles_created": len(profiles_to_insert),
        "posts_created": len(posts_to_insert),
        "seeded": True,
    }


# ═══════════════════════════════════════════════════════════════
# ADMIN — Stats & Controls
# ═══════════════════════════════════════════════════════════════
@router.get("/admin/stats")
async def ghost_admin_stats():
    """Stats fantômes pour le dashboard admin"""
    total_ghosts = await _db.ghost_profiles.count_documents({})
    active_ghosts = await _db.ghost_profiles.count_documents({"active": True, "retiring": False})
    retiring_ghosts = await _db.ghost_profiles.count_documents({"retiring": True})
    retired_ghosts = await _db.ghost_profiles.count_documents({"active": False})
    ghost_posts = await _db.pro_posts.count_documents({"is_ghost": True})
    real_users = await _db.registrations.count_documents({"status": "approved"})
    target_ghosts = get_target_ghost_count(real_users)

    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    posts_this_week = await _db.pro_posts.count_documents({"is_ghost": True, "created_at": {"$gte": week_ago}})

    return {
        "total_ghosts": total_ghosts,
        "active_ghosts": active_ghosts,
        "retiring_ghosts": retiring_ghosts,
        "retired_ghosts": retired_ghosts,
        "ghost_posts_total": ghost_posts,
        "ghost_posts_this_week": posts_this_week,
        "real_users": real_users,
        "target_ghosts": target_ghosts,
        "replacement_rate": f"{retired_ghosts}/{total_ghosts}" if total_ghosts > 0 else "0/0",
        "system_active": active_ghosts > 0,
    }


@router.get("/admin/profiles")
async def ghost_admin_profiles():
    """Liste de tous les profils fantômes pour l'admin"""
    profiles = await _db.ghost_profiles.find({}, {"_id": 0}).sort("full_name", 1).to_list(100)
    return {"profiles": profiles}


@router.post("/admin/toggle")
async def ghost_toggle_system(data: dict):
    """Activer/désactiver tout le système fantôme"""
    activate = data.get("active", False)
    if activate:
        await _db.ghost_profiles.update_many({}, {"$set": {"active": True, "retiring": False}})
    else:
        await _db.ghost_profiles.update_many({}, {"$set": {"active": False}})
    return {"success": True, "system_active": activate}


@router.post("/admin/retire/{ghost_id}")
async def manual_retire_ghost(ghost_id: str):
    """Retirer manuellement un profil fantôme"""
    result = await _db.ghost_profiles.update_one(
        {"id": ghost_id},
        {"$set": {"active": False, "retiring": False, "retirement_date": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Profil fantôme non trouvé")
    return {"success": True, "ghost_id": ghost_id, "status": "retired"}


# ═══════════════════════════════════════════════════════════════
# RETIREMENT ENGINE — Retrait progressif
# ═══════════════════════════════════════════════════════════════
@router.post("/engine/check-retirement")
async def check_retirement():
    """Vérifier et appliquer les retraits progressifs"""
    real_users = await _db.registrations.count_documents({"status": "approved"})
    target = get_target_ghost_count(real_users)
    active = await _db.ghost_profiles.count_documents({"active": True, "retiring": False})

    retired_now = []
    if active > target:
        excess = active - target
        # Retire ghosts with lowest cultural_impact_score first
        to_retire = await _db.ghost_profiles.find(
            {"active": True, "retiring": False},
            {"_id": 0, "id": 1, "full_name": 1, "cultural_impact_score": 1}
        ).sort("cultural_impact_score", 1).limit(excess).to_list(excess)

        for ghost in to_retire:
            await _db.ghost_profiles.update_one(
                {"id": ghost["id"]},
                {"$set": {"retiring": True, "retirement_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()}}
            )
            retired_now.append(ghost["full_name"])

    # Finalize retirements past their date
    now_iso = datetime.now(timezone.utc).isoformat()
    finalized = await _db.ghost_profiles.update_many(
        {"retiring": True, "retirement_date": {"$lte": now_iso}},
        {"$set": {"active": False, "retiring": False}}
    )

    return {
        "real_users": real_users,
        "target_ghosts": target,
        "active_before": active,
        "newly_retiring": retired_now,
        "finalized": finalized.modified_count,
    }


# ═══════════════════════════════════════════════════════════════
# GHOST ACTIVITY — Commentaire auto sur posts réels
# ═══════════════════════════════════════════════════════════════
@router.post("/engine/auto-comment")
async def trigger_ghost_comment(data: dict):
    """Déclenche un commentaire fantôme sur un post réel."""
    post_id = data.get("post_id")
    if not post_id:
        raise HTTPException(status_code=400, detail="post_id requis")

    post = await _db.pro_posts.find_one({"id": post_id}, {"_id": 0})
    if not post or post.get("is_ghost"):
        return {"success": False, "reason": "Post non trouvé ou post fantôme"}

    # Pick a random active ghost
    ghosts = await _db.ghost_profiles.find(
        {"active": True, "retiring": False},
        {"_id": 0}
    ).to_list(20)

    if not ghosts:
        return {"success": False, "reason": "Aucun fantôme actif"}

    ghost = random.choice(ghosts)

    # Generate comment based on post content (use templates for now, CVL BRAIN for enrichment)
    comment_content = await _generate_ghost_comment(post["content"], ghost)

    comment = {
        "id": str(uuid.uuid4()),
        "author_id": ghost["id"],
        "author_name": ghost["full_name"],
        "content": comment_content,
        "is_ghost": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await _db.pro_posts.update_one(
        {"id": post_id},
        {"$push": {"comments": comment}, "$inc": {"comments_count": 1}}
    )

    return {"success": True, "ghost": ghost["full_name"], "comment": comment_content}


async def _generate_ghost_comment(post_content: str, ghost: dict) -> str:
    """Génère un commentaire authentique. Tente CVL BRAIN, fallback templates."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if api_key:
            chat = LlmChat(
                api_key=api_key,
                session_id=str(uuid.uuid4()),
                system_message=f"""Tu es {ghost['full_name']}, {ghost.get('bio', '')}. 
Tu commentes un post sur un réseau professionnel culturel caribéen.
Ton commentaire doit être authentique, court (1-2 phrases max), 
culturellement pertinent. Tu peux écrire en créole si tu es des Antilles.
Ne sois JAMAIS générique. Réagis au contenu spécifique du post.
Ne dis jamais "Super post". Sois toi-même."""
            )
            chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
            msg = UserMessage(text=f"Commente ce post de façon authentique :\n\n{post_content[:500]}")
            response = await chat.send_message(msg)
            if response and len(response.strip()) > 5:
                return response.strip()
    except Exception as e:
        logger.warning(f"CVL BRAIN comment generation failed: {e}")

    # Fallback templates based on ghost's territory
    templates_creole = [
        "Bèl travay ! Sa ka touché kè-mwen.",
        "Fòs épi kouraj ! Kontinié konsa.",
        "Man ka soutni'w. Sa sé an bèl bagay.",
        "Sé konsa nou ké avansé. Ansanm.",
    ]
    templates_fr = [
        f"En tant que {ghost.get('expertise_tags', ['professionnel'])[0]}, ça me parle profondément.",
        "C'est exactement ce dont la communauté a besoin. Bravo.",
        "Je suis touché·e par cette initiative. La Caraïbe avance.",
        "Voilà le genre de projet qui donne du sens à CC2026.",
    ]
    country = ghost.get("country", "")
    if country in ("Martinique", "Guadeloupe", "Guyane"):
        return random.choice(templates_creole + templates_fr)
    return random.choice(templates_fr)


# ═══════════════════════════════════════════════════════════════
# GHOST CONNECTIONS — Envoyer des demandes aux nouveaux
# ═══════════════════════════════════════════════════════════════
@router.post("/engine/welcome-connect")
async def ghost_welcome_connections(data: dict):
    """2-3 fantômes envoient une demande de connexion au nouveau."""
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id requis")

    # Get user profile
    user = await _db.registrations.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return {"success": False, "reason": "Utilisateur non trouvé"}

    # Get active ghosts, prefer similar/complementary types
    ghosts = await _db.ghost_profiles.find(
        {"active": True, "retiring": False},
        {"_id": 0}
    ).to_list(20)

    if not ghosts:
        return {"success": False, "reason": "Aucun fantôme actif"}

    # Score ghosts by compatibility
    user_type = user.get("profile_type", "other")
    complementary = {
        "artist": ["label", "booking_agency", "press", "institution"],
        "label": ["artist", "press"],
        "booking_agency": ["artist", "label"],
        "institution": ["artist", "label", "press"],
        "press": ["artist", "label"],
    }
    target_types = complementary.get(user_type, ["artist", "label", "other"])

    scored = []
    for g in ghosts:
        score = 5 if g["profile_type"] in target_types else 1
        if g["country"] == user.get("country"):
            score += 3
        scored.append((g, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    chosen = [s[0] for s in scored[:random.randint(2, 3)]]

    connections_sent = []
    for ghost in chosen:
        existing = await _db.pro_connections.find_one({
            "$or": [
                {"from_profile": ghost["id"], "to_profile": user_id},
                {"from_profile": user_id, "to_profile": ghost["id"]},
            ]
        })
        if existing:
            continue

        await _db.pro_connections.insert_one({
            "id": str(uuid.uuid4()),
            "from_profile": ghost["id"],
            "to_profile": user_id,
            "from_name": ghost["full_name"],
            "to_name": user.get("full_name", ""),
            "status": "pending",
            "is_ghost": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        connections_sent.append(ghost["full_name"])

    return {"success": True, "connections_sent": connections_sent}


# ═══════════════════════════════════════════════════════════════
# ONBOARDING — 3 questions CVL BRAIN + FREK-ID + 10 Jetons
# ═══════════════════════════════════════════════════════════════
class OnboardingData(BaseModel):
    user_id: str
    cultural_practice: str
    genre_style: str
    cc2026_goal: str


@router.post("/onboarding/complete")
async def complete_onboarding(data: OnboardingData):
    """Complète l'onboarding : évalue, génère FREK-ID, attribue 10 Jetons."""
    # Check registrations first, then cc_badges
    user = await _db.registrations.find_one({"id": data.user_id}, {"_id": 0})
    collection = "registrations"
    if not user:
        user = await _db.cc_badges.find_one({"badge_id": data.user_id}, {"_id": 0})
        collection = "cc_badges"
    if not user:
        # Create a minimal profile for bypass/new users
        user = {
            "id": data.user_id,
            "full_name": "Utilisateur CC2026",
            "jetons_solde": 0,
        }
        await _db.registrations.insert_one({**user, "status": "approved", "onboarding_completed": False})
        collection = "registrations"

    # Generate FREK-ID
    prefix = data.cultural_practice[:3].upper()
    suffix = str(random.randint(1000, 9999))
    frek_id = f"FREK-{prefix}-{suffix}"

    # Calculate cultural impact score
    score = random.randint(45, 75)

    # Try CVL BRAIN evaluation
    brain_analysis = None
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if api_key:
            chat = LlmChat(
                api_key=api_key,
                session_id=str(uuid.uuid4()),
                system_message="""Tu es CVL BRAIN. Évalue ce profil culturel en 2 phrases maximum.
Sois encourageant mais authentique. Mentionne le potentiel de connexion à CC2026.
Réponds en français avec un peu de créole si pertinent."""
            )
            chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
            prompt = f"Pratique : {data.cultural_practice}. Style : {data.genre_style}. Objectif CC2026 : {data.cc2026_goal}. Nom : {user.get('full_name', 'Inconnu')}."
            msg = UserMessage(text=prompt)
            brain_analysis = await chat.send_message(msg)
    except Exception as e:
        logger.warning(f"CVL BRAIN onboarding eval failed: {e}")
        brain_analysis = f"Bienvenue dans l'écosystème CC2026 ! Votre pratique de {data.cultural_practice} enrichit notre communauté. Fòs épi kouraj !"

    if not brain_analysis:
        brain_analysis = f"Bienvenue dans l'écosystème CC2026 ! Votre pratique de {data.cultural_practice} enrichit notre communauté. Fòs épi kouraj !"

    # Update user profile with onboarding data
    update_data = {
        "frek_id": frek_id,
        "cultural_impact_score": score,
        "cultural_practice": data.cultural_practice,
        "genre_style": data.genre_style,
        "cc2026_goal": data.cc2026_goal,
        "onboarding_completed": True,
        "jetons_solde": (user.get("jetons_solde", 0) or 0) + 10,
        "onboarding_date": datetime.now(timezone.utc).isoformat(),
    }

    if collection == "registrations":
        await _db.registrations.update_one({"id": data.user_id}, {"$set": update_data})
    else:
        await _db.cc_badges.update_one({"badge_id": data.user_id}, {"$set": update_data})

    # Trigger ghost welcome connections in background
    asyncio.create_task(_delayed_ghost_welcome(data.user_id))

    return {
        "success": True,
        "frek_id": frek_id,
        "cultural_impact_score": score,
        "jetons_awarded": 10,
        "brain_analysis": brain_analysis,
    }


async def _delayed_ghost_welcome(user_id: str):
    """Envoie des demandes ghost après un délai aléatoire."""
    try:
        await asyncio.sleep(random.randint(10, 60))
        ghosts = await _db.ghost_profiles.find(
            {"active": True, "retiring": False}, {"_id": 0}
        ).to_list(20)
        if not ghosts:
            return
        user = await _db.registrations.find_one({"id": user_id}, {"_id": 0})
        if not user:
            return

        chosen = random.sample(ghosts, min(random.randint(2, 3), len(ghosts)))
        for ghost in chosen:
            existing = await _db.pro_connections.find_one({
                "$or": [
                    {"from_profile": ghost["id"], "to_profile": user_id},
                    {"from_profile": user_id, "to_profile": ghost["id"]},
                ]
            })
            if not existing:
                await _db.pro_connections.insert_one({
                    "id": str(uuid.uuid4()),
                    "from_profile": ghost["id"],
                    "to_profile": user_id,
                    "from_name": ghost["full_name"],
                    "to_name": user.get("full_name", ""),
                    "status": "pending",
                    "is_ghost": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
    except Exception as e:
        logger.error(f"Ghost welcome error: {e}")


# ═══════════════════════════════════════════════════════════════
# JETONS SOLDE — Pour le header Pro
# ═══════════════════════════════════════════════════════════════
@router.get("/jetons/{user_id}")
async def get_user_jetons(user_id: str):
    """Retourne le solde de Jetons CC d'un utilisateur."""
    user = await _db.registrations.find_one({"id": user_id}, {"_id": 0, "jetons_solde": 1, "frek_id": 1})
    if not user:
        user = await _db.cc_badges.find_one({"badge_id": user_id}, {"_id": 0, "jetons_solde": 1, "frek_id": 1})
    if not user:
        return {"jetons_solde": 0, "frek_id": None}
    return {"jetons_solde": user.get("jetons_solde", 0) or 0, "frek_id": user.get("frek_id")}


# ═══════════════════════════════════════════════════════════════
# REWARDS ENGINE — Jetons CC automatiques
# ═══════════════════════════════════════════════════════════════
REWARD_RULES = {
    "first_post": 5,
    "connection_accepted": 3,
    "post_score_70": 10,
    "profile_completed": 15,
    "comment_received": 2,
    "like_received": 1,
}


async def _award_jetons(user_id: str, amount: int, reason: str):
    """Attribue des Jetons CC et logue la transaction."""
    result = await _db.registrations.update_one(
        {"id": user_id},
        {"$inc": {"jetons_solde": amount}}
    )
    if result.modified_count == 0:
        await _db.cc_badges.update_one(
            {"badge_id": user_id},
            {"$inc": {"jetons_solde": amount}}
        )
    await _db.jetons_transactions.insert_one({
        "user_id": user_id,
        "amount": amount,
        "reason": reason,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    logger.info(f"Awarded {amount} Jetons to {user_id}: {reason}")


@router.post("/rewards/trigger")
async def trigger_reward(data: dict):
    """Déclenche une récompense Jetons CC."""
    user_id = data.get("user_id")
    event = data.get("event")
    if not user_id or not event:
        raise HTTPException(status_code=400, detail="user_id et event requis")

    amount = REWARD_RULES.get(event, 0)
    if amount <= 0:
        return {"success": False, "reason": "Événement non récompensé"}

    # Prevent duplicate rewards for one-time events
    if event in ("first_post", "profile_completed"):
        existing = await _db.jetons_transactions.find_one(
            {"user_id": user_id, "reason": {"$regex": event}}
        )
        if existing:
            return {"success": False, "reason": "Récompense déjà attribuée"}

    reason_labels = {
        "first_post": "Premier post publié",
        "connection_accepted": "Connexion acceptée",
        "post_score_70": "Post avec score > 70",
        "profile_completed": "Profil complété",
        "comment_received": "Commentaire reçu",
        "like_received": "Like reçu",
    }

    await _award_jetons(user_id, amount, reason_labels.get(event, event))
    return {"success": True, "amount": amount, "event": event, "reason": reason_labels.get(event, event)}


@router.get("/rewards/history/{user_id}")
async def get_rewards_history(user_id: str):
    """Historique des transactions Jetons CC."""
    transactions = await _db.jetons_transactions.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return {"transactions": transactions}


# ═══════════════════════════════════════════════════════════════
# PRO EMAILS — Templates et envoi
# ═══════════════════════════════════════════════════════════════
async def _send_pro_email(to_email: str, subject: str, html: str):
    """Envoie un email via Resend (l'infrastructure existante)."""
    try:
        import resend
        resend.api_key = os.environ.get("RESEND_API_KEY")
        sender = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
        await asyncio.to_thread(resend.Emails.send, {
            "from": sender,
            "to": [to_email],
            "subject": subject,
            "html": html,
        })
        logger.info(f"Pro email sent to {to_email}: {subject}")
    except Exception as e:
        logger.error(f"Pro email failed to {to_email}: {e}")


def _email_wrapper(content: str) -> str:
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0F0F0F;font-family:'Syne',Helvetica,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;background:#D4A84B;padding:8px 16px;border-radius:8px;">
<span style="color:#000;font-weight:900;font-size:18px;">CC2026</span>
</div>
</div>
{content}
<div style="text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #333;">
<p style="color:#777;font-size:12px;">Culture Connect 2026 · 20–23 Mai · Fort-de-France, Martinique</p>
<p style="color:#777;font-size:12px;">kiltikonet.fr — Espace Pro</p>
</div>
</div></body></html>"""


@router.post("/emails/welcome")
async def send_welcome_email(data: dict):
    """Email de bienvenue Espace Pro."""
    email = data.get("email")
    name = data.get("name", "")
    if not email:
        raise HTTPException(status_code=400, detail="email requis")

    html = _email_wrapper(f"""
<div style="background:#1A1A1A;border:1px solid #333;border-radius:12px;padding:32px;">
<h1 style="color:#D4A84B;font-size:24px;margin:0 0 16px;">Bienvenue dans l'Espace Pro CC2026 !</h1>
<p style="color:#E8E4DC;font-size:16px;line-height:1.6;">Bonjour {name},</p>
<p style="color:#A8A8A8;font-size:16px;line-height:1.6;">
Votre inscription à l'Espace Pro CC2026 est confirmée. Vous faites désormais partie du premier réseau professionnel culturel caribéen.
</p>
<p style="color:#A8A8A8;font-size:16px;line-height:1.6;">
<strong style="color:#D4A84B;">10 Jetons CC</strong> vous ont été offerts pour démarrer.
Chaque Jeton vaut <strong style="color:#D4A84B;">1.50€</strong> dans l'écosystème CC2026.
</p>
<div style="text-align:center;margin:24px 0;">
<a href="https://kiltikonet.fr/espace-pro" style="display:inline-block;background:#D4A84B;color:#000;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:700;font-size:16px;">Accéder à l'Espace Pro</a>
</div>
<p style="color:#777;font-size:14px;">Fòs épi kouraj — CVL BRAIN</p>
</div>""")

    await _send_pro_email(email, "Bienvenue dans l'Espace Pro CC2026", html)
    return {"success": True}


@router.post("/emails/connection-accepted")
async def send_connection_email(data: dict):
    """Email notification connexion acceptée."""
    email = data.get("email")
    name = data.get("name", "")
    connector_name = data.get("connector_name", "")
    if not email:
        raise HTTPException(status_code=400, detail="email requis")

    html = _email_wrapper(f"""
<div style="background:#1A1A1A;border:1px solid #333;border-radius:12px;padding:32px;">
<h2 style="color:#D4A84B;font-size:20px;margin:0 0 16px;">Nouvelle connexion acceptée !</h2>
<p style="color:#E8E4DC;font-size:16px;line-height:1.6;">Bonjour {name},</p>
<p style="color:#A8A8A8;font-size:16px;line-height:1.6;">
<strong style="color:#C4714A;">{connector_name}</strong> a accepté votre demande de connexion.
Vous pouvez maintenant voir ses coordonnées et lui envoyer des messages.
<br/><strong style="color:#D4A84B;">+3 Jetons CC</strong> pour cette connexion.
</p>
<div style="text-align:center;margin:24px 0;">
<a href="https://kiltikonet.fr/espace-pro" style="display:inline-block;background:#D4A84B;color:#000;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:700;">Voir le profil</a>
</div>
</div>""")

    await _send_pro_email(email, f"{connector_name} vous a accepté — Espace Pro CC2026", html)
    return {"success": True}


@router.post("/emails/new-message")
async def send_new_message_email(data: dict):
    """Email notification nouveau message."""
    email = data.get("email")
    name = data.get("name", "")
    sender_name = data.get("sender_name", "")
    if not email:
        raise HTTPException(status_code=400, detail="email requis")

    html = _email_wrapper(f"""
<div style="background:#1A1A1A;border:1px solid #333;border-radius:12px;padding:32px;">
<h2 style="color:#D4A84B;font-size:20px;margin:0 0 16px;">Nouveau message</h2>
<p style="color:#E8E4DC;font-size:16px;line-height:1.6;">Bonjour {name},</p>
<p style="color:#A8A8A8;font-size:16px;line-height:1.6;">
<strong style="color:#C4714A;">{sender_name}</strong> vous a envoyé un message sur l'Espace Pro.
</p>
<div style="text-align:center;margin:24px 0;">
<a href="https://kiltikonet.fr/espace-pro" style="display:inline-block;background:#D4A84B;color:#000;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:700;">Lire le message</a>
</div>
</div>""")

    await _send_pro_email(email, f"Message de {sender_name} — Espace Pro CC2026", html)
    return {"success": True}


# ═══════════════════════════════════════════════════════════════
# CULTURAL IDENTITY ENGINE — 7 dimensions, score en temps réel
# ═══════════════════════════════════════════════════════════════
IDENTITY_DIMENSIONS = ["musique", "danse", "litterature", "gastronomie", "entrepreneuriat", "patrimoine", "diaspora"]

INFLUENCE_LEVELS = [
    (0, 20, "ÉMERGENT", "Tu commences ton voyage"),
    (21, 40, "ANCRÉ", "Tu connais tes racines"),
    (41, 60, "RAYONNANT", "Tu transmets ta culture"),
    (61, 80, "INFLUENT", "Tu façonnes la diaspora"),
    (81, 100, "SOUVERAIN", "Tu es la culture"),
]

REACTION_TYPES = {
    "fire": {"label": "Ça brûle", "emoji": "🔥", "points": 2},
    "tambou": {"label": "Tambou", "emoji": "🥁", "points": 2},
    "bel": {"label": "Bèl", "emoji": "🌺", "points": 2},
    "resistance": {"label": "Résistance", "emoji": "✊", "points": 3},
    "rayonnement": {"label": "Rayonnement", "emoji": "💫", "points": 3},
}

# Map tags to identity dimensions
TAG_TO_DIMENSION = {
    "bèlè": "danse", "danse": "danse", "chorégraphie": "danse", "bèlè contemporain": "danse",
    "zouk": "musique", "gwoka": "musique", "musique": "musique", "kora": "musique",
    "rap caribéen": "musique", "électronique": "musique", "jazz": "musique", "fusion": "musique",
    "littérature": "litterature", "poésie": "litterature", "créole": "litterature", "écriture": "litterature",
    "cuisine créole": "gastronomie", "gastronomie": "gastronomie", "food": "gastronomie",
    "entrepreneuriat": "entrepreneuriat", "tech": "entrepreneuriat", "incubation": "entrepreneuriat",
    "patrimoine": "patrimoine", "tradition": "patrimoine", "mémoire": "patrimoine", "sculpture": "patrimoine",
    "diaspora": "diaspora", "Afrique-Caraïbes": "diaspora", "mode": "diaspora", "wax": "diaspora",
    "agriculture": "gastronomie", "documentaire": "patrimoine", "cinéma": "patrimoine",
    "art": "patrimoine", "peinture": "patrimoine", "théâtre": "litterature",
}


def _get_level(score: int) -> dict:
    for low, high, name, desc in INFLUENCE_LEVELS:
        if low <= score <= high:
            return {"name": name, "description": desc, "min": low, "max": high}
    return {"name": "SOUVERAIN", "description": "Tu es la culture", "min": 81, "max": 100}


@router.get("/identity/{user_id}")
async def get_cultural_identity(user_id: str):
    """Retourne l'identité culturelle complète d'un utilisateur."""
    identity = await _db.cultural_identity.find_one({"user_id": user_id}, {"_id": 0})
    if not identity:
        identity = {
            "user_id": user_id,
            "dimensions": {d: 0 for d in IDENTITY_DIMENSIONS},
            "score": 0,
            "score_today": 0,
            "last_score_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await _db.cultural_identity.insert_one({**identity})

    score = identity.get("score", 0)
    level = _get_level(score)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    score_today = identity.get("score_today", 0) if identity.get("last_score_date") == today else 0

    return {
        "user_id": user_id,
        "dimensions": identity.get("dimensions", {d: 0 for d in IDENTITY_DIMENSIONS}),
        "score": score,
        "score_today": score_today,
        "level": level,
        "reactions_config": REACTION_TYPES,
    }


@router.post("/identity/react")
async def cultural_reaction(data: dict):
    """Enregistre une réaction culturelle et met à jour les scores."""
    user_id = data.get("user_id")
    post_id = data.get("post_id")
    reaction = data.get("reaction")
    if not all([user_id, post_id, reaction]) or reaction not in REACTION_TYPES:
        raise HTTPException(status_code=400, detail="user_id, post_id et reaction valide requis")

    r_config = REACTION_TYPES[reaction]

    # Add reaction to post
    await _db.pro_posts.update_one(
        {"id": post_id},
        {"$addToSet": {f"reactions.{reaction}": user_id}}
    )

    # Get post to find tags and author
    post = await _db.pro_posts.find_one({"id": post_id}, {"_id": 0, "tags": 1, "author_id": 1})
    if not post:
        return {"success": False}

    # Determine which identity dimension this reaction enriches
    dims_to_boost = set()
    for tag in (post.get("tags") or []):
        t_lower = tag.lower()
        if t_lower in TAG_TO_DIMENSION:
            dims_to_boost.add(TAG_TO_DIMENSION[t_lower])
    if not dims_to_boost:
        dims_to_boost.add("patrimoine")

    # Update reactor's identity
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    update_ops = {"$inc": {"score": r_config["points"], "score_today": r_config["points"]}}
    for dim in dims_to_boost:
        update_ops["$inc"][f"dimensions.{dim}"] = r_config["points"]
    update_ops["$set"] = {"last_score_date": today}

    await _db.cultural_identity.update_one(
        {"user_id": user_id},
        update_ops,
        upsert=True
    )

    # Also give points to post author
    if post.get("author_id") and post["author_id"] != user_id:
        await _db.cultural_identity.update_one(
            {"user_id": post["author_id"]},
            {"$inc": {"score": 1, "score_today": 1}, "$set": {"last_score_date": today}},
            upsert=True
        )

    # Get updated identity
    updated = await _db.cultural_identity.find_one({"user_id": user_id}, {"_id": 0})
    new_score = updated.get("score", 0) if updated else r_config["points"]

    return {
        "success": True,
        "reaction": reaction,
        "points_earned": r_config["points"],
        "new_score": new_score,
        "dimensions_boosted": list(dims_to_boost),
        "level": _get_level(new_score),
    }


@router.get("/discovery/feed")
async def discovery_feed(user_id: str = None, limit: int = 20):
    """Feed de découverte intelligent : mélange posts, artistes, événements, patrimoine."""
    cards = []

    # 1) Regular posts from ghost + real
    posts = await _db.pro_posts.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    for p in posts:
        # Determine card subtype from tags
        tags = [t.lower() for t in (p.get("tags") or [])]
        card_type = "post"
        if any(t in tags for t in ["zouk", "gwoka", "bèlè", "musique", "kora", "électronique", "rap caribéen", "jazz"]):
            card_type = "musique"
        elif any(t in tags for t in ["patrimoine", "tradition", "mémoire", "sculpture", "art"]):
            card_type = "patrimoine"

        # Calculate impact hint
        dims_hit = set()
        for tag in tags:
            if tag in TAG_TO_DIMENSION:
                dims_hit.add(TAG_TO_DIMENSION[tag])
        impact_dim = list(dims_hit)[0] if dims_hit else "patrimoine"
        impact_pts = random.randint(2, 6)

        cards.append({
            **p,
            "card_type": card_type,
            "impact_hint": {
                "dimension": impact_dim,
                "points": impact_pts,
                "text": f"Ce contenu enrichit ton empreinte {impact_dim.capitalize()} de +{impact_pts} points"
            },
        })

    # 2) Artist cards from active ghost profiles
    ghosts = await _db.ghost_profiles.find(
        {"active": True, "retiring": False}, {"_id": 0}
    ).to_list(20)
    for g in ghosts[:6]:
        comp_dim = (g.get("expertise_tags") or ["patrimoine"])[0].lower()
        comp_dim = TAG_TO_DIMENSION.get(comp_dim, "patrimoine")
        cards.append({
            "id": f"artist_{g['id']}",
            "card_type": "artiste",
            "full_name": g["full_name"],
            "organization_name": g.get("organization_name", ""),
            "country": g.get("country", ""),
            "profile_type": g.get("profile_type", "artist"),
            "bio": g.get("bio", ""),
            "expertise_tags": g.get("expertise_tags", []),
            "cultural_impact_score": g.get("cultural_impact_score", 50),
            "image": g.get("image", ""),
            "frek_id": g.get("frek_id", ""),
            "seeking": g.get("seeking", ""),
            "offering": g.get("offering", ""),
            "impact_hint": {
                "dimension": comp_dim,
                "points": random.randint(4, 8),
                "text": f"Cet artiste complète ton empreinte {comp_dim.capitalize()} de +{random.randint(4, 8)} points"
            },
            "created_at": g.get("created_at", datetime.now(timezone.utc).isoformat()),
        })

    # 3) CC2026 Event card
    cards.append({
        "id": "cc2026_event",
        "card_type": "evenement",
        "title": "CC2026 — Chimin Savann",
        "description": "20–23 Mai 2026, La Savane, Fort-de-France, Martinique. Le premier sommet culturel caribéen souverain.",
        "date": "2026-05-20T09:00:00",
        "location": "La Savane, Fort-de-France",
        "impact_hint": {
            "dimension": "diaspora",
            "points": 20,
            "text": "Cet événement peut booster ton score de +20"
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # 4) Patrimoine cards (heritage)
    heritage_cards = [
        {
            "id": "heritage_belè",
            "card_type": "patrimoine",
            "title": "Le Bèlè — Danse de résistance",
            "description": "Le bèlè est une danse traditionnelle martiniquaise née dans les plantations. Chaque pas est un acte de liberté, chaque rythme un lien avec l'Afrique.",
            "description_creole": "Bèlè sé an dansé ki sòti adan bitasyon-la. Chak pa sé an lakté libèté.",
            "territory": "Martinique",
            "tags": ["bèlè", "danse", "patrimoine", "tradition"],
            "impact_hint": {"dimension": "danse", "points": 4, "text": "Cette pratique est une racine de la danse caribéenne"},
            "created_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
        },
        {
            "id": "heritage_gwoka",
            "card_type": "patrimoine",
            "title": "Le Gwoka — Patrimoine mondial UNESCO",
            "description": "Inscrit au patrimoine immatériel de l'UNESCO en 2014, le gwoka guadeloupéen est musique, danse et résistance. Le ka parle quand les mots ne suffisent plus.",
            "description_creole": "Gwoka sé mizik, sé dansé, sé rézistans. Lè tanbou ka palé, tout bagay ka channjé.",
            "territory": "Guadeloupe",
            "tags": ["gwoka", "patrimoine", "UNESCO", "musique"],
            "impact_hint": {"dimension": "musique", "points": 5, "text": "Le gwoka enrichit ton empreinte Musique de +5 points"},
            "created_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
        },
        {
            "id": "heritage_madras",
            "card_type": "patrimoine",
            "title": "Le Madras — Tissu de mémoire",
            "description": "Originaire d'Inde, adopté et transformé aux Antilles, le madras est devenu un symbole identitaire caribéen. Chaque couleur, chaque pli raconte une histoire de métissage et de réappropriation culturelle.",
            "territory": "Antilles",
            "tags": ["madras", "patrimoine", "mode", "identité"],
            "impact_hint": {"dimension": "patrimoine", "points": 3, "text": "Le madras est un pilier de l'identité caribéenne"},
            "created_at": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(),
        },
    ]
    cards.extend(heritage_cards)

    # Shuffle intelligently: mix card types but keep some order
    random.shuffle(cards)

    # Put event card near top
    evt_idx = next((i for i, c in enumerate(cards) if c.get("card_type") == "evenement"), None)
    if evt_idx and evt_idx > 3:
        cards.insert(2, cards.pop(evt_idx))

    return {"cards": cards[:limit], "total": len(cards)}
