"""
Test suite for Networking & Intelligence features
- /api/v1/stats endpoint (by_expertise, top_5_interests)
- /api/v1/search/match endpoint (expertise parameter, shared_interests)
- /api/v1/search/suggestions endpoint
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://connect-2026-2.preview.emergentagent.com').rstrip('/')


class TestStatsEndpoint:
    """Tests for /api/v1/stats - Statistics API"""
    
    def test_stats_returns_200(self):
        """Stats endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/v1/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/v1/stats returns 200")
    
    def test_stats_contains_by_expertise(self):
        """Stats endpoint contains by_expertise field"""
        response = requests.get(f"{BASE_URL}/api/v1/stats")
        data = response.json()
        
        assert "by_expertise" in data, "Missing 'by_expertise' in stats response"
        assert isinstance(data["by_expertise"], dict), "by_expertise should be a dictionary"
        print(f"✓ by_expertise present with {len(data['by_expertise'])} tags")
    
    def test_stats_contains_top_5_interests(self):
        """Stats endpoint contains top_5_interests field"""
        response = requests.get(f"{BASE_URL}/api/v1/stats")
        data = response.json()
        
        assert "top_5_interests" in data, "Missing 'top_5_interests' in stats response"
        assert isinstance(data["top_5_interests"], list), "top_5_interests should be a list"
        assert len(data["top_5_interests"]) <= 5, "top_5_interests should have max 5 items"
        print(f"✓ top_5_interests present: {data['top_5_interests']}")
    
    def test_stats_summary_structure(self):
        """Stats endpoint contains proper summary structure"""
        response = requests.get(f"{BASE_URL}/api/v1/stats")
        data = response.json()
        
        assert "summary" in data, "Missing 'summary' in stats response"
        summary = data["summary"]
        assert "total_registrations" in summary, "Missing total_registrations in summary"
        assert "approved" in summary, "Missing approved in summary"
        print(f"✓ Summary structure valid - Total: {summary['total_registrations']}")
    
    def test_stats_metadata_fields(self):
        """Stats endpoint contains generated_at and meta fields"""
        response = requests.get(f"{BASE_URL}/api/v1/stats")
        data = response.json()
        
        assert "generated_at" in data, "Missing 'generated_at' timestamp"
        assert "meta" in data, "Missing 'meta' field"
        assert data["meta"]["api_version"] == "1.0", "Invalid API version"
        print("✓ Metadata fields present and valid")


