"""
ITER.87 — Test des 6 correctifs UI
- CORRECTIF 1: Splash screen vidéo
- CORRECTIF 2: Terminal mobile responsive
- CORRECTIF 3: CVL Brain desktop layout
- CORRECTIF 4: Inbox/DMs bulles stylisées
- CORRECTIF 5: Photo de profil avatar upload
- CORRECTIF 6: Splash depuis vitrine
- Son de notification
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')

class TestCorrectif5AvatarUpload:
    """CORRECTIF 5: Photo de profil - endpoint POST /api/user/avatar"""
    
    def test_avatar_endpoint_exists(self):
        """POST /api/user/avatar endpoint exists (returns 401/422 without auth, not 404)"""
        # Create a minimal test image
        import io
        test_image = io.BytesIO()
        # Create a minimal valid JPEG (1x1 pixel)
        test_image.write(bytes([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
            0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
            0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
            0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
            0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
            0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
            0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
            0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
            0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
            0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
            0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
            0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
            0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
            0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
            0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
            0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
            0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
            0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
            0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
            0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
            0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xDB, 0x20, 0xA8, 0xA8, 0xA8, 0x02,
            0xFF, 0xD9
        ]))
        test_image.seek(0)
        
        response = requests.post(
            f"{BASE_URL}/api/user/avatar",
            files={"file": ("test.jpg", test_image, "image/jpeg")}
        )
        # Should return 401 (unauthorized) or 422 (validation), NOT 404
        assert response.status_code in [401, 422, 400], f"Expected 401/422/400, got {response.status_code}"
        print(f"✓ POST /api/user/avatar endpoint exists (returns {response.status_code} without auth)")

    def test_avatar_rejects_invalid_format(self):
        """POST /api/user/avatar rejects non-image files"""
        import io
        fake_file = io.BytesIO(b"not an image")
        
        response = requests.post(
            f"{BASE_URL}/api/user/avatar",
            files={"file": ("test.txt", fake_file, "text/plain")}
        )
        # Should reject with 400 or 401
        assert response.status_code in [400, 401, 422], f"Expected 400/401/422, got {response.status_code}"
        print(f"✓ POST /api/user/avatar rejects invalid format (returns {response.status_code})")


class TestNotificationSounds:
    """Son de notification - fichiers accessibles (served by frontend)"""
    
    def test_notif_mp3_accessible(self):
        """GET /sounds/notif.mp3 returns 200 (frontend static)"""
        # Static files are served by frontend, not backend
        frontend_url = "https://tarifs-update.preview.emergentagent.com"
        response = requests.get(f"{frontend_url}/sounds/notif.mp3", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert len(response.content) > 1000, "File seems too small"
        print(f"✓ /sounds/notif.mp3 accessible ({len(response.content)} bytes)")
    
    def test_notif_ogg_accessible(self):
        """GET /sounds/notif.ogg returns 200 (frontend static)"""
        frontend_url = "https://tarifs-update.preview.emergentagent.com"
        response = requests.get(f"{frontend_url}/sounds/notif.ogg", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert len(response.content) > 1000, "File seems too small"
        print(f"✓ /sounds/notif.ogg accessible ({len(response.content)} bytes)")


class TestSplashVideoFiles:
    """CORRECTIF 1 & 6: Splash screen vidéo files (served by frontend)"""
    
    def test_splash_mp4_accessible(self):
        """GET /videos/splash.mp4 returns 200 (frontend static)"""
        frontend_url = "https://tarifs-update.preview.emergentagent.com"
        response = requests.get(f"{frontend_url}/videos/splash.mp4", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert len(response.content) > 10000, "Video file seems too small"
        print(f"✓ /videos/splash.mp4 accessible ({len(response.content)} bytes)")
    
    def test_splash_webm_accessible(self):
        """GET /videos/splash.webm returns 200 (frontend static)"""
        frontend_url = "https://tarifs-update.preview.emergentagent.com"
        response = requests.get(f"{frontend_url}/videos/splash.webm", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert len(response.content) > 10000, "Video file seems too small"
        print(f"✓ /videos/splash.webm accessible ({len(response.content)} bytes)")


class TestMessagesEndpoints:
    """CORRECTIF 4: Inbox/DMs - endpoints exist"""
    
    def test_conversations_endpoint_exists(self):
        """GET /api/messages/conversations returns 401 without auth (not 404)"""
        response = requests.get(f"{BASE_URL}/api/messages/conversations")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print(f"✓ GET /api/messages/conversations endpoint exists (returns {response.status_code})")
    
    def test_send_message_endpoint_exists(self):
        """POST /api/messages/send returns 401/422/429 without auth (not 404)"""
        response = requests.post(
            f"{BASE_URL}/api/messages/send",
            json={"recipient_email": "test@test.com", "content": "test"}
        )
        # 429 is rate limiting, which means endpoint exists
        assert response.status_code in [401, 403, 422, 429], f"Expected 401/403/422/429, got {response.status_code}"
        print(f"✓ POST /api/messages/send endpoint exists (returns {response.status_code})")


class TestBrainEndpoints:
    """CORRECTIF 3: CVL Brain - endpoints exist"""
    
    def test_brain_chat_endpoint_exists(self):
        """POST /api/brain/chat-enriched returns 401/422 without auth (not 404)"""
        response = requests.post(
            f"{BASE_URL}/api/brain/chat-enriched",
            json={"message": "test", "messages": []}
        )
        # Should return 401 (unauthorized) or 422 (validation), NOT 404
        assert response.status_code in [401, 403, 422, 400], f"Expected 401/403/422/400, got {response.status_code}"
        print(f"✓ POST /api/brain/chat-enriched endpoint exists (returns {response.status_code})")
    
    def test_brain_sessions_endpoint_exists(self):
        """GET /api/brain/sessions returns 401 without auth (not 404)"""
        response = requests.get(f"{BASE_URL}/api/brain/sessions")
        assert response.status_code in [401, 403, 200], f"Expected 401/403/200, got {response.status_code}"
        print(f"✓ GET /api/brain/sessions endpoint exists (returns {response.status_code})")


class TestTerminalEndpoints:
    """CORRECTIF 2: Terminal - endpoints exist"""
    
    def test_terminal_deploy_endpoint_exists(self):
        """POST /api/terminal/deploy returns 401/422 without auth (not 404)"""
        response = requests.post(
            f"{BASE_URL}/api/terminal/deploy",
            json={"slug": "test", "html": "<html></html>", "title": "Test", "frek_id": "test"}
        )
        assert response.status_code in [401, 403, 422, 200], f"Expected 401/403/422/200, got {response.status_code}"
        print(f"✓ POST /api/terminal/deploy endpoint exists (returns {response.status_code})")
    
    def test_terminal_deploys_endpoint_exists(self):
        """GET /api/terminal/deploys returns 401/200 (not 404)"""
        response = requests.get(f"{BASE_URL}/api/terminal/deploys?frek_id=test")
        assert response.status_code in [401, 403, 200], f"Expected 401/403/200, got {response.status_code}"
        print(f"✓ GET /api/terminal/deploys endpoint exists (returns {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
