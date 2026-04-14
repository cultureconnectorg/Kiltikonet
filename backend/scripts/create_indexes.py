#!/usr/bin/env python3
"""
create_indexes.py — Script standalone pour créer tous les indexes MongoDB.
Usage: python backend/scripts/create_indexes.py
"""
import asyncio
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")


async def create_all_indexes():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    print(f"Connected to MongoDB: {DB_NAME}")

    # Registrations
    await db.registrations.create_index("status")
    await db.registrations.create_index("show_in_catalog")
    await db.registrations.create_index([("status", 1), ("show_in_catalog", 1)])
    await db.registrations.create_index("profile_type")
    await db.registrations.create_index("country")
    await db.registrations.create_index("tier")
    await db.registrations.create_index("email", unique=False)
    await db.registrations.create_index("frek_id", unique=True, sparse=True)
    await db.registrations.create_index("expertise_tags")
    print("  registrations indexes OK")

    # Partners
    await db.partners.create_index("tier")
    await db.partners.create_index("show_on_landing")
    print("  partners indexes OK")

    # Batch jobs
    await db.batch_jobs.create_index("status")
    await db.batch_jobs.create_index("started_at")
    print("  batch_jobs indexes OK")

    # Email logs
    await db.email_logs.create_index("email_type")
    await db.email_logs.create_index("status")
    await db.email_logs.create_index("sent_at")
    await db.email_logs.create_index("participant_id")
    print("  email_logs indexes OK")

    # Payment transactions
    await db.payment_transactions.create_index("session_id", unique=True)
    await db.payment_transactions.create_index("payment_status")
    print("  payment_transactions indexes OK")

    # Magic links & invitations
    await db.magic_links.create_index("token", unique=True)
    await db.magic_links.create_index("email")
    await db.magic_links.create_index("expires_at")
    await db.invitations.create_index("token", unique=True, sparse=True)
    await db.invitations.create_index("email")
    print("  magic_links & invitations indexes OK")

    # Audit logs
    await db.audit_logs.create_index([("user_frek_id", 1), ("timestamp", -1)])
    await db.audit_logs.create_index([("action_type", 1)])
    print("  audit_logs indexes OK")

    # Brain training
    await db.brain_training_data.create_index([("eligible_training", 1), ("timestamp", -1)])
    await db.brain_training_data.create_index([("frek_id", 1)])
    print("  brain_training_data indexes OK")

    # Adhesions
    await db.adhesions.create_index([("email", 1), ("actif", 1)])
    print("  adhesions indexes OK")

    # Feed posts
    await db.feed_posts.create_index([("timestamp", -1)])
    await db.feed_posts.create_index([("frek_id_auteur", 1)])
    print("  feed_posts indexes OK")

    # Pro posts
    await db.pro_posts.create_index([("created_at", -1)])
    await db.pro_posts.create_index([("author_id", 1)])
    await db.pro_posts.create_index([("is_ghost", 1)])
    print("  pro_posts indexes OK")

    # FREK IDs
    await db.frek_ids.create_index([("email", 1)], unique=True, sparse=True)
    print("  frek_ids indexes OK")

    # Builder projects
    await db.builder_projects.create_index([("email", 1)])
    await db.builder_projects.create_index([("project_id", 1)], unique=True)
    print("  builder_projects indexes OK")

    # Site analytics
    await db.site_visits.create_index([("timestamp", -1)])
    await db.site_visits.create_index([("page", 1)])
    print("  site_visits indexes OK")

    client.close()
    print("\nAll indexes created successfully!")


if __name__ == "__main__":
    asyncio.run(create_all_indexes())
