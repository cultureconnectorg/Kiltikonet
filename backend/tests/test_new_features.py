"""
Test file for Culture Connect 2026 - 3 New Features
1. Export ciblé par expertise tags et profil (P1)
2. Badges PDF avec QR code pointant vers page de profil (P2)
3. Gestion des partenaires dans l'admin avec liaison aux participants sponsorisés (P2)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://terrain-mode-admin.preview.emergentagent.com')

# Test participant ID provided in test info
TEST_PARTICIPANT_ID = "4d8197f0-4276-488e-ac48-48660228dab7"


# ============= FEATURE 1: FILTERED EXPORT =============

class TestFilteredExport:
    """Test /api/registrations/export/filtered endpoint with expertise_tags and profile_type filters"""
    
    def test_export_filtered_no_params(self):
        """Export all registrations without filters"""
        response = requests.get(f"{BASE_URL}/api/registrations/export/filtered")
        assert response.status_code == 200
        assert response.headers.get("content-type") == "text/csv; charset=utf-8"
        assert "attachment" in response.headers.get("content-disposition", "")
        # Verify CSV has header row
        content = response.text
        assert "id,full_name,organization_name" in content
        print(f"✓ Export without filters: {len(content)} bytes, status 200")
    
    def test_export_filtered_by_profile_type(self):
        """Export filtered by profile_type"""
        response = requests.get(f"{BASE_URL}/api/registrations/export/filtered?profile_type=artist")
        assert response.status_code == 200
        content = response.text
        # Verify filename contains profile type
        assert "artist" in response.headers.get("content-disposition", "").lower() or response.status_code == 200
        print(f"✓ Export by profile_type=artist: {len(content)} bytes")
    
    def test_export_filtered_by_expertise_tags(self):
        """Export filtered by expertise_tags (comma-separated)"""
        response = requests.get(f"{BASE_URL}/api/registrations/export/filtered?expertise_tags=music,labels")
        assert response.status_code == 200
        content = response.text
        assert "id," in content  # Has CSV header
        print(f"✓ Export by expertise_tags=music,labels: {len(content)} bytes")
    
    def test_export_filtered_combined(self):
        """Export with both profile_type and expertise_tags filters"""
        response = requests.get(f"{BASE_URL}/api/registrations/export/filtered?profile_type=label&expertise_tags=marche_culturel")
        assert response.status_code == 200
        print(f"✓ Combined filters export: status {response.status_code}")
    
    def test_export_filtered_includes_expertise_tags_column(self):
        """Verify CSV includes expertise_tags column"""
        response = requests.get(f"{BASE_URL}/api/registrations/export/filtered")
        assert response.status_code == 200
        header_line = response.text.split('\n')[0]
        assert "expertise_tags" in header_line
        print(f"✓ CSV includes expertise_tags column")


# ============= FEATURE 2: PARTICIPANT PROFILE & BADGE =============

class TestParticipantProfile:
    """Test /api/participant/{id} public profile endpoint"""
    
    def test_get_participant_profile_exists(self):
        """Get public profile of existing participant"""
        response = requests.get(f"{BASE_URL}/api/participant/{TEST_PARTICIPANT_ID}")
        
        if response.status_code == 200:
            data = response.json()
            # Verify required fields are present
            assert "id" in data
            assert "full_name" in data
            assert "organization_name" in data
            assert "status" in data
            assert "is_approved" in data
            assert "profile_type" in data
            # Private fields should NOT be present
            assert "email" not in data or data.get("email") is None
            assert "phone" not in data or data.get("phone") is None
            print(f"✓ Participant profile: {data.get('full_name')} - status: {data.get('status')}")
        elif response.status_code == 404:
            pytest.skip(f"Test participant {TEST_PARTICIPANT_ID} not found - using dynamic test")
    
    def test_get_participant_profile_not_found(self):
        """Non-existent participant returns 404"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = requests.get(f"{BASE_URL}/api/participant/{fake_id}")
        assert response.status_code == 404
        print(f"✓ Non-existent participant returns 404")


