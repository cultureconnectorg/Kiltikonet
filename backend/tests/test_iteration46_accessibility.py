"""
Iteration 46 - Accessibility Audit Tests
Tests for WCAG compliance fixes, /accessibilite page, and responsive mobile corrections.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasicAPIs:
    """Basic API health checks"""
    
    def test_api_health(self):
        """GET /api/ - Health check"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print("✓ API health check passed")
    
    def test_jetons_packs(self):
        """GET /api/jetons/packs - Returns 4 packs"""
        response = requests.get(f"{BASE_URL}/api/jetons/packs")
        assert response.status_code == 200
        data = response.json()
        assert 'packs' in data
        assert len(data['packs']) == 4
        pack_ids = [p['id'] for p in data['packs']]
        assert 'decouverte' in pack_ids
        assert 'culture' in pack_ids
        assert 'diaspora' in pack_ids
        assert 'vip' in pack_ids
        print(f"✓ Jetons packs returned: {pack_ids}")


class TestCandidaturesAPI:
    """Candidatures CC2026 API tests"""
    
    def test_list_candidatures(self):
        """GET /api/candidatures/cc2026 - List candidatures"""
        response = requests.get(f"{BASE_URL}/api/candidatures/cc2026")
        assert response.status_code == 200
        data = response.json()
        assert 'candidatures' in data
        print(f"✓ Candidatures list returned: {len(data['candidatures'])} items")
    
    def test_submit_candidature(self):
        """POST /api/candidatures/cc2026 - Submit test candidature"""
        payload = {
            "nom_complet": "Test Iteration46 Accessibility",
            "email": "test46@example.com",
            "organisation": "Test Org",
            "territoire": "martinique",
            "profil": "artiste",
            "nom_projet": "Test Project",
            "description_projet": "Testing accessibility audit",
            "impact_culturel": "Testing impact",
            "lien": "https://example.com",
            "format_souhaite": "live",
            "engagement_cc": True
        }
        response = requests.post(f"{BASE_URL}/api/candidatures/cc2026", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        assert 'id' in data
        print(f"✓ Candidature submitted: {data['id']}")


class TestWorkspaceLogin:
    """Workspace login API tests"""
    
    def test_admin_login(self):
        """POST /api/workspace/login - Admin password"""
        response = requests.post(f"{BASE_URL}/api/workspace/login", json={
            "password": "CC2026admin"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        assert 'redirect' in data
        print(f"✓ Admin login redirect: {data['redirect']}")
    
    def test_twina_login(self):
        """POST /api/workspace/login - Twina password"""
        response = requests.post(f"{BASE_URL}/api/workspace/login", json={
            "password": "Twina2026"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        assert 'redirect' in data
        print(f"✓ Twina login redirect: {data['redirect']}")


class TestFrontendPages:
    """Frontend page load tests via API"""
    
    def test_home_page(self):
        """GET / - Home page loads"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        print("✓ Home page loads")
    
    def test_jetons_page(self):
        """GET /jetons - Jetons page loads"""
        response = requests.get(f"{BASE_URL}/jetons")
        assert response.status_code == 200
        print("✓ Jetons page loads")
    
    def test_appel_page(self):
        """GET /appel-2026 - Appel page loads"""
        response = requests.get(f"{BASE_URL}/appel-2026")
        assert response.status_code == 200
        print("✓ Appel page loads")
    
    def test_pricing_page(self):
        """GET /pricing - Pricing page loads"""
        response = requests.get(f"{BASE_URL}/pricing")
        assert response.status_code == 200
        print("✓ Pricing page loads")
    
    def test_concert_page(self):
        """GET /concert - Concert page loads"""
        response = requests.get(f"{BASE_URL}/concert")
        assert response.status_code == 200
        print("✓ Concert page loads")
    
    def test_accessibilite_page(self):
        """GET /accessibilite - Accessibility page loads"""
        response = requests.get(f"{BASE_URL}/accessibilite")
        assert response.status_code == 200
        print("✓ Accessibilite page loads")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
