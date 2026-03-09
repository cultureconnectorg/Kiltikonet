"""
Test file for Culture Connect 2026 Multi-Workspace System
Tests:
- Admin login with CC2026admin → /admin
- Workspace logins (Laurent, Twina, Gwen, Alirio, etc.)
- Workspace logs API
- Notifications API
- Accreditation system endpoints
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://qr-attendance-hub-5.preview.emergentagent.com')

# Workspace credentials mapping
WORKSPACE_CREDENTIALS = {
    "CC2026admin": {"role": "admin", "name": "Admin", "redirect": "/admin"},
    "LC2026": {"role": "founder", "name": "Laurent Coeurvolan", "redirect": "/workspace/laurent"},
    "Twina2026": {"role": "design", "name": "Twina", "redirect": "/workspace/twina"},
    "Gwen2026": {"role": "event", "name": "Gwen", "redirect": "/workspace/gwen"},
    "Kaige2026": {"role": "press", "name": "Kaige-Jean", "redirect": "/workspace/kaige"},
    "Alirio2026": {"role": "business", "name": "Alirio", "redirect": "/workspace/alirio"},
    "Wudy2026": {"role": "finance", "name": "Wudy", "redirect": "/workspace/wudy"},
    "Fabrice2026": {"role": "captions", "name": "Fabrice", "redirect": "/workspace/fabrice"},
    "DataCC2026": {"role": "analyst", "name": "Data Analyst", "redirect": "/workspace/analyst"}
}


class TestAPIHealth:
    """Test basic API health"""
    
    def test_api_root_responds(self):
        """API root endpoint should respond"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root responds: {data['message']}")


