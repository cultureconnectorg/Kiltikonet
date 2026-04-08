"""
OMEGA ROUTER — Routes extraites de server.py + Infrastructure ITER.58
Brain (web-search, chat-enriched, memory), FREK (stats, health, nfc),
Badge lifecycle, Remboursement, Audit Logs, Brain Training Data,
Adhesion, Feed, Plafond 150EUR, RGPD
"""
import os
import uuid
import hashlib
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(tags=["omega"])

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]

TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY", "")
JETON_VALEUR = float(os.environ.get("JETON_VALEUR_EURO", "1.50"))
PLAFOND_EUR = 150.0

# Import frek client
from services.frek_client import frek_client as _frek

# Import doctrine permission
from routes.doctrine import require_permission as _require_perm


# ═══════════════════════════════════════════════════════════════
# AUDIT LOGS — Append-only, SHA256 chained
# ═══════════════════════════════════════════════════════════════

VALID_ACTION_TYPES = [
    "FREK_CERTIFY", "FEED_POST", "FEED_ECLAIR", "FEED_COMMENT",
    "BRAIN_QUERY", "WALLET_CREDIT", "WALLET_DEBIT", "TRADE_ORDER",
    "SHOP_PURCHASE", "ADHESION_SUBSCRIBE", "GOUVERNANCE_VOTE",
    "TERMINAL_DEPLOY", "NFC_SCAN", "BADGE_EMIT", "BADGE_SCAN",
    "SETTINGS_UPDATE", "AUTH_LOGIN", "AUTH_LOGOUT",
]


async def write_audit_log(user_frek_id: str, action_type: str, object_id: str = "",
                          object_type: str = "", metadata: dict = None, session_id: str = ""):
    """Write an immutable audit log entry with SHA256 chain."""
    if action_type not in VALID_ACTION_TYPES:
        logger.warning(f"Invalid audit action_type: {action_type}")
        return

    last_log = await _db.audit_logs.find_one(
        {}, {"_id": 0, "hash": 1}, sort=[("timestamp", -1)]
    )
    previous_hash = last_log["hash"] if last_log and last_log.get("hash") else "GENESIS"

    log_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    chain_input = f"{previous_hash}|{log_id}|{user_frek_id}|{action_type}|{timestamp}"
    current_hash = hashlib.sha256(chain_input.encode()).hexdigest()

    doc = {
        "log_id": log_id,
        "user_frek_id": user_frek_id,
        "action_type": action_type,
        "object_id": object_id,
        "object_type": object_type,
        "metadata": metadata or {},
        "timestamp": timestamp,
        "hash": current_hash,
        "session_id": session_id,
    }
    await _db.audit_logs.insert_one(doc)
    return log_id


# ═══════════════════════════════════════════════════════════════
# BRAIN TRAINING DATA — Append-only, cultural_score auto
# ═══════════════════════════════════════════════════════════════

_CULTURAL_KEYWORDS = [
    "martinique", "caraibe", "diaspora", "creole", "frek", "culture",
    "caribeen", "antilles", "guadeloupe", "guyane", "zouk", "bele",
    "madinina", "kilti", "outre-mer", "gwoka", "carnaval", "madras",
]


def compute_cultural_score(langue: str, input_text: str, output_text: str, context_tags: list) -> float:
    score = 0.0
    if langue == "kw":
        score += 0.2
    caribbean_tags = [t for t in context_tags if any(k in t.lower() for k in _CULTURAL_KEYWORDS)]
    if caribbean_tags:
        score += 0.2
    if len(input_text) > 50:
        score += 0.1
    output_lower = output_text.lower()
    if any(k in output_lower for k in _CULTURAL_KEYWORDS):
        score += 0.3
    return min(score, 1.0)


async def write_brain_training(frek_id: str, langue: str, input_text: str,
                                output_text: str, context_tags: list = None, session_id: str = ""):
    """Write brain training data entry."""
    tags = context_tags or []
    cultural_score = compute_cultural_score(langue, input_text, output_text, tags)
    doc = {
        "id": str(uuid.uuid4()),
        "frek_id": frek_id,
        "langue": langue,
        "input": input_text,
        "output": output_text[:2000],
        "context_tags": tags,
        "cultural_score": cultural_score,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session_id": session_id,
        "eligible_training": cultural_score > 0.6,
        "model_version": "scaffold-claude-sonnet-4",
    }
    await _db.brain_training_data.insert_one(doc)


# ═══════════════════════════════════════════════════════════════
# PLAFOND 150€ — Helper
# ═══════════════════════════════════════════════════════════════

async def check_plafond_150(email: str, jetons_to_add: int) -> dict:
    """Check DSP2 150EUR ceiling. Returns {ok, current_eur, after_eur, kyc_validated}."""
    reg = await _db.registrations.find_one({"email": email}, {"_id": 0, "jetons_solde": 1, "kyc_validated": 1})
    badge = await _db.cc_badges.find_one({"email": email}, {"_id": 0, "jetons_solde": 1})
    current_solde = (reg or {}).get("jetons_solde", 0) or (badge or {}).get("jetons_solde", 0)
    kyc_validated = (reg or {}).get("kyc_validated", False)

    current_eur = current_solde * JETON_VALEUR
    after_eur = (current_solde + jetons_to_add) * JETON_VALEUR

    if not kyc_validated and after_eur > PLAFOND_EUR:
        return {"ok": False, "current_eur": current_eur, "after_eur": after_eur, "kyc_validated": False}
    return {"ok": True, "current_eur": current_eur, "after_eur": after_eur, "kyc_validated": kyc_validated}


# ═══════════════════════════════════════════════════════════════
# SESSION HELPER — Extract email/frek from cookie
# ═══════════════════════════════════════════════════════════════

import jwt as pyjwt

SESSION_SECRET = os.environ.get('SESSION_SECRET', 'fallback-dev-secret')
SESSION_COOKIE_NAME = 'kk_session'


