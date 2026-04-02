"""
Code Quality Audit Tests - Iteration 59
Tests for code quality fixes including:
- Backend server starts without errors
- No duplicate function definitions
- Team notifications endpoints work
- Admin notifications endpoints work (renamed)
- Fintech dashboard returns data
- PWA manifest still accessible
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBackendHealth:
    """Test backend server health and basic endpoints"""
    
    def test_registrations_endpoint_returns_200(self):
        """Backend server starts without errors - /api/registrations returns 200"""
        response = requests.get(f"{BASE_URL}/api/registrations", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "registrations" in data
        print(f"✓ /api/registrations returns 200 with {data.get('total', 0)} registrations")
    
    def test_root_api_endpoint(self):
        """Root API endpoint works"""
        response = requests.get(f"{BASE_URL}/api/", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ /api/ returns: {data.get('message')}")


class TestTeamNotifications:
    """Test team notifications endpoints (duplicate functions removed)"""
    
    def test_get_team_notifications(self):
        """/api/team/notifications endpoint works (GET)"""
        response = requests.get(f"{BASE_URL}/api/team/notifications", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Should return a list or dict with notifications
        assert isinstance(data, (list, dict))
        print(f"✓ GET /api/team/notifications returns 200")
    
    def test_mark_all_team_notifications_read(self):
        """/api/team/notifications/mark-all-read endpoint works (POST)"""
        response = requests.post(
            f"{BASE_URL}/api/team/notifications/mark-all-read",
            json={},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "success" in data or "marked" in data
        print(f"✓ POST /api/team/notifications/mark-all-read returns 200")


class TestAdminNotifications:
    """Test admin notifications endpoints (renamed from mark_all_notifications_read)"""
    
    def test_mark_all_admin_notifications_read(self):
        """/api/admin/notifications/read-all endpoint works (POST, renamed)"""
        response = requests.post(
            f"{BASE_URL}/api/admin/notifications/read-all",
            json={},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Should return marked count or success
        assert "marked" in data or "success" in data
        print(f"✓ POST /api/admin/notifications/read-all returns 200 (renamed endpoint)")


class TestFintechDashboard:
    """Test fintech dashboard endpoint"""
    
    def test_fintech_dashboard_returns_data(self):
        """/api/fintech/dashboard endpoint returns data (GET)"""
        response = requests.get(f"{BASE_URL}/api/fintech/dashboard", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Verify expected fields exist
        assert "float" in data, "Missing 'float' field"
        assert "wallets" in data, "Missing 'wallets' field"
        assert "transactions" in data, "Missing 'transactions' field"
        assert "legal_entity" in data, "Missing 'legal_entity' field"
        print(f"✓ /api/fintech/dashboard returns data with {data.get('wallets', 0)} wallets")


class TestPWAManifest:
    """Test PWA manifest still accessible (from previous iteration)"""
    
    def test_manifest_json_accessible(self):
        """manifest.json still accessible and correct"""
        response = requests.get(f"{BASE_URL}/manifest.json", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("short_name") == "CultureConnect"
        assert data.get("name") == "Culture Connect Pro"
        assert data.get("theme_color") == "#214F4B"
        assert data.get("background_color") == "#0a0a0b"
        assert data.get("start_url") == "/espace-pro"
        assert data.get("display") == "standalone"
        print(f"✓ manifest.json accessible with correct values")
    
    def test_icon_512_accessible(self):
        """icon-512.png still accessible"""
        response = requests.get(f"{BASE_URL}/icon-512.png", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "image" in response.headers.get("Content-Type", "")
        print(f"✓ icon-512.png accessible")


class TestCatalogEndpoint:
    """Test catalog endpoint"""
    
    def test_catalog_returns_data(self):
        """/api/catalog endpoint returns data"""
        response = requests.get(f"{BASE_URL}/api/catalog", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "participants" in data
        assert "total" in data
        print(f"✓ /api/catalog returns {data.get('total', 0)} participants")


class TestPartnersEndpoint:
    """Test partners endpoint"""
    
    def test_partners_returns_data(self):
        """/api/partners endpoint returns data"""
        response = requests.get(f"{BASE_URL}/api/partners", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "partners" in data
        assert "total" in data
        print(f"✓ /api/partners returns {data.get('total', 0)} partners")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
