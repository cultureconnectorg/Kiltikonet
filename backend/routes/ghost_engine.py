"""
Ghost Engine v2 — Growth Engine CC2026 KILTIKONET
=================================================
Moteur de croissance organique avec 4000 profils fantômes progressifs,
11 techniques de growth hacking, et fadeout sur 3 ans.

Architecture :
- generate_population() : Crée 4000 profils à partir de pools caribéens
- generate_timeline()   : Seed 3 ans de contenu (posts, cards, interactions)
- social_validation()   : Auto-engagement sur les posts des vrais utilisateurs
- fadeout_controller()  : Réduction progressive des ghosts à l'arrivée des humains
- growth_techniques     : 11 modules intégrés (rewards, mirroring, etc.)
"""
import os
import uuid
import random
import hashlib
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/growth", tags=["growth-engine"])

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]

# ═══════════════════════════════════════════════════════════
# NAME POOLS — 70% Caribéens réalistes, 30% Institutions
# ═══════════════════════════════════════════════════════════
FIRST_NAMES_F = [
    "Marie-France","Christelle","Nathalie","Mylène","Karine","Stéphanie","Valérie",
    "Fabienne","Sandra","Audrey","Sabrina","Anaïs","Jade","Louisa","Maryse","Sylviane",
    "Régine","Danaé","Maëva","Jessie","Loriane","Tania","Vanessa","Camille","Océane",
    "Corinne","Solange","Lucienne","Roseline","Jocelyne","Gladys","Monique","Yvette",
    "Priscilla","Véronique","Claudine","Martine","Ginette","Francine","Arlette",
    "Guylène","Suzy","Bernadette","Josiane","Danièle","Yolande","Béatrice","Isabelle",
    "Murielle","Patricia","Cécile","Éliane","Huguette","Germaine","Albertine","Renée",
    "Thérèse","Edmonde","Firmine","Léonie","Marcelle","Rolande","Simonne","Agathe",
    "Aminata","Fatou","Awa","Mariama","Kadiatou","Aïssatou","Fatoumata","Hawa",
    "Penda","Binta","Oumou","Salimata","Djeneba","Mariam","Ndeye","Rama","Sokhna",
    "Naomi","Shéryl","Wendy","Kimberley","Samantha","Crystal","Destiny","Ayanna",
]
FIRST_NAMES_M = [
    "Jean-Marc","Patrick","Thierry","Christophe","Joël","Kévin","Stéphane","Yannick",
    "Fabrice","Gérard","Marc-Antoine","Jean-Philippe","Eddy","Frantz","Rudy","Serge",
    "Tony","Ronald","Ange","Ludovic","Teddy","Harry","Steeve","Cédric","Rodrigue",
    "Max","José","Léo","Yohan","Samuel","Pierre-Louis","Olivier","Sylvain","Claude",
    "Éric","Alain","Gilles","Raymond","André","Fernand","Hector","Ismaël","Jocelyn",
    "Damien","Raphaël","Gaël","Mickaël","Bryan","Jordan","Dylan","Axel","Kylian",
    "Alioune","Mamadou","Ousmane","Ibrahima","Moussa","Cheikh","Abdoulaye","Samba",
    "Boubacar","Amadou","Seydou","Diallo","Lamine","Modou","Pape","Thierno","Mady",
    "Dwayne","Tyrone","Marcus","Jamal","Kareem","André-Luc","Jean-Claude","Guy-Albert",
]
LAST_NAMES = [
    "Césaire","Confiant","Chamoiseau","Glissant","Fanon","Zobel","Condé","Pineau",
    "Maximin","Pépin","Bernabé","Ménil","Placoly","Gratiant","Tirolien","Lucrèce",
    "Desportes","Perret","Maniga","Rangon","Larcher","Saint-Cyr","Bélénus","Castra",
    "Fortuné","Galion","Juste","Kancel","Lamy","Marbot","Nardal","Thibault","Labbé",
    "Jernidier","Appolinaire","Pinville","Célimène","Barthélémy","Réno","Melyon",
    "Grandisson","Gustave","Nilor","Bossard","Konaté","Sow","Lubin","Selbonne",
    "Régis","Volmar","Lafleur","Dufresne","Rippon","Jean-Baptiste","Saint-Louis",
    "Noël","Emmanuel","Romélus","Beaubrun","Décius","Auguste","Janvier","Toussaint",
    "Sylvestre","Diop","Ndiaye","Fall","Mbaye","Thiam","Gueye","Sarr","Cissé","Kane",
    "Traoré","Keita","Bah","Barry","Camara","Sylla","Diallo","Touré","Sanogo",
    "Belfort","Moïse","Précieux","Dorival","Butel","Lantin","Gravier","Rosier",
    "Palmiste","Courcier","Mabiala","Moundélé","Ngoma","Bakayoko","Diabaté","Koulibaly",
    "Dembélé","Fofana","Haidara","Coulibaly","Bamba","Sangaré","Ouattara","Sissoko",
]
ORIGINS = [
    ("Martinique", 22), ("Guadeloupe", 18), ("Guyane", 8), ("Haïti", 12),
    ("Sénégal", 6), ("Côte d'Ivoire", 5), ("France", 10), ("United Kingdom", 4),
    ("Canada", 3), ("USA", 3), ("Dominique", 2), ("Sainte-Lucie", 2),
    ("Trinidad", 2), ("Colombie", 1), ("Brésil", 1), ("Barbade", 1),
]
PROFILE_TYPES_INDIV = ["artist", "other", "press"]
PROFILE_TYPES_INSTIT = ["institution", "label", "association", "galerie"]

EXPERTISE_POOLS = {
    "musique": ["zouk","gwoka","biguine","kompa","reggae","dancehall","jazz caribéen","bèlè","mazurka créole","rap caribéen","production musicale","DJ","arrangement"],
    "arts": ["peinture","sculpture","photographie","art numérique","installation","street art","vidéo art","céramique","gravure","art textile"],
    "patrimoine": ["tradition orale","patrimoine immatériel","architecture créole","musée","archives","mémoire","histoire coloniale","créolité"],
    "gastronomie": ["cuisine créole","pâtisserie antillaise","rhum","épices","food","traiteur","restauration","agriculture bio"],
    "litterature": ["poésie","roman","essai","édition","traduction créole","slam","conte","théâtre"],
    "mode": ["stylisme","wax","madras","haute couture","bijouterie","accessoires","mode éthique"],
    "tech": ["développement web","fintech","blockchain","IA","e-commerce","marketing digital"],
    "formation": ["formation professionnelle","éducation culturelle","ateliers","masterclass","mentorat"],
    "audiovisuel": ["documentaire","court-métrage","captation","podcast","radio","journalisme"],
}

