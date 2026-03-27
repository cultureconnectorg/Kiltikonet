"""
Iteration 37 - Test des 4 Chantiers CC2026:
1. hCaptcha intégré (déjà testé en iteration 36)
2. Espace Pro LinkedIn Culturel avec fil d'actualité et recommandations
3. Dashboard Agents IA avec 10 agents cartographiés
4. Smart Engine CVLN unifié avec 8 flux de données

Tests pour les endpoints:
- Smart Engine: /api/smart-engine/* (8 streams + dashboard)
- AI Agents: /api/ai-agents/* (list, status, toggle, logs)
- Pro Social: /api/pro/social/* (feed, posts, directory, recommendations)
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ═══════════════════════════════════════════════════════════════
# SMART ENGINE CVLN - 8 Flux de données
# ═══════════════════════════════════════════════════════════════

class TestSmartEngineDashboard:
    """Tests for Smart Engine CVLN unified dashboard"""
    
    def test_dashboard_returns_8_streams(self):
        """GET /api/smart-engine/dashboard returns 8 streams"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/dashboard")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "streams" in data, "Response should contain 'streams' key"
        assert len(data["streams"]) == 8, f"Expected 8 streams, got {len(data['streams'])}"
        
        # Verify all stream IDs
        stream_ids = [s["id"] for s in data["streams"]]
        expected_ids = ["predictive", "mgraph", "live-audience", "creation-origin", 
                       "cultural-diffusion", "conversion", "verified-identity", "creative-network"]
        for expected_id in expected_ids:
            assert expected_id in stream_ids, f"Missing stream: {expected_id}"
        
        # Verify overview metrics
        assert "overview" in data, "Response should contain 'overview' key"
        assert "total_badges" in data["overview"]
        assert "generated_at" in data
        print(f"✓ Dashboard returns 8 streams with overview metrics")

    def test_predictive_stream(self):
        """GET /api/smart-engine/predictive returns stream data"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/predictive")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("stream") == "predictive"
        assert "daily_registrations" in data
        assert "registrations_by_type" in data
        assert "current_total" in data
        assert "projected_total_at_event" in data
        assert "days_remaining" in data
        print(f"✓ Predictive stream: {data['current_total']} total, projection: {data['projected_total_at_event']}")

    def test_conversion_stream(self):
        """GET /api/smart-engine/conversion returns funnel data"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/conversion")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("stream") == "conversion"
        assert "funnel" in data
        assert "rates" in data
        assert "revenue" in data
        
        funnel = data["funnel"]
        assert "visitors" in funnel
        assert "inscriptions" in funnel
        print(f"✓ Conversion funnel: {funnel.get('visitors', 0)} visitors → {funnel.get('inscriptions', 0)} inscriptions")

    def test_verified_identity_stream(self):
        """GET /api/smart-engine/verified-identity returns badge stats"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/verified-identity")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("stream") == "verified-identity"
        assert "total_badges" in data
        assert "by_type" in data
        assert "nfc" in data
        assert "recent_badges" in data
        print(f"✓ Verified Identity: {data['total_badges']} total badges")

    def test_live_audience_stream(self):
        """GET /api/smart-engine/live-audience returns active sessions"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/live-audience")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("stream") == "live-audience"
        assert "active_now" in data
        assert "sessions_last_hour" in data
        assert "current_pages" in data
        print(f"✓ Live Audience: {data['active_now']} active now, {data['sessions_last_hour']} last hour")

    def test_creation_origin_stream(self):
        """GET /api/smart-engine/creation-origin returns country data"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/creation-origin")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("stream") == "creation-origin"
        assert "countries" in data
        assert "profile_types" in data
        assert "languages" in data
        print(f"✓ Creation Origin: {len(data['countries'])} countries, {len(data['profile_types'])} profile types")

    def test_cultural_diffusion_stream(self):
        """GET /api/smart-engine/cultural-diffusion returns engagement data"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/cultural-diffusion")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("stream") == "cultural-diffusion"
        assert "referrers" in data
        assert "page_engagement" in data
        assert "contact_inquiries" in data
        print(f"✓ Cultural Diffusion: {data['contact_inquiries']} contact inquiries")

    def test_mgraph_stream(self):
        """GET /api/smart-engine/mgraph returns nodes and edges"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/mgraph")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("stream") == "mgraph"
        assert "nodes" in data
        assert "edges" in data
        assert "total_nodes" in data
        assert "total_edges" in data
        assert "clusters" in data
        print(f"✓ Mgraph: {data['total_nodes']} nodes, {data['total_edges']} edges")

    def test_creative_network_stream(self):
        """GET /api/smart-engine/creative-network returns connections data"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/creative-network")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("stream") == "creative-network"
        assert "connections" in data
        assert "messages" in data
        assert "opportunities" in data
        assert "top_connected" in data
        print(f"✓ Creative Network: {data['connections'].get('total', 0)} connections")


# ═══════════════════════════════════════════════════════════════
# AI AGENTS DASHBOARD - 10 Agents cartographiés
# ═══════════════════════════════════════════════════════════════