def _get_session(request: Request) -> dict:
    """Extract session from cookie. Returns dict or raises 401."""
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Non authentifie")
    try:
        session = pyjwt.decode(token, SESSION_SECRET, algorithms=["HS256"])
    except (pyjwt.ExpiredSignatureError, pyjwt.InvalidTokenError):
        raise HTTPException(status_code=401, detail="Session expiree")
    return session


def _get_session_email(request: Request) -> str:
    session = _get_session(request)
    email = session.get("email", "")
    if not email:
        raise HTTPException(status_code=401, detail="Non authentifie")
    return email.lower()


async def _get_user_frek_id(email: str) -> str:
    """Resolve frek_id from email."""
    reg = await _db.registrations.find_one({"email": email}, {"_id": 0, "frek_id": 1})
    if reg and reg.get("frek_id"):
        return reg["frek_id"]
    badge = await _db.cc_badges.find_one({"email": email}, {"_id": 0, "frek_id": 1})
    return (badge or {}).get("frek_id", "")


# ═══════════════════════════════════════════════════════════════
# BRAIN — WEB SEARCH (extracted from server.py L9660)
# ═══════════════════════════════════════════════════════════════

@router.post("/api/brain/web-search")
async def brain_web_search(request: Request):
    """Search the web for real-time information to enrich CVL BRAIN responses"""
    if not TAVILY_API_KEY:
        return {"results": [], "enriched": False, "reason": "TAVILY_API_KEY not configured"}

    body = await request.json()
    query = body.get("query", "")
    if not query:
        raise HTTPException(status_code=400, detail="query required")

    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=TAVILY_API_KEY)
        response = client.search(
            query=query, search_depth="basic", max_results=5, include_answer=True,
        )
        results = []
        for r in response.get("results", []):
            results.append({
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "content": r.get("content", "")[:300],
            })
        return {"results": results, "answer": response.get("answer", ""), "enriched": True, "query": query}
    except Exception as e:
        return {"results": [], "enriched": False, "reason": str(e)}


# ═══════════════════════════════════════════════════════════════
# BRAIN — CHAT ENRICHED (extracted from server.py L9699)
# + ITER.58: audit_logs, brain_training_data, quota adhesion
# ═══════════════════════════════════════════════════════════════

