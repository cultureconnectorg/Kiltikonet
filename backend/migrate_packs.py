import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

async def migrate():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    # Delete old KT packs
    old_ids = ['kt-10', 'kt-50', 'kt-100', 'kt-250', 'kt-500']
    result = await db.shop_products.delete_many({'id': {'$in': old_ids}})
    print(f'Deleted {result.deleted_count} old KT packs')
    
    # Check if new packs exist
    new_ids = ['kt-decouverte', 'kt-culture', 'kt-diaspora', 'kt-vip', 'kt-partenaire']
    existing = await db.shop_products.count_documents({'id': {'$in': new_ids}})
    print(f'Existing new packs: {existing}')
    
    if existing == 0:
        new_packs = [
            {'id': 'kt-decouverte', 'name': 'Pack Decouverte — 15 KT', 'description': 'Payez 10e, recevez 15 Kilti-Tokens. Bonus +50% inclus !', 'price': 10.00, 'currency': 'EUR', 'category': 'jetons', 'badge': 'Populaire', 'stock': -1, 'order': 1, 'active': True, 'created_at': datetime.now(timezone.utc).isoformat()},
            {'id': 'kt-culture', 'name': 'Pack Culture — 40 KT', 'description': 'Payez 25e, recevez 40 Kilti-Tokens. Bonus +60% !', 'price': 25.00, 'currency': 'EUR', 'category': 'jetons', 'badge': 'Bonus +60%', 'stock': -1, 'order': 2, 'active': True, 'created_at': datetime.now(timezone.utc).isoformat()},
            {'id': 'kt-diaspora', 'name': 'Pack Diaspora — 85 KT', 'description': 'Payez 50e, recevez 85 Kilti-Tokens. Bonus premium +70% !', 'price': 50.00, 'currency': 'EUR', 'category': 'jetons', 'badge': 'Bonus Premium', 'stock': -1, 'order': 3, 'active': True, 'created_at': datetime.now(timezone.utc).isoformat()},
            {'id': 'kt-vip', 'name': 'Pack VIP — 180 KT', 'description': 'Payez 100e, recevez 180 Kilti-Tokens. Doublement de la valeur !', 'price': 100.00, 'currency': 'EUR', 'category': 'jetons', 'badge': 'Valeur x1.8', 'stock': -1, 'order': 4, 'active': True, 'created_at': datetime.now(timezone.utc).isoformat()},
            {'id': 'kt-partenaire', 'name': 'Pack Partenaire — 1000 KT', 'description': 'Offre institutionnelle 500e pour 1000 Kilti-Tokens.', 'price': 500.00, 'currency': 'EUR', 'category': 'jetons', 'badge': 'Institutionnel', 'stock': -1, 'order': 5, 'active': True, 'created_at': datetime.now(timezone.utc).isoformat()},
        ]
        await db.shop_products.insert_many(new_packs)
        print(f'Inserted {len(new_packs)} new KT packs')
    else:
        print('New packs already exist, skipping insert')
    
    # Update existing wallets with validity_extension
    result = await db.kn_wallets.update_many(
        {'validity_extension': {'$exists': False}},
        {'$set': {'validity_extension': True, 'validity_note': 'KT valables CC2026, reportables CC2027'}}
    )
    print(f'Updated {result.modified_count} wallets with validity_extension')
    
    client.close()

asyncio.run(migrate())
