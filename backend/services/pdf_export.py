"""
Export PDF Batch — Génération d'invitations personnalisées CC2026
Superpose les données participant sur le template PINT_TOTAL_INVITATIONS.pdf
"""
import os
import io
import logging
from datetime import datetime, timezone
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color

logger = logging.getLogger(__name__)

TEMPLATE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "PINT_TEMPLATE.pdf")

# ═══════════════════════════════════════════════════════════════
# PAGE INDEX — Mapping type de badge → page du template
# ═══════════════════════════════════════════════════════════════
PAGE_MAP = {
    "ARTISTE": 0,
    "ART": 0,
    "PRESSE": 1,
    "PRS": 1,
    "OFFICIEL": 2,
    "OFF": 2,
    "SPONSOR": 3,
    "SPO": 3,
    "VIP": 4,
    "STAFF": 5,
    "STF": 5,
    "BENEVOLE": 6,
    "BEN": 6,
    "BÉNÉVOLE": 6,
    "INTERVENANT": 7,
    "INT": 7,
    "EXPOSANT_BRONZE": 8,
    "EXP-B": 8,
    "EXPOSANT_SILVER": 9,
    "EXP-S": 9,
    "EXPOSANT_GOLD": 10,
    "EXP-G": 10,
    "EXPOSANT_PLATINE": 11,
    "EXP-P": 11,
    "EXPOSANT_DIAMANT": 12,
    "EXP-D": 12,
    "EXPOSANT_VIP": 13,
    "EXP-V": 13,
    "EXP-VIP": 13,
    # Fallback generics
    "VIS": 2,
    "PRO": 2,
    "INST": 2,
    "BNV": 6,
}

# ═══════════════════════════════════════════════════════════════
# FIELD POSITIONS — Coordonnées (x, y) en points PDF
# Page 249.36 x 323.52 points
# Positions calibrées visuellement sur la grille
# ═══════════════════════════════════════════════════════════════
GOLD = Color(0.83, 0.66, 0.29, 1)  # #D4A84B
DARK = Color(0.11, 0.10, 0.08, 1)  # #1C1A14

# Layout type definitions
LAYOUT_ARTISTE = {
    "fields": [
        {"key": "scene", "label": "", "x": 82, "y": 120, "font_size": 9},
        {"key": "date_heure", "label": "", "x": 102, "y": 107, "font_size": 9},
    ]
}

LAYOUT_OFFICIEL = {
    "fields": [
        {"key": "nom", "label": "", "x": 85, "y": 82, "font_size": 9},
        {"key": "representant", "label": "", "x": 108, "y": 68, "font_size": 9},
        {"key": "acces", "label": "", "x": 88, "y": 54, "font_size": 9},
    ]
}

LAYOUT_STAFF = {
    "fields": [
        {"key": "nom", "label": "", "x": 72, "y": 128, "font_size": 9},
        {"key": "fonction", "label": "", "x": 90, "y": 118, "font_size": 9},
        {"key": "jours", "label": "", "x": 72, "y": 108, "font_size": 9},
        {"key": "acces", "label": "", "x": 72, "y": 99, "font_size": 9},
    ]
}

LAYOUT_BENEVOLE = {
    "fields": [
        {"key": "nom", "label": "", "x": 72, "y": 130, "font_size": 9},
        {"key": "jours", "label": "", "x": 72, "y": 120, "font_size": 9},
        {"key": "acces", "label": "", "x": 72, "y": 110, "font_size": 9},
    ]
}

LAYOUT_EXPOSANT = {
    "fields": [
        {"key": "nom", "label": "", "x": 73, "y": 103, "font_size": 9},
        {"key": "jours", "label": "", "x": 73, "y": 93, "font_size": 9},
        {"key": "stand", "label": "", "x": 108, "y": 73, "font_size": 9},
    ]
}

