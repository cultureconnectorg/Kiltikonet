"""
Test hCaptcha Integration for CC2026
Tests:
1. POST /api/contact with captcha_token
2. POST /api/contact without captcha_token (graceful degradation)
3. POST /api/badges/inscrire with captcha_token
4. POST /api/create-checkout-session with captcha_token
5. hCaptcha service verify_hcaptcha function
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    pytest.skip("REACT_APP_BACKEND_URL not set", allow_module_level=True)

# hCaptcha test credentials (public test key from hCaptcha docs)
HCAPTCHA_TEST_TOKEN = os.environ.get('HCAPTCHA_TEST_TOKEN', '10000000-aaaa-bbbb-cccc-000000000001')


class TestHCaptchaService:
    """Test hCaptcha verification service"""
    
    def test_hcaptcha_service_exists(self):
        """Verify hcaptcha.py service file exists and has verify_hcaptcha function"""
        import sys
        sys.path.insert(0, '/app/backend')
        from services.hcaptcha import verify_hcaptcha
        assert callable(verify_hcaptcha), "verify_hcaptcha should be a callable function"
        print("✓ hCaptcha service verify_hcaptcha function exists")


class TestContactEndpointWithCaptcha:
    """Test POST /api/contact with hCaptcha"""
    
    def test_contact_with_captcha_token_success(self):
        """POST /api/contact with valid captcha_token should return success"""
        payload = {
            "name": "TEST_HCaptcha User",
            "email": "test_hcaptcha@example.com",
            "message": "Test message with hCaptcha token",
            "captcha_token": HCAPTCHA_TEST_TOKEN
        }
        response = requests.post(f"{BASE_URL}/api/contact", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        print(f"✓ POST /api/contact with captcha_token returned success: {data}")
    
    def test_contact_without_captcha_token_graceful(self):
        """POST /api/contact without captcha_token should still work (graceful degradation with test key)"""
        payload = {
            "name": "TEST_NoCaptcha User",
            "email": "test_nocaptcha@example.com",
            "message": "Test message without hCaptcha token"
        }
        response = requests.post(f"{BASE_URL}/api/contact", json=payload)
        
        # With test secret key, missing token should still work (graceful degradation)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        print(f"✓ POST /api/contact without captcha_token returned success (graceful degradation): {data}")


class TestBadgeInscriptionWithCaptcha:
    """Test POST /api/badges/inscrire with hCaptcha"""
    
    def test_badge_inscription_with_captcha_success(self):
        """POST /api/badges/inscrire with captcha_token should create badge"""
        import uuid
        unique_email = f"test_badge_{uuid.uuid4().hex[:8]}@example.com"
        
        payload = {
            "prenom": "TEST_Badge",
            "nom": "HCaptcha",
            "email": unique_email,
            "type_badge": "VIS",
            "organisation": "Test Org",
            "captcha_token": HCAPTCHA_TEST_TOKEN
        }
        response = requests.post(f"{BASE_URL}/api/badges/inscrire", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "badge_id" in data, f"Expected badge_id in response, got {data}"
        assert data.get("type_badge") == "VIS", f"Expected type_badge=VIS, got {data}"
        print(f"✓ POST /api/badges/inscrire with captcha_token created badge: {data.get('badge_id')}")
    
    def test_badge_inscription_without_captcha_graceful(self):
        """POST /api/badges/inscrire without captcha_token should still work"""
        import uuid
        unique_email = f"test_badge_nocap_{uuid.uuid4().hex[:8]}@example.com"
        
        payload = {
            "prenom": "TEST_NoCap",
            "nom": "Badge",
            "email": unique_email,
            "type_badge": "VIS",
            "organisation": "Test Org No Captcha"
        }
        response = requests.post(f"{BASE_URL}/api/badges/inscrire", json=payload)
        
        # With test secret, should work without captcha
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "badge_id" in data, f"Expected badge_id in response, got {data}"
        print(f"✓ POST /api/badges/inscrire without captcha_token created badge: {data.get('badge_id')}")


class TestCheckoutSessionWithCaptcha:
    """Test POST /api/create-checkout-session with hCaptcha"""
    
    def test_checkout_session_with_captcha_accreditation(self):
        """POST /api/create-checkout-session for accreditation with captcha_token"""
        import uuid
        unique_email = f"test_checkout_{uuid.uuid4().hex[:8]}@example.com"
        
        payload = {
            "type": "accreditation",
            "tier": "emerging",
            "origin_url": "https://tarifs-update.preview.emergentagent.com",
            "full_name": "TEST_Checkout User",
            "organization_name": "Test Org",
            "country": "France",
            "email": unique_email,
            "phone": "+33612345678",
            "profile_type": "artist",
            "bio": "Test bio for checkout",
            "language_preference": "fr",
            "how_heard": "social_media",
            "captcha_token": HCAPTCHA_TEST_TOKEN
        }
        response = requests.post(f"{BASE_URL}/api/create-checkout-session", json=payload)
        
        # Should return Stripe checkout URL
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "url" in data, f"Expected url in response, got {data}"
        assert "session_id" in data, f"Expected session_id in response, got {data}"
        assert "stripe.com" in data.get("url", ""), f"Expected Stripe URL, got {data.get('url')}"
        print(f"✓ POST /api/create-checkout-session with captcha_token returned Stripe URL")
    
    def test_checkout_session_with_captcha_partnership(self):
        """POST /api/create-checkout-session for partnership with captcha_token"""
        import uuid
        unique_email = f"test_partner_{uuid.uuid4().hex[:8]}@example.com"
        
        payload = {
            "type": "partnership",
            "tier": "bronze",
            "origin_url": "https://tarifs-update.preview.emergentagent.com",
            "company_name": "TEST_Partner Company",
            "contact_name": "Test Contact",
            "contact_email": unique_email,
            "contact_phone": "+33612345678",
            "website": "https://test.com",
            "captcha_token": HCAPTCHA_TEST_TOKEN
        }
        response = requests.post(f"{BASE_URL}/api/create-checkout-session", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "url" in data, f"Expected url in response, got {data}"
        assert "session_id" in data, f"Expected session_id in response, got {data}"
        print(f"✓ POST /api/create-checkout-session for partnership with captcha_token returned Stripe URL")


class TestAPIHealthAndBasics:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ API root endpoint is accessible")
    
    def test_badge_types_endpoint(self):
        """Test badge types endpoint"""
        response = requests.get(f"{BASE_URL}/api/badges/types")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "types" in data, f"Expected types in response, got {data}"
        assert "VIS" in data.get("types", {}), f"Expected VIS badge type, got {data}"
        print(f"✓ Badge types endpoint returned {len(data.get('types', {}))} types")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
