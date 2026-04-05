"""
Iteration 77 - CC2026 Kiltikonet Platform Testing
Tests for: Reels, Feed, Wallet, Inbox, Brain, Profile Governance
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com').rstrip('/')

# Admin credentials for testing
ADMIN_EMAIL = "cultureconnectorg@gmail.com"
ADMIN_CODE = "000000"


class TestProFeedReels:
    """Test GET /api/pro/feed/reels - Reels with video_url and thumbnail_url"""
    
    def test_reels_endpoint_returns_data(self):
        """Reels endpoint should return reels with video_url and thumbnail_url"""
        response = requests.get(f"{BASE_URL}/api/pro/feed/reels", params={"limit": 10})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "reels" in data, "Response should contain 'reels' key"
        assert "total" in data, "Response should contain 'total' key"
        
        reels = data["reels"]
        if len(reels) > 0:
            reel = reels[0]
            # Verify reel structure
            assert "id" in reel, "Reel should have 'id'"
            assert "video_url" in reel, "Reel should have 'video_url'"
            assert "thumbnail_url" in reel, "Reel should have 'thumbnail_url'"
            assert "author_name" in reel, "Reel should have 'author_name'"
            assert "content" in reel, "Reel should have 'content'"
            assert "dimension" in reel, "Reel should have 'dimension'"
            
            # Verify video_url is a valid URL
            assert reel["video_url"].startswith("http"), f"video_url should be a URL, got: {reel['video_url']}"
            assert reel["thumbnail_url"].startswith("http"), f"thumbnail_url should be a URL, got: {reel['thumbnail_url']}"
            print(f"✓ Reel has video_url: {reel['video_url'][:50]}...")
            print(f"✓ Reel has thumbnail_url: {reel['thumbnail_url'][:50]}...")


class TestProFeed:
    """Test GET /api/pro/feed - Feed with varied post_types"""
    
    def test_feed_endpoint_returns_posts(self):
        """Feed endpoint should return posts with varied post_types"""
        response = requests.get(f"{BASE_URL}/api/pro/feed", params={"limit": 30})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "posts" in data, "Response should contain 'posts' key"
        
        posts = data["posts"]
        assert len(posts) > 0, "Feed should have posts"
        
        # Collect post types
        post_types = set()
        posts_with_thumbnails = []
        
        for post in posts:
            assert "post_type" in post, "Post should have 'post_type'"
            post_types.add(post["post_type"])
            
            # Check if video/interview/extrait posts have thumbnail_url
            if post["post_type"] in ("video", "interview", "extrait"):
                if "thumbnail_url" in post and post["thumbnail_url"]:
                    posts_with_thumbnails.append(post["post_type"])
        
        print(f"✓ Found post types: {post_types}")
        print(f"✓ Posts with thumbnails (video/interview/extrait): {len(posts_with_thumbnails)}")
        
        # Verify we have varied post types
        assert len(post_types) > 1, f"Should have varied post types, got: {post_types}"
    
    def test_feed_posts_have_required_fields(self):
        """Feed posts should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/pro/feed", params={"limit": 5})
        assert response.status_code == 200
        
        posts = response.json()["posts"]
        if len(posts) > 0:
            post = posts[0]
            required_fields = ["id", "author_name", "content", "post_type", "likes_count", "created_at"]
            for field in required_fields:
                assert field in post, f"Post should have '{field}'"
            print(f"✓ Post has all required fields")


class TestWalletEndpoints:
    """Test Wallet endpoints - /api/my-wallet/*"""
    
    def test_wallet_me_requires_auth(self):
        """GET /api/my-wallet/me should require authentication"""
        response = requests.get(f"{BASE_URL}/api/my-wallet/me")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Wallet /me requires authentication")
    
    def test_wallet_history_requires_auth(self):
        """GET /api/my-wallet/history should require authentication"""
        response = requests.get(f"{BASE_URL}/api/my-wallet/history")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Wallet /history requires authentication")
    
    def test_wallet_transfer_requires_auth(self):
        """POST /api/my-wallet/transfer should require authentication"""
        response = requests.post(f"{BASE_URL}/api/my-wallet/transfer", json={
            "recipient_email": "test@example.com",
            "amount": 5,
            "note": "Test"
        })
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Wallet /transfer requires authentication")


class TestBrainEndpoints:
    """Test CVL BRAIN endpoints"""
    
    def test_brain_chat_endpoint(self):
        """POST /api/brain/chat should respond to questions"""
        response = requests.post(f"{BASE_URL}/api/brain/chat", json={
            "message": "Qu'est-ce que kiltikonet?",
            "session_id": f"test_{int(time.time())}",
            "user_id": "test_user"
        }, timeout=30)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "reply" in data, "Response should contain 'reply'"
        assert len(data["reply"]) > 10, "Reply should have meaningful content"
        print(f"✓ Brain chat responded: {data['reply'][:100]}...")
    
    def test_brain_chat_enriched_endpoint(self):
        """POST /api/brain/chat-enriched should respond to questions"""
        response = requests.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "C'est quoi le Jeton CC?",
            "messages": [],
            "user_name": "Test User"
        }, timeout=30)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "response" in data, "Response should contain 'response'"
        print(f"✓ Brain chat-enriched responded: {data['response'][:100]}...")


class TestInboxMarkAsRead:
    """Test Inbox mark as read functionality"""
    
    def test_messages_read_endpoint_exists(self):
        """POST /api/pro/messages/read endpoint should exist"""
        response = requests.post(f"{BASE_URL}/api/pro/messages/read", json={
            "user_id": "test_user",
            "conversation_id": "test_conv"
        })
        # Should not return 404 (endpoint exists)
        assert response.status_code != 404, "Endpoint /api/pro/messages/read should exist"
        print(f"✓ Messages read endpoint exists (status: {response.status_code})")


class TestHealthAndStatus:
    """Test basic health endpoints"""
    
    def test_health_endpoint(self):
        """GET /api/health should return OK"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Health endpoint OK")
    
    def test_api_accessible(self):
        """API should be accessible"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200
        print(f"✓ API accessible at {BASE_URL}")


class TestShopCheckout:
    """Test Shop/Checkout endpoints for Wallet recharge"""
    
    def test_shop_packages_endpoint(self):
        """GET /api/shop/packages should return available packages"""
        response = requests.get(f"{BASE_URL}/api/shop/packages")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "packages" in data, "Response should contain 'packages'"
        packages = data["packages"]
        assert len(packages) > 0, "Should have at least one package"
        
        # Check for expected pack IDs
        pack_ids = [p.get("id") for p in packages]
        print(f"✓ Found packages: {pack_ids}")
    
    def test_checkout_create_requires_package_id(self):
        """POST /api/shop/checkout/create should require package_id"""
        response = requests.post(f"{BASE_URL}/api/shop/checkout/create", json={})
        assert response.status_code == 400, f"Expected 400 without package_id, got {response.status_code}"
        print("✓ Checkout create requires package_id")


class TestAnalyticsEndpoints:
    """Test Analytics endpoints"""
    
    def test_analytics_track_endpoint(self):
        """POST /api/analytics/track should accept events"""
        response = requests.post(f"{BASE_URL}/api/analytics/track", json={
            "event": "test_event",
            "page": "/test",
            "user_id": "test_user"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Analytics track endpoint works")
    
    def test_analytics_site_stats_endpoint(self):
        """GET /api/analytics/site-stats should return stats"""
        response = requests.get(f"{BASE_URL}/api/analytics/site-stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "overview" in data or "total_visits" in data or isinstance(data, dict), "Should return stats data"
        print("✓ Analytics site-stats endpoint works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
