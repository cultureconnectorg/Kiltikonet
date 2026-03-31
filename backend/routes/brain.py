from fastapi import APIRouter, HTTPException
from services.cvl_brain import analyse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/brain", tags=["CVL BRAIN"])

@router.post("/analyse")
async def analyse_profil(data: dict):
    try:
        return await analyse(data, context="profil")
    except Exception as e:
        logger.error(f"CVL BRAIN analyse error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/entreprise")
async def analyse_entreprise(data: dict):
    try:
        return await analyse(data, context="entreprise")
    except Exception as e:
        logger.error(f"CVL BRAIN entreprise error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evenement")
async def analyse_evenement(data: dict):
    try:
        return await analyse(data, context="evenement")
    except Exception as e:
        logger.error(f"CVL BRAIN evenement error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alerte")
async def alerte_operationnelle(data: dict):
    try:
        return await analyse(data, context="alerte")
    except Exception as e:
        logger.error(f"CVL BRAIN alerte error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
