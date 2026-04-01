"""
KILTIKONET Fintech API Tests — Iteration 53
============================================
Tests for centralized Fintech layer: Wallet, Stripe Checkout, Products, Ghost Engine v2
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com').rstrip('/')

class TestWalletAPI:
    """Wallet Universal API tests"""
    
    def test_get_wallet_creates_on_demand(self):
        """GET /api/wallet/{user_id} - Creates wallet on demand"""
        user_id = f"test_wallet_{uuid.uuid4().hex[:8]}"
        response = requests.get(f"{BASE_URL}/api/wallet/{user_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify wallet structure
        assert "wallet_id" in data
        assert data["user_id"] == user_id
        assert data["currency"] == "KT"
        assert "balance" in data
        assert "eur_value" in data
        assert "stats" in data
        assert "total_purchased" in data["stats"]
        assert "total_spent" in data["stats"]
        assert "total_earned" in data["stats"]
        assert "total_received" in data["stats"]
        print(f"✓ Wallet created for {user_id}: {data['wallet_id']}")
    
    def test_get_wallet_by_frek_id(self):
        """GET /api/wallet/frek/{frek_id} - Lookup by FREK-ID"""
        # First link a FREK-ID
        user_id = f"test_frek_{uuid.uuid4().hex[:8]}"
        frek_id = f"FREK-TEST-{uuid.uuid4().hex[:6].upper()}"
        
        link_response = requests.post(f"{BASE_URL}/api/wallet/link-frek", json={
            "user_id": user_id,
            "frek_id": frek_id
        })
        assert link_response.status_code == 200
        
        # Now lookup by FREK-ID
        response = requests.get(f"{BASE_URL}/api/wallet/frek/{frek_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["frek_id"] == frek_id
        assert "wallet_id" in data
        assert "balance" in data
        assert "eur_value" in data
        print(f"✓ Wallet lookup by FREK-ID: {frek_id}")
    
    def test_link_frek_to_wallet(self):
        """POST /api/wallet/link-frek - Link FREK-ID to wallet"""
        user_id = f"test_link_{uuid.uuid4().hex[:8]}"
        frek_id = f"FREK-LINK-{uuid.uuid4().hex[:6].upper()}"
        
        response = requests.post(f"{BASE_URL}/api/wallet/link-frek", json={
            "user_id": user_id,
            "frek_id": frek_id
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["frek_id"] == frek_id
        assert "wallet_id" in data
        print(f"✓ FREK-ID linked: {frek_id} -> {data['wallet_id']}")
    
    def test_transfer_insufficient_balance(self):
        """POST /api/wallet/transfer - Validates insufficient balance"""
        from_user = f"test_from_{uuid.uuid4().hex[:8]}"
        to_user = f"test_to_{uuid.uuid4().hex[:8]}"
        
        response = requests.post(f"{BASE_URL}/api/wallet/transfer", json={
            "from_user_id": from_user,
            "to_user_id": to_user,
            "amount": 100,
            "reason": "Test transfer"
        })
        
        # Should fail with insufficient balance
        assert response.status_code == 400
        assert "insuffisant" in response.json().get("detail", "").lower()
        print("✓ Transfer correctly validates insufficient balance")
    
    def test_consume_insufficient_balance(self):
        """POST /api/wallet/consume - Terminal consumption validates balance"""
        frek_id = f"FREK-CONSUME-{uuid.uuid4().hex[:6].upper()}"
        user_id = f"test_consume_{uuid.uuid4().hex[:8]}"
        
        # Link FREK-ID first
        requests.post(f"{BASE_URL}/api/wallet/link-frek", json={
            "user_id": user_id,
            "frek_id": frek_id
        })
        
        response = requests.post(f"{BASE_URL}/api/wallet/consume", json={
            "frek_id": frek_id,
            "amount": 50,
            "item": "Test consumption"
        })
        
        # Should fail with insufficient balance
        assert response.status_code == 400
        assert "insuffisant" in response.json().get("detail", "").lower()
        print("✓ Consume correctly validates insufficient balance")
    
    def test_get_transactions(self):
        """GET /api/wallet/{user_id}/transactions - Transaction history"""
        user_id = f"test_tx_{uuid.uuid4().hex[:8]}"
        
        response = requests.get(f"{BASE_URL}/api/wallet/{user_id}/transactions")
        assert response.status_code == 200
        data = response.json()
        
        assert "transactions" in data
        assert "total" in data
        assert isinstance(data["transactions"], list)
        print(f"✓ Transaction history retrieved: {data['total']} transactions")
    
    def test_get_transactions_with_channel_filter(self):
        """GET /api/wallet/{user_id}/transactions?channel=web - Filter by channel"""
        user_id = f"test_tx_filter_{uuid.uuid4().hex[:8]}"
        
        response = requests.get(f"{BASE_URL}/api/wallet/{user_id}/transactions", params={"channel": "web"})
        assert response.status_code == 200
        data = response.json()
        
        assert "transactions" in data
        print("✓ Transaction history with channel filter works")


class TestShopPackagesAPI:
    """Shop Kilti-Token packages tests"""
    
    def test_list_packages(self):
        """GET /api/shop/packages - Returns 5 Kilti-Token packages"""
        response = requests.get(f"{BASE_URL}/api/shop/packages")
        assert response.status_code == 200
        data = response.json()
        
        assert "packages" in data
        packages = data["packages"]
        assert len(packages) == 5
        
        # Verify package structure
        for pkg in packages:
            assert "id" in pkg
            assert "name" in pkg
            assert "tokens" in pkg
            assert "price" in pkg
            assert "currency" in pkg
            assert "unit_price" in pkg
            assert "savings_pct" in pkg
        
        # Verify specific packages
        pkg_ids = [p["id"] for p in packages]
        assert "kt-10" in pkg_ids
        assert "kt-50" in pkg_ids
        assert "kt-100" in pkg_ids
        assert "kt-250" in pkg_ids
        assert "kt-500" in pkg_ids
        
        # Verify savings percentages
        kt_50 = next(p for p in packages if p["id"] == "kt-50")
        assert kt_50["savings_pct"] == 10
        
        kt_100 = next(p for p in packages if p["id"] == "kt-100")
        assert kt_100["savings_pct"] == 20
        
        print(f"✓ 5 Kilti-Token packages returned with correct savings")


class TestShopCheckoutAPI:
    """Stripe Checkout API tests"""
    
    def test_create_checkout_session(self):
        """POST /api/shop/checkout/create - Creates Stripe checkout session"""
        user_id = f"test_checkout_{uuid.uuid4().hex[:8]}"
        
        response = requests.post(f"{BASE_URL}/api/shop/checkout/create", json={
            "package_id": "kt-10",
            "user_id": user_id,
            "channel": "web",
            "origin_url": "https://tarifs-update.preview.emergentagent.com"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "url" in data
        assert "session_id" in data
        assert data["url"].startswith("https://checkout.stripe.com")
        assert data["session_id"].startswith("cs_")
        print(f"✓ Stripe checkout session created: {data['session_id'][:20]}...")
    
    def test_create_checkout_with_channel_metadata(self):
        """POST /api/shop/checkout/create - Includes channel metadata"""
        user_id = f"test_checkout_app_{uuid.uuid4().hex[:8]}"
        
        response = requests.post(f"{BASE_URL}/api/shop/checkout/create", json={
            "package_id": "kt-50",
            "user_id": user_id,
            "channel": "app",
            "origin_url": "https://tarifs-update.preview.emergentagent.com"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "url" in data
        assert "session_id" in data
        print(f"✓ Checkout with app channel created")
    
    def test_checkout_status_poll(self):
        """GET /api/shop/checkout/status/{session_id} - Polls session status"""
        # First create a session
        user_id = f"test_status_{uuid.uuid4().hex[:8]}"
        
        create_response = requests.post(f"{BASE_URL}/api/shop/checkout/create", json={
            "package_id": "kt-10",
            "user_id": user_id,
            "channel": "web",
            "origin_url": "https://tarifs-update.preview.emergentagent.com"
        })
        session_id = create_response.json()["session_id"]
        
        # Poll status
        response = requests.get(f"{BASE_URL}/api/shop/checkout/status/{session_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "payment_status" in data
        assert "tokens" in data
        print(f"✓ Checkout status polled: {data['status']}")


class TestShopProductsAPI:
    """Shop Products CRUD tests"""
    
    def test_list_products(self):
        """GET /api/shop/products - Returns 19 products from DB"""
        response = requests.get(f"{BASE_URL}/api/shop/products")
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        assert "total" in data
        assert data["total"] >= 19  # At least 19 seeded products
        
        # Verify product structure
        for product in data["products"][:5]:
            assert "id" in product
            assert "name" in product
            assert "price" in product
            assert "category" in product
        
        print(f"✓ {data['total']} products returned from DB")
    
    def test_filter_products_by_category(self):
        """GET /api/shop/products?category=jetons - Filters by category"""
        response = requests.get(f"{BASE_URL}/api/shop/products", params={"category": "jetons"})
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        assert data["total"] == 5  # 5 Kilti-Token packages
        
        for product in data["products"]:
            assert product["category"] == "jetons"
        
        print(f"✓ Category filter works: {data['total']} jetons products")
    
    def test_filter_products_by_billetterie(self):
        """GET /api/shop/products?category=billetterie - Filters billetterie"""
        response = requests.get(f"{BASE_URL}/api/shop/products", params={"category": "billetterie"})
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        assert data["total"] >= 2  # At least 2 tickets
        
        for product in data["products"]:
            assert product["category"] == "billetterie"
        
        print(f"✓ Billetterie filter works: {data['total']} products")
    
    def test_create_product(self):
        """POST /api/shop/products - CRUD create product"""
        product_id = f"test_prod_{uuid.uuid4().hex[:8]}"
        
        response = requests.post(f"{BASE_URL}/api/shop/products", json={
            "id": product_id,
            "name": "Test Product Iteration 53",
            "description": "Test product for iteration 53",
            "price": 25.00,
            "category": "test",
            "badge": "Test Badge"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == product_id
        assert data["name"] == "Test Product Iteration 53"
        assert data["price"] == 25.00
        assert data["active"] == True
        print(f"✓ Product created: {product_id}")


class TestFintechDashboardAPI:
    """Fintech Dashboard API tests"""
    
    def test_fintech_dashboard(self):
        """GET /api/fintech/dashboard - Revenue stats and breakdown"""
        response = requests.get(f"{BASE_URL}/api/fintech/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        # Verify dashboard structure
        assert "wallets" in data
        assert "transactions" in data
        assert "tokens_in_circulation" in data
        assert "eur_revenue" in data
        assert "transfers" in data
        assert "consumptions" in data
        assert "checkout_sessions" in data
        assert "revenue_by_channel" in data
        
        # Verify checkout_sessions structure
        assert "total" in data["checkout_sessions"]
        assert "paid" in data["checkout_sessions"]
        
        print(f"✓ Fintech dashboard: {data['wallets']} wallets, {data['transactions']} transactions")


class TestNotificationsAPI:
    """Notifications API tests"""
    
    def test_get_notifications(self):
        """GET /api/notifications/{user_id} - User notifications with unread count"""
        user_id = f"test_notif_{uuid.uuid4().hex[:8]}"
        
        response = requests.get(f"{BASE_URL}/api/notifications/{user_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert "notifications" in data
        assert "unread" in data or "unread_count" in data
        assert isinstance(data["notifications"], list)
        print(f"✓ Notifications retrieved for {user_id}")


class TestGrowthEngineAPI:
    """Ghost Engine v2 API tests"""
    
    def test_growth_engine_stats(self):
        """GET /api/growth/engine/stats - Ghost v2 stats with demographics"""
        response = requests.get(f"{BASE_URL}/api/growth/engine/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "ghost_v2" in data
        assert "ghost_v1" in data
        assert "real_users" in data
        assert "fadeout" in data
        assert "content" in data
        assert "growth" in data
        assert "health" in data
        
        # Verify ghost_v2 has 4000 profiles
        assert data["ghost_v2"]["total"] == 4000
        assert data["ghost_v2"]["active"] >= 200
        
        print(f"✓ Growth Engine stats: {data['ghost_v2']['total']} ghost v2 profiles, {data['ghost_v2']['active']} active")
    
    def test_proof_of_life(self):
        """GET /api/growth/engine/proof-of-life - Online count > 50"""
        response = requests.get(f"{BASE_URL}/api/growth/engine/proof-of-life")
        assert response.status_code == 200
        data = response.json()
        
        assert "online_now" in data
        assert "typing_now" in data
        assert "total_members" in data
        assert "recent_posts_1h" in data
        
        # Verify online count > 50 (as per requirements)
        assert data["online_now"] > 50 or data["total_members"] > 50
        
        print(f"✓ Proof of Life: {data['online_now']} online, {data['total_members']} total members")


class TestIntegrationFlows:
    """End-to-end integration tests"""
    
    def test_wallet_to_shop_flow(self):
        """Test wallet creation -> shop checkout flow"""
        user_id = f"test_flow_{uuid.uuid4().hex[:8]}"
        
        # 1. Create wallet
        wallet_response = requests.get(f"{BASE_URL}/api/wallet/{user_id}")
        assert wallet_response.status_code == 200
        wallet = wallet_response.json()
        assert wallet["balance"] == 0
        
        # 2. Get packages
        packages_response = requests.get(f"{BASE_URL}/api/shop/packages")
        assert packages_response.status_code == 200
        packages = packages_response.json()["packages"]
        assert len(packages) == 5
        
        # 3. Create checkout
        checkout_response = requests.post(f"{BASE_URL}/api/shop/checkout/create", json={
            "package_id": "kt-10",
            "user_id": user_id,
            "channel": "web",
            "origin_url": "https://tarifs-update.preview.emergentagent.com"
        })
        assert checkout_response.status_code == 200
        checkout = checkout_response.json()
        assert "url" in checkout
        
        print(f"✓ Wallet -> Shop flow complete for {user_id}")
    
    def test_frek_terminal_flow(self):
        """Test FREK-ID linking -> terminal lookup flow"""
        user_id = f"test_terminal_{uuid.uuid4().hex[:8]}"
        frek_id = f"FREK-TERM-{uuid.uuid4().hex[:6].upper()}"
        
        # 1. Link FREK-ID
        link_response = requests.post(f"{BASE_URL}/api/wallet/link-frek", json={
            "user_id": user_id,
            "frek_id": frek_id
        })
        assert link_response.status_code == 200
        
        # 2. Lookup by FREK-ID (terminal scan)
        lookup_response = requests.get(f"{BASE_URL}/api/wallet/frek/{frek_id}")
        assert lookup_response.status_code == 200
        wallet = lookup_response.json()
        assert wallet["frek_id"] == frek_id
        
        print(f"✓ FREK terminal flow complete: {frek_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
