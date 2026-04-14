"""
Production cleanup script — Run ONCE before launch.
Removes ghost/test data while preserving real user data.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "culture_connect_2026")

async def cleanup():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("=== PRODUCTION CLEANUP ===")
    
    # 1. Remove ghost posts
    r = await db.pro_posts.delete_many({"is_ghost": True})
    print(f"  Ghost posts removed: {r.deleted_count}")
    
    # 2. Remove ghost profiles
    r = await db.ghost_profiles_v2.delete_many({})
    print(f"  Ghost profiles v2 removed: {r.deleted_count}")
    r = await db.ghost_profiles.delete_many({})
    print(f"  Ghost profiles removed: {r.deleted_count}")
    
    # 3. Remove old test feed_posts (dead collection)
    r = await db.feed_posts.delete_many({})
    print(f"  Old feed_posts removed: {r.deleted_count}")
    
    # 4. Remove test analytics
    r = await db.analytics_events.delete_many({})
    print(f"  Test analytics cleared: {r.deleted_count}")
    
    # 5. Remove test support tickets
    r = await db.support_tickets.delete_many({})
    print(f"  Test tickets cleared: {r.deleted_count}")
    
    # 6. Remove test workspace logs
    r = await db.workspace_logs.delete_many({})
    print(f"  Test workspace logs cleared: {r.deleted_count}")
    
    # 7. Remove agent/test logs
    r = await db.agent_logs.delete_many({})
    print(f"  Agent logs cleared: {r.deleted_count}")
    
    # Stats after cleanup
    print("\n=== POST-CLEANUP STATE ===")
    real_posts = await db.pro_posts.count_documents({})
    registrations = await db.registrations.count_documents({})
    faqs = await db.faqs.count_documents({})
    print(f"  Real posts: {real_posts}")
    print(f"  Registrations: {registrations}")
    print(f"  FAQs: {faqs}")
    print(f"  Partners: {await db.partners.count_documents({})}")
    print(f"  Events: {await db.cc_events.count_documents({})}")
    
    print("\n✅ Production ready")

if __name__ == "__main__":
    asyncio.run(cleanup())
