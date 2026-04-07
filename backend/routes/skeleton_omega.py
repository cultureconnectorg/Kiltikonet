"""
Skeleton Omega — Routes additives pour iter.57-60
Endpoints manquants identifes dans CONFLICT_REPORT.md / MISSING_ENDPOINTS.md
Toutes les donnees sont des MOCKS realistes pour le developpement frontend.
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
import uuid

router = APIRouter(prefix="/api/omega", tags=["omega-skeleton"])


# ═══════ ADHESION ═══════

@router.get("/adhesion/levels")
async def get_adhesion_levels():
    """Liste des niveaux d'adhesion — MOCK."""
    return {"levels": [
        {"id": "free", "name": "Libre", "price_eur_monthly": 0, "price_eur_annual": 0,
         "benefits": ["Acces feed (lecture)", "5 KT offerts", "Brain 10 req/mois"], "quota_kt": 5, "quota_cc": 0,
         "brain_quota": 10, "studio_uploads": 0, "terminal_deploys": 0, "governance_weight": 1},
        {"id": "pro", "name": "Pro", "price_eur_monthly": 9.90, "price_eur_annual": 99,
         "benefits": ["Acces complet feed", "50 KT offerts", "Brain 100 req/mois", "Studio upload", "10 deploys/mois"],
         "quota_kt": 50, "quota_cc": 0, "brain_quota": 100, "studio_uploads": 50, "terminal_deploys": 10, "governance_weight": 2},
        {"id": "premium", "name": "Premium", "price_eur_monthly": 24.90, "price_eur_annual": 249,
         "benefits": ["Acces illimite", "200 KT offerts", "Brain illimite", "Studio illimite", "Deploys illimite"],
         "quota_kt": 200, "quota_cc": 10, "brain_quota": -1, "studio_uploads": -1, "terminal_deploys": -1, "governance_weight": 3},
        {"id": "institutional", "name": "Institutionnel", "price_eur_monthly": 0, "price_eur_annual": 0,
         "benefits": ["Sur devis", "500 KT", "Gouvernance poids 3", "Rapports personnalises"],
         "quota_kt": 500, "quota_cc": 50, "brain_quota": -1, "studio_uploads": -1, "terminal_deploys": -1, "governance_weight": 3},
    ]}


@router.get("/adhesion/my-subscription")
async def get_my_subscription():
    """Abonnement actuel — MOCK."""
    return {"subscription": None}


class AdhesionSubscribeRequest(BaseModel):
    level_id: str


@router.post("/adhesion/subscribe")
async def subscribe_adhesion(body: AdhesionSubscribeRequest):
    """Souscrire a un niveau — MOCK."""
    return {"success": True, "message": f"Abonnement {body.level_id} active (mock)", "subscription_id": str(uuid.uuid4())}


@router.post("/adhesion/cancel")
async def cancel_adhesion():
    """Annuler l'abonnement — MOCK."""
    return {"success": True, "message": "Abonnement annule (mock)"}


# ═══════ GOUVERNANCE ═══════

_mock_proposals = [
    {"id": "prop-001", "title": "Augmenter le quota Brain gratuit a 20 req/mois",
     "description": "Les membres libres ont actuellement 10 requetes Brain par mois. Cette proposition vise a doubler ce quota pour democratiser l'acces a l'intelligence culturelle.",
     "author_frek_id": "FREK-ADM-CULT", "author_name": "Conseil CVLN",
     "category": "rule", "status": "open",
     "votes_for": 12, "votes_against": 3, "votes_abstain": 2,
     "weighted_for": 28, "weighted_against": 5,
     "deadline": (datetime.now(timezone.utc) + timedelta(days=14)).isoformat(),
     "quorum_required": 10, "created_at": "2026-04-01T10:00:00Z"},
    {"id": "prop-002", "title": "Partenariat avec le Festival de Fort-de-France",
     "description": "Etablir un partenariat officiel avec le FFF pour l'edition 2027. Budget propose : 15 000 EUR.",
     "author_frek_id": "FREK-INST-0001", "author_name": "Direction Culturelle",
     "category": "partnership", "status": "open",
     "votes_for": 8, "votes_against": 1, "votes_abstain": 5,
     "weighted_for": 20, "weighted_against": 2,
     "deadline": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
     "quorum_required": 15, "created_at": "2026-04-03T14:30:00Z"},
]


