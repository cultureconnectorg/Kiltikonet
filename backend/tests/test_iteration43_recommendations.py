"""
Iteration 43 - CC2026 Recommendation System Tests
Tests for hybrid recommendation engine (internal scoring + CVL BRAIN enrichment)
3 axes: Connexions participants, Contenus/evenements, Partenariats organisations
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Valid badge IDs for testing
BADGE_VIP = "CC26-VIP-6LNR7"  # Marie Dupont VIP
BADGE_ART = "CC26-ART-ATKZ4"  # Artiste
BADGE_BNV = "CC26-BNV-PQZZZ"  # Benevole
INVALID_BADGE = "INVALID_ID"


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """Verify API is running"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print(f"✓ API health check passed: {response.status_code}")


class TestConnectionRecommendations:
    """Test GET /api/recommendations/connections/{badge_id}"""
    
    def test_connections_vip_badge(self):
        """Test connection recommendations for VIP badge"""
        response = requests.get(f"{BASE_URL}/api/recommendations/connections/{BADGE_VIP}?limit=5")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "badge_id" in data
        assert data["badge_id"] == BADGE_VIP
        assert "recommendations" in data
        assert "profile" in data
        assert "total_candidates" in data
        assert "generated_at" in data
        
        # Verify recommendations have required fields
        if data["recommendations"]:
            rec = data["recommendations"][0]
            assert "match_score" in rec
            assert "type" in rec
            assert "reasons" in rec
            assert "frek_id" in rec
            assert "name" in rec
            assert "badge_id" in rec
        
        print(f"✓ VIP connections: {len(data['recommendations'])} recommendations, total candidates: {data['total_candidates']}")
    
    def test_connections_artist_badge(self):
        """Test connection recommendations for Artist badge"""
        response = requests.get(f"{BASE_URL}/api/recommendations/connections/{BADGE_ART}?limit=5")
        assert response.status_code == 200
        data = response.json()
        
        assert "recommendations" in data
        assert len(data["recommendations"]) <= 5
        
        # Verify match_score is numeric
        for rec in data["recommendations"]:
            assert isinstance(rec["match_score"], (int, float))
            assert rec["match_score"] >= 0
        
        print(f"✓ Artist connections: {len(data['recommendations'])} recommendations")
    
    def test_connections_invalid_badge(self):
        """Test connection recommendations with invalid badge ID"""
        response = requests.get(f"{BASE_URL}/api/recommendations/connections/{INVALID_BADGE}")
        assert response.status_code == 200  # Returns 200 with error in body
        data = response.json()
        
        assert "error" in data
        assert "Badge non trouve" in data["error"]
        assert data["recommendations"] == []
        
        print(f"✓ Invalid badge returns error: {data['error']}")


class TestEventRecommendations:
    """Test GET /api/recommendations/events/{badge_id}"""
    
    def test_events_artist_badge(self):
        """Test event recommendations for Artist badge"""
        response = requests.get(f"{BASE_URL}/api/recommendations/events/{BADGE_ART}?limit=4")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "badge_id" in data
        assert data["badge_id"] == BADGE_ART
        assert "recommendations" in data
        assert "profile" in data
        assert "total_events" in data
        
        # Verify event recommendations have required fields
        if data["recommendations"]:
            evt = data["recommendations"][0]
            assert "match_score" in evt
            assert "title" in evt
            assert "date" in evt
            assert "lieu" in evt
            assert "type" in evt
            assert "reasons" in evt
        
        print(f"✓ Artist events: {len(data['recommendations'])} recommendations, total events: {data['total_events']}")
    
    def test_events_vip_badge(self):
        """Test event recommendations for VIP badge"""
        response = requests.get(f"{BASE_URL}/api/recommendations/events/{BADGE_VIP}?limit=6")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["recommendations"]) <= 6
        
        # Verify dates are in CC2026 range (20-23 Mai 2026)
        for evt in data["recommendations"]:
            assert evt["date"].startswith("2026-05-2")
        
        print(f"✓ VIP events: {len(data['recommendations'])} recommendations")
    
    def test_events_invalid_badge(self):
        """Test event recommendations with invalid badge ID"""
        response = requests.get(f"{BASE_URL}/api/recommendations/events/{INVALID_BADGE}")
        assert response.status_code == 200
        data = response.json()
        
        assert "error" in data
        assert data["recommendations"] == []
        
        print(f"✓ Invalid badge events returns error")


class TestPartnershipRecommendations:
    """Test GET /api/recommendations/partnerships/{badge_id}"""
    
    def test_partnerships_vip_badge(self):
        """Test partnership recommendations for VIP badge"""
        response = requests.get(f"{BASE_URL}/api/recommendations/partnerships/{BADGE_VIP}?limit=3")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "badge_id" in data
        assert data["badge_id"] == BADGE_VIP
        assert "recommendations" in data
        assert "profile" in data
        assert "total_orgs" in data
        
        # Verify partnership recommendations have required fields
        if data["recommendations"]:
            org = data["recommendations"][0]
            assert "org_name" in org
            assert "member_count" in org
            assert "types" in org
            assert "match_score" in org
            assert "reasons" in org
        
        print(f"✓ VIP partnerships: {len(data['recommendations'])} recommendations, total orgs: {data['total_orgs']}")
    
    def test_partnerships_benevole_badge(self):
        """Test partnership recommendations for Benevole badge"""
        response = requests.get(f"{BASE_URL}/api/recommendations/partnerships/{BADGE_BNV}?limit=5")
        assert response.status_code == 200
        data = response.json()
        
        assert "recommendations" in data
        
        # Verify types is a list
        for org in data["recommendations"]:
            assert isinstance(org["types"], list)
            assert isinstance(org["member_count"], int)
        
        print(f"✓ Benevole partnerships: {len(data['recommendations'])} recommendations")


