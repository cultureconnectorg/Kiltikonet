"""
Dashboard Agents IA — Cartographie et monitoring des agents automatisés
Routes /api/ai-agents/ pour l'administration CC2026
"""
import os
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai-agents", tags=["ai-agents"])

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]

# Registry of all automated agents/services in the system
AGENT_REGISTRY = [
    {
        "id": "smart-engine-cvln",
        "name": "Smart Engine CVLN",
        "description": "Système de data centralisé — 8 flux (Prédictif, Mgraph, Live Audience, Creation Origin, Cultural Diffusion, Conversion, Verified Identity, Creative Network)",
        "type": "analytics",
        "category": "core",
        "endpoints": ["/api/smart-engine/predictive", "/api/smart-engine/mgraph", "/api/smart-engine/live-audience", "/api/smart-engine/creation-origin", "/api/smart-engine/cultural-diffusion", "/api/smart-engine/conversion", "/api/smart-engine/verified-identity", "/api/smart-engine/creative-network", "/api/smart-engine/dashboard"],
        "source_file": "routes/smart_engine.py",
        "auto_enabled": True,
    },
    {
        "id": "alert-engine",
        "name": "Moteur d'Alertes",
        "description": "Détecte les anomalies (pic de trafic, conversion faible, deadlines, erreurs) et envoie des notifications automatiques à l'équipe",
        "type": "monitoring",
        "category": "core",
        "endpoints": ["/api/smart-engine/check-alerts", "/api/smart-engine/alerts/rules", "/api/smart-engine/cron/check"],
        "source_file": "server.py (L.8093-8204)",
        "auto_enabled": True,
    },
    {
        "id": "badge-generator",
        "name": "Générateur de Badges",
        "description": "Génère automatiquement les badges CC2026 avec QR code, identifiant unique et intégration FREK pour chaque inscription",
        "type": "automation",
        "category": "core",
        "endpoints": ["/api/badges/inscrire", "/api/badges/generate-visual"],
        "source_file": "routes/badges.py",
        "auto_enabled": True,
    },
    {
        "id": "batch-processor",
        "name": "Processeur Batch",
        "description": "Traite les opérations en masse : approbation batch, envoi groupé de badges par email, export PDF",
        "type": "automation",
        "category": "operations",
        "endpoints": ["/api/registrations/batch/approve", "/api/registrations/batch/send-badges"],
        "source_file": "server.py (L.1543-1623)",
        "auto_enabled": True,
    },
    {
        "id": "stripe-webhook",
        "name": "Webhook Stripe",
        "description": "Gère automatiquement les événements de paiement Stripe : confirmation, activation de badge, mise à jour du statut",
        "type": "payment",
        "category": "integrations",
        "endpoints": ["/api/webhook/stripe"],
        "source_file": "server.py (L.1007-1063)",
        "auto_enabled": True,
    },
    {
        "id": "cms-sanitizer",
        "name": "Sanitiseur CMS",
        "description": "Filtre automatiquement les références obsolètes ('Tropiques Atrium' → 'TOM') dans le contenu CMS côté backend et frontend",
        "type": "content",
        "category": "maintenance",
        "endpoints": ["/api/cms/cleanup-atrium", "/api/public/content/{page}"],
        "source_file": "server.py (L.4444), hooks/useCMSContent.js",
        "auto_enabled": True,
    },
    {
        "id": "analytics-tracker",
        "name": "Tracker Analytics",
        "description": "Collecte les événements utilisateur (pages vues, clics, scroll depth, sessions) pour alimenter le Smart Engine",
        "type": "analytics",
        "category": "core",
        "endpoints": ["/api/analytics/batch", "/api/analytics/site"],
        "source_file": "routes/analytics.py, hooks/useAnalytics.js",
        "auto_enabled": True,
    },
    {
        "id": "email-service",
        "name": "Service Email (SES)",
        "description": "Envoie automatiquement les emails transactionnels : confirmations, QR codes, notifications, via AWS SES",
        "type": "communication",
        "category": "integrations",
        "endpoints": ["/api/ses/send", "/api/ses/send-batch"],
        "source_file": "routes/ses.py, services/ses_service.py",
        "auto_enabled": False,
        "warning": "AWS SES en mode Sandbox — emails limités aux adresses vérifiées",
    },
    {
        "id": "social-feed-engine",
        "name": "Moteur Social Pro",
        "description": "Gère le fil d'actualité, les recommandations de connexions et l'annuaire professionnel de l'Espace Pro",
        "type": "social",
        "category": "pro",
        "endpoints": ["/api/pro/social/feed", "/api/pro/social/posts", "/api/pro/social/directory", "/api/pro/social/recommendations/{profile_id}"],
        "source_file": "routes/pro_social.py",
        "auto_enabled": True,
    },
    {
        "id": "hcaptcha-guard",
        "name": "Gardien hCaptcha",
        "description": "Vérifie les tokens hCaptcha côté serveur pour protéger les formulaires d'inscription, contact et partenariat contre les bots",
        "type": "security",
        "category": "security",
        "endpoints": ["/api/contact", "/api/badges/inscrire", "/api/create-checkout-session"],
        "source_file": "services/hcaptcha.py",
        "auto_enabled": True,
    },
]