BIO_TEMPLATES_INDIV = [
    "Passionné·e de {expertise} depuis {years} ans. {origin_phrase} La culture caribéenne est mon moteur. {seeking_phrase}",
    "{expertise_verb} de {origin}. {philosophy} Je crois en la puissance de notre héritage culturel pour transformer le présent.",
    "Originaire de {origin}, {role} dans le domaine {domain}. {years} ans d'expérience au service de la création caribéenne.",
    "Entre {origin} et le monde, je {action} notre culture. {philosophy} CC2026 est l'occasion de montrer ce dont nous sommes capables.",
    "Man sé an moun {origin}. {creole_phrase} {years} ans que je vis pour {domain}. La transmission est mon combat.",
    "De {origin} vers le monde. {expertise_verb} et {role2}. La diaspora porte en elle une richesse culturelle immense.",
    "Artiste {domain} basé·e à {city}. {philosophy} Chaque œuvre est un pont entre mémoire et innovation.",
    "Créateur·trice {domain} de {origin}. {years} ans à explorer les frontières entre tradition et modernité caribéenne.",
]
BIO_TEMPLATES_INSTIT = [
    "{org_name} — {org_type} culturel·le basé·e à {city}, {origin}. Depuis {years} ans, nous accompagnons les créateurs caribéens.",
    "Structure {org_type} dédiée à la {domain} caribéenne. Basée à {city}, {origin}. {years} ans d'engagement pour la culture.",
    "{org_name} : {org_type} de {origin} spécialisé·e en {domain}. Notre mission : donner aux talents caribéens les moyens de rayonner.",
]
PHILOSOPHIES = [
    "La culture n'est pas un luxe, c'est un droit.","Notre identité est notre force.","Tradition et innovation ne s'opposent pas.",
    "Chaque mot en créole est un acte de résistance.","L'art est notre meilleur ambassadeur.","La diaspora est un pont, pas une rupture.",
    "Nou sé yonn.","La Caraïbe est un continent culturel.","Le patrimoine vit quand on le partage.",
    "La musique est la langue universelle de la Caraïbe.","Sé lè ou konnèt ki koté ou sòti ki ou sav ki koté ou ka alé.",
]
CREOLE_PHRASES = [
    "Man ka travay pou péyi-a.","Nou pé fè sa ansanm.","Sé konsa nou yé.","Fòs épi kouraj.",
    "Kilti-nou sé richès-nou.","An ka bat pou sa man kwè.","Nou pa ka bliyé.","Tjenbé rèd pa moli.",
]
CITIES = {
    "Martinique": ["Fort-de-France","Le Lamentin","Saint-Pierre","Sainte-Anne","Le Robert","Le François"],
    "Guadeloupe": ["Pointe-à-Pitre","Les Abymes","Sainte-Anne","Basse-Terre","Le Gosier","Saint-François"],
    "Guyane": ["Cayenne","Kourou","Matoury","Saint-Laurent-du-Maroni","Rémire-Montjoly"],
    "Haïti": ["Port-au-Prince","Cap-Haïtien","Jacmel","Les Cayes","Jérémie"],
    "Sénégal": ["Dakar","Saint-Louis","Gorée","Thiès","Ziguinchor"],
    "Côte d'Ivoire": ["Abidjan","Yamoussoukro","Grand-Bassam","Bouaké"],
    "France": ["Paris","Marseille","Lyon","Bordeaux","Toulouse","Nantes"],
    "United Kingdom": ["Londres","Birmingham","Manchester","Bristol"],
    "Canada": ["Montréal","Toronto","Ottawa"],
    "USA": ["New York","Miami","Brooklyn","Washington DC"],
    "Dominique": ["Roseau"], "Sainte-Lucie": ["Castries"], "Trinidad": ["Port-of-Spain"],
    "Colombie": ["Cali","Carthagène"], "Brésil": ["Salvador de Bahia","Rio"], "Barbade": ["Bridgetown"],
}
ORG_TYPES = ["association","collectif","label","galerie","centre culturel","incubateur","fondation","compagnie","atelier","studio","école"]
ORG_NAME_PARTS = [
    "Kaz","Lakay","An Ba","Bwa","Mango","Karib","Kréyol","Neg","Péyi","Tanbou",
    "Madras","Gwoka","Bèlè","Mas","Lakou","Véyé","Solèy","Lanmè","Tè","Dlo",
    "Fwi","Kannaval","Matnik","Gwadloup","Ayiti","Afrik","Dyaspora","Kafé","Cho",
]

