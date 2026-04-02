"""
CC2026 Appel a Projet — Candidatures API
POST /api/candidatures/cc2026 — submit candidature
GET /api/candidatures/cc2026 — list (admin)
PUT /api/candidatures/cc2026/{id}/status — change status
GET /api/candidatures/cc2026/export — CSV export
GET /api/docs/{filename} — serve DOCX files
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid
import csv
import io
import os
import logging

logger = logging.getLogger("server")

router = APIRouter(tags=["candidatures"])

_db = None
_send_email = None

def init_db(db, send_email_fn):
    global _db, _send_email
    _db = db
    _send_email = send_email_fn


class CandidatureBody(BaseModel):
    nom_complet: str
    email: str
    organisation: Optional[str] = ""
    territoire: str
    profil: str
    nom_projet: str
    description_projet: str
    impact_culturel: str
    lien_web: Optional[str] = ""
    format_souhaite: str
    engagement_cc: bool


@router.post("/api/candidatures/cc2026")
async def submit_candidature(body: CandidatureBody):
    if not body.engagement_cc:
        raise HTTPException(400, "L'engagement Culture Connect est obligatoire")

    candidature = {
        "id": f"CC26-AAP-{uuid.uuid4().hex[:6].upper()}",
        "nom_complet": body.nom_complet,
        "email": body.email,
        "organisation": body.organisation or "",
        "territoire": body.territoire,
        "profil": body.profil,
        "nom_projet": body.nom_projet,
        "description_projet": body.description_projet,
        "impact_culturel": body.impact_culturel,
        "lien_web": body.lien_web or "",
        "format_souhaite": body.format_souhaite,
        "engagement_cc": body.engagement_cc,
        "status": "recue",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await _db.candidatures_cc2026.insert_one({**candidature})

    # Email confirmation to candidate
    if _send_email:
        try:
            html_confirm = f"""
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                <div style="background:#4A3AB7;color:#fff;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
                    <h1 style="margin:0;font-size:22px;">Culture Connect 2026</h1>
                    <p style="margin:5px 0 0;opacity:0.8;font-size:14px;">Appel a projet — Candidature recue</p>
                </div>
                <div style="padding:25px;background:#f9f9f9;border:1px solid #eee;border-radius:0 0 8px 8px;">
                    <p>Bonjour <strong>{body.nom_complet}</strong>,</p>
                    <p>Votre candidature au programme Culture Connect 2026 a bien ete recue.</p>
                    <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                        <tr><td style="padding:5px 10px;color:#666;">Projet</td><td style="padding:5px 10px;font-weight:bold;">{body.nom_projet}</td></tr>
                        <tr><td style="padding:5px 10px;color:#666;">Profil</td><td style="padding:5px 10px;">{body.profil}</td></tr>
                        <tr><td style="padding:5px 10px;color:#666;">Territoire</td><td style="padding:5px 10px;">{body.territoire}</td></tr>
                        <tr><td style="padding:5px 10px;color:#666;">Format</td><td style="padding:5px 10px;">{body.format_souhaite}</td></tr>
                        <tr><td style="padding:5px 10px;color:#666;">Reference</td><td style="padding:5px 10px;font-family:monospace;">{candidature['id']}</td></tr>
                    </table>
                    <p><strong>Prochaines etapes :</strong></p>
                    <ul style="color:#555;">
                        <li>Instruction des dossiers : 1er - 7 mai 2026</li>
                        <li>Annonce des laureats : 10 mai 2026</li>
                        <li>Chimin Savann : 20 - 23 mai 2026</li>
                    </ul>
                    <p style="color:#888;font-size:12px;margin-top:20px;">Kilti Konet — Association loi 1901 | kiltikonet.fr</p>
                </div>
            </div>
            """
            await _send_email(
                body.email,
                "Votre candidature Culture Connect 2026 — recue",
                html_confirm
            )
        except Exception as e:
            logger.warning(f"Email confirmation failed: {e}")

    # Notification to admin
    if _send_email:
        try:
            html_admin = f"""
            <div style="font-family:Arial,sans-serif;max-width:600px;padding:20px;">
                <h2 style="color:#4A3AB7;">Nouvelle candidature CC2026</h2>
                <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;width:140px;">Nom</td><td style="padding:8px;border-bottom:1px solid #eee;">{body.nom_complet}</td></tr>
                    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">{body.email}</td></tr>
                    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Organisation</td><td style="padding:8px;border-bottom:1px solid #eee;">{body.organisation or 'N/A'}</td></tr>
                    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Territoire</td><td style="padding:8px;border-bottom:1px solid #eee;">{body.territoire}</td></tr>
                    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Profil</td><td style="padding:8px;border-bottom:1px solid #eee;">{body.profil}</td></tr>
                    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Projet</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">{body.nom_projet}</td></tr>
                    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Description</td><td style="padding:8px;border-bottom:1px solid #eee;">{body.description_projet[:300]}...</td></tr>
                    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Impact</td><td style="padding:8px;border-bottom:1px solid #eee;">{body.impact_culturel[:200]}...</td></tr>
                    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Format</td><td style="padding:8px;border-bottom:1px solid #eee;">{body.format_souhaite}</td></tr>
                    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Lien</td><td style="padding:8px;border-bottom:1px solid #eee;">{body.lien_web or 'N/A'}</td></tr>
                    <tr><td style="padding:8px;color:#666;">Reference</td><td style="padding:8px;font-family:monospace;">{candidature['id']}</td></tr>
                </table>
            </div>
            """
            await _send_email(
                "appel2026@kiltikonet.fr",
                f"[CC2026 AAP] Nouvelle candidature — {body.nom_complet} — {body.nom_projet}",
                html_admin
            )
        except Exception as e:
            logger.warning(f"Admin notification email failed: {e}")

    return {"success": True, "id": candidature["id"]}


@router.get("/api/candidatures/cc2026")
async def list_candidatures(status: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    results = await _db.candidatures_cc2026.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"candidatures": results, "total": len(results)}


@router.put("/api/candidatures/cc2026/{candidature_id}/status")
async def update_candidature_status(candidature_id: str, status: str):
    valid = ["recue", "en_instruction", "retenue", "refusee"]
    if status not in valid:
        raise HTTPException(400, f"Statut invalide. Valeurs possibles: {', '.join(valid)}")
    result = await _db.candidatures_cc2026.update_one(
        {"id": candidature_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(404, "Candidature non trouvee")
    return {"success": True, "id": candidature_id, "status": status}


@router.get("/api/candidatures/cc2026/export")
async def export_candidatures_csv():
    results = await _db.candidatures_cc2026.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    output = io.StringIO()
    fields = ["id", "nom_complet", "email", "organisation", "territoire", "profil",
              "nom_projet", "description_projet", "impact_culturel", "lien_web",
              "format_souhaite", "status", "created_at"]
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction='ignore')
    writer.writeheader()
    for r in results:
        writer.writerow(r)
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=candidatures_cc2026.csv"}
    )


@router.get("/api/docs/{filename}")
async def serve_document(filename: str):
    safe_names = [
        "AAP_CahierDesCharges_FR.docx",
        "AAP_CultureConnect2026_EN.docx",
        "AAP_CultureConnect2026_KW.docx",
    ]
    if filename not in safe_names:
        raise HTTPException(404, "Document non trouve")
    filepath = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "docs", filename)
    if not os.path.exists(filepath):
        raise HTTPException(404, "Fichier non trouve")
    return FileResponse(
        filepath,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename,
    )
