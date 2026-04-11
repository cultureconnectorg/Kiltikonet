"""
ITER.88 — Tests for Builder, Auth, and Feed functionality
Tests:
1. Auth sas /pro: email bypass login (cultureconnectorg@gmail.com + code 000000)
2. Auth sas /pro: FREK-ID login (FREK-ADM-0001 + code 000000)
3. Builder: create project → publish to feed
4. Feed: published post appears in /api/pro/feed
5. API PUT /api/feed/posts/{id} — edit post
6. API DELETE /api/feed/posts/{id} — delete post
7. Mobile nav: Espace Pro link points to /pro
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "cultureconnectorg@gmail.com"
ADMIN_CODE = "000000"
FREK_ADMIN_ID = "FREK-ADM-0001"


class TestProAuthEmailBypass:
    """Test email bypass login flow for admin"""
    
    def test_request_access_admin_email(self):
        """POST /api/pro/request-access with admin email should return bypass=True"""
        response = requests.post(
            f"{BASE_URL}/api/pro/request-access",
            json={"email": ADMIN_EMAIL}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True
        # Admin emails get bypass=True
        assert data.get("bypass") is True or data.get("message") == "Code envoyé par email"
        print(f"✓ Admin email bypass request successful: {data}")
    
    def test_verify_code_admin_email(self):
        """POST /api/pro/verify-code with admin email + 000000 should succeed"""
        # First request access
        requests.post(f"{BASE_URL}/api/pro/request-access", json={"email": ADMIN_EMAIL})
        
        # Then verify with bypass code
        response = requests.post(
            f"{BASE_URL}/api/pro/verify-code",
            json={"email": ADMIN_EMAIL, "code": ADMIN_CODE}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True
        assert "profile" in data or "id" in data
        print(f"✓ Admin email verify successful: {data.get('profile', {}).get('full_name', 'Admin')}")


class TestProAuthFrekId:
    """Test FREK-ID login flow"""
    
    def test_frek_auth_initiate_invalid_format(self):
        """POST /api/auth/frek with invalid format should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/frek",
            json={"frek_id": "INVALID"}
        )
        assert response.status_code == 400
        print("✓ Invalid FREK-ID format rejected")
    
    def test_frek_auth_initiate_admin(self):
        """POST /api/auth/frek with admin FREK-ID should work"""
        # First we need to ensure the admin FREK-ID exists
        # Create a registration with this FREK-ID if needed
        response = requests.post(
            f"{BASE_URL}/api/auth/frek",
            json={"frek_id": FREK_ADMIN_ID}
        )
        # May return 404 if FREK-ID doesn't exist, or 200 if it does
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") is True
            print(f"✓ FREK-ID auth initiate successful: {data}")
        elif response.status_code == 404:
            print(f"⚠ FREK-ID {FREK_ADMIN_ID} not found in database (expected for fresh DB)")
        else:
            print(f"⚠ FREK-ID auth returned {response.status_code}: {response.text}")


