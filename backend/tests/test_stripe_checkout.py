"""
Test Stripe Checkout Session Creation - Iteration 89
Tests the /api/create-checkout-session endpoint for:
- Partnership checkout (bronze, silver, gold tiers)
- Accreditation checkout (emerging, professional, institutional tiers)
- Ticket checkout (general, vip tiers)

Verifies that the double /api/api/ bug has been fixed.
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestStripeCheckoutEndpoints:
    """Test Stripe checkout session creation for all payment types"""
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PARTNERSHIP CHECKOUT TESTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_partnership_bronze_checkout(self):
        """Test partnership checkout for Bronze tier (2500€)"""
        response = requests.post(
            f"{BASE_URL}/api/create-checkout-session",
            json={
                "type": "partnership",
                "tier": "bronze",
                "origin_url": BASE_URL,
                "company_name": "TEST_Bronze_Company",
                "contact_name": "Test Contact",
                "contact_email": "test_bronze@example.com",
                "contact_phone": "+33123456789"
            },
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "url" in data, "Response should contain 'url'"
        assert "session_id" in data, "Response should contain 'session_id'"
        
        # Verify Stripe URL format
        assert data["url"].startswith("https://checkout.stripe.com"), f"URL should be Stripe checkout: {data['url']}"
        assert data["session_id"].startswith("cs_"), f"Session ID should start with 'cs_': {data['session_id']}"
        
        print(f"✓ Partnership Bronze checkout URL: {data['url'][:80]}...")
    
    def test_partnership_silver_checkout(self):
        """Test partnership checkout for Silver tier (5000€)"""
        response = requests.post(
            f"{BASE_URL}/api/create-checkout-session",
            json={
                "type": "partnership",
                "tier": "silver",
                "origin_url": BASE_URL,
                "company_name": "TEST_Silver_Company",
                "contact_name": "Test Contact",
                "contact_email": "test_silver@example.com"
            },
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert data["url"].startswith("https://checkout.stripe.com")
        print(f"✓ Partnership Silver checkout URL: {data['url'][:80]}...")
    
    def test_partnership_gold_checkout(self):
        """Test partnership checkout for Gold tier (10000€)"""
        response = requests.post(
            f"{BASE_URL}/api/create-checkout-session",
            json={
                "type": "partnership",
                "tier": "gold",
                "origin_url": BASE_URL,
                "company_name": "TEST_Gold_Company",
                "contact_name": "Test Contact",
                "contact_email": "test_gold@example.com"
            },
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert data["url"].startswith("https://checkout.stripe.com")
        print(f"✓ Partnership Gold checkout URL: {data['url'][:80]}...")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ACCREDITATION CHECKOUT TESTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_accreditation_emerging_checkout(self):
        """Test accreditation checkout for Emerging tier (50€)"""
        response = requests.post(
            f"{BASE_URL}/api/create-checkout-session",
            json={
                "type": "accreditation",
                "tier": "emerging",
                "origin_url": BASE_URL,
                "full_name": "TEST_Emerging_User",
                "organization_name": "Test Org",
                "country": "France",
                "email": "test_emerging@example.com",
                "phone": "+33123456789",
                "profile_type": "artist",
                "bio": "Test bio for emerging artist"
            },
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "url" in data
        assert data["url"].startswith("https://checkout.stripe.com")
        print(f"✓ Accreditation Emerging checkout URL: {data['url'][:80]}...")
    
    def test_accreditation_professional_checkout(self):
        """Test accreditation checkout for Professional tier (150€)"""
        response = requests.post(
            f"{BASE_URL}/api/create-checkout-session",
            json={
                "type": "accreditation",
                "tier": "professional",
                "origin_url": BASE_URL,
                "full_name": "TEST_Professional_User",
                "organization_name": "Test Professional Org",
                "country": "Martinique",
                "email": "test_pro@example.com",
                "phone": "+596696123456",
                "profile_type": "label",
                "bio": "Test bio for professional"
            },
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert data["url"].startswith("https://checkout.stripe.com")
        print(f"✓ Accreditation Professional checkout URL: {data['url'][:80]}...")
    
    def test_accreditation_institutional_checkout(self):
        """Test accreditation checkout for Institutional tier (300€)"""
        response = requests.post(
            f"{BASE_URL}/api/create-checkout-session",
            json={
                "type": "accreditation",
                "tier": "institutional",
                "origin_url": BASE_URL,
                "full_name": "TEST_Institutional_User",
                "organization_name": "Test Institution",
                "country": "Guadeloupe",
                "email": "test_inst@example.com",
                "phone": "+590690123456",
                "profile_type": "institution",
                "bio": "Test bio for institution"
            },
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert data["url"].startswith("https://checkout.stripe.com")
        print(f"✓ Accreditation Institutional checkout URL: {data['url'][:80]}...")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # TICKET CHECKOUT TESTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_ticket_general_checkout(self):
        """Test ticket checkout for General tier (45€)"""
        response = requests.post(
            f"{BASE_URL}/api/create-checkout-session",
            json={
                "type": "ticket",
                "tier": "general",
                "origin_url": BASE_URL,
                "buyer_name": "TEST_General_Buyer",
                "buyer_email": "test_general_ticket@example.com"
            },
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "url" in data
        assert data["url"].startswith("https://checkout.stripe.com")
        print(f"✓ Ticket General checkout URL: {data['url'][:80]}...")
    
    def test_ticket_vip_checkout(self):
        """Test ticket checkout for VIP tier (150€)"""
        response = requests.post(
            f"{BASE_URL}/api/create-checkout-session",
            json={
                "type": "ticket",
                "tier": "vip",
                "origin_url": BASE_URL,
                "buyer_name": "TEST_VIP_Buyer",
                "buyer_email": "test_vip_ticket@example.com"
            },
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert data["url"].startswith("https://checkout.stripe.com")
        print(f"✓ Ticket VIP checkout URL: {data['url'][:80]}...")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ERROR HANDLING TESTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    def test_invalid_checkout_type(self):
        """Test that invalid checkout type returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/create-checkout-session",
            json={
                "type": "invalid_type",
                "tier": "bronze",
                "origin_url": BASE_URL
            },
            timeout=30
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid type, got {response.status_code}"
        print("✓ Invalid checkout type correctly returns 400")
    
    def test_invalid_partnership_tier(self):
        """Test that invalid partnership tier returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/create-checkout-session",
            json={
                "type": "partnership",
                "tier": "platinum",  # Invalid tier
                "origin_url": BASE_URL,
                "company_name": "Test",
                "contact_email": "test@example.com"
            },
            timeout=30
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid tier, got {response.status_code}"
        print("✓ Invalid partnership tier correctly returns 400")
    
    def test_invalid_ticket_tier(self):
        """Test that invalid ticket tier returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/create-checkout-session",
            json={
                "type": "ticket",
                "tier": "premium",  # Invalid tier
                "origin_url": BASE_URL,
                "buyer_name": "Test",
                "buyer_email": "test@example.com"
            },
            timeout=30
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid tier, got {response.status_code}"
        print("✓ Invalid ticket tier correctly returns 400")


