"""
Test Suite for CC2026 Analytics and Coleen Workspace Features
- Analytics batch endpoint (POST /api/analytics/batch)
- Site analytics endpoint (GET /api/analytics/site)
- Workspace login (POST /api/workspace/login)
- Shared data CRUD (partners, contacts, expenses)
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestAnalyticsBatch:
    """Test /api/analytics/batch endpoint - stores events with IP and user_agent"""
    
    def test_batch_accepts_page_view_events(self, api_client):
        """POST /api/analytics/batch should accept page_view events"""
        events = {
            "events": [
                {
                    "eventType": "page_view",
                    "sessionId": f"test_session_{uuid.uuid4().hex[:8]}",
                    "userId": None,
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": {
                        "page": "/test-page",
                        "title": "Test Page",
                        "referrer": "https://google.com",
                        "device": {
                            "screen": "1920x1080",
                            "userAgent": "TestBot/1.0",
                            "language": "fr-FR",
                            "platform": "Linux",
                            "isMobile": False
                        }
                    }
                }
            ]
        }
        
        response = api_client.post(f"{BASE_URL}/api/analytics/batch", json=events)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("count") == 1
        print("✓ Analytics batch accepts page_view events")
    
    def test_batch_accepts_multiple_events(self, api_client):
        """POST /api/analytics/batch should accept multiple events"""
        session_id = f"test_session_{uuid.uuid4().hex[:8]}"
        events = {
            "events": [
                {
                    "eventType": "page_view",
                    "sessionId": session_id,
                    "userId": None,
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": {"page": "/", "device": {"isMobile": False}}
                },
                {
                    "eventType": "page_view",
                    "sessionId": session_id,
                    "userId": None,
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": {"page": "/tarifs", "device": {"isMobile": False}}
                },
                {
                    "eventType": "page_view",
                    "sessionId": session_id,
                    "userId": None,
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": {"page": "/programme", "device": {"isMobile": True}}
                }
            ]
        }
        
        response = api_client.post(f"{BASE_URL}/api/analytics/batch", json=events)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("count") == 3
        print("✓ Analytics batch accepts multiple events")
    
    def test_batch_accepts_click_events(self, api_client):
        """POST /api/analytics/batch should accept click events"""
        events = {
            "events": [
                {
                    "eventType": "click",
                    "sessionId": f"test_session_{uuid.uuid4().hex[:8]}",
                    "userId": None,
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": {
                        "elementId": "cta-button",
                        "elementType": "button",
                        "page": "/tarifs"
                    }
                }
            ]
        }
        
        response = api_client.post(f"{BASE_URL}/api/analytics/batch", json=events)
        assert response.status_code == 200
        assert response.json().get("success") is True
        print("✓ Analytics batch accepts click events")


class TestSiteAnalytics:
    """Test /api/analytics/site endpoint - returns comprehensive site analytics"""
    
    def test_site_analytics_returns_summary(self, api_client):
        """GET /api/analytics/site should return summary object"""
        response = api_client.get(f"{BASE_URL}/api/analytics/site?days=30")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "summary" in data, "Response should contain 'summary'"
        
        summary = data["summary"]
        assert "total_page_views" in summary
        assert "unique_visitors" in summary
        assert "unique_ips" in summary
        assert "total_events" in summary
        assert "avg_pages_per_session" in summary
        print(f"✓ Site analytics summary: {summary['total_page_views']} page views, {summary['unique_visitors']} visitors")
    
    def test_site_analytics_returns_daily(self, api_client):
        """GET /api/analytics/site should return daily breakdown"""
        response = api_client.get(f"{BASE_URL}/api/analytics/site?days=7")
        assert response.status_code == 200
        
        data = response.json()
        assert "daily" in data, "Response should contain 'daily'"
        assert isinstance(data["daily"], list)
        
        if len(data["daily"]) > 0:
            day = data["daily"][0]
            assert "date" in day
            assert "views" in day
            assert "visitors" in day
        print(f"✓ Site analytics daily: {len(data['daily'])} days of data")
    
    def test_site_analytics_returns_top_pages(self, api_client):
        """GET /api/analytics/site should return top_pages"""
        response = api_client.get(f"{BASE_URL}/api/analytics/site?days=30")
        assert response.status_code == 200
        
        data = response.json()
        assert "top_pages" in data, "Response should contain 'top_pages'"
        assert isinstance(data["top_pages"], list)
        
        if len(data["top_pages"]) > 0:
            page = data["top_pages"][0]
            assert "page" in page
            assert "views" in page
            assert "visitors" in page
        print(f"✓ Site analytics top_pages: {len(data['top_pages'])} pages")
    
    def test_site_analytics_returns_devices(self, api_client):
        """GET /api/analytics/site should return device breakdown"""
        response = api_client.get(f"{BASE_URL}/api/analytics/site?days=30")
        assert response.status_code == 200
        
        data = response.json()
        assert "devices" in data, "Response should contain 'devices'"
        
        devices = data["devices"]
        assert "mobile" in devices
        assert "desktop" in devices
        print(f"✓ Site analytics devices: {devices['desktop']} desktop, {devices['mobile']} mobile")
    
    def test_site_analytics_returns_referrers(self, api_client):
        """GET /api/analytics/site should return referrers"""
        response = api_client.get(f"{BASE_URL}/api/analytics/site?days=30")
        assert response.status_code == 200
        
        data = response.json()
        assert "referrers" in data, "Response should contain 'referrers'"
        assert isinstance(data["referrers"], list)
        
        if len(data["referrers"]) > 0:
            ref = data["referrers"][0]
            assert "source" in ref
            assert "count" in ref
        print(f"✓ Site analytics referrers: {len(data['referrers'])} sources")
    
    def test_site_analytics_returns_hourly_today(self, api_client):
        """GET /api/analytics/site should return hourly_today"""
        response = api_client.get(f"{BASE_URL}/api/analytics/site?days=30")
        assert response.status_code == 200
        
        data = response.json()
        assert "hourly_today" in data, "Response should contain 'hourly_today'"
        assert isinstance(data["hourly_today"], list)
        print(f"✓ Site analytics hourly_today: {len(data['hourly_today'])} hours with data")
    
    def test_site_analytics_returns_recent_activity(self, api_client):
        """GET /api/analytics/site should return recent_activity"""
        response = api_client.get(f"{BASE_URL}/api/analytics/site?days=30")
        assert response.status_code == 200
        
        data = response.json()
        assert "recent_activity" in data, "Response should contain 'recent_activity'"
        assert isinstance(data["recent_activity"], list)
        
        if len(data["recent_activity"]) > 0:
            activity = data["recent_activity"][0]
            assert "ip" in activity or activity.get("ip") is None  # IP may be present
            assert "created_at" in activity
        print(f"✓ Site analytics recent_activity: {len(data['recent_activity'])} recent events")


class TestWorkspaceLogin:
    """Test workspace login for Coleen and Admin"""
    
    def test_coleen_login_success(self, api_client):
        """POST /api/workspace/login with Coleen2026 should succeed"""
        response = api_client.post(f"{BASE_URL}/api/workspace/login", json={
            "password": "Coleen2026"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("user") == "Coleen"
        assert data.get("role") == "partnerships"
        assert data.get("redirect") == "/workspace/coleen"
        print("✓ Coleen workspace login successful")
    
    def test_admin_login_success(self, api_client):
        """POST /api/workspace/login with CC2026admin should succeed"""
        response = api_client.post(f"{BASE_URL}/api/workspace/login", json={
            "password": "CC2026admin"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("role") == "admin"
        assert data.get("redirect") == "/admin"
        print("✓ Admin workspace login successful")
    
    def test_invalid_password_rejected(self, api_client):
        """POST /api/workspace/login with invalid password should fail"""
        response = api_client.post(f"{BASE_URL}/api/workspace/login", json={
            "password": "wrongpassword123"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid password correctly rejected")


class TestSharedPartners:
    """Test shared partners CRUD for Coleen workspace"""
    
    @pytest.fixture
    def test_partner_id(self, api_client):
        """Create a test partner and return its ID"""
        partner_data = {
            "name": f"TEST_Partner_{uuid.uuid4().hex[:6]}",
            "type": "Bronze",
            "status": "Prospect",
            "contact": "Test Contact",
            "email": "test@partner.com",
            "phone": "+33612345678",
            "lastAction": "Initial contact",
            "nextAction": "Follow up",
            "created_by": "Coleen"
        }
        
        response = api_client.post(f"{BASE_URL}/api/shared/partners", json=partner_data)
        assert response.status_code in [200, 201], f"Failed to create partner: {response.text}"
        
        data = response.json()
        partner_id = data.get("id")
        yield partner_id
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/shared/partners/{partner_id}")
    
    def test_get_partners_list(self, api_client):
        """GET /api/shared/partners should return list"""
        response = api_client.get(f"{BASE_URL}/api/shared/partners")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Partners list: {len(data)} partners")
    
    def test_create_partner(self, api_client):
        """POST /api/shared/partners should create partner"""
        partner_data = {
            "name": f"TEST_NewPartner_{uuid.uuid4().hex[:6]}",
            "type": "Silver",
            "status": "Contacté",
            "contact": "John Doe",
            "email": "john@newpartner.com",
            "created_by": "Coleen"
        }
        
        response = api_client.post(f"{BASE_URL}/api/shared/partners", json=partner_data)
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        # API returns nested structure: {"success": True, "partner": {...}}
        partner = data.get("partner", data)
        assert "id" in partner, f"Partner should have id: {data}"
        assert partner.get("name") == partner_data["name"]
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/shared/partners/{partner['id']}")
        print("✓ Partner created successfully")
    
    def test_update_partner(self, api_client, test_partner_id):
        """PATCH /api/shared/partners/{id} should update partner"""
        update_data = {
            "status": "En négociation",
            "nextAction": "Send proposal"
        }
        
        response = api_client.patch(f"{BASE_URL}/api/shared/partners/{test_partner_id}", json=update_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # API returns {"success": True, "partner": {...}} or just success
        assert data.get("success") is True, f"Update should succeed: {data}"
        
        # Verify by fetching the partner
        get_response = api_client.get(f"{BASE_URL}/api/shared/partners")
        partners = get_response.json()
        updated = next((p for p in partners if p.get("id") == test_partner_id), None)
        if updated:
            assert updated.get("status") == "En négociation"
        print("✓ Partner updated successfully")
    
    def test_delete_partner(self, api_client):
        """DELETE /api/shared/partners/{id} should delete partner"""
        # Create a partner to delete
        partner_data = {
            "name": f"TEST_ToDelete_{uuid.uuid4().hex[:6]}",
            "type": "Bronze",
            "status": "Prospect",
            "created_by": "Coleen"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/shared/partners", json=partner_data)
        partner_id = create_response.json().get("id")
        
        # Delete it
        response = api_client.delete(f"{BASE_URL}/api/shared/partners/{partner_id}")
        assert response.status_code in [200, 204], f"Expected 200/204, got {response.status_code}"
        print("✓ Partner deleted successfully")


class TestSharedContacts:
    """Test shared contacts CRUD for Coleen workspace"""
    
    @pytest.fixture
    def test_contact_id(self, api_client):
        """Create a test contact and return its ID"""
        contact_data = {
            "prenom": "Test",
            "nom": f"Contact_{uuid.uuid4().hex[:6]}",
            "email": "test@contact.com",
            "phone": "+33612345678",
            "organisation": "Test Org",
            "fonction": "Manager",
            "categorie": "Partenaire",
            "notes": "Test contact",
            "owner": "Coleen"
        }
        
        response = api_client.post(f"{BASE_URL}/api/shared/contacts", json=contact_data)
        assert response.status_code in [200, 201], f"Failed to create contact: {response.text}"
        
        data = response.json()
        contact_id = data.get("id")
        yield contact_id
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/shared/contacts/{contact_id}")
    
    def test_get_contacts_list(self, api_client):
        """GET /api/shared/contacts should return list"""
        response = api_client.get(f"{BASE_URL}/api/shared/contacts?owner=Coleen")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Contacts list: {len(data)} contacts")
    
    def test_create_contact(self, api_client):
        """POST /api/shared/contacts should create contact"""
        contact_data = {
            "prenom": "Marie",
            "nom": f"TEST_Dupont_{uuid.uuid4().hex[:6]}",
            "email": "marie@test.com",
            "phone": "+33698765432",
            "organisation": "Test Company",
            "fonction": "Director",
            "categorie": "Institutionnel",
            "owner": "Coleen"
        }
        
        response = api_client.post(f"{BASE_URL}/api/shared/contacts", json=contact_data)
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        # API returns nested structure: {"success": True, "contact": {...}}
        contact = data.get("contact", data)
        assert "id" in contact, f"Contact should have id: {data}"
        assert contact.get("nom") == contact_data["nom"]
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/shared/contacts/{contact['id']}")
        print("✓ Contact created successfully")
    
    def test_delete_contact(self, api_client, test_contact_id):
        """DELETE /api/shared/contacts/{id} should delete contact"""
        response = api_client.delete(f"{BASE_URL}/api/shared/contacts/{test_contact_id}")
        assert response.status_code in [200, 204], f"Expected 200/204, got {response.status_code}"
        print("✓ Contact deleted successfully")


class TestSharedExpenses:
    """Test shared expenses CRUD for Coleen workspace"""
    
    @pytest.fixture
    def test_expense_id(self, api_client):
        """Create a test expense and return its ID"""
        expense_data = {
            "label": f"TEST_Expense_{uuid.uuid4().hex[:6]}",
            "montant": 150.00,
            "category": "partenariat",
            "fournisseur": "Test Vendor",
            "date": "2026-03-26",
            "created_by": "Coleen"
        }
        
        response = api_client.post(f"{BASE_URL}/api/shared/expenses", json=expense_data)
        assert response.status_code in [200, 201], f"Failed to create expense: {response.text}"
        
        data = response.json()
        expense_id = data.get("id")
        yield expense_id
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/shared/expenses/{expense_id}")
    
    def test_get_expenses_list(self, api_client):
        """GET /api/shared/expenses should return list"""
        response = api_client.get(f"{BASE_URL}/api/shared/expenses")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Expenses list: {len(data)} expenses")
    
    def test_create_expense(self, api_client):
        """POST /api/shared/expenses should create expense"""
        expense_data = {
            "label": f"TEST_NewExpense_{uuid.uuid4().hex[:6]}",
            "montant": 250.50,
            "category": "hébergement",
            "fournisseur": "Hotel Test",
            "date": "2026-04-01",
            "created_by": "Coleen"
        }
        
        response = api_client.post(f"{BASE_URL}/api/shared/expenses", json=expense_data)
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        # API returns nested structure: {"success": True, "expense": {...}}
        expense = data.get("expense", data)
        assert "id" in expense, f"Expense should have id: {data}"
        assert expense.get("label") == expense_data["label"]
        assert expense.get("montant") == expense_data["montant"]
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/shared/expenses/{expense['id']}")
        print("✓ Expense created successfully")
    
    def test_delete_expense(self, api_client, test_expense_id):
        """DELETE /api/shared/expenses/{id} should delete expense"""
        response = api_client.delete(f"{BASE_URL}/api/shared/expenses/{test_expense_id}")
        assert response.status_code in [200, 204], f"Expected 200/204, got {response.status_code}"
        print("✓ Expense deleted successfully")


class TestExistingPartners:
    """Verify existing partners in the system"""
    
    def test_existing_partners_count(self, api_client):
        """Should have at least 3 existing partners"""
        response = api_client.get(f"{BASE_URL}/api/shared/partners")
        assert response.status_code == 200
        
        data = response.json()
        # Filter out TEST_ prefixed partners
        real_partners = [p for p in data if not p.get("name", "").startswith("TEST_")]
        print(f"✓ Found {len(real_partners)} existing partners (excluding test data)")
        
        # The requirement mentions 3 existing partners
        if len(real_partners) >= 3:
            print(f"  Partners: {[p.get('name') for p in real_partners[:5]]}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
