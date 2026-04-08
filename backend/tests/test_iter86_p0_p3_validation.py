"""
ITER.86 — P0 (Éclair KT + WebAuthn Modal), P1 (Responsive), P2 (Push Notifications), P3 (Admin CC2026 Dashboard)
Backend API Tests for Kiltikonet CC2026 Platform
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestEclairEndpoint:
    """P0 — Éclair KT endpoint tests"""
    
    def test_eclair_post_not_found_returns_404(self):
        """POST /api/pro/feed/posts/:id/eclair returns 404 for non-existent post"""
        response = requests.post(
            f"{BASE_URL}/api/pro/feed/posts/nonexistent_post_id_12345/eclair",
            json={"frek_id": "test_frek_123"},
            headers={"Content-Type": "application/json"}
        )
        # Should return 404 for non-existent post, not 500
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data or "error" in data or "message" in data
        print(f"PASS: Eclair endpoint returns 404 for non-existent post")
    
    def test_eclair_missing_frek_id_returns_400(self):
        """POST /api/pro/feed/posts/:id/eclair returns 400 if frek_id missing"""
        response = requests.post(
            f"{BASE_URL}/api/pro/feed/posts/any_post_id/eclair",
            json={},  # Missing frek_id
            headers={"Content-Type": "application/json"}
        )
        # Should return 400 for missing frek_id
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "frek_id" in str(data).lower() or "requis" in str(data).lower()
        print(f"PASS: Eclair endpoint returns 400 when frek_id missing")


class TestPushNotifications:
    """P2 — Push Notifications endpoint tests"""
    
    def test_push_subscribe_requires_auth(self):
        """POST /api/notifications/push/subscribe returns 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/push/subscribe",
            json={"subscription": {"endpoint": "https://test.com", "keys": {}}},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print(f"PASS: Push subscribe returns 401 without auth")
    
    def test_push_preferences_requires_auth(self):
        """GET /api/notifications/push/preferences returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/notifications/push/preferences")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        print(f"PASS: Push preferences returns 401 without auth")
    
    def test_push_send_requires_admin(self):
        """POST /api/notifications/push/send returns 403 without admin auth"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/push/send",
            json={"title": "Test", "body": "Test message"},
            headers={"Content-Type": "application/json"}
        )
        # Should return 401 (no auth) or 403 (not admin)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}: {response.text}"
        print(f"PASS: Push send returns {response.status_code} without admin auth")


class TestAdminCC2026:
    """P3 — Admin CC2026 Dashboard endpoint tests"""
    
    def test_cc2026_stats_requires_admin(self):
        """GET /api/admin/cc2026/stats returns 403 without admin auth"""
        response = requests.get(f"{BASE_URL}/api/admin/cc2026/stats")
        # Should return 401 (no auth) or 403 (not admin)
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}: {response.text}"
        print(f"PASS: CC2026 stats returns {response.status_code} without admin auth")
    
    def test_admin_users_requires_admin(self):
        """GET /api/admin/users returns 403 without admin auth"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}: {response.text}"
        print(f"PASS: Admin users returns {response.status_code} without admin auth")
    
    def test_admin_feed_reported_requires_admin(self):
        """GET /api/admin/feed/reported returns 403 without admin auth"""
        response = requests.get(f"{BASE_URL}/api/admin/feed/reported")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}: {response.text}"
        print(f"PASS: Admin feed reported returns {response.status_code} without admin auth")


class TestAnalytics:
    """Analytics tracking endpoint tests"""
    
    def test_analytics_track_accepts_event(self):
        """POST /api/analytics/track accepts an event"""
        response = requests.post(
            f"{BASE_URL}/api/analytics/track",
            json={"event": "test_event", "properties": {"source": "pytest"}},
            headers={"Content-Type": "application/json"}
        )
        # Should accept the event (200 or 201)
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("ok") == True or data.get("success") == True or "tracked" in str(data).lower()
        print(f"PASS: Analytics track accepts event")


class TestManifest:
    """PWA Manifest tests"""
    
    def test_manifest_has_correct_name(self):
        """manifest.json contains name='Kiltikonet - Espace Pro CC2026'"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("name") == "Kiltikonet - Espace Pro CC2026", f"Expected 'Kiltikonet - Espace Pro CC2026', got {data.get('name')}"
        print(f"PASS: Manifest has correct name")


class TestServiceWorker:
    """Service Worker tests"""
    
    def test_sw_exists(self):
        """sw.js exists and is accessible"""
        response = requests.get(f"{BASE_URL}/sw.js")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        content = response.text
        assert "push" in content.lower(), "sw.js should contain push event handler"
        print(f"PASS: sw.js exists and contains push handler")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