LAYOUT_MAP = {
    0: LAYOUT_ARTISTE,
    1: None,  # Presse — informational, no personal overlay
    2: LAYOUT_OFFICIEL,
    3: LAYOUT_OFFICIEL,
    4: LAYOUT_OFFICIEL,
    5: LAYOUT_STAFF,
    6: LAYOUT_BENEVOLE,
    7: LAYOUT_BENEVOLE,  # Intervenant same as Bénévole
    8: LAYOUT_EXPOSANT,
    9: LAYOUT_EXPOSANT,
    10: LAYOUT_EXPOSANT,
    11: LAYOUT_EXPOSANT,
    12: LAYOUT_EXPOSANT,
    13: LAYOUT_EXPOSANT,
}

# Pages with dark backgrounds requiring light text color
DARK_BG_PAGES = {11, 12, 13}


def _resolve_page(badge_type: str) -> int:
    """Resolve badge type string to page index."""
    key = badge_type.upper().strip().replace(" ", "_")
    return PAGE_MAP.get(key, 2)  # Default to OFFICIEL


def _build_overlay(page_width, page_height, layout, data, use_gold=False):
    """Create a PDF overlay with participant data positioned on fields."""
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=(page_width, page_height))
    text_color = GOLD if use_gold else DARK

    for field in layout["fields"]:
        key = field["key"]
        value = data.get(key, "")
        if not value:
            continue

        x = field["x"]
        y = field["y"]
        fs = field.get("font_size", 9)

        # Draw text
        c.setFont("Helvetica-Bold", fs)
        c.setFillColor(text_color)
        c.drawString(x, y, str(value))

    c.showPage()
    c.save()
    packet.seek(0)
    return packet


def generate_invitation_pdf(participant: dict) -> io.BytesIO:
    """
    Generate a single personalized invitation PDF.

    participant dict should contain:
    - type_badge: str (badge type code)
    - prenom: str
    - nom: str
    - organisation: str (optional)
    - scene: str (for ARTISTE)
    - date_heure: str (for ARTISTE)
    - fonction: str (for STAFF)
    - jours: str
    - acces: str
    - stand: str (for EXPOSANT)
    """
    if not os.path.exists(TEMPLATE_PATH):
        raise FileNotFoundError(f"Template not found: {TEMPLATE_PATH}")

    reader = PdfReader(TEMPLATE_PATH)
    badge_type = participant.get("type_badge", "OFFICIEL")
    page_idx = _resolve_page(badge_type)

    if page_idx >= len(reader.pages):
        page_idx = 2  # Fallback to OFFICIEL

    page = reader.pages[page_idx]
    w = float(page.mediabox.width)
    h = float(page.mediabox.height)

    layout = LAYOUT_MAP.get(page_idx)

    if layout:
        # Build participant data mapping
        full_name = f"{participant.get('prenom', '')} {participant.get('nom', '')}".strip()
        data = {
            "nom": full_name,
            "representant": participant.get("organisation", participant.get("organization_name", "")),
            "acces": participant.get("acces", "Toutes zones"),
            "scene": participant.get("scene", ""),
            "date_heure": participant.get("date_heure", ""),
            "fonction": participant.get("fonction", participant.get("function", "")),
            "jours": participant.get("jours", "20-23 Mai 2026"),
            "stand": participant.get("stand", participant.get("stand_number", "")),
        }

        overlay_packet = _build_overlay(w, h, layout, data, use_gold=(page_idx in DARK_BG_PAGES))
        overlay_reader = PdfReader(overlay_packet)
        page.merge_page(overlay_reader.pages[0])

    writer = PdfWriter()
    writer.add_page(page)

    output = io.BytesIO()
    writer.write(output)
    output.seek(0)
    return output


def generate_batch_invitations(participants: list) -> io.BytesIO:
    """
    Generate a single PDF with all participants' invitations.
    Each participant gets their own page.
    """
    if not os.path.exists(TEMPLATE_PATH):
        raise FileNotFoundError(f"Template not found: {TEMPLATE_PATH}")

    writer = PdfWriter()

    for participant in participants:
        try:
            single_pdf = generate_invitation_pdf(participant)
            single_reader = PdfReader(single_pdf)
            writer.add_page(single_reader.pages[0])
        except Exception as e:
            logger.error(f"Error generating invitation for {participant.get('nom', '?')}: {e}")
            continue

    output = io.BytesIO()
    writer.write(output)
    output.seek(0)
    return output
