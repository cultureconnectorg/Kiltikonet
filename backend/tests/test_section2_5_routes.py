"""
Test Section 2-5 Routes: Culture Connect 2026
- Section 2: Routes et synchronisation Baserow-MongoDB
- Section 4: Workspace Alirio contacts
- Section 5: Help guides

Test runs against: https://tarifs-update.preview.emergentagent.com
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com').rstrip('/')

# ============================================================
# FIXTURES
# ============================================================
@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

# ============================================================
# SECTION 2: Route POST /api/register - Site Registration
# ============================================================
class TestSiteRegistration:
    """Test /api/register - inscription site with Baserow sync"""
    
    def test_register_public_user(self, api_client):
        """Register a basic public user (non-professional)"""
        payload = {
            "full_name": "TEST_Jean Public",
            "email": f"test_public_{int(time.time())}@example.com",
            "phone": "+596696000001",
            "organization_name": "",
            "profile_type": "other",
            "country": "Martinique",
            "bio": "Test user bio",
            "is_professional": False,
            "cc2026_interest": False
        }
        
        response = api_client.post(f"{BASE_URL}/api/register", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert "user_id" in data
        assert data.get("badge_type") == "Public", f"Expected 'Public' badge, got {data.get('badge_type')}"
        assert data.get("show_in_catalog") is False  # Public users not in catalog
        print(f"✓ Public user registered: {data.get('user_id')} - Badge: {data.get('badge_type')}")
    
    def test_register_professional_artist(self, api_client):
        """Register a professional artist user"""
        payload = {
            "full_name": "TEST_Marie Artiste",
            "email": f"test_artist_{int(time.time())}@example.com",
            "phone": "+596696000002",
            "organization_name": "Studio Creole",
            "profile_type": "artist",
            "country": "Martinique",
            "bio": "Professional artist bio",
            "is_professional": True,
            "cc2026_interest": True  # Should sync to Baserow
        }
        
        response = api_client.post(f"{BASE_URL}/api/register", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("badge_type") == "Artiste", f"Expected 'Artiste' badge, got {data.get('badge_type')}"
        # Professional artists should be shown in catalog
        print(f"✓ Professional artist registered: {data.get('user_id')} - Badge: {data.get('badge_type')} - Baserow: {data.get('baserow_synced')}")
    
    def test_register_professional_press(self, api_client):
        """Register a professional press user"""
        payload = {
            "full_name": "TEST_Pierre Presse",
            "email": f"test_press_{int(time.time())}@example.com",
            "phone": "+596696000003",
            "organization_name": "France Antilles",
            "profile_type": "press",
            "country": "France hexagonale",
            "bio": "Journalist bio",
            "is_professional": True,
            "cc2026_interest": True
        }
        
        response = api_client.post(f"{BASE_URL}/api/register", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("badge_type") == "Presse", f"Expected 'Presse' badge, got {data.get('badge_type')}"
        print(f"✓ Press professional registered: {data.get('user_id')} - Badge: {data.get('badge_type')}")
    
    def test_register_institution(self, api_client):
        """Register an institutional user"""
        payload = {
            "full_name": "TEST_Institution User",
            "email": f"test_instit_{int(time.time())}@ctm.mq",
            "phone": "+596596000004",
            "organization_name": "CTM Test",
            "profile_type": "institution",
            "country": "Martinique",
            "bio": "Institutional partner",
            "is_professional": True,
            "cc2026_interest": True
        }
        
        response = api_client.post(f"{BASE_URL}/api/register", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("badge_type") == "Institutionnel", f"Expected 'Institutionnel' badge, got {data.get('badge_type')}"
        print(f"✓ Institutional user registered: {data.get('user_id')} - Badge: {data.get('badge_type')}")


# ============================================================
# SECTION 2: Route POST /api/admin/accreditation - Admin Manual Add
# ============================================================
class TestAdminAccreditation:
    """Test /api/admin/accreditation - Admin adds participant to Baserow"""
    
    def test_admin_add_participant_artiste(self, api_client):
        """Admin adds an artist participant directly to Baserow"""
        payload = {
            "prenom": "TEST_Admin",
            "nom": f"Artiste{int(time.time())}",
            "organisation": "Test Label",
            "email": f"admin_test_{int(time.time())}@example.com",
            "telephone": "+596696111222",
            "badge_type": "Artiste",
            "territoire": "Martinique",
            "secteur": "Musique",
            "zones_acces": "Backstage, Loge"
        }
        
        response = api_client.post(f"{BASE_URL}/api/admin/accreditation", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert "baserow_id" in data, "Should return Baserow ID"
        assert data.get("badge_type") == "Artiste"
        print(f"✓ Admin added participant to Baserow: ID={data.get('baserow_id')} - {data.get('name')}")
        
        return data.get("baserow_id")
    
    def test_admin_add_participant_vip(self, api_client):
        """Admin adds a VIP participant"""
        payload = {
            "prenom": "TEST_VIP",
            "nom": f"Guest{int(time.time())}",
            "organisation": "VIP Company",
            "email": f"vip_test_{int(time.time())}@example.com",
            "telephone": "+596696333444",
            "badge_type": "VIP",
            "territoire": "Guadeloupe",
            "secteur": "Institutionnel",
            "zones_acces": "VIP, Backstage, Loge"
        }
        
        response = api_client.post(f"{BASE_URL}/api/admin/accreditation", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("badge_type") == "VIP"
        print(f"✓ VIP participant added to Baserow: ID={data.get('baserow_id')}")
        
        return data.get("baserow_id")
    
    def test_admin_add_participant_presse(self, api_client):
        """Admin adds a press participant"""
        payload = {
            "prenom": "TEST_Presse",
            "nom": f"Journaliste{int(time.time())}",
            "organisation": "RCI",
            "email": f"presse_test_{int(time.time())}@rci.fm",
            "telephone": "+596596555666",
            "badge_type": "Presse",
            "territoire": "Martinique",
            "secteur": "Autre",
            "zones_acces": "Presse, Scene"
        }
        
        response = api_client.post(f"{BASE_URL}/api/admin/accreditation", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        print(f"✓ Press participant added: ID={data.get('baserow_id')}")


# ============================================================
# SECTION 2: Routes GET/PATCH /api/badge/{id} - QR Badge Validation
# ============================================================
class TestBadgeValidation:
    """Test /api/badge/{id} - QR scan badge validation"""
    
    def test_get_badge_info_invalid_id(self, api_client):
        """Get badge info for invalid ID should return 404"""
        response = api_client.get(f"{BASE_URL}/api/badge/nonexistent123")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid badge ID correctly returns 404")
    
    def test_validate_badge_presence_invalid_id(self, api_client):
        """Validate presence for invalid badge should return 404"""
        response = api_client.patch(f"{BASE_URL}/api/badge/nonexistent456/validate")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid badge validation correctly returns 404")
    
    def test_badge_validation_flow(self, api_client):
        """Full flow: Admin creates badge -> GET info -> PATCH validate"""
        # Step 1: Admin creates a participant in Baserow
        payload = {
            "prenom": "TEST_Scan",
            "nom": f"Validation{int(time.time())}",
            "organisation": "Test Corp",
            "email": f"scan_test_{int(time.time())}@example.com",
            "telephone": "+596696777888",
            "badge_type": "Participant",
            "territoire": "Martinique",
            "secteur": "Autre",
            "zones_acces": ""
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/admin/accreditation", json=payload)
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        
        baserow_id = create_response.json().get("baserow_id")
        assert baserow_id is not None, "No Baserow ID returned"
        print(f"✓ Step 1: Participant created with Baserow ID: {baserow_id}")
        
        # Step 2: GET badge info
        get_response = api_client.get(f"{BASE_URL}/api/badge/{baserow_id}")
        assert get_response.status_code == 200, f"GET badge failed: {get_response.status_code}"
        
        badge_data = get_response.json()
        assert badge_data.get("source") == "baserow"
        assert badge_data.get("statut_presence") in ["Absent", None, ""]
        assert badge_data.get("is_present") is False
        print(f"✓ Step 2: Badge info retrieved - Present: {badge_data.get('is_present')}")
        
        # Step 3: PATCH validate presence (simulates QR scan at event)
        validate_response = api_client.patch(f"{BASE_URL}/api/badge/{baserow_id}/validate")
        assert validate_response.status_code == 200, f"Validate failed: {validate_response.status_code}"
        
        validate_data = validate_response.json()
        assert validate_data.get("success") is True
        assert validate_data.get("status") == "Present"
        assert "heure_arrivee" in validate_data
        print(f"✓ Step 3: Presence validated at {validate_data.get('heure_arrivee')}")
        
        # Step 4: Verify presence is now set
        verify_response = api_client.get(f"{BASE_URL}/api/badge/{baserow_id}")
        assert verify_response.status_code == 200
        
        verify_data = verify_response.json()
        assert verify_data.get("is_present") is True or verify_data.get("statut_presence") == "Present"
        print(f"✓ Step 4: Verified presence is now True")


# ============================================================
# SECTION 2: Route GET /api/catalog/sync - Public Catalog
# ============================================================
class TestCatalogSync:
    """Test /api/catalog/sync - catalogue public synchronise"""
    
    def test_get_synced_catalog(self, api_client):
        """Get synchronized public catalog"""
        response = api_client.get(f"{BASE_URL}/api/catalog/sync")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "participants" in data
        assert "total" in data
        assert "visible_types" in data
        
        # Verify visible_types excludes non-public badges
        visible_types = data.get("visible_types", [])
        assert "VIP" not in visible_types, "VIP should not be in public catalog"
        assert "Benevole" not in visible_types, "Benevole should not be in public catalog"
        
        print(f"✓ Catalog sync returned {data.get('total')} participants")
        print(f"  Visible badge types: {visible_types}")
        
        # Verify no private data is exposed
        for p in data.get("participants", [])[:5]:
            assert "email" not in p, "Email should not be exposed in public catalog"
            assert "phone" not in p, "Phone should not be exposed in public catalog"
        
        print("✓ No private data (email/phone) exposed in catalog")


# ============================================================
# SECTION 4: Workspace Alirio - Contacts API
# ============================================================
class TestAlirioContacts:
    """Test /api/contacts/alirio - Mes contacts workspace"""
    
    def test_create_alirio_contact(self, api_client):
        """Create a contact in Alirio's directory"""
        payload = {
            "prenom": "TEST_Contact",
            "nom": f"Nouveau{int(time.time())}",
            "email": f"contact_{int(time.time())}@example.com",
            "tel": "+596696999000",
            "organisation": "Test Company",
            "type": "Personnel",
            "statut": "Contact",
            "niveau_partenariat": None,
            "notes": "Test contact notes"
        }
        
        response = api_client.post(f"{BASE_URL}/api/contacts/alirio", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert "contact_id" in data
        print(f"✓ Alirio contact created: ID={data.get('contact_id')}")
        
        return data.get("contact_id")
    
    def test_get_alirio_contacts(self, api_client):
        """Get all Alirio's contacts"""
        response = api_client.get(f"{BASE_URL}/api/contacts/alirio")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "contacts" in data
        assert "total" in data
        
        print(f"✓ Retrieved {data.get('total')} Alirio contacts")
    
    def test_promote_contact_to_partner(self, api_client):
        """Create contact and promote to partner"""
        # First create a contact
        payload = {
            "prenom": "TEST_Promote",
            "nom": f"ToPartner{int(time.time())}",
            "email": f"promote_{int(time.time())}@example.com",
            "tel": "+596696123456",
            "organisation": "Future Partner Corp",
            "type": "Personnel",
            "statut": "Contact",
            "niveau_partenariat": None,
            "notes": "Potential partner"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/contacts/alirio", json=payload)
        assert create_response.status_code == 200
        contact_id = create_response.json().get("contact_id")
        print(f"✓ Contact created for promotion: {contact_id}")
        
        # Promote to Bronze partner
        promote_response = api_client.patch(
            f"{BASE_URL}/api/contacts/alirio/{contact_id}/promote",
            params={"level": "Bronze"}
        )
        assert promote_response.status_code == 200, f"Promote failed: {promote_response.status_code} - {promote_response.text}"
        
        promote_data = promote_response.json()
        assert promote_data.get("success") is True
        print(f"✓ Contact promoted to Bronze partner")
        
        # Verify promotion
        contacts_response = api_client.get(f"{BASE_URL}/api/contacts/alirio")
        contacts = contacts_response.json().get("contacts", [])
        promoted = next((c for c in contacts if c.get("id") == contact_id), None)
        
        if promoted:
            assert promoted.get("statut") == "Partenaire"
            assert promoted.get("niveau_partenariat") == "Bronze"
            print(f"✓ Verified: statut={promoted.get('statut')}, niveau={promoted.get('niveau_partenariat')}")


# ============================================================
# HEALTH CHECK
# ============================================================
class TestHealthCheck:
    """Basic API health checks"""
    
    def test_api_root(self, api_client):
        """Test API root endpoint"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"API root failed: {response.status_code}"
        print("✓ API root responding")
    
    def test_catalog_endpoint(self, api_client):
        """Test public catalog endpoint"""
        response = api_client.get(f"{BASE_URL}/api/catalog")
        assert response.status_code == 200, f"Catalog failed: {response.status_code}"
        
        data = response.json()
        assert "participants" in data
        print(f"✓ Public catalog has {data.get('total', 0)} participants")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
