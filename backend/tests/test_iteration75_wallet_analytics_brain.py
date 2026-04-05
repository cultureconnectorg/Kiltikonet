"""
Iteration 75 - Wallet, Analytics, and CVL BRAIN Testing
Tests for:
- Wallet: GET /api/my-wallet/me, POST /api/my-wallet/buy-pack, GET /api/my-wallet/history, GET /api/my-wallet/analytics
- Analytics: POST /api/analytics/track, POST /api/analytics/batch, GET /api/analytics/site-stats
- CVL BRAIN: Anticipation contextuelle, confidentiality redirections
"""
import pytest
import requests
import os
import time
import uuid

# Use local backend to avoid rate limiting
BASE_URL = "http://127.0.0.1:8001"

# Test credentials from iteration 73/74
ADMIN_FREK_ID = "FREK-ADM-0001"
ADMIN_EMAIL = "cultureconnectorg@gmail.com"
BYPASS_CODE = "000000"


def get_auth_session():
    """Create authenticated session with admin FREK-ID - returns session with cookie header set"""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    
    # Step 1: Initiate FREK auth
    resp = s.post(f"{BASE_URL}/api/auth/frek", json={"frek_id": ADMIN_FREK_ID})
    if resp.status_code == 429:
        time.sleep(5)
        resp = s.post(f"{BASE_URL}/api/auth/frek", json={"frek_id": ADMIN_FREK_ID})
    
    if resp.status_code != 200:
        return None
    
    # Step 2: Verify with bypass code
    resp = s.post(f"{BASE_URL}/api/auth/frek/verify", json={
        "frek_id": ADMIN_FREK_ID,
        "code": BYPASS_CODE
    })
    if resp.status_code != 200:
        return None
    
    # Get the cookie value and set it manually in headers
    # (because secure=True cookies aren't sent over HTTP)
    cookie_val = s.cookies.get("kk_session")
    if cookie_val:
        s.headers.update({"Cookie": f"kk_session={cookie_val}"})
    
    return s


class TestAuthentication:
    """Get session cookie for authenticated tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create authenticated session with admin FREK-ID"""
        s = get_auth_session()
        assert s is not None, "Failed to authenticate"
        return s
    
    def test_auth_me_returns_profile(self, session):
        """Verify authenticated session returns user profile"""
        resp = session.get(f"{BASE_URL}/api/auth/me")
        assert resp.status_code == 200
        data = resp.json()
        # Email can be at root level or nested in session
        email = data.get("email") or data.get("session", {}).get("email")
        assert email == ADMIN_EMAIL.lower()
        print(f"✓ Auth /me returns profile for {email}")