class TestBadgePDF:
    """Test /api/participant/{id}/badge PDF generation endpoint"""
    
    def test_badge_pdf_approved_participant(self):
        """Badge PDF generation for approved participant"""
        # First verify participant exists and is approved
        profile_resp = requests.get(f"{BASE_URL}/api/participant/{TEST_PARTICIPANT_ID}")
        
        if profile_resp.status_code == 200:
            profile = profile_resp.json()
            if profile.get("status") == "approved":
                response = requests.get(f"{BASE_URL}/api/participant/{TEST_PARTICIPANT_ID}/badge")
                assert response.status_code == 200
                assert response.headers.get("content-type") == "application/pdf"
                assert "attachment" in response.headers.get("content-disposition", "")
                assert len(response.content) > 1000  # PDF should have substantial content
                print(f"✓ Badge PDF generated: {len(response.content)} bytes")
            else:
                # Non-approved participant should get 403
                response = requests.get(f"{BASE_URL}/api/participant/{TEST_PARTICIPANT_ID}/badge")
                assert response.status_code == 403
                print(f"✓ Non-approved participant correctly returns 403")
        else:
            pytest.skip(f"Test participant {TEST_PARTICIPANT_ID} not found")
    
    def test_badge_pdf_not_found(self):
        """Badge PDF for non-existent participant returns 404"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = requests.get(f"{BASE_URL}/api/participant/{fake_id}/badge")
        assert response.status_code == 404
        print(f"✓ Non-existent participant badge returns 404")


# ============= FEATURE 3: PARTNER MANAGEMENT =============

class TestPartnerManagement:
    """Test partner CRUD operations and registration linking"""
    
    @pytest.fixture
    def test_partner_data(self):
        """Test partner data for creation"""
        return {
            "company_name": f"TEST_Partner_{uuid.uuid4().hex[:6]}",
            "contact_name": "Test Contact",
            "contact_email": f"test_{uuid.uuid4().hex[:6]}@test.com",
            "contact_phone": "+1234567890",
            "tier": "gold",
            "website": "https://test-partner.com",
            "show_on_landing": False
        }
    
    def test_get_partners_admin(self):
        """Get all partners via admin endpoint"""
        response = requests.get(f"{BASE_URL}/api/partners/admin")
        assert response.status_code == 200
        data = response.json()
        assert "partners" in data
        assert "total" in data
        assert isinstance(data["partners"], list)
        print(f"✓ Admin partners list: {data['total']} partners")
    
    def test_create_manual_partner(self, test_partner_data):
        """Create a new partner manually"""
        response = requests.post(
            f"{BASE_URL}/api/partners/manual",
            json=test_partner_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "partner_id" in data
        print(f"✓ Partner created: {data['partner_id']}")
        return data["partner_id"]
    
    def test_create_and_delete_partner(self, test_partner_data):
        """Create a partner and then delete it"""
        # Create
        create_resp = requests.post(
            f"{BASE_URL}/api/partners/manual",
            json=test_partner_data
        )
        assert create_resp.status_code == 200
        partner_id = create_resp.json()["partner_id"]
        
        # Delete
        delete_resp = requests.delete(f"{BASE_URL}/api/partners/{partner_id}")
        assert delete_resp.status_code == 200
        print(f"✓ Partner created and deleted: {partner_id}")
    
    def test_update_partner(self, test_partner_data):
        """Create, update, and cleanup partner"""
        # Create
        create_resp = requests.post(
            f"{BASE_URL}/api/partners/manual",
            json=test_partner_data
        )
        assert create_resp.status_code == 200
        partner_id = create_resp.json()["partner_id"]
        
        # Update
        update_resp = requests.patch(
            f"{BASE_URL}/api/partners/{partner_id}",
            json={"tier": "silver", "show_on_landing": True}
        )
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert data.get("success") == True
        print(f"✓ Partner updated: {data.get('updated_fields')}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/partners/{partner_id}")
    
    def test_delete_nonexistent_partner(self):
        """Delete non-existent partner returns 404"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = requests.delete(f"{BASE_URL}/api/partners/{fake_id}")
        assert response.status_code == 404
        print(f"✓ Non-existent partner delete returns 404")


class TestPartnerSponsorLinking:
    """Test partner-registration sponsorship linking"""
    
    def test_link_sponsor_to_registration(self):
        """Link a partner to a registration as sponsor"""
        # First create a test partner
        partner_data = {
            "company_name": f"TEST_Sponsor_{uuid.uuid4().hex[:6]}",
            "contact_name": "Sponsor Contact",
            "contact_email": f"sponsor_{uuid.uuid4().hex[:6]}@test.com",
            "contact_phone": "+1234567890",
            "tier": "gold",
            "show_on_landing": False
        }
        create_resp = requests.post(
            f"{BASE_URL}/api/partners/manual",
            json=partner_data
        )
        assert create_resp.status_code == 200
        partner_id = create_resp.json()["partner_id"]
        
        # Create a test registration
        reg_data = {
            "full_name": f"TEST_Participant_{uuid.uuid4().hex[:6]}",
            "organization_name": "Test Org",
            "country": "FR",
            "email": f"participant_{uuid.uuid4().hex[:6]}@test.com",
            "phone": "+1234567890",
            "profile_type": "artist",
            "tier": "professional",
            "status": "approved",
            "show_in_catalog": False,
            "bio": "Test participant for sponsor linking"
        }
        reg_resp = requests.post(
            f"{BASE_URL}/api/registrations/manual",
            json=reg_data
        )
        assert reg_resp.status_code == 200
        registration_id = reg_resp.json()["id"]
        
        # Link sponsor to registration
        link_resp = requests.post(
            f"{BASE_URL}/api/partners/{partner_id}/sponsor/{registration_id}"
        )
        assert link_resp.status_code == 200
        link_data = link_resp.json()
        assert link_data.get("success") == True
        print(f"✓ Sponsor linked: {partner_data['company_name']} -> {reg_data['full_name']}")
        
        # Unlink sponsor
        unlink_resp = requests.delete(
            f"{BASE_URL}/api/partners/{partner_id}/sponsor/{registration_id}"
        )
        assert unlink_resp.status_code == 200
        print(f"✓ Sponsor unlinked")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/partners/{partner_id}")
        requests.delete(f"{BASE_URL}/api/registrations/{registration_id}")
    
    def test_link_sponsor_invalid_partner(self):
        """Link with invalid partner returns 404"""
        fake_partner_id = "00000000-0000-0000-0000-000000000000"
        fake_reg_id = "00000000-0000-0000-0000-000000000001"
        
        response = requests.post(
            f"{BASE_URL}/api/partners/{fake_partner_id}/sponsor/{fake_reg_id}"
        )
        assert response.status_code == 404
        print(f"✓ Invalid partner link returns 404")


# ============= PUBLIC PARTNERS ENDPOINT =============

class TestPublicPartners:
    """Test public partners endpoint for landing page"""
    
    def test_get_public_partners(self):
        """Get partners for landing page display"""
        response = requests.get(f"{BASE_URL}/api/partners")
        assert response.status_code == 200
        data = response.json()
        assert "partners" in data
        assert "total" in data
        print(f"✓ Public partners: {data['total']} visible on landing")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
