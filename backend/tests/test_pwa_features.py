"""
PWA Features Tests - CC2026
Tests for:
- Smart Analytics API (POST /api/analytics/batch)
- Team Notifications API (GET /api/team/notifications)
- PWA manifest.json validation
- Service Worker registration availability
- Offline Cache functionality
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com')


class TestSmartAnalyticsAPI:
    """Smart Analytics - tracking comportemental"""

    def test_analytics_batch_post_success(self):
        """POST /api/analytics/batch - envoyer des événements analytiques"""
        response = requests.post(
            f"{BASE_URL}/api/analytics/batch",
            json={
                "events": [
                    {
                        "eventType": "page_view",
                        "sessionId": "test_session_pwa_001",
                        "userId": None,
                        "timestamp": "2026-01-15T10:00:00Z",
                        "data": {
                            "page": "/",
                            "title": "Culture Connect 2026",
                            "device": {"screen": "1920x1080", "isMobile": False}
                        }
                    }
                ]
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["count"] == 1
        print("✓ Analytics batch POST working")

    def test_analytics_intro_section_tracking(self):
        """POST /api/analytics/batch - tracking sections intro cliquées"""
        response = requests.post(
            f"{BASE_URL}/api/analytics/batch",
            json={
                "events": [
                    {
                        "eventType": "intro_section_click",
                        "sessionId": "test_session_pwa_002",
                        "userId": None,
                        "timestamp": "2026-01-15T10:01:00Z",
                        "data": {
                            "section": "diaspora_map",
                            "timestamp": 1736931660000
                        }
                    },
                    {
                        "eventType": "intro_section_click",
                        "sessionId": "test_session_pwa_002",
                        "userId": None,
                        "timestamp": "2026-01-15T10:02:00Z",
                        "data": {
                            "section": "artist_identity",
                            "timestamp": 1736931720000
                        }
                    }
                ]
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["count"] == 2
        print("✓ Intro section tracking working")

    def test_analytics_batch_multiple_events(self):
        """POST /api/analytics/batch - multiple event types"""
        response = requests.post(
            f"{BASE_URL}/api/analytics/batch",
            json={
                "events": [
                    {
                        "eventType": "page_view",
                        "sessionId": "test_session_pwa_003",
                        "userId": "test_user_123",
                        "timestamp": "2026-01-15T10:05:00Z",
                        "data": {"page": "/catalogue"}
                    },
                    {
                        "eventType": "click",
                        "sessionId": "test_session_pwa_003",
                        "userId": "test_user_123",
                        "timestamp": "2026-01-15T10:05:30Z",
                        "data": {"elementId": "artist-card-1", "elementType": "card"}
                    },
                    {
                        "eventType": "page_exit",
                        "sessionId": "test_session_pwa_003",
                        "userId": "test_user_123",
                        "timestamp": "2026-01-15T10:10:00Z",
                        "data": {"page": "/catalogue", "timeSpent": 300000, "scrollDepth": 75}
                    }
                ]
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["count"] == 3
        print("✓ Multiple event types tracking working")

    def test_analytics_dashboard_get(self):
        """GET /api/analytics/dashboard - tableau de bord analytics"""
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard?days=7")
        assert response.status_code == 200
        data = response.json()
        assert "period_days" in data
        assert "event_summary" in data
        assert "page_stats" in data
        assert "generated_at" in data
        print("✓ Analytics dashboard GET working")


class TestTeamNotificationsAPI:
    """Team Notifications - alertes pour l'équipe CC2026"""

    def test_get_team_notifications(self):
        """GET /api/team/notifications - liste des notifications"""
        response = requests.get(f"{BASE_URL}/api/team/notifications")
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "unread_count" in data
        assert isinstance(data["notifications"], list)
        print(f"✓ Team notifications GET working ({len(data['notifications'])} notifications)")

    def test_get_team_notifications_with_limit(self):
        """GET /api/team/notifications?limit=10 - avec limite"""
        response = requests.get(f"{BASE_URL}/api/team/notifications?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["notifications"]) <= 10
        print("✓ Team notifications limit parameter working")

    def test_get_team_notifications_unread_only(self):
        """GET /api/team/notifications?unread_only=true"""
        response = requests.get(f"{BASE_URL}/api/team/notifications?unread_only=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["notifications"], list)
        print("✓ Team notifications unread filter working")

    def test_create_team_notification(self):
        """POST /api/team/notifications/create - créer notification"""
        response = requests.post(
            f"{BASE_URL}/api/team/notifications/create",
            json={
                "type": "test_notification",
                "title": "Test PWA Notification",
                "message": "Testing PWA notification creation",
                "priority": "low"
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "notification_id" in data
        print(f"✓ Team notification created: {data['notification_id']}")

    def test_mark_all_notifications_read(self):
        """POST /api/team/notifications/mark-all-read"""
        response = requests.post(f"{BASE_URL}/api/team/notifications/mark-all-read")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print("✓ Mark all notifications read working")


class TestPWAManifest:
    """PWA Manifest - manifest.json validation"""

    def test_manifest_accessible(self):
        """GET /manifest.json - fichier manifest accessible"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200
        manifest = response.json()
        print("✓ Manifest.json accessible")
        return manifest

    def test_manifest_required_fields(self):
        """Manifest contains required PWA fields"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200
        manifest = response.json()
        
        # Required fields
        assert "name" in manifest
        assert manifest["name"] == "Culture Connect 2026"
        assert "short_name" in manifest
        assert manifest["short_name"] == "CC2026"
        assert "start_url" in manifest
        assert "display" in manifest
        assert manifest["display"] == "standalone"
        assert "background_color" in manifest
        assert "theme_color" in manifest
        print("✓ Manifest required fields present")

    def test_manifest_icons(self):
        """Manifest has proper icons for PWA"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        manifest = response.json()
        
        assert "icons" in manifest
        assert len(manifest["icons"]) > 0
        
        # Check for various sizes needed for PWA
        sizes = [icon.get("sizes") for icon in manifest["icons"]]
        assert "192x192" in sizes, "192x192 icon required for PWA"
        assert "512x512" in sizes, "512x512 icon required for PWA"
        print(f"✓ Manifest icons present: {len(manifest['icons'])} icons")

    def test_manifest_shortcuts(self):
        """Manifest has shortcuts for quick access"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        manifest = response.json()
        
        assert "shortcuts" in manifest
        shortcuts = manifest["shortcuts"]
        assert len(shortcuts) >= 3, "Expected at least 3 shortcuts"
        
        # Verify shortcuts
        shortcut_names = [s.get("name") for s in shortcuts]
        assert "Dashboard CC2026" in shortcut_names
        assert "Espace Pro" in shortcut_names
        assert "Catalogue" in shortcut_names
        
        # Verify URLs
        shortcut_urls = [s.get("url") for s in shortcuts]
        assert "/dashboard-cc2026" in shortcut_urls
        assert "/espace-pro" in shortcut_urls
        assert "/catalogue" in shortcut_urls
        print(f"✓ Manifest shortcuts present: {shortcut_names}")


class TestServiceWorker:
    """Service Worker - sw.js availability"""

    def test_sw_js_accessible(self):
        """GET /sw.js - service worker file accessible"""
        response = requests.get(f"{BASE_URL}/sw.js")
        assert response.status_code == 200
        assert "serviceWorker" in response.text or "self.addEventListener" in response.text
        print("✓ Service worker file accessible")

    def test_sw_js_contains_cache_strategy(self):
        """Service worker contains caching strategies"""
        response = requests.get(f"{BASE_URL}/sw.js")
        content = response.text
        
        # Check for caching strategies
        assert "cache" in content.lower()
        assert "fetch" in content
        assert "install" in content
        assert "activate" in content
        print("✓ Service worker contains caching strategies")

    def test_sw_js_offline_support(self):
        """Service worker supports offline mode"""
        response = requests.get(f"{BASE_URL}/sw.js")
        content = response.text
        
        # Check for offline-related code
        assert "offline" in content.lower() or "Offline" in content
        print("✓ Service worker has offline support")


class TestCatalogPublicAPI:
    """Catalog Public API - utilisé par le PWA"""

    def test_catalog_public_accessible(self):
        """GET /api/catalog - catalogue public"""
        response = requests.get(f"{BASE_URL}/api/catalog")
        assert response.status_code == 200
        data = response.json()
        assert "participants" in data
        assert "total" in data
        print(f"✓ Catalog API working ({data['total']} participants)")


class TestProSpaceIntegration:
    """Espace Pro - accessible sur mobile"""

    def test_pro_request_and_get_code(self):
        """Request access then GET /api/pro/dev/get-code/{email}"""
        # First request access to generate a code
        requests.post(
            f"{BASE_URL}/api/pro/request-access",
            json={"email": "testpro@test.com"},
            headers={"Content-Type": "application/json"}
        )
        
        # Now get the dev code
        response = requests.get(f"{BASE_URL}/api/pro/dev/get-code/testpro@test.com")
        assert response.status_code == 200
        data = response.json()
        assert "code" in data
        print(f"✓ Pro dev code retrieval working")

    def test_pro_verify_code(self):
        """POST /api/pro/verify-code - vérification code"""
        # Request access first
        requests.post(
            f"{BASE_URL}/api/pro/request-access",
            json={"email": "testpro@test.com"},
            headers={"Content-Type": "application/json"}
        )
        
        # Get code
        code_response = requests.get(f"{BASE_URL}/api/pro/dev/get-code/testpro@test.com")
        code = code_response.json()["code"]
        
        # Verify code
        response = requests.post(
            f"{BASE_URL}/api/pro/verify-code",
            json={"email": "testpro@test.com", "code": code},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "profile" in data
        print("✓ Pro code verification working")

    def test_pro_opportunities(self):
        """GET /api/pro/opportunities - opportunités espace pro"""
        response = requests.get(f"{BASE_URL}/api/pro/opportunities")
        assert response.status_code == 200
        data = response.json()
        assert "opportunities" in data
        print(f"✓ Pro opportunities API working ({len(data['opportunities'])} opportunities)")

    def test_pro_events(self):
        """GET /api/pro/events - événements espace pro"""
        response = requests.get(f"{BASE_URL}/api/pro/events")
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        print(f"✓ Pro events API working ({len(data['events'])} events)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
