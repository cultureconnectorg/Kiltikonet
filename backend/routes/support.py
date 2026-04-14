"""
FAQ & Support Tickets — Routes backend
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import os
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter()

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "culture_connect_2026")
_client = AsyncIOMotorClient(MONGO_URL)
_db = _client[DB_NAME]

# ═══════════════════════════════════════
# FAQ
# ═══════════════════════════════════════

class FAQCreate(BaseModel):
    question_fr: str
    answer_fr: str
    question_en: str = ""
    answer_en: str = ""
    category: str = "general"
    order: int = 0
    published: bool = True

class FAQUpdate(BaseModel):
    question_fr: Optional[str] = None
    answer_fr: Optional[str] = None
    question_en: Optional[str] = None
    answer_en: Optional[str] = None
    category: Optional[str] = None
    order: Optional[int] = None
    published: Optional[bool] = None

@router.get("/api/faq")
async def list_faq(category: str = None):
    """Public — Liste les FAQ publiées."""
    query = {"published": True}
    if category:
        query["category"] = category
    faqs = await _db.faqs.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    categories = await _db.faqs.distinct("category", {"published": True})
    return {"faqs": faqs, "categories": categories}

@router.get("/api/admin/faq")
async def admin_list_faq():
    """Admin — Liste toutes les FAQ."""
    faqs = await _db.faqs.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return {"faqs": faqs}

@router.post("/api/admin/faq")
async def create_faq(body: FAQCreate):
    """Admin — Créer une FAQ."""
    doc = {
        "id": f"faq_{str(uuid.uuid4())[:8]}",
        "question_fr": body.question_fr,
        "answer_fr": body.answer_fr,
        "question_en": body.question_en or body.question_fr,
        "answer_en": body.answer_en or body.answer_fr,
        "category": body.category,
        "order": body.order,
        "published": body.published,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await _db.faqs.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@router.put("/api/admin/faq/{faq_id}")
async def update_faq(faq_id: str, body: FAQUpdate):
    """Admin — Modifier une FAQ."""
    update = {"updated_at": datetime.now(timezone.utc).isoformat()}
    for field in ["question_fr", "answer_fr", "question_en", "answer_en", "category", "order", "published"]:
        val = getattr(body, field, None)
        if val is not None:
            update[field] = val
    result = await _db.faqs.update_one({"id": faq_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "FAQ introuvable")
    return {"success": True}

@router.delete("/api/admin/faq/{faq_id}")
async def delete_faq(faq_id: str):
    """Admin — Supprimer une FAQ."""
    result = await _db.faqs.delete_one({"id": faq_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "FAQ introuvable")
    return {"success": True}

# ═══════════════════════════════════════
# SUPPORT TICKETS
# ═══════════════════════════════════════

class TicketCreate(BaseModel):
    name: str
    email: str
    subject: str
    message: str
    category: str = "general"  # general, complaint, technical, billing

class TicketReply(BaseModel):
    message: str
    author: str = "support"

@router.post("/api/support/tickets")
async def create_ticket(body: TicketCreate):
    """Public — Créer un ticket de support."""
    if not body.name.strip() or not body.email.strip() or not body.message.strip():
        raise HTTPException(400, "Nom, email et message requis")
    
    doc = {
        "id": f"TK-{str(uuid.uuid4())[:8].upper()}",
        "name": body.name.strip(),
        "email": body.email.strip().lower(),
        "subject": body.subject.strip() or "Sans objet",
        "message": body.message.strip(),
        "category": body.category,
        "status": "open",  # open, in_progress, resolved, closed
        "replies": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await _db.support_tickets.insert_one(doc)
    return {"success": True, "ticket_id": doc["id"], "message": "Votre demande a été enregistrée. Nous vous répondrons rapidement."}

@router.get("/api/support/tickets/mine")
async def my_tickets(email: str):
    """Public — Liste les tickets d'un utilisateur par email."""
    tickets = await _db.support_tickets.find(
        {"email": email.lower().strip()}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"tickets": tickets}

@router.get("/api/admin/support/tickets")
async def admin_list_tickets(status: str = None):
    """Admin — Liste tous les tickets."""
    query = {}
    if status:
        query["status"] = status
    tickets = await _db.support_tickets.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    stats = {
        "total": await _db.support_tickets.count_documents({}),
        "open": await _db.support_tickets.count_documents({"status": "open"}),
        "in_progress": await _db.support_tickets.count_documents({"status": "in_progress"}),
        "resolved": await _db.support_tickets.count_documents({"status": "resolved"}),
    }
    return {"tickets": tickets, "stats": stats}

