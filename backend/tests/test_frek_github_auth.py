"""
Test FREK-ID and GitHub OAuth authentication endpoints
Iteration 73 - Testing the wired auth buttons on /espace-pro/connexion
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com').rstrip('/')

# Test credentials from review request
ADMIN_FREK_ID = "FREK-ADM-0001"
ADMIN_EMAIL = "cultureconnectorg@gmail.com"
ADMIN_BYPASS_CODE = "000000"
REGULAR_FREK_ID = "FREK-JMCK-8SOL"


class TestFrekAuthEndpoints:
    """Test FREK-ID authentication flow"""
    
    def test_frek_initiate_with_admin_id(self):
        """POST /api/auth/frek with admin FREK-ID should return success with bypass=true"""
        response = requests.post(
            f"{BASE_URL}/api/auth/frek",
            json={"frek_id": ADMIN_FREK_ID},
            headers={"Content-Type": "application/json"}
        )
        print(f"FREK initiate admin response: {response.status_code} - {response.text[:500]}")
        
        # Should return 200 with success
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert "email_hint" in data, f"Expected email_hint in response, got {data}"
        # Admin should have bypass=True
        assert data.get("bypass") == True, f"Expected bypass=True for admin FREK-ID, got {data}"
    
    def test_frek_initiate_invalid_format(self):
        """POST /api/auth/frek with invalid format should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/frek",
            json={"frek_id": "INVALID-ID"},
            headers={"Content-Type": "application/json"}
        )
        print(f"FREK invalid format response: {response.status_code} - {response.text[:300]}")
        
        assert response.status_code == 400, f"Expected 400 for invalid format, got {response.status_code}"
    
    def test_frek_initiate_unknown_id(self):
        """POST /api/auth/frek with unknown FREK-ID should return 404"""
        response = requests.post(
            f"{BASE_URL}/api/auth/frek",
            json={"frek_id": "FREK-INVALID-TEST"},
            headers={"Content-Type": "application/json"}
        )
        print(f"FREK unknown ID response: {response.status_code} - {response.text[:300]}")
        
        assert response.status_code == 404, f"Expected 404 for unknown FREK-ID, got {response.status_code}"
        data = response.json()
        assert "introuvable" in data.get("detail", "").lower() or "not found" in data.get("detail", "").lower(), f"Expected 'introuvable' in error, got {data}"
    
    def test_frek_verify_admin_bypass(self):
        """POST /api/auth/frek/verify with admin FREK-ID + 000000 should succeed"""
        # First initiate to set up the code
        init_response = requests.post(
            f"{BASE_URL}/api/auth/frek",
            json={"frek_id": ADMIN_FREK_ID},
            headers={"Content-Type": "application/json"}
        )
        print(f"FREK initiate for verify: {init_response.status_code}")
        
        if init_response.status_code != 200:
            pytest.skip(f"Could not initiate FREK auth: {init_response.text}")
        
        # Now verify with bypass code
        verify_response = requests.post(
            f"{BASE_URL}/api/auth/frek/verify",
            json={"frek_id": ADMIN_FREK_ID, "code": ADMIN_BYPASS_CODE},
            headers={"Content-Type": "application/json"}
        )
        print(f"FREK verify admin response: {verify_response.status_code} - {verify_response.text[:500]}")
        
        assert verify_response.status_code == 200, f"Expected 200, got {verify_response.status_code}: {verify_response.text}"
        
        data = verify_response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert "profile" in data, f"Expected profile in response, got {data}"
        
        profile = data["profile"]
        assert "id" in profile, f"Expected id in profile, got {profile}"
        assert "email" in profile, f"Expected email in profile, got {profile}"
        assert "frek_id" in profile, f"Expected frek_id in profile, got {profile}"
    
    def test_frek_verify_wrong_code(self):
        """POST /api/auth/frek/verify with wrong code should return 401"""
        # First initiate
        init_response = requests.post(
            f"{BASE_URL}/api/auth/frek",
            json={"frek_id": ADMIN_FREK_ID},
            headers={"Content-Type": "application/json"}
        )
        
        if init_response.status_code != 200:
            pytest.skip(f"Could not initiate FREK auth: {init_response.text}")
        
        # Verify with wrong code
        verify_response = requests.post(
            f"{BASE_URL}/api/auth/frek/verify",
            json={"frek_id": ADMIN_FREK_ID, "code": "999999"},
            headers={"Content-Type": "application/json"}
        )
        print(f"FREK verify wrong code response: {verify_response.status_code} - {verify_response.text[:300]}")
        
        assert verify_response.status_code == 401, f"Expected 401 for wrong code, got {verify_response.status_code}"
    
    def test_frek_verify_no_initiate(self):
        """POST /api/auth/frek/verify without prior initiate should return 400"""
        # Use a random FREK-ID that wasn't initiated
        verify_response = requests.post(
            f"{BASE_URL}/api/auth/frek/verify",
            json={"frek_id": "FREK-RAND-9999", "code": "123456"},
            headers={"Content-Type": "application/json"}
        )
        print(f"FREK verify no initiate response: {verify_response.status_code} - {verify_response.text[:300]}")
        
        assert verify_response.status_code == 400, f"Expected 400 for no prior initiate, got {verify_response.status_code}"


class TestGitHubAuthEndpoints:
    """Test GitHub OAuth endpoints"""
    
    def test_github_redirect_returns_503(self):
        """GET /api/auth/github should return 503 when GITHUB_CLIENT_ID is not set"""
        response = requests.get(
            f"{BASE_URL}/api/auth/github",
            allow_redirects=False  # Don't follow redirects
        )
        print(f"GitHub redirect response: {response.status_code} - {response.text[:300]}")
        
        # Should return 503 since GITHUB_CLIENT_ID is not configured
        assert response.status_code == 503, f"Expected 503 (not configured), got {response.status_code}"
        
        data = response.json()
        assert "non configure" in data.get("detail", "").lower() or "not configured" in data.get("detail", "").lower(), f"Expected 'non configure' in error, got {data}"


class TestAuthMeEndpoint:
    """Test session verification endpoint"""
    
    def test_auth_me_unauthenticated(self):
        """GET /api/auth/me without session should return 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        print(f"Auth me unauthenticated response: {response.status_code} - {response.text[:300]}")
        
        assert response.status_code == 401, f"Expected 401 for unauthenticated, got {response.status_code}"
        
        data = response.json()
        assert data.get("authenticated") == False, f"Expected authenticated=False, got {data}"


class TestHealthEndpoint:
    """Basic health check"""
    
    def test_api_root(self):
        """GET /api/ should return 200"""
        response = requests.get(f"{BASE_URL}/api/")
        print(f"API root response: {response.status_code} - {response.text[:200]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
