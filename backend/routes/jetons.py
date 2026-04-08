"""
Jetons CC Routes — Economic model for Culture Connect 2026
1 Jeton CC = 1.50EUR valeur faciale
Primary: MongoDB | Mirror: Baserow
"""
import os
import logging
import asyncio
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

from services.frek_client import frek_client
from services.baserow_service import update_mirror
from services import ses_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/jetons", tags=["jetons"])

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")
BASE_URL = os.environ.get("BASE_URL", "https://kiltikonet.fr")
JETON_VALEUR = float(os.environ.get("JETON_VALEUR_EURO", "1.50"))

JETON_PACKS = {
    "decouverte": {"name": "Decouverte", "jetons": 10, "price": 10.00, "value": 15.00},
    "culture": {"name": "Culture", "jetons": 25, "price": 25.00, "value": 37.50},
    "diaspora": {"name": "Diaspora", "jetons": 50, "price": 50.00, "value": 75.00},
    "vip": {"name": "VIP", "jetons": 100, "price": 100.00, "value": 150.00},
}


class JetonCheckoutRequest(BaseModel):
    badge_id: str
    pack: str
    origin_url: Optional[str] = None


class JetonSpendRequest(BaseModel):
    badge_id: str
    amount: int
    description: Optional[str] = None


@router.get("/packs")
async def get_packs():
    packs = []
    for key, pack in JETON_PACKS.items():
        packs.append({
            "id": key,
            "name": pack["name"],
            "jetons": pack["jetons"],
            "price_eur": pack["price"],
            "value_eur": pack["value"],
            "savings_pct": round((1 - pack["price"] / pack["value"]) * 100),
        })
    return {"packs": packs, "jeton_value_eur": JETON_VALEUR}


@router.post("/checkout")
async def create_jeton_checkout(req: JetonCheckoutRequest, request: Request):
    if req.pack not in JETON_PACKS:
        raise HTTPException(status_code=400, detail=f"Pack invalide. Choix: {list(JETON_PACKS.keys())}")

    badge = await _db.cc_badges.find_one({"badge_id": req.badge_id}, {"_id": 0})
    if not badge:
        raise HTTPException(status_code=404, detail="Badge non trouve")

    pack = JETON_PACKS[req.pack]
    origin = req.origin_url or BASE_URL

    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/jetons/stripe/webhook"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    metadata = {
        "type": "jetons",
        "pack": req.pack,
        "badge_id": req.badge_id,
        "jetons": str(pack["jetons"]),
        "email": badge.get("email", ""),
        "prenom": badge.get("prenom", ""),
    }

    checkout_request = CheckoutSessionRequest(
        amount=pack["price"],
        currency="eur",
        success_url=f"{origin}/jetons/confirmation?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{origin}/jetons",
        metadata=metadata,
    )

    try:
        session = await stripe_checkout.create_checkout_session(checkout_request)
        return {"url": session.url, "session_id": session.session_id}
    except Exception as e:
        logger.error(f"Stripe jeton checkout error: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur paiement: {str(e)}")


@router.post("/stripe/webhook")
async def jeton_stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    if not signature:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature")

    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/jetons/stripe/webhook"

    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    stripe_checkout = StripeCheckout(
        api_key=STRIPE_API_KEY, webhook_url=webhook_url, webhook_secret=webhook_secret,
    )

    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        if webhook_response.event_type == "checkout.session.completed":
            metadata = webhook_response.metadata
            if metadata.get("type") == "jetons":
                await _process_jeton_purchase(metadata)
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Jeton webhook error: {e}")
        return {"status": "error", "message": str(e)}


