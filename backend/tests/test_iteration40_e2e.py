"""
Iteration 40 - E2E Testing for CC2026 Platform
Tests: Health, Registrations, CVL BRAIN, Analytics (Jetons + Site), Catalog
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_api_health(self):
        """GET /api/ returns 200 with message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Culture Connect 2026" in data["message"]
        print(f"✓ Health check passed: {data['message']}")


class TestRegistrations:
    """Registration endpoints tests"""
    
    def test_get_registrations(self):
        """GET /api/registrations returns list"""
        response = requests.get(f"{BASE_URL}/api/registrations")
        assert response.status_code == 200
        data = response.json()
        assert "registrations" in data
        assert "total" in data
        assert "counts" in data
        print(f"✓ Registrations: {data['total']} total")


class TestCatalog:
    """Catalog endpoints tests"""
    
    def test_get_catalog(self):
        """GET /api/catalog returns approved participants"""
        response = requests.get(f"{BASE_URL}/api/catalog")
        assert response.status_code == 200
        data = response.json()
        assert "participants" in data
        assert "total" in data
        print(f"✓ Catalog: {data['total']} participants")


class TestCVLBrain:
    """CVL BRAIN AI endpoints tests"""
    
    def test_brain_analyse(self):
        """POST /api/brain/analyse - Cultural profile analysis"""
        response = requests.post(
            f"{BASE_URL}/api/brain/analyse",
            json={"badge_id": "test-badge-001"}
        )
        assert response.status_code == 200
        data = response.json()
        # Check for expected CVL BRAIN response fields
        assert "cultural_impact_score" in data or "tags_culturels" in data
        print(f"✓ CVL BRAIN analyse: Score={data.get('cultural_impact_score', 'N/A')}")
    
    def test_brain_entreprise(self):
        """POST /api/brain/entreprise - Enterprise profile analysis"""
        response = requests.post(
            f"{BASE_URL}/api/brain/entreprise",
            json={"frek_id": "test-frek-001"}
        )
        assert response.status_code == 200
        data = response.json()
        # Response can have different structures based on data completeness
        assert "cultural_impact_score" in data or "contribution_recommandee" in data or "cvl_brain_status" in data
        print(f"✓ CVL BRAIN entreprise: Status={data.get('cvl_brain_status', data.get('cultural_impact_score', 'OK'))}")
    
    def test_brain_evenement(self):
        """POST /api/brain/evenement - Event analysis"""
        response = requests.post(
            f"{BASE_URL}/api/brain/evenement",
            json={"event_id": "test-event-001"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "potentiel_impact" in data or "event_id" in data
        print(f"✓ CVL BRAIN evenement: Response received")
    
    def test_brain_alerte(self):
        """POST /api/brain/alerte - System alert"""
        response = requests.post(
            f"{BASE_URL}/api/brain/alerte",
            json={"alert_type": "test"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "criticite" in data or "brain_status" in data
        print(f"✓ CVL BRAIN alerte: Status={data.get('brain_status', 'OK')}")
    
    def test_brain_agent_status(self):
        """GET /api/brain/agent-status - All agents status"""
        response = requests.get(f"{BASE_URL}/api/brain/agent-status")
        assert response.status_code == 200
        data = response.json()
        assert "statuses" in data
        assert "brain_active" in data
        print(f"✓ CVL BRAIN agents: {len(data.get('statuses', []))} agents, active={data.get('brain_active')}")


class TestAnalyticsJetons:
    """Jetons analytics endpoints tests"""
    
    def test_jetons_overview(self):
        """GET /api/analytics/jetons/overview - Complete jetons analytics"""
        response = requests.get(f"{BASE_URL}/api/analytics/jetons/overview")
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert "total_jetons_circulation" in data["summary"]
        assert "total_badges" in data["summary"]
        assert "frek_core" in data
        print(f"✓ Jetons overview: {data['summary']['total_badges']} badges, {data['summary']['total_jetons_circulation']} jetons")


class TestAnalyticsSite:
    """Site analytics (Trafic) endpoints tests"""
    
    def test_site_analytics(self):
        """GET /api/analytics/site - Site traffic analytics"""
        response = requests.get(f"{BASE_URL}/api/analytics/site?days=30")
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert "total_page_views" in data["summary"]
        assert "unique_visitors" in data["summary"]
        assert "daily" in data
        assert "top_pages" in data
        assert "devices" in data
        print(f"✓ Site analytics: {data['summary']['total_page_views']} views, {data['summary']['unique_visitors']} visitors")


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_verify_correct_password(self):
        """POST /api/admin/verify - Correct password"""
        response = requests.post(
            f"{BASE_URL}/api/admin/verify",
            json={"password": "CC2026admin"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Admin auth: Password verified")
    
    def test_admin_verify_wrong_password(self):
        """POST /api/admin/verify - Wrong password returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/admin/verify",
            json={"password": "wrongpassword"}
        )
        assert response.status_code == 401
        print(f"✓ Admin auth: Wrong password rejected (401)")


class TestPartners:
    """Partners endpoints tests"""
    
    def test_get_partners(self):
        """GET /api/partners - List partners"""
        response = requests.get(f"{BASE_URL}/api/partners")
        assert response.status_code == 200
        data = response.json()
        assert "partners" in data
        assert "total" in data
        print(f"✓ Partners: {data['total']} partners")


class TestAIAgents:
    """AI Agents endpoints tests"""
    
    def test_ai_agents_list(self):
        """GET /api/ai-agents/list - List all AI agents"""
        response = requests.get(f"{BASE_URL}/api/ai-agents/list")
        assert response.status_code == 200
        data = response.json()
        assert "agents" in data
        assert "stats" in data
        print(f"✓ AI Agents: {len(data.get('agents', []))} agents, {data['stats']['active']} active")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
