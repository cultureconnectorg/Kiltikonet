"""
Smart Engine Unifié — CVLN Data System
8 flux de données centralisés pour Culture Connect 2026
100% MongoDB interne — Aucune API externe
"""
import os
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/smart-engine", tags=["smart-engine-cvln"])

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]


# ═══════════════════════════════════════════════════════════════
# 1. ANALYSE PRÉDICTIVE
# Tendances d'inscription, prévisions d'affluence
# ═══════════════════════════════════════════════════════════════
@router.get("/predictive")
async def get_predictive_analysis(days: int = 30):
    """Analyse prédictive — tendances et projections"""
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(days=days)).isoformat()

    # Daily registration trend
    reg_pipeline = [
        {"$match": {"created_at": {"$gte": cutoff}}},
        {"$addFields": {
            "date": {"$dateToString": {
                "format": "%Y-%m-%d",
                "date": {"$dateFromString": {"dateString": "$created_at"}}
            }}
        }},
        {"$group": {"_id": "$date", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    daily_regs = await _db.cc_badges.aggregate(reg_pipeline).to_list(60)

    # Daily page views trend
    pv_pipeline = [
        {"$match": {"event_type": "page_view", "created_at": {"$gte": cutoff}}},
        {"$addFields": {
            "date": {"$dateToString": {
                "format": "%Y-%m-%d",
                "date": {"$dateFromString": {"dateString": "$created_at"}}
            }}
        }},
        {"$group": {"_id": "$date", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    daily_views = await _db.analytics_events.aggregate(pv_pipeline).to_list(60)

    # Registrations by type over time
    type_pipeline = [
        {"$match": {"created_at": {"$gte": cutoff}}},
        {"$group": {"_id": "$type_badge", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    by_type = await _db.cc_badges.aggregate(type_pipeline).to_list(20)

    # Simple projection: avg daily rate * remaining days to event
    total_regs = await _db.cc_badges.count_documents({})
    event_date = datetime(2026, 5, 20, tzinfo=timezone.utc)
    days_remaining = max((event_date - now).days, 1)
    avg_daily = len(daily_regs) and sum(d["count"] for d in daily_regs) / max(len(daily_regs), 1)
    projected_total = int(total_regs + avg_daily * days_remaining)

    return {
        "stream": "predictive",
        "daily_registrations": daily_regs,
        "daily_page_views": daily_views,
        "registrations_by_type": [{"type": d["_id"], "count": d["count"]} for d in by_type],
        "current_total": total_regs,
        "avg_daily_rate": round(avg_daily, 1),
        "projected_total_at_event": projected_total,
        "days_remaining": days_remaining,
        "generated_at": now.isoformat()
    }


# ═══════════════════════════════════════════════════════════════
# 2. MGRAPH — Graphe relationnel
# Connexions entre professionnels
# ═══════════════════════════════════════════════════════════════
@router.get("/mgraph")
async def get_mgraph():
    """Mgraph — Graphe de relations entre professionnels"""
    # Get all pro connections
    connections = await _db.pro_connections.find(
        {}, {"_id": 0, "from_profile": 1, "to_profile": 1, "status": 1, "created_at": 1}
    ).to_list(500)

    # Get pro profiles for nodes
    profiles = await _db.registrations.find(
        {}, {"_id": 0, "id": 1, "full_name": 1, "profile_type": 1, "organization_name": 1, "country": 1}
    ).to_list(500)

    # Build nodes and edges
    nodes = []
    for p in profiles:
        nodes.append({
            "id": p.get("id", ""),
            "label": p.get("full_name", ""),
            "type": p.get("profile_type", "other"),
            "org": p.get("organization_name", ""),
            "country": p.get("country", "")
        })

    edges = []
    for c in connections:
        edges.append({
            "from": c.get("from_profile", ""),
            "to": c.get("to_profile", ""),
            "status": c.get("status", "pending"),
        })

    # Cluster analysis
    type_counts = {}
    for n in nodes:
        t = n["type"]
        type_counts[t] = type_counts.get(t, 0) + 1

    return {
        "stream": "mgraph",
        "nodes": nodes,
        "edges": edges,
        "total_nodes": len(nodes),
        "total_edges": len(edges),
        "clusters": type_counts,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


# ═══════════════════════════════════════════════════════════════
# 3. LIVE AUDIENCE — Audience temps réel
# Sessions actives, pages consultées en ce moment
# ═══════════════════════════════════════════════════════════════
@router.get("/live-audience")
async def get_live_audience():
    """Live Audience — Données temps réel"""
    now = datetime.now(timezone.utc)
    last_5min = (now - timedelta(minutes=5)).isoformat()
    last_hour = (now - timedelta(hours=1)).isoformat()
    last_24h = (now - timedelta(hours=24)).isoformat()

    # Active sessions (last 5 min)
    active_pipeline = [
        {"$match": {"created_at": {"$gte": last_5min}}},
        {"$group": {"_id": "$session_id"}},
        {"$count": "total"}
    ]
    active_result = await _db.analytics_events.aggregate(active_pipeline).to_list(1)
    active_now = active_result[0]["total"] if active_result else 0

    # Current pages being viewed
    pages_pipeline = [
        {"$match": {"event_type": "page_view", "created_at": {"$gte": last_5min}}},
        {"$group": {"_id": "$data.page", "viewers": {"$sum": 1}}},
        {"$sort": {"viewers": -1}},
        {"$limit": 10}
    ]
    current_pages = await _db.analytics_events.aggregate(pages_pipeline).to_list(10)

    # Hourly trend (last 24h)
    hourly_pipeline = [
        {"$match": {"event_type": "page_view", "created_at": {"$gte": last_24h}}},
        {"$addFields": {
            "hour": {"$hour": {"$dateFromString": {"dateString": "$created_at"}}}
        }},
        {"$group": {"_id": "$hour", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    hourly = await _db.analytics_events.aggregate(hourly_pipeline).to_list(24)

    # Sessions last hour
    hour_pipeline = [
        {"$match": {"created_at": {"$gte": last_hour}}},
        {"$group": {"_id": "$session_id"}},
        {"$count": "total"}
    ]
    hour_result = await _db.analytics_events.aggregate(hour_pipeline).to_list(1)
    sessions_last_hour = hour_result[0]["total"] if hour_result else 0

    return {
        "stream": "live-audience",
        "active_now": active_now,
        "sessions_last_hour": sessions_last_hour,
        "current_pages": [{"page": p["_id"] or "/", "viewers": p["viewers"]} for p in current_pages],
        "hourly_trend": [{"hour": h["_id"], "views": h["count"]} for h in hourly],
        "generated_at": now.isoformat()
    }


# ═══════════════════════════════════════════════════════════════
# 4. CREATION ORIGIN — Origines culturelles
# Géographie des inscrits, langues, territoires
# ═══════════════════════════════════════════════════════════════
@router.get("/creation-origin")
async def get_creation_origin():
    """Creation Origin — Origines géographiques et culturelles"""
    # Country distribution
    country_pipeline = [
        {"$match": {"country": {"$ne": None, "$ne": ""}}},
        {"$group": {"_id": "$country", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    # From registrations
    reg_countries = await _db.registrations.aggregate(country_pipeline).to_list(50)

    # From badges
    badge_countries = await _db.cc_badges.aggregate([
        {"$match": {"organisation": {"$ne": None, "$ne": ""}}},
        {"$group": {"_id": "$organisation", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 20}
    ]).to_list(20)

    # Language preferences
    lang_pipeline = [
        {"$group": {"_id": "$language_preference", "count": {"$sum": 1}}}
    ]
    languages = await _db.registrations.aggregate(lang_pipeline).to_list(10)

    # Profile types distribution
    profile_pipeline = [
        {"$group": {"_id": "$profile_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    profiles = await _db.registrations.aggregate(profile_pipeline).to_list(20)

    # Visitor device types from analytics
    device_pipeline = [
        {"$match": {"event_type": "page_view", "data.isMobile": {"$exists": True}}},
        {"$group": {
            "_id": {"$cond": [{"$eq": ["$data.isMobile", True]}, "mobile", "desktop"]},
            "count": {"$sum": 1}
        }}
    ]
    devices = await _db.analytics_events.aggregate(device_pipeline).to_list(5)

    return {
        "stream": "creation-origin",
        "countries": [{"country": c["_id"], "count": c["count"]} for c in reg_countries],
        "organizations": [{"org": o["_id"], "count": o["count"]} for o in badge_countries],
        "languages": [{"lang": l["_id"] or "fr", "count": l["count"]} for l in languages],
        "profile_types": [{"type": p["_id"] or "other", "count": p["count"]} for p in profiles],
        "devices": [{"type": d["_id"], "count": d["count"]} for d in devices],
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


# ═══════════════════════════════════════════════════════════════
# 5. CULTURAL DIFFUSION — Diffusion culturelle
# Partages, rayonnement, engagement social
# ═══════════════════════════════════════════════════════════════
@router.get("/cultural-diffusion")
async def get_cultural_diffusion(days: int = 30):
    """Cultural Diffusion — Rayonnement et partage culturel"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    # Referrer analysis (where visitors come from)
    referrer_pipeline = [
        {"$match": {"event_type": "page_view", "created_at": {"$gte": cutoff}, "data.referrer": {"$ne": ""}}},
        {"$group": {"_id": "$data.referrer", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 15}
    ]
    referrers = await _db.analytics_events.aggregate(referrer_pipeline).to_list(15)

    # Page engagement (time on page approximation via event counts)
    engagement_pipeline = [
        {"$match": {"created_at": {"$gte": cutoff}}},
        {"$group": {
            "_id": "$data.page",
            "total_events": {"$sum": 1},
            "unique_sessions": {"$addToSet": "$session_id"}
        }},
        {"$project": {
            "page": "$_id",
            "total_events": 1,
            "unique_visitors": {"$size": "$unique_sessions"},
            "engagement_score": {"$divide": ["$total_events", {"$max": [{"$size": "$unique_sessions"}, 1]}]}
        }},
        {"$sort": {"engagement_score": -1}},
        {"$limit": 10}
    ]
    engagement = await _db.analytics_events.aggregate(engagement_pipeline).to_list(10)

    # Social shares (from contact messages, partnership requests as proxy)
    total_contacts = await _db.contact_messages.count_documents({"created_at": {"$gte": cutoff}})
    total_partners = await _db.partners.count_documents({})

    # Scroll depth from analytics
    scroll_pipeline = [
        {"$match": {"event_type": "scroll_depth", "created_at": {"$gte": cutoff}}},
        {"$group": {"_id": "$data.page", "avg_depth": {"$avg": "$data.depth"}, "count": {"$sum": 1}}},
        {"$sort": {"avg_depth": -1}},
        {"$limit": 10}
    ]
    scroll_data = await _db.analytics_events.aggregate(scroll_pipeline).to_list(10)

    return {
        "stream": "cultural-diffusion",
        "referrers": [{"source": r["_id"] or "direct", "visits": r["count"]} for r in referrers],
        "page_engagement": [{"page": e["_id"] or "/", "events": e["total_events"], "visitors": e["unique_visitors"], "score": round(e.get("engagement_score", 0), 1)} for e in engagement],
        "scroll_depth": [{"page": s["_id"], "avg_depth": round(s["avg_depth"], 1), "samples": s["count"]} for s in scroll_data],
        "contact_inquiries": total_contacts,
        "partnerships": total_partners,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


# ═══════════════════════════════════════════════════════════════
# 6. CONVERSION — Funnel de conversion
# Visite → Inscription → Paiement → Badge
# ═══════════════════════════════════════════════════════════════
@router.get("/conversion")
async def get_conversion_funnel(days: int = 30):
    """Conversion — Funnel complet visite→inscription→paiement"""
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(days=days)).isoformat()

    # Total unique visitors
    visitors_pipeline = [
        {"$match": {"event_type": "page_view", "created_at": {"$gte": cutoff}}},
        {"$group": {"_id": "$session_id"}},
        {"$count": "total"}
    ]
    visitors_r = await _db.analytics_events.aggregate(visitors_pipeline).to_list(1)
    total_visitors = visitors_r[0]["total"] if visitors_r else 0

    # Visitors who viewed pricing/tarifs
    pricing_pipeline = [
        {"$match": {
            "event_type": "page_view",
            "created_at": {"$gte": cutoff},
            "data.page": {"$in": ["/pricing", "/tarifs", "/register-pro", "/badge-inscription"]}
        }},
        {"$group": {"_id": "$session_id"}},
        {"$count": "total"}
    ]
    pricing_r = await _db.analytics_events.aggregate(pricing_pipeline).to_list(1)
    pricing_viewers = pricing_r[0]["total"] if pricing_r else 0

    # Total badges created in period
    total_badges = await _db.cc_badges.count_documents({"created_at": {"$gte": cutoff}})

    # Paid registrations (via stripe) in period
    paid_regs = await _db.registrations.count_documents({"created_at": {"$gte": cutoff}, "payment_status": "paid"})

    # Free badges
    free_badges = await _db.cc_badges.count_documents({"created_at": {"$gte": cutoff}, "type_badge": "VIS"})

    # Revenue from stripe
    stripe_payments = await _db.stripe_payments.find(
        {"created_at": {"$gte": cutoff}},
        {"_id": 0, "amount": 1, "type": 1}
    ).to_list(500)
    total_revenue = sum(p.get("amount", 0) for p in stripe_payments) / 100

    # Daily conversion
    daily_pipeline = [
        {"$match": {"created_at": {"$gte": cutoff}}},
        {"$addFields": {
            "date": {"$dateToString": {"format": "%Y-%m-%d", "date": {"$dateFromString": {"dateString": "$created_at"}}}}
        }},
        {"$group": {"_id": "$date", "badges": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    daily_badges = await _db.cc_badges.aggregate(daily_pipeline).to_list(60)

    return {
        "stream": "conversion",
        "funnel": {
            "visitors": total_visitors,
            "pricing_viewers": pricing_viewers,
            "inscriptions": total_badges,
            "paid": paid_regs,
            "free": free_badges,
        },
        "rates": {
            "visit_to_pricing": round((pricing_viewers / max(total_visitors, 1)) * 100, 1),
            "pricing_to_inscription": round((total_badges / max(pricing_viewers, 1)) * 100, 1),
            "overall": round((total_badges / max(total_visitors, 1)) * 100, 1),
        },
        "revenue": {
            "total_eur": round(total_revenue, 2),
            "payments_count": len(stripe_payments),
        },
        "daily_conversions": daily_badges,
        "generated_at": now.isoformat()
    }


# ═══════════════════════════════════════════════════════════════
# 7. VERIFIED IDENTITY — Identités vérifiées
# Badges actifs, NFC, FREK IDs
# ═══════════════════════════════════════════════════════════════
@router.get("/verified-identity")
async def get_verified_identity():
    """Verified Identity — Badges et identités vérifiées"""
    # Total badges
    total = await _db.cc_badges.count_documents({})

    # By status
    status_pipeline = [
        {"$group": {"_id": "$statut", "count": {"$sum": 1}}}
    ]
    by_status = await _db.cc_badges.aggregate(status_pipeline).to_list(10)

    # By type
    type_pipeline = [
        {"$group": {"_id": "$type_badge", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    by_type = await _db.cc_badges.aggregate(type_pipeline).to_list(20)

    # NFC enabled badges
    nfc_enabled = await _db.cc_badges.count_documents({"nfc_enabled": True})
    nfc_linked = await _db.cc_badges.count_documents({"nfc_uid": {"$ne": ""}})

    # FREK verified
    frek_verified = await _db.cc_badges.count_documents({"frek_id": {"$ne": ""}})

    # Badges printed & handed out
    printed = await _db.cc_badges.count_documents({"imprime": True})
    handed = await _db.cc_badges.count_documents({"remis": True})

    # Recent badges
    recent = await _db.cc_badges.find(
        {}, {"_id": 0, "badge_id": 1, "prenom": 1, "nom": 1, "type_badge": 1, "statut": 1, "created_at": 1}
    ).sort("created_at", -1).limit(10).to_list(10)

    return {
        "stream": "verified-identity",
        "total_badges": total,
        "by_status": {s["_id"]: s["count"] for s in by_status},
        "by_type": [{"type": t["_id"], "count": t["count"]} for t in by_type],
        "nfc": {"enabled": nfc_enabled, "linked": nfc_linked},
        "frek_verified": frek_verified,
        "printed": printed,
        "handed_out": handed,
        "recent_badges": recent,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


# ═══════════════════════════════════════════════════════════════
# 8. CREATIVE NETWORK — Réseau créatif
# Collaborations, matchmaking, activité pro
# ═══════════════════════════════════════════════════════════════
@router.get("/creative-network")
async def get_creative_network():
    """Creative Network — Collaborations et matchmaking"""
    now = datetime.now(timezone.utc)
    week_ago = (now - timedelta(days=7)).isoformat()

    # Pro connections stats
    total_connections = await _db.pro_connections.count_documents({})
    accepted = await _db.pro_connections.count_documents({"status": "accepted"})
    pending = await _db.pro_connections.count_documents({"status": "pending"})

    # Messages activity
    total_messages = await _db.pro_messages.count_documents({})
    recent_messages = await _db.pro_messages.count_documents({"created_at": {"$gte": week_ago}})

    # Opportunities
    total_opps = await _db.pro_opportunities.count_documents({})
    active_opps = await _db.pro_opportunities.count_documents({"status": "open"})

    # Events
    total_events = await _db.pro_events.count_documents({})

    # Most connected profiles
    connected_pipeline = [
        {"$match": {"status": "accepted"}},
        {"$group": {"_id": "$from_profile", "connections": {"$sum": 1}}},
        {"$sort": {"connections": -1}},
        {"$limit": 10}
    ]
    top_connected = await _db.pro_connections.aggregate(connected_pipeline).to_list(10)

    # Enrich top connected with names
    top_profiles = []
    for tc in top_connected:
        profile = await _db.registrations.find_one(
            {"id": tc["_id"]}, {"_id": 0, "full_name": 1, "profile_type": 1, "organization_name": 1}
        )
        top_profiles.append({
            "id": tc["_id"],
            "name": profile.get("full_name", "Inconnu") if profile else "Inconnu",
            "type": profile.get("profile_type", "") if profile else "",
            "org": profile.get("organization_name", "") if profile else "",
            "connections": tc["connections"]
        })

    # Activity by type
    activity_pipeline = [
        {"$match": {
            "event_type": {"$in": ["pro_connection", "pro_profile_view", "opportunity_interaction", "message_sent"]},
            "created_at": {"$gte": week_ago}
        }},
        {"$group": {"_id": "$event_type", "count": {"$sum": 1}}}
    ]
    activity = await _db.analytics_events.aggregate(activity_pipeline).to_list(10)

    return {
        "stream": "creative-network",
        "connections": {"total": total_connections, "accepted": accepted, "pending": pending},
        "messages": {"total": total_messages, "this_week": recent_messages},
        "opportunities": {"total": total_opps, "active": active_opps},
        "events": {"total": total_events},
        "top_connected": top_profiles,
        "weekly_activity": {a["_id"]: a["count"] for a in activity},
        "generated_at": now.isoformat()
    }


# ═══════════════════════════════════════════════════════════════
# DASHBOARD UNIFIÉ — Vue consolidée des 8 flux
# ═══════════════════════════════════════════════════════════════
@router.get("/dashboard")
async def get_unified_dashboard():
    """Dashboard unifié — Résumé des 8 flux CVLN"""
    now = datetime.now(timezone.utc)
    yesterday = (now - timedelta(days=1)).isoformat()

    # Quick metrics for dashboard overview
    total_badges = await _db.cc_badges.count_documents({})
    total_events_24h = await _db.analytics_events.count_documents({"created_at": {"$gte": yesterday}})
    total_registrations = await _db.registrations.count_documents({})
    total_connections = await _db.pro_connections.count_documents({})
    total_messages = await _db.pro_messages.count_documents({})

    # Active sessions right now
    last_5min = (now - timedelta(minutes=5)).isoformat()
    active_pipeline = [
        {"$match": {"created_at": {"$gte": last_5min}}},
        {"$group": {"_id": "$session_id"}},
        {"$count": "total"}
    ]
    active_r = await _db.analytics_events.aggregate(active_pipeline).to_list(1)
    active_now = active_r[0]["total"] if active_r else 0

    # NFC stats
    nfc_enabled = await _db.cc_badges.count_documents({"nfc_enabled": True})

    return {
        "stream": "dashboard",
        "overview": {
            "total_badges": total_badges,
            "total_registrations": total_registrations,
            "events_24h": total_events_24h,
            "active_now": active_now,
            "connections": total_connections,
            "messages": total_messages,
            "nfc_enabled": nfc_enabled,
        },
        "streams": [
            {"id": "predictive", "name": "Analyse Prédictive", "status": "active"},
            {"id": "mgraph", "name": "Mgraph", "status": "active"},
            {"id": "live-audience", "name": "Live Audience", "status": "active"},
            {"id": "creation-origin", "name": "Creation Origin", "status": "active"},
            {"id": "cultural-diffusion", "name": "Cultural Diffusion", "status": "active"},
            {"id": "conversion", "name": "Conversion", "status": "active"},
            {"id": "verified-identity", "name": "Verified Identity", "status": "active"},
            {"id": "creative-network", "name": "Creative Network", "status": "active"},
        ],
        "generated_at": now.isoformat()
    }
