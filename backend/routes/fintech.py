"""
KILTIKONET FINTECH — Service Financier Centralisé
===================================================
Wallet Universel · Stripe Omnicanal · Jetons Transversaux · Ghost Bridge

Architecture :
- Wallet unifié par user_id + frek_id (sync temps réel)
- Transactions taggées par channel (web/app/terminal/api)
- Stripe Checkout multi-canal (kiltikonet.fr, App, CC2026)
- Webhook centralisé pour créditer le wallet
- Ghost Bridge post-achat (preuve de vie globale)
- Ledger complet avec audit trail

Collections MongoDB :
- kn_wallets       : { user_id, frek_id, balance, currency, channel_balances }
- kn_transactions  : { wallet_id, amount, type, channel, metadata, ... }
- kn_checkout_sessions : { session_id, wallet_id, package, status, channel }
- shop_products    : { id, name, price, category, ... }
"""
import os
import uuid
import random
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(tags=["fintech"])

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]

STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")

# ═══════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════
CHANNELS = ["web", "app", "terminal", "api", "pos"]
KT_EUR_RATE = 1.50  # 1 Kilti-Token = 1.50 EUR

KILTI_PACKAGES = {
    "kt-10":  {"name": "10 Kilti-Tokens",   "tokens": 10,  "price_eur": 15.00,  "badge": "Populaire"},
    "kt-50":  {"name": "50 Kilti-Tokens",   "tokens": 50,  "price_eur": 67.50,  "badge": "-10%"},
    "kt-100": {"name": "100 Kilti-Tokens",  "tokens": 100, "price_eur": 120.00, "badge": "-20%"},
    "kt-250": {"name": "250 Kilti-Tokens",  "tokens": 250, "price_eur": 275.00, "badge": "Pack Diaspora"},
    "kt-500": {"name": "500 Kilti-Tokens",  "tokens": 500, "price_eur": 500.00, "badge": "Pack Mécène"},
}

TX_TYPES = [
    "purchase",       # Achat de tokens via Stripe
    "transfer_out",   # Soutien envoyé (débit)
    "transfer_in",    # Soutien reçu (crédit)
    "reward",         # Bonus Growth Engine
    "onboarding",     # Récompense onboarding
    "invitation",     # Bonus parrainage
    "consumption",    # Dépense sur place CC2026
    "refund",         # Remboursement
    "adjustment",     # Ajustement admin
]