class TestAIAgentsDashboard:
    """Tests for AI Agents monitoring dashboard"""
    
    def test_list_returns_10_agents(self):
        """GET /api/ai-agents/list returns 10 agents with 9 active"""
        response = requests.get(f"{BASE_URL}/api/ai-agents/list")
        assert response.status_code == 200
        
        data = response.json()
        assert "agents" in data
        assert "stats" in data
        
        agents = data["agents"]
        assert len(agents) == 10, f"Expected 10 agents, got {len(agents)}"
        
        # Verify stats
        stats = data["stats"]
        assert stats["total"] == 10
        assert stats["active"] == 9, f"Expected 9 active agents, got {stats['active']}"
        assert stats["inactive"] == 1
        
        # Verify agent structure
        for agent in agents:
            assert "id" in agent
            assert "name" in agent
            assert "description" in agent
            assert "type" in agent
            assert "category" in agent
            assert "endpoints" in agent
            assert "enabled" in agent
        
        print(f"✓ AI Agents: {stats['total']} total, {stats['active']} active, {stats['inactive']} inactive")

    def test_agent_status_detail(self):
        """GET /api/ai-agents/smart-engine-cvln/status returns detail"""
        response = requests.get(f"{BASE_URL}/api/ai-agents/smart-engine-cvln/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("id") == "smart-engine-cvln"
        assert "name" in data
        assert "description" in data
        assert "endpoints" in data
        assert "enabled" in data
        assert "metrics" in data
        
        # Verify metrics structure
        metrics = data["metrics"]
        assert "executions_24h" in metrics
        assert "errors_24h" in metrics
        
        print(f"✓ Agent smart-engine-cvln: enabled={data['enabled']}, endpoints={len(data['endpoints'])}")

    def test_agent_toggle(self):
        """POST /api/ai-agents/hcaptcha-guard/toggle toggles agent state"""
        # Get initial state
        initial_response = requests.get(f"{BASE_URL}/api/ai-agents/hcaptcha-guard/status")
        assert initial_response.status_code == 200
        initial_state = initial_response.json().get("enabled")
        
        # Toggle
        toggle_response = requests.post(f"{BASE_URL}/api/ai-agents/hcaptcha-guard/toggle")
        assert toggle_response.status_code == 200
        
        toggle_data = toggle_response.json()
        assert toggle_data.get("success") == True
        assert toggle_data.get("agent_id") == "hcaptcha-guard"
        assert toggle_data.get("enabled") != initial_state, "State should have toggled"
        
        # Toggle back to restore original state
        restore_response = requests.post(f"{BASE_URL}/api/ai-agents/hcaptcha-guard/toggle")
        assert restore_response.status_code == 200
        
        print(f"✓ Agent toggle: hcaptcha-guard toggled from {initial_state} to {toggle_data['enabled']} and back")

    def test_agent_logs(self):
        """GET /api/ai-agents/{agent_id}/logs returns logs"""
        response = requests.get(f"{BASE_URL}/api/ai-agents/smart-engine-cvln/logs")
        assert response.status_code == 200
        
        data = response.json()
        assert "logs" in data
        assert data.get("agent_id") == "smart-engine-cvln"
        print(f"✓ Agent logs: {len(data['logs'])} log entries for smart-engine-cvln")

    def test_all_agent_ids_exist(self):
        """Verify all 10 expected agent IDs exist"""
        response = requests.get(f"{BASE_URL}/api/ai-agents/list")
        assert response.status_code == 200
        
        agent_ids = [a["id"] for a in response.json()["agents"]]
        expected_ids = [
            "smart-engine-cvln",
            "alert-engine",
            "badge-generator",
            "batch-processor",
            "stripe-webhook",
            "cms-sanitizer",
            "analytics-tracker",
            "email-service",
            "social-feed-engine",
            "hcaptcha-guard"
        ]
        
        for expected_id in expected_ids:
            assert expected_id in agent_ids, f"Missing agent: {expected_id}"
        
        print(f"✓ All 10 expected agent IDs present")


# ═══════════════════════════════════════════════════════════════
# PRO SOCIAL - Fil d'actualité & Recommandations
# ═══════════════════════════════════════════════════════════════

class TestProSocialFeed:
    """Tests for Pro Social feed, posts, directory, recommendations"""
    
    def test_feed_returns_posts(self):
        """GET /api/pro/social/feed returns posts array"""
        response = requests.get(f"{BASE_URL}/api/pro/social/feed")
        assert response.status_code == 200
        
        data = response.json()
        assert "posts" in data
        assert "total" in data
        assert isinstance(data["posts"], list)
        print(f"✓ Social Feed: {data['total']} total posts")

    def test_create_post(self):
        """POST /api/pro/social/posts creates a new post"""
        test_id = f"TEST_{uuid.uuid4().hex[:8]}"
        post_data = {
            "author_id": test_id,
            "author_name": "Test User",
            "content": f"Test post content {datetime.now().isoformat()}"
        }
        
        response = requests.post(f"{BASE_URL}/api/pro/social/posts", json=post_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "post" in data
        
        post = data["post"]
        assert post["author_id"] == test_id
        assert post["author_name"] == "Test User"
        assert "id" in post
        assert "created_at" in post
        assert post["likes_count"] == 0
        assert post["comments_count"] == 0
        
        print(f"✓ Created post: {post['id']}")
        return post["id"]

    def test_like_post(self):
        """POST /api/pro/social/posts/{post_id}/like toggles like"""
        # First create a post
        test_id = f"TEST_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/pro/social/posts", json={
            "author_id": test_id,
            "author_name": "Test User",
            "content": "Test post for like"
        })
        assert create_response.status_code == 200
        post_id = create_response.json()["post"]["id"]
        
        # Like the post
        like_response = requests.post(
            f"{BASE_URL}/api/pro/social/posts/{post_id}/like",
            params={"profile_id": test_id}
        )
        assert like_response.status_code == 200
        
        like_data = like_response.json()
        assert like_data.get("success") == True
        assert like_data.get("liked") == True
        
        # Unlike the post
        unlike_response = requests.post(
            f"{BASE_URL}/api/pro/social/posts/{post_id}/like",
            params={"profile_id": test_id}
        )
        assert unlike_response.status_code == 200
        assert unlike_response.json().get("liked") == False
        
        print(f"✓ Like toggle works for post {post_id}")

    def test_comment_on_post(self):
        """POST /api/pro/social/posts/{post_id}/comment adds comment"""
        # First create a post
        test_id = f"TEST_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/pro/social/posts", json={
            "author_id": test_id,
            "author_name": "Test User",
            "content": "Test post for comment"
        })
        assert create_response.status_code == 200
        post_id = create_response.json()["post"]["id"]
        
        # Add comment
        comment_data = {
            "author_id": test_id,
            "author_name": "Commenter",
            "content": "This is a test comment"
        }
        comment_response = requests.post(
            f"{BASE_URL}/api/pro/social/posts/{post_id}/comment",
            json=comment_data
        )
        assert comment_response.status_code == 200
        
        comment_result = comment_response.json()
        assert comment_result.get("success") == True
        assert "comment" in comment_result
        assert comment_result["comment"]["content"] == "This is a test comment"
        
        print(f"✓ Comment added to post {post_id}")

    def test_directory_returns_professionals(self):
        """GET /api/pro/social/directory returns professionals list"""
        response = requests.get(f"{BASE_URL}/api/pro/social/directory")
        assert response.status_code == 200
        
        data = response.json()
        assert "professionals" in data
        assert "total" in data
        assert "filters" in data
        
        filters = data["filters"]
        assert "countries" in filters
        assert "types" in filters
        
        print(f"✓ Directory: {data['total']} professionals, {len(filters['countries'])} countries, {len(filters['types'])} types")

    def test_directory_search(self):
        """GET /api/pro/social/directory with search filter"""
        response = requests.get(f"{BASE_URL}/api/pro/social/directory", params={"search": "test"})
        assert response.status_code == 200
        
        data = response.json()
        assert "professionals" in data
        print(f"✓ Directory search: {data['total']} results for 'test'")

    def test_directory_filter_by_type(self):
        """GET /api/pro/social/directory with profile_type filter"""
        response = requests.get(f"{BASE_URL}/api/pro/social/directory", params={"profile_type": "artist"})
        assert response.status_code == 200
        
        data = response.json()
        assert "professionals" in data
        print(f"✓ Directory filter by type: {data['total']} artists")


