"""
Culture Connect 2026 - Final Production Audit Tests
Comprehensive API testing for all critical endpoints before deployment
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cc2026-updates.preview.emergentagent.com')

class TestHealthAndRoot:
    """Test basic API availability - /api root endpoint"""
    
    def test_api_root(self):
        """Test that API root responds correctly"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Culture Connect 2026 API" in data["message"]
        print(f"✓ API root: {data['message']}")


class TestCMSMapTerritories:
    """Test CMS map territories endpoint - critical for Globe3D component"""
    
    def test_get_map_territories(self):
        """GET /api/cms/map-territories - returns territories for globe"""
        response = requests.get(f"{BASE_URL}/api/cms/map-territories")
        assert response.status_code == 200
        data = response.json()
        
        # Verify territories array exists
        assert "territories" in data
        territories = data["territories"]
        assert isinstance(territories, list)
        assert len(territories) >= 10  # At least 10 default territories
        
        # Verify required territory structure
        for t in territories:
            assert "id" in t
            assert "name" in t
            assert "lat" in t
            assert "lon" in t or "lng" in t
            assert "color" in t
        
        # Verify Martinique (center) exists
        martinique = next((t for t in territories if t.get("isCenter") == True), None)
        assert martinique is not None, "Martinique (center) territory not found"
        print(f"✓ Map territories: {len(territories)} territories loaded, center: {martinique['name']}")


class TestRegistrations:
    """Test registrations CRUD operations"""
    
    def test_get_registrations(self):
        """GET /api/registrations - list all registrations"""
        response = requests.get(f"{BASE_URL}/api/registrations")
        assert response.status_code == 200
        data = response.json()
        
        assert "registrations" in data
        assert "total" in data
        assert "counts" in data
        
        # Verify counts structure
        counts = data["counts"]
        assert "total" in counts
        assert "by_profile" in counts
        assert "by_status" in counts
        print(f"✓ Registrations: {data['total']} total, statuses: {counts['by_status']}")
    
    def test_get_registrations_filtered_by_status(self):
        """GET /api/registrations?status=approved - filter by status"""
        response = requests.get(f"{BASE_URL}/api/registrations?status=approved")
        assert response.status_code == 200
        data = response.json()
        
        # All returned registrations should be approved
        for reg in data["registrations"]:
            assert reg.get("status") == "approved"
        print(f"✓ Filtered registrations (approved): {len(data['registrations'])} found")


class TestCatalog:
    """Test public catalog endpoint"""
    
    def test_get_catalog(self):
        """GET /api/catalog - public participant catalog"""
        response = requests.get(f"{BASE_URL}/api/catalog")
        assert response.status_code == 200
        data = response.json()
        
        assert "participants" in data
        assert "total" in data
        
        # Verify sensitive data is not exposed
        for p in data.get("participants", []):
            assert "email" not in p or p.get("email") is None
            assert "phone" not in p or p.get("phone") is None
            assert "payment_session_id" not in p
        print(f"✓ Catalog: {data['total']} visible participants")


class TestPartners:
    """Test partners endpoint"""
    
    def test_get_partners(self):
        """GET /api/partners - list partners for landing page"""
        response = requests.get(f"{BASE_URL}/api/partners")
        assert response.status_code == 200
        data = response.json()
        
        assert "partners" in data
        assert "total" in data
        print(f"✓ Partners: {data['total']} partners")


class TestCMSEndpoints:
    """Test CMS administrative endpoints"""
    
    def test_get_cms_media(self):
        """GET /api/cms/media - list CMS media items"""
        response = requests.get(f"{BASE_URL}/api/cms/media")
        assert response.status_code == 200
        data = response.json()
        assert "media" in data
        print(f"✓ CMS Media: {len(data['media'])} items")
    
    def test_get_cms_speakers(self):
        """GET /api/cms/speakers - list speakers/intervenants"""
        response = requests.get(f"{BASE_URL}/api/cms/speakers")
        assert response.status_code == 200
        data = response.json()
        assert "speakers" in data
        print(f"✓ CMS Speakers: {len(data['speakers'])} speakers")
    
    def test_get_cms_partners(self):
        """GET /api/cms/partners - list CMS partner banners"""
        response = requests.get(f"{BASE_URL}/api/cms/partners")
        assert response.status_code == 200
        data = response.json()
        assert "partners" in data
        print(f"✓ CMS Partners: {len(data['partners'])} partner banners")
    
    def test_get_cms_theme(self):
        """GET /api/cms/theme - get site theme configuration"""
        response = requests.get(f"{BASE_URL}/api/cms/theme")
        assert response.status_code == 200
        data = response.json()
        
        # Verify theme has color properties
        assert "primary_color" in data
        assert "secondary_color" in data
        assert "accent_color" in data
        print(f"✓ CMS Theme: primary={data['primary_color']}, secondary={data['secondary_color']}")
    
    def test_get_cms_content(self):
        """GET /api/cms/content - get page content"""
        response = requests.get(f"{BASE_URL}/api/cms/content?page=home")
        assert response.status_code == 200
        data = response.json()
        assert "content" in data
        print(f"✓ CMS Content (home): {len(data['content'])} sections")
    
    def test_get_cms_pages(self):
        """GET /api/cms/pages - list custom pages"""
        response = requests.get(f"{BASE_URL}/api/cms/pages")
        assert response.status_code == 200
        data = response.json()
        assert "pages" in data
        print(f"✓ CMS Pages: {len(data['pages'])} custom pages")


