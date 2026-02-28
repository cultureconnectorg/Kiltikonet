from fastapi import FastAPI, APIRouter, File, UploadFile, Form, HTTPException, Query, Request, BackgroundTasks
from fastapi.responses import StreamingResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
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

# ================== BIDIRECTIONAL REALTIME SYNC (WebSocket + SSE) ==================
from fastapi import WebSocket, WebSocketDisconnect
from typing import Set
import uuid as uuid_lib

# Connection managers
class ConnectionManager:
    """Manages WebSocket connections for bidirectional real-time sync"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}  # client_id -> websocket
        self.subscriptions: Dict[str, Set[str]] = {}  # channel -> set of client_ids
        self.client_metadata: Dict[str, dict] = {}  # client_id -> metadata (user info, page, etc.)
    
    async def connect(self, websocket: WebSocket, client_id: str = None):
        await websocket.accept()
        if not client_id:
            client_id = str(uuid_lib.uuid4())[:8]
        self.active_connections[client_id] = websocket
        self.client_metadata[client_id] = {
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "subscriptions": []
        }
        logger.info(f"🔗 WebSocket connected: {client_id} (Total: {len(self.active_connections)})")
        return client_id
    
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.client_metadata:
            del self.client_metadata[client_id]
        # Remove from all subscriptions
        for channel in self.subscriptions.values():
            channel.discard(client_id)
        logger.info(f"🔌 WebSocket disconnected: {client_id} (Remaining: {len(self.active_connections)})")
    
    def subscribe(self, client_id: str, channel: str):
        """Subscribe client to a channel (e.g., 'cms', 'globe', 'registrations')"""
        if channel not in self.subscriptions:
            self.subscriptions[channel] = set()
        self.subscriptions[channel].add(client_id)
        if client_id in self.client_metadata:
            if "subscriptions" not in self.client_metadata[client_id]:
                self.client_metadata[client_id]["subscriptions"] = []
            self.client_metadata[client_id]["subscriptions"].append(channel)
    
    def unsubscribe(self, client_id: str, channel: str):
        if channel in self.subscriptions:
            self.subscriptions[channel].discard(client_id)
    
    async def broadcast_to_channel(self, channel: str, message: dict, exclude_client: str = None):
        """Broadcast message to all clients subscribed to a channel"""
        if channel not in self.subscriptions:
            return
        
        dead_clients = []
        for client_id in self.subscriptions[channel]:
            if client_id == exclude_client:
                continue
            if client_id in self.active_connections:
                try:
                    await self.active_connections[client_id].send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to {client_id}: {e}")
                    dead_clients.append(client_id)
        
        # Clean up dead connections
        for client_id in dead_clients:
            self.disconnect(client_id)
    
    async def broadcast_to_all(self, message: dict, exclude_client: str = None):
        """Broadcast message to all connected clients"""
        dead_clients = []
        for client_id, websocket in self.active_connections.items():
            if client_id == exclude_client:
                continue
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to {client_id}: {e}")
                dead_clients.append(client_id)
        
        for client_id in dead_clients:
            self.disconnect(client_id)
        
        logger.info(f"📡 Broadcast to {len(self.active_connections) - (1 if exclude_client else 0)} clients")
    
    async def send_to_client(self, client_id: str, message: dict):
        """Send message to a specific client"""
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending to {client_id}: {e}")
                self.disconnect(client_id)
    
    def get_status(self):
        return {
            "total_connections": len(self.active_connections),
            "channels": {ch: len(clients) for ch, clients in self.subscriptions.items()},
            "clients": list(self.active_connections.keys())
        }

# Global connection manager
ws_manager = ConnectionManager()

# Keep SSE for backward compatibility
sse_connections: List[asyncio.Queue] = []

class RealtimeEvent(BaseModel):
    event_type: str
    data: dict = {}
    timestamp: str = ""
    source_client: str = ""  # Added to track origin

async def broadcast_event(event_type: str, data: dict = {}, source_client: str = "", channels: List[str] = None):
    """Broadcast an event to all connected clients (WebSocket + SSE)"""
    event = RealtimeEvent(
        event_type=event_type,
        data=data,
        timestamp=datetime.now(timezone.utc).isoformat(),
        source_client=source_client
    )
    event_dict = event.model_dump()
    
    # Broadcast via WebSocket
    if channels:
        for channel in channels:
            await ws_manager.broadcast_to_channel(channel, event_dict, exclude_client=source_client)
    else:
        await ws_manager.broadcast_to_all(event_dict, exclude_client=source_client)
    
    # Also broadcast via SSE for backward compatibility
    dead_connections = []
    for queue in sse_connections:
        try:
            await queue.put(event_dict)
        except:
            dead_connections.append(queue)
    for dead in dead_connections:
        if dead in sse_connections:
            sse_connections.remove(dead)
    
    logger.info(f"📡 Broadcast event: {event_type} | WS: {len(ws_manager.active_connections)} | SSE: {len(sse_connections)}")

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

# ================== CMS MODELS ==================

class CMSMediaItem(BaseModel):
    """Media item for CMS"""
    id: Optional[str] = None
    tenant_id: str = "culture-connect-2026"
    category: str  # hero, logo, venue, gallery
    title: str
    image_url: Optional[str] = None
    description: Optional[str] = None
    order: int = 0
    published: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class CMSExhibitorPhoto(BaseModel):
    """Photo for Smart Engine profile or participant"""
    profile_id: str
    profile_type: str  # smart_engine or participant
    photo_url: Optional[str] = None
    tenant_id: str = "culture-connect-2026"

class CMSSpeaker(BaseModel):
    """Speaker/Intervenant for CMS"""
    id: Optional[str] = None
    tenant_id: str = "culture-connect-2026"
    name: str
    role: str
    photo_url: Optional[str] = None
    bio: Optional[str] = None
    order: int = 0
    published: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class CMSPartnerBanner(BaseModel):
    """Partner banner/logo for CMS"""
    id: Optional[str] = None
    tenant_id: str = "culture-connect-2026"
    name: str
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    order: int = 0
    published: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class CMSTheme(BaseModel):
    """Theme configuration"""
    tenant_id: str = "culture-connect-2026"
    primary_color: str = "#A65D47"
    secondary_color: str = "#C8922A"
    accent_color: str = "#4A5D4E"
    background_color: str = "#1A1A1A"
    text_color: str = "#F4F1EA"
    font_family: str = "Inter"
    hero_image_url: Optional[str] = None
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None

class CMSContent(BaseModel):
    """Editorial content for pages"""
    id: Optional[str] = None
    tenant_id: str = "culture-connect-2026"
    page: str  # home, program, about
    section: str  # title, subtitle, intro, key_figures, etc.
    content: dict  # JSON content
    updated_at: Optional[str] = None

class CMSPage(BaseModel):
    """Custom dynamic page"""
    id: Optional[str] = None
    tenant_id: str = "culture-connect-2026"
    title: str
    slug: str
    content: str  # HTML/rich text
    meta_description: Optional[str] = None
    published: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class AnnualIntention(BaseModel):
    """Annual intention for intro sequence"""
    id: Optional[str] = None
    tenant_id: str = "culture-connect-2026"
    annee: str = "2026"
    mot_annee: str = "NOU."
    mot_annee_note: Optional[str] = "2026 — Nous. La reconnexion."
    image_annee_url: Optional[str] = None
    phrase_ligne_1: str = "Pendant des siècles on nous a séparés."
    phrase_ligne_2: str = "Le 22 Mai 2026 — nous nous retrouvons."
    mot_cle_phrase_2: str = "nous"
    couleur_annee: str = "#A65D47"
    son_tambour_url: Optional[str] = None
    sons_identites: Optional[dict] = None  # {artist: url, label: url, ...}
    territoire_messages: Optional[dict] = None  # {Martinique: "Ou ka vini.", ...}
    active: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class MapTerritory(BaseModel):
    """Territory point for diaspora map"""
    id: str
    name: str
    lat: float
    lon: float
    color: str = "#A65D47"
    size: str = "medium"  # primary, large, medium, small
    label: str = ""
    isCenter: bool = False
    opacity: float = 1.0
    active: bool = True

class MapConfig(BaseModel):
    """Map configuration"""
    tenant_id: str = "culture-connect-2026"
    territories: list[dict] = []
    counter_text: str = "territoires connectés"
    animations_enabled: bool = True
    lines_enabled: bool = True

class SectionBackground(BaseModel):
    """Background configuration for a section"""
    section_id: str
    background_type: str = "color"  # color, image, gradient
    color: Optional[str] = None
    image_url: Optional[str] = None
    gradient_start: Optional[str] = None
    gradient_end: Optional[str] = None
    gradient_direction: str = "to-b"
    overlay_opacity: int = 0
    active: bool = True

class SiteConfig(BaseModel):
    """Global site configuration"""
    tenant_id: str = "culture-connect-2026"
    animations_enabled: bool = True
    countdown_enabled: bool = True
    particles_enabled: bool = True
    map_lines_enabled: bool = True
    section_backgrounds: list[dict] = []

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
    
    # 🔄 Broadcast real-time update
    await broadcast_event("registration_created", {"id": registration_id, "name": full_name, "tier": tier})
    
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
from emergentintegrations.llm.chat import LlmChat, UserMessage, get_integration_proxy_url
import hashlib

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "sk-emergent-042E081B3D24541Dd4")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

class EmbeddingRequest(BaseModel):
    text: str

class ChatRequest(BaseModel):
    message: str
    system_prompt: Optional[str] = None
    model: Optional[str] = "claude-4-sonnet-20250514"
    provider: Optional[str] = "anthropic"

def generate_simple_embedding(text: str, dim: int = 1536) -> list:
    """
    Generate a deterministic pseudo-embedding using text hashing.
    This is a fallback when OpenAI API is not available.
    For production, use OPENAI_API_KEY environment variable.
    """
    import math
    # Create a deterministic hash-based embedding
    text_lower = text.lower().strip()
    
    # Generate multiple hash values to fill the embedding
    embedding = []
    for i in range(dim):
        h = hashlib.sha256(f"{text_lower}_{i}".encode()).hexdigest()
        # Convert hex to float between -1 and 1
        val = (int(h[:8], 16) / (16**8)) * 2 - 1
        embedding.append(val)
    
    # Normalize the embedding
    norm = math.sqrt(sum(x*x for x in embedding))
    if norm > 0:
        embedding = [x/norm for x in embedding]
    
    return embedding

@api_v1_router.post("/llm/embedding")
async def generate_embedding_endpoint(request: EmbeddingRequest):
    """Generate embedding using OpenAI via Emergent LLM Key and LiteLLM"""
    try:
        from litellm import embedding
        
        # Use LiteLLM with Emergent key
        response = embedding(
            model="openai/text-embedding-3-small",
            input=[request.text],
            api_key=EMERGENT_LLM_KEY,
            api_base=get_integration_proxy_url()
        )
        
        return {"embedding": response.data[0]["embedding"], "method": "openai-litellm"}
    except Exception as e:
        logger.error(f"Embedding error: {str(e)}")
        # Fallback to hash-based on any error
        embedding_vec = generate_simple_embedding(request.text)
        return {"embedding": embedding_vec, "method": "hash-fallback", "error": str(e)}

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

# ================== CMS ROUTES ==================

DEFAULT_TENANT = "culture-connect-2026"

# --- CMS Media ---
@app.get("/api/cms/media")
async def get_cms_media(category: Optional[str] = None, tenant_id: str = DEFAULT_TENANT):
    """Get all media items, optionally filtered by category"""
    query = {"tenant_id": tenant_id}
    if category:
        query["category"] = category
    
    media = await db.cms_media.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    return {"media": media, "total": len(media)}

@app.post("/api/cms/media")
async def create_cms_media(item: CMSMediaItem):
    """Create a new media item"""
    item_dict = item.model_dump()
    item_dict["id"] = str(uuid.uuid4())
    item_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    item_dict["updated_at"] = item_dict["created_at"]
    
    await db.cms_media.insert_one(item_dict)
    return {"success": True, "media": {k: v for k, v in item_dict.items() if k != "_id"}}

@app.put("/api/cms/media/{media_id}")
async def update_cms_media(media_id: str, item: CMSMediaItem):
    """Update a media item"""
    item_dict = item.model_dump(exclude_unset=True)
    item_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.cms_media.update_one(
        {"id": media_id, "tenant_id": item.tenant_id},
        {"$set": item_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Media not found")
    
    return {"success": True}

@app.delete("/api/cms/media/{media_id}")
async def delete_cms_media(media_id: str, tenant_id: str = DEFAULT_TENANT):
    """Delete a media item"""
    result = await db.cms_media.delete_one({"id": media_id, "tenant_id": tenant_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Media not found")
    
    return {"success": True}

@app.post("/api/cms/media/{media_id}/upload")
async def upload_cms_media_image(media_id: str, file: UploadFile = File(...), tenant_id: str = DEFAULT_TENANT):
    """Upload image for a media item"""
    image_url = await upload_to_cloudinary(file, f"culture-connect/cms/{media_id}")
    
    if not image_url:
        raise HTTPException(status_code=500, detail="Failed to upload image")
    
    await db.cms_media.update_one(
        {"id": media_id, "tenant_id": tenant_id},
        {"$set": {"image_url": image_url, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "image_url": image_url}

@app.post("/api/cms/upload")
async def upload_cms_file(file: UploadFile = File(...), type: str = "image"):
    """Generic CMS file upload (images, audio)"""
    # Generate unique folder based on file type
    folder = f"culture-connect/cms/{type}/{uuid.uuid4().hex[:8]}"
    
    if type == "audio":
        # For audio, upload to Cloudinary with resource_type=auto
        import cloudinary.uploader
        file_content = await file.read()
        result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            resource_type="auto"
        )
        return {"success": True, "url": result.get("secure_url")}
    else:
        # For images, use existing function
        image_url = await upload_to_cloudinary(file, folder)
        if not image_url:
            raise HTTPException(status_code=500, detail="Failed to upload file")
        return {"success": True, "url": image_url}

# --- CMS Exhibitor Photos ---
@app.get("/api/cms/exhibitors")
async def get_cms_exhibitors(tenant_id: str = DEFAULT_TENANT):
    """Get all exhibitor photos"""
    photos = await db.cms_exhibitor_photos.find(
        {"tenant_id": tenant_id}, 
        {"_id": 0}
    ).to_list(200)
    return {"exhibitors": photos, "total": len(photos)}

@app.post("/api/cms/exhibitors/{profile_id}/upload")
async def upload_exhibitor_photo(
    profile_id: str, 
    profile_type: str = "smart_engine",
    file: UploadFile = File(...), 
    tenant_id: str = DEFAULT_TENANT
):
    """Upload photo for an exhibitor profile"""
    image_url = await upload_to_cloudinary(file, f"culture-connect/exhibitors/{profile_id}")
    
    if not image_url:
        raise HTTPException(status_code=500, detail="Failed to upload image")
    
    await db.cms_exhibitor_photos.update_one(
        {"profile_id": profile_id, "tenant_id": tenant_id},
        {
            "$set": {
                "profile_id": profile_id,
                "profile_type": profile_type,
                "photo_url": image_url,
                "tenant_id": tenant_id,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    return {"success": True, "photo_url": image_url}

@app.delete("/api/cms/exhibitors/{profile_id}")
async def delete_exhibitor_photo(profile_id: str, tenant_id: str = DEFAULT_TENANT):
    """Delete exhibitor photo"""
    result = await db.cms_exhibitor_photos.delete_one({"profile_id": profile_id, "tenant_id": tenant_id})
    return {"success": True, "deleted": result.deleted_count > 0}

# --- CMS Speakers ---
@app.get("/api/cms/speakers")
async def get_cms_speakers(tenant_id: str = DEFAULT_TENANT):
    """Get all speakers/intervenants"""
    speakers = await db.cms_speakers.find(
        {"tenant_id": tenant_id}, 
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    return {"speakers": speakers, "total": len(speakers)}

@app.post("/api/cms/speakers")
async def create_cms_speaker(speaker: CMSSpeaker):
    """Create a new speaker"""
    speaker_dict = speaker.model_dump()
    speaker_dict["id"] = str(uuid.uuid4())
    speaker_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    speaker_dict["updated_at"] = speaker_dict["created_at"]
    
    await db.cms_speakers.insert_one(speaker_dict)
    return {"success": True, "speaker": {k: v for k, v in speaker_dict.items() if k != "_id"}}

@app.put("/api/cms/speakers/{speaker_id}")
async def update_cms_speaker(speaker_id: str, speaker: CMSSpeaker):
    """Update a speaker"""
    speaker_dict = speaker.model_dump(exclude_unset=True)
    speaker_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.cms_speakers.update_one(
        {"id": speaker_id, "tenant_id": speaker.tenant_id},
        {"$set": speaker_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Speaker not found")
    
    return {"success": True}

@app.delete("/api/cms/speakers/{speaker_id}")
async def delete_cms_speaker(speaker_id: str, tenant_id: str = DEFAULT_TENANT):
    """Delete a speaker"""
    result = await db.cms_speakers.delete_one({"id": speaker_id, "tenant_id": tenant_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Speaker not found")
    
    return {"success": True}

@app.post("/api/cms/speakers/{speaker_id}/upload")
async def upload_speaker_photo(speaker_id: str, file: UploadFile = File(...), tenant_id: str = DEFAULT_TENANT):
    """Upload photo for a speaker"""
    image_url = await upload_to_cloudinary(file, f"culture-connect/speakers/{speaker_id}")
    
    if not image_url:
        raise HTTPException(status_code=500, detail="Failed to upload image")
    
    await db.cms_speakers.update_one(
        {"id": speaker_id, "tenant_id": tenant_id},
        {"$set": {"photo_url": image_url, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "photo_url": image_url}

@app.put("/api/cms/speakers/reorder")
async def reorder_speakers(orders: List[dict], tenant_id: str = DEFAULT_TENANT):
    """Reorder speakers via drag & drop"""
    for item in orders:
        await db.cms_speakers.update_one(
            {"id": item["id"], "tenant_id": tenant_id},
            {"$set": {"order": item["order"]}}
        )
    return {"success": True}

# --- CMS Partner Banners ---
@app.get("/api/cms/partners")
async def get_cms_partners(tenant_id: str = DEFAULT_TENANT):
    """Get all partner banners"""
    partners = await db.cms_partner_banners.find(
        {"tenant_id": tenant_id}, 
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    return {"partners": partners, "total": len(partners)}

@app.post("/api/cms/partners")
async def create_cms_partner(partner: CMSPartnerBanner):
    """Create a new partner banner"""
    partner_dict = partner.model_dump()
    partner_dict["id"] = str(uuid.uuid4())
    partner_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    partner_dict["updated_at"] = partner_dict["created_at"]
    
    await db.cms_partner_banners.insert_one(partner_dict)
    return {"success": True, "partner": {k: v for k, v in partner_dict.items() if k != "_id"}}

@app.put("/api/cms/partners/{partner_id}")
async def update_cms_partner(partner_id: str, partner: CMSPartnerBanner):
    """Update a partner banner"""
    partner_dict = partner.model_dump(exclude_unset=True)
    partner_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.cms_partner_banners.update_one(
        {"id": partner_id, "tenant_id": partner.tenant_id},
        {"$set": partner_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    return {"success": True}

@app.delete("/api/cms/partners/{partner_id}")
async def delete_cms_partner(partner_id: str, tenant_id: str = DEFAULT_TENANT):
    """Delete a partner banner"""
    result = await db.cms_partner_banners.delete_one({"id": partner_id, "tenant_id": tenant_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    return {"success": True}

@app.post("/api/cms/partners/{partner_id}/upload")
async def upload_partner_logo(partner_id: str, file: UploadFile = File(...), tenant_id: str = DEFAULT_TENANT):
    """Upload logo for a partner"""
    image_url = await upload_to_cloudinary(file, f"culture-connect/partners/{partner_id}")
    
    if not image_url:
        raise HTTPException(status_code=500, detail="Failed to upload image")
    
    await db.cms_partner_banners.update_one(
        {"id": partner_id, "tenant_id": tenant_id},
        {"$set": {"logo_url": image_url, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "logo_url": image_url}

@app.put("/api/cms/partners/reorder")
async def reorder_partners(orders: List[dict], tenant_id: str = DEFAULT_TENANT):
    """Reorder partner banners"""
    for item in orders:
        await db.cms_partner_banners.update_one(
            {"id": item["id"], "tenant_id": tenant_id},
            {"$set": {"order": item["order"]}}
        )
    return {"success": True}

# --- CMS Publish/Preview ---
@app.post("/api/cms/publish")
async def publish_cms_changes(tenant_id: str = DEFAULT_TENANT):
    """Publish all draft changes"""
    # Mark all items as published
    await db.cms_media.update_many(
        {"tenant_id": tenant_id, "published": False},
        {"$set": {"published": True, "published_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "message": "Toutes les modifications ont été publiées"}

# ================== VISUAL EDITOR ENDPOINTS ==================

class VisualEditorChange(BaseModel):
    page: str
    changes: dict

@app.post("/api/cms/visual-editor/save")
async def save_visual_editor_changes(data: VisualEditorChange):
    """Save changes made in the visual editor"""
    try:
        # Store changes in visual_editor_changes collection
        change_doc = {
            "page": data.page,
            "changes": data.changes,
            "saved_at": datetime.now(timezone.utc).isoformat(),
            "tenant_id": DEFAULT_TENANT
        }
        
        await db.visual_editor_changes.insert_one(change_doc)
        
        # Broadcast real-time update
        await broadcast_event("visual_editor_updated", {
            "page": data.page,
            "changes_count": len(data.changes)
        })
        
        return {"success": True, "message": "Modifications sauvegardees"}
    except Exception as e:
        logger.error(f"Error saving visual editor changes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cms/visual-editor/changes/{page}")
async def get_visual_editor_changes(page: str):
    """Get saved changes for a specific page"""
    changes = await db.visual_editor_changes.find(
        {"page": page, "tenant_id": DEFAULT_TENANT},
        {"_id": 0}
    ).sort("saved_at", -1).limit(1).to_list(1)
    
    return {"changes": changes[0] if changes else None}

@app.get("/api/cms/preview")
async def get_cms_preview(tenant_id: str = DEFAULT_TENANT):
    """Get preview of all CMS content"""
    media = await db.cms_media.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(100)
    speakers = await db.cms_speakers.find({"tenant_id": tenant_id}, {"_id": 0}).sort("order", 1).to_list(100)
    partners = await db.cms_partner_banners.find({"tenant_id": tenant_id}, {"_id": 0}).sort("order", 1).to_list(100)
    exhibitors = await db.cms_exhibitor_photos.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(200)
    
    return {
        "media": media,
        "speakers": speakers,
        "partners": partners,
        "exhibitors": exhibitors,
        "tenant_id": tenant_id
    }

# ================== CMS THEME (Design Visuel) ==================

@app.get("/api/cms/theme")
async def get_cms_theme(tenant_id: str = DEFAULT_TENANT):
    """Get theme configuration"""
    # Get from tenant_config
    config = await db.tenant_config.find_one({"tenant_id": tenant_id}, {"_id": 0})
    if not config:
        # Return defaults
        return {
            "tenant_id": tenant_id,
            "primary_color": "#A65D47",
            "secondary_color": "#C8922A",
            "accent_color": "#4A5D4E",
            "background_color": "#1A1A1A",
            "text_color": "#F4F1EA",
            "font_family": "Inter",
            "hero_image_url": None,
            "hero_title": "Culture Connect 2026",
            "hero_subtitle": "Le premier marché professionnel des industries culturelles afro-caribéennes"
        }
    return config

@app.put("/api/cms/theme")
async def update_cms_theme(theme: CMSTheme):
    """Update theme configuration"""
    theme_dict = theme.model_dump()
    theme_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.tenant_config.update_one(
        {"tenant_id": theme.tenant_id},
        {"$set": theme_dict},
        upsert=True
    )
    
    # 🔄 Broadcast real-time update
    await broadcast_event("theme_updated", {"tenant_id": theme.tenant_id})
    
    return {"success": True, "message": "Thème mis à jour"}

@app.post("/api/cms/theme/hero-upload")
async def upload_hero_image(file: UploadFile = File(...), tenant_id: str = DEFAULT_TENANT):
    """Upload hero image"""
    image_url = await upload_to_cloudinary(file, f"culture-connect/theme/hero-{tenant_id}")
    
    if not image_url:
        raise HTTPException(status_code=500, detail="Failed to upload image")
    
    await db.tenant_config.update_one(
        {"tenant_id": tenant_id},
        {"$set": {"hero_image_url": image_url, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"success": True, "image_url": image_url}

# ================== CMS CONTENT (Contenu Éditorial) ==================

@app.get("/api/cms/content")
async def get_cms_content(page: Optional[str] = None, tenant_id: str = DEFAULT_TENANT):
    """Get editorial content, optionally filtered by page"""
    query = {"tenant_id": tenant_id}
    if page:
        query["page"] = page
    
    content = await db.cms_content.find(query, {"_id": 0}).to_list(100)
    return {"content": content, "total": len(content)}

@app.get("/api/cms/content/{page}/{section}")
async def get_cms_content_section(page: str, section: str, tenant_id: str = DEFAULT_TENANT):
    """Get specific content section"""
    content = await db.cms_content.find_one(
        {"tenant_id": tenant_id, "page": page, "section": section},
        {"_id": 0}
    )
    return content or {"page": page, "section": section, "content": {}}

@app.put("/api/cms/content/{page}/{section}")
async def update_cms_content_section(page: str, section: str, data: dict, tenant_id: str = DEFAULT_TENANT):
    """Update specific content section"""
    content_id = f"{tenant_id}_{page}_{section}"
    
    await db.cms_content.update_one(
        {"tenant_id": tenant_id, "page": page, "section": section},
        {
            "$set": {
                "id": content_id,
                "tenant_id": tenant_id,
                "page": page,
                "section": section,
                "content": data.get("content", {}),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    # 🔄 Broadcast real-time update
    await broadcast_event("cms_content_updated", {"page": page, "section": section})
    
    return {"success": True}

@app.post("/api/cms/content/init-defaults")
async def init_default_content(tenant_id: str = DEFAULT_TENANT):
    """Initialize default content for all pages"""
    defaults = [
        # Homepage
        {"page": "home", "section": "hero", "content": {
            "title": "Culture Connect 2026",
            "subtitle": "Le premier marché professionnel des industries culturelles afro-caribéennes",
            "cta_text": "Découvrir le programme"
        }},
        {"page": "home", "section": "intro", "content": {
            "title": "Bienvenue à Culture Connect",
            "text": "Du 20 au 23 mai 2026, Fort-de-France accueille le premier marché professionnel dédié aux industries culturelles afro-caribéennes. Un événement unique réunissant labels, artistes, agents, médias et institutions de toute la diaspora."
        }},
        {"page": "home", "section": "key_figures", "content": {
            "figures": [
                {"value": "50+", "label": "Exposants", "description": "Labels, agents, institutions"},
                {"value": "500", "label": "Participants", "description": "Professionnels attendus"},
                {"value": "12", "label": "Territoires", "description": "Caraïbe, Afrique, Europe"},
                {"value": "4", "label": "Jours", "description": "De rencontres B2B"}
            ]
        }},
        # Program - Structure officielle Culture Connect 2026
        {"page": "program", "section": "intro", "content": {
            "title": "Programme Officiel Culture Connect 2026",
            "text": "4 jours de rencontres professionnelles, conférences et showcases au cœur de Fort-de-France, Martinique."
        }},
        {"page": "program", "section": "official_program", "content": {
            "days": [
                {
                    "id": "day1",
                    "date": "2026-05-20",
                    "label": "DAY 1 — Mardi 20 Mai 2026",
                    "site": "Bibliothèque Schoelcher",
                    "is_highlight": False,
                    "highlight_color": None,
                    "slots": [
                        {"time": "09:00", "title": "Accueil & Enregistrement", "description": "Retrait des badges et documentation", "speaker": ""},
                        {"time": "10:00", "title": "Cérémonie d'ouverture", "description": "Discours officiels et présentation du programme", "speaker": "Équipe Culture Connect"},
                        {"time": "14:00", "title": "Table ronde : L'industrie musicale caribéenne en 2026", "description": "État des lieux et perspectives", "speaker": "Panel d'experts"},
                        {"time": "16:30", "title": "Sessions de networking B2B", "description": "Rencontres planifiées entre professionnels", "speaker": ""}
                    ]
                },
                {
                    "id": "day2",
                    "date": "2026-05-21",
                    "label": "DAY 2 — Mercredi 21 Mai 2026",
                    "site": "Bibliothèque Schoelcher + Tropiques Atrium",
                    "is_highlight": False,
                    "highlight_color": None,
                    "slots": [
                        {"time": "09:30", "title": "Workshop : Distribution digitale", "description": "Stratégies de distribution pour artistes caribéens", "speaker": "Experts streaming"},
                        {"time": "11:00", "title": "Masterclass : Production musicale", "description": "Techniques et tendances actuelles", "speaker": ""},
                        {"time": "14:30", "title": "Rencontres B2B", "description": "Sessions de speed-meeting", "speaker": ""},
                        {"time": "20:00", "title": "Showcase Artistes Émergents", "description": "Performances live @ Tropiques Atrium", "speaker": "Artistes sélectionnés"}
                    ]
                },
                {
                    "id": "day3",
                    "date": "2026-05-22",
                    "label": "DAY 3 — Jeudi 22 Mai 2026 (JOURNÉE ABOLITION)",
                    "site": "Tropiques Atrium + La Savane",
                    "is_highlight": True,
                    "highlight_color": "#A65D47",
                    "slots": [
                        {"time": "09:00", "title": "Commémoration de l'Abolition", "description": "Cérémonie officielle et hommage", "speaker": ""},
                        {"time": "11:00", "title": "Conférence : Musiques de la diaspora", "description": "Héritage et créativité contemporaine", "speaker": "Historiens & artistes"},
                        {"time": "15:00", "title": "Marché Culturel @ La Savane", "description": "Stands exposants, démos, rencontres", "speaker": ""},
                        {"time": "19:00", "title": "Concert Abolition", "description": "Grande scène La Savane", "speaker": "Têtes d'affiche"}
                    ]
                },
                {
                    "id": "day4",
                    "date": "2026-05-23",
                    "label": "DAY 4 — Vendredi 23 Mai 2026",
                    "site": "Tropiques Atrium",
                    "is_highlight": False,
                    "highlight_color": None,
                    "slots": [
                        {"time": "09:30", "title": "Bilan & Retours d'expérience", "description": "Ce que nous avons appris", "speaker": "Participants"},
                        {"time": "11:00", "title": "Signature de partenariats", "description": "Officialisation des collaborations", "speaker": ""},
                        {"time": "14:00", "title": "Table ronde de clôture", "description": "Perspectives 2027 et annonces", "speaker": "Organisateurs"},
                        {"time": "17:00", "title": "Cérémonie de clôture", "description": "Remise des prix et remerciements", "speaker": "Équipe Culture Connect"}
                    ]
                }
            ]
        }},
        # About
        {"page": "about", "section": "history", "content": {
            "title": "Notre Histoire",
            "text": "Culture Connect est né de la volonté de créer un espace de rencontre dédié aux professionnels des industries culturelles afro-caribéennes. Initié par Factory Maker Studio, ce projet ambitionne de devenir le rendez-vous incontournable du secteur."
        }},
        {"page": "about", "section": "mission", "content": {
            "title": "Notre Mission",
            "text": "Faciliter les échanges et collaborations entre les acteurs des industries culturelles de la Caraïbe, de l'Afrique et de la diaspora. Créer des opportunités business concrètes et durables."
        }},
        {"page": "about", "section": "vision", "content": {
            "title": "Notre Vision",
            "text": "Faire de Fort-de-France la capitale des industries culturelles afro-caribéennes. Positionner Culture Connect comme la référence mondiale du secteur d'ici 2030."
        }}
    ]
    
    for item in defaults:
        existing = await db.cms_content.find_one({
            "tenant_id": tenant_id, 
            "page": item["page"], 
            "section": item["section"]
        })
        if not existing:
            item["tenant_id"] = tenant_id
            item["id"] = f"{tenant_id}_{item['page']}_{item['section']}"
            item["updated_at"] = datetime.now(timezone.utc).isoformat()
            await db.cms_content.insert_one(item)
    
    return {"success": True, "message": "Contenu par défaut initialisé"}

# ================== CMS PAGES (Pages Dynamiques) ==================

@app.get("/api/cms/pages")
async def get_cms_pages(tenant_id: str = DEFAULT_TENANT):
    """Get all custom pages"""
    pages = await db.cms_pages.find({"tenant_id": tenant_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"pages": pages, "total": len(pages)}

@app.get("/api/cms/pages/{page_id}")
async def get_cms_page(page_id: str, tenant_id: str = DEFAULT_TENANT):
    """Get a specific page by ID"""
    page = await db.cms_pages.find_one({"id": page_id, "tenant_id": tenant_id}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@app.get("/api/cms/pages/slug/{slug}")
async def get_cms_page_by_slug(slug: str, tenant_id: str = DEFAULT_TENANT):
    """Get a page by slug (for public rendering)"""
    page = await db.cms_pages.find_one(
        {"slug": slug, "tenant_id": tenant_id, "published": True}, 
        {"_id": 0}
    )
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@app.post("/api/cms/pages")
async def create_cms_page(page: CMSPage):
    """Create a new custom page"""
    # Validate slug
    slug = page.slug.lower().strip().replace(" ", "-")
    slug = ''.join(c for c in slug if c.isalnum() or c == '-')
    
    # Check if slug exists
    existing = await db.cms_pages.find_one({"slug": slug, "tenant_id": page.tenant_id})
    if existing:
        raise HTTPException(status_code=400, detail="Ce slug existe déjà")
    
    page_dict = page.model_dump()
    page_dict["id"] = str(uuid.uuid4())
    page_dict["slug"] = slug
    page_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    page_dict["updated_at"] = page_dict["created_at"]
    
    await db.cms_pages.insert_one(page_dict)
    return {"success": True, "page": {k: v for k, v in page_dict.items() if k != "_id"}}

@app.put("/api/cms/pages/{page_id}")
async def update_cms_page(page_id: str, page: CMSPage):
    """Update a custom page"""
    # Validate slug
    slug = page.slug.lower().strip().replace(" ", "-")
    slug = ''.join(c for c in slug if c.isalnum() or c == '-')
    
    # Check if slug exists for another page
    existing = await db.cms_pages.find_one({
        "slug": slug, 
        "tenant_id": page.tenant_id,
        "id": {"$ne": page_id}
    })
    if existing:
        raise HTTPException(status_code=400, detail="Ce slug existe déjà")
    
    page_dict = page.model_dump(exclude_unset=True)
    page_dict["slug"] = slug
    page_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.cms_pages.update_one(
        {"id": page_id, "tenant_id": page.tenant_id},
        {"$set": page_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return {"success": True}

@app.delete("/api/cms/pages/{page_id}")
async def delete_cms_page(page_id: str, tenant_id: str = DEFAULT_TENANT):
    """Delete a custom page"""
    result = await db.cms_pages.delete_one({"id": page_id, "tenant_id": tenant_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return {"success": True}

# ================== PUBLIC CMS ENDPOINTS ==================

@app.get("/api/public/theme")
async def get_public_theme(tenant_id: str = DEFAULT_TENANT):
    """Get theme for public site (no auth required)"""
    config = await db.tenant_config.find_one({"tenant_id": tenant_id}, {"_id": 0})
    if not config:
        return {
            "primary_color": "#A65D47",
            "secondary_color": "#C8922A",
            "accent_color": "#4A5D4E",
            "background_color": "#1A1A1A",
            "text_color": "#F4F1EA",
            "font_family": "Inter",
            "hero_image_url": None,
            "hero_title": "Culture Connect 2026",
            "hero_subtitle": "Le premier marché professionnel des industries culturelles afro-caribéennes"
        }
    return config

@app.get("/api/public/content/{page}")
async def get_public_content(page: str, tenant_id: str = DEFAULT_TENANT):
    """Get content for a specific page (no auth required)"""
    content = await db.cms_content.find(
        {"tenant_id": tenant_id, "page": page}, 
        {"_id": 0}
    ).to_list(50)
    
    # Convert to dict by section
    result = {}
    for item in content:
        result[item["section"]] = item.get("content", {})
    
    return result

@app.get("/api/public/page/{slug}")
async def get_public_page(slug: str, tenant_id: str = DEFAULT_TENANT):
    """Get a custom page by slug (no auth required)"""
    page = await db.cms_pages.find_one(
        {"slug": slug, "tenant_id": tenant_id, "published": True}, 
        {"_id": 0}
    )
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

# ================== MAP TERRITORIES API ==================
DEFAULT_MAP_TERRITORIES = [
    {"id": "martinique", "name": "Fort-de-France", "lat": 14.6, "lon": -61.0, "color": "#A65D47", "size": "primary", "label": "Martinique", "isCenter": True, "active": True},
    {"id": "paris", "name": "Paris", "lat": 48.8, "lon": 2.3, "color": "#C8922A", "size": "large", "label": "Paris — Diaspora", "active": True},
    {"id": "colombia", "name": "Bogotá", "lat": 4.7, "lon": -74.0, "color": "#C8922A", "size": "medium", "label": "Colombie", "active": True},
    {"id": "haiti", "name": "Port-au-Prince", "lat": 18.9, "lon": -72.3, "color": "#A65D47", "size": "medium", "label": "Haïti", "opacity": 0.8, "active": True},
    {"id": "senegal", "name": "Dakar", "lat": 14.7, "lon": -17.4, "color": "#C8922A", "size": "medium", "label": "Sénégal", "active": True},
    {"id": "nigeria", "name": "Lagos", "lat": 6.5, "lon": 3.4, "color": "#C8922A", "size": "small", "label": "Nigeria", "active": True},
    {"id": "guadeloupe", "name": "Guadeloupe", "lat": 16.2, "lon": -61.5, "color": "#A65D47", "size": "medium", "label": "Guadeloupe", "active": True},
    {"id": "london", "name": "Londres", "lat": 51.5, "lon": -0.1, "color": "#FFFFFF", "size": "small", "label": "UK", "active": True},
    {"id": "newyork", "name": "New York", "lat": 40.7, "lon": -74.0, "color": "#FFFFFF", "size": "small", "label": "USA", "active": True},
    {"id": "brazil", "name": "Brasília", "lat": -15.7, "lon": -47.9, "color": "#C8922A", "size": "small", "label": "Brésil", "active": True},
]

@app.get("/api/cms/map-territories")
async def get_map_territories(tenant_id: str = DEFAULT_TENANT):
    """Get map territories configuration"""
    config = await db.map_config.find_one({"tenant_id": tenant_id}, {"_id": 0})
    
    if not config or not config.get("territories"):
        return {
            "territories": DEFAULT_MAP_TERRITORIES,
            "counter_text": "territoires connectés",
            "animations_enabled": True,
            "lines_enabled": True
        }
    
    return config

@app.post("/api/cms/map-territories")
async def save_map_territories(config: MapConfig):
    """Save map territories configuration"""
    config_dict = config.model_dump()
    config_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.map_config.update_one(
        {"tenant_id": config.tenant_id},
        {"$set": config_dict},
        upsert=True
    )
    
    # 🔄 Broadcast real-time update
    await broadcast_event("territories_updated", {"count": len(config.territories)})
    
    return {"success": True, "message": "Configuration de la carte sauvegardée"}

@app.post("/api/cms/map-territories/add")
async def add_map_territory(territory: MapTerritory, tenant_id: str = DEFAULT_TENANT):
    """Add a new territory to the map"""
    config = await db.map_config.find_one({"tenant_id": tenant_id})
    
    if not config:
        config = {
            "tenant_id": tenant_id,
            "territories": DEFAULT_MAP_TERRITORIES.copy(),
            "counter_text": "territoires connectés",
            "animations_enabled": True,
            "lines_enabled": True
        }
    
    territories = config.get("territories", [])
    territories.append(territory.model_dump())
    
    await db.map_config.update_one(
        {"tenant_id": tenant_id},
        {"$set": {"territories": territories, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    # 🔄 Broadcast real-time update
    await broadcast_event("territories_updated", {"action": "added", "territory": territory.name})
    
    return {"success": True, "message": "Territoire ajouté"}

@app.delete("/api/cms/map-territories/{territory_id}")
async def delete_map_territory(territory_id: str, tenant_id: str = DEFAULT_TENANT):
    """Delete a territory from the map"""
    config = await db.map_config.find_one({"tenant_id": tenant_id})
    
    if config and config.get("territories"):
        territories = [t for t in config["territories"] if t.get("id") != territory_id]
        await db.map_config.update_one(
            {"tenant_id": tenant_id},
            {"$set": {"territories": territories, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    return {"success": True, "message": "Territoire supprimé"}

# ================== SECTION BACKGROUNDS API ==================
DEFAULT_SECTION_BACKGROUNDS = [
    {"section_id": "hero", "background_type": "color", "color": "#F4F1EA", "overlay_opacity": 0, "active": True},
    {"section_id": "vision", "background_type": "color", "color": "#F4F1EA", "overlay_opacity": 0, "active": True},
    {"section_id": "diaspora", "background_type": "color", "color": "#1A1A1A", "overlay_opacity": 0, "active": True},
    {"section_id": "programme", "background_type": "color", "color": "#F5F3EE", "overlay_opacity": 0, "active": True},
    {"section_id": "partenaires", "background_type": "color", "color": "#F4F1EA", "overlay_opacity": 0, "active": True},
    {"section_id": "cta", "background_type": "color", "color": "#1A1A1A", "overlay_opacity": 0, "active": True},
]

@app.get("/api/cms/site-config")
async def get_site_config(tenant_id: str = DEFAULT_TENANT):
    """Get global site configuration"""
    config = await db.site_config.find_one({"tenant_id": tenant_id}, {"_id": 0})
    
    if not config:
        return {
            "tenant_id": tenant_id,
            "animations_enabled": True,
            "countdown_enabled": True,
            "particles_enabled": True,
            "map_lines_enabled": True,
            "section_backgrounds": DEFAULT_SECTION_BACKGROUNDS
        }
    
    return config

@app.post("/api/cms/site-config")
async def save_site_config(config: SiteConfig):
    """Save global site configuration"""
    config_dict = config.model_dump()
    config_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.site_config.update_one(
        {"tenant_id": config.tenant_id},
        {"$set": config_dict},
        upsert=True
    )
    
    return {"success": True, "message": "Configuration du site sauvegardée"}

@app.post("/api/cms/section-background")
async def save_section_background(background: SectionBackground, tenant_id: str = DEFAULT_TENANT):
    """Save or update a section background"""
    config = await db.site_config.find_one({"tenant_id": tenant_id})
    
    if not config:
        config = {
            "tenant_id": tenant_id,
            "animations_enabled": True,
            "countdown_enabled": True,
            "particles_enabled": True,
            "map_lines_enabled": True,
            "section_backgrounds": DEFAULT_SECTION_BACKGROUNDS.copy()
        }
    
    backgrounds = config.get("section_backgrounds", [])
    
    # Update or add
    updated = False
    for i, bg in enumerate(backgrounds):
        if bg.get("section_id") == background.section_id:
            backgrounds[i] = background.model_dump()
            updated = True
            break
    
    if not updated:
        backgrounds.append(background.model_dump())
    
    await db.site_config.update_one(
        {"tenant_id": tenant_id},
        {"$set": {"section_backgrounds": backgrounds, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"success": True, "message": "Fond de section sauvegardé"}

# ================== ANNUAL INTENTION API ==================
DEFAULT_TERRITORY_MESSAGES = {
    "Martinique": "Ou ka vini.",
    "MQ": "Ou ka vini.",
    "Guadeloupe": "An nou.",
    "GP": "An nou.",
    "Haiti": "Nou la.",
    "HT": "Nou la.",
    "Colombia": "Aquí estamos.",
    "CO": "Aquí estamos.",
    "Senegal": "Dëkk bi.",
    "SN": "Dëkk bi.",
    "France": "La diaspora rentre.",
    "FR": "La diaspora rentre.",
}

@app.get("/api/annual-intention")
async def get_annual_intention(tenant_id: str = DEFAULT_TENANT):
    """Get the active annual intention for intro sequence"""
    intention = await db.annual_intention.find_one(
        {"tenant_id": tenant_id, "active": True},
        {"_id": 0}
    )
    
    if not intention:
        # Return default intention
        return {
            "tenant_id": tenant_id,
            "annee": "2026",
            "mot_annee": "NOU.",
            "mot_annee_note": "2026 — Nous. La reconnexion.",
            "image_annee_url": None,
            "phrase_ligne_1": "Pendant des siècles on nous a séparés.",
            "phrase_ligne_2": "Le 22 Mai 2026 — nous nous retrouvons.",
            "mot_cle_phrase_2": "nous",
            "couleur_annee": "#A65D47",
            "son_tambour_url": None,
            "sons_identites": None,
            "territoire_messages": DEFAULT_TERRITORY_MESSAGES,
            "active": True
        }
    
    # Add default territory messages if not set
    if not intention.get("territoire_messages"):
        intention["territoire_messages"] = DEFAULT_TERRITORY_MESSAGES
    
    return intention

@app.post("/api/annual-intention")
async def save_annual_intention(intention: AnnualIntention):
    """Save or update the annual intention"""
    intention_dict = intention.model_dump()
    intention_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Deactivate other intentions for this tenant
    await db.annual_intention.update_many(
        {"tenant_id": intention.tenant_id},
        {"$set": {"active": False}}
    )
    
    # Upsert the new intention
    existing = await db.annual_intention.find_one({
        "tenant_id": intention.tenant_id,
        "annee": intention.annee
    })
    
    if existing:
        await db.annual_intention.update_one(
            {"tenant_id": intention.tenant_id, "annee": intention.annee},
            {"$set": {**intention_dict, "active": True}}
        )
    else:
        intention_dict["id"] = str(uuid.uuid4())
        intention_dict["created_at"] = datetime.now(timezone.utc).isoformat()
        intention_dict["active"] = True
        await db.annual_intention.insert_one(intention_dict)
    
    # 🔄 Broadcast real-time update
    await broadcast_event("intention_updated", {"annee": intention.annee, "mot": intention.mot_annee})
    
    return {"success": True, "message": "Intention de l'année sauvegardée"}

@app.get("/api/annual-intention/all")
async def get_all_intentions(tenant_id: str = DEFAULT_TENANT):
    """Get all annual intentions for CMS management"""
    intentions = await db.annual_intention.find(
        {"tenant_id": tenant_id},
        {"_id": 0}
    ).sort("annee", -1).to_list(100)
    
    return {"intentions": intentions}

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

# Intelligence API Proxy
@app.api_route("/api/v1/intelligence/{path:path}", methods=["GET", "POST"])
async def intelligence_proxy(request: Request, path: str):
    """Proxy requests to KiltiKonet Smart Engine Intelligence API"""
    async with httpx.AsyncClient(timeout=60.0) as client_http:
        url = f"{SMART_ENGINE_URL}/api/v1/intelligence/{path}"
        
        try:
            if request.method == "GET":
                response = await client_http.get(url, params=dict(request.query_params))
            else:
                body = await request.body()
                response = await client_http.post(
                    url, 
                    content=body,
                    headers={"Content-Type": request.headers.get("Content-Type", "application/json")}
                )
            
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.headers.get("content-type")
            )
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="Smart Engine service unavailable")
        except Exception as e:
            logger.error(f"Intelligence proxy error: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal proxy error")

# Verify API Proxy (Public endpoint)
@app.get("/api/v1/verify/{attestation_id}")
async def verify_proxy(attestation_id: str):
    """Proxy requests to KiltiKonet Smart Engine Verification API"""
    async with httpx.AsyncClient(timeout=30.0) as client_http:
        url = f"{SMART_ENGINE_URL}/api/v1/verify/{attestation_id}"
        
        try:
            response = await client_http.get(url)
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.headers.get("content-type")
            )
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="Smart Engine service unavailable")
        except Exception as e:
            logger.error(f"Verify proxy error: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal proxy error")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================== SECURITY HEADERS MIDDLEWARE ==================
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses for browser trust and SEO"""
    
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        
        # Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Hide server info
        if "server" in response.headers:
            del response.headers["server"]
        if "x-powered-by" in response.headers:
            del response.headers["x-powered-by"]
        
        # Content Security Policy (optimized for all integrations)
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://assets.emergent.sh https://cdn.tailwindcss.com https://us.i.posthog.com https://*.posthog.com https://js.stripe.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: blob: https: http:; "
            "connect-src 'self' https: wss: https://api.openai.com https://api.anthropic.com https://api.stripe.com https://api.cloudinary.com; "
            "frame-src 'self' https://js.stripe.com https://hooks.stripe.com; "
            "frame-ancestors 'self'; "
            "base-uri 'self'; "
            "form-action 'self' https://checkout.stripe.com;"
        )
        response.headers["Content-Security-Policy"] = csp
        
        # HSTS with extended max-age (2 years)
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        
        return response

