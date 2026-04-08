"""Object Storage service for file uploads via Emergent integrations."""
import os
import uuid
import logging
import requests
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "kiltikonet"

storage_key = None

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

ALLOWED_MIME_PREFIXES = ["image/", "audio/", "video/"]

MIME_EXT_MAP = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/gif": ["gif"],
    "image/webp": ["webp"],
    "image/heic": ["heic"],
    "image/heif": ["heif"],
    "audio/mpeg": ["mp3"],
    "audio/wav": ["wav"],
    "audio/ogg": ["ogg"],
    "audio/aac": ["aac"],
    "audio/flac": ["flac"],
    "audio/mp4": ["m4a"],
    "video/mp4": ["mp4"],
    "video/quicktime": ["mov"],
    "video/webm": ["webm"],
    "video/x-msvideo": ["avi"],
    "video/mpeg": ["mpeg", "mpg"],
}


def init_storage():
    """Initialize storage — call once at startup."""
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(
        f"{STORAGE_URL}/init",
        json={"emergent_key": EMERGENT_KEY},
        timeout=30,
    )
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    logger.info("Object Storage initialized successfully")
    return storage_key


def validate_upload(content_type: str, file_ext: str, file_size: int):
    """Validate MIME type, extension match, and size."""
    if file_size > MAX_FILE_SIZE:
        return False, f"Fichier trop volumineux ({file_size // (1024*1024)}MB > 50MB)"

    if not any(content_type.startswith(p) for p in ALLOWED_MIME_PREFIXES):
        return False, f"Type non autorise: {content_type}"

    # Check MIME vs extension
    ext_lower = file_ext.lower().lstrip(".")
    allowed_exts = MIME_EXT_MAP.get(content_type)
    if allowed_exts and ext_lower not in allowed_exts:
        return False, f"Extension .{ext_lower} ne correspond pas au MIME {content_type}"

    return True, ""


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload file to Object Storage."""
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    """Download file from Object Storage."""
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


def generate_path(user_id: str, filename: str) -> str:
    """Generate a unique storage path."""
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    return f"{APP_NAME}/uploads/{user_id}/{uuid.uuid4()}.{ext}"
