"""
Shared Workspace Routes — Artistes, Prestataires, Tasks, Partners, Expenses, Contacts, Planning
Extracted from server.py for maintainability.
"""
import os
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/api/shared", tags=["shared"])

_client = AsyncIOMotorClient(os.environ.get("MONGO_URL", ""))
_db = _client[os.environ.get("DB_NAME", "culture_connect_2026")]

# ═══════════ MODELS ═══════════

class ArtisteModel(BaseModel):
    id: Optional[str] = None
    name: str
    genre: str = ""
    status: str = "À contacter"
    contrat: str = "Non signé"
    cachet: str = ""
    rider: bool = False
    horaire: str = ""
    email: str = ""
    phone: str = ""
    created_by: str = ""
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class PrestataireModel(BaseModel):
    id: Optional[str] = None
    name: str
    type: str
    status: str = "À contacter"
    devis: str = ""
    contact: str = ""
    email: str = ""
    phone: str = ""
    validated: bool = False
    created_by: str = ""
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class TaskModel(BaseModel):
    id: Optional[str] = None
    title: str
    description: str = ""
    status: str = "a_faire"
    priority: str = "moyenne"
    deadline: str = ""
    assigned_to: str = ""
    created_by: str = ""
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class PartnerModel(BaseModel):
    id: Optional[str] = None
    name: str
    type: str = "Bronze"
    status: str = "Prospect"
    contact: str = ""
    email: str = ""
    phone: str = ""
    lastAction: str = ""
    nextAction: str = "Premier contact"
    logo_url: Optional[str] = None
    created_by: str = ""
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ExpenseModel(BaseModel):
    id: Optional[str] = None
    label: str
    montant: float
    category: str
    fournisseur: str = ""
    justificatif: bool = False
    date: str = ""
    created_by: str = ""
    created_at: Optional[str] = None

class ContactModel(BaseModel):
    id: Optional[str] = None
    prenom: str
    nom: str
    email: str = ""
    phone: str = ""
    organisation: str = ""
    fonction: str = ""
    categorie: str = "Personnel"
    statut: str = "Actif"
    notes: str = ""
    owner: str = ""
    created_at: Optional[str] = None

class PlanningItemModel(BaseModel):
    id: Optional[str] = None
    time: str
    event: str
    responsable: str = ""
    status: str = "todo"
    date: str = "2026-05-22"
    created_by: str = ""
    created_at: Optional[str] = None

# ═══════════ ARTISTES ═══════════

@router.get("/artistes")
async def get_artistes():
    return await _db.artistes.find({}, {"_id": 0}).sort("name", 1).to_list(100)

@router.post("/artistes")
async def create_artiste(artiste: ArtisteModel):
    doc = artiste.dict()
    doc["id"] = doc.get("id") or str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = doc["created_at"]
    await _db.artistes.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "artiste": doc}

@router.patch("/artistes/{artiste_id}")
async def update_artiste(artiste_id: str, updates: dict):
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await _db.artistes.update_one({"id": artiste_id}, {"$set": updates})
    updated = await _db.artistes.find_one({"id": artiste_id}, {"_id": 0})
    return {"success": True, "artiste": updated}

@router.delete("/artistes/{artiste_id}")
async def delete_artiste(artiste_id: str):
    result = await _db.artistes.delete_one({"id": artiste_id})
    return {"success": True, "deleted": result.deleted_count > 0}

# ═══════════ PRESTATAIRES ═══════════

@router.get("/prestataires")
async def get_prestataires():
    return await _db.prestataires.find({}, {"_id": 0}).sort("name", 1).to_list(100)

@router.post("/prestataires")
async def create_prestataire(prestataire: PrestataireModel):
    doc = prestataire.dict()
    doc["id"] = doc.get("id") or str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = doc["created_at"]
    await _db.prestataires.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "prestataire": doc}

@router.patch("/prestataires/{prestataire_id}")
async def update_prestataire(prestataire_id: str, updates: dict):
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await _db.prestataires.update_one({"id": prestataire_id}, {"$set": updates})
    updated = await _db.prestataires.find_one({"id": prestataire_id}, {"_id": 0})
    return {"success": True, "prestataire": updated}

@router.delete("/prestataires/{prestataire_id}")
async def delete_prestataire(prestataire_id: str):
    result = await _db.prestataires.delete_one({"id": prestataire_id})
    return {"success": True, "deleted": result.deleted_count > 0}

# ═══════════ TASKS ═══════════

@router.get("/tasks")
async def get_tasks(assigned_to: str = None):
    query = {"assigned_to": assigned_to} if assigned_to else {}
    return await _db.shared_tasks.find(query, {"_id": 0}).sort("deadline", 1).to_list(200)

@router.post("/tasks")
async def create_task(task: TaskModel):
    doc = task.dict()
    doc["id"] = doc.get("id") or str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = doc["created_at"]
    await _db.shared_tasks.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "task": doc}

