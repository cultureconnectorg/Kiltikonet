"""
FREK API Client — Async HTTP client for frekcore.com
Mode dégradé: LOCAL-{uuid} si frekcore.com est indisponible
"""
import os
import asyncio
import logging
import uuid
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

FREK_API_URL = os.environ.get("FREK_API_URL", "https://frek-certification.preview.emergentagent.com/api")
FREK_CLIENT_ID = os.environ.get("FREK_CLIENT_ID", "kiltikonet-cc2026")
FREK_CLIENT_SECRET = os.environ.get("FREK_CLIENT_SECRET", "pczBP49crCXSSSwSOShsXClzs9srhKe5S-xnraMPn-k")
FREK_ADMIN_KEY = os.environ.get("FREK_ADMIN_KEY", "pczBP49crCXSSSwSOShsXClzs9srhKe5S-xnraMPn-k")
FREK_FALLBACK_MODE = os.environ.get("FREK_FALLBACK_MODE", "false").lower() == "true"


class FrekClient:
    def __init__(self):
        self._jwt: Optional[str] = None
        self._jwt_expires: Optional[datetime] = None
        self._retry_queue: list = []
        self._is_available: bool = True
        self._last_check: Optional[datetime] = None

    def _headers(self) -> dict:
        headers = {"X-Client-Id": FREK_CLIENT_ID, "Content-Type": "application/json"}
        if self._jwt:
            headers["Authorization"] = f"Bearer {self._jwt}"
        return headers

    async def _ensure_token(self):
        now = datetime.now(timezone.utc)
        if self._jwt and self._jwt_expires and now < self._jwt_expires:
            return True
        
        # Try multiple auth endpoints
        auth_paths = [
            "/auth/token",
            "/v1/auth/token",
            "/auth/login",
        ]
        
        for path in auth_paths:
            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    resp = await client.post(
                        f"{FREK_API_URL}{path}",
                        json={"client_id": FREK_CLIENT_ID, "client_secret": FREK_CLIENT_SECRET},
                        headers={"X-Admin-Key": FREK_ADMIN_KEY, "Content-Type": "application/json"},
                    )
                    if resp.status_code in (200, 201):
                        data = resp.json()
                        self._jwt = data.get("token") or data.get("access_token")
                        self._jwt_expires = now + timedelta(hours=23)
                        self._is_available = True
                        logger.info(f"FREK JWT obtained via {path}")
                        return True
            except Exception:
                continue
        
        # If no auth worked, try using admin key directly
        if FREK_ADMIN_KEY:
            self._jwt = FREK_ADMIN_KEY
            self._jwt_expires = now + timedelta(hours=24)
            self._is_available = True
            logger.info("FREK using admin key as bearer token")
            return True
        
        logger.warning("FREK auth failed on all paths")
        self._is_available = False
        return False

    async def health(self) -> bool:
        health_paths = ["/health", "/v1/health", ""]
        for path in health_paths:
            try:
                async with httpx.AsyncClient(timeout=5) as client:
                    resp = await client.get(f"{FREK_API_URL}{path}")
                    if resp.status_code in (200, 404):
                        self._is_available = True
                        self._last_check = datetime.now(timezone.utc)
                        return True
            except Exception:
                continue
        self._is_available = False
        self._last_check = datetime.now(timezone.utc)
        return False

    def _generate_local_id(self) -> str:
        return f"LOCAL-{uuid.uuid4().hex[:12]}"

    async def emit(self, email: str, prenom: str, nom: str, badge_type: str) -> dict:
        """Create FREK-ID (idempotent by email). Returns {frek_id, status}"""
        if not await self._ensure_token():
            if FREK_FALLBACK_MODE:
                local_id = self._generate_local_id()
                self._retry_queue.append({
                    "action": "emit", "email": email, "prenom": prenom,
                    "nom": nom, "badge_type": badge_type, "local_id": local_id,
                    "queued_at": datetime.now(timezone.utc).isoformat(),
                })
                logger.info(f"FREK fallback: generated {local_id} for {email}")
                return {"frek_id": local_id, "status": "local_fallback"}
            raise Exception("FREK API unavailable and fallback disabled")

        # FREKcore type mapping (VIS not in FREKcore, map to BNV for visitor badges)
        frek_badge_type = badge_type if badge_type != "VIS" else "BNV"

        try:
            # Try FREKcore /badges/create endpoint
            emit_paths = ["/badges/create", "/identity/emit", "/v1/emit"]
            for path in emit_paths:
                try:
                    async with httpx.AsyncClient(timeout=15) as client:
                        resp = await client.post(
                            f"{FREK_API_URL}{path}",
                            headers=self._headers(),
                            json={"email": email, "prenom": prenom, "nom": nom,
                                   "type_badge": frek_badge_type, "organisation": "CC2026",
                                   "context": f"CC2026-{badge_type}"},
                        )
                        if resp.status_code in (200, 201):
                            data = resp.json()
                            badge_data = data.get("badge", data)
                            frek_id = badge_data.get("frek_id") or badge_data.get("badge_id") or badge_data.get("id")
                            logger.info(f"FREK emit OK via {path}: {frek_id}")
                            return {"frek_id": frek_id, "status": "emitted", "remote_data": badge_data}
                        elif resp.status_code == 409:
                            # Already exists
                            data = resp.json()
                            logger.info(f"FREK duplicate: {data}")
                            return {"frek_id": data.get("existing_frek_id", ""), "status": "duplicate", "remote_data": data}
                        elif resp.status_code != 404:
                            logger.warning(f"FREK {path}: {resp.status_code} {resp.text[:200]}")
                except Exception as inner_e:
                    logger.warning(f"FREK {path} failed: {inner_e}")
                    continue

            # All paths failed
            logger.error("FREK emit: all paths failed")
            if FREK_FALLBACK_MODE:
                local_id = self._generate_local_id()
                self._retry_queue.append({
                    "action": "emit", "email": email, "prenom": prenom,
                    "nom": nom, "badge_type": badge_type, "local_id": local_id,
                    "queued_at": datetime.now(timezone.utc).isoformat(),
                })
                return {"frek_id": local_id, "status": "local_fallback"}
            raise Exception("FREK emit failed on all paths")
        except Exception as e:
            logger.error(f"FREK emit critical error: {e}")
            local_id = self._generate_local_id()
            self._retry_queue.append({
                "action": "emit", "email": email, "local_id": local_id,
                "queued_at": datetime.now(timezone.utc).isoformat(),
            })
            return {"frek_id": local_id, "status": "local_fallback"}

    async def activate(self, frek_id: str) -> dict:
        """Activate FREK-ID (1st physical scan)"""
        if frek_id.startswith("LOCAL-"):
            return {"status": "local_pending", "frek_id": frek_id}

        if not await self._ensure_token():
            return {"status": "unavailable", "frek_id": frek_id}

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"{FREK_API_URL}/identity/{frek_id}/activate",
                    headers=self._headers(),
                )
                if resp.status_code == 200:
                    return {"status": "activated", **resp.json()}
                return {"status": "error", "code": resp.status_code}
        except Exception as e:
            logger.error(f"FREK activate error: {e}")
            return {"status": "unavailable"}

    async def record_stage(self, frek_id: str, stage: str) -> dict:
        """Record Luciole stage (METAMORPHOSE, EMISSION, etc.)"""
        if frek_id.startswith("LOCAL-"):
            self._retry_queue.append({
                "action": "record_stage", "frek_id": frek_id, "stage": stage,
                "queued_at": datetime.now(timezone.utc).isoformat(),
            })
            return {"status": "queued_local"}

        if not await self._ensure_token():
            self._retry_queue.append({
                "action": "record_stage", "frek_id": frek_id, "stage": stage,
                "queued_at": datetime.now(timezone.utc).isoformat(),
            })
            return {"status": "queued"}

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"{FREK_API_URL}/identity/{frek_id}/stage",
                    headers=self._headers(),
                    json={"stage": stage, "context": "CC2026"},
                )
                if resp.status_code == 200:
                    return {"status": "recorded", **resp.json()}
                return {"status": "error", "code": resp.status_code}
        except Exception as e:
            logger.error(f"FREK stage error: {e}")
            self._retry_queue.append({
                "action": "record_stage", "frek_id": frek_id, "stage": stage,
                "queued_at": datetime.now(timezone.utc).isoformat(),
            })
            return {"status": "queued"}

    async def lookup(self, qr_token: str) -> dict:
        """Lookup qr_token -> frek_id"""
        if not await self._ensure_token():
            return {"status": "unavailable"}
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"{FREK_API_URL}/identity/lookup",
                    headers=self._headers(),
                    json={"qr_token": qr_token},
                )
                if resp.status_code == 200:
                    return resp.json()
                return {"status": "not_found"}
        except Exception:
            return {"status": "unavailable"}

    async def get_status(self, frek_id: str) -> dict:
        """Get FREK-ID stages + progression"""
        if frek_id.startswith("LOCAL-"):
            return {"frek_id": frek_id, "status": "local_pending", "stages": []}
        if not await self._ensure_token():
            return {"status": "unavailable"}
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{FREK_API_URL}/identity/{frek_id}/status",
                    headers=self._headers(),
                )
                if resp.status_code == 200:
                    return resp.json()
                return {"status": "error"}
        except Exception:
            return {"status": "unavailable"}

    async def get_cc2026_stats(self) -> dict:
        """Get CC2026 stats for dashboard"""
        if not await self._ensure_token():
            return {"status": "unavailable", "total_frek_ids": 0}
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{FREK_API_URL}/stats/cc2026",
                    headers=self._headers(),
                )
                if resp.status_code == 200:
                    return resp.json()
                return {"status": "error", "total_frek_ids": 0}
        except Exception:
            return {"status": "unavailable", "total_frek_ids": 0}

    async def reconcile(self):
        """Reconcile local FREK-IDs when FREK comes back"""
        if not self._retry_queue:
            return {"reconciled": 0}
        if not await self._ensure_token():
            return {"status": "unavailable", "pending": len(self._retry_queue)}

        reconciled = 0
        remaining = []
        for item in self._retry_queue:
            try:
                if item["action"] == "emit":
                    result = await self.emit(
                        item.get("email", ""),
                        item.get("prenom", ""),
                        item.get("nom", ""),
                        item.get("badge_type", ""),
                    )
                    if result["status"] != "local_fallback":
                        reconciled += 1
                    else:
                        remaining.append(item)
                elif item["action"] == "record_stage":
                    result = await self.record_stage(item["frek_id"], item["stage"])
                    if result["status"] != "queued":
                        reconciled += 1
                    else:
                        remaining.append(item)
            except Exception:
                remaining.append(item)

        self._retry_queue = remaining
        logger.info(f"FREK reconciliation: {reconciled} done, {len(remaining)} remaining")
        return {"reconciled": reconciled, "remaining": len(remaining)}

    @property
    def retry_queue_size(self) -> int:
        return len(self._retry_queue)

    @property
    def is_available(self) -> bool:
        return self._is_available


# Singleton
frek_client = FrekClient()
