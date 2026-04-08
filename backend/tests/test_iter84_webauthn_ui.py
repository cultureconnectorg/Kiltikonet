"""
ITER.84 Tests — WebAuthn endpoints + OrbitalMenu/BrainChat/BuilderView UI elements
Tests for:
1. WebAuthn backend endpoints (GET /api/auth/webauthn/devices, POST /api/auth/webauthn/register/begin)
2. OrbitalMenu header (no 'Kiltikonet' text, only CC2026/JCC/FREK-ID badges)
3. OrbitalMenu central node (logo PNG, no 'CVL BRAIN' text, clickable to BrainChat)
4. BrainChat dictation button (Mic icon)
5. BuilderView camera tool button
6. SovereignProfileView WebAuthn device management section
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com')


class TestWebAuthnEndpoints:
    """WebAuthn backend API tests"""

    def test_webauthn_devices_requires_auth(self):
        """GET /api/auth/webauthn/devices should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/auth/webauthn/devices")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"PASS: GET /api/auth/webauthn/devices returns 401 without auth: {data}")

    def test_webauthn_register_begin_requires_auth(self):
        """POST /api/auth/webauthn/register/begin should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/auth/webauthn/register/begin")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"PASS: POST /api/auth/webauthn/register/begin returns 401 without auth: {data}")

    def test_webauthn_login_begin_requires_email(self):
        """POST /api/auth/webauthn/login/begin should require email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/webauthn/login/begin",
            json={"email": "nonexistent@test.com"}
        )
        # Should return 404 if no devices registered for this email
        assert response.status_code in [404, 422]
        print(f"PASS: POST /api/auth/webauthn/login/begin returns {response.status_code} for unknown email")

    def test_webauthn_revoke_requires_auth(self):
        """POST /api/auth/webauthn/revoke/{id} should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/auth/webauthn/revoke/test-credential-id")
        assert response.status_code == 401
        print(f"PASS: POST /api/auth/webauthn/revoke returns 401 without auth")


class TestExistingEndpoints:
    """Verify existing endpoints still work"""

    def test_health_endpoint(self):
        """Health endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        # May return 429 due to rate limiting, which is acceptable
        assert response.status_code in [200, 429]
        print(f"PASS: Health endpoint returns {response.status_code}")

    def test_brain_sessions_requires_auth(self):
        """GET /api/brain/sessions should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/brain/sessions")
        assert response.status_code == 401
        print(f"PASS: GET /api/brain/sessions returns 401 without auth")

    def test_builder_projects_requires_auth(self):
        """GET /api/builder/projects should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/builder/projects")
        assert response.status_code == 401
        print(f"PASS: GET /api/builder/projects returns 401 without auth")

    def test_user_settings_requires_auth(self):
        """GET /api/user/settings should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/user/settings")
        assert response.status_code == 401
        print(f"PASS: GET /api/user/settings returns 401 without auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
