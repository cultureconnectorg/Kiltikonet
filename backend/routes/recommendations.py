"""
CC2026 Recommendation API Routes
Hybrid: Internal scoring + CVL BRAIN enrichment for top results
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
import logging

logger = logging.getLogger("server")

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

# DB reference set by server.py
_db = None

def init_db(db):
    global _db
    _db = db

@router.get("/connections/{badge_id}")
async def recommend_connections(badge_id: str, limit: int = 10, enrich: bool = False):
    """Get connection recommendations for a badge holder"""
    from services.recommendations import get_connection_recommendations
    result = await get_connection_recommendations(_db, badge_id, limit)

    if enrich and result.get("recommendations"):
        result = await _enrich_with_brain(result, "connections", badge_id)

    return result

@router.get("/events/{badge_id}")
async def recommend_events(badge_id: str, limit: int = 8, enrich: bool = False):
    """Get event recommendations for a badge holder"""
    from services.recommendations import get_event_recommendations
    result = await get_event_recommendations(_db, badge_id, limit)

    if enrich and result.get("recommendations"):
        result = await _enrich_with_brain(result, "events", badge_id)

    return result

@router.get("/partnerships/{badge_id}")
async def recommend_partnerships(badge_id: str, limit: int = 6, enrich: bool = False):
    """Get partnership recommendations for a badge holder"""
    from services.recommendations import get_partnership_recommendations
    result = await get_partnership_recommendations(_db, badge_id, limit)

    if enrich and result.get("recommendations"):
        result = await _enrich_with_brain(result, "partnerships", badge_id)

    return result

@router.get("/admin/overview")
async def admin_overview():
    """Admin overview of recommendation system stats"""
    from services.recommendations import get_admin_overview
    return await get_admin_overview(_db)

@router.get("/events")
async def list_events():
    """List all CC2026 events"""
    events = await _db.cc_events.find({}, {"_id": 0}).sort("date", 1).to_list(100)
    return {"events": events, "total": len(events)}


async def _enrich_with_brain(result, reco_type, badge_id):
    """Enrich top recommendations with CVL BRAIN analysis"""
    try:
        from services.cvl_brain import analyze_cultural_profile

        profile = result.get("profile", {})
        top_recos = result["recommendations"][:3]

        if reco_type == "connections":
            names = [r.get("name", "") for r in top_recos]
            prompt_ctx = (
                f"Le participant {profile.get('name', '')} (type: {profile.get('type', '')}, "
                f"score culturel: {profile.get('score', 0)}) cherche des connexions. "
                f"Top candidats: {', '.join(names)}. "
                f"Genere une courte justification personnalisee pour chaque connexion recommandee."
            )
        elif reco_type == "events":
            titles = [r.get("title", "") for r in top_recos]
            prompt_ctx = (
                f"Le participant {profile.get('name', '')} (type: {profile.get('type', '')}) "
                f"a ces evenements recommandes: {', '.join(titles)}. "
                f"Genere une courte justification personnalisee de pourquoi chaque evenement est pertinent pour ce profil."
            )
        else:
            orgs = [r.get("org_name", "") for r in top_recos]
            prompt_ctx = (
                f"L'organisation {profile.get('org', '')} cherche des partenariats. "
                f"Top organisations complementaires: {', '.join(orgs)}. "
                f"Genere une courte justification de partenariat pour chaque organisation."
            )

        brain_result = await analyze_cultural_profile(
            _db, badge_id, f"recommendation_enrichment_{reco_type}", extra_context=prompt_ctx
        )

        if brain_result and not brain_result.get("error"):
            result["brain_enrichment"] = {
                "analysis": brain_result.get("justification_score", ""),
                "enriched_at": datetime.now(timezone.utc).isoformat(),
            }
            result["enriched"] = True

    except Exception as e:
        logger.warning(f"CVL BRAIN enrichment failed for {badge_id}: {e}")
        result["enriched"] = False

    return result
