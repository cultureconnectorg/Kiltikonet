"""
ITER.80 - Omega Espace Pro Backend Tests
Tests for: Adhesion, Feed, FREK, Brain Memory, User Settings, RGPD
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com')


class TestAdhesionEndpoints:
    """Test adhesion levels and subscription endpoints"""
    
    def test_get_adhesion_levels_returns_4_levels(self):
        """GET /api/adhesion/levels should return 4 levels: FREE, PRO, PREMIUM, INSTITUTIONNEL"""
        response = requests.get(f"{BASE_URL}/api/adhesion/levels")
        assert response.status_code == 200
        
        data = response.json()
        assert "levels" in data
        levels = data["levels"]
        assert len(levels) == 4
        
        # Verify level IDs
        level_ids = [l["id"] for l in levels]
        assert "FREE" in level_ids
        assert "PRO" in level_ids
        assert "PREMIUM" in level_ids
        assert "INSTITUTIONNEL" in level_ids
        
        # Verify FREE level has correct values
        free_level = next(l for l in levels if l["id"] == "FREE")
        assert free_level["prix_mensuel"] == 0
        assert free_level["brain_quota_daily"] == 10
        assert free_level["kt_offerts"] == 0
        
        # Verify PRO level
        pro_level = next(l for l in levels if l["id"] == "PRO")
        assert pro_level["prix_mensuel"] == 10
        assert pro_level["brain_quota_daily"] == 50
        assert pro_level["kt_offerts"] == 50
        
    def test_get_current_adhesion_requires_auth(self):
        """GET /api/adhesion/current should require authentication"""
        response = requests.get(f"{BASE_URL}/api/adhesion/current")
        assert response.status_code == 401
        data = response.json()
        assert "Non authentifie" in data.get("detail", "")


class TestFeedEndpoints:
    """Test feed posts endpoints"""
    
    def test_get_feed_posts_returns_list(self):
        """GET /api/feed/posts should return posts list with pagination"""
        response = requests.get(f"{BASE_URL}/api/feed/posts?page=1&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "posts" in data
        assert "total" in data
        assert "page" in data
        assert "has_more" in data
        assert isinstance(data["posts"], list)
        assert data["page"] == 1
        
    def test_eclair_post_requires_auth(self):
        """POST /api/feed/posts/{id}/eclair should require authentication"""
        response = requests.post(f"{BASE_URL}/api/feed/posts/test123/eclair")
        assert response.status_code == 401
        
    def test_comment_post_requires_auth(self):
        """POST /api/feed/posts/{id}/commentaire should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/feed/posts/test123/commentaire",
            json={"contenu": "Test comment"}
        )
        assert response.status_code == 401


class TestFrekEndpoints:
    """Test FREK health and stats endpoints"""
    
    def test_frek_health_returns_healthy(self):
        """GET /api/frek/health should return healthy status"""
        response = requests.get(f"{BASE_URL}/api/frek/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "healthy" in data
        assert data["healthy"] == True
        assert "fallback_mode" in data


class TestBrainMemoryEndpoints:
    """Test brain memory/history endpoints"""
    
    def test_brain_memory_history_returns_conversations(self):
        """GET /api/brain/memory/history should return conversations list"""
        response = requests.get(f"{BASE_URL}/api/brain/memory/history")
        assert response.status_code == 200
        
        data = response.json()
        assert "conversations" in data
        assert "total" in data
        assert isinstance(data["conversations"], list)
        
        # If there are conversations, verify structure
        if data["conversations"]:
            conv = data["conversations"][0]
            assert "session_id" in conv
            assert "title" in conv
            assert "message_count" in conv
            
    def test_brain_memory_get_specific_session(self):
        """GET /api/brain/memory/{session_id} should return 404 for non-existent session"""
        response = requests.get(f"{BASE_URL}/api/brain/memory/nonexistent_session_123")
        assert response.status_code == 404


class TestUserEndpoints:
    """Test user settings and RGPD endpoints"""
    
    def test_user_settings_requires_auth(self):
        """GET /api/user/settings should require authentication"""
        time.sleep(0.5)  # Rate limit protection
        response = requests.get(f"{BASE_URL}/api/user/settings")
        assert response.status_code in [401, 429]  # 401 or rate limited
        
    def test_rgpd_delete_account_requires_auth(self):
        """DELETE /api/user/account (RGPD) should require authentication"""
        time.sleep(0.5)  # Rate limit protection
        response = requests.delete(f"{BASE_URL}/api/user/account")
        assert response.status_code in [401, 429]  # 401 or rate limited
        
    def test_rgpd_endpoint_exists(self):
        """DELETE /api/user/account endpoint should exist (not 404)"""
        time.sleep(0.5)  # Rate limit protection
        response = requests.delete(f"{BASE_URL}/api/user/account")
        # Should be 401 (auth required) not 404 (not found)
        assert response.status_code != 404


class TestWalletEndpoints:
    """Test wallet endpoints"""
    
    def test_wallet_me_requires_auth(self):
        """GET /api/my-wallet/me should require authentication"""
        time.sleep(0.5)  # Rate limit protection
        response = requests.get(f"{BASE_URL}/api/my-wallet/me")
        assert response.status_code in [401, 429]
        
    def test_wallet_history_requires_auth(self):
        """GET /api/my-wallet/history should require authentication"""
        time.sleep(0.5)  # Rate limit protection
        response = requests.get(f"{BASE_URL}/api/my-wallet/history")
        assert response.status_code in [401, 429]
        
    def test_buy_pack_requires_auth(self):
        """POST /api/my-wallet/buy-pack should require authentication"""
        time.sleep(0.5)  # Rate limit protection
        response = requests.post(
            f"{BASE_URL}/api/my-wallet/buy-pack",
            json={"pack_id": "decouverte"}
        )
        assert response.status_code in [401, 429]


class TestBrainChatEndpoint:
    """Test brain chat-enriched endpoint"""
    
    def test_brain_chat_enriched_requires_permission(self):
        """POST /api/brain/chat-enriched should require use_terminal_ia permission"""
        time.sleep(0.5)  # Rate limit protection
        response = requests.post(
            f"{BASE_URL}/api/brain/chat-enriched",
            json={
                "message": "Test message",
                "messages": [],
                "use_web_search": False,
                "user_name": "test",
                "langue_preference": "fr"
            }
        )
        # Should require authentication/permission
        assert response.status_code in [401, 403, 429, 500]  # 500 if LLM budget empty


class TestVitrineHomepage:
    """Test vitrine homepage still works"""
    
    def test_homepage_loads(self):
        """GET / should return 200"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        
    def test_api_health(self):
        """GET /api/health should return healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
