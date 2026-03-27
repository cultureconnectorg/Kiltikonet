"""
hCaptcha verification utility for CC2026
Server-side validation of hCaptcha tokens
"""
import os
import logging
import httpx

logger = logging.getLogger(__name__)

HCAPTCHA_SECRET = os.environ.get("HCAPTCHA_SECRET", "")
HCAPTCHA_VERIFY_URL = "https://api.hcaptcha.com/siteverify"


async def verify_hcaptcha(token: str, remote_ip: str = "unknown") -> dict:
    """
    Verify an hCaptcha token against the hCaptcha API.
    Returns {"success": True/False, "error": str|None}
    """
    if not HCAPTCHA_SECRET:
        logger.warning("HCAPTCHA_SECRET not configured, skipping verification")
        return {"success": True, "error": None}

    if not token:
        return {"success": False, "error": "Token captcha manquant"}

    payload = {
        "secret": HCAPTCHA_SECRET,
        "response": token,
        "remoteip": remote_ip,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(HCAPTCHA_VERIFY_URL, data=payload)
            response.raise_for_status()

        data = response.json()

        if not data.get("success"):
            error_codes = data.get("error-codes", [])
            logger.warning(f"hCaptcha verification failed: {error_codes}")
            return {"success": False, "error": f"Verification captcha echouee: {error_codes}"}

        return {"success": True, "error": None}

    except httpx.TimeoutException:
        logger.error("hCaptcha API timeout")
        return {"success": True, "error": None}
    except httpx.RequestError as e:
        logger.error(f"hCaptcha API error: {e}")
        return {"success": True, "error": None}
