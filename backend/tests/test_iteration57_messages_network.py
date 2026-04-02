"""
Iteration 57 - Messages and Network Pages API Tests
Tests for standalone Messages and Network pages
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com').rstrip('/')

class TestMessagesAPI:
    """Tests for Messages page backend APIs"""
    
    def test_get_messages_for_user(self):
        """GET /api/pro/messages/{user_id} returns messages array"""
        # Use a test user ID
        test_user_id = "test-user-" + str(uuid.uuid4())[:8]
        response = requests.get(f"{BASE_URL}/api/pro/messages/{test_user_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "messages" in data, "Response should contain 'messages' key"
        assert isinstance(data["messages"], list), "Messages should be a list"
        print(f"PASSED: GET /api/pro/messages returns messages array (count: {len(data['messages'])})")
    
    def test_send_message(self):
        """POST /api/pro/messages sends a message"""
        from_id = "test-sender-" + str(uuid.uuid4())[:8]
        to_id = "test-receiver-" + str(uuid.uuid4())[:8]
        
        payload = {
            "from": from_id,
            "to": to_id,
            "content": "Test message from iteration 57"
        }
        
        response = requests.post(f"{BASE_URL}/api/pro/messages", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Message send should succeed"
        assert "message_id" in data, "Response should contain message_id"
        print(f"PASSED: POST /api/pro/messages creates message (id: {data['message_id']})")
    
    def test_mark_message_as_read(self):
        """POST /api/pro/messages/{message_id}/read marks message as read"""
        # First create a message
        from_id = "test-sender-" + str(uuid.uuid4())[:8]
        to_id = "test-receiver-" + str(uuid.uuid4())[:8]
        
        create_response = requests.post(f"{BASE_URL}/api/pro/messages", json={
            "from": from_id,
            "to": to_id,
            "content": "Test message for read receipt"
        })
        
        assert create_response.status_code == 200
        message_id = create_response.json().get("message_id")
        
        # Mark as read
        read_response = requests.post(f"{BASE_URL}/api/pro/messages/{message_id}/read")
        
        assert read_response.status_code == 200, f"Expected 200, got {read_response.status_code}: {read_response.text}"
        print(f"PASSED: POST /api/pro/messages/{message_id}/read marks message as read")


class TestNetworkAPI:
    """Tests for Network page backend APIs"""
    
    def test_get_registrations_directory(self):
        """GET /api/registrations returns professionals list (fallback for directory)"""
        response = requests.get(f"{BASE_URL}/api/registrations")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "registrations" in data, "Response should contain 'registrations' key"
        assert isinstance(data["registrations"], list), "Registrations should be a list"
        
        # Check if we have professionals
        total = data.get("total", len(data["registrations"]))
        print(f"PASSED: GET /api/registrations returns {total} professionals")
        
        # Verify structure of first registration if available
        if data["registrations"]:
            first = data["registrations"][0]
            expected_fields = ["id", "full_name"]
            for field in expected_fields:
                assert field in first, f"Registration should have '{field}' field"
            print(f"PASSED: Registration structure verified (has id, full_name)")
    
    def test_get_connections(self):
        """GET /api/pro/connections/{profile_id} returns connections"""
        test_profile_id = "test-profile-" + str(uuid.uuid4())[:8]
        response = requests.get(f"{BASE_URL}/api/pro/connections/{test_profile_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "connections" in data, "Response should contain 'connections' key"
        assert isinstance(data["connections"], list), "Connections should be a list"
        print(f"PASSED: GET /api/pro/connections returns connections array (count: {len(data['connections'])})")
    
    def test_create_connection(self):
        """POST /api/pro/connect creates a connection"""
        from_id = "test-from-" + str(uuid.uuid4())[:8]
        to_id = "test-to-" + str(uuid.uuid4())[:8]
        
        payload = {
            "from": from_id,
            "to": to_id
        }
        
        response = requests.post(f"{BASE_URL}/api/pro/connect", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Connection should succeed"
        print(f"PASSED: POST /api/pro/connect creates connection")
    
    def test_duplicate_connection_rejected(self):
        """POST /api/pro/connect rejects duplicate connections"""
        from_id = "test-dup-from-" + str(uuid.uuid4())[:8]
        to_id = "test-dup-to-" + str(uuid.uuid4())[:8]
        
        payload = {
            "from": from_id,
            "to": to_id
        }
        
        # First connection
        response1 = requests.post(f"{BASE_URL}/api/pro/connect", json=payload)
        assert response1.status_code == 200
        assert response1.json().get("success") == True
        
        # Duplicate connection
        response2 = requests.post(f"{BASE_URL}/api/pro/connect", json=payload)
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2.get("success") == False, "Duplicate connection should fail"
        assert "message" in data2, "Should have error message"
        print(f"PASSED: Duplicate connection rejected with message: {data2.get('message')}")
    
    def test_get_connection_requests(self):
        """GET /api/pro/connection-requests/{profile_id} returns pending requests"""
        test_profile_id = "test-profile-" + str(uuid.uuid4())[:8]
        response = requests.get(f"{BASE_URL}/api/pro/connection-requests/{test_profile_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "requests" in data, "Response should contain 'requests' key"
        print(f"PASSED: GET /api/pro/connection-requests returns requests array")


class TestProSpaceNavigation:
    """Tests for Pro Space navigation endpoints"""
    
    def test_pro_profile_endpoint(self):
        """GET /api/pro/profile/{id} returns profile data"""
        # Use a known existing profile ID from registrations
        response = requests.get(f"{BASE_URL}/api/registrations")
        if response.status_code == 200:
            regs = response.json().get("registrations", [])
            if regs:
                test_id = regs[0]["id"]
                profile_response = requests.get(f"{BASE_URL}/api/pro/profile/{test_id}")
                # Profile endpoint may return 404 for non-pro profiles, or 200 with data
                assert profile_response.status_code in [200, 404], f"Expected 200 or 404, got {profile_response.status_code}"
                print(f"PASSED: GET /api/pro/profile endpoint accessible (status: {profile_response.status_code})")
                return
        
        # Fallback: test with random ID
        test_id = "test-profile-" + str(uuid.uuid4())[:8]
        response = requests.get(f"{BASE_URL}/api/pro/profile/{test_id}")
        # Should return 404 for non-existent profile
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}"
        print(f"PASSED: GET /api/pro/profile endpoint accessible")
    
    def test_pro_events_endpoint(self):
        """GET /api/pro/events returns events list"""
        response = requests.get(f"{BASE_URL}/api/pro/events")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "events" in data, "Response should contain 'events' key"
        print(f"PASSED: GET /api/pro/events returns events (count: {len(data['events'])})")
    
    def test_pro_opportunities_endpoint(self):
        """GET /api/pro/opportunities returns opportunities list"""
        response = requests.get(f"{BASE_URL}/api/pro/opportunities")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "opportunities" in data, "Response should contain 'opportunities' key"
        print(f"PASSED: GET /api/pro/opportunities returns opportunities (count: {len(data['opportunities'])})")


class TestAdminBypass:
    """Test admin bypass authentication for testing"""
    
    def test_admin_bypass_login(self):
        """Admin bypass with cultureconnectorg@gmail.com and code 000000"""
        # Request access
        request_response = requests.post(f"{BASE_URL}/api/pro/request-access", json={
            "email": "cultureconnectorg@gmail.com"
        })
        
        # May hit rate limit, but should work
        if request_response.status_code == 429:
            print("INFO: Rate limit hit for admin bypass request, skipping")
            pytest.skip("Rate limit hit")
        
        assert request_response.status_code == 200, f"Expected 200, got {request_response.status_code}"
        
        # Verify with bypass code
        verify_response = requests.post(f"{BASE_URL}/api/pro/verify-code", json={
            "email": "cultureconnectorg@gmail.com",
            "code": "000000"
        })
        
        assert verify_response.status_code == 200, f"Expected 200, got {verify_response.status_code}"
        data = verify_response.json()
        assert data.get("success") == True, "Admin bypass should succeed"
        # Admin bypass returns profile with user_id, not bypass flag
        assert "profile" in data or "user_id" in data, "Should return profile or user_id"
        print(f"PASSED: Admin bypass login works (profile: {data.get('profile', {}).get('full_name', 'N/A')})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