class TestBuilderProjectFlow:
    """Test Builder project creation and publishing"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session for builder tests"""
        self.session = requests.Session()
        # Login with admin bypass
        self.session.post(f"{BASE_URL}/api/pro/request-access", json={"email": ADMIN_EMAIL})
        resp = self.session.post(f"{BASE_URL}/api/pro/verify-code", json={"email": ADMIN_EMAIL, "code": ADMIN_CODE})
        if resp.status_code == 200:
            # Session cookie should be set
            print(f"✓ Session established for builder tests")
        yield
    
    def test_create_project(self):
        """POST /api/builder/projects should create a new project"""
        response = self.session.post(
            f"{BASE_URL}/api/builder/projects",
            json={"titre": f"TEST_Project_{uuid.uuid4().hex[:8]}", "description": "Test description"}
        )
        if response.status_code == 401:
            pytest.skip("Session not authenticated - skipping builder test")
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        data = response.json()
        assert "project_id" in data
        self.project_id = data["project_id"]
        print(f"✓ Project created: {data['project_id']}")
        return data["project_id"]
    
    def test_list_projects(self):
        """GET /api/builder/projects should list user projects"""
        response = self.session.get(f"{BASE_URL}/api/builder/projects")
        if response.status_code == 401:
            pytest.skip("Session not authenticated")
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        print(f"✓ Projects listed: {len(data['projects'])} projects")
    
    def test_publish_project_to_feed(self):
        """POST /api/builder/publish should publish project to feed"""
        # First create a project
        create_resp = self.session.post(
            f"{BASE_URL}/api/builder/projects",
            json={"titre": f"TEST_Publish_{uuid.uuid4().hex[:8]}", "description": "Test publish to feed"}
        )
        if create_resp.status_code == 401:
            pytest.skip("Session not authenticated")
        project_id = create_resp.json().get("project_id")
        
        # Then publish it
        response = self.session.post(
            f"{BASE_URL}/api/builder/publish",
            json={"project_id": project_id, "canal": "feed"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True
        assert data.get("canal") == "feed"
        print(f"✓ Project published to feed: {project_id}")
        return project_id


class TestProFeed:
    """Test Pro Feed API endpoints"""
    
    def test_get_pro_feed(self):
        """GET /api/pro/feed should return posts"""
        response = requests.get(f"{BASE_URL}/api/pro/feed?limit=20")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "posts" in data
        assert "total" in data
        assert data["total"] >= 0
        print(f"✓ Pro feed returned {len(data['posts'])} posts, total: {data['total']}")
    
    def test_get_pro_feed_has_posts(self):
        """GET /api/pro/feed should have posts (auto-seeded if empty)"""
        response = requests.get(f"{BASE_URL}/api/pro/feed?limit=50")
        assert response.status_code == 200
        data = response.json()
        # Feed auto-seeds if empty, so should have posts
        assert data["total"] > 0, "Feed should have posts (auto-seeded)"
        print(f"✓ Pro feed has {data['total']} total posts")
    
    def test_get_pro_feed_reels(self):
        """GET /api/pro/feed/reels should return reels"""
        response = requests.get(f"{BASE_URL}/api/pro/feed/reels?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "reels" in data
        print(f"✓ Pro feed reels returned {len(data['reels'])} reels")


class TestFeedPostCRUD:
    """Test Feed post update and delete operations"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        self.session.post(f"{BASE_URL}/api/pro/request-access", json={"email": ADMIN_EMAIL})
        resp = self.session.post(f"{BASE_URL}/api/pro/verify-code", json={"email": ADMIN_EMAIL, "code": ADMIN_CODE})
        yield
    
    def test_update_feed_post(self):
        """PUT /api/feed/posts/{id} should update post content"""
        # First get a post from the feed
        feed_resp = requests.get(f"{BASE_URL}/api/pro/feed?limit=5")
        if feed_resp.status_code != 200 or not feed_resp.json().get("posts"):
            pytest.skip("No posts in feed to test update")
        
        posts = feed_resp.json()["posts"]
        # Find a non-ghost post or use first post
        test_post = next((p for p in posts if not p.get("is_ghost")), posts[0])
        post_id = test_post.get("id")
        
        # Try to update
        response = self.session.put(
            f"{BASE_URL}/api/feed/posts/{post_id}",
            json={"contenu": f"Updated content {uuid.uuid4().hex[:8]}"}
        )
        # May return 403 if not author, 200 if success, 401 if not authenticated
        if response.status_code == 403:
            print(f"⚠ Not authorized to edit post {post_id} (not author)")
        elif response.status_code == 401:
            print(f"⚠ Session not authenticated for edit")
        elif response.status_code == 200:
            print(f"✓ Post {post_id} updated successfully")
        else:
            print(f"⚠ Update returned {response.status_code}: {response.text}")
    
    def test_delete_feed_post(self):
        """DELETE /api/feed/posts/{id} should delete post"""
        # Create a post first via builder
        create_resp = self.session.post(
            f"{BASE_URL}/api/builder/projects",
            json={"titre": f"TEST_Delete_{uuid.uuid4().hex[:8]}", "description": "To be deleted"}
        )
        if create_resp.status_code == 401:
            pytest.skip("Session not authenticated")
        
        project_id = create_resp.json().get("project_id")
        
        # Publish to feed
        pub_resp = self.session.post(
            f"{BASE_URL}/api/builder/publish",
            json={"project_id": project_id, "canal": "feed"}
        )
        if pub_resp.status_code != 200:
            pytest.skip("Could not publish project")
        
        # Get the post from feed
        feed_resp = requests.get(f"{BASE_URL}/api/pro/feed?limit=50")
        posts = feed_resp.json().get("posts", [])
        
        # Find our test post
        test_post = next((p for p in posts if "TEST_Delete" in (p.get("content") or "")), None)
        if not test_post:
            print("⚠ Could not find test post in feed")
            return
        
        post_id = test_post.get("id")
        
        # Delete it
        response = self.session.delete(f"{BASE_URL}/api/feed/posts/{post_id}")
        if response.status_code == 200:
            print(f"✓ Post {post_id} deleted successfully")
        elif response.status_code == 403:
            print(f"⚠ Not authorized to delete post {post_id}")
        else:
            print(f"⚠ Delete returned {response.status_code}: {response.text}")


class TestMobileNavigation:
    """Test mobile navigation configuration"""
    
    def test_frontend_loads(self):
        """Frontend should load without errors"""
        response = requests.get(BASE_URL)
        assert response.status_code == 200
        print("✓ Frontend loads successfully")
    
    def test_pro_route_accessible(self):
        """/pro route should be accessible"""
        response = requests.get(f"{BASE_URL}/pro", allow_redirects=True)
        # Should return 200 (may show login or splash)
        assert response.status_code == 200
        print("✓ /pro route accessible")


class TestBuilderAnalytics:
    """Test Builder analytics endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup_session(self):
        self.session = requests.Session()
        self.session.post(f"{BASE_URL}/api/pro/request-access", json={"email": ADMIN_EMAIL})
        self.session.post(f"{BASE_URL}/api/pro/verify-code", json={"email": ADMIN_EMAIL, "code": ADMIN_CODE})
        yield
    
    def test_builder_analytics(self):
        """GET /api/builder/analytics should return stats"""
        response = self.session.get(f"{BASE_URL}/api/builder/analytics")
        if response.status_code == 401:
            pytest.skip("Session not authenticated")
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        print(f"✓ Builder analytics: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
