"""
Ghost Population System Tests — CC2026 Espace Pro
Tests for: seed, admin stats, admin profiles, onboarding, jetons, auto-comment, retirement
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com').rstrip('/')


class TestGhostSeed:
    """Test POST /api/ghost/seed - Creates 20 ghost profiles and 12+ seed posts"""
    
    def test_seed_ghost_profiles(self):
        """Seed endpoint should create 20 ghost profiles and posts"""
        response = requests.post(f"{BASE_URL}/api/ghost/seed")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, f"Expected success=True, got {data}"
        
        # Either seeded new or already exists
        if data.get("seeded"):
            assert data.get("profiles_created") == 20, f"Expected 20 profiles, got {data.get('profiles_created')}"
            assert data.get("posts_created", 0) >= 12, f"Expected 12+ posts, got {data.get('posts_created')}"
            print(f"✅ Seeded {data.get('profiles_created')} profiles and {data.get('posts_created')} posts")
        else:
            # Already seeded - idempotent
            assert "déjà présents" in data.get("message", ""), f"Expected idempotent message, got {data}"
            print(f"✅ Ghost profiles already seeded: {data.get('message')}")


class TestGhostAdminStats:
    """Test GET /api/ghost/admin/stats - Returns ghost population metrics"""
    
    def test_admin_stats_returns_metrics(self):
        """Admin stats should return correct ghost population metrics"""
        response = requests.get(f"{BASE_URL}/api/ghost/admin/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify required fields
        required_fields = [
            "total_ghosts", "active_ghosts", "retiring_ghosts", "retired_ghosts",
            "ghost_posts_total", "real_users", "target_ghosts", "system_active"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Verify values are reasonable
        assert data["total_ghosts"] >= 0, "total_ghosts should be >= 0"
        assert data["active_ghosts"] >= 0, "active_ghosts should be >= 0"
        assert data["target_ghosts"] >= 0, "target_ghosts should be >= 0"
        assert isinstance(data["system_active"], bool), "system_active should be boolean"
        
        print(f"✅ Admin stats: {data['total_ghosts']} total, {data['active_ghosts']} active, {data['ghost_posts_total']} posts")


class TestGhostAdminProfiles:
    """Test GET /api/ghost/admin/profiles - Lists all 20 ghost profiles"""
    
    def test_admin_profiles_lists_all(self):
        """Admin profiles should list all ghost profiles"""
        # First ensure ghosts are seeded
        requests.post(f"{BASE_URL}/api/ghost/seed")
        
        response = requests.get(f"{BASE_URL}/api/ghost/admin/profiles")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "profiles" in data, "Response should contain 'profiles' key"
        
        profiles = data["profiles"]
        assert len(profiles) >= 20, f"Expected at least 20 profiles, got {len(profiles)}"
        
        # Verify profile structure
        if profiles:
            profile = profiles[0]
            required_fields = ["id", "full_name", "profile_type", "country", "bio", "frek_id"]
            for field in required_fields:
                assert field in profile, f"Profile missing field: {field}"
        
        print(f"✅ Admin profiles: {len(profiles)} ghost profiles listed")


class TestGhostOnboarding:
    """Test POST /api/ghost/onboarding/complete - Creates profile, generates FREK-ID, awards 10 Jetons"""
    
    def test_onboarding_complete_new_user(self):
        """Onboarding should create profile, generate FREK-ID, award 10 Jetons"""
        test_user_id = f"test_onboarding_{uuid.uuid4().hex[:8]}"
        
        payload = {
            "user_id": test_user_id,
            "cultural_practice": "Musique",
            "genre_style": "Zouk fusion",
            "cc2026_goal": "network"
        }
        
        response = requests.post(f"{BASE_URL}/api/ghost/onboarding/complete", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, f"Expected success=True, got {data}"
        
        # Verify FREK-ID generated
        assert "frek_id" in data, "Response should contain frek_id"
        assert data["frek_id"].startswith("FREK-"), f"FREK-ID should start with 'FREK-', got {data['frek_id']}"
        
        # Verify Jetons awarded
        assert data.get("jetons_awarded") == 10, f"Expected 10 jetons, got {data.get('jetons_awarded')}"
        
        # Verify cultural impact score
        assert "cultural_impact_score" in data, "Response should contain cultural_impact_score"
        assert 45 <= data["cultural_impact_score"] <= 75, f"Score should be 45-75, got {data['cultural_impact_score']}"
        
        # Verify CVL BRAIN analysis
        assert "brain_analysis" in data, "Response should contain brain_analysis"
        assert len(data["brain_analysis"]) > 10, "brain_analysis should have content"
        
        print(f"✅ Onboarding complete: FREK-ID={data['frek_id']}, Jetons={data['jetons_awarded']}, Score={data['cultural_impact_score']}")


class TestGhostJetons:
    """Test GET /api/ghost/jetons/{user_id} - Returns jetons balance"""
    
    def test_jetons_balance_existing_user(self):
        """Should return jetons balance for existing user"""
        # First complete onboarding to create a user with jetons
        test_user_id = f"test_jetons_{uuid.uuid4().hex[:8]}"
        
        onboarding_payload = {
            "user_id": test_user_id,
            "cultural_practice": "Danse",
            "genre_style": "Bèlè",
            "cc2026_goal": "showcase"
        }
        requests.post(f"{BASE_URL}/api/ghost/onboarding/complete", json=onboarding_payload)
        
        # Now check jetons balance
        response = requests.get(f"{BASE_URL}/api/ghost/jetons/{test_user_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "jetons_solde" in data, "Response should contain jetons_solde"
        assert data["jetons_solde"] >= 10, f"Expected at least 10 jetons, got {data['jetons_solde']}"
        
        print(f"✅ Jetons balance: {data['jetons_solde']} JCC, FREK-ID={data.get('frek_id')}")
    
    def test_jetons_balance_nonexistent_user(self):
        """Should return 0 jetons for nonexistent user"""
        response = requests.get(f"{BASE_URL}/api/ghost/jetons/nonexistent_user_xyz")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("jetons_solde") == 0, f"Expected 0 jetons for nonexistent user, got {data}"
        assert data.get("frek_id") is None, f"Expected None frek_id for nonexistent user, got {data}"
        
        print("✅ Nonexistent user returns 0 jetons")


class TestGhostAutoComment:
    """Test POST /api/ghost/engine/auto-comment - Triggers ghost comment on a post"""
    
    def test_auto_comment_requires_post_id(self):
        """Auto-comment should require post_id"""
        response = requests.post(f"{BASE_URL}/api/ghost/engine/auto-comment", json={})
        assert response.status_code == 400, f"Expected 400 for missing post_id, got {response.status_code}"
        
        print("✅ Auto-comment correctly requires post_id")
    
    def test_auto_comment_on_nonexistent_post(self):
        """Auto-comment on nonexistent post should return success=False"""
        response = requests.post(
            f"{BASE_URL}/api/ghost/engine/auto-comment",
            json={"post_id": "nonexistent_post_xyz"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is False, f"Expected success=False for nonexistent post, got {data}"
        
        print("✅ Auto-comment on nonexistent post returns success=False")


class TestGhostRetirement:
    """Test POST /api/ghost/engine/check-retirement - Checks retirement thresholds"""
    
    def test_check_retirement(self):
        """Check retirement should return retirement status"""
        response = requests.post(f"{BASE_URL}/api/ghost/engine/check-retirement")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify required fields
        required_fields = ["real_users", "target_ghosts", "active_before"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        assert data["real_users"] >= 0, "real_users should be >= 0"
        assert data["target_ghosts"] >= 0, "target_ghosts should be >= 0"
        
        print(f"✅ Retirement check: {data['real_users']} real users, target={data['target_ghosts']} ghosts")


class TestProSocialFeed:
    """Test GET /api/pro/social/feed - Includes ghost posts mixed with real posts"""
    
    def test_feed_includes_ghost_posts(self):
        """Feed should include ghost posts"""
        # Ensure ghosts are seeded
        requests.post(f"{BASE_URL}/api/ghost/seed")
        
        response = requests.get(f"{BASE_URL}/api/pro/social/feed")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "posts" in data, "Response should contain 'posts' key"
        
        posts = data["posts"]
        ghost_posts = [p for p in posts if p.get("is_ghost") or p.get("author_id", "").startswith("ghost_")]
        
        # Should have some ghost posts
        assert len(ghost_posts) > 0, f"Expected ghost posts in feed, got {len(ghost_posts)}"
        
        # Verify ghost post structure
        if ghost_posts:
            post = ghost_posts[0]
            assert "content" in post, "Post should have content"
            assert "author_name" in post, "Post should have author_name"
            # Check for French/Creole content
            content = post.get("content", "")
            assert len(content) > 20, f"Ghost post content should be substantial, got: {content[:50]}"
        
        print(f"✅ Feed contains {len(ghost_posts)} ghost posts out of {len(posts)} total")


class TestProSocialDirectory:
    """Test GET /api/pro/social/directory - Includes active ghost profiles"""
    
    def test_directory_includes_ghosts(self):
        """Directory should include active ghost profiles"""
        # Ensure ghosts are seeded
        requests.post(f"{BASE_URL}/api/ghost/seed")
        
        response = requests.get(f"{BASE_URL}/api/pro/social/directory")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "professionals" in data, "Response should contain 'professionals' key"
        
        professionals = data["professionals"]
        ghost_profiles = [p for p in professionals if p.get("id", "").startswith("ghost_")]
        
        # Should have ghost profiles in directory
        assert len(ghost_profiles) > 0, f"Expected ghost profiles in directory, got {len(ghost_profiles)}"
        
        # Verify ghost profile structure
        if ghost_profiles:
            profile = ghost_profiles[0]
            assert "full_name" in profile, "Profile should have full_name"
            assert "country" in profile, "Profile should have country"
        
        print(f"✅ Directory contains {len(ghost_profiles)} ghost profiles out of {len(professionals)} total")


class TestProSpaceLogin:
    """Test Espace Pro login with bypass email"""
    
    def test_bypass_login_request_access(self):
        """Bypass email should work for request-access"""
        response = requests.post(
            f"{BASE_URL}/api/pro/request-access",
            json={"email": "cultureconnectorg@gmail.com"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, f"Expected success=True, got {data}"
        assert data.get("bypass") is True, f"Expected bypass=True for admin email, got {data}"
        
        print("✅ Bypass login request-access works")
    
    def test_bypass_login_verify_code(self):
        """Bypass email with code 000000 should verify"""
        response = requests.post(
            f"{BASE_URL}/api/pro/verify-code",
            json={"email": "cultureconnectorg@gmail.com", "code": "000000"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, f"Expected success=True, got {data}"
        assert "profile" in data, "Response should contain profile"
        
        profile = data["profile"]
        assert "id" in profile, "Profile should have id"
        
        print(f"✅ Bypass login verify-code works, profile_id={profile.get('id')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
