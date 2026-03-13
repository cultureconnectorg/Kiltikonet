import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any
from io import BytesIO
from urllib.parse import urlencode

class CultureConnectAPITester:
    def __init__(self, base_url="https://cc2026-updates.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test_name": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"  Details: {details}")

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_base}/", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            details = f"Status: {response.status_code}, Response: {data}"
            self.log_result("API Root", success, details)
            return success
        except Exception as e:
            self.log_result("API Root", False, f"Error: {str(e)}")
            return False

    def test_admin_verify_valid(self):
        """Test admin verification with valid password"""
        try:
            response = requests.post(
                f"{self.api_base}/admin/verify",
                json={"password": "CC2026admin"},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            success = response.status_code == 200
            data = response.json() if response.status_code == 200 else {}
            details = f"Status: {response.status_code}, Response: {data}"
            self.log_result("Admin Verify (Valid)", success, details)
            return success
        except Exception as e:
            self.log_result("Admin Verify (Valid)", False, f"Error: {str(e)}")
            return False

    def test_admin_verify_invalid(self):
        """Test admin verification with invalid password"""
        try:
            response = requests.post(
                f"{self.api_base}/admin/verify",
                json={"password": "wrongpassword"},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected 401)"
            self.log_result("Admin Verify (Invalid)", success, details)
            return success
        except Exception as e:
            self.log_result("Admin Verify (Invalid)", False, f"Error: {str(e)}")
            return False

    def test_countries_endpoint(self):
        """Test countries endpoint"""
        try:
            response = requests.get(f"{self.api_base}/countries", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            details = f"Status: {response.status_code}, Countries: {data}"
            self.log_result("Countries Endpoint", success, details)
            return success, data.get("countries", [])
        except Exception as e:
            self.log_result("Countries Endpoint", False, f"Error: {str(e)}")
            return False, []

    def create_test_registration(self):
        """Create a test registration"""
        try:
            # Create multipart form data
            files = {
                'full_name': (None, 'Test User'),
                'organization_name': (None, 'Test Organization'),
                'country': (None, 'france'),
                'email': (None, 'test@example.com'),
                'phone': (None, '+33123456789'),
                'profile_type': (None, 'artist'),
                'stand_request': (None, 'true'),
                'stand_category': (None, 'music'),
                'bio': (None, 'This is a test bio for registration testing.'),
                'language_preference': (None, 'fr'),
                'how_heard': (None, 'social_media')
            }
            
            response = requests.post(
                f"{self.api_base}/registrations",
                files=files,
                timeout=15
            )
            
            success = response.status_code == 200
            data = response.json() if success else {}
            details = f"Status: {response.status_code}"
            if success:
                details += f", ID: {data.get('id', 'N/A')}, Name: {data.get('full_name', 'N/A')}"
            else:
                details += f", Error: {response.text}"
            
            self.log_result("Create Registration", success, details)
            return success, data
        except Exception as e:
            self.log_result("Create Registration", False, f"Error: {str(e)}")
            return False, {}

    def test_get_registrations_no_filter(self):
        """Test get registrations without filters"""
        try:
            response = requests.get(f"{self.api_base}/registrations", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success:
                reg_count = len(data.get('registrations', []))
                total = data.get('total', 0)
                counts = data.get('counts', {})
                details = f"Status: {response.status_code}, Count: {reg_count}, Total: {total}, Stats: {counts}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            self.log_result("Get Registrations (No Filter)", success, details)
            return success, data
        except Exception as e:
            self.log_result("Get Registrations (No Filter)", False, f"Error: {str(e)}")
            return False, {}

    def test_get_registrations_with_filters(self):
        """Test get registrations with various filters"""
        test_cases = [
            {"profile_type": "artist"},
            {"country": "france"},
            {"stand_request": "true"},
            {"status": "pending"},
            {"profile_type": "artist", "status": "pending"}
        ]
        
        all_passed = True
        for i, filters in enumerate(test_cases):
            try:
                params = urlencode(filters)
                response = requests.get(f"{self.api_base}/registrations?{params}", timeout=10)
                success = response.status_code == 200
                data = response.json() if success else {}
                
                if not success:
                    all_passed = False
                
                filter_str = ", ".join([f"{k}={v}" for k, v in filters.items()])
                details = f"Filter: {filter_str}, Status: {response.status_code}"
                if success:
                    details += f", Results: {len(data.get('registrations', []))}"
                
                self.log_result(f"Get Registrations (Filter {i+1})", success, details)
            except Exception as e:
                self.log_result(f"Get Registrations (Filter {i+1})", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed

    def test_update_registration_status(self, registration_id: str):
        """Test updating registration status"""
        if not registration_id:
            self.log_result("Update Registration Status", False, "No registration ID provided")
            return False
            
        test_statuses = ["approved", "rejected", "pending"]
        all_passed = True
        
        for status in test_statuses:
            try:
                response = requests.patch(
                    f"{self.api_base}/registrations/{registration_id}/status",
                    json={"status": status},
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                success = response.status_code == 200
                data = response.json() if success else {}
                
                if not success:
                    all_passed = False
                
                details = f"Status change to '{status}': {response.status_code}"
                if success:
                    details += f", Response: {data}"
                
                self.log_result(f"Update Status to {status}", success, details)
            except Exception as e:
                self.log_result(f"Update Status to {status}", False, f"Error: {str(e)}")
                all_passed = False
        
        return all_passed

    def test_export_registrations(self):
        """Test CSV export of registrations"""
        try:
            response = requests.get(f"{self.api_base}/registrations/export", timeout=15)
            success = response.status_code == 200
            
            if success:
                content_type = response.headers.get('Content-Type', '')
                content_disposition = response.headers.get('Content-Disposition', '')
                content_length = len(response.content)
                details = f"Status: {response.status_code}, Type: {content_type}, Size: {content_length}b"
                if 'attachment' in content_disposition:
                    details += ", Has download header"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
            
            self.log_result("CSV Export", success, details)
            return success
        except Exception as e:
            self.log_result("CSV Export", False, f"Error: {str(e)}")
            return False

    def test_invalid_endpoints(self):
        """Test invalid endpoint handling"""
        try:
            response = requests.get(f"{self.api_base}/nonexistent", timeout=10)
            success = response.status_code == 404
            details = f"Status: {response.status_code} (Expected 404)"
            self.log_result("Invalid Endpoint Handling", success, details)
            return success
        except Exception as e:
            self.log_result("Invalid Endpoint Handling", False, f"Error: {str(e)}")
            return False

    def run_comprehensive_tests(self):
        """Run all backend API tests"""
        print(f"🚀 Starting Culture Connect 2026 API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("-" * 60)
        
        # Test basic connectivity
        if not self.test_api_root():
            print("❌ API root endpoint failed - stopping tests")
            return self.generate_summary()
        
        # Test admin endpoints
        self.test_admin_verify_valid()
        self.test_admin_verify_invalid()
        
        # Test countries endpoint
        countries_success, countries = self.test_countries_endpoint()
        
        # Test registration creation
        reg_success, registration_data = self.create_test_registration()
        registration_id = registration_data.get('id') if reg_success else None
        
        # Test registration retrieval
        self.test_get_registrations_no_filter()
        self.test_get_registrations_with_filters()
        
        # Test status updates (only if we have a registration)
        if registration_id:
            self.test_update_registration_status(registration_id)
        
        # Test CSV export
        self.test_export_registrations()
        
        # Test error handling
        self.test_invalid_endpoints()
        
        return self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        
        print("\n" + "="*60)
        print(f"📊 TEST SUMMARY")
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        print("="*60)
        
        # Show failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": success_rate,
            "test_results": self.test_results
        }

def main():
    """Run the backend API tests"""
    try:
        tester = CultureConnectAPITester()
        results = tester.run_comprehensive_tests()
        
        # Return appropriate exit code
        return 0 if results["failed_tests"] == 0 else 1
        
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)