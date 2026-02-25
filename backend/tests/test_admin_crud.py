"""
Backend tests for Culture Connect 2026 Admin CRUD functionality
Testing: POST /api/registrations/manual, DELETE /api/registrations/{id}
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminCRUD:
    """Admin CRUD operations for registrations"""
    
    @pytest.fixture
    def api_client(self):
        """Shared requests session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    # Store created registration IDs for cleanup
    created_ids = []
    
    def test_api_root(self, api_client):
        """Test API root endpoint"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Culture Connect 2026" in data["message"]
        print("✓ API root endpoint working")
    
    def test_admin_verify(self, api_client):
        """Test admin authentication"""
        response = api_client.post(f"{BASE_URL}/api/admin/verify", json={"password": "CC2026admin"})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("✓ Admin authentication working")
    
    def test_admin_verify_invalid_password(self, api_client):
        """Test admin authentication with wrong password"""
        response = api_client.post(f"{BASE_URL}/api/admin/verify", json={"password": "wrongpassword"})
        assert response.status_code == 401
        print("✓ Invalid password rejected correctly")
    
    def test_create_manual_registration(self, api_client):
        """Test POST /api/registrations/manual - Create participant manually"""
        test_id = str(uuid.uuid4())[:8]
        payload = {
            "full_name": f"TEST_Manual User {test_id}",
            "organization_name": f"TEST_Org {test_id}",
            "country": "SN",
            "email": f"test_manual_{test_id}@example.com",
            "phone": "+221 77 000 0000",
            "profile_type": "artist",
            "tier": "professional",
            "status": "approved",
            "show_in_catalog": True,
            "bio": "Test participant created manually"
        }
        
        response = api_client.post(f"{BASE_URL}/api/registrations/manual", json=payload)
        print(f"Create manual registration response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Validate response structure
        assert "id" in data
        assert data["full_name"] == payload["full_name"]
        assert data["organization_name"] == payload["organization_name"]
        assert data["country"] == payload["country"]
        assert data["email"] == payload["email"]
        assert data["profile_type"] == payload["profile_type"]
        assert data["status"] == "approved"
        assert data["show_in_catalog"] == True
        
        # Store ID for cleanup
        self.created_ids.append(data["id"])
        
        print(f"✓ Manual registration created: {data['id']}")
        return data["id"]
    
    def test_create_manual_registration_verify_persistence(self, api_client):
        """Test that manually created registration persists in database"""
        test_id = str(uuid.uuid4())[:8]
        payload = {
            "full_name": f"TEST_Verify {test_id}",
            "organization_name": f"TEST_VerifyOrg {test_id}",
            "country": "martinique",
            "email": f"test_verify_{test_id}@example.com",
            "phone": "+596 696 12 34 56",
            "profile_type": "label",
            "tier": "institutional",
            "status": "pending",
            "show_in_catalog": False,
            "bio": "Testing persistence"
        }
        
        # Create
        create_response = api_client.post(f"{BASE_URL}/api/registrations/manual", json=payload)
        assert create_response.status_code == 200
        created = create_response.json()
        reg_id = created["id"]
        self.created_ids.append(reg_id)
        
        # Verify via GET /api/registrations
        get_response = api_client.get(f"{BASE_URL}/api/registrations")
        assert get_response.status_code == 200
        
        registrations = get_response.json()["registrations"]
        found = next((r for r in registrations if r["id"] == reg_id), None)
        
        assert found is not None, f"Registration {reg_id} not found in list"
        assert found["full_name"] == payload["full_name"]
        assert found["email"] == payload["email"]
        assert found["profile_type"] == payload["profile_type"]
        
        print(f"✓ Manual registration persisted and verified: {reg_id}")
    
    def test_delete_registration(self, api_client):
        """Test DELETE /api/registrations/{id}"""
        # First create a registration to delete
        test_id = str(uuid.uuid4())[:8]
        payload = {
            "full_name": f"TEST_ToDelete {test_id}",
            "organization_name": f"TEST_DeleteOrg {test_id}",
            "country": "france",
            "email": f"test_delete_{test_id}@example.com",
            "phone": "+33 6 00 00 00 00",
            "profile_type": "press",
            "tier": "emerging",
            "status": "approved",
            "show_in_catalog": True,
            "bio": "This will be deleted"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/registrations/manual", json=payload)
        assert create_response.status_code == 200
        reg_id = create_response.json()["id"]
        
        # Delete
        delete_response = api_client.delete(f"{BASE_URL}/api/registrations/{reg_id}")
        assert delete_response.status_code == 200
        
        data = delete_response.json()
        assert data["success"] == True
        assert "deleted" in data["message"].lower()
        
        # Verify deletion - registration should not be in list
        get_response = api_client.get(f"{BASE_URL}/api/registrations")
        registrations = get_response.json()["registrations"]
        found = next((r for r in registrations if r["id"] == reg_id), None)
        
        assert found is None, f"Registration {reg_id} should have been deleted but still exists"
        
        print(f"✓ Registration deleted successfully: {reg_id}")
    
    def test_delete_nonexistent_registration(self, api_client):
        """Test DELETE with non-existent ID returns 404"""
        fake_id = "nonexistent-uuid-12345"
        response = api_client.delete(f"{BASE_URL}/api/registrations/{fake_id}")
        assert response.status_code == 404
        print("✓ Delete non-existent registration returns 404")
    
    def test_catalog_toggle(self, api_client):
        """Test PATCH /api/registrations/{id}/catalog"""
        # Create a registration
        test_id = str(uuid.uuid4())[:8]
        payload = {
            "full_name": f"TEST_CatalogTest {test_id}",
            "organization_name": f"TEST_CatalogOrg {test_id}",
            "country": "guadeloupe",
            "email": f"test_catalog_{test_id}@example.com",
            "phone": "+590 690 00 00 00",
            "profile_type": "institution",
            "tier": "professional",
            "status": "approved",
            "show_in_catalog": False,
            "bio": "Testing catalog toggle"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/registrations/manual", json=payload)
        assert create_response.status_code == 200
        reg_id = create_response.json()["id"]
        self.created_ids.append(reg_id)
        
        # Toggle catalog visibility ON
        toggle_response = api_client.patch(
            f"{BASE_URL}/api/registrations/{reg_id}/catalog",
            json={"show_in_catalog": True}
        )
        assert toggle_response.status_code == 200
        data = toggle_response.json()
        assert data["success"] == True
        assert data["show_in_catalog"] == True
        
        # Toggle catalog visibility OFF
        toggle_response = api_client.patch(
            f"{BASE_URL}/api/registrations/{reg_id}/catalog",
            json={"show_in_catalog": False}
        )
        assert toggle_response.status_code == 200
        data = toggle_response.json()
        assert data["show_in_catalog"] == False
        
        print(f"✓ Catalog toggle working: {reg_id}")


class TestRegistrationForm:
    """Tests for registration form endpoint with dropdown values"""
    
    @pytest.fixture
    def api_client(self):
        session = requests.Session()
        return session
    
    def test_registration_with_all_dropdowns(self, api_client):
        """Test POST /api/registrations captures all dropdown values correctly"""
        test_id = str(uuid.uuid4())[:8]
        
        form_data = {
            "full_name": f"TEST_FormDropdowns {test_id}",
            "organization_name": f"TEST_DropdownOrg {test_id}",
            "country": "senegal",  # Dropdown value
            "email": f"test_dropdowns_{test_id}@example.com",
            "phone": "+221 77 123 4567",
            "profile_type": "booking_agency",  # Dropdown value
            "stand_request": "false",
            "stand_category": "",
            "bio": "Testing that dropdown values are captured correctly",
            "language_preference": "fr",
            "how_heard": "social_media"  # Dropdown value
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/registrations",
            data=form_data
        )
        
        print(f"Registration form response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify dropdown values are correctly captured
        assert data["country"] == "senegal", f"Country should be 'senegal', got '{data.get('country')}'"
        assert data["profile_type"] == "booking_agency", f"Profile type should be 'booking_agency', got '{data.get('profile_type')}'"
        assert data["how_heard"] == "social_media", f"How heard should be 'social_media', got '{data.get('how_heard')}'"
        
        # Verify other fields
        assert data["full_name"] == form_data["full_name"]
        assert data["email"] == form_data["email"]
        assert data["status"] == "pending"  # Default status
        
        print(f"✓ All dropdown values captured correctly")
        print(f"  - country: {data['country']}")
        print(f"  - profile_type: {data['profile_type']}")
        print(f"  - how_heard: {data['how_heard']}")
        
        # Cleanup - delete the test registration
        api_client.delete(f"{BASE_URL}/api/registrations/{data['id']}")
    
    def test_registration_all_profile_types(self, api_client):
        """Test registration with each profile type"""
        profile_types = ["artist", "label", "booking_agency", "institution", "press", "other"]
        
        for profile_type in profile_types:
            test_id = str(uuid.uuid4())[:8]
            form_data = {
                "full_name": f"TEST_Profile_{profile_type}_{test_id}",
                "organization_name": f"TEST_Org_{profile_type}",
                "country": "martinique",
                "email": f"test_{profile_type}_{test_id}@example.com",
                "phone": "+596 696 00 00 00",
                "profile_type": profile_type,
                "stand_request": "false",
                "bio": f"Testing profile type: {profile_type}",
                "language_preference": "fr",
                "how_heard": "website"
            }
            
            response = api_client.post(f"{BASE_URL}/api/registrations", data=form_data)
            assert response.status_code == 200, f"Failed for profile_type: {profile_type}"
            data = response.json()
            assert data["profile_type"] == profile_type
            
            # Cleanup
            api_client.delete(f"{BASE_URL}/api/registrations/{data['id']}")
        
        print(f"✓ All profile types work correctly: {profile_types}")
    
    def test_registration_all_countries(self, api_client):
        """Test registration with various countries"""
        countries = ["martinique", "senegal", "france", "haiti", "usa"]
        
        for country in countries:
            test_id = str(uuid.uuid4())[:8]
            form_data = {
                "full_name": f"TEST_Country_{country}_{test_id}",
                "organization_name": f"TEST_Org_{country}",
                "country": country,
                "email": f"test_{country}_{test_id}@example.com",
                "phone": "+1 555 123 4567",
                "profile_type": "artist",
                "stand_request": "false",
                "bio": f"Testing country: {country}",
                "language_preference": "en",
                "how_heard": "professional_network"
            }
            
            response = api_client.post(f"{BASE_URL}/api/registrations", data=form_data)
            assert response.status_code == 200, f"Failed for country: {country}"
            data = response.json()
            assert data["country"] == country
            
            # Cleanup
            api_client.delete(f"{BASE_URL}/api/registrations/{data['id']}")
        
        print(f"✓ All tested countries work correctly: {countries}")
    
    def test_registration_all_how_heard_options(self, api_client):
        """Test registration with all how_heard options"""
        how_heard_options = ["social_media", "word_of_mouth", "professional_network", "website", "other"]
        
        for how_heard in how_heard_options:
            test_id = str(uuid.uuid4())[:8]
            form_data = {
                "full_name": f"TEST_HowHeard_{how_heard}_{test_id}",
                "organization_name": f"TEST_Org_{how_heard}",
                "country": "france",
                "email": f"test_{how_heard}_{test_id}@example.com",
                "phone": "+33 6 00 00 00 00",
                "profile_type": "artist",
                "stand_request": "false",
                "bio": f"Testing how_heard: {how_heard}",
                "language_preference": "fr",
                "how_heard": how_heard
            }
            
            response = api_client.post(f"{BASE_URL}/api/registrations", data=form_data)
            assert response.status_code == 200, f"Failed for how_heard: {how_heard}"
            data = response.json()
            assert data["how_heard"] == how_heard
            
            # Cleanup
            api_client.delete(f"{BASE_URL}/api/registrations/{data['id']}")
        
        print(f"✓ All how_heard options work correctly: {how_heard_options}")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture
    def api_client(self):
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_cleanup_test_data(self, api_client):
        """Clean up any TEST_ prefixed registrations"""
        response = api_client.get(f"{BASE_URL}/api/registrations")
        if response.status_code == 200:
            registrations = response.json().get("registrations", [])
            test_regs = [r for r in registrations if r.get("full_name", "").startswith("TEST_")]
            
            for reg in test_regs:
                api_client.delete(f"{BASE_URL}/api/registrations/{reg['id']}")
            
            print(f"✓ Cleaned up {len(test_regs)} test registrations")