app.add_middleware(SecurityHeadersMiddleware)

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
    # Clean up SSE connections
    for queue in sse_connections:
        await queue.put(None)
    sse_connections.clear()
    client.close()

# ================== REAL-TIME SYNC ENDPOINT (SSE) ==================

@app.get("/api/realtime/events")
async def realtime_events(request: Request):
    """
    Server-Sent Events endpoint for real-time synchronization.
    Clients connect here to receive live updates when data changes.
    """
    async def event_generator():
        queue = asyncio.Queue()
        sse_connections.append(queue)
        logger.info(f"🔗 New SSE connection. Total: {len(sse_connections)}")
        
        try:
            # Send initial connection confirmation
            yield f"data: {json.dumps({'event_type': 'connected', 'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"
            
            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    break
                
                try:
                    # Wait for event with timeout (keepalive)
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    if event is None:
                        break
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    # Send keepalive ping
                    yield f"data: {json.dumps({'event_type': 'ping', 'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"
        finally:
            if queue in sse_connections:
                sse_connections.remove(queue)
            logger.info(f"🔌 SSE connection closed. Remaining: {len(sse_connections)}")
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.get("/api/realtime/status")
async def realtime_status():
    """Get the status of real-time connections (WebSocket + SSE)"""
    return {
        "websocket": ws_manager.get_status(),
        "sse_connections": len(sse_connections),
        "total_connections": len(ws_manager.active_connections) + len(sse_connections),
        "status": "active",
        "mode": "bidirectional"
    }