async def _process_jeton_purchase(metadata: dict):
    badge_id = metadata.get("badge_id", "")
    pack_key = metadata.get("pack", "")
    jetons_to_add = int(metadata.get("jetons", "0"))
    email = metadata.get("email", "")
    prenom = metadata.get("prenom", "")
    pack = JETON_PACKS.get(pack_key, {})

    badge = await _db.cc_badges.find_one({"badge_id": badge_id}, {"_id": 0})
    if not badge:
        logger.error(f"Badge {badge_id} not found for jeton purchase")
        return

    current_solde = badge.get("jetons_solde", 0) or 0
    new_solde = current_solde + jetons_to_add

    # Update MongoDB
    await _db.cc_badges.update_one(
        {"badge_id": badge_id}, {"$set": {"jetons_solde": new_solde}}
    )

    # Log transaction
    await _db.cc_transactions.insert_one({
        "badge_id": badge_id, "type": "achat", "pack": pack_key,
        "jetons": jetons_to_add, "amount_eur": pack.get("price", 0),
        "previous_solde": current_solde, "new_solde": new_solde,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    # Update Baserow mirror
    baserow_id = badge.get("baserow_row_id")
    if baserow_id:
        badge_copy = {**badge, "jetons_solde": new_solde}
        asyncio.create_task(update_mirror(baserow_id, badge_copy))

    # FREK stage METAMORPHOSE
    frek_id = badge.get("frek_id", "")
    if frek_id:
        asyncio.create_task(frek_client.record_stage(frek_id, "METAMORPHOSE"))

    # Email wallet recharge
    if email:
        asyncio.create_task(ses_service.send_wallet_recharge(
            to_email=email, prenom=prenom, badge_id=badge_id,
            pack_name=pack.get("name", pack_key),
            jetons_ajoutes=jetons_to_add, nouveau_solde=new_solde,
        ))
    logger.info(f"Jeton purchase: {badge_id} +{jetons_to_add} -> {new_solde}")


@router.get("/wallet/{badge_id}")
async def get_wallet(badge_id: str):
    badge = await _db.cc_badges.find_one({"badge_id": badge_id}, {"_id": 0})
    if not badge:
        raise HTTPException(status_code=404, detail="Badge non trouve")
    solde = badge.get("jetons_solde", 0) or 0
    return {
        "badge_id": badge_id,
        "jetons_solde": solde,
        "valeur_eur": round(solde * JETON_VALEUR, 2),
        "prenom": badge.get("prenom"),
        "nom": badge.get("nom"),
        "type_badge": badge.get("type_badge"),
    }


@router.post("/spend")
async def spend_jetons(req: JetonSpendRequest):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Montant invalide")

    badge = await _db.cc_badges.find_one({"badge_id": req.badge_id}, {"_id": 0})
    if not badge:
        raise HTTPException(status_code=404, detail="Badge non trouve")

    current_solde = badge.get("jetons_solde", 0) or 0
    if current_solde < req.amount:
        raise HTTPException(status_code=400, detail=f"Solde insuffisant ({current_solde} < {req.amount})")

    new_solde = current_solde - req.amount
    await _db.cc_badges.update_one(
        {"badge_id": req.badge_id}, {"$set": {"jetons_solde": new_solde}}
    )

    await _db.cc_transactions.insert_one({
        "badge_id": req.badge_id, "type": "depense", "jetons": -req.amount,
        "description": req.description,
        "previous_solde": current_solde, "new_solde": new_solde,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "badge_id": req.badge_id, "spent": req.amount,
        "previous_solde": current_solde, "new_solde": new_solde,
    }


@router.get("/transactions/{badge_id}")
async def get_transactions(badge_id: str):
    txs = await _db.cc_transactions.find(
        {"badge_id": badge_id}, {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    return {"badge_id": badge_id, "transactions": txs}


@router.get("/stats")
async def jetons_stats():
    badges = await _db.cc_badges.find({}, {"_id": 0, "jetons_solde": 1}).to_list(5000)
    total_jetons = sum((b.get("jetons_solde") or 0) for b in badges)
    holders = sum(1 for b in badges if (b.get("jetons_solde") or 0) > 0)
    return {
        "total_jetons_circulation": total_jetons,
        "valeur_totale_eur": round(total_jetons * JETON_VALEUR, 2),
        "holders": holders,
        "total_badges": len(badges),
    }
