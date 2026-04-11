"""
Badge Routes — 14 types CC2026
Format: CC26-{TYPE}-{CODE5}
Primary storage: MongoDB | Mirror: Baserow table 865847
"""
import os
import uuid
import string
import secrets
import logging
import asyncio
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

from fastapi import APIRouter, HTTPException, Request
from services.frek_client import frek_client
from services.baserow_service import mirror_badge
from services import ses_service
from services.hcaptcha import verify_hcaptcha

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/badges", tags=["badges"])

# MongoDB connection (reuse from server.py env)
_client = AsyncIOMotorClient(os.environ.get("MONGO_URL", ""))
_db = _client[os.environ.get("DB_NAME", "kiltikonet")]

# ============ CONSTANTS ============

BADGE_TYPES = {
    "VIS": "Visiteur",
    "ART": "Artiste",
    "INT": "Intervenant",
    "STF": "Staff",
    "BNV": "Benevole",
    "PRS": "Presse",
    "VIP": "VIP",
    "OFF": "Officiel",
    "SPO": "Sponsor",
    "EXP-B": "Exposant Bronze",
    "EXP-S": "Exposant Silver",
    "EXP-G": "Exposant Gold",
    "EXP-P": "Exposant Platinum",
    "EXP-D": "Exposant Diamond",
    "EXP-VIP": "Exposant VIP",
}

NFC_ENABLED_TYPES = {"VIP", "OFF", "SPO", "EXP-G", "EXP-P", "EXP-D", "EXP-VIP"}

ZONE_ACCESS = {
    "ENTREE_GENERALE": set(BADGE_TYPES.keys()),
    "SCENE_PRINCIPALE": {"ART", "OFF", "VIP", "STF"},
    "VIP_LOUNGE": {"VIP", "OFF", "SPO", "EXP-VIP"},
    "BACKSTAGE": {"ART", "STF"},
    "EXPOSANTS": {"EXP-B", "EXP-S", "EXP-G", "EXP-P", "EXP-D", "EXP-VIP", "STF"},
    "PRESSE": {"PRS", "OFF"},
    "ATELIERS_PREMIUM": set(BADGE_TYPES.keys()),
}


def _generate_code5() -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(chars) for _ in range(5))


def _generate_badge_id(badge_type: str) -> str:
    return f"CC26-{badge_type}-{_generate_code5()}"


def _generate_qr_token() -> str:
    return uuid.uuid4().hex


# ============ MODELS ============

class InscriptionRequest(BaseModel):
    prenom: str
    nom: str
    email: str
    type_badge: str
    organisation: Optional[str] = None
    captcha_token: Optional[str] = None


class ScanRequest(BaseModel):
    qr_token: Optional[str] = None
    badge_id: Optional[str] = None
    zone: str


# ============ ROUTES ============

@router.get("/frek-discovery")
async def frek_discovery():
    """Discover FREKcore API endpoints"""
    import httpx
    frek_url = os.environ.get("FREK_API_URL", "")
    results = {}
    paths_to_check = [
        "", "/health", "/v1/health", "/docs", "/openapi.json",
        "/badges", "/v1/badges", "/identity", "/v1/identity",
        "/auth/token", "/v1/auth/token",
    ]
    async with httpx.AsyncClient(timeout=5) as client:
        for path in paths_to_check:
            try:
                resp = await client.get(f"{frek_url}{path}")
                results[path or "/"] = {"status": resp.status_code, "content_type": resp.headers.get("content-type", "")}
            except Exception as e:
                results[path or "/"] = {"status": "error", "error": str(e)[:60]}
    return {"frek_url": frek_url, "endpoints": results}


@router.get("/single/{badge_id}")
async def get_badge(badge_id: str):
    """Get badge details by badge_id"""
    badge = await _db.cc_badges.find_one({"badge_id": badge_id}, {"_id": 0})
    if not badge:
        raise HTTPException(status_code=404, detail="Badge non trouvé")
    badge["type_label"] = BADGE_TYPES.get(badge.get("type_badge", ""), "")
    return badge


