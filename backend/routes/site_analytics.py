"""
Site Analytics — 100% internal tracking (no Google Analytics)
Lightweight event tracking for page views, interactions, and user behavior.
"""
import os
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["site-analytics"])

_client = AsyncIOMotorClient(os.environ.get("MONGO_URL", ""))
_db = _client[os.environ.get("DB_NAME", "kiltikonet")]


class TrackEvent(BaseModel):
    event: str  # page_view, click, action
    page: Optional[str] = ""
    data: Optional[dict] = {}


@router.post("/track")
async def track_event(body: TrackEvent, request: Request):
    """Track a site event (page view, interaction, etc.)."""
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown").split(",")[0].strip()
    ua = request.headers.get("user-agent", "")

    # Detect device type from user-agent
    ua_lower = ua.lower()
    device = "desktop"
    if any(k in ua_lower for k in ("mobile", "android", "iphone", "ipad")):
        device = "mobile" if "ipad" not in ua_lower else "tablet"

    event = {
        "event": body.event,
        "page": body.page or "/",
        "data": body.data or {},
        "ip_hash": hash(ip) % (10**10),  # Hash IP for privacy
        "device": device,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await _db.site_events.insert_one({**event})
    return {"ok": True}


@router.post("/batch")
async def track_batch(request: Request):
    """Batch track multiple events at once (from SmartAnalytics frontend)."""
    body = await request.json()
    events = body.get("events", [])
    if not events:
        return {"ok": True, "count": 0}

    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown").split(",")[0].strip()
    ua = request.headers.get("user-agent", "")
    ua_lower = ua.lower()
    device = "desktop"
    if any(k in ua_lower for k in ("mobile", "android", "iphone", "ipad")):
        device = "mobile" if "ipad" not in ua_lower else "tablet"

    docs = []
    for ev in events[:100]:  # Max 100 events per batch
        docs.append({
            "event": ev.get("type", ev.get("event", "unknown")),
            "page": ev.get("page", ev.get("path", "/")),
            "data": ev.get("data", ev.get("properties", {})),
            "ip_hash": hash(ip) % (10**10),
            "device": device,
            "user_id": ev.get("userId"),
            "session_id": ev.get("sessionId"),
            "timestamp": ev.get("timestamp", datetime.now(timezone.utc).isoformat()),
        })

    if docs:
        await _db.site_events.insert_many(docs)

    return {"ok": True, "count": len(docs)}


@router.get("/site-stats")
async def site_stats():
    """Get aggregated site analytics for admin dashboard."""
    now = datetime.now(timezone.utc)
    day_ago = (now - timedelta(days=1)).isoformat()
    week_ago = (now - timedelta(days=7)).isoformat()
    month_ago = (now - timedelta(days=30)).isoformat()

    # Total events
    total_events = await _db.site_events.count_documents({})
    events_24h = await _db.site_events.count_documents({"timestamp": {"$gte": day_ago}})
    events_7d = await _db.site_events.count_documents({"timestamp": {"$gte": week_ago}})
    events_30d = await _db.site_events.count_documents({"timestamp": {"$gte": month_ago}})

    # Page views breakdown (last 30 days)
    page_views = await _db.site_events.find(
        {"event": "page_view", "timestamp": {"$gte": month_ago}},
        {"_id": 0, "page": 1}
    ).to_list(10000)

    pages_count = {}
    for pv in page_views:
        p = pv.get("page", "/")
        pages_count[p] = pages_count.get(p, 0) + 1

    top_pages = sorted(pages_count.items(), key=lambda x: x[1], reverse=True)[:10]

    # Device breakdown
    devices = await _db.site_events.find(
        {"timestamp": {"$gte": month_ago}},
        {"_id": 0, "device": 1}
    ).to_list(10000)

    device_count = {"desktop": 0, "mobile": 0, "tablet": 0}
    for d in devices:
        dev = d.get("device", "desktop")
        device_count[dev] = device_count.get(dev, 0) + 1

    # Unique visitors (by ip_hash, last 30 days)
    unique_hashes = set()
    visitors = await _db.site_events.find(
        {"timestamp": {"$gte": month_ago}},
        {"_id": 0, "ip_hash": 1}
    ).to_list(10000)
    for v in visitors:
        unique_hashes.add(v.get("ip_hash"))

    # Daily timeline (last 7 days)
    timeline = {}
    daily_events = await _db.site_events.find(
        {"timestamp": {"$gte": week_ago}},
        {"_id": 0, "timestamp": 1}
    ).to_list(10000)
    for ev in daily_events:
        day = ev.get("timestamp", "")[:10]
        timeline[day] = timeline.get(day, 0) + 1

    return {
        "overview": {
            "total_events": total_events,
            "events_24h": events_24h,
            "events_7d": events_7d,
            "events_30d": events_30d,
            "unique_visitors_30d": len(unique_hashes),
        },
        "top_pages": [{"page": p, "views": c} for p, c in top_pages],
        "devices": device_count,
        "timeline": [{"date": k, "events": v} for k, v in sorted(timeline.items())],
    }
