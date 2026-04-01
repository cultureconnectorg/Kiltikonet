"""
Iteration 54 - Monnaie Forte & Admin Finance Dashboard Tests
=============================================================
Tests for:
1. GET /api/shop/packages - New Monnaie Forte pricing (5 packs)
2. GET /api/fintech/dashboard - Float/Passif/Cash metrics
3. GET /api/shop/products - New pack products in jetons category
4. POST /api/shop/checkout/create - Works with new pack IDs
5. GET /api/wallet/{user_id} - Wallet with validity_extension
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Expected Monnaie Forte packages
EXPECTED_PACKAGES = {
    "kt-decouverte": {"tokens": 15, "price": 10.00, "bonus_pct": 50},
    "kt-culture": {"tokens": 40, "price": 25.00, "bonus_pct": 60},
    "kt-diaspora": {"tokens": 85, "price": 50.00, "bonus_pct": 70},
    "kt-vip": {"tokens": 180, "price": 100.00, "bonus_pct": 80},
    "kt-partenaire": {"tokens": 1000, "price": 500.00, "bonus_pct": 100},
}

LEGAL_ENTITY = "Factory Maker Studio EURL"


class TestShopPackages:
    """Tests for GET /api/shop/packages - Monnaie Forte pricing"""

    def test_packages_returns_5_packs(self):
        """Verify 5 new packs are returned"""
        response = requests.get(f"{BASE_URL}/api/shop/packages")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "packages" in data, "Response should contain 'packages' key"
        packages = data["packages"]
        assert len(packages) == 5, f"Expected 5 packages, got {len(packages)}"
        print(f"✓ GET /api/shop/packages returns 5 packs")

    def test_package_kt_decouverte(self):
        """Verify kt-decouverte: 10€ → 15KT"""
        response = requests.get(f"{BASE_URL}/api/shop/packages")
        assert response.status_code == 200
        
        packages = {p["id"]: p for p in response.json()["packages"]}
        pkg = packages.get("kt-decouverte")
        
        assert pkg is not None, "kt-decouverte package not found"
        assert pkg["tokens"] == 15, f"Expected 15 tokens, got {pkg['tokens']}"
        assert pkg["price"] == 10.00, f"Expected 10€, got {pkg['price']}"
        assert pkg["bonus_pct"] == 50, f"Expected 50% bonus, got {pkg.get('bonus_pct')}"
        print(f"✓ kt-decouverte: 10€ → 15KT (bonus +50%)")

    def test_package_kt_culture(self):
        """Verify kt-culture: 25€ → 40KT"""
        response = requests.get(f"{BASE_URL}/api/shop/packages")
        assert response.status_code == 200
        
        packages = {p["id"]: p for p in response.json()["packages"]}
        pkg = packages.get("kt-culture")
        
        assert pkg is not None, "kt-culture package not found"
        assert pkg["tokens"] == 40, f"Expected 40 tokens, got {pkg['tokens']}"
        assert pkg["price"] == 25.00, f"Expected 25€, got {pkg['price']}"
        assert pkg["bonus_pct"] == 60, f"Expected 60% bonus, got {pkg.get('bonus_pct')}"
        print(f"✓ kt-culture: 25€ → 40KT (bonus +60%)")

    def test_package_kt_diaspora(self):
        """Verify kt-diaspora: 50€ → 85KT"""
        response = requests.get(f"{BASE_URL}/api/shop/packages")
        assert response.status_code == 200
        
        packages = {p["id"]: p for p in response.json()["packages"]}
        pkg = packages.get("kt-diaspora")
        
        assert pkg is not None, "kt-diaspora package not found"
        assert pkg["tokens"] == 85, f"Expected 85 tokens, got {pkg['tokens']}"
        assert pkg["price"] == 50.00, f"Expected 50€, got {pkg['price']}"
        assert pkg["bonus_pct"] == 70, f"Expected 70% bonus, got {pkg.get('bonus_pct')}"
        print(f"✓ kt-diaspora: 50€ → 85KT (bonus +70%)")

    def test_package_kt_vip(self):
        """Verify kt-vip: 100€ → 180KT"""
        response = requests.get(f"{BASE_URL}/api/shop/packages")
        assert response.status_code == 200
        
        packages = {p["id"]: p for p in response.json()["packages"]}
        pkg = packages.get("kt-vip")
        
        assert pkg is not None, "kt-vip package not found"
        assert pkg["tokens"] == 180, f"Expected 180 tokens, got {pkg['tokens']}"
        assert pkg["price"] == 100.00, f"Expected 100€, got {pkg['price']}"
        assert pkg["bonus_pct"] == 80, f"Expected 80% bonus, got {pkg.get('bonus_pct')}"
        print(f"✓ kt-vip: 100€ → 180KT (bonus +80%)")

    def test_package_kt_partenaire(self):
        """Verify kt-partenaire: 500€ → 1000KT"""
        response = requests.get(f"{BASE_URL}/api/shop/packages")
        assert response.status_code == 200
        
        packages = {p["id"]: p for p in response.json()["packages"]}
        pkg = packages.get("kt-partenaire")
        
        assert pkg is not None, "kt-partenaire package not found"
        assert pkg["tokens"] == 1000, f"Expected 1000 tokens, got {pkg['tokens']}"
        assert pkg["price"] == 500.00, f"Expected 500€, got {pkg['price']}"
        assert pkg["bonus_pct"] == 100, f"Expected 100% bonus, got {pkg.get('bonus_pct')}"
        print(f"✓ kt-partenaire: 500€ → 1000KT (bonus +100%)")

    def test_packages_have_marketing_label(self):
        """Verify each package has marketing_label field"""
        response = requests.get(f"{BASE_URL}/api/shop/packages")
        assert response.status_code == 200
        
        packages = response.json()["packages"]
        for pkg in packages:
            assert "marketing_label" in pkg, f"Package {pkg['id']} missing marketing_label"
            assert pkg["marketing_label"], f"Package {pkg['id']} has empty marketing_label"
        print(f"✓ All packages have marketing_label")

    def test_packages_have_validity_extension(self):
        """Verify each package has validity_extension: true (Promesse 2027)"""
        response = requests.get(f"{BASE_URL}/api/shop/packages")
        assert response.status_code == 200
        
        packages = response.json()["packages"]
        for pkg in packages:
            assert "validity_extension" in pkg, f"Package {pkg['id']} missing validity_extension"
            assert pkg["validity_extension"] == True, f"Package {pkg['id']} validity_extension should be True"
        print(f"✓ All packages have validity_extension: true (Promesse 2027)")

    def test_packages_have_legal_entity(self):
        """Verify each package has legal_entity field"""
        response = requests.get(f"{BASE_URL}/api/shop/packages")
        assert response.status_code == 200
        
        packages = response.json()["packages"]
        for pkg in packages:
            assert "legal_entity" in pkg, f"Package {pkg['id']} missing legal_entity"
            assert pkg["legal_entity"] == LEGAL_ENTITY, f"Package {pkg['id']} has wrong legal_entity"
        print(f"✓ All packages have legal_entity: {LEGAL_ENTITY}")


class TestFintechDashboard:
    """Tests for GET /api/fintech/dashboard - Admin Finance Dashboard"""

    def test_dashboard_returns_200(self):
        """Verify dashboard endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/fintech/dashboard")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ GET /api/fintech/dashboard returns 200")

    def test_dashboard_has_float_object(self):
        """Verify dashboard has float object with required fields"""
        response = requests.get(f"{BASE_URL}/api/fintech/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        assert "float" in data, "Dashboard missing 'float' object"
        
        float_obj = data["float"]
        assert "cash_eur" in float_obj, "Float missing cash_eur"
        assert "passif_kt" in float_obj, "Float missing passif_kt"
        assert "kt_total_emitted" in float_obj, "Float missing kt_total_emitted"
        assert "kt_consumed" in float_obj, "Float missing kt_consumed"
        print(f"✓ Dashboard has float object with cash_eur, passif_kt, kt_total_emitted, kt_consumed")

    def test_dashboard_has_legal_entity(self):
        """Verify dashboard has legal_entity field"""
        response = requests.get(f"{BASE_URL}/api/fintech/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        assert "legal_entity" in data, "Dashboard missing legal_entity"
        assert data["legal_entity"]["business_name"] == LEGAL_ENTITY
        print(f"✓ Dashboard has legal_entity: {LEGAL_ENTITY}")

    def test_dashboard_has_adoption_by_zone(self):
        """Verify dashboard has adoption_by_zone field"""
        response = requests.get(f"{BASE_URL}/api/fintech/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        assert "adoption_by_zone" in data, "Dashboard missing adoption_by_zone"
        assert isinstance(data["adoption_by_zone"], dict), "adoption_by_zone should be a dict"
        print(f"✓ Dashboard has adoption_by_zone")

    def test_dashboard_has_revenue_by_pack(self):
        """Verify dashboard has revenue_by_pack field"""
        response = requests.get(f"{BASE_URL}/api/fintech/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        assert "revenue_by_pack" in data, "Dashboard missing revenue_by_pack"
        assert isinstance(data["revenue_by_pack"], dict), "revenue_by_pack should be a dict"
        print(f"✓ Dashboard has revenue_by_pack")

    def test_dashboard_has_validity_extension(self):
        """Verify dashboard has validity_extension: true"""
        response = requests.get(f"{BASE_URL}/api/fintech/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        assert "validity_extension" in data, "Dashboard missing validity_extension"
        assert data["validity_extension"] == True, "validity_extension should be True"
        print(f"✓ Dashboard has validity_extension: true")


class TestShopProducts:
    """Tests for GET /api/shop/products - New pack products"""

    def test_products_returns_200(self):
        """Verify products endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/shop/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ GET /api/shop/products returns 200")

    def test_products_jetons_category(self):
        """Verify jetons category has new pack products"""
        response = requests.get(f"{BASE_URL}/api/shop/products", params={"category": "jetons"})
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        # Check for new pack IDs
        product_ids = [p["id"] for p in products]
        expected_ids = ["kt-decouverte", "kt-culture", "kt-diaspora", "kt-vip", "kt-partenaire"]
        
        for expected_id in expected_ids:
            assert expected_id in product_ids, f"Product {expected_id} not found in jetons category"
        
        print(f"✓ Jetons category has all 5 new pack products")


class TestCheckoutCreate:
    """Tests for POST /api/shop/checkout/create - New pack IDs"""

    def test_checkout_kt_decouverte(self):
        """Verify checkout works with kt-decouverte"""
        response = requests.post(f"{BASE_URL}/api/shop/checkout/create", json={
            "package_id": "kt-decouverte",
            "user_id": "test_user_54",
            "channel": "web",
            "origin_url": "https://tarifs-update.preview.emergentagent.com"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "url" in data, "Response missing checkout URL"
        assert "session_id" in data, "Response missing session_id"
        assert "checkout.stripe.com" in data["url"], "URL should be Stripe checkout"
        print(f"✓ POST /api/shop/checkout/create works with kt-decouverte")

    def test_checkout_kt_vip(self):
        """Verify checkout works with kt-vip"""
        response = requests.post(f"{BASE_URL}/api/shop/checkout/create", json={
            "package_id": "kt-vip",
            "user_id": "test_user_54_vip",
            "channel": "web",
            "origin_url": "https://tarifs-update.preview.emergentagent.com"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "url" in data, "Response missing checkout URL"
        assert "checkout.stripe.com" in data["url"], "URL should be Stripe checkout"
        print(f"✓ POST /api/shop/checkout/create works with kt-vip")

    def test_checkout_kt_partenaire(self):
        """Verify checkout works with kt-partenaire"""
        response = requests.post(f"{BASE_URL}/api/shop/checkout/create", json={
            "package_id": "kt-partenaire",
            "user_id": "test_user_54_partenaire",
            "channel": "web",
            "origin_url": "https://tarifs-update.preview.emergentagent.com"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "url" in data, "Response missing checkout URL"
        assert "checkout.stripe.com" in data["url"], "URL should be Stripe checkout"
        print(f"✓ POST /api/shop/checkout/create works with kt-partenaire")


class TestWalletValidityExtension:
    """Tests for GET /api/wallet/{user_id} - Promesse 2027"""

    def test_wallet_returns_200(self):
        """Verify wallet endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/wallet/test_user_54_wallet")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ GET /api/wallet/test_user_54_wallet returns 200")

    def test_wallet_has_required_fields(self):
        """Verify wallet has all required fields"""
        response = requests.get(f"{BASE_URL}/api/wallet/test_user_54_wallet")
        assert response.status_code == 200
        
        data = response.json()
        required_fields = ["wallet_id", "user_id", "balance", "currency", "eur_value", "stats", "status"]
        for field in required_fields:
            assert field in data, f"Wallet missing field: {field}"
        
        assert data["currency"] == "KT", "Currency should be KT"
        print(f"✓ Wallet has all required fields")


class TestGhostBridgeVIP:
    """Tests for Ghost Bridge VIP - Code path verification"""

    def test_ghost_profiles_exist(self):
        """Verify ghost profiles exist for VIP/Diaspora messages"""
        # This tests that the ghost_profiles_v2 collection has profiles
        # The actual Ghost Bridge is triggered via Stripe webhook
        response = requests.get(f"{BASE_URL}/api/growth/engine/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "ghost_v2" in data, "Missing ghost_v2 stats"
        assert data["ghost_v2"]["total"] > 0, "No ghost profiles found"
        print(f"✓ Ghost profiles exist for VIP/Diaspora messages ({data['ghost_v2']['total']} profiles)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
