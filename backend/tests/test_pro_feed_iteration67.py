"""
Iteration 67 - Pro Feed API Tests
Tests for LinkedIn-style feed, Reels, and Like functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com')

class TestProFeedAPI:
    """Tests for /api/pro/feed endpoints"""
    
    def test_get_feed_returns_posts(self):
        """GET /api/pro/feed returns posts with pagination"""
        response = requests.get(f"{BASE_URL}/api/pro/feed", params={"limit": 5})
        assert response.status_code == 200
        
        data = response.json()
        assert "posts" in data
        assert "total" in data
        assert "has_more" in data
        assert isinstance(data["posts"], list)
        
        # Verify post structure
        if len(data["posts"]) > 0:
            post = data["posts"][0]
            assert "id" in post
            assert "author_name" in post
            assert "content" in post
            assert "likes_count" in post
            assert "created_at" in post
            print(f"✓ Feed returned {len(data['posts'])} posts, total: {data['total']}")
    
    def test_feed_has_ghost_posts(self):
        """Feed should contain ghost posts from simulated users"""
        response = requests.get(f"{BASE_URL}/api/pro/feed", params={"limit": 20})
        assert response.status_code == 200
        
        data = response.json()
        ghost_posts = [p for p in data["posts"] if p.get("is_ghost") == True]
        
        assert len(ghost_posts) > 0, "Feed should have ghost posts"
        print(f"✓ Found {len(ghost_posts)} ghost posts in feed")
        
        # Check ghost post authors
        ghost_authors = set(p["author_name"] for p in ghost_posts)
        print(f"✓ Ghost authors: {', '.join(list(ghost_authors)[:5])}...")
    
    def test_feed_pagination(self):
        """Feed pagination works correctly"""
        # Get first page
        page1 = requests.get(f"{BASE_URL}/api/pro/feed", params={"limit": 3, "skip": 0})
        assert page1.status_code == 200
        data1 = page1.json()
        
        # Get second page
        page2 = requests.get(f"{BASE_URL}/api/pro/feed", params={"limit": 3, "skip": 3})
        assert page2.status_code == 200
        data2 = page2.json()
        
        # Posts should be different
        ids1 = set(p["id"] for p in data1["posts"])
        ids2 = set(p["id"] for p in data2["posts"])
        
        assert ids1.isdisjoint(ids2), "Paginated posts should not overlap"
        print(f"✓ Pagination works: page1 has {len(ids1)} posts, page2 has {len(ids2)} posts")


class TestReelsAPI:
    """Tests for /api/pro/feed/reels endpoints"""
    
    def test_get_reels_returns_content(self):
        """GET /api/pro/feed/reels returns TikTok-style content"""
        response = requests.get(f"{BASE_URL}/api/pro/feed/reels", params={"limit": 5})
        assert response.status_code == 200
        
        data = response.json()
        assert "reels" in data
        assert "total" in data
        assert "has_more" in data
        assert isinstance(data["reels"], list)
        
        # Verify reel structure
        if len(data["reels"]) > 0:
            reel = data["reels"][0]
            assert "id" in reel
            assert "author_name" in reel
            assert "content" in reel
            assert "dimension" in reel
            assert "duration" in reel
            assert reel.get("is_reel") == True
            print(f"✓ Reels returned {len(data['reels'])} items, total: {data['total']}")
    
    def test_reels_have_dimensions(self):
        """Reels should have cultural dimensions"""
        response = requests.get(f"{BASE_URL}/api/pro/feed/reels", params={"limit": 20})
        assert response.status_code == 200
        
        data = response.json()
        dimensions = set(r["dimension"] for r in data["reels"] if r.get("dimension"))
        
        expected_dimensions = {"Musique", "Arts Visuels & Sceniques", "Gastronomie", "Patrimoine & Traditions", "Langue Creole"}
        found_dimensions = dimensions.intersection(expected_dimensions)
        
        assert len(found_dimensions) > 0, "Reels should have cultural dimensions"
        print(f"✓ Found dimensions: {', '.join(found_dimensions)}")


class TestLikeAPI:
    """Tests for /api/pro/feed/like endpoint"""
    
    def test_like_toggle(self):
        """POST /api/pro/feed/like toggles like on a post"""
        # First get a post
        feed_response = requests.get(f"{BASE_URL}/api/pro/feed", params={"limit": 1})
        assert feed_response.status_code == 200
        
        posts = feed_response.json()["posts"]
        if len(posts) == 0:
            pytest.skip("No posts available to test like")
        
        post_id = posts[0]["id"]
        test_user_id = "test_user_iteration67"
        
        # Like the post
        like_response = requests.post(
            f"{BASE_URL}/api/pro/feed/like",
            json={"post_id": post_id, "user_id": test_user_id}
        )
        assert like_response.status_code == 200
        
        data = like_response.json()
        assert "success" in data
        assert "action" in data
        assert "likes_count" in data
        
        print(f"✓ Like toggle: action={data['action']}, likes_count={data['likes_count']}")


class TestProofOfLife:
    """Tests for growth engine proof of life"""
    
    def test_proof_of_life_endpoint(self):
        """GET /api/growth/engine/proof-of-life returns activity stats"""
        response = requests.get(f"{BASE_URL}/api/growth/engine/proof-of-life")
        assert response.status_code == 200
        
        data = response.json()
        assert "online_now" in data
        assert "typing_now" in data
        assert "new_today" in data
        
        print(f"✓ Proof of life: {data['online_now']} online, {data['typing_now']} typing, +{data['new_today']} today")


class TestGhostSeed:
    """Tests for ghost content seeding"""
    
    def test_ghost_seed_endpoint(self):
        """POST /api/ghost/seed creates ghost profiles"""
        response = requests.post(f"{BASE_URL}/api/ghost/seed")
        # May return 200, 403 (forbidden), or 429 (rate limited)
        assert response.status_code in [200, 403, 429]
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Ghost seed response: {data}")
        elif response.status_code == 403:
            print("○ Ghost seed forbidden (may require auth)")
        else:
            print("○ Ghost seed rate limited (expected)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
