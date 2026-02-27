from fastapi import FastAPI, APIRouter, File, UploadFile, Form, HTTPException, Query, Request, BackgroundTasks
from fastapi.responses import StreamingResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import io
import csv
import asyncio
import cloudinary
import cloudinary.uploader
import resend
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
import qrcode
from reportlab.lib.pagesizes import A6
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import requests

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

async def send_email_with_attachment(to_email: str, subject: str, html_content: str, pdf_content: bytes, filename: str):
    """Send email with PDF attachment using Resend"""
    try:
        import base64
        pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content,
            "attachments": [
                {
                    "filename": filename,
                    "content": pdf_base64
                }
            ]
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email with attachment sent to {to_email}: {result.get('id', 'unknown')}")
        return result
    except Exception as e:
        logger.error(f"Failed to send email with attachment to {to_email}: {str(e)}")
        return None

async def notify_partner_of_approval(partner_id: str, registration: dict):
    """Notify partner when their sponsored participant is approved"""
    try:
        partner = await db.partners.find_one({"id": partner_id}, {"_id": 0})
        if not partner or not partner.get("contact_email"):
            return
        
        participant_name = registration.get("full_name", "Un participant")
        org_name = registration.get("organization_name", "")
        partner_name = partner.get("company_name", "Partenaire")
        contact_name = partner.get("contact_name", "")
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Georgia, serif; margin: 0; padding: 0; background-color: #F4F1EA; }}
                .container {{ max-width: 600px; margin: 0 auto; background: #FFFFFF; }}
                .header {{ padding: 30px; text-align: center; border-bottom: 3px solid #4A5D4E; }}
                .content {{ padding: 40px 30px; color: #1A1A1A; line-height: 1.7; }}
                .highlight-box {{ background: #4A5D4E; color: #FFFFFF; padding: 20px; margin: 20px 0; text-align: center; }}
                .footer {{ padding: 20px 30px; background: #F4F1EA; text-align: center; font-size: 12px; color: #8A8578; }}
                h1 {{ color: #1A1A1A; font-size: 24px; margin: 0 0 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="margin: 10px 0 0 0; color: #1A1A1A; font-size: 18px;">Culture Connect 2026</h2>
                </div>
                <div class="content">
                    <h1>Bonne nouvelle pour {partner_name} !</h1>
                    <p>Bonjour {contact_name},</p>
                    <p>Nous avons le plaisir de vous informer qu'un participant que vous parrainez vient d'être accrédité pour <strong>Culture Connect 2026</strong>.</p>
                    <div class="highlight-box">
                        <p style="margin: 0; font-size: 18px;"><strong>{participant_name}</strong></p>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">{org_name}</p>
                        <p style="margin: 15px 0 0 0; font-size: 14px;">✓ ACCRÉDITATION VALIDÉE</p>
                    </div>
                    <p>Ce participant pourra désormais accéder à l'ensemble des activités de l'événement.</p>
                    <p style="margin-top: 30px;">Cordialement,<br><strong>L'équipe Culture Connect</strong></p>
                </div>
                <div class="footer">
                    <p>Culture Connect 2026 · Fort-de-France, Martinique · 20-23 Mai 2026</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        await send_email_async(
            partner.get("contact_email"),
            f"✓ Accréditation validée : {participant_name} — Culture Connect 2026",
            html
        )
        logger.info(f"Partner notification sent to {partner.get('contact_email')} for {participant_name}")
    except Exception as e:
        logger.error(f"Failed to notify partner {partner_id}: {str(e)}")

def get_badge_email_html(participant_name: str, tier: str, registration_id: str) -> str:
    """Email template for badge delivery"""
    tier_names = {"emerging": "Émergent", "professional": "Professionnel", "institutional": "Institutionnel"}
    tier_name = tier_names.get(tier, "Professionnel")
    
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
            .badge-box {{ background: #A65D47; color: #FFFFFF; padding: 25px; margin: 20px 0; text-align: center; }}
            .info-box {{ background: #F4F1EA; padding: 20px; margin: 20px 0; border-left: 4px solid #4A5D4E; }}
            .footer {{ padding: 20px 30px; background: #F4F1EA; text-align: center; font-size: 12px; color: #8A8578; }}
            h1 {{ color: #1A1A1A; font-size: 24px; margin: 0 0 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2 style="margin: 10px 0 0 0; color: #1A1A1A; font-size: 18px;">Culture Connect 2026</h2>
            </div>
            <div class="content">
                <h1>Votre badge est prêt !</h1>
                <p>Bonjour <strong>{participant_name}</strong>,</p>
                <p>Votre badge officiel pour <strong>Culture Connect 2026</strong> est joint à ce message en pièce attachée (PDF).</p>
                <div class="badge-box">
                    <p style="margin: 0; font-size: 14px; opacity: 0.9;">VOTRE STATUT</p>
                    <p style="margin: 10px 0 0 0; font-size: 22px; font-weight: bold;">{tier_name.upper()}</p>
                </div>
                <div class="info-box">
                    <strong>Instructions :</strong><br><br>
                    ✓ Imprimez votre badge au format A6 (10.5 x 14.8 cm)<br>
                    ✓ Présentez-le à l'entrée de l'événement<br>
                    ✓ Le QR code permet de valider votre accréditation<br><br>
                    <strong>Événement :</strong> 20-23 Mai 2026 · Fort-de-France, Martinique
                </div>
                <p>À très bientôt !</p>
                <p style="margin-top: 30px;"><strong>L'équipe Culture Connect</strong></p>
            </div>
            <div class="footer">
                <p>Culture Connect 2026 · Fort-de-France, Martinique · 20-23 Mai 2026</p>
                <p>cultureconnectorg@gmail.com</p>
            </div>
        </div>
    </body>
    </html>
    """

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
    expertise_tags: Optional[List[str]] = None  # NEW: Expertise tags

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
    
    # Use origin_url from frontend for redirects (supports preview/production/custom domains)
    origin_url = checkout_data.origin_url.rstrip('/') if checkout_data.origin_url else BASE_URL
    
    if checkout_data.type == "accreditation":
        if checkout_data.tier not in ACCREDITATION_TIERS:
            raise HTTPException(status_code=400, detail="Invalid accreditation tier")
        tier_data = ACCREDITATION_TIERS[checkout_data.tier]
        success_url = f"{origin_url}/confirmation?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/inscription"
        
    elif checkout_data.type == "partnership":
        if checkout_data.tier not in PARTNERSHIP_TIERS:
            raise HTTPException(status_code=400, detail="Invalid partnership tier")
        tier_data = PARTNERSHIP_TIERS[checkout_data.tier]
        success_url = f"{origin_url}/partenaire/confirmation?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/partenaires"
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
            
            # NEW: Notify partner if this participant is sponsored
            sponsored_by = registration.get("sponsored_by")
            if sponsored_by:
                asyncio.create_task(notify_partner_of_approval(sponsored_by, registration))
                
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
        {
            "_id": 0,
            "email": 0,
            "phone": 0,
            "payment_session_id": 0,
            "siret_number": 0
        }
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

# ================== BATCH OPERATIONS ==================

class BatchApproveRequest(BaseModel):
    registration_ids: List[str]

class BatchSendBadgesRequest(BaseModel):
    registration_ids: List[str]  # If empty, send to ALL approved

# ================== BATCH JOB PERSISTENCE (MongoDB) ==================

async def create_batch_job(job_id: str, total: int, job_type: str = "send_badges") -> dict:
    """Create a new batch job in MongoDB"""
    job = {
        "id": job_id,
        "type": job_type,
        "total": total,
        "processed": 0,
        "sent": 0,
        "failed": 0,
        "status": "running",
        "results": {"sent": [], "failed": []},
        "started_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    }
    await db.batch_jobs.insert_one(job)
    return job

async def update_batch_job_progress(job_id: str, processed: int, sent: int, failed: int, 
                                     sent_result: dict = None, failed_result: dict = None):
    """Update batch job progress in MongoDB"""
    update_data = {
        "processed": processed,
        "sent": sent,
        "failed": failed
    }
    
    push_data = {}
    if sent_result:
        push_data["results.sent"] = sent_result
    if failed_result:
        push_data["results.failed"] = failed_result
    
    update_query = {"$set": update_data}
    if push_data:
        update_query["$push"] = push_data
    
    await db.batch_jobs.update_one({"id": job_id}, update_query)

async def complete_batch_job(job_id: str):
    """Mark batch job as completed"""
    await db.batch_jobs.update_one(
        {"id": job_id},
        {"$set": {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )

async def get_batch_job(job_id: str) -> Optional[dict]:
    """Get batch job from MongoDB"""
    return await db.batch_jobs.find_one({"id": job_id}, {"_id": 0})

async def log_email_send(recipient_email: str, recipient_name: str, email_type: str, status: str, participant_id: str = None, error: str = None):
    """Log email send to database for history tracking"""
    log_entry = {
        "id": str(uuid.uuid4()),
        "recipient_email": recipient_email,
        "recipient_name": recipient_name,
        "email_type": email_type,  # "badge", "approval", "rejection", "partner_notification"
        "status": status,  # "sent", "failed"
        "participant_id": participant_id,
        "error": error,
        "sent_at": datetime.now(timezone.utc).isoformat()
    }
    await db.email_logs.insert_one(log_entry)
    return log_entry

@api_router.post("/registrations/batch/approve")
async def batch_approve_registrations(request: BatchApproveRequest):
    """Approve multiple registrations at once (max 50)"""
    if len(request.registration_ids) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 registrations per batch")
    
    if not request.registration_ids:
        raise HTTPException(status_code=400, detail="No registration IDs provided")
    
    results = {"approved": [], "failed": [], "already_approved": []}
    
    for reg_id in request.registration_ids:
        registration = await db.registrations.find_one({"id": reg_id}, {"_id": 0})
        if not registration:
            results["failed"].append({"id": reg_id, "reason": "Not found"})
            continue
        
        if registration.get("status") == "approved":
            results["already_approved"].append(reg_id)
            continue
        
        # Update status
        await db.registrations.update_one(
            {"id": reg_id},
            {"$set": {"status": "approved", "show_in_catalog": True}}
        )
        
        # Send approval email
        email = registration.get("email")
        name = registration.get("full_name")
        tier = registration.get("tier", "professional")
        
        if email:
            asyncio.create_task(send_email_async(
                email,
                "Votre accréditation Culture Connect 2026 est confirmée ✓",
                get_approval_email(name, tier, reg_id)
            ))
        
        # Notify partner if sponsored
        sponsored_by = registration.get("sponsored_by")
        if sponsored_by:
            asyncio.create_task(notify_partner_of_approval(sponsored_by, registration))
        
        results["approved"].append(reg_id)
    
    return {
        "success": True,
        "total_processed": len(request.registration_ids),
        "approved_count": len(results["approved"]),
        "already_approved_count": len(results["already_approved"]),
        "failed_count": len(results["failed"]),
        "details": results
    }

@api_router.post("/registrations/batch/send-badges")
async def batch_send_badges(request: BatchSendBadgesRequest, background_tasks: BackgroundTasks = None):
    """Send badge PDFs by email to selected approved participants (max 50)"""
    
    # Determine which registrations to send badges to
    if request.registration_ids:
        if len(request.registration_ids) > 50:
            raise HTTPException(status_code=400, detail="Maximum 50 badges per batch")
        
        registrations = await db.registrations.find(
            {"id": {"$in": request.registration_ids}, "status": "approved"},
            {"_id": 0}
        ).to_list(50)
    else:
        # Send to ALL approved participants
        registrations = await db.registrations.find(
            {"status": "approved"},
            {"_id": 0}
        ).to_list(1000)
    
    if not registrations:
        return {"success": False, "message": "No approved registrations found", "sent_count": 0, "job_id": None}
    
    # Create batch job in MongoDB for persistence
    job_id = str(uuid.uuid4())
    await create_batch_job(job_id, len(registrations), "send_badges")
    
    # Process badges asynchronously with progress tracking
    async def process_badges():
        processed = 0
        sent = 0
        failed = 0
        
        for reg in registrations:
            email = reg.get("email")
            name = reg.get("full_name", "Participant")
            tier = reg.get("tier", "professional")
            reg_id = reg.get("id")
            
            processed += 1
            
            if not email:
                failed += 1
                await update_batch_job_progress(
                    job_id, processed, sent, failed,
                    failed_result={"id": reg_id, "reason": "No email"}
                )
                await log_email_send(email or "N/A", name, "badge", "failed", reg_id, "No email address")
                continue
            
            try:
                # Generate PDF badge
                pdf_buffer = generate_badge_pdf_buffer(reg)
                
                # Send email with badge attachment
                email_html = get_badge_email_html(name, tier, reg_id)
                filename = f"badge_{name.replace(' ', '_')}_{reg_id[:8]}.pdf"
                
                await send_email_with_attachment(
                    email,
                    f"Votre badge Culture Connect 2026 — {name}",
                    email_html,
                    pdf_buffer,
                    filename
                )
                
                sent += 1
                await update_batch_job_progress(
                    job_id, processed, sent, failed,
                    sent_result={"id": reg_id, "email": email, "name": name}
                )
                await log_email_send(email, name, "badge", "sent", reg_id)
            except Exception as e:
                logger.error(f"Failed to send badge to {email}: {str(e)}")
                failed += 1
                await update_batch_job_progress(
                    job_id, processed, sent, failed,
                    failed_result={"id": reg_id, "reason": str(e)}
                )
                await log_email_send(email, name, "badge", "failed", reg_id, str(e))
        
        # Mark job as completed
        await complete_batch_job(job_id)
    
    # Start async processing
    asyncio.create_task(process_badges())
    
    return {
        "success": True,
        "job_id": job_id,
        "total": len(registrations),
        "message": "Badge sending started"
    }

@api_router.get("/registrations/batch/progress/{job_id}")
async def get_batch_progress(job_id: str):
    """Get progress of a batch job from MongoDB"""
    job = await get_batch_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    progress_percent = (job["processed"] / job["total"] * 100) if job["total"] > 0 else 0
    
    return {
        "job_id": job_id,
        "status": job["status"],
        "total": job["total"],
        "processed": job["processed"],
        "sent": job["sent"],
        "failed": job["failed"],
        "progress_percent": round(progress_percent, 1),
        "started_at": job["started_at"],
        "completed_at": job["completed_at"],
        "results": job["results"] if job["status"] == "completed" else None
    }

@api_router.get("/registrations/batch/history")
async def get_batch_history(limit: int = Query(20, le=100)):
    """Get history of batch jobs"""
    jobs = await db.batch_jobs.find(
        {},
        {"_id": 0}
    ).sort("started_at", -1).to_list(limit)
    
    return {
        "jobs": jobs,
        "total": len(jobs)
    }

# ================== EMAIL LOGS ==================

@api_router.get("/email-logs")
async def get_email_logs(
    email_type: Optional[str] = Query(None, description="Filter by type: badge, approval, rejection, partner_notification"),
    status: Optional[str] = Query(None, description="Filter by status: sent, failed"),
    limit: int = Query(100, le=500)
):
    """Get email send history for admin tracking"""
    filter_query = {}
    
    if email_type:
        filter_query["email_type"] = email_type
    if status:
        filter_query["status"] = status
    
    logs = await db.email_logs.find(
        filter_query,
        {"_id": 0}
    ).sort("sent_at", -1).to_list(limit)
    
    # Get summary stats
    total_sent = await db.email_logs.count_documents({"status": "sent"})
    total_failed = await db.email_logs.count_documents({"status": "failed"})
    badges_sent = await db.email_logs.count_documents({"email_type": "badge", "status": "sent"})
    
    return {
        "logs": logs,
        "total_count": len(logs),
        "summary": {
            "total_sent": total_sent,
            "total_failed": total_failed,
            "badges_sent": badges_sent
        }
    }

@api_router.get("/email-logs/stats")
async def get_email_stats():
    """Get email statistics for dashboard"""
    # Count by type
    pipeline = [
        {"$group": {
            "_id": {"type": "$email_type", "status": "$status"},
            "count": {"$sum": 1}
        }}
    ]
    
    results = await db.email_logs.aggregate(pipeline).to_list(100)
    
    # Format stats
    by_type = {}
    for r in results:
        email_type = r["_id"]["type"]
        status = r["_id"]["status"]
        if email_type not in by_type:
            by_type[email_type] = {"sent": 0, "failed": 0}
        by_type[email_type][status] = r["count"]
    
    # Recent activity (last 7 days)
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_count = await db.email_logs.count_documents({"sent_at": {"$gte": seven_days_ago}})
    
    return {
        "by_type": by_type,
        "recent_7_days": recent_count,
        "total_emails": sum(v["sent"] + v["failed"] for v in by_type.values())
    }

def generate_badge_pdf_buffer(participant: dict) -> bytes:
    """Generate PDF badge and return as bytes buffer"""
    pdf_buffer = io.BytesIO()
    badge_width, badge_height = 105 * mm, 148 * mm  # A6 size
    c = canvas.Canvas(pdf_buffer, pagesize=(badge_width, badge_height))
    
    # Colors
    tier_colors = {
        "emerging": "#4A5D4E",
        "professional": "#A65D47",
        "institutional": "#1A1A1A"
    }
    tier_names = {
        "emerging": "ÉMERGENT",
        "professional": "PROFESSIONNEL",
        "institutional": "INSTITUTIONNEL"
    }
    tier = participant.get("tier", "professional")
    tier_color = HexColor(tier_colors.get(tier, "#A65D47"))
    
    # Background
    c.setFillColor(HexColor("#F4F1EA"))
    c.rect(0, 0, badge_width, badge_height, fill=1, stroke=0)
    
    # Border
    c.setStrokeColor(tier_color)
    c.setLineWidth(3)
    c.rect(3, 3, badge_width - 6, badge_height - 6, fill=0, stroke=1)
    
    # Header
    c.setFillColor(HexColor("#1A1A1A"))
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(badge_width / 2, badge_height - 25, "CULTURE CONNECT 2026")
    
    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor("#8A8578"))
    c.drawCentredString(badge_width / 2, badge_height - 38, "Fort-de-France · 20-23 Mai 2026")
    
    # Name and organization
    c.setFillColor(HexColor("#1A1A1A"))
    c.setFont("Helvetica-Bold", 16)
    full_name = participant.get("full_name", "")[:25]
    c.drawCentredString(badge_width / 2, badge_height - 75, full_name)
    
    c.setFont("Helvetica", 10)
    c.setFillColor(HexColor("#8A8578"))
    org_name = participant.get("organization_name", "")[:30]
    c.drawCentredString(badge_width / 2, badge_height - 92, org_name)
    
    # Tier badge
    tier_text = tier_names.get(tier, "PROFESSIONNEL")
    c.setFillColor(tier_color)
    c.rect(badge_width / 2 - 40, badge_height - 118, 80, 18, fill=1, stroke=0)
    c.setFillColor(HexColor("#F4F1EA"))
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(badge_width / 2, badge_height - 113, tier_text)
    
    # QR Code
    profile_url = f"{BASE_URL}/participant/{participant.get('id')}"
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(profile_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)
    
    from reportlab.lib.utils import ImageReader
    qr_image = ImageReader(qr_buffer)
    qr_size = 35 * mm
    c.drawImage(qr_image, (badge_width - qr_size) / 2, 25, width=qr_size, height=qr_size)
    
    # ID below QR
    c.setFillColor(HexColor("#8A8578"))
    c.setFont("Helvetica", 7)
    c.drawCentredString(badge_width / 2, 18, f"ID: {participant.get('id', '')[:8].upper()}")
    
    c.save()
    pdf_buffer.seek(0)
    return pdf_buffer.getvalue()

@api_router.get("/registrations/export/filtered")
async def export_registrations_filtered(
    profile_type: Optional[str] = Query(None),
    expertise_tags: Optional[str] = Query(None, description="Comma-separated tags"),
    status: Optional[str] = Query(None),
    country: Optional[str] = Query(None)
):
    """
    Export filtered registrations as CSV
    Example: /api/registrations/export/filtered?expertise_tags=labels,marche_culturel&profile_type=label
    """
    filter_query = {}
    
    if profile_type:
        filter_query["profile_type"] = profile_type
    if status:
        filter_query["status"] = status
    if country:
        filter_query["country"] = country
    
    # Filter by expertise tags
    if expertise_tags:
        tags_list = [t.strip() for t in expertise_tags.split(",") if t.strip()]
        if tags_list:
            filter_query["expertise_tags"] = {"$in": tags_list}
    
    registrations = await db.registrations.find(filter_query, {"_id": 0}).to_list(10000)
    
    if not registrations:
        registrations = []
    
    output = io.StringIO()
    fieldnames = [
        "id", "full_name", "organization_name", "country", "email", "phone",
        "profile_type", "expertise_tags", "stand_request", "stand_category", "bio", "logo_url",
        "language_preference", "how_heard", "tier", "status", "siret_number", "website_url", "created_at"
    ]
    
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    for reg in registrations:
        # Convert expertise_tags list to string for CSV
        reg_copy = {**reg}
        if isinstance(reg_copy.get("expertise_tags"), list):
            reg_copy["expertise_tags"] = ", ".join(reg_copy["expertise_tags"])
        writer.writerow(reg_copy)
    
    output.seek(0)
    
    # Build filename with filters
    filename_parts = ["registrations"]
    if profile_type:
        filename_parts.append(profile_type)
    if expertise_tags:
        filename_parts.append(expertise_tags.replace(",", "_"))
    filename = f"{'_'.join(filename_parts)}_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
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

# ================== PUBLIC PROFILE & BADGE GENERATION ==================

@api_router.get("/participant/{participant_id}")
async def get_public_participant_profile(participant_id: str):
    """
    Public participant profile for QR code validation at event entry
    Returns basic info + status for badge verification
    """
    participant = await db.registrations.find_one(
        {"id": participant_id},
        {"_id": 0, "email": 0, "phone": 0, "payment_session_id": 0, "siret_number": 0}
    )
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    # Build public profile
    return {
        "id": participant.get("id"),
        "full_name": participant.get("full_name"),
        "organization_name": participant.get("organization_name"),
        "profile_type": participant.get("profile_type"),
        "country": participant.get("country"),
        "tier": participant.get("tier"),
        "status": participant.get("status"),
        "is_approved": participant.get("status") == "approved",
        "show_in_catalog": participant.get("show_in_catalog", False),
        "logo_url": participant.get("logo_url"),
        "bio": participant.get("bio"),
        "expertise_tags": participant.get("expertise_tags", []),
        "stand_request": participant.get("stand_request", False),
        "stand_category": participant.get("stand_category"),
        "website_url": participant.get("website_url"),
        "created_at": participant.get("created_at")
    }

@api_router.get("/participant/{participant_id}/badge")
async def generate_badge_pdf(request: Request, participant_id: str):
    """
    Generate PDF badge with QR code for participant
    QR code points to public profile page for validation
    """
    participant = await db.registrations.find_one(
        {"id": participant_id},
        {"_id": 0}
    )
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    if participant.get("status") != "approved":
        raise HTTPException(status_code=403, detail="Badge only available for approved participants")
    
    # Build profile URL for QR code
    frontend_url = os.environ.get("FRONTEND_URL", str(request.base_url).rstrip('/'))
    profile_url = f"{frontend_url}/participant/{participant_id}"
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(profile_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Save QR to bytes
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)
    
    # Create PDF
    pdf_buffer = io.BytesIO()
    badge_width, badge_height = 105 * mm, 148 * mm  # A6 size
    c = canvas.Canvas(pdf_buffer, pagesize=(badge_width, badge_height))
    
    # Colors
    tier_colors = {
        "emerging": "#4A5D4E",
        "professional": "#A65D47",
        "institutional": "#1A1A1A"
    }
    tier_names = {
        "emerging": "ÉMERGENT",
        "professional": "PROFESSIONNEL",
        "institutional": "INSTITUTIONNEL"
    }
    tier = participant.get("tier", "professional")
    tier_color = HexColor(tier_colors.get(tier, "#A65D47"))
    
    # Background
    c.setFillColor(HexColor("#F4F1EA"))
    c.rect(0, 0, badge_width, badge_height, fill=1, stroke=0)
    
    # Border
    c.setStrokeColor(tier_color)
    c.setLineWidth(3)
    c.rect(3, 3, badge_width - 6, badge_height - 6, fill=0, stroke=1)
    
    # Header
    c.setFillColor(HexColor("#1A1A1A"))
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(badge_width / 2, badge_height - 25, "CULTURE CONNECT 2026")
    
    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor("#8A8578"))
    c.drawCentredString(badge_width / 2, badge_height - 38, "Fort-de-France · 20-23 Mai 2026")
    
    # Separator line
    c.setStrokeColor(HexColor("#E5E0D8"))
    c.setLineWidth(0.5)
    c.line(15, badge_height - 48, badge_width - 15, badge_height - 48)
    
    # Name and organization
    c.setFillColor(HexColor("#1A1A1A"))
    c.setFont("Helvetica-Bold", 16)
    
    # Truncate name if too long
    full_name = participant.get("full_name", "")[:25]
    c.drawCentredString(badge_width / 2, badge_height - 75, full_name)
    
    c.setFont("Helvetica", 10)
    c.setFillColor(HexColor("#8A8578"))
    org_name = participant.get("organization_name", "")[:30]
    c.drawCentredString(badge_width / 2, badge_height - 92, org_name)
    
    # Tier badge
    tier_text = tier_names.get(tier, "PROFESSIONNEL")
    c.setFillColor(tier_color)
    c.rect(badge_width / 2 - 40, badge_height - 118, 80, 18, fill=1, stroke=0)
    c.setFillColor(HexColor("#F4F1EA"))
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(badge_width / 2, badge_height - 113, tier_text)
    
    # Profile type
    profile_labels = {
        "artist": "ARTISTE",
        "label": "LABEL",
        "booking_agency": "BOOKING",
        "institution": "INSTITUTION",
        "press": "PRESSE",
        "other": "PROFESSIONNEL"
    }
    c.setFillColor(HexColor("#8A8578"))
    c.setFont("Helvetica", 8)
    profile_label = profile_labels.get(participant.get("profile_type"), "PROFESSIONNEL")
    c.drawCentredString(badge_width / 2, badge_height - 135, profile_label)
    
    # QR Code
    from reportlab.lib.utils import ImageReader
    qr_buffer.seek(0)
    qr_image = ImageReader(qr_buffer)
    qr_size = 35 * mm
    c.drawImage(qr_image, (badge_width - qr_size) / 2, 25, width=qr_size, height=qr_size)
    
    # ID below QR
    c.setFillColor(HexColor("#8A8578"))
    c.setFont("Helvetica", 7)
    c.drawCentredString(badge_width / 2, 18, f"ID: {participant_id[:8].upper()}")
    
    # Stand indicator if applicable
    if participant.get("stand_request"):
        c.setFillColor(HexColor("#4A5D4E"))
        c.setFont("Helvetica-Bold", 7)
        stand_cat = participant.get("stand_category", "Stand")
        c.drawCentredString(badge_width / 2, 8, f"STAND · {stand_cat.upper()}")
    
    c.save()
    pdf_buffer.seek(0)
    
    filename = f"badge_{participant.get('full_name', 'participant').replace(' ', '_')}_{participant_id[:8]}.pdf"
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ================== PARTNER MANAGEMENT ==================

class PartnerUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    tier: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    show_on_landing: Optional[bool] = None
    sponsored_registrations: Optional[List[str]] = None

class ManualPartner(BaseModel):
    company_name: str
    contact_name: str
    contact_email: str
    contact_phone: str = ""
    tier: str = "bronze"
    website: Optional[str] = None
    logo_url: Optional[str] = None
    show_on_landing: bool = True

@api_router.get("/partners/admin")
async def get_partners_admin():
    """Get all partners with full details for admin"""
    partners = await db.partners.find({}, {"_id": 0}).to_list(100)
    
    # Enrich with sponsored registrations info
    for partner in partners:
        partner_id = partner.get("id")
        # Find registrations sponsored by this partner
        sponsored = await db.registrations.find(
            {"sponsored_by": partner_id},
            {"_id": 0, "id": 1, "full_name": 1, "organization_name": 1, "status": 1}
        ).to_list(50)
        partner["sponsored_registrations"] = sponsored
        partner["sponsored_count"] = len(sponsored)
    
    return {"partners": partners, "total": len(partners)}

@api_router.post("/partners/manual")
async def create_manual_partner(data: ManualPartner):
    """Admin manual partner creation (without payment)"""
    partner_id = str(uuid.uuid4())
    
    partner = {
        "id": partner_id,
        "company_name": data.company_name,
        "contact_name": data.contact_name,
        "contact_email": data.contact_email,
        "contact_phone": data.contact_phone,
        "tier": data.tier,
        "website": data.website,
        "logo_url": data.logo_url,
        "vip_accreditations": [],
        "show_on_landing": data.show_on_landing,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "source": "admin_manual"
    }
    
    await db.partners.insert_one(partner)
    
    return {
        "success": True,
        "partner_id": partner_id,
        "message": "Partner created successfully"
    }

@api_router.patch("/partners/{partner_id}")
async def update_partner(partner_id: str, update: PartnerUpdate):
    """Update partner details"""
    partner = await db.partners.find_one({"id": partner_id})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    
    if update_data:
        await db.partners.update_one(
            {"id": partner_id},
            {"$set": update_data}
        )
    
    return {"success": True, "updated_fields": list(update_data.keys())}

@api_router.delete("/partners/{partner_id}")
async def delete_partner(partner_id: str):
    """Delete a partner"""
    result = await db.partners.delete_one({"id": partner_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    # Also unlink any sponsored registrations
    await db.registrations.update_many(
        {"sponsored_by": partner_id},
        {"$unset": {"sponsored_by": ""}}
    )
    
    return {"success": True, "message": "Partner deleted"}

@api_router.post("/partners/{partner_id}/sponsor/{registration_id}")
async def link_sponsor_to_registration(partner_id: str, registration_id: str):
    """Link a partner as sponsor to a registration"""
    # Verify partner exists
    partner = await db.partners.find_one({"id": partner_id})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    # Verify registration exists
    registration = await db.registrations.find_one({"id": registration_id})
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    # Link them
    await db.registrations.update_one(
        {"id": registration_id},
        {"$set": {"sponsored_by": partner_id, "sponsor_name": partner.get("company_name")}}
    )
    
    return {
        "success": True,
        "message": f"Registration linked to partner {partner.get('company_name')}"
    }

@api_router.delete("/partners/{partner_id}/sponsor/{registration_id}")
async def unlink_sponsor_from_registration(partner_id: str, registration_id: str):
    """Unlink a partner from a registration"""
    await db.registrations.update_one(
        {"id": registration_id, "sponsored_by": partner_id},
        {"$unset": {"sponsored_by": "", "sponsor_name": ""}}
    )
    
    return {"success": True, "message": "Sponsor link removed"}

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

@api_v1_router.get("/stats/advanced")
async def get_advanced_analytics():
    """
    Advanced Analytics for Partner Reports
    Includes trend data, KPIs, and comparative metrics
    """
    all_registrations = await db.registrations.find({}, {"_id": 0}).to_list(10000)
    all_partners = await db.partners.find({}, {"_id": 0}).to_list(100)
    email_logs = await db.email_logs.find({}, {"_id": 0}).to_list(1000)
    
    # Basic counts
    total = len(all_registrations)
    approved = sum(1 for r in all_registrations if r.get("status") == "approved")
    pending = sum(1 for r in all_registrations if r.get("status") == "pending")
    in_catalog = sum(1 for r in all_registrations if r.get("show_in_catalog") and r.get("status") == "approved")
    
    # Registration timeline (by day)
    registration_timeline = {}
    for r in all_registrations:
        created = r.get("created_at", "")[:10]  # Get date part only
        if created:
            registration_timeline[created] = registration_timeline.get(created, 0) + 1
    
    # Sort by date
    registration_timeline = dict(sorted(registration_timeline.items()))
    
    # Profile type distribution with percentages
    profile_distribution = {}
    for r in all_registrations:
        profile = r.get("profile_type", "other")
        profile_distribution[profile] = profile_distribution.get(profile, 0) + 1
    
    profile_with_percent = {
        k: {"count": v, "percent": round(v / total * 100, 1) if total > 0 else 0}
        for k, v in profile_distribution.items()
    }
    
    # Tier distribution with revenue estimates
    tier_revenue = {
        "emerging": {"price": 50, "count": 0, "revenue": 0},
        "professional": {"price": 150, "count": 0, "revenue": 0},
        "institutional": {"price": 300, "count": 0, "revenue": 0}
    }
    for r in all_registrations:
        if r.get("status") == "approved":
            tier = r.get("tier", "professional")
            if tier in tier_revenue:
                tier_revenue[tier]["count"] += 1
                tier_revenue[tier]["revenue"] = tier_revenue[tier]["count"] * tier_revenue[tier]["price"]
    
    total_registration_revenue = sum(t["revenue"] for t in tier_revenue.values())
    
    # Partner revenue estimates
    partner_revenue = {
        "bronze": {"price": 2500, "count": 0, "revenue": 0},
        "silver": {"price": 5000, "count": 0, "revenue": 0},
        "gold": {"price": 10000, "count": 0, "revenue": 0}
    }
    for p in all_partners:
        tier = p.get("tier", "bronze")
        if tier in partner_revenue:
            partner_revenue[tier]["count"] += 1
            partner_revenue[tier]["revenue"] = partner_revenue[tier]["count"] * partner_revenue[tier]["price"]
    
    total_partner_revenue = sum(t["revenue"] for t in partner_revenue.values())
    
    # Expertise/Interest engagement
    expertise_engagement = {}
    for r in all_registrations:
        tags = r.get("expertise_tags", [])
        if isinstance(tags, list):
            for tag in tags:
                if tag:
                    expertise_engagement[tag] = expertise_engagement.get(tag, 0) + 1
    
    # Sort and format
    expertise_sorted = dict(sorted(expertise_engagement.items(), key=lambda x: x[1], reverse=True))
    
    # Marché Culturel specific metrics
    marche_culturel_stats = {
        "stand_requests": sum(1 for r in all_registrations if r.get("stand_request")),
        "approved_stands": sum(1 for r in all_registrations if r.get("stand_request") and r.get("status") == "approved"),
        "stand_categories": {}
    }
    for r in all_registrations:
        if r.get("stand_request"):
            cat = r.get("stand_category", "general")
            marche_culturel_stats["stand_categories"][cat] = marche_culturel_stats["stand_categories"].get(cat, 0) + 1
    
    # Email delivery stats
    email_stats = {
        "total_sent": sum(1 for e in email_logs if e.get("status") == "sent"),
        "total_failed": sum(1 for e in email_logs if e.get("status") == "failed"),
        "badges_sent": sum(1 for e in email_logs if e.get("email_type") == "badge" and e.get("status") == "sent"),
        "delivery_rate": 0
    }
    if email_stats["total_sent"] + email_stats["total_failed"] > 0:
        email_stats["delivery_rate"] = round(
            email_stats["total_sent"] / (email_stats["total_sent"] + email_stats["total_failed"]) * 100, 1
        )
    
    # KPIs for partner report
    kpis = {
        "total_registrations": total,
        "approval_rate": round(approved / total * 100, 1) if total > 0 else 0,
        "catalog_visibility_rate": round(in_catalog / approved * 100, 1) if approved > 0 else 0,
        "total_partners": len(all_partners),
        "total_revenue_estimate": total_registration_revenue + total_partner_revenue,
        "avg_expertise_per_participant": round(
            sum(len(r.get("expertise_tags", [])) for r in all_registrations) / total, 1
        ) if total > 0 else 0,
        "badges_sent": email_stats["badges_sent"],
        "email_delivery_rate": email_stats["delivery_rate"]
    }
    
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "report_title": "Culture Connect 2026 - Rapport de Situation",
        "kpis": kpis,
        "registration_timeline": registration_timeline,
        "profile_distribution": profile_with_percent,
        "tier_analysis": {
            "registrations": tier_revenue,
            "total_registration_revenue": total_registration_revenue
        },
        "partner_analysis": {
            "partners": partner_revenue,
            "total_partner_revenue": total_partner_revenue
        },
        "expertise_engagement": expertise_sorted,
        "top_10_interests": list(expertise_sorted.keys())[:10],
        "marche_culturel": marche_culturel_stats,
        "email_delivery": email_stats,
        "meta": {
            "currency": "EUR",
            "event_date": "2026-05-20",
            "report_type": "advanced_analytics"
        }
    }

@api_v1_router.get("/report/summary")
async def get_partner_report_summary():
    """
    Executive Summary for Partner Meetings
    One-page dashboard data optimized for presentations
    """
    stats = await get_advanced_analytics()
    
    # Extract key highlights
    highlights = []
    
    kpis = stats["kpis"]
    if kpis["total_registrations"] > 0:
        highlights.append(f"{kpis['total_registrations']} inscriptions totales")
    if kpis["approval_rate"] > 80:
        highlights.append(f"Taux d'approbation excellent: {kpis['approval_rate']}%")
    if kpis["badges_sent"] > 0:
        highlights.append(f"{kpis['badges_sent']} badges envoyés")
    if kpis["total_partners"] > 0:
        highlights.append(f"{kpis['total_partners']} partenaire(s) confirmé(s)")
    
    # Top territories
    territories = await get_territory_insights()
    top_territories = territories.get("top_5", [])
    
    # Format for presentation
    return {
        "title": "Culture Connect 2026 - Executive Summary",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "highlights": highlights,
        "key_metrics": {
            "inscriptions": kpis["total_registrations"],
            "approuves": int(kpis["total_registrations"] * kpis["approval_rate"] / 100),
            "partenaires": kpis["total_partners"],
            "revenus_estimes": f"{kpis['total_revenue_estimate']:,}€".replace(",", " ")
        },
        "top_territories": top_territories,
        "top_interests": stats.get("top_10_interests", [])[:5],
        "marche_culturel": {
            "demandes_stand": stats["marche_culturel"]["stand_requests"],
            "stands_approuves": stats["marche_culturel"]["approved_stands"]
        },
        "communication": {
            "badges_envoyes": kpis["badges_sent"],
            "taux_delivrabilite": f"{stats['email_delivery']['delivery_rate']}%"
        }
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

# ================== EMERGENT LLM SERVICES ==================
from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "sk-emergent-042E081B3D24541Dd4")

class EmbeddingRequest(BaseModel):
    text: str

class ChatRequest(BaseModel):
    message: str
    system_prompt: Optional[str] = None
    model: Optional[str] = "claude-4-sonnet-20250514"
    provider: Optional[str] = "anthropic"

@api_v1_router.post("/llm/embedding")
async def generate_embedding_endpoint(request: EmbeddingRequest):
    """Generate embedding using OpenAI via Emergent"""
    try:
        import openai
        client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY", EMERGENT_LLM_KEY))
        
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=request.text
        )
        return {"embedding": response.data[0].embedding}
    except Exception as e:
        logger.error(f"Embedding error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

@api_v1_router.post("/llm/chat")
async def llm_chat_endpoint(request: ChatRequest):
    """Chat completion using Emergent LLM"""
    try:
        session_id = str(uuid.uuid4())
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=request.system_prompt or "Tu es un assistant expert en industries culturelles afro-caribéennes."
        )
        
        if request.provider == "anthropic":
            chat.with_model("anthropic", request.model or "claude-4-sonnet-20250514")
        else:
            chat.with_model("openai", request.model or "gpt-5.2")
        
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        return {"response": response}
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

# Include the routers in the main app
app.include_router(api_router)
app.include_router(api_v1_router)

# ================== SMART ENGINE PROXY ==================
import httpx

SMART_ENGINE_URL = "http://localhost:8002"

@app.api_route("/api/v1/smart-recommendations/{path:path}", methods=["GET", "POST", "DELETE", "PUT", "PATCH"])
async def smart_engine_proxy(request: Request, path: str):
    """Proxy requests to KiltiKonet Smart Engine service"""
    async with httpx.AsyncClient(timeout=60.0) as client_http:
        url = f"{SMART_ENGINE_URL}/api/v1/smart-recommendations/{path}"
        
        # Forward the request
        try:
            if request.method == "GET":
                response = await client_http.get(url, params=dict(request.query_params))
            elif request.method == "POST":
                body = await request.body()
                response = await client_http.post(
                    url, 
                    content=body,
                    headers={"Content-Type": request.headers.get("Content-Type", "application/json")}
                )
            elif request.method == "DELETE":
                response = await client_http.delete(url)
            else:
                body = await request.body()
                response = await client_http.request(
                    request.method,
                    url,
                    content=body,
                    headers={"Content-Type": request.headers.get("Content-Type", "application/json")}
                )
            
            # Return the response
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.headers.get("content-type")
            )
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="Smart Engine service unavailable")
        except Exception as e:
            logger.error(f"Smart Engine proxy error: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal proxy error")

# ================== EMERGENT LLM SERVICES ==================
from emergentintegrations.llm.chat import LlmChat, UserMessage

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "sk-emergent-042E081B3D24541Dd4")

class EmbeddingRequest(BaseModel):
    text: str

class ChatRequest(BaseModel):
    message: str
    system_prompt: Optional[str] = None
    model: Optional[str] = "claude-4-sonnet-20250514"
    provider: Optional[str] = "anthropic"

@api_v1_router.post("/llm/embedding")
async def generate_embedding(request: EmbeddingRequest):
    """Generate embedding using OpenAI via Emergent"""
    try:
        # Use OpenAI directly for embeddings with proper key handling
        import openai
        client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY", EMERGENT_LLM_KEY))
        
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=request.text
        )
        return {"embedding": response.data[0].embedding}
    except Exception as e:
        logger.error(f"Embedding error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

@api_v1_router.post("/llm/chat")
async def llm_chat(request: ChatRequest):
    """Chat completion using Emergent LLM"""
    try:
        session_id = str(uuid.uuid4())
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=request.system_prompt or "Tu es un assistant expert en industries culturelles afro-caribéennes."
        )
        
        if request.provider == "anthropic":
            chat.with_model("anthropic", request.model or "claude-4-sonnet-20250514")
        else:
            chat.with_model("openai", request.model or "gpt-5.2")
        
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        return {"response": response}
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================== DATABASE INDEXES ==================

@app.on_event("startup")
async def create_indexes():
    """Create MongoDB indexes for performance optimization"""
    try:
        # Registrations collection indexes
        await db.registrations.create_index("status")
        await db.registrations.create_index("show_in_catalog")
        await db.registrations.create_index([("status", 1), ("show_in_catalog", 1)])
        await db.registrations.create_index("profile_type")
        await db.registrations.create_index("country")
        await db.registrations.create_index("tier")
        await db.registrations.create_index("email", unique=False)
        await db.registrations.create_index("expertise_tags")
        
        # Partners collection indexes
        await db.partners.create_index("tier")
        await db.partners.create_index("show_on_landing")
        
        # Batch jobs collection indexes
        await db.batch_jobs.create_index("status")
        await db.batch_jobs.create_index("started_at")
        
        # Email logs collection indexes
        await db.email_logs.create_index("email_type")
        await db.email_logs.create_index("status")
        await db.email_logs.create_index("sent_at")
        await db.email_logs.create_index("participant_id")
        
        # Payment transactions collection indexes
        await db.payment_transactions.create_index("session_id", unique=True)
        await db.payment_transactions.create_index("payment_status")
        
        logger.info("✅ MongoDB indexes created successfully")
    except Exception as e:
        logger.error(f"⚠️ Error creating indexes: {str(e)}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
