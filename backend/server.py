from fastapi import FastAPI, APIRouter, File, UploadFile, Form, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
import io
import csv
import asyncio
import cloudinary
import cloudinary.uploader
import resend
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)

# Resend configuration
resend.api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

# Stripe configuration
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")
STRIPE_PUBLIC_KEY = os.environ.get("STRIPE_PUBLIC_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")
BASE_URL = os.environ.get("BASE_URL", "https://kiltikonet.fr")

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Create a v1 router for new API endpoints
api_v1_router = APIRouter(prefix="/api/v1")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ================== PRICING CONFIGURATION ==================
ACCREDITATION_TIERS = {
    "emerging": {"name": "Émergent", "price": 50.00, "currency": "eur"},
    "professional": {"name": "Professionnel", "price": 150.00, "currency": "eur"},
    "institutional": {"name": "Institutionnel", "price": 300.00, "currency": "eur"}
}

PARTNERSHIP_TIERS = {
    "bronze": {"name": "Partenaire Bronze", "price": 2500.00, "currency": "eur", "vip_count": 2},
    "silver": {"name": "Partenaire Silver", "price": 5000.00, "currency": "eur", "vip_count": 5},
    "gold": {"name": "Partenaire Gold", "price": 10000.00, "currency": "eur", "vip_count": 10}
}

