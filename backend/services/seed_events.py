"""
CC2026 Events & Sessions Seed Data
20-23 Mai 2026 — La Savane, Fort-de-France
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()

EVENTS = [
    # === JOUR 1 — 20 Mai 2026 — Ouverture ===
    {
        "id": "evt-001", "title": "Ceremonie d'ouverture CC2026",
        "date": "2026-05-20", "start": "18:00", "end": "19:30",
        "lieu": "Scene principale — La Savane",
        "type": "ceremonie", "tags": ["culture", "officiel", "ouverture"],
        "target_badges": ["VIP", "ART", "SPO", "EXP", "OFF", "INT"],
        "description": "Ouverture officielle de Culture Connect 2026 avec discours des organisateurs et spectacle inaugural.",
        "capacity": 500, "registered": 0,
    },
    {
        "id": "evt-002", "title": "Atelier Bele : Initiation aux rythmes ancestraux",
        "date": "2026-05-20", "start": "15:00", "end": "17:00",
        "lieu": "Espace TOM — La Savane",
        "type": "atelier", "tags": ["bele", "danse", "tradition", "musique"],
        "target_badges": ["VIS", "BNV", "ART"],
        "description": "Decouverte du bele martiniquais : tambour, chant-repons et danse. Animee par Maitre Ti-Emile.",
        "capacity": 40, "registered": 0,
    },
    {
        "id": "evt-003", "title": "Panel : Diaspora caribéenne et industries culturelles",
        "date": "2026-05-20", "start": "14:00", "end": "15:30",
        "lieu": "Salle Conference — La Savane",
        "type": "conference", "tags": ["diaspora", "industrie", "economie", "caribeen"],
        "target_badges": ["VIP", "SPO", "INT", "OFF"],
        "description": "Table ronde avec des acteurs cles de la diaspora sur les opportunites economiques de la culture caribeeenne.",
        "capacity": 120, "registered": 0,
    },
    {
        "id": "evt-004", "title": "Diaspora Night : Soiree d'ouverture",
        "date": "2026-05-20", "start": "21:00", "end": "02:00",
        "lieu": "Scene principale — La Savane",
        "type": "soiree", "tags": ["musique", "fete", "diaspora", "dj"],
        "target_badges": ["VIP", "VIS", "ART", "BNV", "SPO"],
        "description": "Premiere soiree Diaspora Night avec DJ sets afro-caribbeens, live acts et networking.",
        "capacity": 800, "registered": 0,
    },

    # === JOUR 2 — 21 Mai 2026 — Music Business ===
    {
        "id": "evt-005", "title": "Music Business Summit : Monetiser la musique caribbeenne",
        "date": "2026-05-21", "start": "09:00", "end": "12:00",
        "lieu": "Salle Conference — La Savane",
        "type": "conference", "tags": ["musique", "business", "monetisation", "streaming"],
        "target_badges": ["VIP", "ART", "SPO", "INT"],
        "description": "Sessions sur le streaming, les droits d'auteur, la distribution digitale et le live business pour les artistes caribeeens.",
        "capacity": 150, "registered": 0,
    },
    {
        "id": "evt-006", "title": "Workshop Audiovisuel : Realiser avec un smartphone",
        "date": "2026-05-21", "start": "10:00", "end": "13:00",
        "lieu": "Espace TOM — La Savane",
        "type": "atelier", "tags": ["audiovisuel", "video", "technique", "smartphone"],
        "target_badges": ["BNV", "VIS", "ART"],
        "description": "Formation pratique a la realisation video professionnelle avec un smartphone. Montage, cadrage, son.",
        "capacity": 30, "registered": 0,
    },
    {
        "id": "evt-007", "title": "Showcase Artistes Emergents",
        "date": "2026-05-21", "start": "14:00", "end": "17:00",
        "lieu": "Scene principale — La Savane",
        "type": "spectacle", "tags": ["musique", "live", "emergent", "decouverte"],
        "target_badges": ["VIS", "VIP", "ART", "BNV", "SPO"],
        "description": "Performances live de 8 artistes emergents selectionnes par le jury CC2026.",
        "capacity": 500, "registered": 0,
    },
    {
        "id": "evt-008", "title": "Atelier Bele avance : Le gran bele",
        "date": "2026-05-21", "start": "15:00", "end": "17:00",
        "lieu": "Espace TOM — La Savane",
        "type": "atelier", "tags": ["bele", "danse", "tradition", "avance"],
        "target_badges": ["ART", "VIS", "BNV"],
        "description": "Niveau avance du bele : le gran bele, kalenda et bel air. Prerequis : atelier initiation ou experience.",
        "capacity": 25, "registered": 0,
    },
    {
        "id": "evt-009", "title": "Networking VIP : Cocktail partenaires",
        "date": "2026-05-21", "start": "18:00", "end": "20:00",
        "lieu": "Espace VIP — La Savane",
        "type": "networking", "tags": ["vip", "partenaires", "networking", "business"],
        "target_badges": ["VIP", "SPO", "EXP"],
        "description": "Cocktail exclusif pour les partenaires, sponsors et VIP. Echanges privilegies et opportunites de collaboration.",
        "capacity": 80, "registered": 0,
    },
    {
        "id": "evt-010", "title": "Diaspora Night : Zouk & Kompa",
        "date": "2026-05-21", "start": "21:00", "end": "02:00",
        "lieu": "Scene principale — La Savane",
        "type": "soiree", "tags": ["zouk", "kompa", "musique", "fete", "diaspora"],
        "target_badges": ["VIP", "VIS", "ART", "BNV"],
        "description": "Deuxieme soiree Diaspora Night dediee au zouk et au kompa avec artistes live.",
        "capacity": 800, "registered": 0,
    },

    # === JOUR 3 — 22 Mai 2026 — Culture & Innovation ===
    {
        "id": "evt-011", "title": "Conference : Intelligence Artificielle et patrimoine culturel",
        "date": "2026-05-22", "start": "09:00", "end": "11:00",
        "lieu": "Salle Conference — La Savane",
        "type": "conference", "tags": ["ia", "technologie", "patrimoine", "innovation"],
        "target_badges": ["VIP", "INT", "SPO", "OFF"],
        "description": "Comment l'IA peut preserver et valoriser le patrimoine culturel caribeen. Presentation de CVL BRAIN.",
        "capacity": 100, "registered": 0,
    },
    {
        "id": "evt-012", "title": "Workshop : Creation musicale assistee par IA",
        "date": "2026-05-22", "start": "11:00", "end": "13:00",
        "lieu": "Espace TOM — La Savane",
        "type": "atelier", "tags": ["ia", "musique", "creation", "technique"],
        "target_badges": ["ART", "VIS", "BNV"],
        "description": "Atelier pratique de creation musicale avec des outils d'IA. Production, arrangement et mixage.",
        "capacity": 25, "registered": 0,
    },
    {
        "id": "evt-013", "title": "Panel : Femmes dans l'industrie culturelle caribbeenne",
        "date": "2026-05-22", "start": "14:00", "end": "15:30",
        "lieu": "Salle Conference — La Savane",
        "type": "conference", "tags": ["femmes", "culture", "leadership", "caribeen"],
        "target_badges": ["VIP", "VIS", "INT", "ART", "OFF"],
        "description": "Temoignages et debat sur la place des femmes dans la musique, le cinema et les arts visuels caribeeens.",
        "capacity": 120, "registered": 0,
    },
    {
        "id": "evt-014", "title": "Exposition : Art contemporain de la Caraibe",
        "date": "2026-05-22", "start": "10:00", "end": "20:00",
        "lieu": "Galerie — La Savane",
        "type": "exposition", "tags": ["art", "visuel", "contemporain", "caraibe"],
        "target_badges": ["VIS", "VIP", "ART", "INT", "BNV"],
        "description": "Exposition collective de 12 artistes visuels caribeeens. Peinture, sculpture, photographie et art numerique.",
        "capacity": 200, "registered": 0,
    },
    {
        "id": "evt-015", "title": "Diaspora Night : Dancehall & Afrobeats",
        "date": "2026-05-22", "start": "21:00", "end": "03:00",
        "lieu": "Scene principale — La Savane",
        "type": "soiree", "tags": ["dancehall", "afrobeats", "musique", "fete"],
        "target_badges": ["VIS", "VIP", "ART", "BNV"],
        "description": "Troisieme Diaspora Night avec les sons dancehall jamaicains et afrobeats nigerians.",
        "capacity": 1000, "registered": 0,
    },

    # === JOUR 4 — 23 Mai 2026 — Cloture ===
    {
        "id": "evt-016", "title": "Brunch : Bilan et perspectives CC2027",
        "date": "2026-05-23", "start": "10:00", "end": "12:00",
        "lieu": "Espace VIP — La Savane",
        "type": "networking", "tags": ["bilan", "futur", "networking", "brunch"],
        "target_badges": ["VIP", "SPO", "INT", "OFF"],
        "description": "Brunch de cloture pour les partenaires et institutionnels. Presentation des resultats et vision CC2027.",
        "capacity": 60, "registered": 0,
    },
    {
        "id": "evt-017", "title": "Atelier Bele : Session de cloture collective",
        "date": "2026-05-23", "start": "14:00", "end": "16:00",
        "lieu": "Espace TOM — La Savane",
        "type": "atelier", "tags": ["bele", "danse", "tradition", "cloture"],
        "target_badges": ["VIS", "ART", "BNV", "VIP"],
        "description": "Grande session collective de bele ouverte a tous. Communion dansee pour cloturer CC2026.",
        "capacity": 100, "registered": 0,
    },
    {
        "id": "evt-018", "title": "Grand concert de cloture CC2026",
        "date": "2026-05-23", "start": "19:00", "end": "23:59",
        "lieu": "Scene principale — La Savane",
        "type": "spectacle", "tags": ["musique", "live", "cloture", "festival"],
        "target_badges": ["VIS", "VIP", "ART", "BNV", "SPO", "EXP", "INT", "OFF"],
        "description": "Concert final avec les tetes d'affiche CC2026. Soiree de cloture memorielle.",
        "capacity": 2000, "registered": 0,
    },
]

async def seed():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ.get('DB_NAME', 'cc2026')]

    # Clear old events
    await db.cc_events.delete_many({})

    # Insert events
    for evt in EVENTS:
        evt["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.cc_events.insert_many(EVENTS)
    print(f"Seeded {len(EVENTS)} events into cc_events collection")

    # Verify
    count = await db.cc_events.count_documents({})
    print(f"Total events in DB: {count}")

if __name__ == "__main__":
    asyncio.run(seed())