# ═══════════════════════════════════════════════════════════
# WALLET SERVICE — Wallet Universel
# ═══════════════════════════════════════════════════════════
async def get_or_create_wallet(user_id: str, frek_id: str = None):
    """Récupère ou crée un wallet universel pour un utilisateur."""
    wallet = await _db.kn_wallets.find_one(
        {"$or": [{"user_id": user_id}, {"frek_id": frek_id}]} if frek_id else {"user_id": user_id},
        {"_id": 0}
    )
    if wallet:
        # Update frek_id link if provided and not yet linked
        if frek_id and not wallet.get("frek_id"):
            await _db.kn_wallets.update_one(
                {"user_id": user_id}, {"$set": {"frek_id": frek_id}}
            )
            wallet["frek_id"] = frek_id
        return wallet

    # Migrate from legacy (registrations.jetons_solde or cc_badges)
    legacy_balance = 0
    reg = await _db.registrations.find_one({"id": user_id}, {"_id": 0, "jetons_solde": 1, "frek_id": 1})
    if reg:
        legacy_balance = reg.get("jetons_solde", 0) or 0
        frek_id = frek_id or reg.get("frek_id")
    else:
        badge = await _db.cc_badges.find_one({"badge_id": user_id}, {"_id": 0, "jetons_solde": 1, "frek_id": 1})
        if badge:
            legacy_balance = badge.get("jetons_solde", 0) or 0
            frek_id = frek_id or badge.get("frek_id")

    wallet = {
        "wallet_id": f"kw_{str(uuid.uuid4())[:12]}",
        "user_id": user_id,
        "frek_id": frek_id,
        "balance": legacy_balance,
        "currency": "KT",
        "total_purchased": 0,
        "total_spent": 0,
        "total_earned": 0,
        "total_received": 0,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await _db.kn_wallets.insert_one({**wallet})
    wallet.pop("_id", None)
    return wallet


async def credit_wallet(user_id: str, amount: int, tx_type: str, reason: str,
                        channel: str = "app", metadata: dict = None):
    """Créditer un wallet — opération atomique."""
    wallet = await get_or_create_wallet(user_id)
    now = datetime.now(timezone.utc).isoformat()

    # Atomic balance update
    inc_fields = {"balance": amount, "updated_at": 1}
    if tx_type == "purchase":
        inc_fields["total_purchased"] = amount
    elif tx_type in ("reward", "onboarding", "invitation"):
        inc_fields["total_earned"] = amount
    elif tx_type == "transfer_in":
        inc_fields["total_received"] = amount

    # Use $inc for atomicity but updated_at needs $set
    await _db.kn_wallets.update_one(
        {"user_id": user_id},
        {"$inc": {"balance": amount, "total_purchased": amount if tx_type == "purchase" else 0,
                  "total_earned": amount if tx_type in ("reward", "onboarding", "invitation") else 0,
                  "total_received": amount if tx_type == "transfer_in" else 0},
         "$set": {"updated_at": now}}
    )

    # Also sync legacy balance
    await _db.registrations.update_one({"id": user_id}, {"$inc": {"jetons_solde": amount}})

    # Log transaction
    tx = {
        "tx_id": f"tx_{str(uuid.uuid4())[:12]}",
        "wallet_id": wallet["wallet_id"],
        "user_id": user_id,
        "amount": amount,
        "type": tx_type,
        "reason": reason,
        "channel": channel,
        "metadata": metadata or {},
        "balance_after": (wallet.get("balance", 0) or 0) + amount,
        "created_at": now,
    }
    await _db.kn_transactions.insert_one(tx)
    tx.pop("_id", None)
    logger.info(f"Wallet credit: {amount} KT to {user_id} ({tx_type}/{channel}): {reason}")
    return tx


async def debit_wallet(user_id: str, amount: int, tx_type: str, reason: str,
                       channel: str = "app", metadata: dict = None):
    """Débiter un wallet — vérifie le solde, opération atomique."""
    wallet = await get_or_create_wallet(user_id)
    if (wallet.get("balance", 0) or 0) < amount:
        raise HTTPException(400, f"Solde insuffisant ({wallet.get('balance', 0)} KT < {amount} KT)")

    now = datetime.now(timezone.utc).isoformat()
    await _db.kn_wallets.update_one(
        {"user_id": user_id},
        {"$inc": {"balance": -amount, "total_spent": amount},
         "$set": {"updated_at": now}}
    )
    await _db.registrations.update_one({"id": user_id}, {"$inc": {"jetons_solde": -amount}})

    tx = {
        "tx_id": f"tx_{str(uuid.uuid4())[:12]}",
        "wallet_id": wallet["wallet_id"],
        "user_id": user_id,
        "amount": -amount,
        "type": tx_type,
        "reason": reason,
        "channel": channel,
        "metadata": metadata or {},
        "balance_after": (wallet.get("balance", 0) or 0) - amount,
        "created_at": now,
    }
    await _db.kn_transactions.insert_one(tx)
    tx.pop("_id", None)
    logger.info(f"Wallet debit: {amount} KT from {user_id} ({tx_type}/{channel}): {reason}")
    return tx


# ═══════════════════════════════════════════════════════════
# WALLET API ENDPOINTS
# ═══════════════════════════════════════════════════════════
@router.get("/api/wallet/{user_id}")
async def get_wallet(user_id: str):
    """Wallet universel — accessible depuis web, app, terminal."""
    wallet = await get_or_create_wallet(user_id)
    return {
        "wallet_id": wallet["wallet_id"],
        "user_id": wallet["user_id"],
        "frek_id": wallet.get("frek_id"),
        "balance": wallet.get("balance", 0),
        "currency": "KT",
        "eur_value": round((wallet.get("balance", 0) or 0) * KT_EUR_RATE, 2),
        "stats": {
            "total_purchased": wallet.get("total_purchased", 0),
            "total_spent": wallet.get("total_spent", 0),
            "total_earned": wallet.get("total_earned", 0),
            "total_received": wallet.get("total_received", 0),
        },
        "status": wallet.get("status", "active"),
    }


@router.get("/api/wallet/{user_id}/transactions")
async def get_transactions(user_id: str, limit: int = 50, channel: str = None):
    """Historique complet des transactions (filtrable par canal)."""
    query = {"user_id": user_id}
    if channel:
        query["channel"] = channel
    txs = await _db.kn_transactions.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"transactions": txs, "total": len(txs)}