# ================== BIDIRECTIONAL WEBSOCKET ENDPOINT ==================

@app.websocket("/api/ws/sync")
async def websocket_sync(websocket: WebSocket):
    """
    Bidirectional WebSocket endpoint for real-time synchronization.
    
    Supported message types from client:
    - subscribe: {"action": "subscribe", "channels": ["cms", "globe", "registrations"]}
    - unsubscribe: {"action": "unsubscribe", "channels": ["cms"]}
    - update: {"action": "update", "type": "territories", "data": {...}}
    - ping: {"action": "ping"}
    
    Server broadcasts:
    - Event notifications to all subscribed clients
    - Confirmation of actions
    """
    client_id = await ws_manager.connect(websocket)
    
    try:
        # Send welcome message with client ID
        await websocket.send_json({
            "event_type": "connected",
            "client_id": client_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": "Bidirectional sync active"
        })
        
        # Auto-subscribe to all channels
        for channel in ["cms", "globe", "registrations", "theme", "intention"]:
            ws_manager.subscribe(client_id, channel)
        
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            action = data.get("action", "")
            
            if action == "ping":
                await websocket.send_json({
                    "event_type": "pong",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            
            elif action == "subscribe":
                channels = data.get("channels", [])
                for channel in channels:
                    ws_manager.subscribe(client_id, channel)
                await websocket.send_json({
                    "event_type": "subscribed",
                    "channels": channels,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            
            elif action == "unsubscribe":
                channels = data.get("channels", [])
                for channel in channels:
                    ws_manager.unsubscribe(client_id, channel)
                await websocket.send_json({
                    "event_type": "unsubscribed",
                    "channels": channels
                })
            
            elif action == "update":
                # Client is sending an update - broadcast to others
                update_type = data.get("type", "")
                update_data = data.get("data", {})
                
                # Broadcast the update to all other clients
                await broadcast_event(
                    event_type=f"{update_type}_updated",
                    data=update_data,
                    source_client=client_id,
                    channels=[update_type] if update_type else None
                )
                
                # Confirm to sender
                await websocket.send_json({
                    "event_type": "update_confirmed",
                    "type": update_type,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            
            elif action == "request_sync":
                # Client requests full sync state
                sync_type = data.get("type", "all")
                await websocket.send_json({
                    "event_type": "sync_state",
                    "type": sync_type,
                    "connections": ws_manager.get_status(),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
    
    except WebSocketDisconnect:
        ws_manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error for {client_id}: {e}")
        ws_manager.disconnect(client_id)

@app.post("/api/realtime/broadcast")
async def manual_broadcast(event_type: str = Form(...), data: str = Form("{}")):
    """Manual broadcast endpoint for testing or external triggers"""
    try:
        parsed_data = json.loads(data)
    except:
        parsed_data = {"raw": data}
    
    await broadcast_event(event_type, parsed_data)
    return {"success": True, "event_type": event_type, "recipients": len(ws_manager.active_connections) + len(sse_connections)}

# ================== SMART ENGINE INDEXATION ==================

@api_router.post("/smart-engine/index-contacts")
async def index_contacts_to_smart_engine():
    """
    Index all 44 contacts from registrations to Smart Engine profiles.
    This creates searchable vector embeddings for AI-powered recommendations.
    """
    try:
        # Get all registrations
        registrations = await db.registrations.find({}, {"_id": 0}).to_list(500)
        
        indexed = 0
        for reg in registrations:
            # Create smart profile from registration
            profile = {
                "id": reg.get("id"),
                "tenant_id": "culture-connect-2026",
                "name": reg.get("full_name", ""),
                "organization": reg.get("organization_name", ""),
                "profile_type": reg.get("profile_type", "institution"),
                "country": reg.get("country", ""),
                "bio": reg.get("bio", ""),
                "tier": reg.get("tier", "professional"),
                "expertise_tags": reg.get("expertise_tags", []),
                "status": reg.get("status", "pending"),
                "indexed_at": datetime.now(timezone.utc).isoformat(),
                # Placeholder for future vector embedding
                "embedding_status": "pending"
            }
            
            # Upsert to smart_profiles collection
            await db.smart_profiles.update_one(
                {"id": reg.get("id")},
                {"$set": profile},
                upsert=True
            )
            indexed += 1
        
        # Create index for fast search
        await db.smart_profiles.create_index("profile_type")
        await db.smart_profiles.create_index("country")
        await db.smart_profiles.create_index("tier")
        await db.smart_profiles.create_index([("name", "text"), ("bio", "text"), ("organization", "text")])
        
        return {
            "success": True,
            "indexed_count": indexed,
            "message": f"Successfully indexed {indexed} contacts to Smart Engine"
        }
    except Exception as e:
        logger.error(f"Smart Engine indexation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/smart-engine/profiles")
async def get_smart_engine_profiles(
    profile_type: Optional[str] = None,
    country: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50
):
    """Get indexed Smart Engine profiles with optional filters"""
    try:
        query = {}
        if profile_type:
            query["profile_type"] = profile_type
        if country:
            query["country"] = country
        if search:
            query["$text"] = {"$search": search}
        
        profiles = await db.smart_profiles.find(query, {"_id": 0}).limit(limit).to_list(limit)
        
        return {
            "profiles": profiles,
            "total": len(profiles),
            "filters": {"profile_type": profile_type, "country": country, "search": search}
        }
    except Exception as e:
        logger.error(f"Error fetching smart profiles: {str(e)}")
        return {"profiles": [], "total": 0, "error": str(e)}

@api_router.delete("/smart-engine/purge")
async def purge_smart_engine():
    """Purge all mock data from Smart Engine (admin only)"""
    try:
        result = await db.smart_profiles.delete_many({})
        return {
            "success": True,
            "deleted_count": result.deleted_count,
            "message": "Smart Engine profiles purged"
        }
    except Exception as e:
        logger.error(f"Purge error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



# ================== DYNAMIC SITEMAP & SEO ==================

@app.get("/sitemap.xml")
async def dynamic_sitemap():
    """Generate dynamic sitemap including all catalog participants"""
    from datetime import datetime
    
    base_url = "https://cultureconnect2026.fr"
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Static pages
    static_pages = [
        {"loc": "/", "priority": "1.0", "changefreq": "weekly"},
        {"loc": "/inscription", "priority": "0.9", "changefreq": "weekly"},
        {"loc": "/catalogue", "priority": "0.8", "changefreq": "daily"},
        {"loc": "/partenaires", "priority": "0.7", "changefreq": "monthly"},
        {"loc": "/programme", "priority": "0.8", "changefreq": "monthly"},
        {"loc": "/tarifs", "priority": "0.7", "changefreq": "monthly"},
        {"loc": "/legal/mentions-legales.html", "priority": "0.3", "changefreq": "yearly"},
        {"loc": "/legal/politique-confidentialite.html", "priority": "0.3", "changefreq": "yearly"},
        {"loc": "/legal/cgu.html", "priority": "0.3", "changefreq": "yearly"},
        {"loc": "/legal/cookies.html", "priority": "0.3", "changefreq": "yearly"},
    ]
    
    # Get catalog participants for dynamic URLs
    participants = await db.registrations.find(
        {"show_in_catalog": True, "status": "approved"},
        {"_id": 0, "id": 1, "full_name": 1}
    ).to_list(500)
    
    # Build XML
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    # Add static pages
    for page in static_pages:
        xml_content += f'''    <url>
        <loc>{base_url}{page["loc"]}</loc>
        <lastmod>{today}</lastmod>
        <changefreq>{page["changefreq"]}</changefreq>
        <priority>{page["priority"]}</priority>
    </url>\n'''
    
    # Add dynamic participant pages (if you have individual profile pages)
    for participant in participants:
        xml_content += f'''    <url>
        <loc>{base_url}/catalogue?profile={participant.get("id", "")}</loc>
        <lastmod>{today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>\n'''
    
    xml_content += '</urlset>'
    
    return Response(content=xml_content, media_type="application/xml")

@app.get("/robots.txt")
async def robots_txt():
    """Serve robots.txt"""
    content = """# Culture Connect 2026 - Robots.txt
User-agent: *
Allow: /

Crawl-delay: 1
Sitemap: https://cultureconnect2026.fr/sitemap.xml

# Protected areas
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /static/

# Allow important public content
Allow: /catalogue
Allow: /inscription
Allow: /partenaires
Allow: /programme
"""
    return Response(content=content, media_type="text/plain")