class TestStripeIntegration:
    """Test Stripe payment integration endpoints"""
    
    def test_get_stripe_public_key(self):
        """GET /api/stripe-public-key - returns public key for frontend"""
        response = requests.get(f"{BASE_URL}/api/stripe-public-key")
        assert response.status_code == 200
        data = response.json()
        
        assert "publicKey" in data
        assert data["publicKey"].startswith("pk_")  # Public keys start with pk_
        print(f"✓ Stripe public key: {data['publicKey'][:20]}...")
    
    def test_create_checkout_session_validation(self):
        """POST /api/create-checkout-session - validates checkout data"""
        # Test with invalid tier
        invalid_data = {
            "type": "accreditation",
            "tier": "invalid_tier",
            "origin_url": "https://test.com"
        }
        response = requests.post(f"{BASE_URL}/api/create-checkout-session", json=invalid_data)
        assert response.status_code == 400
        print("✓ Checkout session: invalid tier rejected")


class TestSmartConnectEngine:
    """Test Smart Connect networking engine endpoints"""
    
    def test_get_smart_profiles(self):
        """GET /api/v1/smart-recommendations/profiles - list smart engine profiles"""
        response = requests.get(f"{BASE_URL}/api/v1/smart-recommendations/profiles")
        # May return 200 or 404 if not configured
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Smart Engine profiles: {len(data.get('profiles', []))} profiles")
        else:
            print("✓ Smart Engine profiles: not configured (expected)")
    
    def test_search_match_endpoint(self):
        """GET /api/v1/search/match - sector keyword search"""
        response = requests.get(f"{BASE_URL}/api/v1/search/match?limit=5")
        # May return 200 or 404 if not configured
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Search match: {len(data.get('suggestions', []))} suggestions")
        else:
            print("✓ Search match: not configured (expected)")


class TestEmailLogs:
    """Test email logging endpoints"""
    
    def test_get_email_logs(self):
        """GET /api/email-logs - list email send history"""
        response = requests.get(f"{BASE_URL}/api/email-logs?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        assert "logs" in data
        assert "summary" in data
        print(f"✓ Email logs: {len(data['logs'])} logs, summary: {data['summary']}")
    
    def test_get_email_stats(self):
        """GET /api/email-logs/stats - email statistics"""
        response = requests.get(f"{BASE_URL}/api/email-logs/stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "by_type" in data
        print(f"✓ Email stats: types={list(data.get('by_type', {}).keys())}")


class TestBatchOperations:
    """Test batch operation endpoints"""
    
    def test_get_batch_history(self):
        """GET /api/registrations/batch/history - batch job history"""
        response = requests.get(f"{BASE_URL}/api/registrations/batch/history")
        assert response.status_code == 200
        data = response.json()
        
        assert "jobs" in data
        assert "total" in data
        print(f"✓ Batch history: {data['total']} jobs")


class TestSiteConfiguration:
    """Test site configuration endpoints"""
    
    def test_get_site_config(self):
        """GET /api/cms/site-config - global site settings"""
        response = requests.get(f"{BASE_URL}/api/cms/site-config")
        assert response.status_code == 200
        data = response.json()
        
        # Verify animation settings present
        assert "animations_enabled" in data
        assert "countdown_enabled" in data
        print(f"✓ Site config: animations={data['animations_enabled']}, countdown={data['countdown_enabled']}")
    
    def test_get_annual_intention(self):
        """GET /api/cms/annual-intention - intro sequence config"""
        response = requests.get(f"{BASE_URL}/api/cms/annual-intention")
        assert response.status_code == 200
        data = response.json()
        
        # Verify intention structure
        assert "annee" in data
        assert "mot_annee" in data
        print(f"✓ Annual intention: {data['annee']} - {data['mot_annee']}")


class TestExportEndpoints:
    """Test data export endpoints"""
    
    def test_export_registrations_csv(self):
        """GET /api/registrations/export - export as CSV"""
        response = requests.get(f"{BASE_URL}/api/registrations/export")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        print("✓ CSV export: working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
