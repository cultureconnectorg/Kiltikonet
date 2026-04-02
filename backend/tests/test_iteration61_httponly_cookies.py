"""
Iteration 61 - httpOnly Cookie Migration Tests
Tests for P2-2: Migration from localStorage to httpOnly cookies

Key features to test:
1. CORS accepts requests with credentials from preview URL
2. POST /api/admin/verify sets httpOnly cookie (kk_session)
3. GET /api/auth/me returns authenticated=true with valid cookie
4. GET /api/auth/me returns authenticated=false without cookie
5. POST /api/auth/logout clears the cookie
6. POST /api/pro/verify-code sets httpOnly cookie for Pro users
7. POST /api/workspace/login sets httpOnly cookie
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_PASSWORD = "CC2026admin"
PRO_EMAIL = "cultureconnectorg@gmail.com"
PRO_OTP_BYPASS = "000000"


class TestCORSConfiguration:
    """Test CORS is properly configured for credentials"""
    
    def test_cors_with_credentials_on_actual_request(self):
        """Test CORS allows credentials on actual POST request (not just preflight)"""
        # Test actual POST request with Origin header - this is what matters for cookies
        response = requests.post(
            f"{BASE_URL}/api/admin/verify",
            json={"password": ADMIN_PASSWORD},
            headers={
                "Origin": "https://tarifs-update.preview.emergentagent.com",
                "Content-Type": "application/json"
            }
        )
        assert response.status_code == 200, f"Request failed: {response.status_code}"
        
        # Check CORS headers on actual response
        headers_lower = {k.lower(): v for k, v in response.headers.items()}
        assert headers_lower.get("access-control-allow-credentials") == "true", \
            f"Missing Access-Control-Allow-Credentials header. Headers: {dict(response.headers)}"
        
        # Verify cookie was set
        assert "set-cookie" in headers_lower, "No Set-Cookie header in response"
        assert "kk_session" in headers_lower.get("set-cookie", ""), "kk_session cookie not in Set-Cookie"
        print("CORS with credentials test passed - cookie set correctly")


class TestAdminVerifyEndpoint:
    """Test /api/admin/verify sets httpOnly cookie"""
    
    def test_admin_verify_sets_cookie(self):
        """POST /api/admin/verify should set kk_session httpOnly cookie"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/admin/verify",
            json={"password": ADMIN_PASSWORD}
        )
        
        assert response.status_code == 200, f"Admin verify failed: {response.status_code} - {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Admin verify did not return success: {data}"
        
        # Check cookie was set
        cookies = session.cookies.get_dict()
        assert "kk_session" in cookies, f"kk_session cookie not set. Cookies: {cookies}"
        print(f"Admin verify passed - cookie set: kk_session={cookies.get('kk_session', '')[:20]}...")
        
        return session  # Return session for chained tests
    
    def test_admin_verify_invalid_password(self):
        """POST /api/admin/verify with wrong password should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/admin/verify",
            json={"password": "wrong_password"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Admin verify with invalid password correctly returns 401")


class TestWorkspaceLoginEndpoint:
    """Test /api/workspace/login sets httpOnly cookie"""
    
    def test_workspace_login_sets_cookie(self):
        """POST /api/workspace/login should set kk_session httpOnly cookie"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/workspace/login",
            json={"password": ADMIN_PASSWORD}
        )
        
        assert response.status_code == 200, f"Workspace login failed: {response.status_code} - {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Workspace login did not return success: {data}"
        assert data.get("role") == "admin", f"Expected admin role, got: {data.get('role')}"
        
        # Check cookie was set
        cookies = session.cookies.get_dict()
        assert "kk_session" in cookies, f"kk_session cookie not set. Cookies: {cookies}"
        print(f"Workspace login passed - role={data.get('role')}, cookie set")
        
        return session
    
    def test_workspace_login_invalid_password(self):
        """POST /api/workspace/login with wrong password should return 401"""
        response = requests.post(
            f"{BASE_URL}/api/workspace/login",
            json={"password": "wrong_password"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Workspace login with invalid password correctly returns 401")


class TestAuthMeEndpoint:
    """Test /api/auth/me endpoint"""
    
    def test_auth_me_without_cookie(self):
        """GET /api/auth/me without cookie should return authenticated=false"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        
        # Should return 401 with authenticated=false
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert data.get("authenticated") == False, f"Expected authenticated=false, got: {data}"
        print("Auth me without cookie correctly returns authenticated=false")
    
    def test_auth_me_with_valid_cookie(self):
        """GET /api/auth/me with valid cookie should return authenticated=true"""
        # First login to get cookie
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/admin/verify",
            json={"password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.status_code}"
        
        # Now check auth/me
        response = session.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 200, f"Auth me failed: {response.status_code} - {response.text}"
        data = response.json()
        assert data.get("authenticated") == True, f"Expected authenticated=true, got: {data}"
        assert "session" in data, f"Expected session data, got: {data}"
        assert data["session"].get("role") == "admin", f"Expected admin role in session, got: {data['session']}"
        print(f"Auth me with valid cookie passed - session: {data.get('session')}")


class TestAuthLogoutEndpoint:
    """Test /api/auth/logout endpoint"""
    
    def test_logout_clears_cookie(self):
        """POST /api/auth/logout should clear the session cookie"""
        # First login to get cookie
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/admin/verify",
            json={"password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.status_code}"
        
        # Verify we have the cookie
        cookies_before = session.cookies.get_dict()
        assert "kk_session" in cookies_before, "Cookie not set after login"
        
        # Now logout
        logout_response = session.post(f"{BASE_URL}/api/auth/logout")
        assert logout_response.status_code == 200, f"Logout failed: {logout_response.status_code}"
        data = logout_response.json()
        assert data.get("success") == True, f"Logout did not return success: {data}"
        
        # Verify auth/me now returns unauthenticated
        # Note: The cookie might still be in the session but should be invalidated server-side
        # or the Set-Cookie header should clear it
        auth_response = session.get(f"{BASE_URL}/api/auth/me")
        # After logout, should be unauthenticated
        assert auth_response.status_code == 401 or auth_response.json().get("authenticated") == False, \
            f"Expected unauthenticated after logout, got: {auth_response.status_code} - {auth_response.text}"
        print("Logout correctly clears session")


class TestProVerifyCodeEndpoint:
    """Test /api/pro/verify-code sets httpOnly cookie for Pro users"""
    
    def test_pro_request_access(self):
        """POST /api/pro/request-access should send OTP"""
        response = requests.post(
            f"{BASE_URL}/api/pro/request-access",
            json={"email": PRO_EMAIL}
        )
        # Should succeed (email sending is mocked in sandbox)
        assert response.status_code == 200, f"Request access failed: {response.status_code} - {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Request access did not return success: {data}"
        print(f"Pro request access passed for {PRO_EMAIL}")
    
    def test_pro_verify_code_sets_cookie(self):
        """POST /api/pro/verify-code should set kk_session httpOnly cookie"""
        session = requests.Session()
        
        # First request access code
        request_response = session.post(
            f"{BASE_URL}/api/pro/request-access",
            json={"email": PRO_EMAIL}
        )
        assert request_response.status_code == 200, f"Request access failed: {request_response.status_code}"
        
        # Verify with bypass code (000000)
        verify_response = session.post(
            f"{BASE_URL}/api/pro/verify-code",
            json={"email": PRO_EMAIL, "code": PRO_OTP_BYPASS}
        )
        
        assert verify_response.status_code == 200, f"Pro verify failed: {verify_response.status_code} - {verify_response.text}"
        data = verify_response.json()
        assert data.get("success") == True, f"Pro verify did not return success: {data}"
        assert "profile" in data, f"Expected profile in response: {data}"
        
        # Check cookie was set
        cookies = session.cookies.get_dict()
        assert "kk_session" in cookies, f"kk_session cookie not set for Pro. Cookies: {cookies}"
        print(f"Pro verify code passed - profile: {data.get('profile', {}).get('full_name', 'N/A')}, cookie set")
        
        # Verify auth/me works with this cookie
        auth_response = session.get(f"{BASE_URL}/api/auth/me")
        assert auth_response.status_code == 200, f"Auth me failed after pro login: {auth_response.status_code}"
        auth_data = auth_response.json()
        assert auth_data.get("authenticated") == True, f"Expected authenticated=true for pro, got: {auth_data}"
        assert auth_data.get("session", {}).get("role") == "pro", f"Expected pro role, got: {auth_data}"
        print(f"Pro auth/me verified - role: {auth_data.get('session', {}).get('role')}")


class TestFullAuthFlow:
    """Test complete authentication flows"""
    
    def test_admin_full_flow(self):
        """Test complete admin auth flow: login -> auth/me -> logout -> auth/me"""
        session = requests.Session()
        
        # 1. Login
        login_response = session.post(
            f"{BASE_URL}/api/admin/verify",
            json={"password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.status_code}"
        print("Step 1: Admin login successful")
        
        # 2. Check auth/me
        auth_response = session.get(f"{BASE_URL}/api/auth/me")
        assert auth_response.status_code == 200, f"Auth me failed: {auth_response.status_code}"
        assert auth_response.json().get("authenticated") == True
        print("Step 2: Auth/me returns authenticated=true")
        
        # 3. Logout
        logout_response = session.post(f"{BASE_URL}/api/auth/logout")
        assert logout_response.status_code == 200, f"Logout failed: {logout_response.status_code}"
        print("Step 3: Logout successful")
        
        # 4. Check auth/me again (should be unauthenticated)
        auth_response2 = session.get(f"{BASE_URL}/api/auth/me")
        # After logout, cookie should be cleared
        assert auth_response2.status_code == 401 or auth_response2.json().get("authenticated") == False, \
            f"Expected unauthenticated after logout: {auth_response2.status_code} - {auth_response2.text}"
        print("Step 4: Auth/me returns unauthenticated after logout")
        
        print("Full admin auth flow test PASSED")
    
    def test_workspace_full_flow(self):
        """Test complete workspace auth flow"""
        session = requests.Session()
        
        # 1. Login via workspace
        login_response = session.post(
            f"{BASE_URL}/api/workspace/login",
            json={"password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200, f"Workspace login failed: {login_response.status_code}"
        data = login_response.json()
        assert data.get("role") == "admin"
        print(f"Step 1: Workspace login successful - role={data.get('role')}")
        
        # 2. Check auth/me
        auth_response = session.get(f"{BASE_URL}/api/auth/me")
        assert auth_response.status_code == 200, f"Auth me failed: {auth_response.status_code}"
        auth_data = auth_response.json()
        assert auth_data.get("authenticated") == True
        assert auth_data.get("session", {}).get("role") == "admin"
        print("Step 2: Auth/me returns authenticated=true with admin role")
        
        # 3. Logout
        logout_response = session.post(f"{BASE_URL}/api/auth/logout")
        assert logout_response.status_code == 200
        print("Step 3: Logout successful")
        
        print("Full workspace auth flow test PASSED")


class TestAPIHealthCheck:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"API root failed: {response.status_code}"
        print("API root endpoint working")
    
    def test_registrations_endpoint(self):
        """Test registrations endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/registrations")
        assert response.status_code == 200, f"Registrations endpoint failed: {response.status_code}"
        print("Registrations endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