@router.put("/api/admin/support/tickets/{ticket_id}/status")
async def update_ticket_status(ticket_id: str, status: str):
    """Admin — Changer le statut d'un ticket."""
    if status not in ("open", "in_progress", "resolved", "closed"):
        raise HTTPException(400, "Statut invalide")
    result = await _db.support_tickets.update_one(
        {"id": ticket_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Ticket introuvable")
    return {"success": True}

@router.post("/api/admin/support/tickets/{ticket_id}/reply")
async def reply_to_ticket(ticket_id: str, body: TicketReply):
    """Admin — Répondre à un ticket."""
    reply = {
        "id": str(uuid.uuid4())[:8],
        "message": body.message.strip(),
        "author": body.author,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await _db.support_tickets.update_one(
        {"id": ticket_id},
        {
            "$push": {"replies": reply},
            "$set": {"status": "in_progress", "updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Ticket introuvable")
    return {"success": True, "reply": reply}


# ═══════════════════════════════════════
# SEED DEFAULT FAQ
# ═══════════════════════════════════════

async def seed_default_faq():
    """Seed FAQ par défaut si la collection est vide."""
    count = await _db.faqs.count_documents({})
    if count > 0:
        return
    
    defaults = [
        {
            "id": "faq_001", "category": "general", "order": 1, "published": True,
            "question_fr": "Qu'est-ce que Culture Connect 2026 ?",
            "answer_fr": "Culture Connect 2026 est un événement culturel international qui se tiendra du 20 au 23 mai 2026 à Fort-de-France, Martinique. Il réunit professionnels, artistes et institutions de la culture caribéenne et afro-descendante.",
            "question_en": "What is Culture Connect 2026?",
            "answer_en": "Culture Connect 2026 is an international cultural event taking place from May 20-23, 2026 in Fort-de-France, Martinique. It brings together professionals, artists and institutions of Caribbean and Afro-descendant culture.",
        },
        {
            "id": "faq_002", "category": "general", "order": 2, "published": True,
            "question_fr": "Comment s'inscrire ?",
            "answer_fr": "Rendez-vous sur la page Tarifs pour choisir votre formule d'accréditation (Visiteur gratuit, Émergent, Professionnel ou Institutionnel). Le paiement se fait en ligne via Stripe.",
            "question_en": "How to register?",
            "answer_en": "Visit the Pricing page to choose your accreditation (Free Visitor, Emerging, Professional or Institutional). Payment is made online via Stripe.",
        },
        {
            "id": "faq_003", "category": "jetons", "order": 3, "published": True,
            "question_fr": "Que sont les Kilti-Tokens (KT) ?",
            "answer_fr": "Les Kilti-Tokens sont des jetons numériques utilisables au sein de l'écosystème Kiltikonet. Ils permettent de soutenir les artistes (Éclairs), acheter des produits culturels et accéder à des services exclusifs.",
            "question_en": "What are Kilti-Tokens (KT)?",
            "answer_en": "Kilti-Tokens are digital tokens usable within the Kiltikonet ecosystem. They allow you to support artists (Éclairs), buy cultural products and access exclusive services.",
        },
        {
            "id": "faq_004", "category": "jetons", "order": 4, "published": True,
            "question_fr": "Comment acheter des Kilti-Tokens ?",
            "answer_fr": "Depuis votre Espace Pro, accédez au Shop et choisissez un pack de jetons. Le paiement est sécurisé par Stripe. Les jetons sont crédités immédiatement sur votre wallet.",
            "question_en": "How to buy Kilti-Tokens?",
            "answer_en": "From your Pro Space, access the Shop and choose a token pack. Payment is secured by Stripe. Tokens are credited immediately to your wallet.",
        },
        {
            "id": "faq_005", "category": "technique", "order": 5, "published": True,
            "question_fr": "J'ai un problème avec mon paiement, que faire ?",
            "answer_fr": "Contactez-nous via le formulaire de support accessible depuis la page Contact ou votre Espace Pro. Indiquez votre email d'inscription et la référence du paiement si possible.",
            "question_en": "I have a payment issue, what should I do?",
            "answer_en": "Contact us via the support form accessible from the Contact page or your Pro Space. Include your registration email and payment reference if possible.",
        },
        {
            "id": "faq_006", "category": "evenement", "order": 6, "published": True,
            "question_fr": "Où se déroule l'événement ?",
            "answer_fr": "L'événement principal se tient au Parc de La Savane à Fort-de-France, Martinique, du 20 au 23 mai 2026. Certaines activités se déroulent dans d'autres lieux partenaires.",
            "question_en": "Where does the event take place?",
            "answer_en": "The main event takes place at Parc de La Savane in Fort-de-France, Martinique, from May 20-23, 2026. Some activities take place at other partner venues.",
        },
        {
            "id": "faq_007", "category": "technique", "order": 7, "published": True,
            "question_fr": "Comment accéder à l'Espace Pro ?",
            "answer_fr": "Cliquez sur 'Espace Pro' dans le menu de navigation. Entrez votre email et le code reçu par email. Si c'est votre première visite, un compte sera créé automatiquement.",
            "question_en": "How to access the Pro Space?",
            "answer_en": "Click 'Espace Pro' in the navigation menu. Enter your email and the code received by email. If it's your first visit, an account will be created automatically.",
        },
    ]
    
    now = datetime.now(timezone.utc).isoformat()
    for faq in defaults:
        faq["created_at"] = now
        faq["updated_at"] = now
    
    await _db.faqs.insert_many(defaults)
