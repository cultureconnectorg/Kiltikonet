from fastapi import FastAPI, APIRouter, File, UploadFile, Form, HTTPException, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import io
import csv
import asyncio
import cloudinary
import cloudinary.uploader
import resend

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

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Tier info for emails
TIER_INFO = {
    "emerging": {"name": "Émergent", "price": "50€"},
    "professional": {"name": "Professionnel", "price": "150€"},
    "institutional": {"name": "Institutionnel", "price": "300€"}
}

# Email templates
def get_confirmation_email(name: str, tier: str, email: str) -> str:
    tier_data = TIER_INFO.get(tier, TIER_INFO["professional"])
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
                <img src="https://res.cloudinary.com/dnabomyak/image/upload/v1/culture-connect/logo.png" alt="Culture Connect 2026" style="height: 60px;" onerror="this.style.display='none'">
                <h2 style="margin: 10px 0 0 0; color: #1A1A1A; font-size: 18px;">Culture Connect 2026</h2>
            </div>
            <div class="content">
                <h1>Demande d'accréditation reçue</h1>
                <p>Bonjour <span class="highlight">{name}</span>,</p>
                <p>Nous avons bien reçu votre demande d'accréditation pour <strong>Culture Connect 2026</strong>.</p>
                <p>
                    <strong>Formule choisie :</strong><br>
                    <span class="badge">{tier_data['name']} — {tier_data['price']}</span>
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
    tier_data = TIER_INFO.get(tier, TIER_INFO["professional"])
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
                <img src="https://res.cloudinary.com/dnabomyak/image/upload/v1/culture-connect/logo.png" alt="Culture Connect 2026" style="height: 60px;" onerror="this.style.display='none'">
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
                <img src="https://res.cloudinary.com/dnabomyak/image/upload/v1/culture-connect/logo.png" alt="Culture Connect 2026" style="height: 60px;" onerror="this.style.display='none'">
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

# Models
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

# Routes
@api_router.get("/")
async def root():
    return {"message": "Culture Connect 2026 API"}

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
    
    # Upload logo to Cloudinary
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
    
    # Send confirmation email asynchronously (non-blocking)
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
    
    # Get registration first to get email and name
    registration = await db.registrations.find_one({"id": registration_id}, {"_id": 0})
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    # Get previous status
    previous_status = registration.get("status")
    
    result = await db.registrations.update_one(
        {"id": registration_id},
        {"$set": {"status": status_update.status}}
    )
    
    # Send email notification if status changed to approved or rejected
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
    
    return {"success": True, "status": status_update.status}

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
    """Admin endpoint to manually add a participant"""
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
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.registrations.insert_one(registration)
    
    return RegistrationResponse(**registration)

@api_router.get("/catalog")
async def get_catalog_entries():
    """Get only registrations that are approved and visible in catalog"""
    registrations = await db.registrations.find(
        {"show_in_catalog": True},
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

# Include the router in the main app
app.include_router(api_router)

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
