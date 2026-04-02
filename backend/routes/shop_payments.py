"""
Shop & Payments — Backend CRUD + Stripe Checkout + Ghost Bridge
================================================================
- CRUD produits (collection: shop_products)
- Stripe Checkout pour Kilti-Tokens (packs 10/50/100)
- Webhook + polling status
- Ghost Bridge: feedback loop post-achat
"""
import os
import uuid
import secrets
import random as _rng
import logging
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/shop", tags=["shop"])

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
_db = _client[os.environ["DB_NAME"]]

# Stripe setup
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")

# ═══════════════════════════════════════════════════════════
# FIXED PACKAGES — Server-side only (never trust frontend amounts)
# ═══════════════════════════════════════════════════════════
KILTI_TOKEN_PACKAGES = {
    "kt-10":  {"name": "10 Kilti-Tokens",  "tokens": 10,  "price": 15.00,  "currency": "eur", "badge": "Populaire"},
    "kt-50":  {"name": "50 Kilti-Tokens",  "tokens": 50,  "price": 67.50,  "currency": "eur", "badge": "Meilleur rapport"},
    "kt-100": {"name": "100 Kilti-Tokens", "tokens": 100, "price": 120.00, "currency": "eur", "badge": "Premium"},
}


# ═══════════════════════════════════════════════════════════
# PRODUCTS CRUD
# ═══════════════════════════════════════════════════════════
@router.get("/products")
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


@router.post("/products")
async def create_product(data: dict):
    """Créer un produit (admin)."""
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


@router.put("/products/{product_id}")
async def update_product(product_id: str, data: dict):
    """Mettre à jour un produit."""
    update = {k: v for k, v in data.items() if k not in ("id", "_id")}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await _db.shop_products.update_one({"id": product_id}, {"$set": update})
    if result.modified_count == 0:
        raise HTTPException(404, "Produit non trouvé")
    return {"success": True, "id": product_id}


@router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    """Désactiver un produit."""
    await _db.shop_products.update_one({"id": product_id}, {"$set": {"active": False}})
    return {"success": True, "id": product_id}


