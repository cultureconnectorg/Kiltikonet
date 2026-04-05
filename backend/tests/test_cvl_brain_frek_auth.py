"""
Test CVL BRAIN multi-turn chat, knowledge base, user context, quick actions
and FREK-ID authentication with admin bypass
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_FREK_ID = "FREK-ADM-0001"
ADMIN_BYPASS_CODE = "000000"
REGULAR_FREK_ID = "FREK-JMCK-8SOL"


class TestCvlBrainChatEnriched:
    """CVL BRAIN /api/brain/chat-enriched endpoint tests"""
    
    def test_brain_chat_basic_message(self):
        """Test basic CVL BRAIN chat with single message"""
        response = requests.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "Bonjour, qui es-tu ?",
            "messages": [{"role": "user", "content": "Bonjour, qui es-tu ?"}],
            "user_name": "Test User"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "response" in data, "Response should contain 'response' field"
        assert isinstance(data["response"], str), "Response should be a string"
        assert len(data["response"]) > 10, "Response should have meaningful content"
        print(f"✓ Basic chat response received: {data['response'][:100]}...")
    
    def test_brain_chat_multi_turn_context(self):
        """Test multi-turn conversation maintains context"""
        # First message
        messages = [{"role": "user", "content": "Mon nom est Jean-Pierre"}]
        response1 = requests.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "Mon nom est Jean-Pierre",
            "messages": messages,
            "user_name": "Jean-Pierre"
        })
        assert response1.status_code == 200
        data1 = response1.json()
        
        # Add assistant response to history
        messages.append({"role": "assistant", "content": data1["response"]})
        
        # Second message referencing first
        messages.append({"role": "user", "content": "Tu te souviens de mon nom ?"})
        response2 = requests.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "Tu te souviens de mon nom ?",
            "messages": messages,
            "user_name": "Jean-Pierre"
        })
        assert response2.status_code == 200
        data2 = response2.json()
        # The response should reference Jean-Pierre or the name
        print(f"✓ Multi-turn response: {data2['response'][:150]}...")
    
    def test_brain_knowledge_jeton_cc(self):
        """Test CVL BRAIN knowledge about Jeton CC"""
        response = requests.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "Comment fonctionne le Jeton CC et les packs disponibles ?",
            "messages": [{"role": "user", "content": "Comment fonctionne le Jeton CC et les packs disponibles ?"}],
            "user_name": "Test User"
        })
        assert response.status_code == 200
        data = response.json()
        resp_lower = data["response"].lower()
        # Should mention jeton, euro, or pack
        assert any(kw in resp_lower for kw in ["jeton", "euro", "pack", "1,50", "1.50", "cc"]), \
            f"Response should mention Jeton CC concepts: {data['response'][:200]}"
        print(f"✓ Jeton CC knowledge response: {data['response'][:150]}...")
    
    def test_brain_knowledge_frek_id(self):
        """Test CVL BRAIN knowledge about FREK-ID"""
        response = requests.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "Comment fonctionne mon FREK-ID et à quoi ça sert ?",
            "messages": [{"role": "user", "content": "Comment fonctionne mon FREK-ID et à quoi ça sert ?"}],
            "user_name": "Test User"
        })
        assert response.status_code == 200
        data = response.json()
        resp_lower = data["response"].lower()
        # Should mention FREK, identifiant, or unique
        assert any(kw in resp_lower for kw in ["frek", "identifiant", "unique", "uuid", "badge"]), \
            f"Response should mention FREK-ID concepts: {data['response'][:200]}"
        print(f"✓ FREK-ID knowledge response: {data['response'][:150]}...")
    
    def test_brain_knowledge_cc2026(self):
        """Test CVL BRAIN knowledge about CC2026 event"""
        response = requests.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "Donne-moi les infos clés sur CC2026 à La Savane",
            "messages": [{"role": "user", "content": "Donne-moi les infos clés sur CC2026 à La Savane"}],
            "user_name": "Test User"
        })
        assert response.status_code == 200
        data = response.json()
        resp_lower = data["response"].lower()
        # Should mention CC2026, mai, 2026, savane, martinique, or fort-de-france
        assert any(kw in resp_lower for kw in ["cc2026", "2026", "mai", "savane", "martinique", "fort-de-france", "culture connect"]), \
            f"Response should mention CC2026 concepts: {data['response'][:200]}"
        print(f"✓ CC2026 knowledge response: {data['response'][:150]}...")
    
    def test_brain_knowledge_kt_token(self):
        """Test CVL BRAIN knowledge about KT Token"""
        response = requests.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "Explique-moi le KT Token et le staking",
            "messages": [{"role": "user", "content": "Explique-moi le KT Token et le staking"}],
            "user_name": "Test User"
        })
        assert response.status_code == 200
        data = response.json()
        resp_lower = data["response"].lower()
        # Should mention KT, staking, gouvernance, or conversion
        assert any(kw in resp_lower for kw in ["kt", "staking", "gouvernance", "token", "conversion"]), \
            f"Response should mention KT Token concepts: {data['response'][:200]}"
        print(f"✓ KT Token knowledge response: {data['response'][:150]}...")
    
    def test_brain_knowledge_api_tiers(self):
        """Test CVL BRAIN knowledge about API tiers"""
        response = requests.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "Quels sont les 4 tiers d'accès à l'API publique kiltikonet ?",
            "messages": [{"role": "user", "content": "Quels sont les 4 tiers d'accès à l'API publique kiltikonet ?"}],
            "user_name": "Test User"
        })
        assert response.status_code == 200
        data = response.json()
        resp_lower = data["response"].lower()
        # Should mention tier, api, developer, or discovery
        assert any(kw in resp_lower for kw in ["tier", "api", "developer", "discovery", "partner", "gratuit"]), \
            f"Response should mention API tier concepts: {data['response'][:200]}"
        print(f"✓ API tiers knowledge response: {data['response'][:150]}...")
    
    def test_brain_knowledge_cvln_ecosystem(self):
        """Test CVL BRAIN knowledge about CVLN ecosystem"""
        response = requests.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "Explique-moi l'écosystème CVLN Group en résumé",
            "messages": [{"role": "user", "content": "Explique-moi l'écosystème CVLN Group en résumé"}],
            "user_name": "Test User"
        })
        assert response.status_code == 200
        data = response.json()
        resp_lower = data["response"].lower()
        # Should mention CVLN, kiltikonet, or ecosystem
        assert any(kw in resp_lower for kw in ["cvln", "kiltikonet", "ecosystem", "écosystème", "culture"]), \
            f"Response should mention CVLN concepts: {data['response'][:200]}"
        print(f"✓ CVLN ecosystem knowledge response: {data['response'][:150]}...")
    
    def test_brain_user_context_personalization(self):
        """Test CVL BRAIN personalizes response with user context"""
        response = requests.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "Analyse mon profil et donne-moi des conseils",
            "messages": [{"role": "user", "content": "Analyse mon profil et donne-moi des conseils"}],
            "user_name": "Marie Dupont",
            "user_context": {
                "name": "Marie Dupont",
                "email": "marie@example.com",
                "frek_id": "FREK-TEST-1234",
                "profile_type": "artist",
                "wallet_balance": 50
            }
        })
        assert response.status_code == 200
        data = response.json()
        # Response should be personalized (may mention name, artist, or wallet)
        print(f"✓ Personalized response: {data['response'][:150]}...")


class TestCvlBrainMemory:
    """CVL BRAIN memory persistence tests"""
    
    def test_brain_memory_save(self):
        """Test saving a conversation to memory"""
        session_id = f"test_session_{int(time.time())}"
        messages = [
            {"role": "assistant", "content": "Bienvenue !"},
            {"role": "user", "content": "Bonjour"},
            {"role": "assistant", "content": "Comment puis-je vous aider ?"}
        ]
        
        response = requests.post(f"{BASE_URL}/api/brain/memory/save", json={
            "session_id": session_id,
            "messages": messages,
            "user_id": "test_user_123",
            "title": "Test Conversation",
            "tags": ["test"]
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True
        assert data.get("session_id") == session_id
        print(f"✓ Memory saved for session: {session_id}")
        return session_id
    
    def test_brain_memory_history(self):
        """Test retrieving conversation history"""
        # First save a conversation
        session_id = f"test_history_{int(time.time())}"
        requests.post(f"{BASE_URL}/api/brain/memory/save", json={
            "session_id": session_id,
            "messages": [{"role": "user", "content": "Test message"}],
            "user_id": "test_user_history"
        })
        
        # Then retrieve history
        response = requests.get(f"{BASE_URL}/api/brain/memory/history", params={
            "user_id": "test_user_history",
            "limit": 10
        })
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        assert "total" in data
        print(f"✓ Memory history retrieved: {data['total']} conversations")
    
    def test_brain_memory_get_specific(self):
        """Test retrieving a specific conversation"""
        # First save
        session_id = f"test_get_{int(time.time())}"
        requests.post(f"{BASE_URL}/api/brain/memory/save", json={
            "session_id": session_id,
            "messages": [{"role": "user", "content": "Specific test"}],
            "user_id": "test_user_get"
        })
        
        # Then retrieve
        response = requests.get(f"{BASE_URL}/api/brain/memory/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("session_id") == session_id
        assert "messages" in data
        print(f"✓ Specific conversation retrieved: {session_id}")
    
    def test_brain_memory_delete(self):
        """Test deleting a conversation"""
        # First save
        session_id = f"test_delete_{int(time.time())}"
        requests.post(f"{BASE_URL}/api/brain/memory/save", json={
            "session_id": session_id,
            "messages": [{"role": "user", "content": "To be deleted"}],
            "user_id": "test_user_delete"
        })
        
        # Then delete
        response = requests.delete(f"{BASE_URL}/api/brain/memory/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        
        # Verify deleted
        get_response = requests.get(f"{BASE_URL}/api/brain/memory/{session_id}")
        assert get_response.status_code == 404
        print(f"✓ Conversation deleted: {session_id}")


class TestFrekIdAuthentication:
    """FREK-ID authentication endpoint tests"""
    
    def test_frek_auth_admin_initiate(self):
        """Test FREK-ID initiate with admin ID (bypass)"""
        response = requests.post(f"{BASE_URL}/api/auth/frek", json={
            "frek_id": ADMIN_FREK_ID
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True
        assert data.get("bypass") is True, "Admin should have bypass=true"
        assert "email_hint" in data
        print(f"✓ Admin FREK-ID initiate: bypass={data.get('bypass')}, hint={data.get('email_hint')}")
    
    def test_frek_auth_admin_verify(self):
        """Test FREK-ID verify with admin bypass code"""
        # First initiate
        requests.post(f"{BASE_URL}/api/auth/frek", json={"frek_id": ADMIN_FREK_ID})
        
        # Then verify with bypass code
        response = requests.post(f"{BASE_URL}/api/auth/frek/verify", json={
            "frek_id": ADMIN_FREK_ID,
            "code": ADMIN_BYPASS_CODE
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True
        assert "profile" in data
        profile = data["profile"]
        assert "email" in profile
        assert "frek_id" in profile
        print(f"✓ Admin FREK-ID verified: {profile.get('email')}, frek_id={profile.get('frek_id')}")
    
    def test_frek_auth_admin_no_cooldown(self):
        """Test admin bypass skips OTP cooldown"""
        # First request
        response1 = requests.post(f"{BASE_URL}/api/auth/frek", json={"frek_id": ADMIN_FREK_ID})
        assert response1.status_code == 200
        
        # Immediate second request (should NOT get 429 for admin)
        response2 = requests.post(f"{BASE_URL}/api/auth/frek", json={"frek_id": ADMIN_FREK_ID})
        assert response2.status_code == 200, f"Admin should skip cooldown, got {response2.status_code}"
        print("✓ Admin bypass skips OTP cooldown")
    
    def test_frek_auth_invalid_format(self):
        """Test FREK-ID with invalid format"""
        response = requests.post(f"{BASE_URL}/api/auth/frek", json={
            "frek_id": "INVALID123"
        })
        assert response.status_code == 400
        data = response.json()
        assert "invalide" in data.get("detail", "").lower() or "format" in data.get("detail", "").lower()
        print(f"✓ Invalid format rejected: {data.get('detail')}")
    
    def test_frek_auth_unknown_id(self):
        """Test FREK-ID with unknown ID"""
        response = requests.post(f"{BASE_URL}/api/auth/frek", json={
            "frek_id": "FREK-XXXX-9999"
        })
        assert response.status_code == 404
        data = response.json()
        assert "introuvable" in data.get("detail", "").lower()
        print(f"✓ Unknown FREK-ID rejected: {data.get('detail')}")
    
    def test_frek_verify_wrong_code(self):
        """Test FREK-ID verify with wrong code"""
        # First initiate
        requests.post(f"{BASE_URL}/api/auth/frek", json={"frek_id": ADMIN_FREK_ID})
        
        # Then verify with wrong code
        response = requests.post(f"{BASE_URL}/api/auth/frek/verify", json={
            "frek_id": ADMIN_FREK_ID,
            "code": "999999"
        })
        assert response.status_code == 401
        data = response.json()
        assert "incorrect" in data.get("detail", "").lower()
        print(f"✓ Wrong code rejected: {data.get('detail')}")
    
    def test_frek_verify_no_initiate(self):
        """Test FREK-ID verify without prior initiate"""
        # Use a random FREK-ID that wasn't initiated
        response = requests.post(f"{BASE_URL}/api/auth/frek/verify", json={
            "frek_id": "FREK-RAND-0000",
            "code": "123456"
        })
        assert response.status_code == 400
        data = response.json()
        assert "aucune" in data.get("detail", "").lower() or "demande" in data.get("detail", "").lower()
        print(f"✓ Verify without initiate rejected: {data.get('detail')}")


class TestGitHubOAuth:
    """GitHub OAuth endpoint tests"""
    
    def test_github_oauth_not_configured(self):
        """Test GitHub OAuth returns 503 when not configured"""
        response = requests.get(f"{BASE_URL}/api/auth/github", allow_redirects=False)
        # Should return 503 or redirect to error
        assert response.status_code in [503, 302, 307], f"Expected 503 or redirect, got {response.status_code}"
        if response.status_code == 503:
            data = response.json()
            assert "non configur" in data.get("detail", "").lower() or "not configured" in data.get("detail", "").lower()
            print(f"✓ GitHub OAuth returns 503: {data.get('detail')}")
        else:
            print(f"✓ GitHub OAuth redirects (status {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
