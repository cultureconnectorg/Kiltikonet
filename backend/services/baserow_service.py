"""
Baserow Service — Mirror badge data to table 865847
Token has row CRUD but NOT field creation permission.
Uses: Nom (name), Type baserow (badge_id), Valeur/Notes (JSON blob)
"""
import os
import json
import logging
from typing import Optional
import httpx

logger = logging.getLogger(__name__)

BASEROW_URL = os.environ.get("BASEROW_URL", "https://api.baserow.io")
BASEROW_TOKEN = os.environ.get("BASEROW_TOKEN", "")
TABLE_BADGES = os.environ.get("TABLE_BADGES", "865847")


def _headers() -> dict:
    return {
        "Authorization": f"Token {BASEROW_TOKEN}",
        "Content-Type": "application/json",
    }


async def mirror_badge(badge_data: dict) -> Optional[int]:
    """Mirror badge to Baserow table 865847 using available fields.
    Nom = 'prenom nom', Type baserow = badge_id, Valeur/Notes = JSON
    Returns Baserow row ID or None.
    """
    row_data = {
        "Nom": f"{badge_data.get('prenom', '')} {badge_data.get('nom', '')}".strip(),
        "Type baserow": badge_data.get("badge_id", ""),
        "Valeur/Notes": json.dumps({
            "badge_id": badge_data.get("badge_id"),
            "frek_id": badge_data.get("frek_id"),
            "type_badge": badge_data.get("type_badge"),
            "statut": badge_data.get("statut"),
            "qr_token": badge_data.get("qr_token"),
            "nfc_enabled": badge_data.get("nfc_enabled"),
            "jetons_solde": badge_data.get("jetons_solde", 0),
            "email": badge_data.get("email"),
            "organisation": badge_data.get("organisation"),
            "date_emission": badge_data.get("date_emission"),
        }, ensure_ascii=False),
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{BASEROW_URL}/api/database/rows/table/{TABLE_BADGES}/?user_field_names=true",
                headers=_headers(),
                json=row_data,
            )
            if resp.status_code in (200, 201):
                row_id = resp.json().get("id")
                logger.info(f"Baserow mirror OK: {badge_data.get('badge_id')} -> row {row_id}")
                return row_id
            logger.error(f"Baserow mirror error: {resp.status_code} {resp.text}")
            return None
    except Exception as e:
        logger.error(f"Baserow mirror exception: {e}")
        return None


async def update_mirror(baserow_row_id: int, badge_data: dict) -> bool:
    """Update mirrored badge in Baserow"""
    row_data = {
        "Nom": f"{badge_data.get('prenom', '')} {badge_data.get('nom', '')}".strip(),
        "Type baserow": badge_data.get("badge_id", ""),
        "Valeur/Notes": json.dumps({
            "badge_id": badge_data.get("badge_id"),
            "frek_id": badge_data.get("frek_id"),
            "type_badge": badge_data.get("type_badge"),
            "statut": badge_data.get("statut"),
            "qr_token": badge_data.get("qr_token"),
            "nfc_enabled": badge_data.get("nfc_enabled"),
            "jetons_solde": badge_data.get("jetons_solde", 0),
            "email": badge_data.get("email"),
            "organisation": badge_data.get("organisation"),
        }, ensure_ascii=False),
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.patch(
                f"{BASEROW_URL}/api/database/rows/table/{TABLE_BADGES}/{baserow_row_id}/?user_field_names=true",
                headers=_headers(),
                json=row_data,
            )
            return resp.status_code == 200
    except Exception as e:
        logger.error(f"Baserow update mirror error: {e}")
        return False


async def get_all_rows() -> list:
    """Get all rows from Baserow for admin view"""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{BASEROW_URL}/api/database/rows/table/{TABLE_BADGES}/?user_field_names=true&size=200",
                headers=_headers(),
            )
            if resp.status_code == 200:
                return resp.json().get("results", [])
            return []
    except Exception:
        return []


async def find_by_badge_id(badge_id: str) -> Optional[dict]:
    """Find a row by badge_id (stored in 'Type baserow')"""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{BASEROW_URL}/api/database/rows/table/{TABLE_BADGES}/",
                headers=_headers(),
                params={
                    "user_field_names": "true",
                    "filter__Type baserow__equal": badge_id,
                    "size": 1,
                },
            )
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                return results[0] if results else None
            return None
    except Exception:
        return None