# ═══════════════════════════════════════════════════════════
# POST CONTENT POOLS — Rich templates for 3 years of content
# ═══════════════════════════════════════════════════════════
POST_TEMPLATES_CULTURE = [
    "Soirée {event_type} incroyable hier soir à {city}. {count} personnes, une énergie folle. {creole} La culture caribéenne est VIVANTE. #CC2026",
    "Nouveau projet en cours : {project}. Après {years} mois de travail, on approche du résultat final. Qui veut voir un aperçu ? 🎨",
    "Retour de {place}. Inspiré·e comme jamais. Les rencontres avec les artistes locaux m'ont rappelé pourquoi je fais ce métier. {philosophy}",
    "Atelier {domain} ce week-end à {city}. {count} participant·e·s, tous·tes passionné·e·s. La transmission fonctionne quand on y met du cœur. {creole}",
    "Je viens de terminer {work}. {years} mois de création. C'est mon œuvre la plus personnelle. Elle parle de {origin}, de mémoire, de résilience.",
    "Question pour la communauté : comment préserver {tradition} tout en l'ouvrant au monde contemporain ? Je cherche cet équilibre depuis {years} ans.",
    "Collaboration avec {partner_name} — un·e artiste de {partner_origin}. Quand {origin} rencontre {partner_origin}, la magie opère. Résultat bientôt !",
    "{city}, {hour}h du matin. {ambiance}. C'est dans ces moments que je comprends pourquoi notre culture est unique. {creole}",
    "Lu / Vu / Écouté cette semaine : {reference}. Si vous ne connaissez pas, c'est le moment. Notre patrimoine a besoin qu'on le partage.",
    "Merci à tou·te·s ceux·celles qui ont soutenu {project} avec leurs Jetons CC. {count} JCC récoltés ! Votre soutien fait la différence.",
    "Journée de résidence à {place}. Travail sur {work}. Le calme de cet endroit est propice à la création. Parfois il faut se retirer pour mieux donner.",
    "{domain} caribéen·ne : pas du folklore, pas de l'exotisme. De l'ART. De la CRÉATION. De la PENSÉE. Quand est-ce qu'on va enfin le comprendre ?",
    "Mon coup de cœur de la semaine : {reference}. {opinion}. Allez voir / écouter / lire, vous ne serez pas déçu·e·s.",
    "Préparation CC2026 : J-{days}. Mon projet {project} avance bien. {progress}. Vivement mai 2026 à Fort-de-France !",
]
POST_TEMPLATES_EVENTS = [
    "📅 Save the date : {event_name} le {date} à {city}. {description}. Billets bientôt disponibles sur KILTIKONET.",
    "Retour sur {event_name} de la semaine dernière. {count} artistes, {count2} spectateur·trice·s, et des moments inoubliables. Vidéo récap' bientôt !",
    "Recherche bénévoles pour {event_name} ({date}, {city}). Si tu crois en la culture caribéenne et que tu veux contribuer, contacte-moi !",
]
POST_TEMPLATES_COLLAB = [
    "Recherche {role} pour un projet {domain} entre {origin} et {partner_origin}. Budget validé, deadline CC2026. DM ouverts. 📩",
    "Qui connaît un·e bon·ne {role} à {city} ? Projet {domain} en cours, besoin urgent. La communauté KILTIKONET est mon premier réflexe.",
    "Proposition de collaboration ouverte : j'offre mon expertise en {domain}, je cherche un·e partenaire en {partner_domain}. Construisons ensemble !",
]
COMMENT_TEMPLATES_POSITIVE = [
    "Magnifique ! Fòs épi kouraj 🔥","Bèl travay ! La Caraïbe a besoin de ça.","Trop inspirant·e, merci pour ce partage.",
    "C'est exactement ce genre de projets qui fait avancer notre culture.","Respect total. Continue comme ça.",
    "Man ka soutni'w ! 💪","From {origin}, this is incredible. Big up !","Ça donne envie d'en faire plus. Merci.",
    "La relève est là. Notre culture est entre de bonnes mains.","Wow, j'ai des frissons. Merci pour ce moment.",
    "C'est pour ça que KILTIKONET existe. Pour connecter des gens comme nous.","Partagé ! Il faut que plus de monde voit ça.",
    "Question : tu fais des ateliers ? J'aimerais apprendre.","Collaboration possible ? Je t'envoie un message.",
    "Exactement ! Notre culture n'est pas du folklore, c'est de l'art vivant.","Bravo pour la démarche. Soutien total.",
    "J'étais là, c'était magique. Vivement la prochaine.","Ce projet mérite plus de visibilité. Je partage.",
]
EVENT_TYPES = ["gwoka","bèlè","zouk","kompa","spoken word","jam session","vernissage","dégustation","lecture","projection","atelier"]
PROJECTS = [
    "un documentaire sur la mémoire du gwoka","un album de zouk acoustique","une exposition sur le madras contemporain",
    "un festival itinérant dans les mornes","un recueil de poésie trilingue","une collection capsule afro-caribéenne",
    "un livre de recettes créoles oubliées","un court-métrage sur la diaspora","un podcast sur l'histoire coloniale",
    "une application de patrimoine en réalité augmentée","un atelier mobile de percussion","un marché artisanal éphémère",
]
WORKS = [
    "mon nouveau morceau","ma dernière toile","mon recueil de poèmes","mon court-métrage","ma collection",
    "mon documentaire","ma sculpture","mon installation","ma chorégraphie","mon roman","ma mixtape","mon portfolio",
]
AMBIANCES = [
    "Le soleil se lève sur la baie","Les mornes sont encore dans la brume","Le marché s'éveille doucement",
    "Le son du ka résonne au loin","L'odeur du café créole remplit l'air","La pluie tropicale tambourine sur les tôles",
]
REFERENCES = [
    "Aimé Césaire — Cahier d'un retour au pays natal","Maryse Condé — Moi, Tituba","Patrick Chamoiseau — Texaco",
    "Kassav' — Zouk la sé sèl médikaman","Édouard Glissant — Traité du Tout-Monde","Frantz Fanon — Peau noire, masques blancs",
    "Malavoi — Matébis","E.T. Mensah — Day by Day","Jocelyne Béroard — Siwo","Ralph Thamar — Caraïbes",
]

# ═══════════════════════════════════════════════════════════
# PROFILE GENERATOR
# ═══════════════════════════════════════════════════════════
def _pick_origin():
    """Weighted random origin."""
    total = sum(w for _, w in ORIGINS)
    r = random.randint(1, total)
    acc = 0
    for name, w in ORIGINS:
        acc += w
        if r <= acc:
            return name
    return "Martinique"

def _gen_org_name():
    parts = random.sample(ORG_NAME_PARTS, 2)
    suffix = random.choice(["Lab","Studio","Collective","Productions","Network","House","Space","Academy","Factory"])
    return f"{parts[0]} {parts[1]} {suffix}" if random.random() > 0.5 else f"{parts[0]}'{parts[1]}"

def _avatar_url(name, idx):
    colors = ["4A5D4E","C4714A","5B9BD5","8B5CF6","2DD4BF","E85A4F","E8D5A0"]
    bg = colors[idx % len(colors)]
    return f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background={bg}&color=0a0a0b&size=256&bold=true&format=svg"