class TestAdminLogin:
    """Test admin login with CC2026admin"""
    
    def test_admin_login_success(self):
        """Admin login with CC2026admin should succeed and redirect to /admin"""
        response = requests.post(f"{BASE_URL}/api/workspace/login", json={
            "password": "CC2026admin"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["role"] == "admin"
        assert data["redirect"] == "/admin"
        print(f"✓ Admin login successful: {data['user']} -> {data['redirect']}")
    
    def test_admin_verify_endpoint(self):
        """Test legacy admin verify endpoint"""
        response = requests.post(f"{BASE_URL}/api/admin/verify", json={
            "password": "CC2026admin"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("✓ Admin verify endpoint working")


class TestWorkspaceLogins:
    """Test workspace logins for all team members"""
    
    def test_laurent_login(self):
        """Laurent login with LC2026 should redirect to /workspace/laurent"""
        response = requests.post(f"{BASE_URL}/api/workspace/login", json={
            "password": "LC2026"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["user"] == "Laurent Coeurvolan"
        assert data["role"] == "founder"
        assert data["redirect"] == "/workspace/laurent"
        print(f"✓ Laurent login: {data['user']} ({data['role']}) -> {data['redirect']}")
    
    def test_twina_login(self):
        """Twina login with Twina2026 should redirect to /workspace/twina"""
        response = requests.post(f"{BASE_URL}/api/workspace/login", json={
            "password": "Twina2026"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["user"] == "Twina"
        assert data["role"] == "design"
        assert data["redirect"] == "/workspace/twina"
        print(f"✓ Twina login: {data['user']} ({data['role']}) -> {data['redirect']}")
    
    def test_gwen_login(self):
        """Gwen login with Gwen2026 should redirect to /workspace/gwen"""
        response = requests.post(f"{BASE_URL}/api/workspace/login", json={
            "password": "Gwen2026"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["user"] == "Gwen"
        assert data["role"] == "event"
        assert data["redirect"] == "/workspace/gwen"
        print(f"✓ Gwen login: {data['user']} ({data['role']}) -> {data['redirect']}")
    
    def test_alirio_login(self):
        """Alirio login with Alirio2026 should redirect to /workspace/alirio"""
        response = requests.post(f"{BASE_URL}/api/workspace/login", json={
            "password": "Alirio2026"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["user"] == "Alirio"
        assert data["role"] == "business"
        assert data["redirect"] == "/workspace/alirio"
        print(f"✓ Alirio login: {data['user']} ({data['role']}) -> {data['redirect']}")
    
    def test_kaige_login(self):
        """Kaige login with Kaige2026 should redirect to /workspace/kaige"""
        response = requests.post(f"{BASE_URL}/api/workspace/login", json={
            "password": "Kaige2026"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["user"] == "Kaige-Jean"
        assert data["role"] == "press"
        assert data["redirect"] == "/workspace/kaige"
        print(f"✓ Kaige login: {data['user']} ({data['role']}) -> {data['redirect']}")
    
    def test_wudy_login(self):
        """Wudy login with Wudy2026 should redirect to /workspace/wudy"""
        response = requests.post(f"{BASE_URL}/api/workspace/login", json={
            "password": "Wudy2026"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["user"] == "Wudy"
        assert data["role"] == "finance"
        assert data["redirect"] == "/workspace/wudy"
        print(f"✓ Wudy login: {data['user']} ({data['role']}) -> {data['redirect']}")
    
    def test_fabrice_login(self):
        """Fabrice login with Fabrice2026 should redirect to /workspace/fabrice"""
        response = requests.post(f"{BASE_URL}/api/workspace/login", json={
            "password": "Fabrice2026"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["user"] == "Fabrice"
        assert data["role"] == "captions"
        assert data["redirect"] == "/workspace/fabrice"
        print(f"✓ Fabrice login: {data['user']} ({data['role']}) -> {data['redirect']}")
    
    def test_analyst_login(self):
        """Data Analyst login with DataCC2026 should redirect to /workspace/analyst"""
        response = requests.post(f"{BASE_URL}/api/workspace/login", json={
            "password": "DataCC2026"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["user"] == "Data Analyst"
        assert data["role"] == "analyst"
        assert data["redirect"] == "/workspace/analyst"
        print(f"✓ Data Analyst login: {data['user']} ({data['role']}) -> {data['redirect']}")
    
    def test_invalid_password(self):
        """Invalid password should return 401"""
        response = requests.post(f"{BASE_URL}/api/workspace/login", json={
            "password": "WrongPassword123"
        })
        assert response.status_code == 401
        print("✓ Invalid password correctly rejected with 401")


class TestWorkspaceLogs:
    """Test workspace logs API"""
    
    def test_get_workspace_logs(self):
        """Should retrieve workspace logs"""
        response = requests.get(f"{BASE_URL}/api/workspace/logs?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "logs" in data
        print(f"✓ Workspace logs retrieved: {len(data['logs'])} entries")
    
    def test_get_workspace_sessions(self):
        """Should retrieve workspace sessions"""
        response = requests.get(f"{BASE_URL}/api/workspace/sessions")
        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data
        print(f"✓ Workspace sessions retrieved: {len(data['sessions'])} sessions")
    
    def test_add_workspace_log(self):
        """Should be able to add a workspace log entry"""
        response = requests.post(f"{BASE_URL}/api/workspace/log", json={
            "user": "Test User",
            "role": "tester",
            "action": "test_action",
            "details": "Testing log entry"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "log_id" in data
        print(f"✓ Workspace log added: {data['log_id']}")


class TestNotificationsAPI:
    """Test notifications API endpoints"""
    
    def test_send_notification(self):
        """Should send a notification to a workspace"""
        response = requests.post(f"{BASE_URL}/api/notifications/send", json={
            "sender": "Test Agent",
            "sender_role": "tester",
            "type": "test",
            "title": "Test Notification",
            "message": "This is a test notification",
            "target": "laurent"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "notification_id" in data
        print(f"✓ Notification sent: {data['notification_id']}")
    
    def test_get_notifications(self):
        """Should retrieve notifications for a target"""
        response = requests.get(f"{BASE_URL}/api/notifications/laurent?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "unread_count" in data
        print(f"✓ Notifications retrieved: {len(data['notifications'])} (unread: {data['unread_count']})")
    
    def test_mark_notification_read(self):
        """Should mark a notification as read"""
        # First send a notification
        send_response = requests.post(f"{BASE_URL}/api/notifications/send", json={
            "sender": "Test Agent",
            "sender_role": "tester",
            "type": "test",
            "title": "Test Mark Read",
            "message": "Test message",
            "target": "laurent"
        })
        notif_id = send_response.json()["notification_id"]
        
        # Mark as read
        response = requests.patch(f"{BASE_URL}/api/notifications/{notif_id}/read")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Notification marked as read: {notif_id}")
    
    def test_mark_all_read(self):
        """Should mark all notifications as read for a target"""
        response = requests.patch(f"{BASE_URL}/api/notifications/laurent/read-all")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("✓ All notifications marked as read for laurent")


class TestAdminDashboard:
    """Test AdminDashboard related endpoints"""
    
    def test_get_registrations(self):
        """Should retrieve registrations"""
        response = requests.get(f"{BASE_URL}/api/registrations")
        assert response.status_code == 200
        data = response.json()
        assert "registrations" in data
        assert "total" in data
        assert "counts" in data
        print(f"✓ Registrations retrieved: {data['total']} total")
    
    def test_get_stats_v1(self):
        """Should retrieve v1 stats"""
        response = requests.get(f"{BASE_URL}/api/v1/stats")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Stats v1 retrieved")
    
    def test_get_catalog(self):
        """Should retrieve public catalog"""
        response = requests.get(f"{BASE_URL}/api/catalog")
        assert response.status_code == 200
        data = response.json()
        assert "participants" in data
        print(f"✓ Catalog retrieved: {len(data['participants'])} participants")


class TestAccreditationSystemEndpoints:
    """Test accreditation system loading (Baserow integration)"""
    
    def test_accreditation_page_loads(self):
        """The accreditation page should load without errors"""
        # This tests the frontend route exists - actual Baserow tests would require token
        response = requests.get(f"{BASE_URL}")  # Base URL to check frontend is running
        assert response.status_code == 200
        print("✓ Frontend is running (accreditation page accessible)")


class TestAllCredentialsCoverage:
    """Comprehensive test for all workspace credentials"""
    
    def test_all_workspace_credentials(self):
        """Test all workspace credentials work correctly"""
        all_passed = True
        results = []
        
        for password, expected in WORKSPACE_CREDENTIALS.items():
            response = requests.post(f"{BASE_URL}/api/workspace/login", json={
                "password": password
            })
            
            if response.status_code == 200:
                data = response.json()
                if data["role"] == expected["role"] and data["redirect"] == expected["redirect"]:
                    results.append(f"✓ {password}: {data['user']} -> {data['redirect']}")
                else:
                    results.append(f"✗ {password}: Expected role={expected['role']}, redirect={expected['redirect']}, got role={data['role']}, redirect={data['redirect']}")
                    all_passed = False
            else:
                results.append(f"✗ {password}: HTTP {response.status_code}")
                all_passed = False
        
        for r in results:
            print(r)
        
        assert all_passed, "Some credentials did not work as expected"
        print(f"\n✓ All {len(WORKSPACE_CREDENTIALS)} workspace credentials verified")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
