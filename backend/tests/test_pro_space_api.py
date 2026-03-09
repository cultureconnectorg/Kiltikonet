"""
Test Pro Space APIs for Culture Connect 2026
Tests /api/pro/* endpoints for the LinkedIn-style professional space
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user created by main agent
TEST_EMAIL = "testpro@test.com"
NON_EXISTENT_EMAIL = "nonexistent-random-xyz@test.com"


class TestProSpaceRequestAccess:
    """Test /api/pro/request-access endpoint"""
    
    def test_request_access_approved_email_success(self):
        """Test that approved user can request access code"""
        response = requests.post(
            f"{BASE_URL}/api/pro/request-access",
            json={"email": TEST_EMAIL},
            headers={"Content-Type": "application/json"}
        )
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert data.get("success") == True
        assert "message" in data
        assert "envoyé" in data["message"].lower() or "code" in data["message"].lower()
        print(f"✓ Request access for approved user returned: {data}")
    
    def test_request_access_nonexistent_email_404(self):
        """Test that non-existent email returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/pro/request-access",
            json={"email": NON_EXISTENT_EMAIL},
            headers={"Content-Type": "application/json"}
        )
        
        # Status code assertion - should be 404
        assert response.status_code == 404, f"Expected 404 for non-existent email, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "detail" in data
        print(f"✓ Non-existent email correctly returned 404: {data}")
    
    def test_request_access_empty_email_fails(self):
        """Test that empty email is rejected"""
        response = requests.post(
            f"{BASE_URL}/api/pro/request-access",
            json={"email": ""},
            headers={"Content-Type": "application/json"}
        )
        
        # Should fail with 404 or 422
        assert response.status_code in [404, 422], f"Expected 404 or 422 for empty email, got {response.status_code}"
        print(f"✓ Empty email correctly rejected with status {response.status_code}")


class TestProSpaceVerifyCode:
    """Test /api/pro/verify-code endpoint"""
    
    def test_verify_code_invalid_code(self):
        """Test that invalid code is rejected"""
        # First request a code
        requests.post(
            f"{BASE_URL}/api/pro/request-access",
            json={"email": TEST_EMAIL},
            headers={"Content-Type": "application/json"}
        )
        
        # Try invalid code
        response = requests.post(
            f"{BASE_URL}/api/pro/verify-code",
            json={"email": TEST_EMAIL, "code": "000000"},
            headers={"Content-Type": "application/json"}
        )
        
        # Status code assertion - should be 400 for invalid code
        assert response.status_code == 400, f"Expected 400 for invalid code, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "detail" in data
        assert "invalid" in data["detail"].lower() or "invalide" in data["detail"].lower()
        print(f"✓ Invalid code correctly rejected: {data}")
    
    def test_verify_code_no_pending_code(self):
        """Test that verify without pending code fails"""
        # Use a fresh email that hasn't requested a code
        response = requests.post(
            f"{BASE_URL}/api/pro/verify-code",
            json={"email": "fresh-no-code@test.com", "code": "123456"},
            headers={"Content-Type": "application/json"}
        )
        
        # Status code assertion - should be 400
        assert response.status_code == 400, f"Expected 400 for no pending code, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "detail" in data
        print(f"✓ No pending code correctly handled: {data}")


class TestProSpaceProfile:
    """Test /api/pro/profile/* endpoints"""
    
    def test_get_profile_by_id(self):
        """Test getting a profile by ID"""
        # First get the test user's ID
        response = requests.get(f"{BASE_URL}/api/registrations")
        assert response.status_code == 200
        
        registrations = response.json().get("registrations", [])
        test_user = next((r for r in registrations if r.get("email") == TEST_EMAIL), None)
        
        if not test_user:
            pytest.skip("Test user not found in registrations")
        
        profile_id = test_user.get("id")
        
        # Get profile
        response = requests.get(f"{BASE_URL}/api/pro/profile/{profile_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert data.get("id") == profile_id
        assert data.get("email") == TEST_EMAIL
        print(f"✓ Profile retrieved successfully: {data.get('full_name')}")
    
    def test_get_profile_not_found(self):
        """Test getting a non-existent profile"""
        response = requests.get(f"{BASE_URL}/api/pro/profile/nonexistent-id-12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent profile correctly returned 404")


class TestProSpaceConnections:
    """Test /api/pro/connections/* endpoints"""
    
    def test_get_connections_empty(self):
        """Test getting connections for user (may be empty)"""
        # Get test user ID
        response = requests.get(f"{BASE_URL}/api/registrations")
        registrations = response.json().get("registrations", [])
        test_user = next((r for r in registrations if r.get("email") == TEST_EMAIL), None)
        
        if not test_user:
            pytest.skip("Test user not found")
        
        profile_id = test_user.get("id")
        
        # Get connections
        response = requests.get(f"{BASE_URL}/api/pro/connections/{profile_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "connections" in data
        assert isinstance(data["connections"], list)
        print(f"✓ Connections endpoint working, found {len(data['connections'])} connections")


class TestProSpaceMessages:
    """Test /api/pro/messages/* endpoints"""
    
    def test_get_messages_empty(self):
        """Test getting messages for user (may be empty)"""
        # Get test user ID
        response = requests.get(f"{BASE_URL}/api/registrations")
        registrations = response.json().get("registrations", [])
        test_user = next((r for r in registrations if r.get("email") == TEST_EMAIL), None)
        
        if not test_user:
            pytest.skip("Test user not found")
        
        profile_id = test_user.get("id")
        
        # Get messages
        response = requests.get(f"{BASE_URL}/api/pro/messages/{profile_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "messages" in data
        assert isinstance(data["messages"], list)
        print(f"✓ Messages endpoint working, found {len(data['messages'])} messages")


class TestProSpaceOpportunitiesAndEvents:
    """Test /api/pro/opportunities and /api/pro/events endpoints"""
    
    def test_get_opportunities(self):
        """Test getting opportunities list"""
        response = requests.get(f"{BASE_URL}/api/pro/opportunities")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "opportunities" in data
        assert isinstance(data["opportunities"], list)
        print(f"✓ Opportunities endpoint working, found {len(data['opportunities'])} opportunities")
    
    def test_get_events(self):
        """Test getting events list"""
        response = requests.get(f"{BASE_URL}/api/pro/events")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "events" in data
        assert isinstance(data["events"], list)
        print(f"✓ Events endpoint working, found {len(data['events'])} events")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