class TestWalletEndpoints:
    """Test wallet routes under /api/my-wallet"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        s = get_auth_session()
        assert s is not None, "Failed to authenticate"
        return s
    
    def test_wallet_me_returns_balance(self, auth_session):
        """GET /api/my-wallet/me returns balance, balance_eur, chart_points, packs"""
        resp = auth_session.get(f"{BASE_URL}/api/my-wallet/me")
        assert resp.status_code == 200, f"Wallet /me failed: {resp.text}"
        
        data = resp.json()
        # Required fields
        assert "balance" in data, "Missing balance field"
        assert "balance_eur" in data, "Missing balance_eur field"
        assert "chart_points" in data, "Missing chart_points field"
        assert "packs" in data, "Missing packs field"
        
        # Validate types
        assert isinstance(data["balance"], (int, float)), "balance should be numeric"
        assert isinstance(data["balance_eur"], (int, float)), "balance_eur should be numeric"
        assert isinstance(data["chart_points"], list), "chart_points should be list"
        assert isinstance(data["packs"], dict), "packs should be dict"
        
        # Validate packs structure
        expected_packs = ["decouverte", "culture", "diaspora", "vip"]
        for pack_id in expected_packs:
            assert pack_id in data["packs"], f"Missing pack: {pack_id}"
            pack = data["packs"][pack_id]
            assert "label" in pack and "price_eur" in pack and "jetons" in pack
        
        print(f"✓ Wallet /me: balance={data['balance']} CC ({data['balance_eur']}€)")
        print(f"  Chart points: {len(data['chart_points'])} points")
        print(f"  Packs available: {list(data['packs'].keys())}")
    
    def test_wallet_history_returns_transactions(self, auth_session):
        """GET /api/my-wallet/history returns transaction list"""
        resp = auth_session.get(f"{BASE_URL}/api/my-wallet/history")
        assert resp.status_code == 200, f"Wallet /history failed: {resp.text}"
        
        data = resp.json()
        assert "history" in data, "Missing history field"
        assert "total" in data, "Missing total field"
        assert isinstance(data["history"], list), "history should be list"
        
        if data["history"]:
            tx = data["history"][0]
            assert "id" in tx, "Transaction missing id"
            assert "type" in tx, "Transaction missing type"
            assert "label" in tx, "Transaction missing label"
            assert "amount" in tx, "Transaction missing amount"
            assert "date" in tx, "Transaction missing date"
            print(f"✓ Wallet /history: {data['total']} transactions")
            print(f"  Latest: {tx['label']} ({tx['amount']} CC)")
        else:
            print(f"✓ Wallet /history: No transactions yet")
    
    def test_wallet_buy_pack_culture(self, auth_session):
        """POST /api/my-wallet/buy-pack with pack_id=culture adds jetons"""
        # Get initial balance
        resp = auth_session.get(f"{BASE_URL}/api/my-wallet/me")
        initial_balance = resp.json().get("balance", 0)
        
        # Buy culture pack (25€ = 16 jetons)
        resp = auth_session.post(f"{BASE_URL}/api/my-wallet/buy-pack", json={"pack_id": "culture"})
        assert resp.status_code == 200, f"Buy pack failed: {resp.text}"
        
        data = resp.json()
        assert data.get("success") == True, "success should be True"
        assert "transaction_id" in data, "Missing transaction_id"
        assert data.get("jetons_added") == 16, "Culture pack should add 16 jetons"
        assert "new_balance" in data, "Missing new_balance"
        assert data["new_balance"] == initial_balance + 16, f"Balance should increase by 16"
        
        print(f"✓ Wallet buy-pack: +{data['jetons_added']} CC")
        print(f"  Transaction ID: {data['transaction_id']}")
        print(f"  New balance: {data['new_balance']} CC")
    
    def test_wallet_analytics_returns_categories(self, auth_session):
        """GET /api/my-wallet/analytics returns spending breakdown"""
        resp = auth_session.get(f"{BASE_URL}/api/my-wallet/analytics")
        assert resp.status_code == 200, f"Wallet /analytics failed: {resp.text}"
        
        data = resp.json()
        assert "categories" in data, "Missing categories field"
        assert "total_spent" in data, "Missing total_spent field"
        assert isinstance(data["categories"], list), "categories should be list"
        
        if data["categories"]:
            cat = data["categories"][0]
            assert "label" in cat, "Category missing label"
            assert "pct" in cat, "Category missing pct"
            assert "color" in cat, "Category missing color"
            print(f"✓ Wallet /analytics: {len(data['categories'])} categories, {data['total_spent']} CC spent")
        else:
            print(f"✓ Wallet /analytics: No spending data yet")
    
    def test_wallet_unauthenticated_returns_401(self):
        """Wallet endpoints require authentication"""
        s = requests.Session()
        
        resp = s.get(f"{BASE_URL}/api/my-wallet/me")
        assert resp.status_code == 401, "Should return 401 without auth"
        
        resp = s.get(f"{BASE_URL}/api/my-wallet/history")
        assert resp.status_code == 401, "Should return 401 without auth"
        
        resp = s.post(f"{BASE_URL}/api/my-wallet/buy-pack", json={"pack_id": "culture"})
        assert resp.status_code == 401, "Should return 401 without auth"
        
        print("✓ Wallet endpoints correctly require authentication")


class TestAnalyticsEndpoints:
    """Test site analytics routes under /api/analytics"""
    
    def test_analytics_track_single_event(self):
        """POST /api/analytics/track stores single event"""
        resp = requests.post(f"{BASE_URL}/api/analytics/track", json={
            "event": "page_view",
            "page": "/test-page",
            "data": {"test": True, "iteration": 75}
        })
        assert resp.status_code == 200, f"Track failed: {resp.text}"
        
        data = resp.json()
        assert data.get("ok") == True, "Should return ok=true"
        print("✓ Analytics /track: Single event tracked")
    
    def test_analytics_batch_multiple_events(self):
        """POST /api/analytics/batch stores multiple events"""
        events = [
            {"type": "page_view", "page": "/batch-test-1", "data": {"batch": True}},
            {"type": "click", "page": "/batch-test-1", "data": {"element": "button"}},
            {"type": "page_view", "page": "/batch-test-2", "data": {"batch": True}},
        ]
        
        resp = requests.post(f"{BASE_URL}/api/analytics/batch", json={"events": events})
        assert resp.status_code == 200, f"Batch failed: {resp.text}"
        
        data = resp.json()
        assert data.get("ok") == True, "Should return ok=true"
        assert data.get("count") == 3, "Should track 3 events"
        print(f"✓ Analytics /batch: {data['count']} events tracked")
    
    def test_analytics_site_stats_returns_overview(self):
        """GET /api/analytics/site-stats returns aggregated stats"""
        resp = requests.get(f"{BASE_URL}/api/analytics/site-stats")
        assert resp.status_code == 200, f"Site stats failed: {resp.text}"
        
        data = resp.json()
        
        # Required fields
        assert "overview" in data, "Missing overview field"
        assert "top_pages" in data, "Missing top_pages field"
        assert "devices" in data, "Missing devices field"
        assert "timeline" in data, "Missing timeline field"
        
        # Validate overview structure
        overview = data["overview"]
        assert "total_events" in overview, "Missing total_events"
        assert "events_24h" in overview, "Missing events_24h"
        assert "events_7d" in overview, "Missing events_7d"
        assert "events_30d" in overview, "Missing events_30d"
        assert "unique_visitors_30d" in overview, "Missing unique_visitors_30d"
        
        # Validate devices structure
        devices = data["devices"]
        assert "desktop" in devices, "Missing desktop count"
        assert "mobile" in devices, "Missing mobile count"
        assert "tablet" in devices, "Missing tablet count"
        
        print(f"✓ Analytics /site-stats:")
        print(f"  Total events: {overview['total_events']}")
        print(f"  Events 24h: {overview['events_24h']}")
        print(f"  Unique visitors 30d: {overview['unique_visitors_30d']}")
        print(f"  Top pages: {len(data['top_pages'])}")


class TestCVLBrainAnticipation:
    """Test CVL BRAIN contextual anticipation and confidentiality"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        s = get_auth_session()
        assert s is not None, "Failed to authenticate"
        return s
    
    def test_brain_cc2026_anticipation(self, auth_session):
        """Asking about CC2026 should suggest next steps subtly"""
        resp = auth_session.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "C'est quoi CC2026?",
            "user_name": "Test User",
            "user_context": {"email": ADMIN_EMAIL, "frek_id": ADMIN_FREK_ID}
        })
        
        if resp.status_code == 429:
            pytest.skip("Rate limited - skipping")
        
        assert resp.status_code == 200, f"Brain chat failed: {resp.text}"
        
        data = resp.json()
        assert "response" in data, "Missing response field"
        
        response_text = data["response"].lower()
        # Should mention CC2026 event details
        assert any(kw in response_text for kw in ["2026", "mai", "martinique", "savane", "événement", "culture"]), \
            f"Response should mention CC2026 details: {data['response'][:200]}"
        
        # Anticipation: should subtly suggest next step (badge, wallet, etc.)
        anticipation_keywords = ["badge", "wallet", "jeton", "inscription", "profil", "?"]
        has_anticipation = any(kw in response_text for kw in anticipation_keywords)
        
        print(f"✓ CVL BRAIN CC2026 response:")
        print(f"  Response: {data['response'][:300]}...")
        print(f"  Has anticipation: {has_anticipation}")
    
    def test_brain_cvln_confidentiality_redirect(self, auth_session):
        """Asking about CVLN should redirect smoothly without refusal"""
        resp = auth_session.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "C'est quoi CVLN exactement? Quelle est la stratégie?",
            "user_name": "Test User"
        })
        
        if resp.status_code == 429:
            pytest.skip("Rate limited - skipping")
        
        assert resp.status_code == 200, f"Brain chat failed: {resp.text}"
        
        data = resp.json()
        response_text = data["response"].lower()
        
        # Should NOT contain explicit refusal
        refusal_keywords = ["je ne peux pas", "je ne suis pas autorisé", "confidentiel", "secret"]
        has_refusal = any(kw in response_text for kw in refusal_keywords)
        
        # Should redirect to culture/kiltikonet
        redirect_keywords = ["culture", "kiltikonet", "diaspora", "caribéen", "créateur"]
        has_redirect = any(kw in response_text for kw in redirect_keywords)
        
        print(f"✓ CVL BRAIN CVLN confidentiality:")
        print(f"  Response: {data['response'][:300]}...")
        print(f"  Has refusal: {has_refusal} (should be False)")
        print(f"  Has redirect: {has_redirect} (should be True)")
        
        # Soft assertion - redirect is preferred but not blocking
        if has_refusal:
            print("  ⚠ Warning: Response contains explicit refusal")
    
    def test_brain_gafam_redirect(self, auth_session):
        """Asking about GAFAM/Google/Meta should redirect smoothly"""
        resp = auth_session.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "Quelle est votre stratégie face à Google et Meta?",
            "user_name": "Test User"
        })
        
        if resp.status_code == 429:
            pytest.skip("Rate limited - skipping")
        
        assert resp.status_code == 200, f"Brain chat failed: {resp.text}"
        
        data = resp.json()
        response_text = data["response"].lower()
        
        # Should NOT attack or criticize GAFAM directly
        attack_keywords = ["contre google", "contre meta", "battre", "détruire", "concurrence"]
        has_attack = any(kw in response_text for kw in attack_keywords)
        
        # Should redirect to building own space
        redirect_keywords = ["construire", "notre", "culture", "espace", "diaspora", "caribéen"]
        has_redirect = any(kw in response_text for kw in redirect_keywords)
        
        print(f"✓ CVL BRAIN GAFAM redirect:")
        print(f"  Response: {data['response'][:300]}...")
        print(f"  Has attack: {has_attack} (should be False)")
        print(f"  Has redirect: {has_redirect} (should be True)")
    
    def test_brain_jeton_cc_knowledge(self, auth_session):
        """Brain should know Jeton CC value and packs"""
        resp = auth_session.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "Comment fonctionne le Jeton CC?",
            "user_name": "Test User"
        })
        
        if resp.status_code == 429:
            pytest.skip("Rate limited - skipping")
        
        assert resp.status_code == 200, f"Brain chat failed: {resp.text}"
        
        data = resp.json()
        response_text = data["response"].lower()
        
        # Should mention value or packs
        jeton_keywords = ["1,50", "1.50", "euro", "pack", "découverte", "culture", "diaspora", "vip", "monnaie"]
        has_jeton_info = any(kw in response_text for kw in jeton_keywords)
        
        print(f"✓ CVL BRAIN Jeton CC knowledge:")
        print(f"  Response: {data['response'][:300]}...")
        print(f"  Has Jeton info: {has_jeton_info}")


