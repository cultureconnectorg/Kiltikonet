"""
Test Mode Terrain APIs for CC2026
- POST /api/terrain/validate-badge (green/orange/red responses)
- GET /api/terrain/affluence (real-time counter)
- GET /api/terrain/search (quick search by name)
- POST /api/terrain/manual-checkin/{id}
- DELETE /api/terrain/reset-presence/{id}
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTerrainMode:
    """Test Mode Terrain APIs for badge scanning and attendance"""
    
    # ─────────────────────────────────────────────
    # Setup: Get a test registration ID
    # ─────────────────────────────────────────────
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get an approved registration to test with"""
        # Get first approved registration
        response = requests.get(f"{BASE_URL}/api/registrations?status=approved")
        assert response.status_code == 200, f"Failed to get registrations: {response.text}"
        data = response.json()
        regs = data.get("registrations", [])
        assert len(regs) > 0, "No approved registrations found"
        
        # Find one without presence_status
        for reg in regs:
            if reg.get("presence_status") != "present":
                self.test_reg = reg
                break
        else:
            # All are present, use first one and reset
            self.test_reg = regs[0]
        
        self.test_id = self.test_reg["id"]
        self.test_name = self.test_reg["full_name"]
    
    # ─────────────────────────────────────────────
    # Test 1: Validate badge - GREEN (valid, first scan)
    # ─────────────────────────────────────────────
    def test_validate_badge_green_success(self):
        """Test badge validation returns green for valid first-time scan"""
        # First reset presence to ensure clean state
        reset_response = requests.delete(f"{BASE_URL}/api/terrain/reset-presence/{self.test_id}")
        assert reset_response.status_code == 200, f"Reset failed: {reset_response.text}"
        
        # Now validate badge
        response = requests.post(
            f"{BASE_URL}/api/terrain/validate-badge",
            json={
                "badge_id": self.test_id,
                "validator_id": "test-validator",
                "location": "Entrée Test"
            }
        )
        
        assert response.status_code == 200, f"Validate badge failed: {response.text}"
        data = response.json()
        
        # Validate response structure and values
        assert data["status"] == "success", f"Expected success status, got: {data['status']}"
        assert data["code"] == "VALIDATED", f"Expected VALIDATED code, got: {data['code']}"
        assert data["color"] == "green", f"Expected green color, got: {data['color']}"
        assert data["message"] == "Entrée validée !", f"Expected French success message"
        assert "person" in data, "Response should contain person info"
        assert data["person"]["full_name"] == self.test_name
        assert "scanned_at" in data, "Response should contain scan timestamp"
        
        print(f"✓ GREEN scan successful for {self.test_name}")
    
    # ─────────────────────────────────────────────
    # Test 2: Validate badge - ORANGE (already scanned)
    # ─────────────────────────────────────────────
    def test_validate_badge_orange_duplicate(self):
        """Test badge validation returns orange for already scanned badge"""
        # First ensure the badge is marked as present (scan it)
        requests.delete(f"{BASE_URL}/api/terrain/reset-presence/{self.test_id}")  # Reset first
        requests.post(f"{BASE_URL}/api/terrain/validate-badge", json={"badge_id": self.test_id})  # First scan
        
        # Now try to scan again - should get orange
        response = requests.post(
            f"{BASE_URL}/api/terrain/validate-badge",
            json={
                "badge_id": self.test_id,
                "validator_id": "test-validator"
            }
        )
        
        assert response.status_code == 200, f"Validate badge failed: {response.text}"
        data = response.json()
        
        # Validate orange response
        assert data["status"] == "already_scanned", f"Expected already_scanned status, got: {data['status']}"
        assert data["code"] == "DUPLICATE", f"Expected DUPLICATE code, got: {data['code']}"
        assert data["color"] == "orange", f"Expected orange color, got: {data['color']}"
        assert data["message"] == "Badge déjà scanné", f"Expected duplicate message"
        assert "scanned_at" in data, "Response should contain original scan timestamp"
        assert "person" in data, "Response should contain person info"
        
        print(f"✓ ORANGE duplicate scan correctly returned for {self.test_name}")
    
    # ─────────────────────────────────────────────
    # Test 3: Validate badge - RED (invalid badge)
    # ─────────────────────────────────────────────
    def test_validate_badge_red_invalid(self):
        """Test badge validation returns red for invalid badge ID"""
        response = requests.post(
            f"{BASE_URL}/api/terrain/validate-badge",
            json={
                "badge_id": "invalid-badge-id-12345",
                "validator_id": "test-validator"
            }
        )
        
        assert response.status_code == 200, f"Request failed: {response.text}"
        data = response.json()
        
        # Validate red response
        assert data["status"] == "error", f"Expected error status, got: {data['status']}"
        assert data["code"] == "NOT_FOUND", f"Expected NOT_FOUND code, got: {data['code']}"
        assert data["color"] == "red", f"Expected red color, got: {data['color']}"
        assert "Badge non trouvé" in data["message"], f"Expected not found message"
        
        print("✓ RED invalid badge correctly returned")
    
    # ─────────────────────────────────────────────
    # Test 4: Get Affluence (real-time counter)
    # ─────────────────────────────────────────────
    def test_get_affluence(self):
        """Test affluence endpoint returns real-time attendance data"""
        response = requests.get(f"{BASE_URL}/api/terrain/affluence")
        
        assert response.status_code == 200, f"Affluence request failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "total_registered" in data, "Missing total_registered field"
        assert "present_count" in data, "Missing present_count field"
        assert "remaining" in data, "Missing remaining field"
        assert "percentage" in data, "Missing percentage field"
        assert "recent_scans_1h" in data, "Missing recent_scans_1h field"
        assert "last_scans" in data, "Missing last_scans field"
        assert "updated_at" in data, "Missing updated_at field"
        
        # Validate data types and logic
        assert isinstance(data["total_registered"], int), "total_registered should be int"
        assert isinstance(data["present_count"], int), "present_count should be int"
        assert isinstance(data["remaining"], int), "remaining should be int"
        assert isinstance(data["percentage"], (int, float)), "percentage should be numeric"
        
        # Validate math: remaining = total - present
        assert data["remaining"] == data["total_registered"] - data["present_count"], \
            f"Remaining calculation incorrect: {data['remaining']} != {data['total_registered']} - {data['present_count']}"
        
        # Validate percentage is between 0-100
        assert 0 <= data["percentage"] <= 100, f"Percentage out of range: {data['percentage']}"
        
        print(f"✓ Affluence: {data['present_count']}/{data['total_registered']} ({data['percentage']}%)")
    
    # ─────────────────────────────────────────────
    # Test 5: Search participants by name
    # ─────────────────────────────────────────────
    def test_search_participants(self):
        """Test search endpoint finds participants by name"""
        # Search for first 3 chars of test participant's name
        search_term = self.test_name[:3]
        
        response = requests.get(f"{BASE_URL}/api/terrain/search?q={search_term}&limit=5")
        
        assert response.status_code == 200, f"Search request failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "results" in data, "Missing results field"
        assert "count" in data, "Missing count field"
        assert isinstance(data["results"], list), "results should be a list"
        
        # Should find at least the test participant
        if len(data["results"]) > 0:
            result = data["results"][0]
            assert "id" in result, "Result missing id"
            assert "full_name" in result, "Result missing full_name"
            assert "organization_name" in result, "Result missing organization_name"
        
        print(f"✓ Search '{search_term}' returned {data['count']} results")
    
    # ─────────────────────────────────────────────
    # Test 6: Search with short query (< 2 chars)
    # ─────────────────────────────────────────────
    def test_search_short_query(self):
        """Test search returns empty for queries < 2 chars"""
        response = requests.get(f"{BASE_URL}/api/terrain/search?q=A")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["results"] == [], "Short query should return empty results"
        assert data["count"] == 0, "Short query count should be 0"
        
        print("✓ Short search query correctly returns empty")
    
    # ─────────────────────────────────────────────
    # Test 7: Manual check-in
    # ─────────────────────────────────────────────
    def test_manual_checkin(self):
        """Test manual check-in without QR code"""
        # Reset presence first
        requests.delete(f"{BASE_URL}/api/terrain/reset-presence/{self.test_id}")
        
        response = requests.post(f"{BASE_URL}/api/terrain/manual-checkin/{self.test_id}")
        
        assert response.status_code == 200, f"Manual checkin failed: {response.text}"
        data = response.json()
        
        assert data["status"] == "success", f"Expected success, got: {data['status']}"
        assert "scanned_at" in data, "Missing scanned_at in response"
        
        print(f"✓ Manual check-in successful for {self.test_name}")
    
    # ─────────────────────────────────────────────
    # Test 8: Manual check-in when already present
    # ─────────────────────────────────────────────
    def test_manual_checkin_already_present(self):
        """Test manual check-in returns already_present for scanned participant"""
        # Ensure participant is present
        requests.delete(f"{BASE_URL}/api/terrain/reset-presence/{self.test_id}")
        requests.post(f"{BASE_URL}/api/terrain/manual-checkin/{self.test_id}")  # First checkin
        
        # Try manual checkin again
        response = requests.post(f"{BASE_URL}/api/terrain/manual-checkin/{self.test_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "already_present", f"Expected already_present, got: {data['status']}"
        
        print("✓ Manual check-in correctly returns already_present")
    
    # ─────────────────────────────────────────────
    # Test 9: Manual check-in for non-existent participant
    # ─────────────────────────────────────────────
    def test_manual_checkin_not_found(self):
        """Test manual check-in returns 404 for invalid ID"""
        response = requests.post(f"{BASE_URL}/api/terrain/manual-checkin/invalid-id-12345")
        
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"
        
        print("✓ Manual check-in correctly returns 404 for invalid ID")
    
    # ─────────────────────────────────────────────
    # Test 10: Reset presence
    # ─────────────────────────────────────────────
    def test_reset_presence(self):
        """Test reset presence clears attendance status"""
        # First ensure participant is present
        requests.post(f"{BASE_URL}/api/terrain/validate-badge", json={"badge_id": self.test_id})
        
        # Now reset
        response = requests.delete(f"{BASE_URL}/api/terrain/reset-presence/{self.test_id}")
        
        assert response.status_code == 200, f"Reset failed: {response.text}"
        data = response.json()
        
        assert data["status"] == "success", f"Expected success, got: {data['status']}"
        
        # Verify reset worked - scan should return green now
        verify = requests.post(f"{BASE_URL}/api/terrain/validate-badge", json={"badge_id": self.test_id})
        verify_data = verify.json()
        assert verify_data["color"] == "green", f"After reset, scan should be green, got: {verify_data['color']}"
        
        print("✓ Reset presence working correctly")
    
    # ─────────────────────────────────────────────
    # Test 11: Reset presence for non-existent participant
    # ─────────────────────────────────────────────
    def test_reset_presence_not_found(self):
        """Test reset presence returns 404 for invalid ID"""
        response = requests.delete(f"{BASE_URL}/api/terrain/reset-presence/invalid-id-12345")
        
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"
        
        print("✓ Reset presence correctly returns 404 for invalid ID")
    
    # ─────────────────────────────────────────────
    # Cleanup: Reset test participant
    # ─────────────────────────────────────────────
    @pytest.fixture(autouse=True)
    def cleanup(self, request):
        """Reset test participant after each test"""
        yield
        # Cleanup: Reset presence for test participant
        if hasattr(self, 'test_id'):
            requests.delete(f"{BASE_URL}/api/terrain/reset-presence/{self.test_id}")


class TestTerrainEdgeCases:
    """Test edge cases for terrain APIs"""
    
    def test_validate_badge_empty_body(self):
        """Test validate badge with empty request body"""
        response = requests.post(
            f"{BASE_URL}/api/terrain/validate-badge",
            json={}
        )
        # Should fail validation - badge_id is required
        assert response.status_code in [422, 400], f"Expected validation error, got: {response.status_code}"
        print("✓ Empty request body correctly rejected")
    
    def test_affluence_performance(self):
        """Test affluence endpoint responds quickly"""
        import time
        start = time.time()
        response = requests.get(f"{BASE_URL}/api/terrain/affluence")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 2.0, f"Affluence took too long: {elapsed:.2f}s"
        
        print(f"✓ Affluence responded in {elapsed:.3f}s")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
