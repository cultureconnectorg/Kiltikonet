"""
Wallet Routes — User-facing wallet endpoints (balance, history, buy pack)
"""
import os
import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import jwt as pyjwt
from routes.doctrine import require_permission

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/my-wallet", tags=["wallet"])

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]
JETON_VALEUR = float(os.environ.get("JETON_VALEUR_EURO", "1.50"))
SESSION_SECRET = os.environ.get('SESSION_SECRET', 'fallback-dev-secret')
SESSION_COOKIE_NAME = 'kk_session'

PACKS = {
    "decouverte": {"label": "Pack Decouverte", "price_eur": 10, "jetons": 6},
    "culture": {"label": "Pack Culture", "price_eur": 25, "jetons": 16},
    "diaspora": {"label": "Pack Diaspora", "price_eur": 50, "jetons": 33},
    "vip": {"label": "Pack VIP", "price_eur": 100, "jetons": 66},
}


def _get_session_email(request: Request) -> str:
    """Extract email from session cookie."""
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Non authentifie")
    try:
        session = pyjwt.decode(token, SESSION_SECRET, algorithms=["HS256"])
    except (pyjwt.ExpiredSignatureError, pyjwt.InvalidTokenError):
        raise HTTPException(status_code=401, detail="Session expiree")
    email = session.get("email", "")
    if not email:
        raise HTTPException(status_code=401, detail="Non authentifie")
    return email.lower()


@router.get("/me")
async def wallet_me(request: Request):
    """Get current user's wallet overview."""
    email = _get_session_email(request)

    # Get balance from registration or badges
    reg = await _db.registrations.find_one({"email": email}, {"_id": 0, "jetons_solde": 1, "frek_id": 1})
    badge = await _db.cc_badges.find_one({"email": email}, {"_id": 0, "jetons_solde": 1})
    balance = (reg or {}).get("jetons_solde", 0) or (badge or {}).get("jetons_solde", 0)

    # Get transaction stats for current month
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()

    txs = await _db.cc_transactions.find(
        {"email": email, "timestamp": {"$gte": month_start}},
        {"_id": 0, "type": 1, "jetons": 1}
    ).to_list(500)

    spent = sum(abs(t.get("jetons", 0)) for t in txs if t.get("type") == "depense")
    received = sum(t.get("jetons", 0) for t in txs if t.get("type") in ("achat", "reward", "credit"))

    # Chart data (last 12 data points from balance history)
    history_entries = await _db.cc_transactions.find(
        {"email": email}, {"_id": 0, "jetons": 1, "type": 1, "timestamp": 1}
    ).sort("timestamp", 1).to_list(100)

    chart_points = []
    running = 0
    for h in history_entries:
        if h.get("type") in ("achat", "reward", "credit"):
            running += h.get("jetons", 0)
        else:
            running -= abs(h.get("jetons", 0))
        chart_points.append(max(0, running))
    if not chart_points:
        chart_points = [balance]

    # Keep last 12 points
    if len(chart_points) > 12:
        step = len(chart_points) // 12
        chart_points = chart_points[::step][:12]
    elif len(chart_points) < 12:
        chart_points = [0] * (12 - len(chart_points)) + chart_points

    return {
        "balance": balance,
        "balance_eur": round(balance * JETON_VALEUR, 2),
        "spent_month": spent,
        "received_month": received,
        "saved_month": max(0, received - spent),
        "chart_points": chart_points,
        "packs": PACKS,
    }