# ═══════════════════════════════════════════════════════════
# SEED SHOP — Initial products
# ═══════════════════════════════════════════════════════════
@router.post("/seed")
async def seed_shop():
    """Seed initial products if not already done."""
    existing = await _db.shop_products.count_documents({})
    if existing > 0:
        return {"message": f"{existing} produits déjà présents", "seeded": False}

    products = [
        # Kilti-Tokens
        {"id": "kt-10", "name": "10 Kilti-Tokens", "description": "Pack de 10 tokens pour soutenir les artistes", "price": 15.00, "currency": "EUR", "category": "jetons", "badge": "Populaire", "stock": -1, "order": 1},
        {"id": "kt-50", "name": "50 Kilti-Tokens", "description": "Pack de 50 tokens — economisez 10%", "price": 67.50, "currency": "EUR", "category": "jetons", "badge": "Meilleur rapport", "stock": -1, "order": 2},
        {"id": "kt-100", "name": "100 Kilti-Tokens", "description": "Pack de 100 tokens — economisez 20%", "price": 120.00, "currency": "EUR", "category": "jetons", "badge": "Premium", "stock": -1, "order": 3},
        # Billetterie
        {"id": "ticket-general", "name": "Pass General", "description": "Acces complet au festival Culture Connect 2026", "price": 45.00, "currency": "EUR", "category": "billetterie", "badge": "J-49", "stock": 500, "order": 10},
        {"id": "ticket-vip", "name": "Pass VIP", "description": "Acces VIP + backstage + meet & greet artistes", "price": 150.00, "currency": "EUR", "category": "billetterie", "badge": "VIP", "stock": 100, "order": 11},
        # Musique
        {"id": "album-fela", "name": "Fela Kuti — Zombie (Remasterise)", "description": "Album digital remasterise du legendaire afrobeat", "price": 12.00, "currency": "EUR", "category": "musique", "order": 20},
        {"id": "album-olodum", "name": "Olodum — Farao Divindade do Egito", "description": "Le classique du bloco afro de Salvador de Bahia", "price": 10.00, "currency": "EUR", "category": "musique", "order": 21},
        {"id": "album-buena-vista", "name": "Buena Vista Social Club", "description": "L'album qui a fait decouvrir le son cubain au monde entier", "price": 14.00, "currency": "EUR", "category": "musique", "order": 22},
        # Art
        {"id": "print-osgemeos", "name": "Os Gemeos — Tirage Signe", "description": "Reproduction numerotee 30x40cm des legendaires jumeaux bresiliens", "price": 85.00, "currency": "EUR", "category": "art", "badge": "Edition limitee", "order": 30},
        {"id": "print-laolu", "name": "Laolu Senbanjo — Sacred Art", "description": "Tirage limite art sacre yoruba contemporain", "price": 75.00, "currency": "EUR", "category": "art", "order": 31},
        # Gastronomie
        {"id": "spice-jollof", "name": "Kit Jollof Rice Authentique", "description": "Epices et riz basmati pour un jollof parfait — recette nigeriane", "price": 22.00, "currency": "EUR", "category": "gastronomie", "order": 40},
        {"id": "spice-moqueca", "name": "Kit Moqueca Baiana", "description": "Ingredients pour la moqueca de Salvador: dende, lait de coco, piments", "price": 25.00, "currency": "EUR", "category": "gastronomie", "order": 41},
        # Mode
        {"id": "tshirt-kiltikonet", "name": "T-Shirt KILTIKONET — Or Blanc", "description": "Coton bio, serigraphie logo KILTIKONET. Design afrofuturiste", "price": 35.00, "currency": "EUR", "category": "mode", "badge": "Nouveau", "order": 50},
        {"id": "ankara-bag", "name": "Sac Ankara — Lagos Design", "description": "Sac en tissu ankara fait main par des artisanes nigerianes", "price": 55.00, "currency": "EUR", "category": "mode", "order": 51},
        # Littérature
        {"id": "book-adichie", "name": "Chimamanda Ngozi Adichie — Americanah", "description": "Le roman culte sur l'identite africaine dans la diaspora", "price": 18.00, "currency": "EUR", "category": "litterature", "order": 60},
        {"id": "book-amado", "name": "Jorge Amado — Bahia de Todos os Santos", "description": "Portrait litteraire de la ville la plus africaine des Ameriques", "price": 15.00, "currency": "EUR", "category": "litterature", "order": 61},
        # Formation
        {"id": "workshop-afrobeat", "name": "Atelier Afrobeat — 2h", "description": "Initiation aux rythmes afrobeat avec un maitre percussionniste de Lagos", "price": 40.00, "currency": "EUR", "category": "formation", "order": 70},
        {"id": "workshop-samba", "name": "Cours Samba de Roda — 5 sessions", "description": "Apprendre la samba traditionnelle du Reconcavo Baiano", "price": 75.00, "currency": "EUR", "category": "formation", "order": 71},
    ]

    for p in products:
        p["active"] = True
        p["created_at"] = datetime.now(timezone.utc).isoformat()

    await _db.shop_products.insert_many(products)
    return {"products_created": len(products), "seeded": True}


# ═══════════════════════════════════════════════════════════
# STRIPE CHECKOUT — Kilti-Tokens Purchase
# ═══════════════════════════════════════════════════════════
@router.post("/checkout/create")
async def create_checkout(data: dict, request: Request):
    """
    Crée une session Stripe Checkout pour un pack de Kilti-Tokens.
    Le frontend envoie: { package_id: "kt-10", user_id: "...", origin_url: "..." }
    Le montant est défini côté serveur (sécurité).
    """
    from emergentintegrations.payments.stripe.checkout import (
        StripeCheckout, CheckoutSessionRequest
    )

    package_id = data.get("package_id")
    user_id = data.get("user_id")
    origin_url = data.get("origin_url", str(request.base_url).rstrip("/"))

    if not package_id or not user_id:
        raise HTTPException(400, "package_id et user_id requis")

    # Get server-side package (NEVER trust frontend prices)
    package = KILTI_TOKEN_PACKAGES.get(package_id)
    if not package:
        # Check for generic product purchase
        product = await _db.shop_products.find_one({"id": package_id, "active": True}, {"_id": 0})
        if not product:
            raise HTTPException(404, "Package ou produit non trouvé")
        package = {"name": product["name"], "tokens": 0, "price": product["price"], "currency": product.get("currency", "EUR").lower()}

    # Dynamic URLs
    success_url = f"{origin_url}/espace-pro?section=shop&payment=success&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/espace-pro?section=shop&payment=cancelled"

    # Create Stripe session
    api_key = STRIPE_API_KEY
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)

    checkout_request = CheckoutSessionRequest(
        amount=package["price"],
        currency=package.get("currency", "eur"),
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user_id,
            "package_id": package_id,
            "tokens": str(package.get("tokens", 0)),
            "product_name": package["name"],
        },
    )
    session = await stripe_checkout.create_checkout_session(checkout_request)

    # Record pending transaction
    await _db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "user_id": user_id,
        "package_id": package_id,
        "product_name": package["name"],
        "amount": package["price"],
        "currency": package.get("currency", "eur"),
        "tokens": package.get("tokens", 0),
        "payment_status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"url": session.url, "session_id": session.session_id}


