"""
MongoDB Index Creation Script — Culture Connect 2026
Run once after deployment to add missing unique/performance indexes.
Idempotent: safe to re-run (createIndex with existing name is a no-op).

Usage:
    python backend/scripts/create_indexes.py
    MONGO_URL=mongodb://... python backend/scripts/create_indexes.py
"""
import os
import logging
from pymongo import MongoClient, ASCENDING, DESCENDING

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "culture_connect_2026")


def create_indexes():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]

    created = []

    # ── M1: cc_badges — unique email + frek_id to prevent duplicate badge creation ──
    db.cc_badges.create_index(
        [("email", ASCENDING)],
        unique=True,
        sparse=True,  # sparse: allows multiple docs with no email field
        name="cc_badges_email_unique",
        background=True,
    )
    created.append("cc_badges.email (unique, sparse)")

    db.cc_badges.create_index(
        [("frek_id", ASCENDING)],
        unique=True,
        sparse=True,
        name="cc_badges_frek_id_unique",
        background=True,
    )
    created.append("cc_badges.frek_id (unique, sparse)")

    # ── M2: kn_wallets — unique user_id to prevent duplicate NFC wallets ──
    db.kn_wallets.create_index(
        [("user_id", ASCENDING)],
        unique=True,
        sparse=True,
        name="kn_wallets_user_id_unique",
        background=True,
    )
    created.append("kn_wallets.user_id (unique, sparse)")

    # ── M3: adhesions_pending — index session_id for fast Stripe webhook lookup ──
    db.adhesions_pending.create_index(
        [("session_id", ASCENDING)],
        unique=True,
        sparse=True,
        name="adhesions_pending_session_id_idx",
        background=True,
    )
    created.append("adhesions_pending.session_id (unique, sparse)")

    # ── Bonus performance indexes ──
    db.pro_posts.create_index(
        [("author_frek_id", ASCENDING), ("created_at", DESCENDING)],
        name="pro_posts_author_frek_id_created_at",
        background=True,
    )
    created.append("pro_posts.(author_frek_id, created_at)")

    db.registrations.create_index(
        [("email", ASCENDING)],
        unique=True,
        sparse=True,
        name="registrations_email_unique",
        background=True,
    )
    created.append("registrations.email (unique, sparse)")

    client.close()

    logger.info("Indexes created/verified:")
    for idx in created:
        logger.info("  ✓ %s", idx)
    logger.info("Done — %d indexes", len(created))


if __name__ == "__main__":
    create_indexes()