@router.get("/gouvernance/proposals")
async def get_proposals():
    """Liste des propositions de vote — MOCK."""
    return {"proposals": _mock_proposals}


class VoteRequest(BaseModel):
    proposal_id: str
    vote: str  # 'for' | 'against' | 'abstain'


@router.post("/gouvernance/vote")
async def cast_vote(body: VoteRequest):
    """Voter — MOCK."""
    return {"success": True, "message": f"Vote '{body.vote}' enregistre pour {body.proposal_id} (mock)"}


class ProposalRequest(BaseModel):
    title: str
    description: str
    category: str = "other"


@router.post("/gouvernance/proposals")
async def create_proposal(body: ProposalRequest):
    """Creer une proposition — MOCK."""
    return {"success": True, "proposal_id": str(uuid.uuid4()), "message": "Proposition creee (mock)"}


# ═══════ TRADE ═══════

@router.get("/trade/orders")
async def get_trade_orders():
    """Liste des ordres d'echange — MOCK."""
    return {
        "orders": [
            {"order_id": "ord-001", "user_frek_id": "FREK-MOCK-0001", "offer_type": "sell",
             "token_type": "KT", "amount": 50, "price_eur_per_token": 1.2, "total_eur": 60,
             "status": "pending", "created_at": "2026-04-07T10:00:00Z"},
            {"order_id": "ord-002", "user_frek_id": "FREK-MOCK-0002", "offer_type": "buy",
             "token_type": "KT", "amount": 30, "price_eur_per_token": 1.3, "total_eur": 39,
             "status": "pending", "created_at": "2026-04-07T11:30:00Z"},
        ],
        "my_orders": []
    }


class TradeOrderRequest(BaseModel):
    offer_type: str  # 'buy' | 'sell'
    token_type: str = "KT"
    amount: int
    price_eur_per_token: float


@router.post("/trade/orders")
async def create_trade_order(body: TradeOrderRequest):
    """Creer un ordre d'echange — MOCK."""
    return {"success": True, "order_id": str(uuid.uuid4()), "message": "Ordre cree (mock)"}


@router.delete("/trade/orders/{order_id}")
async def cancel_trade_order(order_id: str):
    """Annuler un ordre — MOCK."""
    return {"success": True, "message": f"Ordre {order_id} annule (mock)"}


# ═══════ TERMINAL / DEPLOY ═══════

@router.get("/terminal/deploys")
async def get_deploys():
    """Historique des deploiements — MOCK."""
    return {"deploys": [
        {"deploy_id": "dep-001", "slug": "mon-portfolio", "title": "Mon Portfolio Culturel",
         "version": 2, "url": "/pages/mon-portfolio", "created_at": "2026-04-05T14:00:00Z"},
        {"deploy_id": "dep-002", "slug": "expo-2026", "title": "Exposition CC2026",
         "version": 1, "url": "/pages/expo-2026", "created_at": "2026-04-06T09:30:00Z"},
    ]}


class DeployRequest(BaseModel):
    slug: str
    html: str
    title: str


@router.post("/terminal/deploy")
async def deploy_page(body: DeployRequest):
    """Deployer une page HTML — MOCK."""
    return {
        "deploy_id": str(uuid.uuid4()),
        "url": f"/pages/{body.slug}",
        "version": 1,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message": "Page deployee (mock)"
    }


class RollbackRequest(BaseModel):
    deploy_id: str


@router.post("/terminal/rollback")
async def rollback_deploy(body: RollbackRequest):
    """Rollback vers une version precedente — MOCK."""
    return {"success": True, "message": f"Rollback vers {body.deploy_id} (mock)"}