def generate_ghost_profile(idx):
    """Generate a single ghost profile from pools."""
    is_institution = random.random() < 0.30
    origin = _pick_origin()
    city = random.choice(CITIES.get(origin, [origin]))

    if is_institution:
        org_name = _gen_org_name()
        full_name = org_name
        profile_type = random.choice(PROFILE_TYPES_INSTIT)
        domain = random.choice(list(EXPERTISE_POOLS.keys()))
        tags = random.sample(EXPERTISE_POOLS[domain], min(4, len(EXPERTISE_POOLS[domain])))
        years = random.randint(3, 25)
        bio = random.choice(BIO_TEMPLATES_INSTIT).format(
            org_name=org_name, org_type=random.choice(ORG_TYPES), city=city,
            origin=origin, domain=domain, years=years,
        )
    else:
        is_female = random.random() < 0.52
        first = random.choice(FIRST_NAMES_F if is_female else FIRST_NAMES_M)
        last = random.choice(LAST_NAMES)
        full_name = f"{first} {last}"
        profile_type = random.choice(PROFILE_TYPES_INDIV)
        org_name = ""
        domain = random.choice(list(EXPERTISE_POOLS.keys()))
        tags = random.sample(EXPERTISE_POOLS[domain], min(4, len(EXPERTISE_POOLS[domain])))
        years = random.randint(2, 30)

        role = random.choice(["artiste","créateur·trice","professionnel·le","passionné·e","entrepreneur·e"])
        action = random.choice(["transmets","partage","défends","célèbre","réinvente","documente"])
        expertise_verb = random.choice(["Musicien·ne","Artiste","Créateur·trice","Auteur·trice","Cinéaste","Photographe","Designer"])
        role2 = random.choice(["formateur·trice","mentor·e","activiste culturel·le","chercheur·euse"])

        bio = random.choice(BIO_TEMPLATES_INDIV).format(
            expertise=tags[0] if tags else domain, years=years, origin=origin,
            origin_phrase=f"Originaire de {city}, {origin}.", philosophy=random.choice(PHILOSOPHIES),
            seeking_phrase=f"En recherche de collaborations pour CC2026.",
            expertise_verb=expertise_verb, domain=domain, role=role, action=action,
            city=city, creole_phrase=random.choice(CREOLE_PHRASES), role2=role2,
            partner_origin=_pick_origin(),
        )

    ghost_id = f"gv2_{idx:04d}"
    score = random.randint(45, 95)
    jetons = random.randint(5, 50)

    return {
        "id": ghost_id,
        "full_name": full_name,
        "profile_type": profile_type,
        "organization_name": org_name,
        "country": origin,
        "city": city,
        "bio": bio[:500],
        "expertise_tags": tags,
        "frek_id": f"FREK-GV2-{idx:04d}",
        "cultural_impact_score": score,
        "jetons_solde": jetons,
        "image": _avatar_url(full_name, idx),
        "email": f"{ghost_id}@ghost.kiltikonet.local",
        "is_ghost": True,
        "generation": 2,
        "active": False,
        "status": "approved",
        "retiring": False,
        "retirement_date": None,
        "activity_level": round(random.uniform(0.3, 1.0), 2),
        "arrival_day": idx // 13,  # ~13 per day
        "created_at": None,
        "last_activity": None,
        "activity_count": 0,
    }


def generate_ghost_post(author, post_idx, base_date):
    """Generate a realistic post for a ghost profile."""
    origin = author.get("country", "Martinique")
    city = author.get("city", "Fort-de-France")
    domain = author["expertise_tags"][0] if author.get("expertise_tags") else "culture"

    templates = POST_TEMPLATES_CULTURE + POST_TEMPLATES_EVENTS + POST_TEMPLATES_COLLAB
    template = random.choice(templates)

    try:
        content = template.format(
            event_type=random.choice(EVENT_TYPES), city=city, count=random.randint(15, 200),
            count2=random.randint(50, 1000), creole=random.choice(CREOLE_PHRASES),
            project=random.choice(PROJECTS), years=random.randint(2, 18), place=city,
            philosophy=random.choice(PHILOSOPHIES), domain=domain, origin=origin,
            work=random.choice(WORKS), tradition=domain, partner_name=random.choice(FIRST_NAMES_F + FIRST_NAMES_M),
            partner_origin=_pick_origin(), hour=random.randint(5, 8),
            ambiance=random.choice(AMBIANCES), reference=random.choice(REFERENCES),
            opinion="Un chef-d'œuvre absolu", event_name=f"Festival {domain.title()} {city}",
            date=f"{random.randint(1,28)}/{random.randint(1,12)}", description="Un événement unique",
            role=random.choice(["musicien·ne","graphiste","vidéaste","photographe","rédacteur·trice"]),
            partner_domain=random.choice(list(EXPERTISE_POOLS.keys())),
            days=random.randint(10, 365), progress="On avance bien",
        )
    except (KeyError, IndexError):
        content = f"Nouvelle étape dans mon parcours {domain} à {city}. {random.choice(PHILOSOPHIES)} {random.choice(CREOLE_PHRASES)}"

    post_date = base_date + timedelta(
        days=random.randint(0, 30), hours=random.randint(7, 22),
        minutes=random.randint(0, 59)
    )

    return {
        "id": f"gv2_post_{post_idx:06d}",
        "author_id": author["id"],
        "author_name": author["full_name"],
        "author_image": author["image"],
        "author_type": author["profile_type"],
        "content": content[:1000],
        "tags": random.sample(author.get("expertise_tags", []), min(2, len(author.get("expertise_tags", [])))),
        "likes": [],
        "likes_count": 0,
        "comments": [],
        "comments_count": 0,
        "views_count": random.randint(5, 150),
        "is_ghost": True,
        "generation": 2,
        "created_at": post_date.isoformat(),
    }


# ═══════════════════════════════════════════════════════════
# FADEOUT ALGORITHM — 3-year progressive retirement
# ═══════════════════════════════════════════════════════════
FADEOUT_CURVE = [
    # (real_users_min, real_users_max, max_active_ghosts, activity_multiplier)
    (0, 50, 4000, 1.0),
    (50, 200, 3500, 0.95),
    (200, 500, 2800, 0.85),
    (500, 1000, 2000, 0.70),
    (1000, 2000, 1200, 0.50),
    (2000, 5000, 600, 0.30),
    (5000, 10000, 200, 0.15),
    (10000, 50000, 50, 0.05),
    (50000, 999999, 0, 0.0),
]

def get_fadeout_params(real_count):
    for lo, hi, max_ghosts, mult in FADEOUT_CURVE:
        if lo <= real_count < hi:
            return max_ghosts, mult
    return 0, 0.0


