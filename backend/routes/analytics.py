"""
Analytics Routes — Jetons Dashboard with FREK Core data
"""
import os
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter
from motor.motor_asyncio import AsyncIOMotorClient
from services.frek_client import frek_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]
JETON_VALEUR = float(os.environ.get("JETON_VALEUR_EURO", "1.50"))


@router.get("/jetons/overview")
async def jetons_overview():
    """Complete analytics overview for jetons dashboard"""
    badges = await _db.cc_badges.find(
        {}, {"_id": 0, "jetons_solde": 1, "type_badge": 1, "badge_id": 1, "prenom": 1, "nom": 1}
    ).to_list(5000)

    transactions = await _db.cc_transactions.find(
        {}, {"_id": 0}
    ).sort("timestamp", -1).to_list(5000)

    total_jetons = sum((b.get("jetons_solde") or 0) for b in badges)
    holders = [b for b in badges if (b.get("jetons_solde") or 0) > 0]

    # Purchases vs Spends
    achats = [t for t in transactions if t.get("type") == "achat"]
    depenses = [t for t in transactions if t.get("type") == "depense"]

    total_purchased = sum(t.get("jetons", 0) for t in achats)
    total_spent = sum(abs(t.get("jetons", 0)) for t in depenses)
    total_revenue_eur = sum(t.get("amount_eur", 0) for t in achats)

    # Pack distribution
    pack_counts = {}
    for t in achats:
        pack = t.get("pack", "unknown")
        pack_counts[pack] = pack_counts.get(pack, 0) + 1

    # Jetons by badge type
    jetons_by_type = {}
    for b in badges:
        bt = b.get("type_badge", "OTHER")
        jetons_by_type[bt] = jetons_by_type.get(bt, 0) + (b.get("jetons_solde") or 0)

    # Timeline (transactions per day)
    timeline = {}
    for t in transactions:
        ts = t.get("timestamp", "")
        day = ts[:10] if ts else "unknown"
        if day not in timeline:
            timeline[day] = {"date": day, "achats": 0, "depenses": 0, "volume": 0}
        if t.get("type") == "achat":
            timeline[day]["achats"] += t.get("jetons", 0)
        else:
            timeline[day]["depenses"] += abs(t.get("jetons", 0))
        timeline[day]["volume"] += 1

    timeline_sorted = sorted(timeline.values(), key=lambda x: x["date"])

    # Top holders
    top_holders = sorted(holders, key=lambda b: b.get("jetons_solde", 0), reverse=True)[:10]
    top_holders_list = [
        {
            "badge_id": h.get("badge_id"),
            "nom": f"{h.get('prenom', '')} {h.get('nom', '')}".strip(),
            "jetons": h.get("jetons_solde", 0),
            "type": h.get("type_badge", ""),
        }
        for h in top_holders
    ]

    # FREK core connection
    frek_data = {}
    try:
        frek_health = await frek_client.health()
        frek_data = {
            "connected": frek_health,
            "retry_queue": frek_client.retry_queue_size,
        }
    except Exception:
        frek_data = {"connected": False, "retry_queue": 0}

    return {
        "summary": {
            "total_jetons_circulation": total_jetons,
            "total_purchased": total_purchased,
            "total_spent": total_spent,
            "total_revenue_eur": round(total_revenue_eur, 2),
            "valeur_totale_eur": round(total_jetons * JETON_VALEUR, 2),
            "holders_count": len(holders),
            "total_badges": len(badges),
            "total_transactions": len(transactions),
        },
        "pack_distribution": [
            {"pack": k, "count": v} for k, v in pack_counts.items()
        ],
        "jetons_by_type": [
            {"type": k, "jetons": v} for k, v in jetons_by_type.items()
        ],
        "timeline": timeline_sorted,
        "top_holders": top_holders_list,
        "recent_transactions": [
            {
                "badge_id": t.get("badge_id"),
                "type": t.get("type"),
                "jetons": t.get("jetons"),
                "pack": t.get("pack", ""),
                "description": t.get("description", ""),
                "timestamp": t.get("timestamp"),
            }
            for t in transactions[:20]
        ],
        "frek_core": frek_data,
    }