class TestAdminOverview:
    """Test GET /api/recommendations/admin/overview"""
    
    def test_admin_overview(self):
        """Test admin overview endpoint"""
        response = requests.get(f"{BASE_URL}/api/recommendations/admin/overview")
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        assert "total_badges" in data
        assert "total_events" in data
        assert "potential_connections" in data
        assert "score_distribution" in data
        assert "event_distribution" in data
        assert "top_organisations" in data
        assert "recommendation_axes" in data
        assert "generated_at" in data
        
        # Verify data types
        assert isinstance(data["total_badges"], int)
        assert isinstance(data["total_events"], int)
        assert isinstance(data["potential_connections"], int)
        assert isinstance(data["score_distribution"], dict)
        assert isinstance(data["event_distribution"], dict)
        assert isinstance(data["top_organisations"], list)
        
        # Verify score distribution has expected ranges
        score_dist = data["score_distribution"]
        assert "elite (80-100)" in score_dist
        assert "haut (60-79)" in score_dist
        assert "moyen (40-59)" in score_dist
        assert "debutant (0-39)" in score_dist
        
        print(f"✓ Admin overview: {data['total_badges']} badges, {data['total_events']} events, {data['potential_connections']} potential connections")
        print(f"  Score distribution: {score_dist}")
        print(f"  Event distribution: {data['event_distribution']}")
        print(f"  Top orgs: {len(data['top_organisations'])}")


class TestEventsList:
    """Test GET /api/recommendations/events (all events list)"""
    
    def test_all_events_list(self):
        """Test listing all CC2026 events"""
        response = requests.get(f"{BASE_URL}/api/recommendations/events")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "events" in data
        assert "total" in data
        
        # Verify 18 events are seeded
        assert data["total"] == 18
        assert len(data["events"]) == 18
        
        # Verify event structure
        for evt in data["events"]:
            assert "id" in evt
            assert "title" in evt
            assert "date" in evt
            assert "start" in evt
            assert "end" in evt
            assert "lieu" in evt
            assert "type" in evt
            assert "tags" in evt
            assert "target_badges" in evt
            assert "description" in evt
            assert "capacity" in evt
        
        # Verify dates are in CC2026 range
        dates = set(evt["date"] for evt in data["events"])
        expected_dates = {"2026-05-20", "2026-05-21", "2026-05-22", "2026-05-23"}
        assert dates == expected_dates
        
        # Verify location
        for evt in data["events"]:
            assert "La Savane" in evt["lieu"]
        
        print(f"✓ All events: {data['total']} events across {len(dates)} days")
        print(f"  Event types: {set(evt['type'] for evt in data['events'])}")


class TestCVLBrainEnrichment:
    """Test CVL BRAIN enrichment (optional - may fail if API key not configured)"""
    
    def test_connections_with_enrichment(self):
        """Test connection recommendations with CVL BRAIN enrichment"""
        response = requests.get(f"{BASE_URL}/api/recommendations/connections/{BADGE_VIP}?limit=3&enrich=true")
        assert response.status_code == 200
        data = response.json()
        
        # Should still return recommendations even if enrichment fails
        assert "recommendations" in data
        
        # Check if enrichment was applied (optional)
        if data.get("enriched"):
            assert "brain_enrichment" in data
            print(f"✓ CVL BRAIN enrichment applied: {data.get('brain_enrichment', {}).get('enriched_at', 'N/A')}")
        else:
            print(f"✓ CVL BRAIN enrichment not applied (API key may not be configured) - recommendations still returned")
    
    def test_events_with_enrichment(self):
        """Test event recommendations with CVL BRAIN enrichment"""
        response = requests.get(f"{BASE_URL}/api/recommendations/events/{BADGE_ART}?limit=3&enrich=true")
        assert response.status_code == 200
        data = response.json()
        
        assert "recommendations" in data
        print(f"✓ Events with enrich=true: {len(data['recommendations'])} recommendations, enriched={data.get('enriched', False)}")


class TestMgraphRegression:
    """Regression test - Mgraph 3D should still work"""
    
    def test_mgraph_endpoint(self):
        """Verify Mgraph endpoint still returns data"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/mgraph")
        assert response.status_code == 200
        data = response.json()
        
        assert "nodes" in data
        assert "edges" in data
        assert len(data["nodes"]) > 0
        assert len(data["edges"]) > 0
        
        print(f"✓ Mgraph regression: {len(data['nodes'])} nodes, {len(data['edges'])} edges")


class TestNotificationsRegression:
    """Regression test - Admin notifications should still work"""
    
    def test_notifications_endpoint(self):
        """Verify notifications endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/admin/notifications?limit=5")
        assert response.status_code == 200
        data = response.json()
        
        assert "notifications" in data
        print(f"✓ Notifications regression: {len(data['notifications'])} notifications returned")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