class TestSearchMatchEndpoint:
    """Tests for /api/v1/search/match - Smart Connect API"""
    
    def test_search_match_returns_200(self):
        """Search match endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/v1/search/match")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/v1/search/match returns 200")
    
    def test_search_match_with_expertise_filter(self):
        """Search match with expertise filter returns matching results"""
        response = requests.get(f"{BASE_URL}/api/v1/search/match?expertise=music,labels")
        data = response.json()
        
        assert response.status_code == 200
        assert "query" in data, "Missing 'query' in response"
        assert "results" in data, "Missing 'results' in response"
        assert "total_matches" in data, "Missing 'total_matches' in response"
        
        # Verify expertise was parsed correctly
        assert "expertise" in data["query"], "Missing expertise in query"
        assert "music" in data["query"]["expertise"], "music not in expertise list"
        assert "labels" in data["query"]["expertise"], "labels not in expertise list"
        print(f"✓ Expertise filter works - Found {data['total_matches']} matches")
    
    def test_search_match_returns_shared_interests(self):
        """Search match returns shared_interests count in results"""
        response = requests.get(f"{BASE_URL}/api/v1/search/match?expertise=music,labels&limit=5")
        data = response.json()
        
        if data["total_matches"] > 0:
            first_result = data["results"][0]
            assert "shared_interests" in first_result, "Missing 'shared_interests' in result"
            assert isinstance(first_result["shared_interests"], int), "shared_interests should be integer"
            print(f"✓ shared_interests field present - First result has {first_result['shared_interests']} shared interests")
        else:
            print("✓ shared_interests validation skipped (no results)")
    
    def test_search_match_returns_expertise_tags(self):
        """Search match returns expertise_tags in results"""
        response = requests.get(f"{BASE_URL}/api/v1/search/match?limit=5")
        data = response.json()
        
        if data["total_matches"] > 0:
            first_result = data["results"][0]
            assert "expertise_tags" in first_result, "Missing 'expertise_tags' in result"
            assert isinstance(first_result["expertise_tags"], list), "expertise_tags should be a list"
            print(f"✓ expertise_tags field present: {first_result['expertise_tags']}")
        else:
            print("✓ expertise_tags validation skipped (no results)")
    
    def test_search_match_marche_culturel_filter(self):
        """Search match with marche_culturel expertise filter"""
        response = requests.get(f"{BASE_URL}/api/v1/search/match?expertise=marche_culturel")
        data = response.json()
        
        assert response.status_code == 200
        print(f"✓ marche_culturel filter works - Found {data['total_matches']} matches")
        
        # Verify all results have marche_culturel tag
        for result in data["results"]:
            assert "marche_culturel" in result.get("expertise_tags", []), \
                f"Result {result.get('name')} missing marche_culturel tag"
    
    def test_search_match_profile_type_filter(self):
        """Search match with profile_type filter"""
        response = requests.get(f"{BASE_URL}/api/v1/search/match?profile_type=label")
        data = response.json()
        
        assert response.status_code == 200
        for result in data["results"]:
            assert result["profile_type"] == "label", f"Expected profile_type label, got {result['profile_type']}"
        print(f"✓ profile_type filter works - Found {data['total_matches']} labels")
    
    def test_search_match_combined_filters(self):
        """Search match with combined expertise and profile_type filters"""
        response = requests.get(f"{BASE_URL}/api/v1/search/match?expertise=music&profile_type=artist")
        data = response.json()
        
        assert response.status_code == 200
        for result in data["results"]:
            assert result["profile_type"] == "artist", "Result should be artist"
            assert "music" in result.get("expertise_tags", []), "Result should have music tag"
        print(f"✓ Combined filters work - Found {data['total_matches']} artists with music expertise")


class TestSearchSuggestionsEndpoint:
    """Tests for /api/v1/search/suggestions - Partner suggestions API"""
    
    def test_suggestions_without_id_returns_404(self):
        """Suggestions endpoint without participant_id returns 422/404"""
        response = requests.get(f"{BASE_URL}/api/v1/search/suggestions")
        # Should fail without participant_id (422 for validation error)
        assert response.status_code in [404, 422], f"Expected 404/422, got {response.status_code}"
        print("✓ Suggestions endpoint validates participant_id requirement")
    
    def test_suggestions_with_invalid_id_returns_404(self):
        """Suggestions endpoint with non-existent ID returns 404"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/v1/search/suggestions?participant_id={fake_id}")
        assert response.status_code == 404, f"Expected 404 for fake ID, got {response.status_code}"
        print("✓ Suggestions endpoint returns 404 for non-existent participant")


class TestRegistrationWithExpertiseTags:
    """Tests for creating registrations with expertise_tags"""
    
    def test_manual_registration_with_expertise_tags(self):
        """Manual registration can include expertise_tags"""
        unique_email = f"test_expertise_{uuid.uuid4().hex[:8]}@test.com"
        registration_data = {
            "full_name": "TEST_Expertise User",
            "organization_name": "Test Expertise Org",
            "country": "martinique",
            "email": unique_email,
            "phone": "+596 696 00 00 01",
            "profile_type": "label",
            "tier": "professional",
            "status": "approved",
            "show_in_catalog": True,
            "bio": "Testing expertise tags",
            "expertise_tags": ["music", "labels", "production"]
        }
        
        response = requests.post(f"{BASE_URL}/api/registrations/manual", json=registration_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "expertise_tags" in data, "Response should contain expertise_tags"
        assert data["expertise_tags"] == ["music", "labels", "production"], "expertise_tags mismatch"
        
        created_id = data["id"]
        print(f"✓ Created registration {created_id} with expertise_tags")
        
        # Cleanup
        delete_response = requests.delete(f"{BASE_URL}/api/registrations/{created_id}")
        assert delete_response.status_code == 200, "Cleanup failed"
        print("✓ Cleaned up test registration")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
