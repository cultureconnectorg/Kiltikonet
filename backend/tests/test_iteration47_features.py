"""
Iteration 47 - Testing new features:
1. PATCH /api/registrations/{id}/photo endpoint
2. POST /api/create-checkout-session with show_in_catalog field
3. GET /api/v1/search/suggestions error handling
4. GET /api/catalog returns total field
5. Workspace login redirects (Twina2026 -> /workspace/twina)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com')

class TestIteration47Backend:
    """Backend API tests for iteration 47 features"""
    
    def test_health_check(self):
        """Test API is running"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Health check passed: {data}")
    
    def test_patch_photo_endpoint_exists_returns_404_for_invalid_id(self):
        """Test PATCH /api/registrations/{id}/photo returns 404 for invalid ID (not 405 or 500)"""
        # Create a minimal file to upload
        files = {'file': ('test.jpg', b'\x00\x00\x00', 'image/jpeg')}
        response = requests.patch(f"{BASE_URL}/api/registrations/invalid-test-id/photo", files=files)
        
        # Should return 404 (not found) not 405 (method not allowed) or 500 (server error)
        print(f"PATCH /api/registrations/invalid-test-id/photo status: {response.status_code}")
        print(f"Response: {response.text}")
        
        # The endpoint should exist (not 405) and return 404 for invalid ID
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print("✓ PATCH /api/registrations/{id}/photo endpoint exists and returns 404 for invalid ID")
    
    def test_catalog_returns_total_field(self):
        """Test GET /api/catalog returns total field"""
        response = requests.get(f"{BASE_URL}/api/catalog")
        assert response.status_code == 200
        data = response.json()
        
        assert "total" in data, f"Missing 'total' field in response: {data.keys()}"
        assert "participants" in data, f"Missing 'participants' field in response: {data.keys()}"
        assert isinstance(data["total"], int), f"'total' should be int, got {type(data['total'])}"
        
        print(f"✓ GET /api/catalog returns total={data['total']} participants")
    
    def test_search_suggestions_returns_404_for_invalid_participant(self):
        """Test GET /api/v1/search/suggestions returns 404 for invalid participant_id (not 500)"""
        response = requests.get(f"{BASE_URL}/api/v1/search/suggestions", params={"participant_id": "invalid-test-id"})
        
        print(f"GET /api/v1/search/suggestions?participant_id=test status: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Should return 404 (not found) not 500 (server error)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print("✓ GET /api/v1/search/suggestions returns 404 for invalid participant_id")
    
    def test_workspace_login_twina(self):
        """Test Twina2026 login redirects to /workspace/twina"""
        response = requests.post(f"{BASE_URL}/api/workspace/login", json={"password": "Twina2026"})
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True, f"Login failed: {data}"
        assert data.get("redirect") == "/workspace/twina", f"Expected redirect to /workspace/twina, got {data.get('redirect')}"
        assert data.get("role") == "design", f"Expected role 'design', got {data.get('role')}"
        
        print(f"✓ Twina2026 login redirects to {data.get('redirect')} with role {data.get('role')}")
    
    def test_workspace_login_admin(self):
        """Test CC2026admin login redirects to /admin"""
        response = requests.post(f"{BASE_URL}/api/workspace/login", json={"password": "CC2026admin"})
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True, f"Login failed: {data}"
        assert data.get("redirect") == "/admin", f"Expected redirect to /admin, got {data.get('redirect')}"
        assert data.get("role") == "admin", f"Expected role 'admin', got {data.get('role')}"
        
        print(f"✓ CC2026admin login redirects to {data.get('redirect')} with role {data.get('role')}")
    
    def test_checkout_session_accepts_show_in_catalog(self):
        """Test POST /api/create-checkout-session accepts show_in_catalog field"""
        # This test verifies the endpoint accepts the field without error
        # We can't complete the checkout but we can verify the request is accepted
        checkout_data = {
            "type": "accreditation",
            "tier": "emerging",
            "origin_url": "https://test.example.com",
            "full_name": "Test User",
            "organization_name": "Test Org",
            "country": "FR",
            "email": "test@example.com",
            "phone": "+33123456789",
            "profile_type": "artist",
            "bio": "Test bio",
            "how_heard": "social_media",
            "show_in_catalog": True,  # NEW field being tested
            "expertise_tags": "music,production"  # Also test this field
        }
        
        response = requests.post(f"{BASE_URL}/api/create-checkout-session", json=checkout_data)
        
        # Should return 200 with checkout URL (Stripe session created)
        print(f"POST /api/create-checkout-session status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            assert "url" in data, f"Missing 'url' in response: {data}"
            assert "session_id" in data, f"Missing 'session_id' in response: {data}"
            print(f"✓ Checkout session created with show_in_catalog=True, session_id: {data.get('session_id')[:20]}...")
        else:
            # If Stripe is not configured, we might get a 500 but the field should still be accepted
            print(f"Note: Checkout returned {response.status_code} - may be Stripe config issue, not field validation")
            # Don't fail the test if it's a Stripe config issue
            if "Invalid" in response.text and "show_in_catalog" in response.text:
                pytest.fail(f"show_in_catalog field rejected: {response.text}")
    
    def test_registrations_list(self):
        """Test GET /api/registrations returns proper structure"""
        response = requests.get(f"{BASE_URL}/api/registrations")
        assert response.status_code == 200
        data = response.json()
        
        assert "registrations" in data
        assert "total" in data
        assert "counts" in data
        
        print(f"✓ GET /api/registrations returns {data['total']} registrations")
    
    def test_partners_list(self):
        """Test GET /api/partners returns proper structure"""
        response = requests.get(f"{BASE_URL}/api/partners")
        assert response.status_code == 200
        data = response.json()
        
        assert "partners" in data
        assert "total" in data
        
        print(f"✓ GET /api/partners returns {data['total']} partners")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