# ═══════ USER SETTINGS ═══════

@router.get("/user/settings")
async def get_user_settings():
    """Parametres utilisateur — MOCK."""
    return {
        "profile": {"full_name": "Utilisateur Test", "bio": "", "photo_url": "", "language": "fr",
                     "frek_id": "FREK-TEST-0001", "actor_role": "professional"},
        "notifications": {"email_enabled": True, "push_enabled": False, "in_app_enabled": True, "brain_suggestions": True},
        "privacy": {"profile_public": True, "frek_id_public": False, "show_in_catalog": True, "show_in_directory": True},
        "preferences": {"language": "fr", "brain_language": "fr", "theme": "sovereign_onyx", "currency_display": "EUR"},
        "security": {"two_factor_enabled": False, "active_sessions": 1, "last_login": datetime.now(timezone.utc).isoformat()},
        "connections": {"github_linked": False, "frekcore_linked": True},
    }


@router.put("/user/settings")
async def update_user_settings(body: dict):
    """Mettre a jour les parametres — MOCK."""
    return {"success": True, "message": "Parametres mis a jour (mock)", "updated": list(body.keys())}


# ═══════ FREK CERTIFICATION ═══════

@router.get("/frek/works/{frek_id}")
async def get_frek_works(frek_id: str):
    """Oeuvres certifiees d'un FREK-ID — MOCK."""
    return {"works": [
        {"work_id": "wrk-001", "frek_id": frek_id, "title": "Chanson du Soleil Levant",
         "type": "musique", "stage": "EMISSION", "fingerprint": "a3f2b1c4d5e6f7...",
         "visible_hash": "a3f", "metadata": {"genre": "zouk", "duration": "4:32"},
         "certified_at": "2026-03-15T10:00:00Z", "created_at": "2026-03-01T08:00:00Z"},
        {"work_id": "wrk-002", "frek_id": frek_id, "title": "Tableau de la Savane",
         "type": "art_visuel", "stage": "WORKSHOP", "fingerprint": "b7c8d9e0f1a2b3...",
         "visible_hash": "b7c", "metadata": {"medium": "huile sur toile", "dimensions": "120x80cm"},
         "certified_at": "2026-04-01T14:00:00Z", "created_at": "2026-03-20T16:00:00Z"},
    ]}


class CertifyRequest(BaseModel):
    title: str
    type: str
    file_hash: str
    metadata: dict = {}


@router.post("/frek/certify")
async def certify_work(body: CertifyRequest):
    """Certifier une oeuvre — MOCK."""
    return {
        "work_id": str(uuid.uuid4()),
        "frek_id": "FREK-MOCK-0001",
        "stage": "GENESIS",
        "fingerprint": body.file_hash[:16] + "...",
        "message": "Oeuvre certifiee (mock)"
    }


# ═══════ FEED ECLAIR ═══════

@router.post("/feed/eclair/{post_id}")
async def eclair_post(post_id: str):
    """Reaction Eclair (reaction premium, debite 1 KT) — MOCK."""
    return {"success": True, "eclair_count": 1, "kt_debited": 1, "message": "Eclair envoye (mock)"}


# ═══════ NFC SCAN (squelette) ═══════

class ScanRequest(BaseModel):
    badge_id: str
    agent_frek_id: str = ""
    zone_access: str = "entree"
    event_day: int = 1
    scan_type: str = "QR"


@router.post("/admin/scan")
async def admin_scan(body: ScanRequest):
    """Scan NFC/QR terrain — MOCK."""
    return {
        "success": True,
        "badge": {
            "badge_id": body.badge_id,
            "prenom": "Jean",
            "nom": "Dupont",
            "type_badge": "professionnel",
            "statut": "NFC_ACTIF",
            "photo_url": None,
        },
        "message": f"Badge {body.badge_id} scanne (mock)",
        "scan_count_today": 3,
    }
