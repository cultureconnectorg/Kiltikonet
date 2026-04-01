"""
Iteration 55 — Login/Registration, Legal Footer, Settings Features
Tests for:
- POST /api/pro/request-access (auto-register for new emails, bypass for admin)
- GET /api/pro/dev/get-code/{email} (dev endpoint to get OTP)
- POST /api/pro/verify-code (returns profile with frek_id)
- POST /api/pro/update-language (fr/en/es/pt)
- GET /api/pro/export-data/{user_id} (RGPD data export)
- POST /api/pro/delete-account (archive and delete)
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com').rstrip('/')


class TestProRequestAccess:
    """Tests for POST /api/pro/request-access endpoint"""
    
    def test_request_access_new_email_auto_register(self):
        """NEW unknown email should return success (auto-register, not 404)"""
        unique_email = f"test_auto_register_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/pro/request-access", json={"email": unique_email})
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True, f"Expected success=True, got {data}"
        assert "message" in data, "Response should contain message"
        print(f"✓ Auto-register for new email {unique_email}: {data}")
    
    def test_request_access_admin_bypass(self):
        """EXISTING admin email (cultureconnectorg@gmail.com) should return success with bypass"""
        admin_email = "cultureconnectorg@gmail.com"
        response = requests.post(f"{BASE_URL}/api/pro/request-access", json={"email": admin_email})
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True, f"Expected success=True, got {data}"
        assert data.get("bypass") is True, f"Expected bypass=True for admin email, got {data}"
        print(f"✓ Admin bypass for {admin_email}: {data}")
    
    def test_request_access_empty_email(self):
        """Empty email should return 400"""
        response = requests.post(f"{BASE_URL}/api/pro/request-access", json={"email": ""})
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Empty email returns 400")


class TestDevGetCode:
    """Tests for GET /api/pro/dev/get-code/{email} endpoint"""
    
    def test_get_code_for_new_user(self):
        """Should return stored OTP code for new user after request-access"""
        unique_email = f"test_getcode_{uuid.uuid4().hex[:8]}@test.com"
        
        # First request access to generate code
        req_response = requests.post(f"{BASE_URL}/api/pro/request-access", json={"email": unique_email})
        assert req_response.status_code == 200, f"Request access failed: {req_response.text}"
        
        # Then get the code
        response = requests.get(f"{BASE_URL}/api/pro/dev/get-code/{unique_email}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "code" in data, f"Response should contain code, got {data}"
        assert len(data["code"]) == 6, f"Code should be 6 digits, got {data['code']}"
        assert "expires" in data, "Response should contain expires"
        print(f"✓ Got code for {unique_email}: {data['code']}")
    
    def test_get_code_nonexistent_email(self):
        """Should return 404 for email with no pending code"""
        response = requests.get(f"{BASE_URL}/api/pro/dev/get-code/nonexistent_{uuid.uuid4().hex}@test.com")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Nonexistent email returns 404")


class TestVerifyCode:
    """Tests for POST /api/pro/verify-code endpoint"""
    
    def test_verify_code_returns_profile_with_frek_id(self):
        """Correct code should return profile with frek_id field"""
        unique_email = f"test_verify_{uuid.uuid4().hex[:8]}@test.com"
        
        # Request access
        req_response = requests.post(f"{BASE_URL}/api/pro/request-access", json={"email": unique_email})
        assert req_response.status_code == 200
        
        # Get the code
        code_response = requests.get(f"{BASE_URL}/api/pro/dev/get-code/{unique_email}")
        assert code_response.status_code == 200
        code = code_response.json()["code"]
        
        # Verify the code
        response = requests.post(f"{BASE_URL}/api/pro/verify-code", json={"email": unique_email, "code": code})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, f"Expected success=True, got {data}"
        assert "profile" in data, f"Response should contain profile, got {data}"
        
        profile = data["profile"]
        assert "frek_id" in profile, f"Profile should contain frek_id, got {profile}"
        assert profile["frek_id"].startswith("FREK-"), f"FREK-ID should start with 'FREK-', got {profile['frek_id']}"
        assert "id" in profile, "Profile should contain id"
        assert "email" in profile, "Profile should contain email"
        print(f"✓ Verified code for {unique_email}, FREK-ID: {profile['frek_id']}")
        
        return profile  # Return for use in other tests
    
    def test_verify_code_admin_bypass(self):
        """Admin bypass code 000000 should work"""
        admin_email = "cultureconnectorg@gmail.com"
        
        # Request access first
        requests.post(f"{BASE_URL}/api/pro/request-access", json={"email": admin_email})
        
        # Verify with bypass code
        response = requests.post(f"{BASE_URL}/api/pro/verify-code", json={"email": admin_email, "code": "000000"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert "profile" in data
        assert "frek_id" in data["profile"], f"Admin profile should have frek_id, got {data['profile']}"
        print(f"✓ Admin bypass verified, FREK-ID: {data['profile'].get('frek_id')}")
    
    def test_verify_code_invalid(self):
        """Invalid code should return 400"""
        unique_email = f"test_invalid_{uuid.uuid4().hex[:8]}@test.com"
        
        # Request access
        requests.post(f"{BASE_URL}/api/pro/request-access", json={"email": unique_email})
        
        # Try invalid code
        response = requests.post(f"{BASE_URL}/api/pro/verify-code", json={"email": unique_email, "code": "999999"})
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Invalid code returns 400")


class TestUpdateLanguage:
    """Tests for POST /api/pro/update-language endpoint"""
    
    @pytest.fixture
    def test_user(self):
        """Create a test user and return profile"""
        unique_email = f"test_lang_{uuid.uuid4().hex[:8]}@test.com"
        requests.post(f"{BASE_URL}/api/pro/request-access", json={"email": unique_email})
        code_response = requests.get(f"{BASE_URL}/api/pro/dev/get-code/{unique_email}")
        code = code_response.json()["code"]
        verify_response = requests.post(f"{BASE_URL}/api/pro/verify-code", json={"email": unique_email, "code": code})
        return verify_response.json()["profile"]
    
    def test_update_language_valid_fr(self, test_user):
        """Valid language (fr) should return success"""
        response = requests.post(f"{BASE_URL}/api/pro/update-language", json={
            "user_id": test_user["id"],
            "language": "fr"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True
        assert data.get("language") == "fr"
        print("✓ Language updated to fr")
    
    def test_update_language_valid_en(self, test_user):
        """Valid language (en) should return success"""
        response = requests.post(f"{BASE_URL}/api/pro/update-language", json={
            "user_id": test_user["id"],
            "language": "en"
        })
        assert response.status_code == 200
        assert response.json().get("language") == "en"
        print("✓ Language updated to en")
    
    def test_update_language_valid_es(self, test_user):
        """Valid language (es) should return success"""
        response = requests.post(f"{BASE_URL}/api/pro/update-language", json={
            "user_id": test_user["id"],
            "language": "es"
        })
        assert response.status_code == 200
        assert response.json().get("language") == "es"
        print("✓ Language updated to es")
    
    def test_update_language_valid_pt(self, test_user):
        """Valid language (pt) should return success"""
        response = requests.post(f"{BASE_URL}/api/pro/update-language", json={
            "user_id": test_user["id"],
            "language": "pt"
        })
        assert response.status_code == 200
        assert response.json().get("language") == "pt"
        print("✓ Language updated to pt")
    
    def test_update_language_invalid(self, test_user):
        """Invalid language should return 400"""
        response = requests.post(f"{BASE_URL}/api/pro/update-language", json={
            "user_id": test_user["id"],
            "language": "de"  # German not supported
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Invalid language returns 400")
    
    def test_update_language_missing_user_id(self):
        """Missing user_id should return 400"""
        response = requests.post(f"{BASE_URL}/api/pro/update-language", json={
            "language": "fr"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Missing user_id returns 400")


class TestExportData:
    """Tests for GET /api/pro/export-data/{user_id} endpoint"""
    
    def test_export_data_full_rgpd(self):
        """Should return full RGPD data export with all collections"""
        # Create a test user
        unique_email = f"test_export_{uuid.uuid4().hex[:8]}@test.com"
        requests.post(f"{BASE_URL}/api/pro/request-access", json={"email": unique_email})
        code_response = requests.get(f"{BASE_URL}/api/pro/dev/get-code/{unique_email}")
        code = code_response.json()["code"]
        verify_response = requests.post(f"{BASE_URL}/api/pro/verify-code", json={"email": unique_email, "code": code})
        profile = verify_response.json()["profile"]
        
        # Export data
        response = requests.get(f"{BASE_URL}/api/pro/export-data/{profile['id']}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify required fields
        assert "export_date" in data, "Should contain export_date"
        assert "legal_entity" in data, "Should contain legal_entity"
        assert data["legal_entity"] == "Factory Maker Studio EURL", f"Legal entity should be Factory Maker Studio EURL, got {data['legal_entity']}"
        assert "profile" in data, "Should contain profile"
        assert "pro_data" in data, "Should contain pro_data"
        assert "wallet" in data, "Should contain wallet"
        assert "transactions" in data, "Should contain transactions"
        assert "notifications" in data, "Should contain notifications"
        assert "access_logs" in data, "Should contain access_logs"
        
        print(f"✓ RGPD export successful for {profile['id']}")
        print(f"  - Legal entity: {data['legal_entity']}")
        print(f"  - Export date: {data['export_date']}")
        print(f"  - Profile email: {data['profile'].get('email')}")
    
    def test_export_data_nonexistent_user(self):
        """Should return 404 for nonexistent user"""
        response = requests.get(f"{BASE_URL}/api/pro/export-data/nonexistent_{uuid.uuid4().hex}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Nonexistent user returns 404")


class TestDeleteAccount:
    """Tests for POST /api/pro/delete-account endpoint"""
    
    def test_delete_account_success(self):
        """Should archive and delete user data, return KT non-refundable message"""
        # Create a throwaway user
        unique_email = f"test_delete_{uuid.uuid4().hex[:8]}@test.com"
        requests.post(f"{BASE_URL}/api/pro/request-access", json={"email": unique_email})
        code_response = requests.get(f"{BASE_URL}/api/pro/dev/get-code/{unique_email}")
        code = code_response.json()["code"]
        verify_response = requests.post(f"{BASE_URL}/api/pro/verify-code", json={"email": unique_email, "code": code})
        profile = verify_response.json()["profile"]
        
        # Delete the account
        response = requests.post(f"{BASE_URL}/api/pro/delete-account", json={
            "user_id": profile["id"],
            "email": unique_email
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, f"Expected success=True, got {data}"
        assert "message" in data, "Should contain message"
        assert "remboursable" in data["message"].lower() or "non remboursable" in data["message"].lower(), \
            f"Message should mention KT non-refundable, got: {data['message']}"
        
        print(f"✓ Account deleted: {data['message']}")
        
        # Verify user is actually deleted (export should fail)
        export_response = requests.get(f"{BASE_URL}/api/pro/export-data/{profile['id']}")
        assert export_response.status_code == 404, "Deleted user should not be found"
        print("✓ Verified user is deleted (export returns 404)")
    
    def test_delete_account_missing_user_id(self):
        """Missing user_id should return 400"""
        response = requests.post(f"{BASE_URL}/api/pro/delete-account", json={
            "email": "test@test.com"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Missing user_id returns 400")


class TestFrekIdFormat:
    """Tests for FREK-ID format validation"""
    
    def test_frek_id_format(self):
        """FREK-ID should be in format FREK-XXXX-XXXX"""
        unique_email = f"test_frekid_{uuid.uuid4().hex[:8]}@test.com"
        requests.post(f"{BASE_URL}/api/pro/request-access", json={"email": unique_email})
        code_response = requests.get(f"{BASE_URL}/api/pro/dev/get-code/{unique_email}")
        code = code_response.json()["code"]
        verify_response = requests.post(f"{BASE_URL}/api/pro/verify-code", json={"email": unique_email, "code": code})
        profile = verify_response.json()["profile"]
        
        frek_id = profile.get("frek_id", "")
        assert frek_id.startswith("FREK-"), f"FREK-ID should start with 'FREK-', got {frek_id}"
        
        # Check format: FREK-XXXX-XXXX (where X is hex digit)
        parts = frek_id.split("-")
        assert len(parts) == 3, f"FREK-ID should have 3 parts separated by '-', got {parts}"
        assert parts[0] == "FREK", f"First part should be 'FREK', got {parts[0]}"
        assert len(parts[1]) == 4, f"Second part should be 4 chars, got {parts[1]}"
        assert len(parts[2]) == 4, f"Third part should be 4 chars, got {parts[2]}"
        
        print(f"✓ FREK-ID format valid: {frek_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