@router.get("/checkout/status/{session_id}")
async def check_checkout_status(session_id: str, request: Request):
    """Poll le statut d'une session Stripe."""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout

    api_key = STRIPE_API_KEY
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)

    status = await stripe_checkout.get_checkout_status(session_id)

    # Update transaction
    tx = await _db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if tx and tx.get("payment_status") != "paid" and status.payment_status == "paid":
        # Credit tokens
        tokens = int(tx.get("tokens", 0))
        user_id = tx.get("user_id")

        if tokens > 0 and user_id:
            await _db.registrations.update_one(
                {"id": user_id}, {"$inc": {"jetons_solde": tokens}}
            )
            await _db.jetons_transactions.insert_one({
                "user_id": user_id, "amount": tokens, "type": "purchase",
                "reason": f"Achat {tx.get('product_name', 'Kilti-Tokens')} via Stripe",
                "session_id": session_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            logger.info(f"Credited {tokens} tokens to {user_id} (session {session_id})")

            # Trigger Ghost Bridge feedback
            asyncio.create_task(_ghost_bridge_feedback(user_id, tx.get("product_name", "")))

        await _db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": "paid",
                "status": status.status,
                "paid_at": datetime.now(timezone.utc).isoformat(),
            }}
        )

    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
    }


# ═══════════════════════════════════════════════════════════
# GHOST BRIDGE — Feedback loop post-achat
# ═══════════════════════════════════════════════════════════
GHOST_THANK_YOU_MESSAGES = [
    "Merci de soutenir la culture ! Ta contribution fait vivre les artistes du Sud Global.",
    "Ashe ! Chaque Kilti-Token est un acte de soutien a la creation culturelle.",
    "Ubuntu — Je suis parce que nous sommes. Merci pour ta solidarite culturelle !",
    "Ton soutien traverse les oceans. De Lagos a Salvador, merci !",
    "Axe ! Les artistes d'Afrique et d'Amerique Latine te remercient.",
    "Ta generosity fait partie de la resistance culturelle. Merci !",
    "Cada token es un puente entre culturas. Gracias por tu apoyo !",
    "We move together. Thank you for supporting the culture.",
]

async def _ghost_bridge_feedback(user_id: str, product_name: str):
    """Post-purchase: ghost institution sends thank you notification."""
    try:
        await asyncio.sleep(_rng.randint(15, 120))

        # Pick a random active ghost institution
        ghost = await _db.ghost_profiles_v2.find_one(
            {"active": True, "profile_type": {"$in": ["institution", "label", "association"]}},
            {"_id": 0, "id": 1, "full_name": 1, "image": 1}
        )
        if not ghost:
            ghost = await _db.ghost_profiles.find_one(
                {"active": True},
                {"_id": 0, "id": 1, "full_name": 1, "image": 1}
            )
        if not ghost:
            return

        message = secrets.choice(GHOST_THANK_YOU_MESSAGES)

        # Create notification
        await _db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "from_id": ghost["id"],
            "from_name": ghost["full_name"],
            "from_image": ghost.get("image", ""),
            "type": "ghost_thank_you",
            "message": message,
            "product_name": product_name,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Ghost bridge: {ghost['full_name']} thanked {user_id} for {product_name}")
    except Exception as e:
        logger.warning(f"Ghost bridge error: {e}")


# ═══════════════════════════════════════════════════════════
# NOTIFICATIONS
# ═══════════════════════════════════════════════════════════
@router.get("/notifications/{user_id}")
async def get_notifications(user_id: str, limit: int = 20):
    """Récupère les notifications d'un utilisateur."""
    notifs = await _db.notifications.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    unread = sum(1 for n in notifs if not n.get("read"))
    return {"notifications": notifs, "unread": unread}


@router.post("/notifications/{user_id}/read")
async def mark_notifications_read(user_id: str):
    """Marquer toutes les notifications comme lues."""
    await _db.notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True}}
    )
    return {"success": True}
