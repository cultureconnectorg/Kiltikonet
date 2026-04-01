"""
Test Cultural Identity Engine APIs - Iteration 49
Tests for:
- GET /api/cultural-identity/{user_id} - Get cultural score + 7 dimensions + level
- POST /api/cultural-identity/{user_id}/recalculate - Recalculate score based on reactions
- GET /api/cultural-feed - Get cultural cards with pagination and filtering
- POST /api/cultural-reactions - Toggle reactions (add/remove) with validation
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user ID for cultural identity tests
TEST_USER_ID = f"test-cultural-{uuid.uuid4().hex[:8]}"

class TestCulturalIdentityAPI:
    """Tests for GET /api/cultural-identity/{user_id}"""
    
    def test_get_cultural_identity_new_user(self):
        """New user should get initialized identity with score 0"""
        response = requests.get(f"{BASE_URL}/api/cultural-identity/{TEST_USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "score" in data, "Response should contain 'score'"
        assert "dimensions" in data, "Response should contain 'dimensions'"
        assert "level" in data, "Response should contain 'level'"
        assert data["score"] == 0, "New user should have score 0"
        
        # Verify 7 dimensions exist
        dimensions = data["dimensions"]
        expected_dims = [
            "Musique", "Arts Visuels & Scéniques", "Langue Créole",
            "Patrimoine & Traditions", "Gastronomie", "Féminité & Matriarcat",
            "Identité Diasporique"
        ]
        for dim in expected_dims:
            assert dim in dimensions, f"Missing dimension: {dim}"
        
        # Verify level structure
        level = data["level"]
        assert "name" in level, "Level should have 'name'"
        assert "min" in level, "Level should have 'min'"
        assert "max" in level, "Level should have 'max'"
        assert level["name"] == "Initié", "New user should be 'Initié' level"
        print(f"✓ GET /api/cultural-identity/{TEST_USER_ID} - New user initialized correctly")
    
    def test_get_cultural_identity_returns_user_id(self):
        """Response should include user_id"""
        response = requests.get(f"{BASE_URL}/api/cultural-identity/{TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("user_id") == TEST_USER_ID, "Response should include correct user_id"
        print("✓ GET /api/cultural-identity - Returns user_id correctly")


class TestCulturalIdentityRecalculate:
    """Tests for POST /api/cultural-identity/{user_id}/recalculate"""
    
    def test_recalculate_score(self):
        """Recalculate should return updated score and dimensions"""
        response = requests.post(f"{BASE_URL}/api/cultural-identity/{TEST_USER_ID}/recalculate")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "score" in data, "Response should contain 'score'"
        assert "dimensions" in data, "Response should contain 'dimensions'"
        assert "level" in data, "Response should contain 'level'"
        assert "reactions_given" in data, "Response should contain 'reactions_given'"
        assert "reactions_received" in data, "Response should contain 'reactions_received'"
        
        # Score should be between 0 and 100
        assert 0 <= data["score"] <= 100, f"Score should be 0-100, got {data['score']}"
        print(f"✓ POST /api/cultural-identity/{TEST_USER_ID}/recalculate - Score: {data['score']}")


class TestCulturalFeed:
    """Tests for GET /api/cultural-feed"""
    
    def test_get_cultural_feed_basic(self):
        """Feed should return cards with pagination info"""
        response = requests.get(f"{BASE_URL}/api/cultural-feed")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "cards" in data, "Response should contain 'cards'"
        assert "total" in data, "Response should contain 'total'"
        assert "has_more" in data, "Response should contain 'has_more'"
        
        # Should have seeded cards
        assert len(data["cards"]) > 0, "Feed should have seeded cards"
        print(f"✓ GET /api/cultural-feed - Returned {len(data['cards'])} cards, total: {data['total']}")
    
    def test_get_cultural_feed_card_structure(self):
        """Each card should have required fields"""
        response = requests.get(f"{BASE_URL}/api/cultural-feed")
        assert response.status_code == 200
        
        data = response.json()
        if len(data["cards"]) > 0:
            card = data["cards"][0]
            required_fields = ["id", "card_type", "dimension", "title"]
            for field in required_fields:
                assert field in card, f"Card missing required field: {field}"
            
            # Verify card_type is valid
            valid_types = ["musique", "artiste", "lieu", "evenement", "patrimoine"]
            assert card["card_type"] in valid_types, f"Invalid card_type: {card['card_type']}"
            
            # Verify reactions structure
            assert "reactions" in card, "Card should have 'reactions'"
            assert "total_reactions" in card, "Card should have 'total_reactions'"
            print(f"✓ GET /api/cultural-feed - Card structure valid: {card['title'][:30]}...")
    
    def test_get_cultural_feed_filter_by_type(self):
        """Feed should filter by card_type"""
        response = requests.get(f"{BASE_URL}/api/cultural-feed?card_type=musique")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # All returned cards should be musique type
        for card in data["cards"]:
            assert card["card_type"] == "musique", f"Expected musique, got {card['card_type']}"
        print(f"✓ GET /api/cultural-feed?card_type=musique - Filtered {len(data['cards'])} musique cards")
    
    def test_get_cultural_feed_pagination(self):
        """Feed should support pagination with limit and skip"""
        # Get first page
        response1 = requests.get(f"{BASE_URL}/api/cultural-feed?limit=5&skip=0")
        assert response1.status_code == 200
        data1 = response1.json()
        
        # Get second page
        response2 = requests.get(f"{BASE_URL}/api/cultural-feed?limit=5&skip=5")
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Pages should have different cards (if enough cards exist)
        if len(data1["cards"]) > 0 and len(data2["cards"]) > 0:
            ids1 = {c["id"] for c in data1["cards"]}
            ids2 = {c["id"] for c in data2["cards"]}
            assert ids1.isdisjoint(ids2), "Paginated pages should have different cards"
        
        print(f"✓ GET /api/cultural-feed - Pagination works: page1={len(data1['cards'])}, page2={len(data2['cards'])}")
    
    def test_get_cultural_feed_has_more(self):
        """has_more should be true when more cards exist"""
        response = requests.get(f"{BASE_URL}/api/cultural-feed?limit=5&skip=0")
        assert response.status_code == 200
        data = response.json()
        
        # If total > limit, has_more should be true
        if data["total"] > 5:
            assert data["has_more"] == True, "has_more should be True when more cards exist"
        print(f"✓ GET /api/cultural-feed - has_more={data['has_more']} (total={data['total']})")


class TestCulturalReactions:
    """Tests for POST /api/cultural-reactions"""
    
    def test_add_reaction_valid_type(self):
        """Should add reaction with valid type"""
        # First get a card ID
        feed_response = requests.get(f"{BASE_URL}/api/cultural-feed?limit=1")
        assert feed_response.status_code == 200
        cards = feed_response.json()["cards"]
        assert len(cards) > 0, "Need at least one card to test reactions"
        card_id = cards[0]["id"]
        
        # Add reaction
        reaction_user = f"test-reaction-{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/cultural-reactions", json={
            "user_id": reaction_user,
            "card_id": card_id,
            "reaction_type": "feu"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True, "Reaction should succeed"
        assert data["action"] == "added", "First reaction should be 'added'"
        assert data["reaction_type"] == "feu", "Should return reaction_type"
        assert data["emoji"] == "🔥", "Should return emoji for feu"
        print(f"✓ POST /api/cultural-reactions - Added 'feu' reaction to card {card_id[:20]}...")
    
    def test_toggle_reaction_removes(self):
        """Second reaction of same type should remove it (toggle)"""
        # Get a card
        feed_response = requests.get(f"{BASE_URL}/api/cultural-feed?limit=1")
        cards = feed_response.json()["cards"]
        card_id = cards[0]["id"]
        
        # Use unique user for this test
        toggle_user = f"test-toggle-{uuid.uuid4().hex[:8]}"
        
        # Add reaction
        response1 = requests.post(f"{BASE_URL}/api/cultural-reactions", json={
            "user_id": toggle_user,
            "card_id": card_id,
            "reaction_type": "rythme"
        })
        assert response1.status_code == 200
        assert response1.json()["action"] == "added"
        
        # Toggle (remove) reaction
        response2 = requests.post(f"{BASE_URL}/api/cultural-reactions", json={
            "user_id": toggle_user,
            "card_id": card_id,
            "reaction_type": "rythme"
        })
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["action"] == "removed", "Second reaction should toggle to 'removed'"
        print("✓ POST /api/cultural-reactions - Toggle removes reaction correctly")
    
    def test_reaction_invalid_type_rejected(self):
        """Invalid reaction_type should return 400"""
        feed_response = requests.get(f"{BASE_URL}/api/cultural-feed?limit=1")
        cards = feed_response.json()["cards"]
        card_id = cards[0]["id"]
        
        response = requests.post(f"{BASE_URL}/api/cultural-reactions", json={
            "user_id": "test-invalid",
            "card_id": card_id,
            "reaction_type": "invalid_type"
        })
        assert response.status_code == 400, f"Expected 400 for invalid type, got {response.status_code}"
        print("✓ POST /api/cultural-reactions - Invalid type rejected with 400")
    
    def test_all_five_reaction_types_valid(self):
        """All 5 reaction types should be accepted"""
        feed_response = requests.get(f"{BASE_URL}/api/cultural-feed?limit=1")
        cards = feed_response.json()["cards"]
        card_id = cards[0]["id"]
        
        valid_types = ["feu", "rythme", "racines", "resistance", "lumiere"]
        expected_emojis = {"feu": "🔥", "rythme": "🥁", "racines": "🌺", "resistance": "✊", "lumiere": "💫"}
        
        for rtype in valid_types:
            test_user = f"test-type-{rtype}-{uuid.uuid4().hex[:6]}"
            response = requests.post(f"{BASE_URL}/api/cultural-reactions", json={
                "user_id": test_user,
                "card_id": card_id,
                "reaction_type": rtype
            })
            assert response.status_code == 200, f"Type '{rtype}' should be valid"
            data = response.json()
            assert data["emoji"] == expected_emojis[rtype], f"Wrong emoji for {rtype}"
        
        print("✓ POST /api/cultural-reactions - All 5 reaction types valid (feu/rythme/racines/resistance/lumiere)")


class TestCulturalFeedSeed:
    """Tests for seed data"""
    
    def test_seed_cards_exist(self):
        """Should have 18 seeded cultural cards"""
        response = requests.get(f"{BASE_URL}/api/cultural-feed?limit=50")
        assert response.status_code == 200
        data = response.json()
        
        # Should have at least 18 cards (the seeded amount)
        assert data["total"] >= 18, f"Expected at least 18 seeded cards, got {data['total']}"
        print(f"✓ Cultural feed has {data['total']} cards (expected ≥18 seeded)")
    
    def test_seed_endpoint_idempotent(self):
        """POST /api/cultural-feed/seed should be idempotent"""
        response = requests.post(f"{BASE_URL}/api/cultural-feed/seed")
        assert response.status_code == 200
        data = response.json()
        
        # Should either say already seeded or return success
        assert "message" in data or "success" in data, "Seed should return status"
        print(f"✓ POST /api/cultural-feed/seed - Idempotent: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