@router.get("/list")
async def list_agents():
    """Liste complète de tous les agents IA/automatisés du système"""
    agents = []
    for agent in AGENT_REGISTRY:
        # Check last activity from logs
        last_log = await _db.agent_logs.find_one(
            {"agent_id": agent["id"]}, {"_id": 0}, sort=[("timestamp", -1)]
        )
        # Check override status
        override = await _db.agent_overrides.find_one(
            {"agent_id": agent["id"]}, {"_id": 0}
        )

        agents.append({
            **agent,
            "enabled": override.get("enabled", agent["auto_enabled"]) if override else agent["auto_enabled"],
            "last_activity": last_log.get("timestamp") if last_log else None,
            "last_log_message": last_log.get("message") if last_log else None,
        })

    # Stats
    total = len(agents)
    active = sum(1 for a in agents if a["enabled"])
    by_category = {}
    for a in agents:
        cat = a.get("category", "other")
        by_category[cat] = by_category.get(cat, 0) + 1

    return {
        "agents": agents,
        "stats": {
            "total": total,
            "active": active,
            "inactive": total - active,
            "by_category": by_category,
        }
    }


@router.get("/{agent_id}/status")
async def get_agent_status(agent_id: str):
    """Statut détaillé d'un agent"""
    agent = next((a for a in AGENT_REGISTRY if a["id"] == agent_id), None)
    if not agent:
        return {"error": "Agent non trouvé"}

    # Check override
    override = await _db.agent_overrides.find_one({"agent_id": agent_id}, {"_id": 0})
    enabled = override.get("enabled", agent["auto_enabled"]) if override else agent["auto_enabled"]

    # Recent logs
    logs = await _db.agent_logs.find(
        {"agent_id": agent_id}, {"_id": 0}
    ).sort("timestamp", -1).limit(20).to_list(20)

    # Metrics (last 24h)
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    executions_24h = await _db.agent_logs.count_documents({
        "agent_id": agent_id, "timestamp": {"$gte": yesterday}
    })
    errors_24h = await _db.agent_logs.count_documents({
        "agent_id": agent_id, "timestamp": {"$gte": yesterday}, "level": "error"
    })

    return {
        **agent,
        "enabled": enabled,
        "logs": logs,
        "metrics": {
            "executions_24h": executions_24h,
            "errors_24h": errors_24h,
        }
    }


@router.get("/{agent_id}/logs")
async def get_agent_logs(agent_id: str, limit: int = 50):
    """Logs d'exécution d'un agent"""
    logs = await _db.agent_logs.find(
        {"agent_id": agent_id}, {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    return {"logs": logs, "agent_id": agent_id}


@router.post("/{agent_id}/toggle")
async def toggle_agent(agent_id: str):
    """Activer/désactiver un agent"""
    agent = next((a for a in AGENT_REGISTRY if a["id"] == agent_id), None)
    if not agent:
        return {"error": "Agent non trouvé"}

    override = await _db.agent_overrides.find_one({"agent_id": agent_id})
    current = override.get("enabled", agent["auto_enabled"]) if override else agent["auto_enabled"]
    new_state = not current

    await _db.agent_overrides.update_one(
        {"agent_id": agent_id},
        {"$set": {"agent_id": agent_id, "enabled": new_state, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )

    # Log the toggle
    await _db.agent_logs.insert_one({
        "agent_id": agent_id,
        "level": "info",
        "message": f"Agent {'activé' if new_state else 'désactivé'} manuellement",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {"success": True, "agent_id": agent_id, "enabled": new_state}
