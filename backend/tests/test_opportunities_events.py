"""
Test Espace Pro CC2026 - Opportunities and Events APIs
Tests:
- GET /api/pro/opportunities - List opportunities with filters
- POST /api/pro/opportunities - Create new opportunity
- POST /api/pro/opportunities/{id}/apply - Apply to opportunity
- GET /api/pro/events - List events
- POST /api/pro/events/{id}/register - Register for event
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://event-connect-60.preview.emergentagent.com')

class TestOpportunitiesAPI:
    """Test Opportunities API endpoints"""
    
    def test_get_opportunities_list(self):
        """Test GET /api/pro/opportunities returns 7 real opportunities"""
        response = requests.get(f"{BASE_URL}/api/pro/opportunities")
        assert response.status_code == 200
        
        data = response.json()
        assert "opportunities" in data
        opportunities = data["opportunities"]
        
        # Should have 7 opportunities
        assert len(opportunities) == 7, f"Expected 7 opportunities, got {len(opportunities)}"
        
        # Verify each opportunity has required fields
        for opp in opportunities:
            assert "id" in opp
            assert "title" in opp
            assert "type" in opp
            assert "author_name" in opp
            assert "description" in opp
            assert "deadline" in opp
        
        print(f"✓ Found {len(opportunities)} opportunities")
    
    def test_opportunities_have_correct_types(self):
        """Test opportunities have the expected types: Booking, Business, Subvention, Formation, Emploi"""
        response = requests.get(f"{BASE_URL}/api/pro/opportunities")
        assert response.status_code == 200
        
        data = response.json()
        opportunities = data["opportunities"]
        
        # Get unique types
        types = set(opp["type"] for opp in opportunities)
        expected_types = {"Booking", "Business", "Subvention", "Formation", "Emploi"}
        
        # Should have at least some of these types
        assert len(types.intersection(expected_types)) >= 3, f"Expected at least 3 different types, got: {types}"
        print(f"✓ Found opportunity types: {types}")
    
    def test_opportunities_have_deadlines(self):
        """Test that opportunities have deadline field"""
        response = requests.get(f"{BASE_URL}/api/pro/opportunities")
        assert response.status_code == 200
        
        data = response.json()
        opportunities = data["opportunities"]
        
        for opp in opportunities:
            assert opp.get("deadline"), f"Opportunity {opp['id']} missing deadline"
        
        print("✓ All opportunities have deadlines")
    
    def test_create_opportunity(self):
        """Test POST /api/pro/opportunities creates new opportunity"""
        new_opp = {
            "title": "TEST Opportunity - Festival 2026",
            "type": "Booking",
            "author_id": "test-author-id",
            "author_name": "Test Author",
            "description": "Test opportunity for automated testing",
            "requirements": "Test requirements",
            "deadline": "2026-06-01",
            "location": "Test Location",
            "contact_email": "test@test.com"
        }
        
        response = requests.post(f"{BASE_URL}/api/pro/opportunities", json=new_opp)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "opportunity" in data
        assert data["opportunity"]["title"] == new_opp["title"]
        
        print(f"✓ Created opportunity: {data['opportunity']['id']}")
    
    def test_apply_to_opportunity(self):
        """Test POST /api/pro/opportunities/{id}/apply"""
        # First get an existing opportunity
        response = requests.get(f"{BASE_URL}/api/pro/opportunities")
        assert response.status_code == 200
        
        opportunities = response.json()["opportunities"]
        assert len(opportunities) > 0
        
        opp_id = opportunities[0]["id"]
        
        # Apply to it
        application = {
            "applicant_id": "test-applicant-id",
            "message": "Test application message from automated testing"
        }
        
        apply_response = requests.post(f"{BASE_URL}/api/pro/opportunities/{opp_id}/apply", json=application)
        assert apply_response.status_code == 200
        
        data = apply_response.json()
        assert data.get("success") == True
        
        print(f"✓ Applied to opportunity: {opp_id}")
    
    def test_apply_to_nonexistent_opportunity(self):
        """Test applying to non-existent opportunity returns 404"""
        application = {
            "applicant_id": "test-applicant-id",
            "message": "Test message"
        }
        
        response = requests.post(f"{BASE_URL}/api/pro/opportunities/nonexistent-id/apply", json=application)
        assert response.status_code == 404
        
        print("✓ Non-existent opportunity returns 404")


class TestEventsAPI:
    """Test Events API endpoints"""
    
    def test_get_events_list(self):
        """Test GET /api/pro/events returns 7 real CC2026 events"""
        response = requests.get(f"{BASE_URL}/api/pro/events")
        assert response.status_code == 200
        
        data = response.json()
        assert "events" in data
        events = data["events"]
        
        # Should have 7 events
        assert len(events) == 7, f"Expected 7 events, got {len(events)}"
        
        # Verify each event has required fields
        for event in events:
            assert "id" in event
            assert "title" in event
            assert "type" in event
            assert "date" in event
            assert "time" in event
            assert "location" in event
        
        print(f"✓ Found {len(events)} events")
    
    def test_events_are_in_may_2026(self):
        """Test events are scheduled for 20-23 Mai 2026"""
        response = requests.get(f"{BASE_URL}/api/pro/events")
        assert response.status_code == 200
        
        events = response.json()["events"]
        
        for event in events:
            date = event["date"]
            # Should be 2026-05-XX
            assert date.startswith("2026-05-2"), f"Event {event['id']} date {date} not in May 2026 (20-23)"
        
        print("✓ All events are in May 2026 (20-23)")
    
    def test_events_have_correct_types(self):
        """Test events have expected types: Networking, Formation, Concert, Conférence, Atelier"""
        response = requests.get(f"{BASE_URL}/api/pro/events")
        assert response.status_code == 200
        
        events = response.json()["events"]
        
        types = set(event["type"] for event in events)
        expected_types = {"Networking", "Formation", "Concert", "Conférence", "Atelier"}
        
        assert len(types.intersection(expected_types)) >= 3, f"Expected at least 3 different types, got: {types}"
        print(f"✓ Found event types: {types}")
    
    def test_events_sorted_by_date(self):
        """Test events are sorted by date ascending"""
        response = requests.get(f"{BASE_URL}/api/pro/events")
        assert response.status_code == 200
        
        events = response.json()["events"]
        
        dates = [event["date"] for event in events]
        assert dates == sorted(dates), "Events are not sorted by date"
        
        print("✓ Events are sorted by date")
    
    def test_register_for_event(self):
        """Test POST /api/pro/events/{id}/register"""
        # Get an event
        response = requests.get(f"{BASE_URL}/api/pro/events")
        assert response.status_code == 200
        
        events = response.json()["events"]
        assert len(events) > 0
        
        # Use unique attendee_id to avoid "already registered"
        import uuid
        event_id = events[0]["id"]
        attendee_id = f"test-attendee-{uuid.uuid4().hex[:8]}"
        
        registration = {
            "attendee_id": attendee_id
        }
        
        reg_response = requests.post(f"{BASE_URL}/api/pro/events/{event_id}/register", json=registration)
        assert reg_response.status_code == 200
        
        data = reg_response.json()
        assert data.get("success") == True
        
        print(f"✓ Registered for event: {event_id}")
    
    def test_register_nonexistent_event(self):
        """Test registering for non-existent event returns 404"""
        registration = {
            "attendee_id": "test-attendee-id"
        }
        
        response = requests.post(f"{BASE_URL}/api/pro/events/nonexistent-id/register", json=registration)
        assert response.status_code == 404
        
        print("✓ Non-existent event returns 404")
    
    def test_double_registration_handled(self):
        """Test that double registration is handled gracefully"""
        response = requests.get(f"{BASE_URL}/api/pro/events")
        assert response.status_code == 200
        
        events = response.json()["events"]
        event_id = events[0]["id"]
        
        # Use same attendee_id twice
        attendee_id = "test-double-registration"
        registration = {"attendee_id": attendee_id}
        
        # First registration
        reg1 = requests.post(f"{BASE_URL}/api/pro/events/{event_id}/register", json=registration)
        assert reg1.status_code == 200
        
        # Second registration - should return success=False or message
        reg2 = requests.post(f"{BASE_URL}/api/pro/events/{event_id}/register", json=registration)
        assert reg2.status_code == 200  # API returns 200 with success: False
        
        data = reg2.json()
        # Either success is False or there's a message about being registered
        if data.get("success") == False:
            assert "inscrit" in data.get("message", "").lower() or "déjà" in data.get("message", "").lower()
        
        print("✓ Double registration handled correctly")


class TestProSpaceAuthentication:
    """Test Pro Space login flow"""
    
    def test_request_access_approved_user(self):
        """Test request-access for approved user"""
        response = requests.post(f"{BASE_URL}/api/pro/request-access", json={"email": "testpro@test.com"})
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        
        print("✓ Request access works for approved user")
    
    def test_request_access_unknown_user(self):
        """Test request-access for unknown user returns 404"""
        response = requests.post(f"{BASE_URL}/api/pro/request-access", json={"email": "unknown@unknown.com"})
        assert response.status_code == 404
        
        print("✓ Unknown user returns 404")
    
    def test_get_dev_code(self):
        """Test dev endpoint to get access code after request"""
        # First request access to generate code
        requests.post(f"{BASE_URL}/api/pro/request-access", json={"email": "testpro@test.com"})
        
        # Get the code
        response = requests.get(f"{BASE_URL}/api/pro/dev/get-code/testpro@test.com")
        assert response.status_code == 200
        
        data = response.json()
        if data.get("code"):
            assert len(data["code"]) == 6
            assert data["code"].isdigit()
            print(f"✓ Got access code: {data['code']}")
        else:
            print("⚠ No code found (may have expired)")
    
    def test_verify_code_invalid(self):
        """Test verify-code with invalid code returns 400"""
        response = requests.post(f"{BASE_URL}/api/pro/verify-code", json={
            "email": "testpro@test.com",
            "code": "000000"
        })
        assert response.status_code == 400
        
        print("✓ Invalid code returns 400")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
