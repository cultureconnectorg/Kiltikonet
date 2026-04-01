"""
Iteration 42 - Admin Notifications + Mgraph 3D Tests
Tests for:
- P0: Mgraph 3D endpoint with 58+ nodes and 100+ edges
- P1: Admin notifications push system (GET, POST test, POST read-all)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Health check endpoint"""
    
    def test_health_check(self):
        """GET /api/ returns health message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"Health check: {data['message']}")


class TestMgraph3D:
    """Mgraph 3D endpoint tests - P0 feature"""
    
    def test_mgraph_returns_200(self):
        """GET /api/smart-engine/mgraph returns 200"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/mgraph")
        assert response.status_code == 200
        data = response.json()
        assert "nodes" in data
        assert "edges" in data
        print(f"Mgraph: {len(data['nodes'])} nodes, {len(data['edges'])} edges")
    
    def test_mgraph_has_58_plus_nodes(self):
        """Mgraph returns 58+ nodes"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/mgraph")
        assert response.status_code == 200
        data = response.json()
        nodes = data.get("nodes", [])
        assert len(nodes) >= 58, f"Expected 58+ nodes, got {len(nodes)}"
        print(f"Nodes count: {len(nodes)}")
    
    def test_mgraph_has_100_plus_edges(self):
        """Mgraph returns 100+ edges"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/mgraph")
        assert response.status_code == 200
        data = response.json()
        edges = data.get("edges", [])
        assert len(edges) >= 100, f"Expected 100+ edges, got {len(edges)}"
        print(f"Edges count: {len(edges)}")
    
    def test_node_has_required_fields(self):
        """Each node has id, frek_id, label, type, score, org, statut"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/mgraph")
        assert response.status_code == 200
        data = response.json()
        nodes = data.get("nodes", [])
        assert len(nodes) > 0, "No nodes returned"
        
        required_fields = ["id", "frek_id", "label", "type", "score", "org", "statut"]
        for node in nodes[:5]:  # Check first 5 nodes
            for field in required_fields:
                assert field in node, f"Node missing field: {field}"
        print(f"Node fields verified: {required_fields}")
    
    def test_edge_has_required_fields(self):
        """Each edge has source, target, link_type, strength"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/mgraph")
        assert response.status_code == 200
        data = response.json()
        edges = data.get("edges", [])
        assert len(edges) > 0, "No edges returned"
        
        required_fields = ["source", "target", "link_type", "strength"]
        for edge in edges[:5]:  # Check first 5 edges
            for field in required_fields:
                assert field in edge, f"Edge missing field: {field}"
        print(f"Edge fields verified: {required_fields}")


class TestAdminNotifications:
    """Admin notifications endpoints - P1 feature"""
    
    def test_get_notifications(self):
        """GET /api/admin/notifications?limit=5 returns notifications with unread_count"""
        response = requests.get(f"{BASE_URL}/api/admin/notifications?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "unread_count" in data
        assert isinstance(data["notifications"], list)
        assert isinstance(data["unread_count"], int)
        print(f"Notifications: {len(data['notifications'])}, Unread: {data['unread_count']}")
    
    def test_post_test_notification(self):
        """POST /api/admin/notifications/test sends test notification"""
        response = requests.post(f"{BASE_URL}/api/admin/notifications/test")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "sent"
        assert "notification" in data
        notification = data["notification"]
        assert "title" in notification
        assert "message" in notification
        assert "timestamp" in notification
        print(f"Test notification sent: {notification['title']}")
    
    def test_post_read_all_notifications(self):
        """POST /api/admin/notifications/read-all marks all as read"""
        response = requests.post(f"{BASE_URL}/api/admin/notifications/read-all")
        assert response.status_code == 200
        data = response.json()
        assert "marked" in data
        assert isinstance(data["marked"], int)
        print(f"Marked as read: {data['marked']}")
    
    def test_unread_only_filter(self):
        """GET /api/admin/notifications?unread_only=true returns only unread"""
        # First mark all as read
        requests.post(f"{BASE_URL}/api/admin/notifications/read-all")
        
        # Then check unread_only filter
        response = requests.get(f"{BASE_URL}/api/admin/notifications?unread_only=true")
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "unread_count" in data
        # After read-all, unread_count should be 0
        assert data["unread_count"] == 0, f"Expected 0 unread, got {data['unread_count']}"
        print(f"Unread only filter works: {len(data['notifications'])} notifications, {data['unread_count']} unread")
    
    def test_notification_flow_complete(self):
        """Full flow: send test -> verify unread -> mark read -> verify read"""
        # Step 1: Send test notification
        send_response = requests.post(f"{BASE_URL}/api/admin/notifications/test")
        assert send_response.status_code == 200
        assert send_response.json().get("status") == "sent"
        print("Step 1: Test notification sent")
        
        # Step 2: Verify unread count increased
        get_response = requests.get(f"{BASE_URL}/api/admin/notifications?limit=5")
        assert get_response.status_code == 200
        unread_before = get_response.json().get("unread_count", 0)
        assert unread_before >= 1, f"Expected at least 1 unread, got {unread_before}"
        print(f"Step 2: Unread count = {unread_before}")
        
        # Step 3: Mark all as read
        read_response = requests.post(f"{BASE_URL}/api/admin/notifications/read-all")
        assert read_response.status_code == 200
        marked = read_response.json().get("marked", 0)
        print(f"Step 3: Marked {marked} as read")
        
        # Step 4: Verify unread is now 0
        verify_response = requests.get(f"{BASE_URL}/api/admin/notifications?unread_only=true")
        assert verify_response.status_code == 200
        unread_after = verify_response.json().get("unread_count", 0)
        assert unread_after == 0, f"Expected 0 unread after read-all, got {unread_after}"
        print(f"Step 4: Unread count after read-all = {unread_after}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