@router.patch("/tasks/{task_id}")
async def update_task(task_id: str, updates: dict):
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await _db.shared_tasks.update_one({"id": task_id}, {"$set": updates})
    updated = await _db.shared_tasks.find_one({"id": task_id}, {"_id": 0})
    return {"success": True, "task": updated}

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await _db.shared_tasks.delete_one({"id": task_id})
    return {"success": True, "deleted": result.deleted_count > 0}

# ═══════════ PARTNERS ═══════════

@router.get("/partners")
async def get_partners():
    return await _db.partners.find({}, {"_id": 0}).sort("name", 1).to_list(200)

@router.post("/partners")
async def create_partner(partner: PartnerModel):
    doc = partner.dict()
    doc["id"] = doc.get("id") or str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = doc["created_at"]
    await _db.partners.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "partner": doc}

@router.patch("/partners/{partner_id}")
async def update_partner(partner_id: str, updates: dict):
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await _db.partners.update_one({"id": partner_id}, {"$set": updates})
    updated = await _db.partners.find_one({"id": partner_id}, {"_id": 0})
    return {"success": True, "partner": updated}

@router.delete("/partners/{partner_id}")
async def delete_partner(partner_id: str):
    result = await _db.partners.delete_one({"id": partner_id})
    return {"success": True, "deleted": result.deleted_count > 0}

@router.post("/partners/{partner_id}/photo")
async def upload_partner_photo(partner_id: str, file: UploadFile = File(...)):
    """Upload a photo/logo for a partner via Cloudinary"""
    import cloudinary.uploader
    contents = await file.read()
    result = cloudinary.uploader.upload(
        contents,
        folder=f"culture-connect/partners/{partner_id}",
        resource_type="image"
    )
    image_url = result.get("secure_url")
    if not image_url:
        raise HTTPException(status_code=500, detail="Upload failed")
    await _db.partners.update_one(
        {"id": partner_id},
        {"$set": {"logo_url": image_url, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "url": image_url}

# ═══════════ EXPENSES ═══════════

@router.get("/expenses")
async def get_expenses():
    return await _db.expenses.find({}, {"_id": 0}).sort("date", -1).to_list(500)

@router.post("/expenses")
async def create_expense(expense: ExpenseModel):
    doc = expense.dict()
    doc["id"] = doc.get("id") or str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["date"] = doc.get("date") or datetime.now(timezone.utc).strftime("%d/%m/%Y")
    await _db.expenses.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "expense": doc}

@router.patch("/expenses/{expense_id}")
async def update_expense(expense_id: str, updates: dict):
    await _db.expenses.update_one({"id": expense_id}, {"$set": updates})
    updated = await _db.expenses.find_one({"id": expense_id}, {"_id": 0})
    return {"success": True, "expense": updated}

@router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    result = await _db.expenses.delete_one({"id": expense_id})
    return {"success": True, "deleted": result.deleted_count > 0}

# ═══════════ CONTACTS ═══════════

@router.get("/contacts")
async def get_contacts(owner: str = None):
    query = {"owner": owner} if owner else {}
    return await _db.contacts.find(query, {"_id": 0}).sort("nom", 1).to_list(500)

@router.post("/contacts")
async def create_contact(contact: ContactModel):
    doc = contact.dict()
    doc["id"] = doc.get("id") or str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await _db.contacts.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "contact": doc}

@router.patch("/contacts/{contact_id}")
async def update_contact(contact_id: str, updates: dict):
    await _db.contacts.update_one({"id": contact_id}, {"$set": updates})
    updated = await _db.contacts.find_one({"id": contact_id}, {"_id": 0})
    return {"success": True, "contact": updated}

@router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    result = await _db.contacts.delete_one({"id": contact_id})
    return {"success": True, "deleted": result.deleted_count > 0}

# ═══════════ PLANNING ═══════════

@router.get("/planning")
async def get_planning(date: str = None):
    query = {"date": date} if date else {}
    return await _db.planning.find(query, {"_id": 0}).sort("time", 1).to_list(100)

@router.post("/planning")
async def create_planning_item(item: PlanningItemModel):
    doc = item.dict()
    doc["id"] = doc.get("id") or str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await _db.planning.insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "item": doc}

@router.patch("/planning/{item_id}")
async def update_planning_item(item_id: str, updates: dict):
    await _db.planning.update_one({"id": item_id}, {"$set": updates})
    updated = await _db.planning.find_one({"id": item_id}, {"_id": 0})
    return {"success": True, "item": updated}

@router.delete("/planning/{item_id}")
async def delete_planning_item(item_id: str):
    result = await _db.planning.delete_one({"id": item_id})
    return {"success": True, "deleted": result.deleted_count > 0}

