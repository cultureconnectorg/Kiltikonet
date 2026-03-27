"""
Iteration 38 - Complete Testing of 4 Chantiers CC2026
Tests for:
- Smart Engine CVLN (8 streams)
- AI Agents Dashboard (10 agents)
- Pro Social Feed (posts, likes, comments, directory, recommendations)
- hCaptcha Integration (contact form)
- Admin Dashboard tabs (Smart Engine, AI Agents)
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com')

# Test token for hCaptcha (test mode)
HCAPTCHA_TEST_TOKEN = "10000000-aaaa-bbbb-cccc-000000000001"


class TestSmartEngineDashboard:
    """Smart Engine CVLN - 8 data streams"""
    
    def test_dashboard_returns_8_streams_overview(self):
        """GET /api/smart-engine/dashboard returns 8 streams overview"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        # Verify stream is dashboard
        assert data.get("stream") == "dashboard"
        
        # Verify overview metrics exist
        overview = data.get("overview", {})
        assert "total_badges" in overview
        assert "events_24h" in overview
        assert "active_now" in overview
        assert "nfc_enabled" in overview
        assert "total_registrations" in overview
        assert "connections" in overview
        assert "messages" in overview
        
        # Verify 8 streams are listed
        streams = data.get("streams", [])
        assert len(streams) == 8
        
        stream_ids = [s["id"] for s in streams]
        expected_streams = [
            "predictive", "mgraph", "live-audience", "creation-origin",
            "cultural-diffusion", "conversion", "verified-identity", "creative-network"
        ]
        for expected in expected_streams:
            assert expected in stream_ids, f"Missing stream: {expected}"
    
    def test_predictive_returns_data(self):
        """GET /api/smart-engine/predictive returns predictive data"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/predictive")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("stream") == "predictive"
        assert "current_total" in data
        assert "avg_daily_rate" in data
        assert "projected_total_at_event" in data
        assert "days_remaining" in data
        assert "daily_registrations" in data
        assert "registrations_by_type" in data
    
    def test_conversion_returns_funnel(self):
        """GET /api/smart-engine/conversion returns funnel"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/conversion")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("stream") == "conversion"
        
        # Verify funnel structure
        funnel = data.get("funnel", {})
        assert "visitors" in funnel
        assert "pricing_viewers" in funnel
        assert "inscriptions" in funnel
        assert "paid" in funnel
        
        # Verify rates
        rates = data.get("rates", {})
        assert "visit_to_pricing" in rates
        assert "pricing_to_inscription" in rates
        assert "overall" in rates
        
        # Verify revenue
        revenue = data.get("revenue", {})
        assert "total_eur" in revenue
        assert "payments_count" in revenue
    
    def test_verified_identity_returns_badge_stats(self):
        """GET /api/smart-engine/verified-identity returns badge stats"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/verified-identity")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("stream") == "verified-identity"
        assert "total_badges" in data
        assert "by_status" in data
        assert "by_type" in data
        assert "nfc" in data
        assert "frek_verified" in data
        assert "recent_badges" in data
        
        # Verify NFC structure
        nfc = data.get("nfc", {})
        assert "enabled" in nfc
        assert "linked" in nfc
    
    def test_mgraph_returns_nodes_edges(self):
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
    
    def test_live_audience_returns_active_sessions(self):
        """GET /api/smart-engine/live-audience returns active sessions"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/live-audience")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("stream") == "live-audience"
        assert "active_now" in data
        assert "sessions_last_hour" in data
        assert "current_pages" in data
        assert "hourly_trend" in data
    
    def test_creation_origin_returns_country_data(self):
        """GET /api/smart-engine/creation-origin returns country data"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/creation-origin")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("stream") == "creation-origin"
        assert "countries" in data
        assert "profile_types" in data
        assert "languages" in data
        assert "devices" in data
    
    def test_cultural_diffusion_returns_engagement_data(self):
        """GET /api/smart-engine/cultural-diffusion returns engagement data"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/cultural-diffusion")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("stream") == "cultural-diffusion"
        assert "referrers" in data
        assert "page_engagement" in data
        assert "contact_inquiries" in data
        assert "partnerships" in data
    
    def test_creative_network_returns_connections_data(self):
        """GET /api/smart-engine/creative-network returns connections data"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/creative-network")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("stream") == "creative-network"
        assert "connections" in data
        assert "messages" in data
        assert "opportunities" in data
        assert "events" in data
        assert "top_connected" in data


class TestAIAgentsDashboard:
    """AI Agents Dashboard - 10 agents monitoring"""
    
    def test_list_returns_10_agents(self):
        """GET /api/ai-agents/list returns 10 agents"""
        response = requests.get(f"{BASE_URL}/api/ai-agents/list")
        assert response.status_code == 200
        data = response.json()
        
        agents = data.get("agents", [])
        assert len(agents) == 10, f"Expected 10 agents, got {len(agents)}"
        
        # Verify expected agent IDs
        agent_ids = [a["id"] for a in agents]
        expected_agents = [
            "smart-engine-cvln", "alert-engine", "badge-generator",
            "batch-processor", "stripe-webhook", "cms-sanitizer",
            "analytics-tracker", "email-service", "social-feed-engine",
            "hcaptcha-guard"
        ]
        for expected in expected_agents:
            assert expected in agent_ids, f"Missing agent: {expected}"
        
        # Verify stats
        stats = data.get("stats", {})
        assert stats.get("total") == 10
        assert "active" in stats
        assert "inactive" in stats
        assert "by_category" in stats
    
    def test_agent_status_returns_detail(self):
        """GET /api/ai-agents/{agent_id}/status returns detail"""
        response = requests.get(f"{BASE_URL}/api/ai-agents/smart-engine-cvln/status")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("id") == "smart-engine-cvln"
        assert "name" in data
        assert "description" in data
        assert "type" in data
        assert "category" in data
        assert "endpoints" in data
        assert "source_file" in data
        assert "enabled" in data
        assert "metrics" in data
        
        # Verify metrics structure
        metrics = data.get("metrics", {})
        assert "executions_24h" in metrics
        assert "errors_24h" in metrics
    
    def test_toggle_agent_state(self):
        """POST /api/ai-agents/{agent_id}/toggle toggles state"""
        # Get current state
        response = requests.get(f"{BASE_URL}/api/ai-agents/smart-engine-cvln/status")
        initial_state = response.json().get("enabled")
        
        # Toggle
        response = requests.post(f"{BASE_URL}/api/ai-agents/smart-engine-cvln/toggle")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert data.get("agent_id") == "smart-engine-cvln"
        assert data.get("enabled") == (not initial_state)
        
        # Toggle back to original state
        response = requests.post(f"{BASE_URL}/api/ai-agents/smart-engine-cvln/toggle")
        assert response.status_code == 200
        data = response.json()
        assert data.get("enabled") == initial_state
    
    def test_agent_logs_endpoint(self):
        """GET /api/ai-agents/{agent_id}/logs returns logs"""
        response = requests.get(f"{BASE_URL}/api/ai-agents/smart-engine-cvln/logs")
        assert response.status_code == 200
        data = response.json()
        
        assert "logs" in data
        assert data.get("agent_id") == "smart-engine-cvln"


class TestProSocialFeed:
    """Pro Social Feed - Posts, Likes, Comments, Directory"""
    
    def test_feed_returns_posts(self):
        """GET /api/pro/social/feed returns posts"""
        response = requests.get(f"{BASE_URL}/api/pro/social/feed")
        assert response.status_code == 200
        data = response.json()
        
        assert "posts" in data
        assert "total" in data
        assert isinstance(data["posts"], list)
    
    def test_create_post(self):
        """POST /api/pro/social/posts creates new post"""
        test_id = f"TEST_{uuid.uuid4().hex[:8]}"
        post_data = {
            "author_id": test_id,
            "author_name": "Test User",
            "content": f"Test post content {datetime.now().isoformat()}",
            "tags": ["test", "cc2026"]
        }
        
        response = requests.post(f"{BASE_URL}/api/pro/social/posts", json=post_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "post" in data
        
        post = data["post"]
        assert post.get("author_id") == test_id
        assert post.get("author_name") == "Test User"
        assert "id" in post
        assert "created_at" in post
    
    def test_toggle_like(self):
        """POST /api/pro/social/posts/{post_id}/like toggles like"""
        # First create a post
        test_id = f"TEST_{uuid.uuid4().hex[:8]}"
        post_data = {
            "author_id": test_id,
            "author_name": "Test User",
            "content": "Test post for like"
        }
        create_response = requests.post(f"{BASE_URL}/api/pro/social/posts", json=post_data)
        post_id = create_response.json()["post"]["id"]
        
        # Like the post
        response = requests.post(f"{BASE_URL}/api/pro/social/posts/{post_id}/like?profile_id={test_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert data.get("liked") == True
        
        # Unlike the post
        response = requests.post(f"{BASE_URL}/api/pro/social/posts/{post_id}/like?profile_id={test_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert data.get("liked") == False
    
    def test_add_comment(self):
        """POST /api/pro/social/posts/{post_id}/comment adds comment"""
        # First create a post
        test_id = f"TEST_{uuid.uuid4().hex[:8]}"
        post_data = {
            "author_id": test_id,
            "author_name": "Test User",
            "content": "Test post for comment"
        }
        create_response = requests.post(f"{BASE_URL}/api/pro/social/posts", json=post_data)
        post_id = create_response.json()["post"]["id"]
        
        # Add comment
        comment_data = {
            "author_id": test_id,
            "author_name": "Commenter",
            "content": "This is a test comment"
        }
        response = requests.post(f"{BASE_URL}/api/pro/social/posts/{post_id}/comment", json=comment_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "comment" in data
        assert data["comment"].get("content") == "This is a test comment"
    
    def test_directory_returns_professionals(self):
        """GET /api/pro/social/directory returns professionals"""
        response = requests.get(f"{BASE_URL}/api/pro/social/directory")
        assert response.status_code == 200
        data = response.json()
        
        assert "professionals" in data
        assert "total" in data
        assert "filters" in data
        
        filters = data.get("filters", {})
        assert "countries" in filters
        assert "types" in filters
    
    def test_recommendations_endpoint(self):
        """GET /api/pro/social/recommendations/{id} returns suggestions"""
        response = requests.get(f"{BASE_URL}/api/pro/social/recommendations/test-123")
        assert response.status_code == 200
        data = response.json()
        
        # Should return recommendations or reason for empty
        assert "recommendations" in data or "reason" in data


class TestHCaptchaIntegration:
    """hCaptcha Integration - Contact form protection"""
    
    def test_contact_with_captcha_token_works(self):
        """POST /api/contact with captcha_token works"""
        contact_data = {
            "name": "Test User",
            "email": "test@example.com",
            "message": "Test message from iteration 38",
            "captcha_token": HCAPTCHA_TEST_TOKEN
        }
        
        response = requests.post(f"{BASE_URL}/api/contact", json=contact_data)
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True


class TestHCaptchaSitekey:
    """Verify hCaptcha production sitekey is configured"""
    
    def test_hcaptcha_sitekey_is_production(self):
        """REACT_APP_HCAPTCHA_SITEKEY is production key"""
        # Read from frontend .env
        env_path = "/app/frontend/.env"
        expected_sitekey = "778827a6-199c-40b0-bf16-1912baf494ae"
        
        with open(env_path, 'r') as f:
            content = f.read()
        
        assert f"REACT_APP_HCAPTCHA_SITEKEY={expected_sitekey}" in content, \
            f"hCaptcha sitekey should be {expected_sitekey}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