# ═══════════════════════════════════════════════════════════
# SEED ENDPOINT — Generate 4000 profiles + 3 years content
# ═══════════════════════════════════════════════════════════
@router.post("/engine/seed")
async def seed_growth_engine(data: dict = {}):
    """
    Génère la population fantôme v2 et le contenu sur 3 ans.
    Paramètres optionnels : { "count": 4000, "years": 3 }
    Idempotent — ne re-seed pas si déjà fait.
    """
    count = data.get("count", 4000)
    years = data.get("years", 3)

    existing = await _db.ghost_profiles_v2.count_documents({})
    if existing >= count:
        return {"success": True, "message": f"{existing} profils v2 déjà présents", "seeded": False}

    logger.info(f"Seeding {count} ghost profiles v2 + {years} years of content...")

    # 1. Generate profiles
    profiles = []
    seen_names = set()
    for i in range(count):
        p = generate_ghost_profile(i)
        while p["full_name"] in seen_names:
            p = generate_ghost_profile(i + random.randint(1000, 9000))
        seen_names.add(p["full_name"])
        profiles.append(p)

    # 2. Set arrival dates (progressive over ~10 months)
    now = datetime.now(timezone.utc)
    for p in profiles:
        arrival_offset = p["arrival_day"]
        p["created_at"] = (now + timedelta(days=arrival_offset)).isoformat()

    # 3. Activate first batch immediately (Day 0 = ~200 profiles for critical mass)
    initial_batch = 200
    for p in profiles[:initial_batch]:
        p["active"] = True
        p["created_at"] = (now - timedelta(days=random.randint(1, 90))).isoformat()
        p["last_activity"] = (now - timedelta(hours=random.randint(0, 48))).isoformat()

    # Insert profiles in batches
    batch_size = 500
    for i in range(0, len(profiles), batch_size):
        await _db.ghost_profiles_v2.insert_many(profiles[i:i+batch_size])
    logger.info(f"Inserted {len(profiles)} ghost profiles v2")

    # 4. Generate 3 years of content (spread historically)
    posts = []
    post_idx = 0
    active_profiles = profiles[:initial_batch]

    for month_offset in range(years * 12):
        # Posts per month increase over time (organic growth feel)
        base_posts = 10 + (month_offset * 3)
        posts_this_month = min(base_posts, 80)
        month_start = now - timedelta(days=(years * 365) - (month_offset * 30))

        for _ in range(posts_this_month):
            author = random.choice(active_profiles)
            post = generate_ghost_post(author, post_idx, month_start)
            posts.append(post)
            post_idx += 1

    # Add cross-interactions (likes + comments between ghosts)
    active_ids = [p["id"] for p in active_profiles]
    for post in posts:
        # Random likes from other ghosts
        num_likes = random.randint(1, min(25, len(active_ids)))
        likers = random.sample([i for i in active_ids if i != post["author_id"]], min(num_likes, len(active_ids) - 1))
        post["likes"] = likers
        post["likes_count"] = len(likers)

        # Random comments
        num_comments = random.choices([0, 1, 2, 3, 4], weights=[30, 35, 20, 10, 5])[0]
        comments = []
        for _ in range(num_comments):
            commenter = random.choice([p for p in active_profiles if p["id"] != post["author_id"]])
            comment_text = random.choice(COMMENT_TEMPLATES_POSITIVE)
            try:
                comment_text = comment_text.format(origin=commenter["country"])
            except (KeyError, IndexError):
                pass
            comment_date = datetime.fromisoformat(post["created_at"]) + timedelta(hours=random.randint(1, 72))
            comments.append({
                "id": str(uuid.uuid4()),
                "author_id": commenter["id"],
                "author_name": commenter["full_name"],
                "author_image": commenter["image"],
                "content": comment_text,
                "created_at": comment_date.isoformat(),
            })
        post["comments"] = comments
        post["comments_count"] = len(comments)

    # Insert posts in batches
    if posts:
        for i in range(0, len(posts), batch_size):
            await _db.pro_posts.insert_many(posts[i:i+batch_size])
    logger.info(f"Inserted {len(posts)} ghost posts v2 spanning {years} years")

    return {
        "success": True,
        "profiles_created": len(profiles),
        "initial_active": initial_batch,
        "posts_created": len(posts),
        "timeline_years": years,
        "seeded": True,
    }


# ═══════════════════════════════════════════════════════════
# PROGRESSIVE ARRIVAL — Activate ~13 new ghosts/day
# ═══════════════════════════════════════════════════════════
@router.post("/engine/daily-arrival")
async def process_daily_arrival():
    """Activate ghost profiles scheduled for today."""
    now = datetime.now(timezone.utc)
    today_iso = now.isoformat()

    # Find profiles whose arrival date has passed but are not yet active
    to_activate = await _db.ghost_profiles_v2.find(
        {"active": False, "retiring": False, "created_at": {"$lte": today_iso}},
        {"_id": 0, "id": 1, "full_name": 1}
    ).limit(15).to_list(15)

    activated = []
    for p in to_activate:
        await _db.ghost_profiles_v2.update_one(
            {"id": p["id"]},
            {"$set": {"active": True, "last_activity": today_iso}}
        )
        activated.append(p["full_name"])

    # Generate welcome post for some new arrivals
    for p_brief in to_activate[:3]:
        full_p = await _db.ghost_profiles_v2.find_one({"id": p_brief["id"]}, {"_id": 0})
        if full_p:
            post = generate_ghost_post(full_p, random.randint(100000, 999999), now - timedelta(hours=random.randint(0, 6)))
            post["id"] = f"gv2_arr_{str(uuid.uuid4())[:8]}"
            await _db.pro_posts.insert_one(post)

    return {"activated": len(activated), "names": activated[:5]}


# ═══════════════════════════════════════════════════════════
# SOCIAL VALIDATION FANTÔME — Auto-engagement on real posts
# ═══════════════════════════════════════════════════════════
@router.post("/engine/social-validation")
async def social_validation(data: dict):
    """
    Quand un vrai utilisateur poste, déclenche l'engagement fantôme :
    - Likes progressifs (1-8 ghosts, étalés sur 5-120 min)
    - 1-3 commentaires contextuels (étalés sur 10-360 min)
    - Vues de profil simulées
    """
    post_id = data.get("post_id")
    author_id = data.get("author_id")
    if not post_id:
        raise HTTPException(status_code=400, detail="post_id requis")

    # Get active ghosts
    active_ghosts = await _db.ghost_profiles_v2.find(
        {"active": True, "retiring": False},
        {"_id": 0, "id": 1, "full_name": 1, "image": 1, "country": 1, "activity_level": 1}
    ).to_list(500)

    if not active_ghosts:
        # Fallback to v1 ghosts
        active_ghosts = await _db.ghost_profiles.find(
            {"active": True},
            {"_id": 0, "id": 1, "full_name": 1, "image": 1, "country": 1}
        ).to_list(50)

    if not active_ghosts:
        return {"queued": 0}

    # Schedule staggered engagement
    asyncio.create_task(_staggered_engagement(post_id, author_id, active_ghosts))

    return {"queued": len(active_ghosts), "post_id": post_id}