@router.get("/history")
async def wallet_history(request: Request, limit: int = 50):
    """Get user's transaction history."""
    email = _get_session_email(request)

    txs = await _db.cc_transactions.find(
        {"email": email}, {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)

    # Map to frontend-friendly format
    history = []
    for tx in txs:
        tx_type = tx.get("type", "debit")
        is_credit = tx_type in ("achat", "reward", "credit")
        icon_map = {
            "achat": "add_circle", "reward": "emoji_events", "credit": "add_circle",
            "depense": "shopping_bag", "don": "volunteer_activism", "transfer": "send",
        }
        history.append({
            "id": tx.get("id", str(uuid.uuid4())[:8]),
            "type": "credit" if is_credit else "debit",
            "label": tx.get("label", tx.get("description", "Transaction")),
            "amount": tx.get("jetons", 0) if is_credit else -abs(tx.get("jetons", 0)),
            "date": tx.get("timestamp", datetime.now(timezone.utc).isoformat()),
            "icon": icon_map.get(tx_type, "receipt"),
        })

    return {"history": history, "total": len(history)}


class BuyPackRequest(BaseModel):
    pack_id: str


@router.post("/buy-pack", dependencies=[Depends(require_permission("buy_tokens"))])
async def wallet_buy_pack(request: Request, body: BuyPackRequest):
    """Buy a jeton pack — creates transaction and updates balance."""
    email = _get_session_email(request)
    pack = PACKS.get(body.pack_id)
    if not pack:
        raise HTTPException(status_code=400, detail="Pack invalide")

    tx_id = str(uuid.uuid4())[:12]
    now_iso = datetime.now(timezone.utc).isoformat()

    # Create transaction
    tx = {
        "id": tx_id,
        "email": email,
        "type": "achat",
        "pack": body.pack_id,
        "label": f"{pack['label']} — Achat",
        "jetons": pack["jetons"],
        "amount_eur": pack["price_eur"],
        "timestamp": now_iso,
        "status": "completed",
    }
    await _db.cc_transactions.insert_one({**tx})

    # Update balance in registrations
    result = await _db.registrations.update_one(
        {"email": email},
        {"$inc": {"jetons_solde": pack["jetons"]}}
    )
    if result.modified_count == 0:
        await _db.cc_badges.update_one(
            {"email": email},
            {"$inc": {"jetons_solde": pack["jetons"]}}
        )

    # Get new balance
    reg = await _db.registrations.find_one({"email": email}, {"_id": 0, "jetons_solde": 1})
    new_balance = (reg or {}).get("jetons_solde", pack["jetons"])

    logger.info(f"[WALLET] {email} bought pack {body.pack_id} (+{pack['jetons']} jetons)")

    return {
        "success": True,
        "transaction_id": tx_id,
        "jetons_added": pack["jetons"],
        "new_balance": new_balance,
        "pack": pack,
    }


@router.get("/analytics")
async def wallet_analytics(request: Request):
    """Get spending breakdown for current user."""
    email = _get_session_email(request)

    txs = await _db.cc_transactions.find(
        {"email": email, "type": "depense"}, {"_id": 0, "label": 1, "jetons": 1}
    ).to_list(500)

    total = sum(abs(t.get("jetons", 0)) for t in txs)
    if total == 0:
        return {"categories": [], "total_spent": 0}

    # Categorize by keywords
    categories = {"Evenements": 0, "Musique": 0, "Dons artistes": 0, "Shop": 0, "Autres": 0}
    for tx in txs:
        label = (tx.get("label") or "").lower()
        amt = abs(tx.get("jetons", 0))
        if any(k in label for k in ("billet", "cc2026", "event", "zone")):
            categories["Evenements"] += amt
        elif any(k in label for k in ("musique", "album", "son", "concert")):
            categories["Musique"] += amt
        elif any(k in label for k in ("don", "soutien", "artiste")):
            categories["Dons artistes"] += amt
        elif any(k in label for k in ("shop", "achat", "produit", "boutique")):
            categories["Shop"] += amt
        else:
            categories["Autres"] += amt

    colors = {"Evenements": "#E8D5A0", "Musique": "#818cf8", "Dons artistes": "#4ade80", "Shop": "#f472b6", "Autres": "#72727a"}
    result = []
    for name, val in categories.items():
        if val > 0:
            result.append({"label": name, "pct": round(val / total * 100), "color": colors.get(name, "#72727a")})

    return {"categories": sorted(result, key=lambda x: x["pct"], reverse=True), "total_spent": total}



class TransferRequest(BaseModel):
    recipient_email: str
    amount: int
    note: str = ""


@router.post("/transfer", dependencies=[Depends(require_permission("support_creators"))])
async def wallet_transfer(request: Request, body: TransferRequest):
    """Transfer jetons to another user."""
    email = _get_session_email(request)
    if email == body.recipient_email.lower():
        raise HTTPException(400, "Impossible de s'envoyer des jetons a soi-meme")
    if body.amount <= 0:
        raise HTTPException(400, "Montant invalide")

    # Check sender balance
    reg = await _db.registrations.find_one({"email": email}, {"_id": 0, "jetons_solde": 1, "full_name": 1})
    balance = (reg or {}).get("jetons_solde", 0)
    if balance < body.amount:
        raise HTTPException(400, f"Solde insuffisant ({balance} CC disponibles)")

    # Check recipient exists
    recipient = await _db.registrations.find_one(
        {"email": body.recipient_email.lower()}, {"_id": 0, "full_name": 1, "email": 1}
    )
    if not recipient:
        raise HTTPException(404, "Destinataire non trouve")

    now_iso = datetime.now(timezone.utc).isoformat()
    tx_id = str(uuid.uuid4())[:12]
    sender_name = (reg or {}).get("full_name", email)
    recipient_name = recipient.get("full_name", body.recipient_email)

    # Debit sender
    await _db.registrations.update_one({"email": email}, {"$inc": {"jetons_solde": -body.amount}})
    await _db.cc_transactions.insert_one({
        "id": f"tx_{tx_id}_out", "email": email, "type": "transfer",
        "label": f"Envoi a {recipient_name}" + (f" — {body.note}" if body.note else ""),
        "jetons": -body.amount, "timestamp": now_iso, "status": "completed",
    })

    # Credit recipient
    await _db.registrations.update_one(
        {"email": body.recipient_email.lower()}, {"$inc": {"jetons_solde": body.amount}}
    )
    await _db.cc_transactions.insert_one({
        "id": f"tx_{tx_id}_in", "email": body.recipient_email.lower(), "type": "credit",
        "label": f"Recu de {sender_name}" + (f" — {body.note}" if body.note else ""),
        "jetons": body.amount, "timestamp": now_iso, "status": "completed",
    })

    new_balance = balance - body.amount
    return {"success": True, "new_balance": new_balance, "transferred": body.amount, "to": recipient_name}
