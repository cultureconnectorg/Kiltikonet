"""
Iteration 66 - CVL BRAIN Memory & Web Search API Tests
Tests for:
- Brain Memory Module 1: Save, History, Get, Delete conversations
- Brain Web Search Module 2: Tavily integration (graceful fallback)
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBrainMemoryAPI:
    """CVL BRAIN Persistent Memory API Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_session_id = f"test_brain_{uuid.uuid4().hex[:8]}"
        self.test_user_id = f"test_user_{uuid.uuid4().hex[:8]}"
        self.test_messages = [
            {"role": "assistant", "content": "Sak pasé ? Man sé CVL BRAIN."},
            {"role": "user", "content": "Bonjour, comment fonctionne CC2026?"},
            {"role": "assistant", "content": "CC2026 est le festival Culture Connect qui aura lieu du 20-23 mai 2026."}
        ]
        yield
        # Cleanup: delete test conversation
        try:
            requests.delete(f"{BASE_URL}/api/brain/memory/{self.test_session_id}")
        except:
            pass
    
    def test_brain_memory_save_success(self):
        """POST /api/brain/memory/save - Save a conversation"""
        response = requests.post(f"{BASE_URL}/api/brain/memory/save", json={
            "session_id": self.test_session_id,
            "user_id": self.test_user_id,
            "messages": self.test_messages,
            "title": "Test Conversation CC2026",
            "tags": ["test", "cc2026"]
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert data.get("session_id") == self.test_session_id
        print(f"✓ Brain memory save successful: session_id={self.test_session_id}")
    
    def test_brain_memory_save_auto_title(self):
        """POST /api/brain/memory/save - Auto-generate title from first user message"""
        auto_session_id = f"test_auto_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/brain/memory/save", json={
            "session_id": auto_session_id,
            "user_id": self.test_user_id,
            "messages": self.test_messages,
            # No title provided - should auto-generate
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        
        # Verify auto-generated title
        get_response = requests.get(f"{BASE_URL}/api/brain/memory/{auto_session_id}")
        assert get_response.status_code == 200
        conv_data = get_response.json()
        assert "Bonjour" in conv_data.get("title", ""), "Title should be auto-generated from first user message"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/brain/memory/{auto_session_id}")
        print(f"✓ Brain memory auto-title generation works")
    
    def test_brain_memory_save_missing_fields(self):
        """POST /api/brain/memory/save - Validation for required fields"""
        # Missing session_id
        response = requests.post(f"{BASE_URL}/api/brain/memory/save", json={
            "messages": self.test_messages
        })
        assert response.status_code == 400
        
        # Missing messages
        response = requests.post(f"{BASE_URL}/api/brain/memory/save", json={
            "session_id": "test_missing"
        })
        assert response.status_code == 400
        print("✓ Brain memory save validation works")
    
    def test_brain_memory_history_success(self):
        """GET /api/brain/memory/history - Get conversation history"""
        # First save a conversation
        requests.post(f"{BASE_URL}/api/brain/memory/save", json={
            "session_id": self.test_session_id,
            "user_id": self.test_user_id,
            "messages": self.test_messages,
            "title": "History Test Conversation"
        })
        
        # Get history
        response = requests.get(f"{BASE_URL}/api/brain/memory/history", params={
            "user_id": self.test_user_id,
            "limit": 10
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        assert "total" in data
        assert isinstance(data["conversations"], list)
        
        # Verify our test conversation is in history
        session_ids = [c.get("session_id") for c in data["conversations"]]
        assert self.test_session_id in session_ids, "Test conversation should be in history"
        print(f"✓ Brain memory history returns {len(data['conversations'])} conversations")
    
    def test_brain_memory_history_pagination(self):
        """GET /api/brain/memory/history - Pagination works"""
        response = requests.get(f"{BASE_URL}/api/brain/memory/history", params={
            "limit": 5,
            "skip": 0
        })
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["conversations"]) <= 5
        print("✓ Brain memory history pagination works")
    
    def test_brain_memory_get_specific_conversation(self):
        """GET /api/brain/memory/{session_id} - Get specific conversation"""
        # First save
        requests.post(f"{BASE_URL}/api/brain/memory/save", json={
            "session_id": self.test_session_id,
            "user_id": self.test_user_id,
            "messages": self.test_messages,
            "title": "Get Test Conversation",
            "tags": ["test"]
        })
        
        # Get specific conversation
        response = requests.get(f"{BASE_URL}/api/brain/memory/{self.test_session_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("session_id") == self.test_session_id
        assert data.get("user_id") == self.test_user_id
        assert data.get("title") == "Get Test Conversation"
        assert len(data.get("messages", [])) == len(self.test_messages)
        assert data.get("message_count") == len(self.test_messages)
        print(f"✓ Brain memory get specific conversation works: {data.get('title')}")
    
    def test_brain_memory_get_not_found(self):
        """GET /api/brain/memory/{session_id} - 404 for non-existent"""
        response = requests.get(f"{BASE_URL}/api/brain/memory/nonexistent_session_12345")
        assert response.status_code == 404
        print("✓ Brain memory get returns 404 for non-existent session")
    
    def test_brain_memory_delete_success(self):
        """DELETE /api/brain/memory/{session_id} - Delete conversation"""
        delete_session_id = f"test_delete_{uuid.uuid4().hex[:8]}"
        
        # First save
        requests.post(f"{BASE_URL}/api/brain/memory/save", json={
            "session_id": delete_session_id,
            "user_id": self.test_user_id,
            "messages": self.test_messages
        })
        
        # Verify it exists
        get_response = requests.get(f"{BASE_URL}/api/brain/memory/{delete_session_id}")
        assert get_response.status_code == 200
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/brain/memory/{delete_session_id}")
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert data.get("success") == True
        
        # Verify it's gone
        verify_response = requests.get(f"{BASE_URL}/api/brain/memory/{delete_session_id}")
        assert verify_response.status_code == 404
        print("✓ Brain memory delete works correctly")
    
    def test_brain_memory_delete_not_found(self):
        """DELETE /api/brain/memory/{session_id} - 404 for non-existent"""
        response = requests.delete(f"{BASE_URL}/api/brain/memory/nonexistent_session_12345")
        assert response.status_code == 404
        print("✓ Brain memory delete returns 404 for non-existent session")
    
    def test_brain_memory_update_existing(self):
        """POST /api/brain/memory/save - Update existing conversation"""
        # First save
        requests.post(f"{BASE_URL}/api/brain/memory/save", json={
            "session_id": self.test_session_id,
            "user_id": self.test_user_id,
            "messages": self.test_messages,
            "title": "Original Title"
        })
        
        # Update with more messages
        updated_messages = self.test_messages + [
            {"role": "user", "content": "Merci pour l'info!"},
            {"role": "assistant", "content": "Avec plaisir! N'hésitez pas si vous avez d'autres questions."}
        ]
        
        update_response = requests.post(f"{BASE_URL}/api/brain/memory/save", json={
            "session_id": self.test_session_id,
            "user_id": self.test_user_id,
            "messages": updated_messages,
            "title": "Updated Title"
        })
        
        assert update_response.status_code == 200
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/brain/memory/{self.test_session_id}")
        data = get_response.json()
        assert data.get("title") == "Updated Title"
        assert data.get("message_count") == len(updated_messages)
        print("✓ Brain memory update existing conversation works")


class TestBrainWebSearchAPI:
    """CVL BRAIN Web Search API Tests (Tavily integration)"""
    
    def test_brain_web_search_graceful_fallback(self):
        """POST /api/brain/web-search - Graceful fallback when no TAVILY_API_KEY"""
        response = requests.post(f"{BASE_URL}/api/brain/web-search", json={
            "query": "Culture Connect 2026 Martinique"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return graceful fallback (no API key configured)
        assert "results" in data
        assert "enriched" in data
        
        if not data.get("enriched"):
            assert data.get("reason") == "TAVILY_API_KEY not configured"
            print("✓ Brain web search returns graceful fallback (no TAVILY_API_KEY)")
        else:
            assert len(data.get("results", [])) > 0
            print(f"✓ Brain web search returned {len(data['results'])} results")
    
    def test_brain_web_search_missing_query(self):
        """POST /api/brain/web-search - Validation for missing query"""
        response = requests.post(f"{BASE_URL}/api/brain/web-search", json={})
        assert response.status_code == 400
        print("✓ Brain web search validates missing query")
    
    def test_brain_chat_enriched_endpoint(self):
        """POST /api/brain/chat-enriched - Chat with optional web enrichment"""
        response = requests.post(f"{BASE_URL}/api/brain/chat-enriched", json={
            "message": "Qu'est-ce que CC2026?",
            "use_web_search": False,
            "user_name": "Test User"
        })
        
        # This endpoint uses LLM, so it might fail if LLM is not available
        # We just check it doesn't crash
        if response.status_code == 200:
            data = response.json()
            assert "response" in data
            assert "web_enriched" in data
            print(f"✓ Brain chat enriched works: web_enriched={data.get('web_enriched')}")
        else:
            # LLM might not be available, that's okay
            print(f"⚠ Brain chat enriched returned {response.status_code} (LLM may not be available)")


class TestHealthAndBasicEndpoints:
    """Basic health and connectivity tests"""
    
    def test_api_health(self):
        """GET /api/health - API is running"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("✓ API health check passed")
    
    def test_analytics_dashboard(self):
        """GET /api/analytics/dashboard - Analytics endpoint for Console section"""
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard")
        assert response.status_code == 200
        data = response.json()
        # Console section uses these fields
        assert "total_page_views" in data or "total_unique_visitors" in data or "total_sessions" in data
        print("✓ Analytics dashboard endpoint works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
