"""
ITER.59 Backend Tests — New Endpoints
Tests for: export-csv, trade/offers, wallet/transfer, wallet/swap, builder CRUD, 
frek/certify, user/follow, brain/sessions, brain/activity, frek/profile
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestIter59PublicEndpoints:
    """Test public endpoints that don't require auth"""
    
    def test_trade_offers_returns_offers_list(self):
        """GET /api/trade/offers — should return {offers: []}"""
        response = requests.get(f"{BASE_URL}/api/trade/offers", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "offers" in data, "Response should contain 'offers' key"
        assert isinstance(data["offers"], list), "offers should be a list"
        print(f"✓ /api/trade/offers returns {len(data['offers'])} offers")
    
    def test_export_csv_returns_csv(self):
        """GET /api/admin/badges/export-csv — should return CSV with UTF-8 BOM"""
        response = requests.get(f"{BASE_URL}/api/admin/badges/export-csv", timeout=15)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check content type
        content_type = response.headers.get('Content-Type', '')
        assert 'text/csv' in content_type, f"Expected text/csv, got {content_type}"
        
        # Check content disposition
        content_disp = response.headers.get('Content-Disposition', '')
        assert 'attachment' in content_disp, "Should have attachment disposition"
        assert 'badges_cc2026_twina.csv' in content_disp, "Filename should be badges_cc2026_twina.csv"
        
        # Check UTF-8 BOM and header row
        content = response.content.decode('utf-8-sig')
        first_line = content.split('\n')[0] if content else ''
        expected_cols = ['badge_id', 'frek_id', 'prenom', 'nom', 'organisation', 
                         'type_badge', 'statut', 'qr_token', 'nfc_enabled', 
                         'date_emission', 'email']
        for col in expected_cols:
            assert col in first_line, f"CSV header should contain '{col}'"
        print(f"✓ /api/admin/badges/export-csv returns valid CSV with {len(expected_cols)} columns")
    
    def test_frek_profile_unknown_returns_404(self):
        """GET /api/frek/profile/{frek_id} — 404 for unknown frek"""
        response = requests.get(f"{BASE_URL}/api/frek/profile/UNKNOWN-FREK-12345", timeout=10)
        assert response.status_code == 404, f"Expected 404 for unknown frek, got {response.status_code}"
        print("✓ /api/frek/profile returns 404 for unknown frek_id")


class TestIter59AuthRequiredEndpoints:
    """Test endpoints that require authentication — should return 401 without session"""
    
    def test_wallet_transfer_requires_auth(self):
        """POST /api/wallet/transfer — should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/wallet/transfer",
            json={"destinataire_frek_id": "test", "montant": 10, "type_jeton": "KT"},
            timeout=10
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✓ /api/wallet/transfer requires auth (401)")
    
    def test_wallet_swap_requires_auth(self):
        """POST /api/wallet/swap — should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/wallet/swap",
            json={"montant": 10, "direction": "KT_TO_JCC"},
            timeout=10
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✓ /api/wallet/swap requires auth (401)")
    
    def test_builder_projects_get_requires_auth(self):
        """GET /api/builder/projects — should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/builder/projects", timeout=10)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✓ GET /api/builder/projects requires auth (401)")
    
    def test_builder_projects_post_requires_auth(self):
        """POST /api/builder/projects — should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/builder/projects",
            json={"titre": "Test", "description": "Test"},
            timeout=10
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✓ POST /api/builder/projects requires auth (401)")
    
    def test_builder_publish_requires_auth(self):
        """POST /api/builder/publish — should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/builder/publish",
            json={"project_id": "test", "canal": "feed"},
            timeout=10
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✓ POST /api/builder/publish requires auth (401)")
    
    def test_frek_certify_requires_auth(self):
        """POST /api/frek/certify — should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/frek/certify",
            json={"project_id": "test"},
            timeout=10
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✓ POST /api/frek/certify requires auth (401)")
    
    def test_user_follow_requires_auth(self):
        """POST /api/user/follow — should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/user/follow",
            json={"target_frek_id": "test"},
            timeout=10
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✓ POST /api/user/follow requires auth (401)")
    
    def test_brain_sessions_requires_auth(self):
        """GET /api/brain/sessions — should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/brain/sessions", timeout=10)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✓ GET /api/brain/sessions requires auth (401)")
    
    def test_brain_activity_requires_auth(self):
        """GET /api/brain/activity — should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/brain/activity", timeout=10)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print("✓ GET /api/brain/activity requires auth (401)")


class TestIter59ExistingEndpoints:
    """Test existing endpoints still work (regression check)"""
    
    def test_health_endpoint(self):
        """GET /api/health — should return 200"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        # May be rate limited, accept 200 or 429
        assert response.status_code in [200, 429], f"Expected 200 or 429, got {response.status_code}"
        print(f"✓ /api/health returns {response.status_code}")
    
    def test_feed_posts_endpoint(self):
        """GET /api/feed/posts — should return posts"""
        response = requests.get(f"{BASE_URL}/api/feed/posts", timeout=10)
        assert response.status_code in [200, 429], f"Expected 200 or 429, got {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert "posts" in data, "Response should contain 'posts'"
            print(f"✓ /api/feed/posts returns {len(data.get('posts', []))} posts")
        else:
            print("✓ /api/feed/posts rate limited (429)")
    
    def test_planning_cc2026_endpoint(self):
        """GET /api/planning/cc2026 — should return agenda"""
        response = requests.get(f"{BASE_URL}/api/planning/cc2026", timeout=10)
        assert response.status_code in [200, 429], f"Expected 200 or 429, got {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert "days" in data, "Response should contain 'days'"
            print(f"✓ /api/planning/cc2026 returns {len(data.get('days', []))} days")
        else:
            print("✓ /api/planning/cc2026 rate limited (429)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