# ═══════════════════════════════════════════════════════════════
# HCAPTCHA ENDPOINTS (from iteration 36)
# ═══════════════════════════════════════════════════════════════

class TestHCaptchaEndpoints:
    """Tests for hCaptcha protected endpoints"""
    
    def test_contact_with_captcha(self):
        """POST /api/contact with captcha_token returns success"""
        contact_data = {
            "name": "TEST_Contact",
            "email": f"test_{uuid.uuid4().hex[:8]}@test.com",
            "subject": "Test Subject",
            "message": "Test message content",
            "captcha_token": "10000000-aaaa-bbbb-cccc-000000000001"
        }
        
        response = requests.post(f"{BASE_URL}/api/contact", json=contact_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Contact with captcha: success")

    def test_badge_inscription_with_captcha(self):
        """POST /api/badges/inscrire with captcha_token returns badge"""
        badge_data = {
            "prenom": "TEST",
            "nom": f"User_{uuid.uuid4().hex[:8]}",
            "email": f"test_{uuid.uuid4().hex[:8]}@test.com",
            "type_badge": "VIS",
            "captcha_token": "10000000-aaaa-bbbb-cccc-000000000001"
        }
        
        response = requests.post(f"{BASE_URL}/api/badges/inscrire", json=badge_data)
        assert response.status_code == 200
        
        data = response.json()
        # Response returns badge directly with badge_id
        assert "badge_id" in data, "Response should contain badge_id"
        assert data["badge_id"].startswith("CC26-"), f"Badge ID should start with CC26-, got {data['badge_id']}"
        print(f"✓ Badge inscription with captcha: badge_id={data['badge_id']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
