"""
Iteration 35 - Testing Refactored Routes (shared.py, terrain.py) and Badge Export PDF
Tests:
1. Shared routes: partners, contacts, tasks, expenses CRUD
2. Terrain routes: validate-badge, affluence, search
3. Badge export stats endpoint
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSharedRoutes:
    """Test /api/shared/* routes extracted from server.py"""
    
    def test_get_partners_returns_array(self):
        """GET /api/shared/partners returns array with at least 3 partners"""
        response = requests.get(f"{BASE_URL}/api/shared/partners")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3, f"Expected at least 3 partners, got {len(data)}"
        # Verify partner structure
        if len(data) > 0:
            partner = data[0]
            assert "id" in partner
            assert "name" in partner
            assert "type" in partner
        print(f"✓ GET /api/shared/partners returned {len(data)} partners")
    
    def test_get_contacts_returns_array(self):
        """GET /api/shared/contacts returns valid array"""
        response = requests.get(f"{BASE_URL}/api/shared/contacts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/shared/contacts returned {len(data)} contacts")
    
    def test_get_tasks_returns_array(self):
        """GET /api/shared/tasks returns valid array"""
        response = requests.get(f"{BASE_URL}/api/shared/tasks")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/shared/tasks returned {len(data)} tasks")
    
    def test_get_expenses_returns_array(self):
        """GET /api/shared/expenses returns valid array"""
        response = requests.get(f"{BASE_URL}/api/shared/expenses")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/shared/expenses returned {len(data)} expenses")
    
    def test_partner_crud_create_update_delete(self):
        """Test full CRUD cycle for partners"""
        unique_id = str(uuid.uuid4())[:8]
        
        # CREATE
        create_payload = {
            "name": f"TEST_Partner_{unique_id}",
            "type": "Bronze",
            "status": "Prospect",
            "contact": "Test Contact",
            "email": f"test_{unique_id}@partner.com"
        }
        create_response = requests.post(f"{BASE_URL}/api/shared/partners", json=create_payload)
        assert create_response.status_code == 200
        created = create_response.json()
        assert created.get("success") == True
        partner_id = created.get("partner", {}).get("id")
        assert partner_id is not None
        print(f"✓ POST /api/shared/partners created partner {partner_id}")
        
        # UPDATE
        update_payload = {"status": "En négociation"}
        update_response = requests.patch(f"{BASE_URL}/api/shared/partners/{partner_id}", json=update_payload)
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated.get("success") == True
        assert updated.get("partner", {}).get("status") == "En négociation"
        print(f"✓ PATCH /api/shared/partners/{partner_id} updated status")
        
        # DELETE
        delete_response = requests.delete(f"{BASE_URL}/api/shared/partners/{partner_id}")
        assert delete_response.status_code == 200
        deleted = delete_response.json()
        assert deleted.get("success") == True
        print(f"✓ DELETE /api/shared/partners/{partner_id} deleted partner")


class TestTerrainRoutes:
    """Test /api/terrain/* routes extracted from server.py"""
    
    def test_get_affluence_returns_counts(self):
        """GET /api/terrain/affluence returns present_count and total_registered"""
        response = requests.get(f"{BASE_URL}/api/terrain/affluence")
        assert response.status_code == 200
        data = response.json()
        assert "present_count" in data
        assert "total_registered" in data
        assert "remaining" in data
        assert "percentage" in data
        assert "updated_at" in data
        print(f"✓ GET /api/terrain/affluence: {data['present_count']}/{data['total_registered']} present")
    
    def test_validate_badge_invalid_returns_not_found(self):
        """POST /api/terrain/validate-badge with invalid ID returns status=error, code=NOT_FOUND"""
        payload = {
            "badge_id": "test-invalid-id-12345",
            "validator_id": "staff_test",
            "location": "entree_principale"
        }
        response = requests.post(f"{BASE_URL}/api/terrain/validate-badge", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "error"
        assert data.get("code") == "NOT_FOUND"
        assert data.get("color") == "red"
        print(f"✓ POST /api/terrain/validate-badge with invalid ID returns NOT_FOUND")
    
    def test_search_returns_results_array(self):
        """GET /api/terrain/search?q=test returns results array"""
        response = requests.get(f"{BASE_URL}/api/terrain/search?q=test")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert isinstance(data["results"], list)
        print(f"✓ GET /api/terrain/search?q=test returned {len(data['results'])} results")
    
    def test_search_short_query_returns_empty(self):
        """GET /api/terrain/search?q=a returns empty results (min 2 chars)"""
        response = requests.get(f"{BASE_URL}/api/terrain/search?q=a")
        assert response.status_code == 200
        data = response.json()
        assert data.get("results") == []
        print(f"✓ GET /api/terrain/search?q=a returns empty (min 2 chars)")


class TestBadgeExportStats:
    """Test /api/badges/export-stats endpoint"""
    
    def test_export_stats_returns_structure(self):
        """GET /api/badges/export-stats returns total_approved and by_tier"""
        response = requests.get(f"{BASE_URL}/api/badges/export-stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_approved" in data
        assert "by_tier" in data
        assert isinstance(data["by_tier"], dict)
        print(f"✓ GET /api/badges/export-stats: {data['total_approved']} approved badges")


class TestServerLineCount:
    """Verify server.py refactoring reduced line count"""
    
    def test_server_py_under_8400_lines(self):
        """server.py should have fewer than 8400 lines after refactoring"""
        server_path = "/app/backend/server.py"
        with open(server_path, 'r') as f:
            line_count = len(f.readlines())
        assert line_count < 8400, f"server.py has {line_count} lines, expected < 8400"
        print(f"✓ server.py has {line_count} lines (was 8780, now < 8400)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