class TestCheckoutStatusEndpoint:
    """Test the checkout status endpoint"""
    
    def test_checkout_status_invalid_session(self):
        """Test that invalid session ID returns appropriate error"""
        response = requests.get(
            f"{BASE_URL}/api/checkout/status/cs_invalid_session_id",
            timeout=30
        )
        
        # Should return 500 (Stripe error) or similar
        assert response.status_code in [400, 404, 500], f"Expected error status, got {response.status_code}"
        print(f"✓ Invalid session ID returns error status: {response.status_code}")


class TestURLFormatVerification:
    """Verify that no double /api/api/ exists in the codebase"""
    
    def test_no_double_api_in_partnership_page(self):
        """Verify PartnershipPage.jsx doesn't have double /api/api/"""
        import subprocess
        result = subprocess.run(
            ['grep', '-n', '/api/api/', '/app/frontend/src/components/PartnershipPage.jsx'],
            capture_output=True,
            text=True
        )
        
        assert result.returncode != 0, f"Found double /api/api/ in PartnershipPage.jsx: {result.stdout}"
        print("✓ No double /api/api/ in PartnershipPage.jsx")
    
    def test_no_double_api_in_registration_form(self):
        """Verify RegistrationForm.jsx doesn't have double /api/api/"""
        import subprocess
        result = subprocess.run(
            ['grep', '-n', '/api/api/', '/app/frontend/src/components/RegistrationForm.jsx'],
            capture_output=True,
            text=True
        )
        
        assert result.returncode != 0, f"Found double /api/api/ in RegistrationForm.jsx: {result.stdout}"
        print("✓ No double /api/api/ in RegistrationForm.jsx")
    
    def test_no_double_api_in_pricing_page(self):
        """Verify PricingPage.jsx doesn't have double /api/api/"""
        import subprocess
        result = subprocess.run(
            ['grep', '-n', '/api/api/', '/app/frontend/src/components/PricingPage.jsx'],
            capture_output=True,
            text=True
        )
        
        # PricingPage uses different pattern: API = BACKEND_URL (no /api), then ${API}/api/...
        # This is correct, so we check for the problematic pattern
        assert result.returncode != 0, f"Found double /api/api/ in PricingPage.jsx: {result.stdout}"
        print("✓ No double /api/api/ in PricingPage.jsx")
    
    def test_no_double_api_in_confirmation_screens(self):
        """Verify confirmation screens don't have double /api/api/"""
        import subprocess
        
        for file in ['PartnerConfirmation.jsx', 'ConfirmationScreen.jsx']:
            result = subprocess.run(
                ['grep', '-n', '/api/api/', f'/app/frontend/src/components/{file}'],
                capture_output=True,
                text=True
            )
            assert result.returncode != 0, f"Found double /api/api/ in {file}: {result.stdout}"
            print(f"✓ No double /api/api/ in {file}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
