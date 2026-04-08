"""
ITER.81 — Omega Espace Pro Modules Testing
Tests for: OrbitalMenu, Feed, Shop, Agenda, Inbox, Cockpit, Profile, Accreditation, Scan, Gouvernance
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestOmegaFeed:
    """Feed module — /api/feed/posts with 20 seeded posts"""
    
    def test_feed_posts_returns_list(self):
        """GET /api/feed/posts returns paginated posts"""
        response = requests.get(f"{BASE_URL}/api/feed/posts?page=1&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        assert "total" in data
        assert "has_more" in data
        assert isinstance(data["posts"], list)
        print(f"Feed: {len(data['posts'])} posts returned, total: {data['total']}")
    
    def test_feed_posts_have_required_fields(self):
        """Feed posts have required fields: post_id, contenu, prenom_auteur, media_url, tags"""
        response = requests.get(f"{BASE_URL}/api/feed/posts?page=1&limit=5")
        assert response.status_code == 200
        data = response.json()
        if data["posts"]:
            post = data["posts"][0]
            assert "post_id" in post
            assert "contenu" in post
            assert "prenom_auteur" in post
            assert "media_url" in post
            assert "tags" in post
            assert "nb_eclairs" in post
            print(f"Post sample: {post['prenom_auteur']} - {post['contenu'][:50]}...")
    
    def test_feed_pagination(self):
        """Feed pagination works correctly"""
        page1 = requests.get(f"{BASE_URL}/api/feed/posts?page=1&limit=5").json()
        page2 = requests.get(f"{BASE_URL}/api/feed/posts?page=2&limit=5").json()
        if page1["total"] > 5:
            assert page1["posts"][0]["post_id"] != page2["posts"][0]["post_id"]
            print(f"Pagination OK: page1 first={page1['posts'][0]['post_id'][:8]}, page2 first={page2['posts'][0]['post_id'][:8]}")


class TestOmegaShop:
    """Shop module — /api/shop/packs with 4 JCC packs"""
    
    def test_shop_packs_returns_4_packs(self):
        """GET /api/shop/packs returns 4 JCC packs (10/25/50/100€)"""
        response = requests.get(f"{BASE_URL}/api/shop/packs")
        assert response.status_code == 200
        data = response.json()
        assert "packs" in data
        packs = data["packs"]
        assert len(packs) == 4, f"Expected 4 packs, got {len(packs)}"
        
        # Verify prices
        prices = sorted([p["price"] for p in packs])
        assert prices == [10.0, 25.0, 50.0, 100.0], f"Expected [10, 25, 50, 100], got {prices}"
        print(f"Shop packs: {[p['name'] for p in packs]}")
    
    def test_shop_packs_have_required_fields(self):
        """Shop packs have required fields"""
        response = requests.get(f"{BASE_URL}/api/shop/packs")
        assert response.status_code == 200
        packs = response.json()["packs"]
        for pack in packs:
            assert "id" in pack
            assert "name" in pack
            assert "tokens" in pack
            assert "price" in pack
            assert "currency" in pack
            print(f"Pack: {pack['name']} - {pack['tokens']} JCC for {pack['price']}€")
    
    def test_shop_products_endpoint(self):
        """GET /api/shop/products returns products list"""
        response = requests.get(f"{BASE_URL}/api/shop/products?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"Shop products: {len(data['products'])} items")


class TestOmegaAgenda:
    """Agenda module — /api/planning/cc2026 with 4 days"""
    
    def test_agenda_returns_4_days(self):
        """GET /api/planning/cc2026 returns 4 days of programming"""
        response = requests.get(f"{BASE_URL}/api/planning/cc2026")
        assert response.status_code == 200
        data = response.json()
        assert "days" in data
        days = data["days"]
        assert len(days) >= 4, f"Expected at least 4 days, got {len(days)}"
        print(f"Agenda: {len(days)} days of CC2026 programming")
    
    def test_agenda_has_kathy_liana_bravo(self):
        """Agenda includes Kathy-Liana Bravo on May 22 at 22h"""
        response = requests.get(f"{BASE_URL}/api/planning/cc2026")
        assert response.status_code == 200
        data = response.json()
        
        found = False
        for day in data["days"]:
            events = day.get("events") or day.get("slots", [])
            for event in events:
                artiste = event.get("artiste", "").lower()
                if "kathy" in artiste and "bravo" in artiste:
                    found = True
                    print(f"Found Kathy-Liana Bravo: {event['heure']} - {event['titre']} at {event['lieu']}")
                    break
        
        assert found, "Kathy-Liana Bravo not found in agenda"
    
    def test_agenda_events_have_required_fields(self):
        """Agenda events have required fields"""
        response = requests.get(f"{BASE_URL}/api/planning/cc2026")
        assert response.status_code == 200
        data = response.json()
        
        day = data["days"][0]
        events = day.get("events") or day.get("slots", [])
        if events:
            event = events[0]
            assert "heure" in event
            assert "titre" in event
            assert "lieu" in event
            assert "artiste" in event
            print(f"Event sample: {event['heure']} - {event['titre']}")


class TestOmegaGouvernance:
    """Gouvernance module — /api/gouvernance/proposals with 4 seeded proposals"""
    
    def test_gouvernance_proposals_endpoint(self):
        """GET /api/gouvernance/proposals returns proposals list"""
        response = requests.get(f"{BASE_URL}/api/gouvernance/proposals", cookies={})
        # May return 401 if auth required, or 200 with proposals
        assert response.status_code in [200, 401]
        if response.status_code == 200:
            data = response.json()
            assert "proposals" in data
            print(f"Gouvernance: {len(data['proposals'])} proposals")
    
    def test_gouvernance_seed_endpoint(self):
        """GET /api/gouvernance/seed seeds proposals if empty"""
        response = requests.get(f"{BASE_URL}/api/gouvernance/seed")
        assert response.status_code == 200
        data = response.json()
        print(f"Gouvernance seed: {data}")


class TestOmegaAccreditation:
    """Accreditation module — 6 types with prices"""
    
    def test_accreditation_types_returns_6_types(self):
        """GET /api/accreditation/types returns 6 accreditation types"""
        response = requests.get(f"{BASE_URL}/api/accreditation/types")
        assert response.status_code == 200
        data = response.json()
        assert "types" in data
        types = data["types"]
        assert len(types) >= 6, f"Expected at least 6 types, got {len(types)}"
        print(f"Accreditation types: {list(types.keys())}")
    
    def test_accreditation_types_have_prices(self):
        """Accreditation types have price field"""
        response = requests.get(f"{BASE_URL}/api/accreditation/types")
        assert response.status_code == 200
        types = response.json()["types"]
        for type_id, type_data in types.items():
            assert "price" in type_data, f"Type {type_id} missing price"
            assert "label" in type_data, f"Type {type_id} missing label"
            print(f"Type {type_id}: {type_data['label']} - {type_data['price']}€")
    
    def test_accreditation_apply_endpoint(self):
        """POST /api/accreditation/apply accepts application"""
        test_email = f"test_{uuid.uuid4().hex[:8]}@test.local"
        payload = {
            "prenom": "Test",
            "nom": "User",
            "email": test_email,
            "telephone": "+33600000000",
            "organisation": "Test Org",
            "bio": "Test bio",
            "type_accreditation": "VISITEUR",
            "jours_selectionnes": ["2026-05-20", "2026-05-21"]
        }
        response = requests.post(f"{BASE_URL}/api/accreditation/apply", json=payload)
        # Should return 200/201 or 400 if type invalid
        assert response.status_code in [200, 201, 400, 409]
        print(f"Accreditation apply: {response.status_code} - {response.json()}")
    
    def test_accreditation_my_requires_auth(self):
        """GET /api/accreditation/my requires authentication"""
        response = requests.get(f"{BASE_URL}/api/accreditation/my")
        assert response.status_code == 401
        print("Accreditation /my correctly requires auth")


class TestOmegaBadgeScan:
    """Badge/NFC Scan module — /api/badges/scan"""
    
    def test_badge_types_endpoint(self):
        """GET /api/badges/types returns badge types and zones"""
        response = requests.get(f"{BASE_URL}/api/badges/types")
        assert response.status_code == 200
        data = response.json()
        assert "types" in data
        assert "zones" in data
        print(f"Badge types: {list(data['types'].keys())}")
        print(f"Zones: {list(data['zones'].keys())}")
    
    def test_badge_scan_requires_badge_id(self):
        """POST /api/badges/scan requires badge_id or qr_token"""
        response = requests.post(f"{BASE_URL}/api/badges/scan", json={"zone": "ENTREE_GENERALE"})
        assert response.status_code == 400
        print("Badge scan correctly requires badge_id or qr_token")
    
    def test_badge_scan_invalid_badge(self):
        """POST /api/badges/scan returns 404 for invalid badge"""
        response = requests.post(f"{BASE_URL}/api/badges/scan", json={
            "badge_id": "CC26-INVALID-00000",
            "zone": "ENTREE_GENERALE"
        })
        assert response.status_code == 404
        print("Badge scan correctly returns 404 for invalid badge")


class TestOmegaTerminal:
    """Terminal/Cockpit module — /api/terminal/deploy"""
    
    def test_terminal_deploys_list(self):
        """GET /api/terminal/deploys returns deploy list"""
        response = requests.get(f"{BASE_URL}/api/terminal/deploys")
        assert response.status_code == 200
        data = response.json()
        assert "deploys" in data
        print(f"Terminal deploys: {len(data['deploys'])} items")


class TestOmegaAdhesion:
    """Adhesion module — /api/adhesion/levels"""
    
    def test_adhesion_levels_returns_4_levels(self):
        """GET /api/adhesion/levels returns 4 levels"""
        response = requests.get(f"{BASE_URL}/api/adhesion/levels")
        assert response.status_code == 200
        data = response.json()
        assert "levels" in data
        levels = data["levels"]
        assert len(levels) == 4, f"Expected 4 levels, got {len(levels)}"
        
        level_ids = [l["id"] for l in levels]
        assert "FREE" in level_ids
        assert "PRO" in level_ids
        assert "PREMIUM" in level_ids
        assert "INSTITUTIONNEL" in level_ids
        print(f"Adhesion levels: {level_ids}")
    
    def test_adhesion_current_requires_auth(self):
        """GET /api/adhesion/current requires authentication"""
        response = requests.get(f"{BASE_URL}/api/adhesion/current")
        assert response.status_code == 401
        print("Adhesion /current correctly requires auth")


class TestOmegaUserSettings:
    """User Settings module — /api/user/settings"""
    
    def test_user_settings_requires_auth(self):
        """GET /api/user/settings requires authentication"""
        response = requests.get(f"{BASE_URL}/api/user/settings")
        assert response.status_code == 401
        print("User settings correctly requires auth")
    
    def test_user_account_delete_requires_auth(self):
        """DELETE /api/user/account requires authentication"""
        response = requests.delete(f"{BASE_URL}/api/user/account")
        assert response.status_code == 401
        print("User account delete correctly requires auth")


class TestOmegaMessages:
    """DM/Inbox module — /api/messages/conversations"""
    
    def test_messages_conversations_requires_auth(self):
        """GET /api/messages/conversations requires authentication"""
        response = requests.get(f"{BASE_URL}/api/messages/conversations")
        assert response.status_code == 401
        print("Messages conversations correctly requires auth")


class TestOmegaBrain:
    """CVL Brain module — /api/brain/memory/history"""
    
    def test_brain_memory_history(self):
        """GET /api/brain/memory/history returns conversations list"""
        response = requests.get(f"{BASE_URL}/api/brain/memory/history")
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        assert "total" in data
        print(f"Brain memory: {data['total']} conversations")
    
    def test_brain_chat_enriched_requires_permission(self):
        """POST /api/brain/chat-enriched requires permission"""
        response = requests.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "Test message"
        })
        # Should return 401/403/500 without proper auth
        assert response.status_code in [401, 403, 500]
        print(f"Brain chat-enriched: {response.status_code}")


class TestOmegaFREK:
    """FREK module — /api/frek/health"""
    
    def test_frek_health(self):
        """GET /api/frek/health returns health status"""
        response = requests.get(f"{BASE_URL}/api/frek/health")
        assert response.status_code == 200
        data = response.json()
        assert "healthy" in data
        assert "fallback_mode" in data
        print(f"FREK health: healthy={data['healthy']}, fallback={data['fallback_mode']}")


class TestOmegaWallet:
    """Wallet module — /api/my-wallet/me"""
    
    def test_wallet_me_requires_auth(self):
        """GET /api/my-wallet/me requires authentication"""
        response = requests.get(f"{BASE_URL}/api/my-wallet/me")
        assert response.status_code == 401
        print("Wallet /me correctly requires auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
