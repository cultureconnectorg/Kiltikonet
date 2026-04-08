"""
Push Notifications — Web Push API
POST /api/notifications/push/subscribe
POST /api/notifications/push/unsubscribe
POST /api/notifications/push/send  (admin only)
GET  /api/notifications/push/preferences
PUT  /api/notifications/push/preferences
"""
import os
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException

router = APIRouter(prefix="/api/notifications/push", tags=["push"])

_db = None

VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
VAPID_CLAIM_EMAIL = os.environ.get("VAPID_CLAIM_EMAIL", "cc@kiltikonet.fr")


def init_push(db):
    global _db
    _db = db


async def _get_frek_id(request: Request):
    session = request.state.__dict__.get("session") or {}
    frek_id = session.get("frek_id") or session.get("email")
    if not frek_id:
        raise HTTPException(401, "Non authentifie")
    return frek_id


@router.post("/subscribe")
async def subscribe_push(request: Request, data: dict):
    frek_id = await _get_frek_id(request)
    sub = data.get("subscription")
    if not sub or not sub.get("endpoint"):
        raise HTTPException(400, "subscription invalide")

    now = datetime.now(timezone.utc).isoformat()
    await _db.push_subscriptions.update_one(
        {"frek_id": frek_id, "endpoint": sub["endpoint"]},
        {"$set": {
            "frek_id": frek_id,
            "endpoint": sub["endpoint"],
            "keys": sub.get("keys", {}),
            "active": True,
            "updated_at": now,
        }, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )
    return {"success": True}


@router.post("/unsubscribe")
async def unsubscribe_push(request: Request):
    frek_id = await _get_frek_id(request)
    await _db.push_subscriptions.update_many(
        {"frek_id": frek_id},
        {"$set": {"active": False}},
    )
    return {"success": True}


@router.get("/preferences")
async def get_push_preferences(request: Request):
    frek_id = await _get_frek_id(request)
    prefs = await _db.push_preferences.find_one(
        {"frek_id": frek_id}, {"_id": 0}
    )
    defaults = {
        "push_enabled": True,
        "feed_eclair": True,
        "feed_comment": True,
        "message_recu": True,
        "badge_emit": True,
        "wallet_credit": True,
        "gouvernance_vote": True,
    }
    if prefs:
        defaults.update(prefs)
    return defaults


@router.put("/preferences")
async def update_push_preferences(request: Request, data: dict):
    frek_id = await _get_frek_id(request)
    allowed_keys = {"push_enabled", "feed_eclair", "feed_comment", "message_recu", "badge_emit", "wallet_credit", "gouvernance_vote"}
    update = {k: v for k, v in data.items() if k in allowed_keys}
    update["frek_id"] = frek_id
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await _db.push_preferences.update_one(
        {"frek_id": frek_id},
        {"$set": update},
        upsert=True,
    )
    return {"success": True}


@router.post("/send")
async def send_push_notification(request: Request, data: dict):
    """Admin-only: send push notification to specific frek_ids or broadcast."""
    session = request.state.__dict__.get("session") or {}
    role = session.get("role", "user")
    if role not in ("admin", "founder"):
        raise HTTPException(403, "Acces reserve aux administrateurs")

    frek_ids = data.get("frek_ids", [])
    title = data.get("title", "Kiltikonet")
    body = data.get("body", "")
    url = data.get("url", "/pro")
    icon = data.get("icon", "/logo-kiltikonet.png")

    if not frek_ids:
        # Broadcast to all active subscriptions
        subs = await _db.push_subscriptions.find({"active": True}, {"_id": 0}).to_list(10000)
    else:
        subs = await _db.push_subscriptions.find(
            {"frek_id": {"$in": frek_ids}, "active": True}, {"_id": 0}
        ).to_list(10000)

    sent = 0
    failed = 0
    for sub in subs:
        ok = await _send_one_push(sub, title, body, url, icon)
        if ok:
            sent += 1
        else:
            failed += 1

    return {"sent": sent, "failed": failed}


async def send_event_push(event_type: str, target_frek_id: str, actor_name: str = "", extra: dict = None):
    """Event-driven push: called from audit_logs triggers."""
    if not _db:
        return

    # Check user preferences
    prefs = await _db.push_preferences.find_one(
        {"frek_id": target_frek_id}, {"_id": 0}
    )
    if prefs and not prefs.get("push_enabled", True):
        return

    pref_map = {
        "FEED_ECLAIR": "feed_eclair",
        "FEED_COMMENT": "feed_comment",
        "MESSAGE_RECU": "message_recu",
        "BADGE_EMIT": "badge_emit",
        "WALLET_CREDIT": "wallet_credit",
        "GOUVERNANCE_VOTE": "gouvernance_vote",
    }
    pref_key = pref_map.get(event_type)
    if pref_key and prefs and not prefs.get(pref_key, True):
        return

    # Build notification content
    messages = {
        "FEED_ECLAIR": {"title": "Eclair recu", "body": f"{actor_name} a eclaire ton post"},
        "FEED_COMMENT": {"title": "Nouveau commentaire", "body": f"{actor_name} a commente ton post"},
        "MESSAGE_RECU": {"title": "Nouveau message", "body": f"Nouveau message de {actor_name}"},
        "BADGE_EMIT": {"title": "Badge CC2026 pret", "body": "Ton badge CC2026 est pret"},
        "WALLET_CREDIT": {"title": "Credits recus", "body": f"{extra.get('amount', '')} JCC credites" if extra else "Credits recus"},
        "GOUVERNANCE_VOTE": {"title": "Nouveau vote ouvert", "body": "Un nouveau vote de gouvernance est ouvert"},
    }
    msg = messages.get(event_type, {"title": "Kiltikonet", "body": event_type})

    subs = await _db.push_subscriptions.find(
        {"frek_id": target_frek_id, "active": True}, {"_id": 0}
    ).to_list(100)

    for sub in subs:
        await _send_one_push(sub, msg["title"], msg["body"])


async def _send_one_push(sub, title, body, url="/pro", icon="/logo-kiltikonet.png"):
    """Send a single web push notification."""
    try:
        from pywebpush import webpush, WebPushException
        subscription_info = {
            "endpoint": sub["endpoint"],
            "keys": sub.get("keys", {}),
        }
        payload = json.dumps({
            "title": title,
            "body": body,
            "icon": icon,
            "url": url,
            "badge": "/logo-kiltikonet.png",
        })
        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{VAPID_CLAIM_EMAIL}"},
        )
        return True
    except Exception:
        # Mark as inactive if subscription expired
        if sub.get("endpoint"):
            await _db.push_subscriptions.update_one(
                {"endpoint": sub["endpoint"]},
                {"$set": {"active": False}},
            )
        return False
