from fastapi import FastAPI, APIRouter, File, UploadFile, Form, HTTPException, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import io
import csv
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Upload directory for files
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

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
    logo_filename: Optional[str] = None
    language_preference: str
    how_heard: str
    status: str = "pending"
    show_in_catalog: bool = False
    created_at: str

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
    logo: Optional[UploadFile] = File(None)
):
    registration_id = str(uuid.uuid4())
    logo_filename = None
    
    # Handle file upload
    if logo and logo.filename:
        file_ext = logo.filename.split('.')[-1] if '.' in logo.filename else 'png'
        logo_filename = f"{registration_id}.{file_ext}"
        file_path = UPLOAD_DIR / logo_filename
        content = await logo.read()
        with open(file_path, "wb") as f:
            f.write(content)
    
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
        "logo_filename": logo_filename,
        "language_preference": language_preference,
        "how_heard": how_heard,
        "status": "pending",
        "show_in_catalog": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.registrations.insert_one(registration)
    
    return RegistrationResponse(**registration)

@api_router.get("/registrations", response_model=RegistrationListResponse)
async def get_registrations(
    profile_type: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    stand_request: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    # Build filter
    filter_query = {}
    if profile_type:
        filter_query["profile_type"] = profile_type
    if country:
        filter_query["country"] = country
    if stand_request is not None and stand_request != "":
        filter_query["stand_request"] = stand_request.lower() == "true"
    if status:
        filter_query["status"] = status
    
    # Get registrations
    registrations = await db.registrations.find(filter_query, {"_id": 0}).to_list(1000)
    
    # Get counts by profile type
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
    
    result = await db.registrations.update_one(
        {"id": registration_id},
        {"$set": {"status": status_update.status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    
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
        "profile_type", "stand_request", "stand_category", "bio",
        "language_preference", "how_heard", "status", "created_at"
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