@router.post("/inscrire")
async def inscrire(req: InscriptionRequest, request: Request):
    # hCaptcha verification
    if req.captcha_token:
        client_ip = request.client.host if request.client else "unknown"
        captcha_result = await verify_hcaptcha(req.captcha_token, client_ip)
        if not captcha_result["success"]:
            raise HTTPException(status_code=403, detail=captcha_result["error"])

    if req.type_badge not in BADGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Type badge invalide. Types: {list(BADGE_TYPES.keys())}")

    # Check duplicate email in MongoDB
    existing = await _db.cc_badges.find_one({"email": req.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="Email deja inscrit")

    badge_id = _generate_badge_id(req.type_badge)
    qr_token = _generate_qr_token()
    nfc_enabled = req.type_badge in NFC_ENABLED_TYPES

    # FREK emit
    frek_result = await frek_client.emit(
        email=req.email, prenom=req.prenom, nom=req.nom, badge_type=req.type_badge,
    )
    frek_id = frek_result.get("frek_id", "")

    # Save to MongoDB (primary)
    badge_doc = {
        "badge_id": badge_id,
        "frek_id": frek_id,
        "prenom": req.prenom,
        "nom": req.nom,
        "email": req.email,
        "type_badge": req.type_badge,
        "statut": "INSCRIT",
        "qr_token": qr_token,
        "nfc_enabled": nfc_enabled,
        "nfc_uid": "",
        "jetons_solde": 0,
        "organisation": req.organisation or "",
        "date_emission": datetime.now(timezone.utc).isoformat(),
        "imprime": False,
        "remis": False,
        "baserow_row_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await _db.cc_badges.insert_one(badge_doc)

    # Mirror to Baserow (async, non-blocking)
    async def _mirror():
        row_id = await mirror_badge(badge_doc)
        if row_id:
            await _db.cc_badges.update_one(
                {"badge_id": badge_id}, {"$set": {"baserow_row_id": row_id}}
            )
    asyncio.create_task(_mirror())

    # Send welcome email (async)
    asyncio.create_task(ses_service.send_bienvenue(
        to_email=req.email, prenom=req.prenom, badge_id=badge_id,
        frek_id=frek_id, qr_token=qr_token,
    ))

    return {
        "badge_id": badge_id,
        "frek_id": frek_id,
        "frek_status": frek_result.get("status"),
        "type_badge": req.type_badge,
        "type_label": BADGE_TYPES[req.type_badge],
        "qr_token": qr_token,
        "nfc_enabled": nfc_enabled,
        "statut": "INSCRIT",
    }


@router.post("/scan")
async def scan_badge(req: ScanRequest):
    query = {}
    if req.qr_token:
        query["qr_token"] = req.qr_token
    elif req.badge_id:
        query["badge_id"] = req.badge_id
    else:
        raise HTTPException(status_code=400, detail="qr_token ou badge_id requis")

    badge = await _db.cc_badges.find_one(query, {"_id": 0})
    if not badge:
        raise HTTPException(status_code=404, detail="Badge non trouve")

    badge_type = badge.get("type_badge", "")
    statut = badge.get("statut", "")
    badge_id = badge.get("badge_id", "")

    if statut not in ("ACTIVE", "REMIS"):
        raise HTTPException(status_code=403, detail=f"Badge non actif (statut: {statut})")

    zone = req.zone.upper()
    if zone not in ZONE_ACCESS:
        raise HTTPException(status_code=400, detail=f"Zone inconnue: {zone}")

    has_access = badge_type in ZONE_ACCESS[zone]

    if zone == "ATELIERS_PREMIUM":
        jetons = badge.get("jetons_solde", 0) or 0
        if jetons < 5:
            return {
                "access": False, "badge_id": badge_id, "zone": zone,
                "reason": f"Jetons insuffisants ({jetons}/5 requis)",
            }

    frek_id = badge.get("frek_id", "")
    if has_access and zone == "SCENE_PRINCIPALE" and frek_id:
        asyncio.create_task(frek_client.record_stage(frek_id, "EMISSION"))

    # Log scan
    await _db.cc_scans.insert_one({
        "badge_id": badge_id, "zone": zone, "access": has_access,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    # --- BASEROW SYNC: POST scan data to table 865847 ---
    if has_access:
        try:
            from services.baserow_service import mirror_badge
            asyncio.create_task(mirror_badge({
                "prenom": badge.get("prenom", ""),
                "nom": badge.get("nom", ""),
                "badge_id": badge_id,
                "frek_id": frek_id,
                "type_badge": badge_type,
                "statut": f"SCAN_{zone}",
                "qr_token": badge.get("qr_token", ""),
                "nfc_enabled": badge.get("nfc_enabled", False),
                "email": badge.get("email", ""),
                "organisation": badge.get("organisation", ""),
                "date_emission": badge.get("date_emission", ""),
            }))
        except Exception as br_err:
            logger.error(f"Baserow scan sync error: {br_err}")
            # Backup to local collection for retry
            await _db.nfc_scans_backup.insert_one({
                "badge_id": badge_id, "zone": zone,
                "scan_data": {"frek_id": frek_id, "type_badge": badge_type},
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "synced": False,
            })

    return {
        "access": has_access,
        "badge_id": badge_id,
        "type_badge": badge_type,
        "type_label": BADGE_TYPES.get(badge_type, badge_type),
        "zone": zone,
        "statut": statut,
        "reason": "Acces autorise" if has_access else f"Type {badge_type} non autorise en zone {zone}",
    }


@router.get("/types")
async def get_badge_types():
    return {
        "types": BADGE_TYPES,
        "nfc_enabled_types": list(NFC_ENABLED_TYPES),
        "zones": {z: list(types) for z, types in ZONE_ACCESS.items()},
    }


@router.get("/lookup/{badge_id}")
async def lookup_badge(badge_id: str):
    badge = await _db.cc_badges.find_one({"badge_id": badge_id}, {"_id": 0})
    if not badge:
        raise HTTPException(status_code=404, detail="Badge non trouve")
    badge.pop("qr_token", None)
    badge.pop("baserow_row_id", None)
    badge["type_label"] = BADGE_TYPES.get(badge.get("type_badge", ""), "")
    return badge


@router.get("/list")
async def list_badges(statut: Optional[str] = None, type_badge: Optional[str] = None):
    query = {}
    if statut:
        query["statut"] = statut
    if type_badge:
        query["type_badge"] = type_badge
    badges = await _db.cc_badges.find(query, {"_id": 0, "qr_token": 0}).to_list(500)
    return {"badges": badges, "total": len(badges)}


@router.get("/stats")
async def badge_stats():
    badges = await _db.cc_badges.find({}, {"_id": 0}).to_list(5000)
    stats = {
        "total": len(badges),
        "by_type": {},
        "by_statut": {"INSCRIT": 0, "ACTIVE": 0, "REMIS": 0, "REVOQUE": 0},
        "nfc_count": 0,
        "jetons_total": 0,
    }
    for b in badges:
        t = b.get("type_badge", "UNKNOWN")
        s = b.get("statut", "INSCRIT")
        stats["by_type"][t] = stats["by_type"].get(t, 0) + 1
        if s in stats["by_statut"]:
            stats["by_statut"][s] += 1
        if b.get("nfc_enabled"):
            stats["nfc_count"] += 1
        stats["jetons_total"] += (b.get("jetons_solde") or 0)
    return stats


@router.get("/frek-status")
async def frek_status():
    is_healthy = await frek_client.health()
    return {
        "frek_available": is_healthy,
        "retry_queue_size": frek_client.retry_queue_size,
        "fallback_mode": os.environ.get("FREK_FALLBACK_MODE", "true"),
    }


@router.post("/frek-reconcile")
async def frek_reconcile():
    return await frek_client.reconcile()
