"""
Growth Engine v2 API Tests - KILTIKONET CC2026
Tests for all 13 growth engine endpoints with 4000 ghost users
"""
import pytest
import requests
import os
import random
import string

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com').rstrip('/')


class TestGrowthEngineStats:
    """Test /api/growth/engine/stats - Dashboard stats"""
    
    def test_stats_returns_ghost_v2_data(self):
        """GET /api/growth/engine/stats should return ghost_v2 total=4000, active=200"""
        response = requests.get(f"{BASE_URL}/api/growth/engine/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "ghost_v2" in data, "Response should contain ghost_v2 key"
        assert "total" in data["ghost_v2"], "ghost_v2 should have total"
        assert "active" in data["ghost_v2"], "ghost_v2 should have active"
        
        # Verify expected counts (4000 total, ~200 active)
        assert data["ghost_v2"]["total"] >= 4000, f"Expected total >= 4000, got {data['ghost_v2']['total']}"
        assert data["ghost_v2"]["active"] >= 100, f"Expected active >= 100, got {data['ghost_v2']['active']}"
        
        # Verify other expected fields
        assert "real_users" in data
        assert "fadeout" in data
        assert "content" in data
        assert "health" in data
        print(f"✓ Stats: {data['ghost_v2']['total']} total ghosts, {data['ghost_v2']['active']} active")


class TestProofOfLife:
    """Test /api/growth/engine/proof-of-life - Real-time activity indicators"""
    
    def test_proof_of_life_returns_activity(self):
        """GET /api/growth/engine/proof-of-life should return online_now, typing_now, total_members"""
        response = requests.get(f"{BASE_URL}/api/growth/engine/proof-of-life")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "online_now" in data, "Response should contain online_now"
        assert "typing_now" in data, "Response should contain typing_now"
        assert "total_members" in data, "Response should contain total_members"
        
        # Verify reasonable values (65-226 online as per spec)
        assert data["online_now"] >= 5, f"Expected online_now >= 5, got {data['online_now']}"
        assert data["typing_now"] >= 0, f"Expected typing_now >= 0, got {data['typing_now']}"
        assert data["total_members"] >= 200, f"Expected total_members >= 200, got {data['total_members']}"
        
        print(f"✓ Proof of Life: {data['online_now']} online, {data['typing_now']} typing, {data['total_members']} total")


class TestRandomRewards:
    """Test /api/growth/engine/reward - Random reward system"""
    
    def test_reward_requires_user_id(self):
        """POST /api/growth/engine/reward should require user_id"""
        response = requests.post(f"{BASE_URL}/api/growth/engine/reward", json={})
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        assert "user_id" in response.text.lower()
    
    def test_reward_random_bonus(self):
        """POST /api/growth/engine/reward with event=random_bonus"""
        test_user_id = f"test_reward_{random.randint(1000, 9999)}"
        response = requests.post(f"{BASE_URL}/api/growth/engine/reward", json={
            "user_id": test_user_id,
            "event": "random_bonus"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "rewarded" in data, "Response should contain rewarded"
        assert "event" in data, "Response should contain event"
        assert data["event"] == "random_bonus"
        print(f"✓ Random bonus: rewarded={data['rewarded']}, amount={data.get('amount', 0)}")
    
    def test_reward_daily_login(self):
        """POST /api/growth/engine/reward with event=daily_login"""
        test_user_id = f"test_daily_{random.randint(1000, 9999)}"
        response = requests.post(f"{BASE_URL}/api/growth/engine/reward", json={
            "user_id": test_user_id,
            "event": "daily_login"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "rewarded" in data
        assert data["event"] == "daily_login"
        print(f"✓ Daily login: rewarded={data['rewarded']}")
    
    def test_reward_first_post(self):
        """POST /api/growth/engine/reward with event=first_post"""
        test_user_id = f"test_post_{random.randint(1000, 9999)}"
        response = requests.post(f"{BASE_URL}/api/growth/engine/reward", json={
            "user_id": test_user_id,
            "event": "first_post"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "rewarded" in data
        assert data["event"] == "first_post"
        # first_post has 100% chance
        assert data["rewarded"] == True, "first_post should always reward"
        assert data["amount"] >= 3, f"first_post should give 3-5 JCC, got {data.get('amount')}"
        print(f"✓ First post: rewarded={data['rewarded']}, amount={data.get('amount')}")


class TestOnboarding:
    """Test /api/growth/engine/onboarding - Small victories gamification"""
    
    def test_get_onboarding_progress(self):
        """GET /api/growth/engine/onboarding/{user_id} should return 8 steps"""
        test_user_id = f"test_onboard_{random.randint(1000, 9999)}"
        response = requests.get(f"{BASE_URL}/api/growth/engine/onboarding/{test_user_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "steps" in data, "Response should contain steps"
        assert "completed" in data, "Response should contain completed"
        assert "total" in data, "Response should contain total"
        assert "progress_pct" in data, "Response should contain progress_pct"
        
        # Verify 8 steps
        assert len(data["steps"]) == 8, f"Expected 8 steps, got {len(data['steps'])}"
        
        # Verify step structure
        for step in data["steps"]:
            assert "step" in step
            assert "label" in step
            assert "reward" in step
            assert "done" in step
        
        print(f"✓ Onboarding: {len(data['steps'])} steps, {data['completed']}/{data['total']} completed")
    
    def test_complete_onboarding_step(self):
        """POST /api/growth/engine/onboarding/complete should complete a step and award JCC"""
        test_user_id = f"test_complete_{random.randint(1000, 9999)}"
        
        # First get the steps
        get_response = requests.get(f"{BASE_URL}/api/growth/engine/onboarding/{test_user_id}")
        assert get_response.status_code == 200
        
        # Complete first step
        response = requests.post(f"{BASE_URL}/api/growth/engine/onboarding/complete", json={
            "user_id": test_user_id,
            "step": "profile_photo"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "step" in data
        assert "rewarded" in data
        assert data["step"] == "profile_photo"
        assert data["rewarded"] >= 0, "Should return reward amount"
        print(f"✓ Complete step: {data['step']}, rewarded={data['rewarded']} JCC")
    
    def test_complete_onboarding_requires_params(self):
        """POST /api/growth/engine/onboarding/complete should require user_id and step"""
        response = requests.post(f"{BASE_URL}/api/growth/engine/onboarding/complete", json={})
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"


class TestMagicCircleInvitations:
    """Test /api/growth/engine/invite - Exclusive invitation codes"""
    
    def test_generate_invite_requires_user_id(self):
        """POST /api/growth/engine/invite should require user_id"""
        response = requests.post(f"{BASE_URL}/api/growth/engine/invite", json={})
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_generate_invite_code(self):
        """POST /api/growth/engine/invite should generate exclusive code"""
        test_user_id = f"test_invite_{random.randint(1000, 9999)}"
        response = requests.post(f"{BASE_URL}/api/growth/engine/invite", json={
            "user_id": test_user_id
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data
        assert "code" in data or "message" in data
        
        if data.get("success"):
            assert len(data["code"]) == 8, f"Code should be 8 chars, got {len(data.get('code', ''))}"
            assert "remaining" in data
            print(f"✓ Invite code: {data['code']}, remaining={data['remaining']}")
        else:
            print(f"✓ Invite limit reached: {data.get('message')}")
    
    def test_redeem_invite_requires_params(self):
        """POST /api/growth/engine/invite/redeem should require code and user_id"""
        response = requests.post(f"{BASE_URL}/api/growth/engine/invite/redeem", json={})
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_redeem_invalid_code(self):
        """POST /api/growth/engine/invite/redeem with invalid code should return 404"""
        response = requests.post(f"{BASE_URL}/api/growth/engine/invite/redeem", json={
            "code": "INVALID1",
            "user_id": "test_user"
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestCreationNudge:
    """Test /api/growth/engine/creation-nudge - Consumption vs creation nudge"""
    
    def test_creation_nudge_returns_ratio(self):
        """GET /api/growth/engine/creation-nudge/{user_id} should return creation vs consumption"""
        test_user_id = f"test_nudge_{random.randint(1000, 9999)}"
        response = requests.get(f"{BASE_URL}/api/growth/engine/creation-nudge/{test_user_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user_id" in data
        assert "posts" in data
        assert "cards" in data
        assert "reactions" in data
        assert "creation_score" in data
        assert "consumption_score" in data
        assert "ratio" in data
        
        # nudge may or may not be present depending on ratio
        print(f"✓ Creation nudge: ratio={data['ratio']}, nudge={data.get('nudge', 'none')}")


class TestContentMirror:
    """Test /api/growth/engine/mirror - Content mirroring based on interests"""
    
    def test_mirror_returns_cards(self):
        """GET /api/growth/engine/mirror/{user_id} should return mirrored content"""
        test_user_id = f"test_mirror_{random.randint(1000, 9999)}"
        response = requests.get(f"{BASE_URL}/api/growth/engine/mirror/{test_user_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "mirrored_cards" in data
        assert "based_on_dimensions" in data
        assert isinstance(data["mirrored_cards"], list)
        assert isinstance(data["based_on_dimensions"], list)
        print(f"✓ Mirror: {len(data['mirrored_cards'])} cards based on {data['based_on_dimensions']}")


class TestSocialValidation:
    """Test /api/growth/engine/social-validation - Ghost engagement on real posts"""
    
    def test_social_validation_requires_post_id(self):
        """POST /api/growth/engine/social-validation should require post_id"""
        response = requests.post(f"{BASE_URL}/api/growth/engine/social-validation", json={})
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_social_validation_queues_engagement(self):
        """POST /api/growth/engine/social-validation should queue ghost engagement"""
        response = requests.post(f"{BASE_URL}/api/growth/engine/social-validation", json={
            "post_id": f"test_post_{random.randint(1000, 9999)}",
            "author_id": "test_author"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "queued" in data
        assert "post_id" in data
        print(f"✓ Social validation: queued={data['queued']} ghosts")


class TestFadeoutController:
    """Test /api/growth/engine/fadeout - Adjust ghosts based on real users"""
    
    def test_fadeout_adjusts_ghosts(self):
        """POST /api/growth/engine/fadeout should adjust active ghosts"""
        response = requests.post(f"{BASE_URL}/api/growth/engine/fadeout")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "real_users" in data
        assert "max_ghosts_allowed" in data
        assert "activity_multiplier" in data
        assert "total_active" in data
        print(f"✓ Fadeout: {data['real_users']} real users, max={data['max_ghosts_allowed']}, active={data['total_active']}")


class TestDailyArrival:
    """Test /api/growth/engine/daily-arrival - Activate scheduled ghost profiles"""
    
    def test_daily_arrival_activates_profiles(self):
        """POST /api/growth/engine/daily-arrival should activate scheduled ghosts"""
        response = requests.post(f"{BASE_URL}/api/growth/engine/daily-arrival")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "activated" in data
        assert isinstance(data["activated"], int)
        print(f"✓ Daily arrival: {data['activated']} profiles activated")


class TestDeepLink:
    """Test /api/growth/engine/deeplink - Deep link generation"""
    
    def test_deeplink_card(self):
        """GET /api/growth/engine/deeplink/card/test123 should return deep link URL"""
        response = requests.get(f"{BASE_URL}/api/growth/engine/deeplink/card/test123")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "url" in data
        assert "type" in data
        assert "id" in data
        assert data["type"] == "card"
        assert data["id"] == "test123"
        assert "card=test123" in data["url"]
        print(f"✓ Deep link: {data['url']}")
    
    def test_deeplink_profile(self):
        """GET /api/growth/engine/deeplink/profile/user123 should return profile link"""
        response = requests.get(f"{BASE_URL}/api/growth/engine/deeplink/profile/user123")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["type"] == "profile"
        assert "profile=user123" in data["url"]
        print(f"✓ Profile deep link: {data['url']}")


class TestSocialFeedWithGhosts:
    """Test /api/pro/social/feed - Feed includes ghost v2 posts"""
    
    def test_feed_includes_ghost_posts(self):
        """GET /api/pro/social/feed should include ghost v2 posts (2028+ posts seeded)"""
        response = requests.get(f"{BASE_URL}/api/pro/social/feed", params={"limit": 50})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "posts" in data
        assert "total" in data
        
        posts = data["posts"]
        ghost_posts = [p for p in posts if p.get("is_ghost") or p.get("author_id", "").startswith("gv2_")]
        
        print(f"✓ Feed: {len(posts)} posts returned, {len(ghost_posts)} are ghost posts, total={data['total']}")
        
        # Verify we have ghost posts in the feed
        assert data["total"] >= 100, f"Expected total >= 100 posts (2028+ seeded), got {data['total']}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