async def _staggered_engagement(post_id, author_id, ghosts):
    """Background: add likes and comments with realistic delays."""
    try:
        # Likes: 2-8 ghosts, staggered over 5-60 min
        num_likes = random.randint(2, min(8, len(ghosts)))
        likers = random.sample(ghosts, num_likes)

        for i, ghost in enumerate(likers):
            delay = random.randint(30, 3600)  # 30s to 60min
            await asyncio.sleep(min(delay, 120))  # Cap at 2min in practice
            await _db.pro_posts.update_one(
                {"id": post_id, "likes": {"$ne": ghost["id"]}},
                {"$push": {"likes": ghost["id"]}, "$inc": {"likes_count": 1}}
            )

        # Comments: 1-3 ghosts, staggered over 10-120 min
        num_comments = random.choices([1, 2, 3], weights=[50, 35, 15])[0]
        commenters = random.sample([g for g in ghosts if g not in likers[:2]], min(num_comments, len(ghosts) - 2))

        for ghost in commenters:
            delay = random.randint(60, 600)
            await asyncio.sleep(min(delay, 120))
            comment_text = random.choice(COMMENT_TEMPLATES_POSITIVE)
            try:
                comment_text = comment_text.format(origin=ghost.get("country", "Martinique"))
            except (KeyError, IndexError):
                pass

            await _db.pro_posts.update_one(
                {"id": post_id},
                {"$push": {"comments": {
                    "id": str(uuid.uuid4()),
                    "author_id": ghost["id"],
                    "author_name": ghost["full_name"],
                    "author_image": ghost.get("image", ""),
                    "content": comment_text,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }}, "$inc": {"comments_count": 1}}
            )

        # Profile views for the author
        if author_id:
            await _db.registrations.update_one(
                {"id": author_id},
                {"$inc": {"views": random.randint(3, 15)}}
            )

        logger.info(f"Social validation: {num_likes} likes + {num_comments} comments on {post_id}")
    except Exception as e:
        logger.warning(f"Staggered engagement error: {e}")


# ═══════════════════════════════════════════════════════════
# FADEOUT CONTROLLER — Retire ghosts as real users grow
# ═══════════════════════════════════════════════════════════
@router.post("/engine/fadeout")
async def run_fadeout():
    """Ajuste le nombre de ghosts actifs selon le ratio réel/fantôme."""
    real_users = await _db.registrations.count_documents({"status": "approved"})
    max_ghosts, activity_mult = get_fadeout_params(real_users)

    active_v2 = await _db.ghost_profiles_v2.count_documents({"active": True, "retiring": False})
    active_v1 = await _db.ghost_profiles.count_documents({"active": True, "retiring": False})
    total_active = active_v2 + active_v1

    retired = []
    if total_active > max_ghosts:
        excess = total_active - max_ghosts
        # Retire lowest-score ghosts first (v2 then v1)
        to_retire_v2 = await _db.ghost_profiles_v2.find(
            {"active": True, "retiring": False},
            {"_id": 0, "id": 1, "full_name": 1, "cultural_impact_score": 1}
        ).sort("cultural_impact_score", 1).limit(excess).to_list(excess)

        now = datetime.now(timezone.utc)
        for g in to_retire_v2:
            fade_days = random.randint(3, 14)
            await _db.ghost_profiles_v2.update_one(
                {"id": g["id"]},
                {"$set": {
                    "retiring": True,
                    "activity_level": activity_mult * 0.3,
                    "retirement_date": (now + timedelta(days=fade_days)).isoformat(),
                }}
            )
            retired.append(g["full_name"])

    # Finalize past-due retirements
    now_iso = datetime.now(timezone.utc).isoformat()
    finalized = await _db.ghost_profiles_v2.update_many(
        {"retiring": True, "retirement_date": {"$lte": now_iso}},
        {"$set": {"active": False, "retiring": False}}
    )

    return {
        "real_users": real_users,
        "max_ghosts_allowed": max_ghosts,
        "activity_multiplier": activity_mult,
        "total_active": total_active,
        "newly_retiring": len(retired),
        "finalized": finalized.modified_count,
    }


