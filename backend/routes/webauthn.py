"""WebAuthn — Face ID / Touch ID linked to FREK-ID."""
import os
import uuid
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import webauthn
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    ResidentKeyRequirement,
    UserVerificationRequirement,
    PublicKeyCredentialDescriptor,
)
from webauthn.helpers.cose import COSEAlgorithmIdentifier
from webauthn.helpers import bytes_to_base64url, base64url_to_bytes

logger = logging.getLogger(__name__)
router = APIRouter()

# RP config
RP_ID = os.environ.get("WEBAUTHN_RP_ID", "kiltikonet.fr")
RP_NAME = "Kiltikonet"
ORIGIN = os.environ.get("WEBAUTHN_ORIGIN", "https://kiltikonet.fr")

# In-memory challenge store (per session)
_challenges = {}

_db = None

def init_webauthn(db):
    global _db
    _db = db


# ═══════════════════════════════════════════════════════════════
# REGISTRATION
# ═══════════════════════════════════════════════════════════════

@router.post("/api/auth/webauthn/register/begin")
async def webauthn_register_begin(request: Request):
    """Generate WebAuthn registration challenge."""
    from server import get_session_from_cookie
    session = get_session_from_cookie(request)
    if not session:
        raise HTTPException(401, "Non authentifie")

    email = session.get("email", "")
    user = await _db.registrations.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")

    frek_id = user.get("frek_id", "")
    user_id = frek_id.encode("utf-8")
    display_name = user.get("full_name", email)

    # Get existing credentials for exclude
    existing = await _db.webauthn_credentials.find(
        {"frek_id": frek_id}, {"_id": 0, "credential_id": 1}
    ).to_list(10)
    exclude = [
        PublicKeyCredentialDescriptor(id=base64url_to_bytes(c["credential_id"]))
        for c in existing
    ]

    options = webauthn.generate_registration_options(
        rp_id=RP_ID,
        rp_name=RP_NAME,
        user_id=user_id,
        user_name=email,
        user_display_name=display_name,
        exclude_credentials=exclude,
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.PREFERRED,
            user_verification=UserVerificationRequirement.PREFERRED,
        ),
        supported_pub_key_algs=[
            COSEAlgorithmIdentifier.ECDSA_SHA_256,
            COSEAlgorithmIdentifier.RSASSA_PKCS1_v1_5_SHA_256,
        ],
    )

    # Store challenge
    _challenges[email] = bytes_to_base64url(options.challenge)

    # Serialize options to JSON
    options_json = webauthn.options_to_json(options)
    return json.loads(options_json)


class WebAuthnRegisterComplete(BaseModel):
    credential: dict


@router.post("/api/auth/webauthn/register/complete")
async def webauthn_register_complete(request: Request, body: WebAuthnRegisterComplete):
    """Verify and store WebAuthn credential."""
    from server import get_session_from_cookie
    session = get_session_from_cookie(request)
    if not session:
        raise HTTPException(401, "Non authentifie")

    email = session.get("email", "")
    challenge = _challenges.pop(email, None)
    if not challenge:
        raise HTTPException(400, "Challenge expire ou invalide")

    user = await _db.registrations.find_one({"email": email}, {"_id": 0})
    frek_id = user.get("frek_id", "") if user else ""

    try:
        verification = webauthn.verify_registration_response(
            credential=json.dumps(body.credential),
            expected_challenge=base64url_to_bytes(challenge),
            expected_rp_id=RP_ID,
            expected_origin=ORIGIN,
        )
    except Exception as e:
        logger.error(f"WebAuthn registration verification failed: {e}")
        raise HTTPException(400, f"Verification echouee: {str(e)}")

    # Store credential
    now = datetime.now(timezone.utc).isoformat()
    cred_doc = {
        "frek_id": frek_id,
        "email": email,
        "credential_id": bytes_to_base64url(verification.credential_id),
        "public_key": bytes_to_base64url(verification.credential_public_key),
        "sign_count": verification.sign_count,
        "device_name": body.credential.get("device_name", "Appareil"),
        "created_at": now,
    }
    await _db.webauthn_credentials.insert_one(cred_doc)

    return {"success": True, "credential_id": cred_doc["credential_id"], "device_name": cred_doc["device_name"]}


