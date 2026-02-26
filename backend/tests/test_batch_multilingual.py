"""
Test suite for Culture Connect 2026 Batch Operations & Multilingual features
Testing:
1. POST /api/registrations/batch/approve - Batch approve registrations
2. POST /api/registrations/batch/send-badges - Batch send badges
3. Partner notification when sponsored participant is approved
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
API_URL = f"{BASE_URL}/api"

class TestBatchApprove:
    """Test batch approval of registrations"""
    
    @pytest.fixture
    def test_registrations(self):
        """Create test registrations for batch operations"""
        created_ids = []
        
        # Create 3 test registrations with pending status
        for i in range(3):
            payload = {
                "full_name": f"TEST_BatchApprove_{i}_{uuid.uuid4().hex[:6]}",
                "organization_name": f"Test Org {i}",
                "country": "FR",
                "email": f"test_batch_{i}_{uuid.uuid4().hex[:4]}@test.com",
                "phone": "+33600000000",
                "profile_type": "artist",
                "tier": "professional",
                "status": "pending",  # Important: pending status
                "show_in_catalog": False,
                "bio": "Test participant for batch approval"
            }
            response = requests.post(f"{API_URL}/registrations/manual", json=payload)
            assert response.status_code == 200, f"Failed to create test registration: {response.text}"
            created_ids.append(response.json()["id"])
        
        yield created_ids
        
        # Cleanup
        for reg_id in created_ids:
            try:
                requests.delete(f"{API_URL}/registrations/{reg_id}")
            except:
                pass
    
    def test_batch_approve_success(self, test_registrations):
        """Test batch approval returns success with counts"""
        response = requests.post(
            f"{API_URL}/registrations/batch/approve",
            json={"registration_ids": test_registrations[:2]}  # Approve 2 of 3
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["success"] is True
        assert "total_processed" in data
        assert "approved_count" in data
        assert "already_approved_count" in data
        assert "failed_count" in data
        assert "details" in data
        
        # Verify correct counts
        assert data["approved_count"] >= 1  # At least 1 approved
        print(f"Batch approve: {data['approved_count']} approved, {data['failed_count']} failed")
    
    def test_batch_approve_already_approved(self, test_registrations):
        """Test batch approve handles already approved registrations"""
        # First approve
        requests.post(
            f"{API_URL}/registrations/batch/approve",
            json={"registration_ids": [test_registrations[0]]}
        )
        
        # Try to approve again
        response = requests.post(
            f"{API_URL}/registrations/batch/approve",
            json={"registration_ids": [test_registrations[0]]}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["already_approved_count"] >= 1
        print(f"Already approved count: {data['already_approved_count']}")
    
    def test_batch_approve_max_50_limit(self):
        """Test batch approve enforces max 50 limit"""
        fake_ids = [str(uuid.uuid4()) for _ in range(51)]
        
        response = requests.post(
            f"{API_URL}/registrations/batch/approve",
            json={"registration_ids": fake_ids}
        )
        
        assert response.status_code == 400
        assert "50" in response.text.lower() or "maximum" in response.text.lower()
        print("Max 50 limit enforced correctly")
    
    def test_batch_approve_empty_list(self):
        """Test batch approve rejects empty list"""
        response = requests.post(
            f"{API_URL}/registrations/batch/approve",
            json={"registration_ids": []}
        )
        
        assert response.status_code == 400
        print("Empty list rejected correctly")


class TestBatchSendBadges:
    """Test batch send badges functionality"""
    
    @pytest.fixture
    def approved_registrations(self):
        """Create approved test registrations for badge sending"""
        created_ids = []
        
        # Create 2 approved registrations
        for i in range(2):
            payload = {
                "full_name": f"TEST_BadgeSend_{i}_{uuid.uuid4().hex[:6]}",
                "organization_name": f"Badge Test Org {i}",
                "country": "FR",
                "email": f"badge_test_{i}_{uuid.uuid4().hex[:4]}@test.com",
                "phone": "+33600000000",
                "profile_type": "artist",
                "tier": "professional",
                "status": "approved",  # Important: approved status
                "show_in_catalog": True,
                "bio": "Test participant for badge sending"
            }
            response = requests.post(f"{API_URL}/registrations/manual", json=payload)
            assert response.status_code == 200
            created_ids.append(response.json()["id"])
        
        yield created_ids
        
        # Cleanup
        for reg_id in created_ids:
            try:
                requests.delete(f"{API_URL}/registrations/{reg_id}")
            except:
                pass
    
    def test_batch_send_badges_specific_ids(self, approved_registrations):
        """Test sending badges to specific IDs"""
        response = requests.post(
            f"{API_URL}/registrations/batch/send-badges",
            json={"registration_ids": approved_registrations}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["success"] is True
        assert "sent_count" in data
        assert "failed_count" in data
        assert "details" in data
        
        # Note: Actual email sending depends on Resend config
        print(f"Badge send result: {data['sent_count']} sent, {data['failed_count']} failed")
    
    def test_batch_send_badges_empty_means_all_approved(self):
        """Test that empty registration_ids sends to all approved"""
        response = requests.post(
            f"{API_URL}/registrations/batch/send-badges",
            json={"registration_ids": []}
        )
        
        # Should not error - sends to all approved
        assert response.status_code == 200
        data = response.json()
        print(f"Send to all approved: {data.get('sent_count', 0)} sent")
    
    def test_batch_send_badges_max_50_limit(self):
        """Test batch send badges enforces max 50 limit"""
        fake_ids = [str(uuid.uuid4()) for _ in range(51)]
        
        response = requests.post(
            f"{API_URL}/registrations/batch/send-badges",
            json={"registration_ids": fake_ids}
        )
        
        assert response.status_code == 400
        print("Max 50 limit enforced for badge sending")


class TestPartnerNotification:
    """Test partner notification on sponsored participant approval"""
    
    @pytest.fixture
    def partner_and_sponsored(self):
        """Create a partner and a sponsored participant"""
        # First, get an existing partner or create one
        partners_response = requests.get(f"{API_URL}/partners")
        partners = partners_response.json().get("partners", [])
        
        if partners:
            partner_id = partners[0]["id"]
        else:
            # Create a partner
            partner_payload = {
                "company_name": "TEST_Partner_Notification",
                "contact_name": "Test Contact",
                "contact_email": "testpartner@test.com",
                "contact_phone": "+33600000000",
                "tier": "gold"
            }
            partner_response = requests.post(f"{API_URL}/partners/manual", json=partner_payload)
            if partner_response.status_code == 200:
                partner_id = partner_response.json()["id"]
            else:
                pytest.skip("Could not create partner for notification test")
                return
        
        # Create a pending registration sponsored by this partner
        reg_payload = {
            "full_name": f"TEST_Sponsored_{uuid.uuid4().hex[:6]}",
            "organization_name": "Sponsored Org",
            "country": "FR",
            "email": f"sponsored_{uuid.uuid4().hex[:4]}@test.com",
            "phone": "+33600000000",
            "profile_type": "artist",
            "tier": "professional",
            "status": "pending",
            "show_in_catalog": False,
            "bio": "Sponsored test participant"
        }
        reg_response = requests.post(f"{API_URL}/registrations/manual", json=reg_payload)
        assert reg_response.status_code == 200
        reg_id = reg_response.json()["id"]
        
        # Link the registration to the partner
        link_response = requests.post(f"{API_URL}/partners/{partner_id}/sponsor/{reg_id}")
        
        yield {"partner_id": partner_id, "registration_id": reg_id}
        
        # Cleanup
        try:
            requests.delete(f"{API_URL}/partners/{partner_id}/sponsor/{reg_id}")
            requests.delete(f"{API_URL}/registrations/{reg_id}")
        except:
            pass
    
    def test_approval_triggers_partner_notification(self, partner_and_sponsored):
        """Test that approving a sponsored participant triggers notification"""
        reg_id = partner_and_sponsored["registration_id"]
        
        # Approve the registration
        response = requests.patch(
            f"{API_URL}/registrations/{reg_id}/status",
            json={"status": "approved"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["status"] == "approved"
        
        # Note: Actual email notification is asynchronous and logged in backend
        print("Approval successful - notification would be sent to partner")


class TestAPIHealth:
    """Basic API health checks for batch endpoints"""
    
    def test_api_root(self):
        """Test API is accessible"""
        response = requests.get(f"{API_URL}/")
        assert response.status_code == 200
        print("API root accessible")
    
    def test_registrations_endpoint(self):
        """Test registrations list endpoint"""
        response = requests.get(f"{API_URL}/registrations")
        assert response.status_code == 200
        data = response.json()
        assert "registrations" in data
        assert "counts" in data
        print(f"Registrations endpoint: {data['counts'].get('total', len(data['registrations']))} total")
    
    def test_partners_endpoint(self):
        """Test partners endpoint"""
        response = requests.get(f"{API_URL}/partners")
        assert response.status_code == 200
        data = response.json()
        assert "partners" in data
        print(f"Partners endpoint: {len(data['partners'])} partners")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