@router.post("/api/brain/chat-enriched", dependencies=[Depends(_require_perm("use_terminal_ia"))])
async def brain_chat_enriched(request: Request):
    """CVL BRAIN chat with multi-turn memory, user context, and web enrichment"""
    body = await request.json()
    message = body.get("message", "")
    messages_history = body.get("messages", [])
    use_web = body.get("use_web_search", False)
    user_name = body.get("user_name", "un utilisateur")
    user_context = body.get("user_context", None)
    langue = body.get("langue_preference", "fr")
    frek_id = body.get("frek_id", "")
    brain_session_id = body.get("session_id", "")

    # --- ITER.58: Quota check by adhesion level ---
    email = ""
    try:
        session = _get_session(request)
        email = session.get("email", "")
    except Exception:
        pass

    if email:
        adhesion = await _db.adhesions.find_one({"email": email, "actif": True}, {"_id": 0})
        if adhesion:
            quota = adhesion.get("brain_quota_daily", 10)
            used = adhesion.get("brain_quota_used_today", 0)
            reset_ts = adhesion.get("brain_quota_reset", "")
            # Reset if past midnight UTC
            if reset_ts:
                try:
                    reset_dt = datetime.fromisoformat(reset_ts)
                    if datetime.now(timezone.utc) > reset_dt:
                        await _db.adhesions.update_one(
                            {"email": email, "actif": True},
                            {"$set": {
                                "brain_quota_used_today": 0,
                                "brain_quota_reset": (datetime.now(timezone.utc).replace(
                                    hour=0, minute=0, second=0, microsecond=0
                                ) + timedelta(days=1)).isoformat()
                            }}
                        )
                        used = 0
                except Exception:
                    pass
            if quota != 999999 and used >= quota:
                level = adhesion.get("level", "FREE")
                raise HTTPException(
                    status_code=429,
                    detail=f"Quota journalier atteint ({used}/{quota}). Niveau actuel: {level}. Upgrade ton adhesion pour continuer."
                )

    # Web enrichment
    web_context = ""
    if use_web and TAVILY_API_KEY:
        try:
            from tavily import TavilyClient
            client = TavilyClient(api_key=TAVILY_API_KEY)
            response = client.search(query=message, search_depth="basic", max_results=3, include_answer=True)
            web_results = response.get("results", [])
            if web_results:
                web_context = "\n\n[CONTEXTE WEB RECENT]\n"
                for r in web_results[:3]:
                    web_context += f"- {r.get('title', '')}: {r.get('content', '')[:200]}\n"
                web_context += f"\nReponse synthetisee: {response.get('answer', '')}\n"
        except Exception:
            pass

    # Archive context
    archive_context = ""
    if user_context and user_context.get("email"):
        try:
            archives = await _db.user_archives.find(
                {"email": user_context["email"], "folder": "CVL Brain"},
                {"_id": 0, "name": 1, "content_summary": 1, "type": 1}
            ).to_list(10)
            if archives:
                archive_context = "\n\n[ARCHIVES PERSONNELLES DE L'UTILISATEUR]\n"
                for a in archives:
                    archive_context += f"- {a.get('name', 'Fichier')} ({a.get('type', '')})"
                    if a.get('content_summary'):
                        archive_context += f": {a['content_summary'][:150]}"
                    archive_context += "\n"
        except Exception:
            pass

    from services.cvl_brain_knowledge import build_cvl_brain_prompt
    system_prompt = build_cvl_brain_prompt(user_name, user_context, web_context + archive_context)

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        emergent_key = os.environ.get("EMERGENT_LLM_KEY", "")

        # Build conversation context
        history_context = ""
        if messages_history and len(messages_history) > 1:
            recent = messages_history[-20:-1] if len(messages_history) > 21 else messages_history[:-1]
            history_context = "\n\n[HISTORIQUE DE CONVERSATION]\n"
            for hist_msg in recent:
                role_label = "Utilisateur" if hist_msg.get("role") == "user" else "CVL Brain"
                content = hist_msg.get("content", "")[:500]
                history_context += f"{role_label}: {content}\n"
            history_context += "\n[FIN HISTORIQUE]\n"

        enriched_prompt = system_prompt + history_context

        chat_obj = LlmChat(
            api_key=emergent_key,
            session_id=str(uuid.uuid4()),
            system_message=enriched_prompt,
        )
        chat_obj.with_model("anthropic", "claude-sonnet-4-5-20250929")

        user_msg = UserMessage(text=message)
        response_text = await chat_obj.send_message(user_msg)

        # --- ITER.58: Post-response actions ---
        if email:
            # Increment quota
            await _db.adhesions.update_one(
                {"email": email, "actif": True},
                {"$inc": {"brain_quota_used_today": 1}}
            )

        # Resolve frek_id if not provided
        if not frek_id and email:
            frek_id = await _get_user_frek_id(email)

        # Write brain training data (always, even without frek_id)
        await write_brain_training(
            frek_id=frek_id or email or "anonymous",
            langue=langue,
            input_text=message, output_text=response_text,
            context_tags=[], session_id=brain_session_id,
        )

        # Write audit log (only if frek_id available)
        if frek_id:
            await write_audit_log(
                user_frek_id=frek_id, action_type="BRAIN_QUERY",
                object_id=brain_session_id, object_type="brain_session",
                metadata={"langue": langue, "web_enriched": bool(web_context)},
                session_id=brain_session_id,
            )

        # Cultural score for response
        cs = compute_cultural_score(langue, message, response_text, [])

        return {
            "response": response_text,
            "web_enriched": bool(web_context),
            "langue_detectee": langue,
            "cultural_score": cs,
            "tokens_used": 1,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur CVL BRAIN: {str(e)}")


# ═══════════════════════════════════════════════════════════════
# BRAIN — MEMORY (extracted from server.py L9785)
# ═══════════════════════════════════════════════════════════════

@router.post("/api/brain/memory/save")
async def brain_memory_save(request: Request):
    """Save a CVL BRAIN conversation to persistent memory"""
    body = await request.json()
    session_id = body.get("session_id")
    messages = body.get("messages", [])
    title = body.get("title", "")
    tags = body.get("tags", [])
    user_id = body.get("user_id", "")

    if not session_id or not messages:
        raise HTTPException(status_code=400, detail="session_id and messages required")

    if not title:
        user_msgs = [m for m in messages if m.get("role") == "user"]
        title = user_msgs[0]["content"][:80] if user_msgs else "Conversation sans titre"

    doc = {
        "session_id": session_id, "user_id": user_id, "title": title,
        "messages": messages, "tags": tags, "message_count": len(messages),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    existing = await _db.brain_memory.find_one({"session_id": session_id})
    if existing:
        await _db.brain_memory.update_one(
            {"session_id": session_id},
            {"$set": {"messages": messages, "title": title, "tags": tags,
                      "message_count": len(messages),
                      "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        await _db.brain_memory.insert_one(doc)

    return {"success": True, "session_id": session_id}


@router.get("/api/brain/memory/history")
async def brain_memory_history(user_id: str = "", limit: int = 20, skip: int = 0):
    """Get conversation history for a user"""
    query = {}
    if user_id:
        query["user_id"] = user_id

    cursor = _db.brain_memory.find(query, {"_id": 0}).sort("updated_at", -1).skip(skip).limit(limit)
    conversations = []
    async for doc in cursor:
        conversations.append({
            "session_id": doc.get("session_id"),
            "title": doc.get("title"),
            "message_count": doc.get("message_count", 0),
            "tags": doc.get("tags", []),
            "created_at": doc.get("created_at"),
            "updated_at": doc.get("updated_at"),
        })

    total = await _db.brain_memory.count_documents(query)
    return {"conversations": conversations, "total": total}


@router.get("/api/brain/memory/{session_id}")
async def brain_memory_get(session_id: str):
    """Get a specific conversation by session_id"""
    doc = await _db.brain_memory.find_one({"session_id": session_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Conversation non trouvee")
    return doc


@router.delete("/api/brain/memory/{session_id}")
async def brain_memory_delete(session_id: str):
    """Delete a conversation from memory"""
    result = await _db.brain_memory.delete_one({"session_id": session_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation non trouvee")
    return {"success": True}


# ═══════════════════════════════════════════════════════════════
# FREK — STATS & HEALTH (extracted from server.py L3852)
# ═══════════════════════════════════════════════════════════════

@router.get("/api/frek/stats")
async def get_frek_cc2026_stats():
    """Get FREK CC2026 stats for dashboard"""
    stats = await _frek.get_cc2026_stats()
    return stats


@router.get("/api/frek/health")
async def check_frek_health():
    """Check FREK API health"""
    is_healthy = await _frek.health()
    return {"healthy": is_healthy, "fallback_mode": os.environ.get("FREK_FALLBACK_MODE", "true")}


# ═══════════════════════════════════════════════════════════════
# NFC TAP (extracted from server.py L8445)
# ═══════════════════════════════════════════════════════════════

class NfcTapRequest(BaseModel):
    nfc_uid: Optional[str] = None
    badge_id: Optional[str] = None
    montant: int
    merchant_id: Optional[str] = None
    zone: str = "ENTREE_GENERALE"


@router.post("/api/frek/nfc/tap")
async def nfc_tap(req: NfcTapRequest):
    """NFC tap payment — find badge by NFC UID or badge_id, debit jetons"""
    badge = None
    if req.nfc_uid:
        badge = await _db.cc_badges.find_one({"nfc_uid": req.nfc_uid}, {"_id": 0})
    elif req.badge_id:
        badge = await _db.cc_badges.find_one({"badge_id": req.badge_id}, {"_id": 0})

    if not badge:
        return {"status": "error", "code": "NOT_FOUND", "message": "Badge NFC non trouve", "color": "red"}

    if not badge.get("nfc_enabled"):
        return {"status": "error", "code": "NFC_DISABLED", "message": "NFC non active sur ce badge", "color": "red"}

    statut = badge.get("statut", "")
    if statut not in ("ACTIVE", "REMIS"):
        return {"status": "error", "code": "INACTIVE", "message": f"Badge non actif ({statut})", "color": "red"}

    badge_id = badge.get("badge_id", "")
    current_solde = badge.get("jetons_solde", 0) or 0

    if req.montant > 0:
        if current_solde < req.montant:
            return {
                "status": "insufficient", "code": "LOW_BALANCE", "color": "orange",
                "message": f"Solde insuffisant ({current_solde}/{req.montant}J)",
                "badge_id": badge_id, "jetons_solde": current_solde,
            }
        new_solde = current_solde - req.montant
        await _db.cc_badges.update_one({"badge_id": badge_id}, {"$set": {"jetons_solde": new_solde}})

        await _db.cc_transactions.insert_one({
            "badge_id": badge_id, "type": "nfc_tap", "jetons": -req.montant,
            "merchant_id": req.merchant_id, "zone": req.zone,
            "previous_solde": current_solde, "new_solde": new_solde,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        frek_id = badge.get("frek_id", "")
        if frek_id:
            asyncio.create_task(_frek.record_stage(frek_id, "METAMORPHOSE"))
            await write_audit_log(frek_id, "NFC_SCAN", badge_id, "badge",
                                  {"montant": req.montant, "zone": req.zone})

        return {
            "status": "success", "code": "OK", "color": "green",
            "message": f"Paiement NFC {req.montant}J OK",
            "badge_id": badge_id,
            "person": {"full_name": f"{badge.get('prenom','')} {badge.get('nom','')}", "type_badge": badge.get("type_badge")},
            "jetons_debited": req.montant, "new_solde": new_solde,
        }

    return {
        "status": "success", "code": "OK", "color": "green",
        "message": "Badge NFC verifie",
        "badge_id": badge_id,
        "person": {"full_name": f"{badge.get('prenom','')} {badge.get('nom','')}", "type_badge": badge.get("type_badge")},
        "jetons_solde": current_solde,
    }


# ═══════════════════════════════════════════════════════════════
# REMBOURSEMENT (extracted from server.py L8514)
# ═══════════════════════════════════════════════════════════════

class RemboursementRequest(BaseModel):
    merchant_id: str
    montant_eur: float
    description: Optional[str] = None


@router.post("/api/jetons/remboursement")
async def jetons_remboursement(req: RemboursementRequest):
    """Admin: enregistrer un remboursement marchand SEPA J+3"""
    jeton_rachat = float(os.environ.get("JETON_RACHAT_EURO", "1.35"))
    jetons_equivalent = round(req.montant_eur / jeton_rachat)

    await _db.cc_remboursements.insert_one({
        "merchant_id": req.merchant_id, "montant_eur": req.montant_eur,
        "jetons_equivalent": jetons_equivalent, "jeton_rachat_eur": jeton_rachat,
        "description": req.description, "statut": "ENREGISTRE",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "status": "success", "merchant_id": req.merchant_id,
        "montant_eur": req.montant_eur, "jetons_equivalent": jetons_equivalent,
        "jeton_rachat_eur": jeton_rachat,
    }


@router.get("/api/jetons/remboursements")
async def list_remboursements():
    """List all merchant refunds"""
    rembs = await _db.cc_remboursements.find({}, {"_id": 0}).sort("timestamp", -1).to_list(200)
    total = sum(r.get("montant_eur", 0) for r in rembs)
    return {"remboursements": rembs, "total_eur": round(total, 2), "count": len(rembs)}


# ═══════════════════════════════════════════════════════════════
# BADGE LIFECYCLE (extracted from server.py L8081)
# ═══════════════════════════════════════════════════════════════

@router.get("/api/badges/lifecycle/{badge_id}")
async def get_badge_lifecycle(badge_id: str):
    """Retourne le cycle de vie complet d'un badge (8 etapes)"""
    badge = await _db.cc_badges.find_one({"badge_id": badge_id}, {"_id": 0})
    if not badge:
        raise HTTPException(status_code=404, detail="Badge non trouve")

    statut = badge.get("statut", "INSCRIT")
    lifecycle = [
        {"step": 1, "name": "Inscription", "done": True, "date": badge.get("date_emission")},
        {"step": 2, "name": "FREK-ID emis", "done": bool(badge.get("frek_id")), "frek_id": badge.get("frek_id")},
        {"step": 3, "name": "Email envoye", "done": True, "note": "Bienvenue + QR dynamique"},
        {"step": 4, "name": "Activation", "done": statut in ("ACTIVE", "REMIS"), "date": badge.get("activated_at")},
        {"step": 5, "name": "Impression", "done": badge.get("imprime", False), "date": badge.get("imprime_at")},
        {"step": 6, "name": "Remise J-0", "done": statut == "REMIS" or badge.get("remis", False), "date": badge.get("remis_at")},
        {"step": 7, "name": "NFC actif", "done": badge.get("nfc_enabled", False) and statut == "REMIS", "nfc_uid": badge.get("nfc_uid")},
        {"step": 8, "name": "FREK Legacy", "done": False, "note": "Post-evenement CVL BRAIN / OAPI"},
    ]

    return {
        "badge_id": badge_id, "statut": statut,
        "type_badge": badge.get("type_badge"), "prenom": badge.get("prenom"), "nom": badge.get("nom"),
        "lifecycle": lifecycle,
        "current_step": next((s["step"] for s in reversed(lifecycle) if s["done"]), 1),
    }


# ═══════════════════════════════════════════════════════════════
# ADHESION — Real implementation (replaces skeleton mocks)
# ═══════════════════════════════════════════════════════════════

ADHESION_LEVELS = {
    "FREE": {"name": "Libre", "prix_mensuel": 0, "brain_quota_daily": 10, "kt_offerts": 0},
    "PRO": {"name": "Pro", "prix_mensuel": 10, "brain_quota_daily": 50, "kt_offerts": 50},
    "PREMIUM": {"name": "Premium", "prix_mensuel": 30, "brain_quota_daily": 999999, "kt_offerts": 200},
    "INSTITUTIONNEL": {"name": "Institutionnel", "prix_mensuel": 150, "brain_quota_daily": 999999, "kt_offerts": 1000},
}


@router.get("/api/adhesion/levels")
async def get_adhesion_levels():
    """Retourne les 4 niveaux avec droits et prix."""
    levels = []
    for key, val in ADHESION_LEVELS.items():
        levels.append({
            "id": key, "name": val["name"], "prix_mensuel": val["prix_mensuel"],
            "brain_quota_daily": val["brain_quota_daily"], "kt_offerts": val["kt_offerts"],
        })
    return {"levels": levels}


@router.get("/api/adhesion/current")
async def get_current_adhesion(request: Request):
    """Retourne l'adhesion actuelle de l'utilisateur."""
    email = _get_session_email(request)
    adhesion = await _db.adhesions.find_one({"email": email, "actif": True}, {"_id": 0})
    if not adhesion:
        return {"adhesion": {"level": "FREE", "prix_mensuel": 0, "brain_quota_daily": 10,
                             "brain_quota_used_today": 0, "actif": True}}
    return {"adhesion": adhesion}


class AdhesionSubscribeRequest(BaseModel):
    level: str


@router.post("/api/adhesion/subscribe")
async def subscribe_adhesion(request: Request, body: AdhesionSubscribeRequest):
    """Souscrire a un niveau d'adhesion."""
    email = _get_session_email(request)
    level = body.level.upper()
    if level not in ADHESION_LEVELS:
        raise HTTPException(400, f"Niveau invalide. Choix: {list(ADHESION_LEVELS.keys())}")

    config = ADHESION_LEVELS[level]

    # Deactivate existing
    await _db.adhesions.update_many({"email": email, "actif": True}, {"$set": {"actif": False}})

    now = datetime.now(timezone.utc)
    tomorrow_midnight = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)

    adhesion_doc = {
        "adhesion_id": str(uuid.uuid4()),
        "email": email,
        "level": level,
        "prix_mensuel": config["prix_mensuel"],
        "brain_quota_daily": config["brain_quota_daily"],
        "brain_quota_used_today": 0,
        "brain_quota_reset": tomorrow_midnight.isoformat(),
        "date_debut": now.isoformat(),
        "date_fin": None,
        "auto_renew": level != "FREE",
        "actif": True,
    }
    await _db.adhesions.insert_one(adhesion_doc)

    # Credit KT offerts
    kt = config["kt_offerts"]
    if kt > 0:
        await _db.registrations.update_one({"email": email}, {"$inc": {"jetons_solde": kt}})
        await _db.cc_transactions.insert_one({
            "email": email, "type": "credit", "jetons": kt,
            "label": f"KT offerts adhesion {level}",
            "timestamp": now.isoformat(), "status": "completed",
        })

    frek_id = await _get_user_frek_id(email)
    if frek_id:
        await write_audit_log(frek_id, "ADHESION_SUBSCRIBE", adhesion_doc["adhesion_id"],
                              "adhesion", {"level": level, "kt_offerts": kt})

    return {"success": True, "level": level, "kt_offerts": kt,
            "adhesion_id": adhesion_doc["adhesion_id"]}


@router.post("/api/adhesion/cancel")
async def cancel_adhesion(request: Request):
    """Annuler l'abonnement — repasse en FREE."""
    email = _get_session_email(request)
    await _db.adhesions.update_many({"email": email, "actif": True}, {"$set": {"actif": False}})
    return {"success": True, "message": "Abonnement annule. Retour au niveau FREE."}


# ═══════════════════════════════════════════════════════════════
# FEED — Posts, Eclair, Commentaires
# ═══════════════════════════════════════════════════════════════

@router.get("/api/feed/posts")
async def get_feed_posts(page: int = 1, limit: int = 10):
    """Get feed posts with pagination."""
    skip = (page - 1) * limit
    posts = await _db.feed_posts.find({}, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    total = await _db.feed_posts.count_documents({})
    return {"posts": posts, "total": total, "page": page, "has_more": skip + limit < total}


class FeedPostCreate(BaseModel):
    contenu: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    tags: List[str] = []


@router.post("/api/feed/posts")
async def create_feed_post(request: Request, body: FeedPostCreate):
    """Create a new feed post."""
    email = _get_session_email(request)
    frek_id = await _get_user_frek_id(email)
    reg = await _db.registrations.find_one({"email": email}, {"_id": 0, "full_name": 1, "photo_url": 1, "frek_id": 1})

    post = {
        "post_id": str(uuid.uuid4()),
        "frek_id_auteur": frek_id or "",
        "email_auteur": email,
        "prenom_auteur": (reg or {}).get("full_name", "Anonyme").split(" ")[0],
        "photo_auteur": (reg or {}).get("photo_url", ""),
        "badge_frek": bool(frek_id),
        "contenu": body.contenu,
        "media_url": body.media_url,
        "media_type": body.media_type,
        "tags": body.tags,
        "nb_eclairs": 0,
        "nb_commentaires": 0,
        "eclairs_by": [],
        "commentaires": [],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await _db.feed_posts.insert_one(post)

    if frek_id:
        await write_audit_log(frek_id, "FEED_POST", post["post_id"], "feed_post")

    post.pop("eclairs_by", None)
    return {"success": True, "post": post}


@router.post("/api/feed/posts/{post_id}/eclair")
async def eclair_post(post_id: str, request: Request):
    """Eclair (like premium) — debite 1 KT auteur, credite 1 KT destinataire."""
    email = _get_session_email(request)
    frek_id = await _get_user_frek_id(email)

    post = await _db.feed_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Post non trouve")

    # Check already eclaired
    if email in (post.get("eclairs_by") or []):
        raise HTTPException(400, "Deja eclaire")

    # Debit 1 KT from eclairer
    reg = await _db.registrations.find_one({"email": email}, {"_id": 0, "jetons_solde": 1})
    solde = (reg or {}).get("jetons_solde", 0)
    if solde < 1:
        raise HTTPException(400, "Solde KT insuffisant pour un eclair")

    await _db.registrations.update_one({"email": email}, {"$inc": {"jetons_solde": -1}})

    # Credit 1 KT to post author
    author_email = post.get("email_auteur", "")
    if author_email and author_email != email:
        await _db.registrations.update_one({"email": author_email}, {"$inc": {"jetons_solde": 1}})

    # Update post
    await _db.feed_posts.update_one(
        {"post_id": post_id},
        {"$inc": {"nb_eclairs": 1}, "$push": {"eclairs_by": email}}
    )

    if frek_id:
        await write_audit_log(frek_id, "FEED_ECLAIR", post_id, "feed_post", {"author": author_email})

    return {"success": True, "nb_eclairs": post.get("nb_eclairs", 0) + 1, "kt_debited": 1}


class CommentCreate(BaseModel):
    contenu: str


@router.post("/api/feed/posts/{post_id}/commentaire")
async def comment_post(post_id: str, request: Request, body: CommentCreate):
    """Add a comment to a post."""
    email = _get_session_email(request)
    frek_id = await _get_user_frek_id(email)
    reg = await _db.registrations.find_one({"email": email}, {"_id": 0, "full_name": 1})

    comment = {
        "comment_id": str(uuid.uuid4())[:12],
        "email": email,
        "prenom": (reg or {}).get("full_name", "Anonyme").split(" ")[0],
        "frek_id": frek_id,
        "contenu": body.contenu,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    await _db.feed_posts.update_one(
        {"post_id": post_id},
        {"$inc": {"nb_commentaires": 1}, "$push": {"commentaires": comment}}
    )

    if frek_id:
        await write_audit_log(frek_id, "FEED_COMMENT", post_id, "feed_post")

    return {"success": True, "comment": comment}


@router.get("/api/feed/posts/{post_id}/commentaires")
async def get_post_comments(post_id: str):
    """Get comments for a post."""
    post = await _db.feed_posts.find_one({"post_id": post_id}, {"_id": 0, "commentaires": 1})
    if not post:
        raise HTTPException(404, "Post non trouve")
    return {"commentaires": post.get("commentaires", [])}


# ═══════════════════════════════════════════════════════════════
# RGPD — DELETE ACCOUNT
# ═══════════════════════════════════════════════════════════════

@router.delete("/api/user/account")
async def delete_user_account(request: Request):
    """RGPD: Anonymise personal data, invalidate sessions."""
    email = _get_session_email(request)
    frek_id = await _get_user_frek_id(email)
    now = datetime.now(timezone.utc).isoformat()

    # Anonymise registrations
    await _db.registrations.update_one(
        {"email": email},
        {"$set": {
            "full_name": "UTILISATEUR_SUPPRIME",
            "email": f"deleted_{uuid.uuid4().hex[:8]}@supprime.local",
            "phone": "", "photo_url": "", "bio": "",
            "supprime": True, "supprime_at": now,
        }}
    )

    # Anonymise badges
    await _db.cc_badges.update_many(
        {"email": email},
        {"$set": {"prenom": "SUPPRIME", "nom": "SUPPRIME", "email": f"deleted@supprime.local"}}
    )

    # Mark FREK-ID as deleted (keep in audit_logs)
    if frek_id:
        await _db.frek_ids.update_one(
            {"frek_id": frek_id}, {"$set": {"status": "SUPPRIME", "supprime_at": now}}
        )
        await write_audit_log(frek_id, "AUTH_LOGOUT", "", "account", {"reason": "RGPD_DELETION"})

    # Deactivate adhesion
    await _db.adhesions.update_many({"email": email}, {"$set": {"actif": False}})

    # Delete sessions
    await _db.sessions.delete_many({"email": email})

    return {"message": "Compte supprime", "timestamp": now}


# ═══════════════════════════════════════════════════════════════
# USER SETTINGS (real, replaces skeleton mock)
# ═══════════════════════════════════════════════════════════════

@router.get("/api/user/settings")
async def get_user_settings(request: Request):
    """Get user settings from real data."""
    email = _get_session_email(request)
    reg = await _db.registrations.find_one({"email": email}, {"_id": 0})
    if not reg:
        raise HTTPException(404, "Utilisateur non trouve")

    frek_id = reg.get("frek_id", "")
    adhesion = await _db.adhesions.find_one({"email": email, "actif": True}, {"_id": 0})
    settings = await _db.user_settings.find_one({"email": email}, {"_id": 0}) or {}

    return {
        "profile": {
            "full_name": reg.get("full_name", ""),
            "bio": reg.get("bio", ""),
            "photo_url": reg.get("photo_url", ""),
            "email": email,
            "frek_id": frek_id,
            "actor_role": reg.get("actor_role", "consumer"),
        },
        "adhesion": {
            "level": (adhesion or {}).get("level", "FREE"),
            "brain_quota_daily": (adhesion or {}).get("brain_quota_daily", 10),
            "brain_quota_used_today": (adhesion or {}).get("brain_quota_used_today", 0),
        },
        "notifications": settings.get("notifications", {
            "email_enabled": True, "push_enabled": False, "in_app_enabled": True,
        }),
        "privacy": settings.get("privacy", {
            "profile_public": True, "frek_id_public": False,
        }),
        "preferences": settings.get("preferences", {
            "language": "fr", "brain_language": "fr", "theme": "sovereign_onyx",
        }),
    }


class SettingsUpdateRequest(BaseModel):
    section: str
    data: dict


@router.put("/api/user/settings")
async def update_user_settings(request: Request, body: SettingsUpdateRequest):
    """Update a section of user settings."""
    email = _get_session_email(request)

    if body.section == "profile":
        allowed = ["full_name", "bio", "photo_url"]
        update = {k: v for k, v in body.data.items() if k in allowed}
        if update:
            await _db.registrations.update_one({"email": email}, {"$set": update})
    else:
        await _db.user_settings.update_one(
            {"email": email},
            {"$set": {body.section: body.data}},
            upsert=True,
        )

    frek_id = await _get_user_frek_id(email)
    if frek_id:
        await write_audit_log(frek_id, "SETTINGS_UPDATE", "", "settings", {"section": body.section})

    return {"success": True, "section": body.section}


# ═══════════════════════════════════════════════════════════════
# STARTUP — Create indexes
# ═══════════════════════════════════════════════════════════════

async def create_omega_indexes():
    """Create indexes for Omega collections on startup."""
    try:
        await _db.audit_logs.create_index([("user_frek_id", 1), ("timestamp", -1)])
        await _db.audit_logs.create_index([("action_type", 1)])
        await _db.brain_training_data.create_index([("eligible_training", 1), ("timestamp", -1)])
        await _db.brain_training_data.create_index([("frek_id", 1)])
        await _db.adhesions.create_index([("email", 1), ("actif", 1)])
        await _db.feed_posts.create_index([("timestamp", -1)])
        await _db.feed_posts.create_index([("frek_id_auteur", 1)])
        # FREK-ID uniqueness
        try:
            await _db.frek_ids.create_index([("email", 1)], unique=True, sparse=True)
        except Exception:
            pass  # Index may already exist
        logger.info("Omega indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating omega indexes: {e}")


# ═══════════════════════════════════════════════════════════════
# TERMINAL — Deploy, Versioning, Rollback
# ═══════════════════════════════════════════════════════════════

# Dangerous patterns in HTML
_DANGEROUS_PATTERNS = [
    '<script src="http://', 'document.cookie', 'localStorage.getItem',
    'fetch(', 'XMLHttpRequest', 'eval(', 'Function(',
    'window.location', 'top.location',
]


def _scan_html_security(html: str) -> dict:
    """Basic HTML security scan."""
    issues = []
    for pattern in _DANGEROUS_PATTERNS:
        if pattern.lower() in html.lower():
            issues.append(f"Pattern suspect: {pattern}")
    # Allow Tailwind CDN, Chart.js, etc. but flag unknown external scripts
    import re
    external_scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)', html)
    allowed_cdns = ['cdn.tailwindcss.com', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com',
                    'unpkg.com', 'cdn.alpinejs.dev']
    for src in external_scripts:
        if not any(cdn in src for cdn in allowed_cdns):
            issues.append(f"Script externe non autorise: {src}")
    return {"safe": len(issues) == 0, "issues": issues}


class TerminalDeployRequest(BaseModel):
    slug: str
    html: str
    title: str = ""
    frek_id: str = ""


@router.post("/api/terminal/deploy")
async def terminal_deploy(request: Request, body: TerminalDeployRequest):
    """Deploy an HTML page — versioned, max 10 per slug."""
    email = ""
    try:
        email = _get_session_email(request)
    except Exception:
        pass

    frek_id = body.frek_id or (await _get_user_frek_id(email) if email else "anon")
    frek_short = (frek_id or "anon")[:5]
    full_slug = f"{frek_short}-{body.slug}"

    # Security scan
    scan = _scan_html_security(body.html)
    if not scan["safe"]:
        raise HTTPException(400, f"HTML refuse: {'; '.join(scan['issues'][:3])}")

    deploy_id = str(uuid.uuid4())[:12]
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "deploy_id": deploy_id,
        "frek_id": frek_id,
        "slug": full_slug,
        "title": body.title or body.slug,
        "html": body.html,
        "timestamp": now,
        "version": 1,
    }

    # Count existing versions for this slug
    existing = await _db.terminal_deploys.count_documents({"slug": full_slug, "frek_id": frek_id})
    doc["version"] = existing + 1

    # Max 10 versions per slug — delete oldest if exceeded
    if existing >= 10:
        oldest = await _db.terminal_deploys.find(
            {"slug": full_slug, "frek_id": frek_id}, {"_id": 1}
        ).sort("timestamp", 1).limit(1).to_list(1)
        if oldest:
            await _db.terminal_deploys.delete_one({"_id": oldest[0]["_id"]})

    await _db.terminal_deploys.insert_one(doc)

    if frek_id and frek_id != "anon":
        await write_audit_log(frek_id, "TERMINAL_DEPLOY", deploy_id, "terminal_deploy",
                              {"slug": full_slug, "version": doc["version"]})

    url = f"/pages/{full_slug}"
    return {
        "deploy_id": deploy_id, "slug": full_slug, "url": url,
        "version": doc["version"], "timestamp": now, "title": doc["title"],
    }


@router.get("/api/terminal/deploys")
async def list_terminal_deploys(frek_id: str = ""):
    """List deploys for a user."""
    query = {}
    if frek_id:
        query["frek_id"] = frek_id
    deploys = await _db.terminal_deploys.find(query, {"_id": 0, "html": 0}).sort("timestamp", -1).limit(20).to_list(20)
    return {"deploys": deploys}


@router.post("/api/terminal/rollback/{deploy_id}")
async def terminal_rollback(deploy_id: str):
    """Rollback to a specific deploy version."""
    doc = await _db.terminal_deploys.find_one({"deploy_id": deploy_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Deploy non trouve")
    return {"html": doc.get("html", ""), "slug": doc.get("slug"), "version": doc.get("version")}


# Serve deployed pages
@router.get("/pages/{slug:path}")
async def serve_deployed_page(slug: str):
    """Serve the latest deployed HTML page."""
    from fastapi.responses import HTMLResponse
    doc = await _db.terminal_deploys.find_one(
        {"slug": slug}, {"_id": 0, "html": 1}
    , sort=[("timestamp", -1)])
    if not doc:
        raise HTTPException(404, "Page non trouvee")
    return HTMLResponse(content=doc["html"])


# ═══════════════════════════════════════════════════════════════
# MESSAGES / DMs
# ═══════════════════════════════════════════════════════════════

@router.get("/api/messages/conversations")
async def list_conversations(request: Request):
    """List DM conversations for current user."""
    email = _get_session_email(request)
    convos = await _db.dm_conversations.find(
        {"participants": email}, {"_id": 0}
    ).sort("updated_at", -1).limit(20).to_list(20)
    return {"conversations": convos}


@router.get("/api/messages/conversations/{convo_id}")
async def get_conversation_messages(convo_id: str, limit: int = 20, skip: int = 0):
    """Get messages in a conversation."""
    msgs = await _db.dm_messages.find(
        {"conversation_id": convo_id}, {"_id": 0}
    ).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    msgs.reverse()
    return {"messages": msgs}


class DmSendRequest(BaseModel):
    destinataire_frek_id: str = ""
    destinataire_email: str = ""
    contenu: str


@router.post("/api/messages/send")
async def send_dm(request: Request, body: DmSendRequest):
    """Send a DM."""
    email = _get_session_email(request)
    dest_email = body.destinataire_email
    if not dest_email and body.destinataire_frek_id:
        dest_reg = await _db.registrations.find_one({"frek_id": body.destinataire_frek_id}, {"_id": 0, "email": 1})
        dest_email = (dest_reg or {}).get("email", "")
    if not dest_email:
        raise HTTPException(400, "Destinataire introuvable")

    participants = sorted([email, dest_email])
    convo = await _db.dm_conversations.find_one({"participants": participants}, {"_id": 0})
    if not convo:
        convo_id = str(uuid.uuid4())[:12]
        await _db.dm_conversations.insert_one({
            "conversation_id": convo_id, "participants": participants,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "last_message": body.contenu[:100],
        })
    else:
        convo_id = convo["conversation_id"]

    msg = {
        "message_id": str(uuid.uuid4())[:12],
        "conversation_id": convo_id,
        "sender_email": email,
        "contenu": body.contenu,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "read": False,
    }
    await _db.dm_messages.insert_one(msg)
    await _db.dm_conversations.update_one(
        {"conversation_id": convo_id},
        {"$set": {"last_message": body.contenu[:100], "updated_at": msg["timestamp"]}}
    )

    return {"success": True, "message_id": msg["message_id"], "conversation_id": convo_id}


# ═══════════════════════════════════════════════════════════════
# AGENDA CC2026 — Seed + Read
# ═══════════════════════════════════════════════════════════════

CC2026_AGENDA = [
    {"day": 1, "date": "2026-05-20", "label": "Jour 1 — Ouverture", "slots": [
        {"heure": "18:00", "titre": "Ceremonie d'ouverture", "lieu": "Scene Principale", "artiste": "Kilti Konet", "confirme": True},
        {"heure": "20:00", "titre": "DJ Set Ouverture", "lieu": "Scene Principale", "artiste": "TBA", "confirme": False},
    ]},
    {"day": 2, "date": "2026-05-21", "label": "Jour 2 — Culture", "slots": [
        {"heure": "15:00", "titre": "Ateliers Creoles", "lieu": "Espace Workshops", "artiste": "Collectif Madinina", "confirme": True},
        {"heure": "20:00", "titre": "Concert Zouk", "lieu": "Scene Principale", "artiste": "TBA", "confirme": False},
    ]},
    {"day": 3, "date": "2026-05-22", "label": "Jour 3 — Live", "slots": [
        {"heure": "16:00", "titre": "Labo des Histoires", "lieu": "Scene Secondaire", "artiste": "Kathy-Liana Bravo", "confirme": True},
        {"heure": "22:00", "titre": "Live Set", "lieu": "Scene Principale", "artiste": "Kathy-Liana Bravo", "confirme": True},
    ]},
    {"day": 4, "date": "2026-05-23", "label": "Jour 4 — Cloture", "slots": [
        {"heure": "14:00", "titre": "Remise des prix FREK", "lieu": "Scene Principale", "artiste": "Jury CC2026", "confirme": True},
        {"heure": "21:00", "titre": "Concert Cloture", "lieu": "Scene Principale", "artiste": "TBA", "confirme": False},
    ]},
]


@router.get("/api/planning/cc2026")
async def get_cc2026_agenda():
    """Get CC2026 agenda (4 days)."""
    return {"days": CC2026_AGENDA, "lieu": "La Savane, Fort-de-France", "dates": "20-23 mai 2026"}


# ═══════════════════════════════════════════════════════════════
# GOUVERNANCE — Proposals + Votes
# ═══════════════════════════════════════════════════════════════

@router.get("/api/gouvernance/proposals")
async def list_gouvernance_proposals(request: Request):
    """List active governance proposals."""
    proposals = await _db.gouvernance_proposals.find({}, {"_id": 0}).sort("date_creation", -1).limit(20).to_list(20)
    email = ""
    try:
        email = _get_session_email(request)
    except Exception:
        pass
    for p in proposals:
        p["user_a_vote"] = email in (p.get("voters", []))
    return {"proposals": proposals}


class GouvernanceVoteRequest(BaseModel):
    proposal_id: str
    vote: str  # POUR or CONTRE


@router.post("/api/gouvernance/vote")
async def vote_gouvernance(request: Request, body: GouvernanceVoteRequest):
    """Vote on a governance proposal."""
    email = _get_session_email(request)
    proposal = await _db.gouvernance_proposals.find_one({"proposal_id": body.proposal_id}, {"_id": 0})
    if not proposal:
        raise HTTPException(404, "Proposition non trouvee")
    if email in (proposal.get("voters") or []):
        raise HTTPException(400, "Vous avez deja vote")

    # Vote weight by adhesion level
    adhesion = await _db.adhesions.find_one({"email": email, "actif": True}, {"_id": 0})
    level = (adhesion or {}).get("level", "FREE")
    weights = {"FREE": 1, "PRO": 3, "PREMIUM": 5, "INSTITUTIONNEL": 10}
    weight = weights.get(level, 1)

    field = "nb_votes_pour" if body.vote.upper() == "POUR" else "nb_votes_contre"
    await _db.gouvernance_proposals.update_one(
        {"proposal_id": body.proposal_id},
        {"$inc": {field: weight}, "$push": {"voters": email}}
    )

    frek_id = await _get_user_frek_id(email)
    if frek_id:
        await write_audit_log(frek_id, "GOUVERNANCE_VOTE", body.proposal_id, "proposal",
                              {"vote": body.vote.upper(), "weight": weight, "level": level})

    return {"success": True, "vote": body.vote.upper(), "weight": weight, "level": level}