# ═══════════════════════════════════════════════════════════════
# AUTHENTICATION
# ═══════════════════════════════════════════════════════════════

class WebAuthnLoginBegin(BaseModel):
    email: str


@router.post("/api/auth/webauthn/login/begin")
async def webauthn_login_begin(body: WebAuthnLoginBegin):
    """Generate WebAuthn authentication challenge."""
    email = body.email.lower().strip()

    creds = await _db.webauthn_credentials.find(
        {"email": email}, {"_id": 0}
    ).to_list(10)

    if not creds:
        raise HTTPException(404, "Aucun appareil WebAuthn enregistre pour cet email")

    allow = [
        PublicKeyCredentialDescriptor(id=base64url_to_bytes(c["credential_id"]))
        for c in creds
    ]

    options = webauthn.generate_authentication_options(
        rp_id=RP_ID,
        allow_credentials=allow,
        user_verification=UserVerificationRequirement.PREFERRED,
    )

    _challenges[email] = bytes_to_base64url(options.challenge)
    options_json = webauthn.options_to_json(options)
    return json.loads(options_json)


class WebAuthnLoginComplete(BaseModel):
    email: str
    credential: dict


@router.post("/api/auth/webauthn/login/complete")
async def webauthn_login_complete(body: WebAuthnLoginComplete):
    """Verify WebAuthn authentication and create session."""
    email = body.email.lower().strip()
    challenge = _challenges.pop(email, None)
    if not challenge:
        raise HTTPException(400, "Challenge expire")

    cred_id = body.credential.get("id", "")
    stored = await _db.webauthn_credentials.find_one(
        {"email": email, "credential_id": cred_id}, {"_id": 0}
    )
    if not stored:
        raise HTTPException(400, "Credential inconnue")

    try:
        verification = webauthn.verify_authentication_response(
            credential=json.dumps(body.credential),
            expected_challenge=base64url_to_bytes(challenge),
            expected_rp_id=RP_ID,
            expected_origin=ORIGIN,
            credential_public_key=base64url_to_bytes(stored["public_key"]),
            credential_current_sign_count=stored.get("sign_count", 0),
        )
    except Exception as e:
        logger.error(f"WebAuthn auth verification failed: {e}")
        raise HTTPException(400, f"Authentification echouee: {str(e)}")

    # Update sign count
    await _db.webauthn_credentials.update_one(
        {"credential_id": cred_id, "email": email},
        {"$set": {"sign_count": verification.new_sign_count}}
    )

    # Get user profile and create session
    user = await _db.registrations.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")

    from fastapi.responses import JSONResponse
    from server import set_session_cookie
    response = JSONResponse(content={
        "success": True,
        "profile": {
            "id": user.get("id", ""),
            "email": email,
            "full_name": user.get("full_name", ""),
            "frek_id": user.get("frek_id", ""),
            "profile_type": user.get("profile_type", "other"),
        },
    })
    set_session_cookie(response, {
        "role": "pro",
        "email": email,
        "name": user.get("full_name", ""),
        "profile_id": user.get("id", ""),
        "profile_type": user.get("profile_type", "other"),
        "is_admin": False,
    })
    return response


# ═══════════════════════════════════════════════════════════════
# DEVICE MANAGEMENT
# ═══════════════════════════════════════════════════════════════

@router.get("/api/auth/webauthn/devices")
async def list_webauthn_devices(request: Request):
    """List registered WebAuthn devices."""
    from server import get_session_from_cookie
    session = get_session_from_cookie(request)
    if not session:
        raise HTTPException(401, "Non authentifie")

    email = session.get("email", "")
    devices = await _db.webauthn_credentials.find(
        {"email": email}, {"_id": 0, "credential_id": 1, "device_name": 1, "created_at": 1}
    ).to_list(10)
    return {"devices": devices}


@router.post("/api/auth/webauthn/revoke/{credential_id}")
async def revoke_webauthn(credential_id: str, request: Request):
    """Revoke a WebAuthn credential."""
    from server import get_session_from_cookie
    session = get_session_from_cookie(request)
    if not session:
        raise HTTPException(401, "Non authentifie")

    email = session.get("email", "")
    result = await _db.webauthn_credentials.delete_one(
        {"email": email, "credential_id": credential_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(404, "Credential introuvable")
    return {"success": True, "revoked": credential_id}
