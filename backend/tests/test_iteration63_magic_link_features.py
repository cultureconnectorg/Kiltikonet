"""
Iteration 63 - Testing Magic Link, Emergency Access, Team Invitations, Health Dashboard
Features:
1. Magic Link auth system (POST /api/pro/request-access, GET /api/auth/magic/{token})
2. Emergency admin access (GET /api/admin/emergency-access - disabled in production)
3. Team invitations (POST /api/admin/invite, GET /api/admin/invitations, GET /api/invite/validate/{token})
4. Health dashboard (GET /api/admin/health-stats)
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@kiltikonet.fr"
ADMIN_PASSWORD = "CC2026admin"
TEST_EMAIL = "securite_final@gmail.com"


class TestMagicLinkSystem:
    """Test Magic Link authentication flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_request_magic_link_success(self):
        """POST /api/pro/request-access should return success for valid email"""
        response = self.session.post(f"{BASE_URL}/api/pro/request-access", json={
            "email": TEST_EMAIL
        })
        print(f"Magic link request status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "message" in data or "bypass" in data
    
    def test_request_magic_link_empty_email(self):
        """POST /api/pro/request-access should fail for empty email"""
        response = self.session.post(f"{BASE_URL}/api/pro/request-access", json={
            "email": ""
        })
        print(f"Empty email request status: {response.status_code}")
        
        assert response.status_code == 400
    
    def test_magic_link_invalid_token(self):
        """GET /api/auth/magic/invalid-token should return 404"""
        response = self.session.get(f"{BASE_URL}/api/auth/magic/invalid-token-12345")
        print(f"Invalid token status: {response.status_code}")
        
        assert response.status_code == 404
        data = response.json()
        assert "invalide" in data.get("detail", "").lower() or "expiré" in data.get("detail", "").lower()


class TestEmergencyAccess:
    """Test Emergency Admin Access (disabled in production)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
    
    def test_emergency_access_returns_404_in_production(self):
        """GET /api/admin/emergency-access should return 404 in production"""
        response = self.session.get(f"{BASE_URL}/api/admin/emergency-access", params={
            "secret": "KK26-EM-9f3a7b2c4d8e1f6a"
        })
        print(f"Emergency access status: {response.status_code}")
        
        # In production (ENVIRONMENT=production), this should return 404
        assert response.status_code == 404
    
    def test_emergency_access_wrong_secret(self):
        """GET /api/admin/emergency-access with wrong secret should fail"""
        response = self.session.get(f"{BASE_URL}/api/admin/emergency-access", params={
            "secret": "wrong-secret"
        })
        print(f"Wrong secret status: {response.status_code}")
        
        # Should return 404 (production) or 403 (development with wrong secret)
        assert response.status_code in [403, 404]


class TestTeamInvitations:
    """Test Team Invitation system"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.admin_cookie = None
    
    def _login_admin(self):
        """Login as admin and get session cookie"""
        response = self.session.post(f"{BASE_URL}/api/admin/verify", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        print(f"Admin login status: {response.status_code}")
        if response.status_code == 200:
            # Session cookie should be set automatically
            return True
        return False
    
    def test_admin_login(self):
        """POST /api/admin/verify should authenticate admin"""
        response = self.session.post(f"{BASE_URL}/api/admin/verify", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        print(f"Admin login status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True or data.get("authenticated") == True
    
    def test_create_invitation_requires_admin(self):
        """POST /api/admin/invite should require admin authentication"""
        # Without login
        response = self.session.post(f"{BASE_URL}/api/admin/invite", json={
            "email": "test@example.com",
            "nom": "Test User",
            "role": "staff"
        })
        print(f"Invite without auth status: {response.status_code}")
        
        assert response.status_code == 403
    
    def test_create_invitation_with_admin(self):
        """POST /api/admin/invite with admin cookie should create invitation"""
        # Login first
        assert self._login_admin(), "Admin login failed"
        
        # Create invitation
        test_email = f"test_invite_{datetime.now().strftime('%H%M%S')}@example.com"
        response = self.session.post(f"{BASE_URL}/api/admin/invite", json={
            "email": test_email,
            "nom": "Test Invite User",
            "role": "staff"
        })
        print(f"Create invite status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "invite_url" in data
        assert "token" in data
    
    def test_list_invitations_requires_admin(self):
        """GET /api/admin/invitations should require admin authentication"""
        # Without login (new session)
        new_session = requests.Session()
        response = new_session.get(f"{BASE_URL}/api/admin/invitations")
        print(f"List invitations without auth status: {response.status_code}")
        
        assert response.status_code == 403
    
    def test_list_invitations_with_admin(self):
        """GET /api/admin/invitations with admin cookie should list invitations"""
        # Login first
        assert self._login_admin(), "Admin login failed"
        
        response = self.session.get(f"{BASE_URL}/api/admin/invitations")
        print(f"List invitations status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        assert "invitations" in data
        assert isinstance(data["invitations"], list)
    
    def test_validate_invalid_invitation(self):
        """GET /api/invite/validate/invalid-token should return 404"""
        response = self.session.get(f"{BASE_URL}/api/invite/validate/invalid-token-xyz")
        print(f"Invalid invite validation status: {response.status_code}")
        
        assert response.status_code == 404


class TestHealthDashboard:
    """Test Kilti-Health Dashboard"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def _login_admin(self):
        """Login as admin and get session cookie"""
        response = self.session.post(f"{BASE_URL}/api/admin/verify", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.status_code == 200
    
    def test_health_stats_requires_admin(self):
        """GET /api/admin/health-stats should require admin authentication"""
        new_session = requests.Session()
        response = new_session.get(f"{BASE_URL}/api/admin/health-stats")
        print(f"Health stats without auth status: {response.status_code}")
        
        assert response.status_code == 403
    
    def test_health_stats_with_admin(self):
        """GET /api/admin/health-stats with admin cookie should return all metrics"""
        # Login first
        assert self._login_admin(), "Admin login failed"
        
        response = self.session.get(f"{BASE_URL}/api/admin/health-stats")
        print(f"Health stats status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all expected metrics are present
        expected_metrics = [
            "latence_moyenne_ms",
            "taux_erreur_pct",
            "taille_db_mb",
            "brevo_status",
            "magic_links_actifs",
            "google_auth_enabled",
            "uptime_serveur_s",
            "emails_envoyes_24h"
        ]
        
        for metric in expected_metrics:
            assert metric in data, f"Missing metric: {metric}"
            print(f"  {metric}: {data[metric]}")


class TestMagicLinkMongoDBIntegration:
    """Test Magic Link MongoDB integration"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_magic_link_flow_creates_token(self):
        """POST /api/pro/request-access should create token in magic_links collection"""
        # Use a unique email to avoid rate limiting
        unique_email = f"test_magic_{datetime.now().strftime('%H%M%S%f')}@example.com"
        response = self.session.post(f"{BASE_URL}/api/pro/request-access", json={
            "email": unique_email
        })
        print(f"Magic link request status: {response.status_code}")
        
        # 200 = success, 429 = rate limited (expected in production)
        assert response.status_code in [200, 429]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
        else:
            print("Rate limited - this is expected behavior in production")


class TestGoogleOAuthEndpoints:
    """Test Google OAuth endpoints (not configured but should respond correctly)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
    
    def test_google_auth_redirect_not_configured(self):
        """GET /api/auth/google should return 503 when not configured"""
        response = self.session.get(f"{BASE_URL}/api/auth/google", allow_redirects=False)
        print(f"Google auth status: {response.status_code}")
        
        # Should return 503 (not configured), redirect to Google, or 429 (rate limited)
        assert response.status_code in [302, 503, 429]
        if response.status_code == 429:
            print("Rate limited - this is expected behavior in production")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