# ================== EMAIL TEMPLATES ==================
def get_confirmation_email(name: str, tier: str, email: str) -> str:
    tier_data = ACCREDITATION_TIERS.get(tier, ACCREDITATION_TIERS["professional"])
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Georgia, serif; margin: 0; padding: 0; background-color: #F4F1EA; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #FFFFFF; }}
            .header {{ padding: 30px; text-align: center; border-bottom: 3px solid #A65D47; }}
            .content {{ padding: 40px 30px; color: #1A1A1A; line-height: 1.7; }}
            .badge {{ display: inline-block; background: #A65D47; color: #FFFFFF; padding: 8px 16px; font-size: 14px; }}
            .footer {{ padding: 20px 30px; background: #F4F1EA; text-align: center; font-size: 12px; color: #8A8578; }}
            h1 {{ color: #1A1A1A; font-size: 24px; margin: 0 0 20px 0; }}
            .highlight {{ color: #A65D47; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2 style="margin: 10px 0 0 0; color: #1A1A1A; font-size: 18px;">Culture Connect 2026</h2>
            </div>
            <div class="content">
                <h1>Paiement confirmé — Demande d'accréditation reçue</h1>
                <p>Bonjour <span class="highlight">{name}</span>,</p>
                <p>Nous avons bien reçu votre paiement et votre demande d'accréditation pour <strong>Culture Connect 2026</strong>.</p>
                <p>
                    <strong>Formule choisie :</strong><br>
                    <span class="badge">{tier_data['name']} — {int(tier_data['price'])}€</span>
                </p>
                <p>Notre équipe examine votre dossier et vous répondra sous <strong>72 heures</strong>.</p>
                <p>En attendant, n'hésitez pas à nous contacter pour toute question.</p>
                <p style="margin-top: 30px;">À très bientôt,<br><strong>L'équipe Culture Connect</strong></p>
            </div>
            <div class="footer">
                <p>Culture Connect 2026 · Fort-de-France, Martinique · 20-23 Mai 2026</p>
                <p>cultureconnectorg@gmail.com</p>
            </div>
        </div>
    </body>
    </html>
    """

def get_approval_email(name: str, tier: str, registration_id: str) -> str:
    tier_data = ACCREDITATION_TIERS.get(tier, ACCREDITATION_TIERS["professional"])
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Georgia, serif; margin: 0; padding: 0; background-color: #F4F1EA; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #FFFFFF; }}
            .header {{ padding: 30px; text-align: center; border-bottom: 3px solid #4A5D4E; }}
            .content {{ padding: 40px 30px; color: #1A1A1A; line-height: 1.7; }}
            .success-badge {{ display: inline-block; background: #4A5D4E; color: #FFFFFF; padding: 12px 24px; font-size: 16px; margin: 20px 0; }}
            .info-box {{ background: #F4F1EA; padding: 20px; margin: 20px 0; border-left: 4px solid #A65D47; }}
            .footer {{ padding: 20px 30px; background: #F4F1EA; text-align: center; font-size: 12px; color: #8A8578; }}
            h1 {{ color: #1A1A1A; font-size: 24px; margin: 0 0 20px 0; }}
            .highlight {{ color: #A65D47; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2 style="margin: 10px 0 0 0; color: #1A1A1A; font-size: 18px;">Culture Connect 2026</h2>
            </div>
            <div class="content">
                <h1>Accréditation confirmée ✓</h1>
                <p>Bonjour <span class="highlight">{name}</span>,</p>
                <p>Excellente nouvelle ! Votre demande d'accréditation a été <strong>approuvée</strong>.</p>
                <div style="text-align: center;">
                    <span class="success-badge">✓ ACCRÉDITÉ · {tier_data['name']}</span>
                </div>
                <div class="info-box">
                    <strong>Informations pratiques :</strong><br><br>
                    📅 <strong>Dates :</strong> 20-23 Mai 2026<br>
                    📍 <strong>Lieu :</strong> Fort-de-France, Martinique<br>
                    🎯 <strong>Marché Culturel :</strong> Vendredi 22 Mai — La Savane<br><br>
                    Présentez-vous avec cette confirmation et une pièce d'identité pour retirer votre badge.
                </div>
                <p>Nous avons hâte de vous accueillir !</p>
                <p style="margin-top: 30px;">Cordialement,<br><strong>L'équipe Culture Connect</strong></p>
            </div>
            <div class="footer">
                <p>Culture Connect 2026 · Fort-de-France, Martinique · 20-23 Mai 2026</p>
                <p>cultureconnectorg@gmail.com</p>
            </div>
        </div>
    </body>
    </html>
    """

def get_rejection_email(name: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Georgia, serif; margin: 0; padding: 0; background-color: #F4F1EA; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #FFFFFF; }}
            .header {{ padding: 30px; text-align: center; border-bottom: 3px solid #A65D47; }}
            .content {{ padding: 40px 30px; color: #1A1A1A; line-height: 1.7; }}
            .footer {{ padding: 20px 30px; background: #F4F1EA; text-align: center; font-size: 12px; color: #8A8578; }}
            h1 {{ color: #1A1A1A; font-size: 24px; margin: 0 0 20px 0; }}
            .contact-box {{ background: #F4F1EA; padding: 20px; margin: 20px 0; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2 style="margin: 10px 0 0 0; color: #1A1A1A; font-size: 18px;">Culture Connect 2026</h2>
            </div>
            <div class="content">
                <h1>Suite à votre demande</h1>
                <p>Bonjour {name},</p>
                <p>Nous vous remercions pour l'intérêt que vous portez à <strong>Culture Connect 2026</strong>.</p>
                <p>Après examen attentif de votre dossier, nous avons le regret de vous informer que nous ne sommes pas en mesure de donner une suite favorable à votre demande d'accréditation pour cette édition.</p>
                <p>Cette décision ne remet pas en cause la qualité de votre profil. Le nombre de places étant limité, nous avons dû faire des choix difficiles.</p>
                <div class="contact-box">
                    <p style="margin: 0;"><strong>Des questions ?</strong></p>
                    <p style="margin: 10px 0 0 0;">N'hésitez pas à nous écrire à <a href="mailto:cultureconnectorg@gmail.com" style="color: #A65D47;">cultureconnectorg@gmail.com</a></p>
                </div>
                <p>Nous vous souhaitons une excellente continuation dans vos projets.</p>
                <p style="margin-top: 30px;">Bien cordialement,<br><strong>L'équipe Culture Connect</strong></p>
            </div>
            <div class="footer">
                <p>Culture Connect 2026 · Fort-de-France, Martinique · 20-23 Mai 2026</p>
            </div>
        </div>
    </body>
    </html>
    """

def get_partner_welcome_email(company_name: str, tier: str, contact_name: str) -> str:
    tier_data = PARTNERSHIP_TIERS.get(tier, PARTNERSHIP_TIERS["bronze"])
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Georgia, serif; margin: 0; padding: 0; background-color: #F4F1EA; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #FFFFFF; }}
            .header {{ padding: 30px; text-align: center; border-bottom: 3px solid #4A5D4E; }}
            .content {{ padding: 40px 30px; color: #1A1A1A; line-height: 1.7; }}
            .partner-badge {{ display: inline-block; background: #4A5D4E; color: #FFFFFF; padding: 12px 24px; font-size: 16px; margin: 20px 0; }}
            .benefits-box {{ background: #F4F1EA; padding: 20px; margin: 20px 0; border-left: 4px solid #4A5D4E; }}
            .footer {{ padding: 20px 30px; background: #F4F1EA; text-align: center; font-size: 12px; color: #8A8578; }}
            h1 {{ color: #1A1A1A; font-size: 24px; margin: 0 0 20px 0; }}
            .highlight {{ color: #4A5D4E; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2 style="margin: 10px 0 0 0; color: #1A1A1A; font-size: 18px;">Culture Connect 2026</h2>
            </div>
            <div class="content">
                <h1>Bienvenue parmi nos partenaires !</h1>
                <p>Bonjour <span class="highlight">{contact_name}</span>,</p>
                <p>Nous sommes ravis d'accueillir <strong>{company_name}</strong> parmi les partenaires officiels de <strong>Culture Connect 2026</strong>.</p>
                <div style="text-align: center;">
                    <span class="partner-badge">✓ {tier_data['name'].upper()}</span>
                </div>
                <div class="benefits-box">
                    <strong>Vos avantages :</strong><br><br>
                    ✓ Logo affiché sur notre site officiel<br>
                    ✓ {tier_data['vip_count']} accréditations VIP offertes<br>
                    ✓ Visibilité sur tous nos supports de communication<br>
                    ✓ Accès à l'espace partenaires privilégié<br><br>
                    <strong>Événement :</strong> 20-23 Mai 2026 · Fort-de-France, Martinique
                </div>
                <p>Notre équipe vous contactera très prochainement pour finaliser les détails de votre partenariat.</p>
                <p style="margin-top: 30px;">Merci pour votre confiance,<br><strong>L'équipe Culture Connect</strong></p>
            </div>
            <div class="footer">
                <p>Culture Connect 2026 · Fort-de-France, Martinique · 20-23 Mai 2026</p>
                <p>cultureconnectorg@gmail.com</p>
            </div>
        </div>
    </body>
    </html>
    """

async def send_email_async(to_email: str, subject: str, html_content: str):
    """Send email asynchronously using Resend"""
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to_email}: {result.get('id', 'unknown')}")
        return result
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return None

async def upload_to_cloudinary(file: UploadFile, folder: str = "culture-connect/logos") -> Optional[str]:
    """Upload file to Cloudinary and return the secure URL"""
    try:
        content = await file.read()
        result = await asyncio.to_thread(
            cloudinary.uploader.upload,
            content,
            folder=folder,
            resource_type="image"
        )
        logger.info(f"Uploaded to Cloudinary: {result.get('secure_url')}")
        return result.get("secure_url")
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {str(e)}")
        return None

# ================== MODELS ==================
class RegistrationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    full_name: str
    organization_name: str
    country: str
    email: str
    phone: str
    profile_type: str
    stand_request: bool
    stand_category: Optional[str] = None
    bio: str
    logo_url: Optional[str] = None
    language_preference: str
    how_heard: str
    status: str = "pending"
    show_in_catalog: bool = False
    created_at: str
    tier: Optional[str] = None

class RegistrationListResponse(BaseModel):
    registrations: List[RegistrationResponse]
    total: int
    counts: dict

class AdminVerify(BaseModel):
    password: str

class StatusUpdate(BaseModel):
    status: str

class CatalogUpdate(BaseModel):
    show_in_catalog: bool

class ManualRegistration(BaseModel):
    full_name: str
    organization_name: str
    country: str
    email: str
    phone: str
    profile_type: str
    tier: str = "professional"
    status: str = "approved"
    show_in_catalog: bool = True
    bio: str = ""
    stand_request: bool = False
    stand_category: Optional[str] = None
    expertise_tags: Optional[List[str]] = None  # NEW: Support expertise tags

class CheckoutRequest(BaseModel):
    type: str  # "accreditation" or "partnership"
    tier: str  # "emerging", "professional", "institutional" OR "bronze", "silver", "gold"
    origin_url: str
    # For accreditation
    full_name: Optional[str] = None
    organization_name: Optional[str] = None
    country: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    profile_type: Optional[str] = None
    stand_request: Optional[bool] = False
    stand_category: Optional[str] = None
    bio: Optional[str] = ""
    language_preference: Optional[str] = "fr"
    how_heard: Optional[str] = None
    # Additional fields for complete data capture
    profile_image_url: Optional[str] = None  # Cloudinary URL uploaded before checkout
    siret_number: Optional[str] = None
    website_url: Optional[str] = None
    expertise_tags: Optional[str] = None  # NEW: Comma-separated expertise tags
    # For partnership
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None

class PartnerResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    company_name: str
    contact_name: str
    contact_email: str
    contact_phone: str
    tier: str
    website: Optional[str] = None
    logo_url: Optional[str] = None
    vip_accreditations: List[str] = []
    created_at: str

# ================== STRIPE ROUTES ==================
@api_router.post("/create-checkout-session")
async def create_checkout_session(request: Request, checkout_data: CheckoutRequest):
    """Create a Stripe checkout session for accreditation or partnership"""
    
    if checkout_data.type == "accreditation":
        if checkout_data.tier not in ACCREDITATION_TIERS:
            raise HTTPException(status_code=400, detail="Invalid accreditation tier")
        tier_data = ACCREDITATION_TIERS[checkout_data.tier]
        success_url = f"{BASE_URL}/confirmation?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{BASE_URL}/inscription"
        
    elif checkout_data.type == "partnership":
        if checkout_data.tier not in PARTNERSHIP_TIERS:
            raise HTTPException(status_code=400, detail="Invalid partnership tier")
        tier_data = PARTNERSHIP_TIERS[checkout_data.tier]
        success_url = f"{BASE_URL}/partenaire/confirmation?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{BASE_URL}/partenaires"
    else:
        raise HTTPException(status_code=400, detail="Invalid checkout type")
    
    # Initialize Stripe
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Prepare metadata
    metadata = {
        "type": checkout_data.type,
        "tier": checkout_data.tier,
    }
    
    if checkout_data.type == "accreditation":
        metadata.update({
            "full_name": checkout_data.full_name or "",
            "organization_name": checkout_data.organization_name or "",
            "country": checkout_data.country or "",
            "email": checkout_data.email or "",
            "phone": checkout_data.phone or "",
            "profile_type": checkout_data.profile_type or "",
            "stand_request": str(checkout_data.stand_request),
            "stand_category": checkout_data.stand_category or "",
            "bio": (checkout_data.bio or "")[:500],  # Stripe metadata limit
            "language_preference": checkout_data.language_preference or "fr",
            "how_heard": checkout_data.how_heard or "",
            # Additional data fields
            "profile_image_url": checkout_data.profile_image_url or "",
            "siret_number": checkout_data.siret_number or "",
            "website_url": checkout_data.website_url or "",
            "expertise_tags": checkout_data.expertise_tags or ""  # Comma-separated
        })
    else:
        metadata.update({
            "company_name": checkout_data.company_name or "",
            "contact_name": checkout_data.contact_name or "",
            "contact_email": checkout_data.contact_email or "",
            "contact_phone": checkout_data.contact_phone or "",
            "website": checkout_data.website or "",
            "logo_url": checkout_data.logo_url or ""
        })
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=tier_data["price"],
        currency=tier_data["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata
    )
    
    try:
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        transaction = {
            "id": str(uuid.uuid4()),
            "session_id": session.session_id,
            "type": checkout_data.type,
            "tier": checkout_data.tier,
            "amount": tier_data["price"],
            "currency": tier_data["currency"],
            "payment_status": "pending",
            "metadata": metadata,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction)
        
        return {
            "url": session.url,
            "session_id": session.session_id
        }
    except Exception as e:
        logger.error(f"Stripe checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment error: {str(e)}")

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(request: Request, session_id: str):
    """Get the status of a checkout session"""
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction in database
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": status.payment_status,
                "status": status.status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # If payment is successful, create the registration/partner record
        if status.payment_status == "paid":
            transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            if transaction and not transaction.get("processed"):
                await process_successful_payment(transaction, status.metadata)
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency,
            "metadata": status.metadata
        }
    except Exception as e:
        logger.error(f"Error getting checkout status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events with signature verification"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    # Verify signature is present
    if not signature:
        logger.error("Webhook received without Stripe-Signature header")
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")
    
    # Verify webhook secret is configured
    if not STRIPE_WEBHOOK_SECRET:
        logger.error("STRIPE_WEBHOOK_SECRET not configured")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    # Initialize Stripe checkout with webhook secret for signature verification
    stripe_checkout = StripeCheckout(
        api_key=STRIPE_API_KEY, 
        webhook_url=webhook_url,
        webhook_secret=STRIPE_WEBHOOK_SECRET
    )
    
    try:
        # handle_webhook will verify signature using webhook_secret
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        logger.info(f"Webhook event received: {webhook_response.event_type}")
        
        if webhook_response.event_type == "checkout.session.completed":
            session_id = webhook_response.session_id
            metadata = webhook_response.metadata
            
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": webhook_response.payment_status,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Process the payment
            transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            if transaction and not transaction.get("processed"):
                await process_successful_payment(transaction, metadata)
                logger.info(f"Successfully processed payment for session {session_id}")
        
        return {"status": "success", "event": webhook_response.event_type}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        # Return 400 for signature verification failures
        if "signature" in str(e).lower():
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
        return {"status": "error", "message": str(e)}

async def process_successful_payment(transaction: dict, metadata: dict):
    """Process a successful payment - create registration or partner"""
    session_id = transaction.get("session_id")
    payment_type = metadata.get("type") or transaction.get("type")
    tier = metadata.get("tier") or transaction.get("tier")
    
    # Mark as processed to prevent duplicate processing
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"processed": True}}
    )
    
    if payment_type == "accreditation":
        # Create registration
        registration_id = str(uuid.uuid4())
        registration = {
            "id": registration_id,
            "full_name": metadata.get("full_name", ""),
            "organization_name": metadata.get("organization_name", ""),
            "country": metadata.get("country", ""),
            "email": metadata.get("email", ""),
            "phone": metadata.get("phone", ""),
            "profile_type": metadata.get("profile_type", ""),
            "stand_request": metadata.get("stand_request", "false").lower() == "true",
            "stand_category": metadata.get("stand_category") or None,
            "bio": metadata.get("bio", ""),
            # Use profile_image_url from Cloudinary (uploaded before checkout)
            "logo_url": metadata.get("profile_image_url") or None,
            "language_preference": metadata.get("language_preference", "fr"),
            "how_heard": metadata.get("how_heard", ""),
            # Additional fields
            "siret_number": metadata.get("siret_number") or None,
            "website_url": metadata.get("website_url") or None,
            # Expertise tags stored as array
            "expertise_tags": [t.strip() for t in (metadata.get("expertise_tags") or "").split(",") if t.strip()],
            "tier": tier,
            "status": "pending",
            "show_in_catalog": False,
            "payment_session_id": session_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.registrations.insert_one(registration)
        
        # Send confirmation email
        email = metadata.get("email")
        if email:
            asyncio.create_task(send_email_async(
                email,
                "Votre demande d'accréditation Culture Connect 2026 a été reçue",
                get_confirmation_email(metadata.get("full_name", ""), tier, email)
            ))
        
        logger.info(f"Created registration {registration_id} from payment {session_id}")
        
    elif payment_type == "partnership":
        # Create partner
        partner_id = str(uuid.uuid4())
        tier_data = PARTNERSHIP_TIERS.get(tier, PARTNERSHIP_TIERS["bronze"])
        
        partner = {
            "id": partner_id,
            "company_name": metadata.get("company_name", ""),
            "contact_name": metadata.get("contact_name", ""),
            "contact_email": metadata.get("contact_email", ""),
            "contact_phone": metadata.get("contact_phone", ""),
            "tier": tier,
            "website": metadata.get("website") or None,
            "logo_url": metadata.get("logo_url") or None,
            "vip_accreditations": [],
            "payment_session_id": session_id,
            "show_on_landing": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.partners.insert_one(partner)
        
        # Create VIP accreditations for the partner
        vip_ids = []
        for i in range(tier_data["vip_count"]):
            vip_id = str(uuid.uuid4())
            vip_registration = {
                "id": vip_id,
                "full_name": f"VIP {i+1} - {metadata.get('company_name', '')}",
                "organization_name": metadata.get("company_name", ""),
                "country": "",
                "email": metadata.get("contact_email", ""),
                "phone": "",
                "profile_type": "institution",
                "stand_request": False,
                "stand_category": None,
                "bio": f"Accréditation VIP offerte - {tier_data['name']}",
                "logo_url": None,
                "language_preference": "fr",
                "how_heard": "partner_benefit",
                "tier": "institutional",
                "status": "approved",
                "show_in_catalog": False,
                "partner_id": partner_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.registrations.insert_one(vip_registration)
            vip_ids.append(vip_id)
        
        # Update partner with VIP IDs
        await db.partners.update_one(
            {"id": partner_id},
            {"$set": {"vip_accreditations": vip_ids}}
        )
        
        # Send welcome email
        email = metadata.get("contact_email")
        if email:
            asyncio.create_task(send_email_async(
                email,
                f"Bienvenue parmi nos partenaires — Culture Connect 2026",
                get_partner_welcome_email(
                    metadata.get("company_name", ""),
                    tier,
                    metadata.get("contact_name", "")
                )
            ))
        
        logger.info(f"Created partner {partner_id} with {len(vip_ids)} VIP accreditations from payment {session_id}")

@api_router.get("/stripe-public-key")
async def get_stripe_public_key():
    """Return the Stripe public key for frontend"""
    return {"publicKey": STRIPE_PUBLIC_KEY}

@api_router.get("/partners")
async def get_partners():
    """Get all partners for display on landing page"""
    partners = await db.partners.find(
        {"show_on_landing": True},
        {"_id": 0}
    ).to_list(100)
    return {"partners": partners, "total": len(partners)}

# ================== EXISTING ROUTES ==================
@api_router.get("/")
async def root():
    return {"message": "Culture Connect 2026 API"}

@api_router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """Upload image to Cloudinary before Stripe checkout - returns URL to store in metadata"""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Use JPEG, PNG, WebP or GIF")
    
    # Upload to Cloudinary
    image_url = await upload_to_cloudinary(file, "culture-connect/profiles")
    
    if not image_url:
        raise HTTPException(status_code=500, detail="Upload failed")
    
    return {"url": image_url, "success": True}

@api_router.post("/registrations", response_model=RegistrationResponse)
async def create_registration(
    full_name: str = Form(...),
    organization_name: str = Form(...),
    country: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    profile_type: str = Form(...),
    stand_request: bool = Form(...),
    stand_category: Optional[str] = Form(None),
    bio: str = Form(...),
    language_preference: str = Form(...),
    how_heard: str = Form(...),
    tier: str = Form("professional"),
    logo: Optional[UploadFile] = File(None)
):
    registration_id = str(uuid.uuid4())
    logo_url = None
    
    if logo and logo.filename:
        logo_url = await upload_to_cloudinary(logo, f"culture-connect/logos/{registration_id}")
    
    registration = {
        "id": registration_id,
        "full_name": full_name,
        "organization_name": organization_name,
        "country": country,
        "email": email,
        "phone": phone,
        "profile_type": profile_type,
        "stand_request": stand_request,
        "stand_category": stand_category if stand_request else None,
        "bio": bio,
        "logo_url": logo_url,
        "language_preference": language_preference,
        "how_heard": how_heard,
        "tier": tier,
        "status": "pending",
        "show_in_catalog": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.registrations.insert_one(registration)
    
    asyncio.create_task(send_email_async(
        email,
        "Votre demande d'accréditation Culture Connect 2026 a été reçue",
        get_confirmation_email(full_name, tier, email)
    ))
    
    return RegistrationResponse(**registration)

@api_router.get("/registrations", response_model=RegistrationListResponse)
async def get_registrations(
    profile_type: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    stand_request: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    filter_query = {}
    if profile_type:
        filter_query["profile_type"] = profile_type
    if country:
        filter_query["country"] = country
    if stand_request is not None and stand_request != "":
        filter_query["stand_request"] = stand_request.lower() == "true"
    if status:
        filter_query["status"] = status
    
    registrations = await db.registrations.find(filter_query, {"_id": 0}).to_list(1000)
    
    all_registrations = await db.registrations.find({}, {"_id": 0, "profile_type": 1, "status": 1}).to_list(1000)
    counts = {
        "total": len(all_registrations),
        "by_profile": {},
        "by_status": {"pending": 0, "approved": 0, "rejected": 0}
    }
    
    for reg in all_registrations:
        profile = reg.get("profile_type", "other")
        counts["by_profile"][profile] = counts["by_profile"].get(profile, 0) + 1
        status_val = reg.get("status", "pending")
        if status_val in counts["by_status"]:
            counts["by_status"][status_val] += 1
    
    return RegistrationListResponse(
        registrations=registrations,
        total=len(registrations),
        counts=counts
    )

@api_router.patch("/registrations/{registration_id}/status")
async def update_registration_status(registration_id: str, status_update: StatusUpdate):
    if status_update.status not in ["pending", "approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    registration = await db.registrations.find_one({"id": registration_id}, {"_id": 0})
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    previous_status = registration.get("status")
    
    # When approving, automatically add to catalog
    update_data = {"status": status_update.status}
    if status_update.status == "approved":
        update_data["show_in_catalog"] = True
    elif status_update.status == "rejected":
        update_data["show_in_catalog"] = False
    
    result = await db.registrations.update_one(
        {"id": registration_id},
        {"$set": update_data}
    )
    
    if previous_status != status_update.status:
        email = registration.get("email")
        name = registration.get("full_name")
        tier = registration.get("tier", "professional")
        
        if status_update.status == "approved" and email:
            asyncio.create_task(send_email_async(
                email,
                "Votre accréditation Culture Connect 2026 est confirmée ✓",
                get_approval_email(name, tier, registration_id)
            ))
        elif status_update.status == "rejected" and email:
            asyncio.create_task(send_email_async(
                email,
                "Suite à votre demande — Culture Connect 2026",
                get_rejection_email(name)
            ))
    
    return {"success": True, "status": status_update.status, "show_in_catalog": update_data.get("show_in_catalog")}

@api_router.patch("/registrations/{registration_id}/catalog")
async def update_catalog_visibility(registration_id: str, catalog_update: CatalogUpdate):
    result = await db.registrations.update_one(
        {"id": registration_id},
        {"$set": {"show_in_catalog": catalog_update.show_in_catalog}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    return {"success": True, "show_in_catalog": catalog_update.show_in_catalog}

@api_router.delete("/registrations/{registration_id}")
async def delete_registration(registration_id: str):
    result = await db.registrations.delete_one({"id": registration_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    return {"success": True, "message": "Registration deleted"}

@api_router.post("/registrations/manual", response_model=RegistrationResponse)
async def create_manual_registration(data: ManualRegistration):
    registration_id = str(uuid.uuid4())
    
    registration = {
        "id": registration_id,
        "full_name": data.full_name,
        "organization_name": data.organization_name,
        "country": data.country,
        "email": data.email,
        "phone": data.phone,
        "profile_type": data.profile_type,
        "stand_request": data.stand_request,
        "stand_category": data.stand_category,
        "bio": data.bio,
        "logo_url": None,
        "language_preference": "fr",
        "how_heard": "admin",
        "tier": data.tier,
        "status": data.status,
        "show_in_catalog": data.show_in_catalog,
        "expertise_tags": data.expertise_tags or [],  # NEW: Include expertise tags
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.registrations.insert_one(registration)
    
    return RegistrationResponse(**registration)

@api_router.get("/catalog")
async def get_catalog_entries():
    """Get only participants that are APPROVED and VISIBLE in catalog"""
    registrations = await db.registrations.find(
        {
            "show_in_catalog": True,
            "status": "approved"
        },
        {"_id": 0}
    ).to_list(1000)
    
    return {"participants": registrations, "total": len(registrations)}

@api_router.get("/registrations/export")
async def export_registrations():
    registrations = await db.registrations.find({}, {"_id": 0}).to_list(1000)
    
    if not registrations:
        registrations = []
    
    output = io.StringIO()
    fieldnames = [
        "id", "full_name", "organization_name", "country", "email", "phone",
        "profile_type", "stand_request", "stand_category", "bio", "logo_url",
        "language_preference", "how_heard", "tier", "status", "created_at"
    ]
    
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    for reg in registrations:
        writer.writerow(reg)
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=registrations.csv"}
    )

@api_router.post("/admin/verify")
async def verify_admin(admin: AdminVerify):
    if admin.password == "CC2026admin":
        return {"success": True}
    raise HTTPException(status_code=401, detail="Invalid password")

@api_router.get("/countries")
async def get_countries():
    countries = await db.registrations.distinct("country")
    return {"countries": countries if countries else []}

# ================== API V1 - STATISTICS & INTELLIGENCE ==================

@api_v1_router.get("/stats")
async def get_public_statistics():
    """
    Public Statistics API - Aggregated data for management & BI
    No personal data exposed - only show_in_catalog:true entries for public metrics
    
    Response Structure (for external BI tools like Tableau, PowerBI):
    {
        "generated_at": "ISO timestamp",
        "summary": { total, approved, pending, rejected, in_catalog },
        "by_profile_type": { "artist": count, "label": count, ... },
        "by_country": { "FR": count, "MQ": count, ... },
        "by_tier": { "emerging": count, "professional": count, "institutional": count },
        "conversion_rates": { registration_to_approval, approval_to_catalog },
        "partners": { total, by_tier }
    }
    """
    # Aggregate all registrations
    all_registrations = await db.registrations.find({}, {"_id": 0}).to_list(10000)
    
    # Summary counts
    total = len(all_registrations)
    approved = sum(1 for r in all_registrations if r.get("status") == "approved")
    pending = sum(1 for r in all_registrations if r.get("status") == "pending")
    rejected = sum(1 for r in all_registrations if r.get("status") == "rejected")
    in_catalog = sum(1 for r in all_registrations if r.get("show_in_catalog") and r.get("status") == "approved")
    
    # Distribution by profile_type
    by_profile = {}
    for r in all_registrations:
        profile = r.get("profile_type", "other")
        by_profile[profile] = by_profile.get(profile, 0) + 1
    
    # Distribution by country
    by_country = {}
    for r in all_registrations:
        country = r.get("country", "unknown")
        if country:
            by_country[country] = by_country.get(country, 0) + 1
    
    # Distribution by tier
    by_tier = {"emerging": 0, "professional": 0, "institutional": 0}
    for r in all_registrations:
        tier = r.get("tier", "professional")
        if tier in by_tier:
            by_tier[tier] += 1
    
    # Distribution by expertise tags
    by_expertise = {}
    for r in all_registrations:
        tags = r.get("expertise_tags", [])
        if isinstance(tags, list):
            for tag in tags:
                if tag:
                    by_expertise[tag] = by_expertise.get(tag, 0) + 1
    
    # Sort expertise by count and get top 10
    sorted_expertise = dict(sorted(by_expertise.items(), key=lambda x: x[1], reverse=True)[:10])
    
    # Conversion rates
    registration_to_approval = round((approved / total * 100), 1) if total > 0 else 0
    approval_to_catalog = round((in_catalog / approved * 100), 1) if approved > 0 else 0
    
    # Partners stats
    all_partners = await db.partners.find({}, {"_id": 0}).to_list(100)
    partners_by_tier = {"bronze": 0, "silver": 0, "gold": 0}
    for p in all_partners:
        tier = p.get("tier", "bronze")
        if tier in partners_by_tier:
            partners_by_tier[tier] += 1
    
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_registrations": total,
            "approved": approved,
            "pending": pending,
            "rejected": rejected,
            "visible_in_catalog": in_catalog
        },
        "by_profile_type": by_profile,
        "by_country": by_country,
        "by_tier": by_tier,
        "by_expertise": sorted_expertise,
        "top_5_interests": list(sorted_expertise.keys())[:5],
        "conversion_rates": {
            "registration_to_approval_percent": registration_to_approval,
            "approval_to_catalog_percent": approval_to_catalog
        },
        "partners": {
            "total": len(all_partners),
            "by_tier": partners_by_tier
        },
        "meta": {
            "api_version": "1.0",
            "data_policy": "Aggregated only - no personal data exposed",
            "compatible_with": ["Tableau", "PowerBI", "Google Data Studio", "Custom BI"]
        }
    }

@api_v1_router.get("/stats/territories")
async def get_territory_insights():
    """
    Detailed territorial analysis for geographic business intelligence
    Only includes approved + catalog-visible participants
    """
    catalog_participants = await db.registrations.find(
        {"show_in_catalog": True, "status": "approved"},
        {"_id": 0, "country": 1, "profile_type": 1, "tier": 1, "organization_name": 1}
    ).to_list(10000)
    
    # Build territory matrix
    territories = {}
    for p in catalog_participants:
        country = p.get("country", "unknown")
        if country not in territories:
            territories[country] = {
                "total": 0,
                "by_profile": {},
                "by_tier": {},
                "organizations": []
            }
        territories[country]["total"] += 1
        
        profile = p.get("profile_type", "other")
        territories[country]["by_profile"][profile] = territories[country]["by_profile"].get(profile, 0) + 1
        
        tier = p.get("tier", "professional")
        territories[country]["by_tier"][tier] = territories[country]["by_tier"].get(tier, 0) + 1
        
        # Only add org name (public info for catalog-visible)
        if p.get("organization_name"):
            territories[country]["organizations"].append(p.get("organization_name"))
    
    # Sort by representation
    sorted_territories = dict(sorted(territories.items(), key=lambda x: x[1]["total"], reverse=True))
    
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_territories": len(sorted_territories),
        "territories": sorted_territories,
        "top_5": list(sorted_territories.keys())[:5]
    }

@api_v1_router.get("/search/match")
async def smart_connect_matching(
    profile_type: Optional[str] = Query(None, description="Filter by profile type"),
    sector: Optional[str] = Query(None, description="Search keyword in bio/organization"),
    country: Optional[str] = Query(None, description="Filter by country"),
    expertise: Optional[str] = Query(None, description="Filter by expertise tags (comma-separated)"),
    limit: int = Query(10, le=50, description="Max results")
):
    """
    Smart Connect API - Find matching profiles based on sector similarity and expertise tags
    SECURITY: Only returns show_in_catalog:true AND status:approved
    
    Use cases:
    - "Find all labels in Martinique"
    - "Find organizations with 'music' in their bio"
    - "Find potential partners by sector"
    - "Find profiles with specific expertise tags"
    """
    # Base filter: only public catalog entries
    filter_query = {"show_in_catalog": True, "status": "approved"}
    
    if profile_type:
        filter_query["profile_type"] = profile_type
    
    if country:
        filter_query["country"] = {"$regex": country, "$options": "i"}
    
    # Filter by expertise tags
    expertise_list = []
    if expertise:
        expertise_list = [e.strip() for e in expertise.split(",") if e.strip()]
        if expertise_list:
            filter_query["expertise_tags"] = {"$in": expertise_list}
    
    # Fetch candidates
    candidates = await db.registrations.find(
        filter_query,
        {"_id": 0, "email": 0, "phone": 0, "payment_session_id": 0}  # Exclude private fields
    ).to_list(1000)
    
    # Apply sector search on bio and organization_name
    if sector:
        sector_lower = sector.lower()
        candidates = [
            c for c in candidates
            if sector_lower in (c.get("bio", "") or "").lower()
            or sector_lower in (c.get("organization_name", "") or "").lower()
        ]
    
    # Score and sort by relevance (with expertise matching bonus)
    def relevance_score(participant):
        score = 0
        if participant.get("logo_url"):
            score += 10  # Has image = more complete profile
        if participant.get("bio") and len(participant.get("bio", "")) > 50:
            score += 5  # Good bio
        if participant.get("website_url"):
            score += 3  # Has website
        
        # Expertise tag matching bonus
        participant_tags = participant.get("expertise_tags", [])
        if expertise_list and participant_tags:
            shared_tags = len(set(participant_tags) & set(expertise_list))
            score += shared_tags * 15  # Significant bonus per shared tag
        
        return score
    
    candidates.sort(key=relevance_score, reverse=True)
    
    # Format response
    results = []
    for c in candidates[:limit]:
        participant_tags = c.get("expertise_tags", [])
        shared_count = len(set(participant_tags) & set(expertise_list)) if expertise_list else 0
        
        results.append({
            "id": c.get("id"),
            "name": c.get("full_name"),
            "organization": c.get("organization_name"),
            "profile_type": c.get("profile_type"),
            "country": c.get("country"),
            "bio": c.get("bio"),
            "tier": c.get("tier"),
            "image_url": c.get("logo_url"),
            "website": c.get("website_url"),
            "has_stand": c.get("stand_request", False),
            "expertise_tags": participant_tags,
            "shared_interests": shared_count
        })
    
    return {
        "query": {
            "profile_type": profile_type,
            "sector": sector,
            "country": country,
            "expertise": expertise_list
        },
        "total_matches": len(results),
        "results": results,
        "suggestions": _generate_sector_suggestions(candidates) if not sector else []
    }

def _generate_sector_suggestions(participants: list) -> list:
    """Generate keyword suggestions based on common terms in bios"""
    word_freq = {}
    stop_words = {"de", "la", "le", "les", "et", "en", "un", "une", "des", "du", "pour", "avec", "the", "and", "for", "with", "a", "an"}
    
    for p in participants:
        bio = (p.get("bio") or "").lower()
        words = bio.split()
        for word in words:
            word = ''.join(c for c in word if c.isalnum())
            if len(word) > 3 and word not in stop_words:
                word_freq[word] = word_freq.get(word, 0) + 1
    
    # Top keywords
    sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    return [w[0] for w in sorted_words[:8]]

@api_v1_router.get("/search/suggestions")
async def get_partner_suggestions(participant_id: str):
    """
    Get smart partner suggestions for a specific participant
    Based on complementary profile types and shared expertise tags
    """
    # Get the participant
    participant = await db.registrations.find_one(
        {"id": participant_id, "show_in_catalog": True, "status": "approved"},
        {"_id": 0}
    )
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found in catalog")
    
    # Define complementary profiles
    complementary_map = {
        "artist": ["label", "booking_agency", "press", "institution"],
        "label": ["artist", "booking_agency", "press", "distribution"],
        "booking_agency": ["artist", "label", "venue", "institution"],
        "institution": ["artist", "label", "press", "booking_agency"],
        "press": ["artist", "label", "institution"],
        "venue": ["artist", "booking_agency", "label"],
        "distribution": ["label", "artist"],
        "other": ["artist", "label", "institution"]
    }
    
    current_profile = participant.get("profile_type", "other")
    participant_tags = participant.get("expertise_tags", [])
    target_profiles = complementary_map.get(current_profile, ["artist", "label"])
    
    # Find complementary participants
    suggestions = await db.registrations.find(
        {
            "show_in_catalog": True,
            "status": "approved",
            "id": {"$ne": participant_id},
            "profile_type": {"$in": target_profiles}
        },
        {"_id": 0, "email": 0, "phone": 0, "payment_session_id": 0}
    ).to_list(50)
    
    # Score by expertise tag overlap, country proximity and completeness
    def suggestion_score(s):
        score = 0
        
        # Expertise tags matching - highest priority
        s_tags = s.get("expertise_tags", [])
        if participant_tags and s_tags:
            shared_tags = len(set(participant_tags) & set(s_tags))
            score += shared_tags * 20  # Major bonus per shared interest
        
        # Country proximity
        if s.get("country") == participant.get("country"):
            score += 10  # Same country = higher relevance
        
        # Profile completeness
        if s.get("logo_url"):
            score += 5
        if s.get("stand_request"):
            score += 3  # Has stand = visible at event
        
        return score
    
    suggestions.sort(key=suggestion_score, reverse=True)
    
    # Build response with shared interests info
    suggested_connections = []
    for s in suggestions[:10]:
        s_tags = s.get("expertise_tags", [])
        shared_tags = list(set(participant_tags) & set(s_tags)) if participant_tags and s_tags else []
        shared_count = len(shared_tags)
        
        reason = f"Profil complémentaire ({s.get('profile_type')})"
        if shared_count > 0:
            reason = f"Partage {shared_count} intérêt(s) commun(s)"
        
        suggested_connections.append({
            "id": s.get("id"),
            "name": s.get("full_name"),
            "organization": s.get("organization_name"),
            "profile_type": s.get("profile_type"),
            "country": s.get("country"),
            "expertise_tags": s_tags,
            "shared_interests": shared_tags,
            "shared_count": shared_count,
            "reason": reason
        })
    
    return {
        "for_participant": {
            "id": participant_id,
            "name": participant.get("full_name"),
            "profile_type": current_profile,
            "expertise_tags": participant_tags
        },
        "suggested_connections": suggested_connections
    }

# Include the routers in the main app
app.include_router(api_router)
app.include_router(api_v1_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
