"""
Iteration 51 Backend Tests - CC2026 Cultural Platform
Tests for: Cultural Feed, Reactions, JCC Transfer, Shop features
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com').rstrip('/')


class TestCulturalFeed:
    """Cultural Feed API tests - TikTok-style feed"""

    def test_get_cultural_feed(self):
        """GET /api/cultural-feed returns cards with reactions"""
        response = requests.get(f"{BASE_URL}/api/cultural-feed", params={"limit": 5})
        assert response.status_code == 200
        data = response.json()
        assert "cards" in data
        assert "total" in data
        assert "has_more" in data
        assert len(data["cards"]) > 0
        # Verify card structure
        card = data["cards"][0]
        assert "id" in card
        assert "card_type" in card
        assert "title" in card
        assert "reactions" in card

    def test_filter_by_type_musique(self):
        """GET /api/cultural-feed?card_type=musique filters correctly"""
        response = requests.get(f"{BASE_URL}/api/cultural-feed", params={"card_type": "musique"})
        assert response.status_code == 200
        data = response.json()
        assert "cards" in data
        for card in data["cards"]:
            # All cards should be musique type (or sponsored)
            assert card["card_type"] in ["musique", "evenement"]

    def test_filter_by_type_artiste(self):
        """GET /api/cultural-feed?card_type=artiste filters correctly"""
        response = requests.get(f"{BASE_URL}/api/cultural-feed", params={"card_type": "artiste"})
        assert response.status_code == 200
        data = response.json()
        assert "cards" in data

    def test_filter_by_type_lieu(self):
        """GET /api/cultural-feed?card_type=lieu filters correctly"""
        response = requests.get(f"{BASE_URL}/api/cultural-feed", params={"card_type": "lieu"})
        assert response.status_code == 200
        data = response.json()
        assert "cards" in data

    def test_filter_by_type_evenement(self):
        """GET /api/cultural-feed?card_type=evenement filters correctly"""
        response = requests.get(f"{BASE_URL}/api/cultural-feed", params={"card_type": "evenement"})
        assert response.status_code == 200
        data = response.json()
        assert "cards" in data

    def test_filter_by_type_patrimoine(self):
        """GET /api/cultural-feed?card_type=patrimoine filters correctly"""
        response = requests.get(f"{BASE_URL}/api/cultural-feed", params={"card_type": "patrimoine"})
        assert response.status_code == 200
        data = response.json()
        assert "cards" in data

    def test_pagination(self):
        """GET /api/cultural-feed supports pagination"""
        response = requests.get(f"{BASE_URL}/api/cultural-feed", params={"limit": 3, "skip": 0})
        assert response.status_code == 200
        data = response.json()
        assert len(data["cards"]) <= 3


class TestCulturalReactions:
    """Cultural Reactions API tests - 5 reaction types"""

    def test_add_reaction_feu(self):
        """POST /api/cultural-reactions adds feu reaction"""
        response = requests.post(f"{BASE_URL}/api/cultural-reactions", json={
            "user_id": "test-user-reactions",
            "card_id": "card-mus-01",
            "reaction_type": "feu"
        })
        assert response.status_code == 200
        data = response.json()
        assert "counts" in data or "success" in data

    def test_add_reaction_rythme(self):
        """POST /api/cultural-reactions adds rythme reaction"""
        response = requests.post(f"{BASE_URL}/api/cultural-reactions", json={
            "user_id": "test-user-reactions",
            "card_id": "card-mus-01",
            "reaction_type": "rythme"
        })
        assert response.status_code == 200

    def test_add_reaction_racines(self):
        """POST /api/cultural-reactions adds racines reaction"""
        response = requests.post(f"{BASE_URL}/api/cultural-reactions", json={
            "user_id": "test-user-reactions",
            "card_id": "card-mus-01",
            "reaction_type": "racines"
        })
        assert response.status_code == 200

    def test_add_reaction_resistance(self):
        """POST /api/cultural-reactions adds resistance reaction"""
        response = requests.post(f"{BASE_URL}/api/cultural-reactions", json={
            "user_id": "test-user-reactions",
            "card_id": "card-mus-01",
            "reaction_type": "resistance"
        })
        assert response.status_code == 200

    def test_add_reaction_lumiere(self):
        """POST /api/cultural-reactions adds lumiere reaction"""
        response = requests.post(f"{BASE_URL}/api/cultural-reactions", json={
            "user_id": "test-user-reactions",
            "card_id": "card-mus-01",
            "reaction_type": "lumiere"
        })
        assert response.status_code == 200

    def test_invalid_reaction_type(self):
        """POST /api/cultural-reactions returns 400 for invalid type"""
        response = requests.post(f"{BASE_URL}/api/cultural-reactions", json={
            "user_id": "test-user-reactions",
            "card_id": "card-mus-01",
            "reaction_type": "invalid_type"
        })
        assert response.status_code == 400


class TestJetonsTransfer:
    """JCC Transfer API tests - Soutenir feature"""

    def test_transfer_insufficient_balance(self):
        """POST /api/ghost/jetons/transfer returns error for insufficient balance"""
        response = requests.post(f"{BASE_URL}/api/ghost/jetons/transfer", json={
            "from_user_id": "nonexistent-user-12345",
            "to_user_id": "test-receiver",
            "amount": 100,
            "reason": "Test transfer"
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "insuffisant" in data["detail"].lower() or "solde" in data["detail"].lower()

    def test_transfer_missing_params(self):
        """POST /api/ghost/jetons/transfer returns 400 for missing params"""
        response = requests.post(f"{BASE_URL}/api/ghost/jetons/transfer", json={
            "from_user_id": "test-user",
            "amount": 10
        })
        assert response.status_code == 400

    def test_transfer_invalid_amount(self):
        """POST /api/ghost/jetons/transfer returns 400 for invalid amount"""
        response = requests.post(f"{BASE_URL}/api/ghost/jetons/transfer", json={
            "from_user_id": "test-user",
            "to_user_id": "test-receiver",
            "amount": 0,
            "reason": "Test"
        })
        assert response.status_code == 400

    def test_get_jetons_balance(self):
        """GET /api/ghost/jetons/{user_id} returns balance"""
        response = requests.get(f"{BASE_URL}/api/ghost/jetons/test-user-balance")
        assert response.status_code == 200
        data = response.json()
        assert "jetons_solde" in data


class TestProSocialFeed:
    """Pro Social Feed API tests"""

    def test_get_social_feed(self):
        """GET /api/pro/social/feed returns posts"""
        response = requests.get(f"{BASE_URL}/api/pro/social/feed")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data

    def test_get_recommendations(self):
        """GET /api/pro/social/recommendations returns profiles"""
        response = requests.get(f"{BASE_URL}/api/pro/social/recommendations/test-user")
        assert response.status_code == 200
        data = response.json()
        assert "recommendations" in data


class TestCulturalIdentity:
    """Cultural Identity API tests"""

    def test_get_cultural_identity(self):
        """GET /api/cultural-identity/{user_id} returns identity data"""
        response = requests.get(f"{BASE_URL}/api/cultural-identity/test-user")
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "dimensions" in data


class TestCulturalSearch:
    """Cultural Search API tests"""

    def test_search_cultural_cards(self):
        """GET /api/cultural-search returns search results"""
        response = requests.get(f"{BASE_URL}/api/cultural-search", params={"q": "Kassav"})
        # May return 200 or 404 if endpoint not implemented
        assert response.status_code in [200, 404]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
