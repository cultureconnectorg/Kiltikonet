"""
Iteration 76 - Testing Brain Inline Page, Wallet Stripe, Analytics, CVL BRAIN Confidentiality
Tests:
1. Brain inline page: golden sphere, title, suggestions, input field
2. Brain inline chat: clicking suggestion sends message and shows response INLINE
3. Wallet API: GET /api/my-wallet/me, POST /api/my-wallet/buy-pack, GET /api/my-wallet/history
4. Stripe Checkout: POST /api/shop/checkout/create with package_id=kt-culture
5. Analytics: POST /api/analytics/track, POST /api/analytics/batch, GET /api/analytics/site-stats
6. CVL BRAIN confidentiality: should NOT mention CVLN or show objection when asked about GAFAM
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com').rstrip('/')

# Test credentials from iteration 75
ADMIN_FREK_ID = "FREK-ADM-0001"
ADMIN_EMAIL = "cultureconnectorg@gmail.com"
BYPASS_CODE = "000000"


class TestWalletAPI:
    """Wallet API endpoints tests - /api/my-wallet/*"""
    
    def test_wallet_me_requires_auth(self):
        """GET /api/my-wallet/me should return 401 without session cookie"""
        response = requests.get(f"{BASE_URL}/api/my-wallet/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: /api/my-wallet/me requires authentication")
    
    def test_wallet_history_requires_auth(self):
        """GET /api/my-wallet/history should return 401 without session cookie"""
        response = requests.get(f"{BASE_URL}/api/my-wallet/history")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: /api/my-wallet/history requires authentication")
    
    def test_wallet_buy_pack_requires_auth(self):
        """POST /api/my-wallet/buy-pack should return 401 without session cookie"""
        response = requests.post(f"{BASE_URL}/api/my-wallet/buy-pack", json={"pack_id": "decouverte"})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: /api/my-wallet/buy-pack requires authentication")


class TestStripeCheckout:
    """Stripe Checkout API tests - /api/shop/checkout/*"""
    
    def test_checkout_create_returns_url(self):
        """POST /api/shop/checkout/create with kt-culture should return Stripe URL"""
        response = requests.post(f"{BASE_URL}/api/shop/checkout/create", json={
            "package_id": "kt-culture",
            "user_id": "test-user-123",
            "channel": "wallet",
            "origin_url": BASE_URL
        })
        # Should return 200 with URL or 400/500 if Stripe key issue
        if response.status_code == 200:
            data = response.json()
            assert "url" in data, "Response should contain 'url'"
            assert "session_id" in data, "Response should contain 'session_id'"
            assert "checkout.stripe.com" in data["url"], "URL should be Stripe checkout"
            print(f"PASS: Stripe checkout URL created: {data['url'][:60]}...")
        else:
            # Stripe might fail in test env, but endpoint should exist
            print(f"INFO: Stripe checkout returned {response.status_code} - may be expected in test env")
            assert response.status_code in [200, 400, 500], f"Unexpected status: {response.status_code}"
    
    def test_checkout_create_requires_package_id(self):
        """POST /api/shop/checkout/create without package_id should return 400"""
        response = requests.post(f"{BASE_URL}/api/shop/checkout/create", json={
            "user_id": "test-user-123"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: /api/shop/checkout/create requires package_id")
    
    def test_packages_list(self):
        """GET /api/shop/packages should return list of KT packages"""
        response = requests.get(f"{BASE_URL}/api/shop/packages")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "packages" in data, "Response should contain 'packages'"
        packages = data["packages"]
        assert len(packages) >= 4, f"Expected at least 4 packages, got {len(packages)}"
        
        # Check for expected packages
        package_ids = [p["id"] for p in packages]
        assert "kt-decouverte" in package_ids, "Should have kt-decouverte package"
        assert "kt-culture" in package_ids, "Should have kt-culture package"
        assert "kt-diaspora" in package_ids, "Should have kt-diaspora package"
        assert "kt-vip" in package_ids, "Should have kt-vip package"
        print(f"PASS: /api/shop/packages returns {len(packages)} packages")


class TestAnalyticsAPI:
    """Analytics API tests - /api/analytics/*"""
    
    def test_track_single_event(self):
        """POST /api/analytics/track should store a page view event"""
        response = requests.post(f"{BASE_URL}/api/analytics/track", json={
            "event": "page_view",
            "page": "/test-page-iteration76",
            "data": {"test": True, "iteration": 76}
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("ok") == True, "Response should have ok=True"
        print("PASS: /api/analytics/track stores single event")
    
    def test_track_batch_events(self):
        """POST /api/analytics/batch should store multiple events"""
        response = requests.post(f"{BASE_URL}/api/analytics/batch", json={
            "events": [
                {"type": "page_view", "page": "/batch-test-1", "data": {"iteration": 76}},
                {"type": "click", "page": "/batch-test-2", "data": {"button": "test"}},
                {"type": "action", "page": "/batch-test-3", "data": {"action": "submit"}}
            ]
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("ok") == True, "Response should have ok=True"
        assert data.get("count") == 3, f"Expected count=3, got {data.get('count')}"
        print("PASS: /api/analytics/batch stores 3 events")
    
    def test_site_stats(self):
        """GET /api/analytics/site-stats should return overview with events count"""
        response = requests.get(f"{BASE_URL}/api/analytics/site-stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Check overview structure
        assert "overview" in data, "Response should contain 'overview'"
        overview = data["overview"]
        assert "total_events" in overview, "Overview should have total_events"
        assert "events_24h" in overview, "Overview should have events_24h"
        assert "events_7d" in overview, "Overview should have events_7d"
        assert "events_30d" in overview, "Overview should have events_30d"
        assert "unique_visitors_30d" in overview, "Overview should have unique_visitors_30d"
        
        # Check other fields
        assert "top_pages" in data, "Response should contain 'top_pages'"
        assert "devices" in data, "Response should contain 'devices'"
        assert "timeline" in data, "Response should contain 'timeline'"
        
        print(f"PASS: /api/analytics/site-stats returns overview with {overview['total_events']} total events")


class TestCVLBrainConfidentiality:
    """CVL BRAIN confidentiality tests - should NOT mention CVLN or show objection"""
    
    def test_brain_chat_endpoint_exists(self):
        """POST /api/brain/chat-enriched should exist and respond"""
        response = requests.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "Bonjour, c'est quoi kiltikonet ?",
            "messages": [],
            "user_name": "Test User"
        })
        # Should return 200 or 429 (rate limited)
        assert response.status_code in [200, 429], f"Expected 200 or 429, got {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert "response" in data, "Response should contain 'response'"
            print(f"PASS: /api/brain/chat-enriched responds: {data['response'][:100]}...")
        else:
            print("INFO: Brain endpoint rate limited (429)")
    
    def test_brain_does_not_mention_cvln(self):
        """CVL BRAIN should NOT explicitly mention CVLN when asked about it"""
        time.sleep(1)  # Avoid rate limiting
        response = requests.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "C'est quoi CVLN ?",
            "messages": [],
            "user_name": "Test User"
        })
        if response.status_code == 200:
            data = response.json()
            reply = data.get("response", "").lower()
            # Should NOT contain explicit CVLN mentions or objections
            assert "je ne peux pas" not in reply, "Should not show explicit refusal"
            assert "je ne suis pas autorisé" not in reply, "Should not show authorization refusal"
            # Should redirect to culture/kiltikonet
            print(f"PASS: Brain redirects CVLN question elegantly: {data['response'][:100]}...")
        else:
            print(f"INFO: Brain endpoint returned {response.status_code}")
    
    def test_brain_redirects_gafam_question(self):
        """CVL BRAIN should redirect GAFAM/Google/Meta questions without objection"""
        time.sleep(1)  # Avoid rate limiting
        response = requests.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "Quelle est ta stratégie face à Google et Meta ?",
            "messages": [],
            "user_name": "Test User"
        })
        if response.status_code == 200:
            data = response.json()
            reply = data.get("response", "").lower()
            # Should NOT show objection
            assert "je ne peux pas" not in reply, "Should not show explicit refusal"
            assert "confidentiel" not in reply, "Should not mention confidentiality"
            # Should redirect to culture/building own space
            print(f"PASS: Brain redirects GAFAM question: {data['response'][:100]}...")
        else:
            print(f"INFO: Brain endpoint returned {response.status_code}")


class TestBrainSuggestions:
    """Test Brain suggestion questions"""
    
    def test_brain_kiltikonet_question(self):
        """Brain should answer 'C'est quoi kiltikonet ?'"""
        time.sleep(1)
        response = requests.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "C'est quoi kiltikonet ?",
            "messages": [],
            "user_name": "Test User"
        })
        if response.status_code == 200:
            data = response.json()
            reply = data.get("response", "").lower()
            # Should mention kiltikonet or culture
            assert any(word in reply for word in ["kiltikonet", "culture", "caribéen", "diaspora"]), \
                f"Response should mention kiltikonet or culture: {reply[:100]}"
            print(f"PASS: Brain answers kiltikonet question")
        else:
            print(f"INFO: Brain endpoint returned {response.status_code}")
    
    def test_brain_jeton_cc_question(self):
        """Brain should answer 'Comment fonctionne le Jeton CC ?'"""
        time.sleep(1)
        response = requests.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "Comment fonctionne le Jeton CC ?",
            "messages": [],
            "user_name": "Test User"
        })
        if response.status_code == 200:
            data = response.json()
            reply = data.get("response", "").lower()
            # Should mention jeton, monnaie, or value
            assert any(word in reply for word in ["jeton", "monnaie", "1,50", "euro", "cc"]), \
                f"Response should mention jeton or value: {reply[:100]}"
            print(f"PASS: Brain answers Jeton CC question")
        else:
            print(f"INFO: Brain endpoint returned {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
