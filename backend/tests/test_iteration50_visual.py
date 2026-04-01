"""
Iteration 50 - Visual/CSS Refonte Testing
Tests backend APIs to verify no regression after CSS-only changes
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com')

class TestCulturalIdentityAPI:
    """Cultural Identity endpoint tests - verify no regression"""
    
    def test_get_cultural_identity_returns_score_and_dimensions(self):
        """GET /api/cultural-identity/{user_id} returns score + 7 dimensions"""
        response = requests.get(f"{BASE_URL}/api/cultural-identity/test-user-iter50")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify score field
        assert "score" in data
        assert isinstance(data["score"], (int, float))
        assert 0 <= data["score"] <= 100
        
        # Verify 7 dimensions
        assert "dimensions" in data
        dimensions = data["dimensions"]
        expected_dims = [
            "Musique",
            "Arts Visuels & Scéniques",
            "Langue Créole",
            "Patrimoine & Traditions",
            "Gastronomie",
            "Féminité & Matriarcat",
            "Identité Diasporique"
        ]
        for dim in expected_dims:
            assert dim in dimensions, f"Missing dimension: {dim}"
        
        # Verify level
        assert "level" in data
        assert "name" in data["level"]
        assert data["level"]["name"] in ["Initié", "Ancré", "Enraciné", "Transmetteur", "Pilier"]
        
        print(f"✓ Cultural identity returned: score={data['score']}, level={data['level']['name']}")


class TestCulturalFeedAPI:
    """Cultural Feed endpoint tests - verify 18 cards returned"""
    
    def test_get_cultural_feed_returns_cards(self):
        """GET /api/cultural-feed returns cards with pagination"""
        response = requests.get(f"{BASE_URL}/api/cultural-feed?limit=20")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify cards array
        assert "cards" in data
        assert isinstance(data["cards"], list)
        assert len(data["cards"]) > 0
        
        # Verify total count (should be 18 seeded cards)
        assert "total" in data
        assert data["total"] >= 18, f"Expected at least 18 cards, got {data['total']}"
        
        # Verify has_more pagination
        assert "has_more" in data
        
        print(f"✓ Cultural feed returned {len(data['cards'])} cards, total={data['total']}")
    
    def test_cultural_feed_card_structure(self):
        """Verify card structure has required fields"""
        response = requests.get(f"{BASE_URL}/api/cultural-feed?limit=5")
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["cards"]) > 0
        card = data["cards"][0]
        
        # Required fields
        assert "id" in card
        assert "card_type" in card
        assert "dimension" in card
        assert "title" in card
        assert "reactions" in card
        
        # Card type should be one of the valid types
        valid_types = ["musique", "artiste", "lieu", "evenement", "patrimoine"]
        assert card["card_type"] in valid_types, f"Invalid card_type: {card['card_type']}"
        
        # Reactions should have 5 types
        reactions = card["reactions"]
        expected_reactions = ["feu", "rythme", "racines", "resistance", "lumiere"]
        for rt in expected_reactions:
            assert rt in reactions, f"Missing reaction type: {rt}"
        
        print(f"✓ Card structure valid: {card['title'][:30]}...")
    
    def test_cultural_feed_filter_by_type(self):
        """Filter cards by type works"""
        response = requests.get(f"{BASE_URL}/api/cultural-feed?card_type=musique&limit=10")
        
        assert response.status_code == 200
        data = response.json()
        
        # All returned cards should be musique type
        for card in data["cards"]:
            assert card["card_type"] == "musique", f"Expected musique, got {card['card_type']}"
        
        print(f"✓ Filter by musique returned {len(data['cards'])} cards")


class TestCulturalReactionsAPI:
    """Cultural Reactions endpoint tests - verify toggle add/remove"""
    
    def test_add_reaction(self):
        """POST /api/cultural-reactions adds a reaction"""
        payload = {
            "user_id": "test-user-iter50-reactions",
            "card_id": "card-mus-01",
            "reaction_type": "feu"
        }
        
        response = requests.post(f"{BASE_URL}/api/cultural-reactions", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["reaction_type"] == "feu"
        assert data["emoji"] == "🔥"
        assert data["label"] == "Feu"
        
        # Action should be either "added" or "removed" (toggle)
        assert data["action"] in ["added", "removed"]
        
        print(f"✓ Reaction {data['action']}: {data['emoji']} {data['label']}")
    
    def test_toggle_reaction_removes(self):
        """Second click on same reaction removes it (toggle)"""
        payload = {
            "user_id": "test-user-iter50-toggle",
            "card_id": "card-mus-02",
            "reaction_type": "rythme"
        }
        
        # First click - add
        response1 = requests.post(f"{BASE_URL}/api/cultural-reactions", json=payload)
        assert response1.status_code == 200
        data1 = response1.json()
        first_action = data1["action"]
        
        # Second click - toggle
        response2 = requests.post(f"{BASE_URL}/api/cultural-reactions", json=payload)
        assert response2.status_code == 200
        data2 = response2.json()
        second_action = data2["action"]
        
        # Actions should be opposite
        if first_action == "added":
            assert second_action == "removed"
        else:
            assert second_action == "added"
        
        print(f"✓ Toggle works: {first_action} -> {second_action}")
    
    def test_invalid_reaction_type_returns_400(self):
        """Invalid reaction type returns 400 error"""
        payload = {
            "user_id": "test-user-iter50",
            "card_id": "card-mus-01",
            "reaction_type": "invalid_type"
        }
        
        response = requests.post(f"{BASE_URL}/api/cultural-reactions", json=payload)
        
        assert response.status_code == 400
        print("✓ Invalid reaction type correctly returns 400")
    
    def test_all_five_reaction_types_valid(self):
        """All 5 reaction types are accepted"""
        valid_types = ["feu", "rythme", "racines", "resistance", "lumiere"]
        
        for rt in valid_types:
            payload = {
                "user_id": f"test-user-iter50-{rt}",
                "card_id": "card-art-01",
                "reaction_type": rt
            }
            
            response = requests.post(f"{BASE_URL}/api/cultural-reactions", json=payload)
            assert response.status_code == 200, f"Failed for reaction type: {rt}"
        
        print(f"✓ All 5 reaction types valid: {', '.join(valid_types)}")


class TestProSpaceAPIs:
    """Pro Space related APIs - verify no regression"""
    
    def test_pro_social_feed(self):
        """GET /api/pro/social/feed returns posts"""
        response = requests.get(f"{BASE_URL}/api/pro/social/feed")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "posts" in data
        print(f"✓ Pro social feed returned {len(data['posts'])} posts")
    
    def test_pro_social_recommendations(self):
        """GET /api/pro/social/recommendations returns profiles"""
        response = requests.get(f"{BASE_URL}/api/pro/social/recommendations/test-user-iter50?limit=5")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "recommendations" in data
        print(f"✓ Recommendations returned {len(data['recommendations'])} profiles")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