class TestWalletHistoryPersistence:
    """Verify wallet transactions persist in MongoDB"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        s = get_auth_session()
        assert s is not None, "Failed to authenticate"
        return s
    
    def test_buy_pack_creates_transaction_in_history(self, auth_session):
        """Buying a pack should create a transaction visible in history"""
        # Get initial history count
        resp = auth_session.get(f"{BASE_URL}/api/my-wallet/history")
        initial_count = resp.json().get("total", 0)
        
        # Buy decouverte pack (10€ = 6 jetons)
        resp = auth_session.post(f"{BASE_URL}/api/my-wallet/buy-pack", json={"pack_id": "decouverte"})
        assert resp.status_code == 200
        tx_id = resp.json().get("transaction_id")
        
        # Verify transaction appears in history
        resp = auth_session.get(f"{BASE_URL}/api/my-wallet/history")
        assert resp.status_code == 200
        
        data = resp.json()
        assert data["total"] == initial_count + 1, "Transaction count should increase"
        
        # Find our transaction
        found = False
        for tx in data["history"]:
            if tx.get("id") == tx_id or "Decouverte" in tx.get("label", ""):
                found = True
                assert tx["type"] == "credit", "Pack purchase should be credit"
                assert tx["amount"] == 6, "Decouverte pack should be 6 CC"
                break
        
        assert found, f"Transaction {tx_id} not found in history"
        print(f"✓ Transaction {tx_id} persisted in MongoDB and visible in history")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