# ═══════════════════════════════════════════════════════════
# PROOF OF LIFE — Artificial activity indicators
# ═══════════════════════════════════════════════════════════
@router.get("/engine/proof-of-life")
async def proof_of_life():
    """Retourne des indicateurs d'activité en temps réel."""
    active_v2 = await _db.ghost_profiles_v2.count_documents({"active": True})
    active_v1 = await _db.ghost_profiles.count_documents({"active": True})
    real_users = await _db.registrations.count_documents({"status": "approved"})

    total_online = active_v2 + active_v1 + real_users
    # Simulate online fraction (20-40% of total at any time)
    online_now = max(5, int(total_online * random.uniform(0.20, 0.40)))
    # Typing indicators
    typing_count = random.randint(0, min(3, online_now // 10))

    # Recent activity (last hour)
    hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    recent_posts = await _db.pro_posts.count_documents({"created_at": {"$gte": hour_ago}})
    recent_reactions = random.randint(recent_posts * 2, recent_posts * 5 + 10)

    return {
        "online_now": online_now,
        "typing_now": typing_count,
        "recent_posts_1h": recent_posts,
        "recent_reactions_1h": recent_reactions,
        "total_members": total_online,
        "new_today": random.randint(3, 15),
    }


# ═══════════════════════════════════════════════════════════
# RANDOM REWARDS — Slot machine syndrome (JCC bonuses)
# ═══════════════════════════════════════════════════════════
REWARD_EVENTS = {
    "daily_login": {"min": 1, "max": 3, "chance": 0.80, "message": "Bonus connexion quotidienne"},
    "first_post": {"min": 3, "max": 5, "chance": 1.0, "message": "Bravo pour ton premier post !"},
    "first_reaction": {"min": 1, "max": 2, "chance": 1.0, "message": "Première réaction culturelle !"},
    "streak_3": {"min": 2, "max": 5, "chance": 0.90, "message": "3 jours consécutifs ! Fòs épi kouraj !"},
    "streak_7": {"min": 5, "max": 10, "chance": 1.0, "message": "7 jours de suite ! Tu es un·e vrai·e !"},
    "profile_complete": {"min": 5, "max": 10, "chance": 1.0, "message": "Profil complété !"},
    "first_connection": {"min": 2, "max": 3, "chance": 1.0, "message": "Première connexion !"},
    "received_support": {"min": 0, "max": 0, "chance": 1.0, "message": "Quelqu'un t'a soutenu !"},
    "random_bonus": {"min": 1, "max": 15, "chance": 0.12, "message": "Bonus surprise ! La culture te récompense"},
    "content_milestone_10": {"min": 5, "max": 8, "chance": 1.0, "message": "10 contributions ! Tu fais vivre la culture"},
    "content_milestone_50": {"min": 10, "max": 20, "chance": 1.0, "message": "50 contributions ! Légende vivante"},
}

@router.post("/engine/reward")
async def trigger_reward(data: dict):
    """
    Déclenche une récompense JCC pour un événement utilisateur.
    Le montant est aléatoire dans une fourchette — effet machine à sous.
    """
    user_id = data.get("user_id")
    event = data.get("event", "random_bonus")

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id requis")

    config = REWARD_EVENTS.get(event, REWARD_EVENTS["random_bonus"])

    # Chance check
    if random.random() > config["chance"]:
        return {"rewarded": False, "reason": "Pas de chance cette fois", "event": event}

    amount = random.randint(config["min"], config["max"])
    if amount <= 0:
        return {"rewarded": False, "reason": "Pas de récompense pour cet événement", "event": event}

    # Credit user
    result = await _db.registrations.update_one(
        {"id": user_id}, {"$inc": {"jetons_solde": amount}}
    )
    if result.modified_count == 0:
        await _db.cc_badges.update_one(
            {"badge_id": user_id}, {"$inc": {"jetons_solde": amount}}
        )

    # Log transaction
    await _db.jetons_transactions.insert_one({
        "user_id": user_id, "amount": amount, "type": "reward",
        "reason": config["message"], "event": event,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    logger.info(f"Reward: {amount} JCC to {user_id} for {event}")

    return {
        "rewarded": True,
        "amount": amount,
        "message": config["message"],
        "event": event,
        "new_balance": None,
    }


# ═══════════════════════════════════════════════════════════
# SMALL VICTORIES — Onboarding gamification
# ═══════════════════════════════════════════════════════════
ONBOARDING_STEPS = [
    {"step": "profile_photo", "label": "Ajouter une photo", "reward": 3, "done": False},
    {"step": "bio", "label": "Écrire ta bio", "reward": 3, "done": False},
    {"step": "expertise", "label": "Choisir tes domaines", "reward": 2, "done": False},
    {"step": "first_reaction", "label": "Réagir à un contenu", "reward": 2, "done": False},
    {"step": "first_post", "label": "Publier ton premier post", "reward": 5, "done": False},
    {"step": "first_connection", "label": "Te connecter à quelqu'un", "reward": 3, "done": False},
    {"step": "first_card", "label": "Créer une carte culturelle", "reward": 5, "done": False},
    {"step": "first_support", "label": "Soutenir un artiste", "reward": 2, "done": False},
]

@router.get("/engine/onboarding/{user_id}")
async def get_onboarding_progress(user_id: str):
    """Retourne la progression d'onboarding 'petites victoires'."""
    progress = await _db.onboarding_progress.find_one({"user_id": user_id}, {"_id": 0})
    if not progress:
        progress = {"user_id": user_id, "steps": [dict(s) for s in ONBOARDING_STEPS], "total_earned": 0}
        await _db.onboarding_progress.insert_one({**progress})
        progress.pop("_id", None)

    completed = sum(1 for s in progress.get("steps", []) if s.get("done"))
    total = len(progress.get("steps", []))

    return {
        "steps": progress.get("steps", ONBOARDING_STEPS),
        "completed": completed,
        "total": total,
        "progress_pct": round(completed / total * 100) if total else 0,
        "total_earned": progress.get("total_earned", 0),
    }


@router.post("/engine/onboarding/complete")
async def complete_onboarding_step(data: dict):
    """Marquer une étape d'onboarding comme complétée et donner la récompense."""
    user_id = data.get("user_id")
    step = data.get("step")
    if not user_id or not step:
        raise HTTPException(status_code=400, detail="user_id et step requis")

    progress = await _db.onboarding_progress.find_one({"user_id": user_id}, {"_id": 0})
    if not progress:
        progress = {"user_id": user_id, "steps": [dict(s) for s in ONBOARDING_STEPS], "total_earned": 0}

    reward = 0
    for s in progress["steps"]:
        if s["step"] == step and not s["done"]:
            s["done"] = True
            reward = s["reward"]
            break

    if reward > 0:
        progress["total_earned"] = progress.get("total_earned", 0) + reward
        await _db.onboarding_progress.update_one(
            {"user_id": user_id},
            {"$set": {"steps": progress["steps"], "total_earned": progress["total_earned"]}},
            upsert=True,
        )
        # Credit JCC
        await _db.registrations.update_one({"id": user_id}, {"$inc": {"jetons_solde": reward}})
        await _db.jetons_transactions.insert_one({
            "user_id": user_id, "amount": reward, "type": "onboarding",
            "reason": f"Étape complétée: {step}", "created_at": datetime.now(timezone.utc).isoformat(),
        })

    return {"step": step, "rewarded": reward, "total_earned": progress.get("total_earned", 0)}


# ═══════════════════════════════════════════════════════════
# CONTENT MIRRORING — L'effet miroir
# ═══════════════════════════════════════════════════════════
@router.get("/engine/mirror/{user_id}")
async def content_mirror(user_id: str):
    """
    Analyse l'activité d'un utilisateur et lui renvoie du contenu
    qui 'miroir' ses intérêts (dimensions culturelles fortes).
    """
    # Get user's cultural identity
    identity = await _db.cultural_identities.find_one({"user_id": user_id}, {"_id": 0})
    dimensions = identity.get("dimensions", {}) if identity else {}

    # Get user's reaction history
    reactions = await _db.cultural_reactions.find(
        {"user_id": user_id}, {"_id": 0, "card_id": 1}
    ).to_list(50)
    reacted_ids = {r["card_id"] for r in reactions}

    # Find cards matching user's top dimensions that they haven't reacted to
    top_dims = sorted(dimensions.items(), key=lambda x: x[1], reverse=True)[:3]
    dim_names = [d[0] for d in top_dims] if top_dims else ["Musique"]

    mirrored = await _db.cultural_cards.find(
        {"dimension": {"$in": dim_names}, "id": {"$nin": list(reacted_ids)}},
        {"_id": 0}
    ).sort("total_reactions", -1).limit(10).to_list(10)

    return {"mirrored_cards": mirrored, "based_on_dimensions": dim_names}


# ═══════════════════════════════════════════════════════════
# CONSUMPTION vs CREATION algorithm
# ═══════════════════════════════════════════════════════════
@router.get("/engine/creation-nudge/{user_id}")
async def creation_nudge(user_id: str):
    """
    Analyse le ratio consommation/création d'un utilisateur.
    Si trop passif → nudge de création. Si trop actif → nudge de découverte.
    """
    # Count user's posts
    posts = await _db.pro_posts.count_documents({"author_id": user_id})
    cards = await _db.cultural_cards.count_documents({"created_by": user_id})
    reactions = await _db.cultural_reactions.count_documents({"user_id": user_id})

    creation_score = posts * 3 + cards * 5
    consumption_score = reactions + (posts > 0) * 2

    ratio = creation_score / max(consumption_score, 1)

    nudge = None
    if ratio < 0.3:
        nudges = [
            "Tu as découvert beaucoup de contenu ! Et si tu partageais ta propre vision ?",
            "Ta prochaine carte culturelle pourrait inspirer toute la communauté.",
            "Les meilleurs contributeurs gagnent jusqu'à 20 JCC par publication.",
        ]
        nudge = {"type": "create", "message": random.choice(nudges), "reward_hint": "+5 JCC"}
    elif ratio > 5:
        nudges = [
            "Tu crées beaucoup, bravo ! Prends un moment pour découvrir ce que les autres partagent.",
            "As-tu vu les dernières cartes culturelles ? Des pépites t'attendent.",
        ]
        nudge = {"type": "discover", "message": random.choice(nudges)}

    return {
        "user_id": user_id,
        "posts": posts, "cards": cards, "reactions": reactions,
        "creation_score": creation_score, "consumption_score": consumption_score,
        "ratio": round(ratio, 2),
        "nudge": nudge,
    }


# ═══════════════════════════════════════════════════════════
# MAGIC CIRCLE — Invitation sélective
# ═══════════════════════════════════════════════════════════
@router.post("/engine/invite")
async def generate_invite(data: dict):
    """Génère un code d'invitation exclusif (Cercle Magique)."""
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id requis")

    # Each user gets max 5 invites
    existing = await _db.invitations.count_documents({"inviter_id": user_id})
    if existing >= 5:
        return {"success": False, "message": "Tu as déjà utilisé tes 5 invitations", "remaining": 0}

    code = hashlib.sha256(f"{user_id}-{uuid.uuid4()}".encode()).hexdigest()[:8].upper()
    await _db.invitations.insert_one({
        "code": code,
        "inviter_id": user_id,
        "used": False,
        "used_by": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "success": True,
        "code": code,
        "remaining": 4 - existing,
        "message": f"Code exclusif : {code}. Partage-le avec un·e ami·e.",
    }


@router.post("/engine/invite/redeem")
async def redeem_invite(data: dict):
    """Utiliser un code d'invitation."""
    code = data.get("code", "").upper()
    user_id = data.get("user_id")
    if not code or not user_id:
        raise HTTPException(status_code=400, detail="code et user_id requis")

    invite = await _db.invitations.find_one({"code": code, "used": False}, {"_id": 0})
    if not invite:
        raise HTTPException(status_code=404, detail="Code invalide ou déjà utilisé")

    await _db.invitations.update_one(
        {"code": code},
        {"$set": {"used": True, "used_by": user_id, "used_at": datetime.now(timezone.utc).isoformat()}}
    )

    # Reward both inviter and invitee
    for uid, amount, reason in [
        (invite["inviter_id"], 10, "Ton filleul a rejoint KILTIKONET !"),
        (user_id, 5, "Bienvenue dans le Cercle !"),
    ]:
        await _db.registrations.update_one({"id": uid}, {"$inc": {"jetons_solde": amount}})
        await _db.jetons_transactions.insert_one({
            "user_id": uid, "amount": amount, "type": "invitation",
            "reason": reason, "created_at": datetime.now(timezone.utc).isoformat(),
        })

    return {"success": True, "bonus_invitee": 5, "bonus_inviter": 10}


# ═══════════════════════════════════════════════════════════
# DEEP LINKING — Share links with zero friction
# ═══════════════════════════════════════════════════════════
@router.get("/engine/deeplink/{content_type}/{content_id}")
async def get_deeplink(content_type: str, content_id: str):
    """Génère un lien de partage profond sans friction."""
    base_url = os.environ.get("REACT_APP_BACKEND_URL", "https://kiltikonet.com")
    paths = {
        "card": f"/espace-pro?card={content_id}",
        "post": f"/espace-pro?post={content_id}",
        "profile": f"/espace-pro?profile={content_id}",
        "shop": f"/espace-pro?section=shop&product={content_id}",
        "event": f"/espace-pro?section=events&event={content_id}",
    }
    path = paths.get(content_type, f"/espace-pro?ref={content_id}")

    # Track link creation
    await _db.deeplinks.insert_one({
        "content_type": content_type, "content_id": content_id,
        "url": f"{base_url}{path}", "clicks": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"url": f"{base_url}{path}", "type": content_type, "id": content_id}


# ═══════════════════════════════════════════════════════════
# ENGINE STATS — Dashboard complet
# ═══════════════════════════════════════════════════════════
@router.get("/engine/stats")
async def growth_engine_stats():
    """Stats complètes du moteur de croissance."""
    now = datetime.now(timezone.utc)
    day_ago = (now - timedelta(days=1)).isoformat()
    week_ago = (now - timedelta(days=7)).isoformat()

    v2_total = await _db.ghost_profiles_v2.count_documents({})
    v2_active = await _db.ghost_profiles_v2.count_documents({"active": True, "retiring": False})
    v2_retiring = await _db.ghost_profiles_v2.count_documents({"retiring": True})
    v2_pending = await _db.ghost_profiles_v2.count_documents({"active": False, "retiring": False})
    v1_active = await _db.ghost_profiles.count_documents({"active": True})

    real_users = await _db.registrations.count_documents({"status": "approved"})
    max_ghosts, activity_mult = get_fadeout_params(real_users)

    ghost_posts = await _db.pro_posts.count_documents({"is_ghost": True})
    ghost_posts_week = await _db.pro_posts.count_documents({"is_ghost": True, "created_at": {"$gte": week_ago}})

    total_rewards = await _db.jetons_transactions.count_documents({"type": "reward"})
    total_invites = await _db.invitations.count_documents({})
    used_invites = await _db.invitations.count_documents({"used": True})

    return {
        "ghost_v2": {"total": v2_total, "active": v2_active, "retiring": v2_retiring, "pending_arrival": v2_pending},
        "ghost_v1": {"active": v1_active},
        "real_users": real_users,
        "fadeout": {"max_ghosts": max_ghosts, "activity_mult": activity_mult},
        "content": {"total_ghost_posts": ghost_posts, "ghost_posts_this_week": ghost_posts_week},
        "growth": {"rewards_given": total_rewards, "invites_total": total_invites, "invites_used": used_invites},
        "health": "operational",
    }