# ═══════════ INIT DEFAULT DATA ═══════════

@router.post("/init-default-data")
async def init_default_data():
    results = {}
    if await _db.artistes.count_documents({}) == 0:
        default_artistes = [
            {"id": "art1", "name": "Kathy", "genre": "DJ Set", "status": "Confirme", "contrat": "Signe", "cachet": "2500EUR", "rider": True, "horaire": "22h", "email": "kathy@music.com", "phone": "+596 696 00 00 00"},
            {"id": "art2", "name": "Admiral T", "genre": "Dancehall", "status": "En negociation", "contrat": "Envoye", "cachet": "5000EUR", "rider": False, "horaire": "23h", "email": "", "phone": ""},
            {"id": "art3", "name": "Kalash", "genre": "Rap", "status": "A contacter", "contrat": "Non signe", "cachet": "-", "rider": False, "horaire": "TBD", "email": "", "phone": ""},
        ]
        for a in default_artistes:
            a["created_at"] = datetime.now(timezone.utc).isoformat()
            await _db.artistes.insert_one(a)
        results["artistes"] = len(default_artistes)
    if await _db.prestataires.count_documents({}) == 0:
        default_prestas = [
            {"id": "presta1", "name": "SonoPlus Martinique", "type": "Son", "status": "Devis en attente", "devis": "4500EUR", "contact": "Jean-Marc", "email": "contact@sonoplus.mq", "phone": "+596 696 11 11 11", "validated": False},
            {"id": "presta2", "name": "LightShow Caraibes", "type": "Lumiere", "status": "Devis en attente", "devis": "3200EUR", "contact": "Marie", "email": "info@lightshow.mq", "phone": "+596 696 22 22 22", "validated": False},
            {"id": "presta3", "name": "Securite Antilles", "type": "Securite", "status": "A contacter", "devis": "-", "contact": "", "email": "", "phone": "", "validated": False},
        ]
        for p in default_prestas:
            p["created_at"] = datetime.now(timezone.utc).isoformat()
            await _db.prestataires.insert_one(p)
        results["prestataires"] = len(default_prestas)
    if await _db.planning.count_documents({}) == 0:
        default_planning = [
            {"id": "plan1", "time": "08:00", "event": "Arrivee equipe technique", "responsable": "Fabrice", "status": "todo", "date": "2026-05-22"},
            {"id": "plan2", "time": "10:00", "event": "Installation scene", "responsable": "Fabrice", "status": "todo", "date": "2026-05-22"},
            {"id": "plan3", "time": "14:00", "event": "Balance artistes", "responsable": "Gwen", "status": "todo", "date": "2026-05-22"},
            {"id": "plan4", "time": "17:00", "event": "Ouverture accueil VIP", "responsable": "Alirio", "status": "todo", "date": "2026-05-22"},
            {"id": "plan5", "time": "18:00", "event": "Ouverture portes public", "responsable": "Kaige", "status": "todo", "date": "2026-05-22"},
            {"id": "plan6", "time": "19:00", "event": "Discours ouverture", "responsable": "Laurent", "status": "todo", "date": "2026-05-22"},
            {"id": "plan7", "time": "20:00", "event": "Premier artiste", "responsable": "Gwen", "status": "todo", "date": "2026-05-22"},
            {"id": "plan8", "time": "22:00", "event": "DJ Set Kathy", "responsable": "Gwen", "status": "todo", "date": "2026-05-22"},
            {"id": "plan9", "time": "00:00", "event": "Fin evenement", "responsable": "Laurent", "status": "todo", "date": "2026-05-22"},
        ]
        for item in default_planning:
            item["created_at"] = datetime.now(timezone.utc).isoformat()
            await _db.planning.insert_one(item)
        results["planning"] = len(default_planning)
    if await _db.partners.count_documents({}) == 0:
        default_partners = [
            {"id": "partner1", "name": "Rhum Clement", "type": "Or", "status": "Signe", "contact": "Marie Clement", "email": "partenariat@clement.mq", "phone": "+596 696 33 33 33", "lastAction": "05/03/2026", "nextAction": "Livraison produits"},
            {"id": "partner2", "name": "Air France", "type": "Silver", "status": "En negociation", "contact": "Pierre Dubois", "email": "sponsoring@airfrance.fr", "phone": "", "lastAction": "01/03/2026", "nextAction": "Relance"},
            {"id": "partner3", "name": "CTM", "type": "Institutionnel", "status": "Dossier envoye", "contact": "", "email": "culture@ctm.mq", "phone": "", "lastAction": "28/02/2026", "nextAction": "Attente reponse"},
        ]
        for p in default_partners:
            p["created_at"] = datetime.now(timezone.utc).isoformat()
            await _db.partners.insert_one(p)
        results["partners"] = len(default_partners)
    return {"success": True, "initialized": results}