@router.get("/api/wallet/frek/{frek_id}")
async def get_wallet_by_frek(frek_id: str):
    """Lookup wallet par FREK-ID (pour terminaux CC2026 / NFC scan)."""
    wallet = await _db.kn_wallets.find_one({"frek_id": frek_id}, {"_id": 0})
    if not wallet:
        raise HTTPException(404, "Aucun wallet lié à ce FREK-ID")
    return {
        "wallet_id": wallet["wallet_id"],
        "user_id": wallet["user_id"],
        "frek_id": wallet["frek_id"],
        "balance": wallet.get("balance", 0),
        "eur_value": round((wallet.get("balance", 0) or 0) * KT_EUR_RATE, 2),
        "status": wallet.get("status", "active"),
    }


@router.post("/api/wallet/link-frek")
async def link_frek_to_wallet(data: dict):
    """Lier un FREK-ID à un wallet existant (activation terminal CC2026)."""
    user_id = data.get("user_id")
    frek_id = data.get("frek_id")
    if not user_id or not frek_id:
        raise HTTPException(400, "user_id et frek_id requis")

    wallet = await get_or_create_wallet(user_id, frek_id)
    await _db.kn_wallets.update_one(
        {"user_id": user_id},
        {"$set": {"frek_id": frek_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "wallet_id": wallet["wallet_id"], "frek_id": frek_id}


# ═══════════════════════════════════════════════════════════
# TRANSFER SERVICE — Soutien inter-wallet
# ═══════════════════════════════════════════════════════════
@router.post("/api/wallet/transfer")
async def transfer_tokens(data: dict):
    """Transfert de Kilti-Tokens entre wallets (Soutenir)."""
    from_id = data.get("from_user_id")
    to_id = data.get("to_user_id")
    amount = int(data.get("amount", 0))
    reason = data.get("reason", "Soutien")
    channel = data.get("channel", "app")

    if not from_id or not to_id or amount <= 0:
        raise HTTPException(400, "from_user_id, to_user_id et amount > 0 requis")

    # Debit sender
    await debit_wallet(from_id, amount, "transfer_out", f"Soutien envoyé: {reason}", channel,
                       {"target_user_id": to_id})
    # Credit receiver
    await credit_wallet(to_id, amount, "transfer_in", f"Soutien reçu: {reason}", channel,
                        {"source_user_id": from_id})

    return {"success": True, "amount": amount, "message": f"{amount} KT transférés"}


# ═══════════════════════════════════════════════════════════
# TERMINAL SERVICE — Consommation physique CC2026
# ═══════════════════════════════════════════════════════════
@router.post("/api/wallet/consume")
async def consume_tokens(data: dict):
    """
    Débiter des tokens au terminal CC2026 (consommation sur place).
    Identifiant : frek_id (scan NFC) ou user_id.
    """
    frek_id = data.get("frek_id")
    user_id = data.get("user_id")
    amount = int(data.get("amount", 0))
    item = data.get("item", "Consommation CC2026")
    terminal_id = data.get("terminal_id", "unknown")

    if not (frek_id or user_id) or amount <= 0:
        raise HTTPException(400, "frek_id ou user_id + amount > 0 requis")

    # Resolve user_id from frek_id if needed
    if frek_id and not user_id:
        wallet = await _db.kn_wallets.find_one({"frek_id": frek_id}, {"_id": 0, "user_id": 1})
        if not wallet:
            raise HTTPException(404, "FREK-ID non reconnu")
        user_id = wallet["user_id"]

    tx = await debit_wallet(user_id, amount, "consumption", item, "terminal",
                            {"terminal_id": terminal_id, "frek_id": frek_id})

    return {"success": True, "amount": amount, "item": item, "balance_after": tx["balance_after"]}


# ═══════════════════════════════════════════════════════════
# STRIPE CHECKOUT — Multi-canal
# ═══════════════════════════════════════════════════════════
@router.get("/api/shop/packages")
async def list_packages():
    """Liste les packs Kilti-Tokens disponibles."""
    packages = []
    for pid, pkg in KILTI_PACKAGES.items():
        packages.append({
            "id": pid,
            "name": pkg["name"],
            "tokens": pkg["tokens"],
            "price": pkg["price_eur"],
            "currency": "EUR",
            "unit_price": round(pkg["price_eur"] / pkg["tokens"], 2),
            "badge": pkg.get("badge"),
            "savings_pct": round((1 - (pkg["price_eur"] / pkg["tokens"]) / KT_EUR_RATE) * 100) if pkg["tokens"] > 10 else 0,
        })
    return {"packages": packages}


@router.post("/api/shop/checkout/create")
async def create_checkout(data: dict, request: Request):
    """
    Crée une session Stripe Checkout — omnicanal.
    Input: { package_id, user_id, channel: "web"|"app", origin_url }
    Le montant est fixé côté serveur (sécurité).
    """
    from emergentintegrations.payments.stripe.checkout import (
        StripeCheckout, CheckoutSessionRequest
    )

    package_id = data.get("package_id")
    user_id = data.get("user_id")
    channel = data.get("channel", "app")
    origin_url = data.get("origin_url", str(request.base_url).rstrip("/"))
    frek_id = data.get("frek_id")

    if not package_id or not user_id:
        raise HTTPException(400, "package_id et user_id requis")

    # Server-side package lookup
    pkg = KILTI_PACKAGES.get(package_id)
    if not pkg:
        product = await _db.shop_products.find_one({"id": package_id, "active": True}, {"_id": 0})
        if not product:
            raise HTTPException(404, "Package non trouvé")
        pkg = {"name": product["name"], "tokens": 0, "price_eur": product["price"]}

    # Ensure wallet exists
    await get_or_create_wallet(user_id, frek_id)

    # Dynamic return URLs based on channel
    if channel == "web":
        success_url = f"{origin_url}/wallet?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/wallet?payment=cancelled"
    else:
        success_url = f"{origin_url}/espace-pro?section=shop&payment=success&session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/espace-pro?section=shop&payment=cancelled"

    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    checkout_req = CheckoutSessionRequest(
        amount=pkg["price_eur"],
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user_id,
            "frek_id": frek_id or "",
            "package_id": package_id,
            "tokens": str(pkg.get("tokens", 0)),
            "product_name": pkg["name"],
            "channel": channel,
            "ecosystem": "kiltikonet",
        },
    )
    session = await stripe.create_checkout_session(checkout_req)

    # Record session
    await _db.kn_checkout_sessions.insert_one({
        "session_id": session.session_id,
        "user_id": user_id,
        "frek_id": frek_id,
        "package_id": package_id,
        "product_name": pkg["name"],
        "amount_eur": pkg["price_eur"],
        "tokens": pkg.get("tokens", 0),
        "channel": channel,
        "status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"url": session.url, "session_id": session.session_id}


@router.get("/api/shop/checkout/status/{session_id}")
async def check_checkout_status(session_id: str, request: Request):
    """Poll Stripe session status — crédite le wallet si payé."""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout

    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    status = await stripe.get_checkout_status(session_id)

    # Check if already processed
    cs = await _db.kn_checkout_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if cs and cs.get("status") != "paid" and status.payment_status == "paid":
        tokens = cs.get("tokens", 0)
        user_id = cs.get("user_id")
        channel = cs.get("channel", "app")

        if tokens > 0 and user_id:
            await credit_wallet(user_id, tokens, "purchase",
                                f"Achat {cs.get('product_name', 'KT')} via Stripe",
                                channel, {"session_id": session_id, "amount_eur": cs.get("amount_eur")})

            # Ghost Bridge — preuve de vie globale
            asyncio.create_task(_ghost_bridge_feedback(user_id, cs.get("product_name", ""), channel))

        await _db.kn_checkout_sessions.update_one(
            {"session_id": session_id},
            {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
        )

    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
        "tokens": cs.get("tokens", 0) if cs else 0,
    }


# ═══════════════════════════════════════════════════════════
# SHOP PRODUCTS CRUD
# ═══════════════════════════════════════════════════════════
@router.get("/api/shop/products")
async def list_products(category: str = None, search: str = None, limit: int = 50):
    """Liste les produits du shop."""
    query = {"active": True}
    if category and category != "all":
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]
    products = await _db.shop_products.find(query, {"_id": 0}).sort("order", 1).limit(limit).to_list(limit)
    return {"products": products, "total": len(products)}


@router.post("/api/shop/products")
async def create_product(data: dict):
    """Créer un produit."""
    product = {
        "id": data.get("id") or f"prod_{str(uuid.uuid4())[:8]}",
        "name": data["name"],
        "description": data.get("description", ""),
        "price": float(data.get("price", 0)),
        "currency": data.get("currency", "EUR"),
        "category": data.get("category", "general"),
        "artist_id": data.get("artist_id"),
        "image_url": data.get("image_url"),
        "badge": data.get("badge"),
        "stock": data.get("stock", -1),
        "token_price": data.get("token_price"),
        "active": True,
        "order": data.get("order", 99),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await _db.shop_products.insert_one(product)
    product.pop("_id", None)
    return product


@router.put("/api/shop/products/{product_id}")
async def update_product(product_id: str, data: dict):
    """Mettre à jour un produit."""
    update = {k: v for k, v in data.items() if k not in ("id", "_id")}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await _db.shop_products.update_one({"id": product_id}, {"$set": update})
    if result.modified_count == 0:
        raise HTTPException(404, "Produit non trouvé")
    return {"success": True}


@router.delete("/api/shop/products/{product_id}")
async def delete_product(product_id: str):
    """Désactiver un produit."""
    await _db.shop_products.update_one({"id": product_id}, {"$set": {"active": False}})
    return {"success": True}


@router.post("/api/shop/seed")
async def seed_shop():
    """Seed initial products."""
    existing = await _db.shop_products.count_documents({})
    if existing > 0:
        return {"message": f"{existing} produits déjà présents", "seeded": False}

    products = [
        {"id": "kt-10", "name": "10 Kilti-Tokens", "description": "Pack de 10 tokens pour soutenir les artistes", "price": 15.00, "currency": "EUR", "category": "jetons", "badge": "Populaire", "stock": -1, "order": 1},
        {"id": "kt-50", "name": "50 Kilti-Tokens", "description": "Pack de 50 tokens — economisez 10%", "price": 67.50, "currency": "EUR", "category": "jetons", "badge": "-10%", "stock": -1, "order": 2},
        {"id": "kt-100", "name": "100 Kilti-Tokens", "description": "Pack de 100 tokens — economisez 20%", "price": 120.00, "currency": "EUR", "category": "jetons", "badge": "-20%", "stock": -1, "order": 3},
        {"id": "kt-250", "name": "250 Kilti-Tokens", "description": "Pack Diaspora — economisez 27%", "price": 275.00, "currency": "EUR", "category": "jetons", "badge": "Pack Diaspora", "stock": -1, "order": 4},
        {"id": "kt-500", "name": "500 Kilti-Tokens", "description": "Pack Mecene — economisez 33%", "price": 500.00, "currency": "EUR", "category": "jetons", "badge": "Pack Mecene", "stock": -1, "order": 5},
        {"id": "ticket-general", "name": "Pass General CC2026", "description": "Acces complet au festival Culture Connect 2026", "price": 45.00, "currency": "EUR", "category": "billetterie", "badge": "J-49", "stock": 500, "order": 10},
        {"id": "ticket-vip", "name": "Pass VIP CC2026", "description": "Acces VIP + backstage + meet & greet", "price": 150.00, "currency": "EUR", "category": "billetterie", "badge": "VIP", "stock": 100, "order": 11},
        {"id": "album-fela", "name": "Fela Kuti — Zombie (Remasterise)", "description": "Album digital remasterise du legendaire afrobeat", "price": 12.00, "currency": "EUR", "category": "musique", "order": 20},
        {"id": "album-olodum", "name": "Olodum — Farao Divindade do Egito", "description": "Le classique du bloco afro de Salvador de Bahia", "price": 10.00, "currency": "EUR", "category": "musique", "order": 21},
        {"id": "album-buena-vista", "name": "Buena Vista Social Club", "description": "L'album qui a fait decouvrir le son cubain au monde", "price": 14.00, "currency": "EUR", "category": "musique", "order": 22},
        {"id": "print-osgemeos", "name": "Os Gemeos — Tirage Signe", "description": "Reproduction numerotee des legendaires jumeaux bresiliens", "price": 85.00, "currency": "EUR", "category": "art", "badge": "Edition limitee", "order": 30},
        {"id": "spice-jollof", "name": "Kit Jollof Rice Authentique", "description": "Epices pour jollof parfait — recette nigeriane", "price": 22.00, "currency": "EUR", "category": "gastronomie", "order": 40},
        {"id": "spice-moqueca", "name": "Kit Moqueca Baiana", "description": "Ingredients moqueca de Salvador: dende, coco, piments", "price": 25.00, "currency": "EUR", "category": "gastronomie", "order": 41},
        {"id": "tshirt-kiltikonet", "name": "T-Shirt KILTIKONET — Or Blanc", "description": "Coton bio, design afrofuturiste", "price": 35.00, "currency": "EUR", "category": "mode", "badge": "Nouveau", "order": 50},
        {"id": "ankara-bag", "name": "Sac Ankara — Lagos Design", "description": "Sac en tissu ankara fait main par artisanes nigerianes", "price": 55.00, "currency": "EUR", "category": "mode", "order": 51},
        {"id": "book-adichie", "name": "Chimamanda Ngozi Adichie — Americanah", "description": "Roman culte sur l'identite africaine en diaspora", "price": 18.00, "currency": "EUR", "category": "litterature", "order": 60},
        {"id": "book-amado", "name": "Jorge Amado — Bahia de Todos os Santos", "description": "Portrait de la ville la plus africaine des Ameriques", "price": 15.00, "currency": "EUR", "category": "litterature", "order": 61},
        {"id": "workshop-afrobeat", "name": "Atelier Afrobeat — 2h", "description": "Initiation aux rythmes afrobeat avec maitre percussionniste de Lagos", "price": 40.00, "currency": "EUR", "category": "formation", "order": 70},
        {"id": "workshop-samba", "name": "Cours Samba de Roda — 5 sessions", "description": "Samba traditionnelle du Reconcavo Baiano", "price": 75.00, "currency": "EUR", "category": "formation", "order": 71},
    ]
    for p in products:
        p["active"] = True
        p["created_at"] = datetime.now(timezone.utc).isoformat()
    await _db.shop_products.insert_many(products)
    return {"products_created": len(products), "seeded": True}


# ═══════════════════════════════════════════════════════════
# NOTIFICATIONS
# ═══════════════════════════════════════════════════════════
@router.get("/api/notifications/{user_id}")
async def get_notifications(user_id: str, limit: int = 20):
    """Notifications utilisateur (toutes sources)."""
    notifs = await _db.notifications.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    unread = sum(1 for n in notifs if not n.get("read"))
    return {"notifications": notifs, "unread": unread}


@router.post("/api/notifications/{user_id}/read")
async def mark_notifications_read(user_id: str):
    """Marquer toutes les notifications comme lues."""
    await _db.notifications.update_many(
        {"user_id": user_id, "read": False}, {"$set": {"read": True}}
    )
    return {"success": True}


# ═══════════════════════════════════════════════════════════
# GHOST BRIDGE — Preuve de vie globale post-achat
# ═══════════════════════════════════════════════════════════
GHOST_THANK_MESSAGES = [
    "Merci de soutenir la culture ! Ta contribution traverse les oceans.",
    "Ashe ! Chaque Kilti-Token est un acte de soutien a la creation.",
    "Ubuntu — nous sommes un. Merci pour ta solidarite culturelle !",
    "De Lagos a Salvador, merci pour ton soutien !",
    "Axe ! Les artistes d'Afrique et d'Amerique Latine te remercient.",
    "Cada token es un puente entre culturas. Gracias por tu apoyo !",
    "We move together. Thank you for supporting the culture.",
    "Ta generosite alimente la resistance culturelle. Merci !",
]

async def _ghost_bridge_feedback(user_id: str, product_name: str, channel: str):
    """Post-purchase: ghost sends thank you — preuve de vie globale."""
    try:
        await asyncio.sleep(random.randint(15, 90))
        ghost = await _db.ghost_profiles_v2.find_one(
            {"active": True, "profile_type": {"$in": ["institution", "label", "association"]}},
            {"_id": 0, "id": 1, "full_name": 1, "image": 1}
        )
        if not ghost:
            return

        await _db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "from_id": ghost["id"],
            "from_name": ghost["full_name"],
            "from_image": ghost.get("image", ""),
            "type": "ghost_thank_you",
            "message": random.choice(GHOST_THANK_MESSAGES),
            "product_name": product_name,
            "channel": channel,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Ghost bridge ({channel}): {ghost['full_name']} thanked {user_id}")
    except Exception as e:
        logger.warning(f"Ghost bridge error: {e}")


# ═══════════════════════════════════════════════════════════
# REVENUE DASHBOARD — Stats financières
# ═══════════════════════════════════════════════════════════
@router.get("/api/fintech/dashboard")
async def fintech_dashboard():
    """Dashboard financier pour admin."""
    now = datetime.now(timezone.utc)
    day_ago = (now - timedelta(days=1)).isoformat()
    week_ago = (now - timedelta(days=7)).isoformat()

    total_wallets = await _db.kn_wallets.count_documents({})
    total_txs = await _db.kn_transactions.count_documents({})
    purchases = await _db.kn_transactions.find({"type": "purchase"}, {"_id": 0, "amount": 1}).to_list(10000)
    total_purchased = sum(t.get("amount", 0) for t in purchases)

    transfers = await _db.kn_transactions.count_documents({"type": "transfer_out"})
    consumptions = await _db.kn_transactions.count_documents({"type": "consumption"})

    sessions_total = await _db.kn_checkout_sessions.count_documents({})
    sessions_paid = await _db.kn_checkout_sessions.count_documents({"status": "paid"})

    # Revenue by channel
    pipeline = [
        {"$match": {"type": "purchase"}},
        {"$group": {"_id": "$channel", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
    ]
    by_channel = await _db.kn_transactions.aggregate(pipeline).to_list(10)

    return {
        "wallets": total_wallets,
        "transactions": total_txs,
        "tokens_in_circulation": total_purchased,
        "eur_revenue": round(total_purchased * KT_EUR_RATE, 2),
        "transfers": transfers,
        "consumptions": consumptions,
        "checkout_sessions": {"total": sessions_total, "paid": sessions_paid},
        "revenue_by_channel": {r["_id"]: {"tokens": r["total"], "count": r["count"]} for r in by_channel},
    }
