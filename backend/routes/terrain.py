"""
Terrain/Scan Routes — Badge validation, attendance, search, check-in
Extracted from server.py for maintainability.
"""
import os
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/api/terrain", tags=["terrain"])

_client = AsyncIOMotorClient(os.environ.get("MONGO_URL", ""))
_db = _client[os.environ.get("DB_NAME", "culture_connect_2026")]


class QRValidationRequest(BaseModel):
    badge_id: str
    validator_id: str = "staff"
    location: str = "entree_principale"


@router.post("/validate-badge")
async def validate_badge(request: QRValidationRequest):
    """Validate a badge via QR scan - Mark as Present"""
    registration = await _db.registrations.find_one(
        {"$or": [{"id": request.badge_id}, {"badge_id": request.badge_id}]},
        {"_id": 0}
    )
    if not registration:
        return {"status": "error", "code": "NOT_FOUND", "message": "Badge non trouve dans le systeme", "color": "red"}

    if registration.get("presence_status") == "present":
        return {
            "status": "already_scanned", "code": "DUPLICATE", "message": "Badge deja scanne",
            "scanned_at": registration.get("scanned_at", ""),
            "person": {
                "full_name": registration.get("full_name"),
                "organization_name": registration.get("organization_name"),
                "profile_type": registration.get("profile_type"),
                "tier": registration.get("tier")
            },
            "color": "orange"
        }

    if registration.get("status") != "approved":
        return {"status": "error", "code": "NOT_APPROVED", "message": f"Inscription non approuvee (statut: {registration.get('status', 'unknown')})", "color": "red"}

    scan_time = datetime.now(timezone.utc).isoformat()
    await _db.registrations.update_one(
        {"id": registration["id"]},
        {"$set": {"presence_status": "present", "scanned_at": scan_time, "scanned_by": request.validator_id, "scan_location": request.location}}
    )
    scan_event = {
        "id": str(uuid.uuid4()), "type": "badge_scan",
        "registration_id": registration["id"], "validator_id": request.validator_id,
        "location": request.location, "timestamp": scan_time
    }
    await _db.scan_events.insert_one(scan_event)

    return {
        "status": "success", "code": "VALIDATED", "message": "Entree validee !",
        "scanned_at": scan_time,
        "person": {
            "id": registration["id"], "full_name": registration.get("full_name"),
            "organization_name": registration.get("organization_name"),
            "profile_type": registration.get("profile_type"),
            "tier": registration.get("tier"), "country": registration.get("country")
        },
        "color": "green"
    }


@router.get("/affluence")
async def get_affluence():
    """Get real-time attendance count"""
    total_approved = await _db.registrations.count_documents({"status": "approved"})
    present_count = await _db.registrations.count_documents({"status": "approved", "presence_status": "present"})
    one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    recent_scans = await _db.scan_events.count_documents({"timestamp": {"$gte": one_hour_ago}})

    last_scans = await _db.scan_events.find({}, {"_id": 0}).sort("timestamp", -1).limit(5).to_list(5)
    enriched_scans = []
    for scan in last_scans:
        reg = await _db.registrations.find_one({"id": scan.get("registration_id")}, {"_id": 0, "full_name": 1, "organization_name": 1, "tier": 1})
        if reg:
            scan["person"] = reg
            enriched_scans.append(scan)

    return {
        "total_registered": total_approved, "present_count": present_count,
        "remaining": total_approved - present_count,
        "percentage": round((present_count / total_approved * 100) if total_approved > 0 else 0, 1),
        "recent_scans_1h": recent_scans, "last_scans": enriched_scans,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/search")
async def search_participants(q: str, limit: int = 10):
    """Quick search for participants by name"""
    if not q or len(q) < 2:
        return {"results": []}

    query = {
        "$or": [
            {"full_name": {"$regex": q, "$options": "i"}},
            {"organization_name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
        ],
        "status": "approved"
    }
    results = await _db.registrations.find(query, {
        "_id": 0, "id": 1, "full_name": 1, "organization_name": 1,
        "profile_type": 1, "tier": 1, "presence_status": 1, "scanned_at": 1
    }).limit(limit).to_list(limit)

    return {"results": results, "count": len(results)}


@router.post("/manual-checkin/{registration_id}")
async def manual_checkin(registration_id: str, validator_id: str = "staff"):
    """Manual check-in for a participant"""
    reg = await _db.registrations.find_one({"id": registration_id}, {"_id": 0})
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    if reg.get("presence_status") == "present":
        return {"status": "already_present", "message": "Deja present"}

    scan_time = datetime.now(timezone.utc).isoformat()
    await _db.registrations.update_one(
        {"id": registration_id},
        {"$set": {"presence_status": "present", "scanned_at": scan_time, "scanned_by": validator_id, "scan_location": "manual"}}
    )
    scan_event = {
        "id": str(uuid.uuid4()), "type": "manual_checkin",
        "registration_id": registration_id, "validator_id": validator_id,
        "location": "manual", "timestamp": scan_time
    }
    await _db.scan_events.insert_one(scan_event)

    return {"status": "success", "message": "Checkin manuel effectue", "scanned_at": scan_time}


@router.delete("/reset-presence/{registration_id}")
async def reset_presence(registration_id: str):
    """Reset presence status for a participant"""
    await _db.registrations.update_one(
        {"id": registration_id},
        {"$set": {"presence_status": None, "scanned_at": None, "scanned_by": None, "scan_location": None}}
    )
    return {"status": "success", "message": "Presence reinitialisee"}
