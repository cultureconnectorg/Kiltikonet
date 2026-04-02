"""
Iteration 60 Tests - Console Cleanup & AdminDashboard Split
Tests:
1. Backend API health checks
2. Registrations endpoint
3. Stats endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestIteration60ConsoleCleanup:
    """Test backend APIs after console cleanup and AdminDashboard split"""
    
    def test_registrations_endpoint(self):
        """Test /api/registrations returns 200"""
        response = requests.get(f"{BASE_URL}/api/registrations", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert "registrations" in data
        assert "counts" in data
        print(f"✓ Registrations endpoint: {len(data['registrations'])} registrations found")
    
    def test_stats_endpoint(self):
        """Test /api/v1/stats returns 200"""
        response = requests.get(f"{BASE_URL}/api/v1/stats", timeout=10)
        assert response.status_code == 200
        data = response.json()
        # Stats should have conversion_rates, by_profile_type, by_country, by_tier
        assert "conversion_rates" in data or "summary" in data or "by_profile_type" in data
        print(f"✓ Stats endpoint working")
    
    def test_advanced_stats_endpoint(self):
        """Test /api/v1/stats/advanced returns 200"""
        response = requests.get(f"{BASE_URL}/api/v1/stats/advanced", timeout=10)
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Advanced stats endpoint working")
    
    def test_catalog_endpoint(self):
        """Test /api/catalog returns 200"""
        response = requests.get(f"{BASE_URL}/api/catalog", timeout=10)
        assert response.status_code == 200
        print(f"✓ Catalog endpoint working")
    
    def test_partners_endpoint(self):
        """Test /api/partners returns 200"""
        response = requests.get(f"{BASE_URL}/api/partners", timeout=10)
        assert response.status_code == 200
        print(f"✓ Partners endpoint working")
    
    def test_email_logs_endpoint(self):
        """Test /api/email-logs returns 200"""
        response = requests.get(f"{BASE_URL}/api/email-logs?limit=10", timeout=10)
        assert response.status_code == 200
        data = response.json()
        assert "logs" in data
        print(f"✓ Email logs endpoint working")
    
    def test_smart_engine_endpoint(self):
        """Test /api/smart-engine/stats returns 200"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/stats", timeout=10)
        assert response.status_code == 200
        print(f"✓ Smart engine stats endpoint working")
    
    def test_team_notifications_endpoint(self):
        """Test /api/team/notifications returns 200"""
        response = requests.get(f"{BASE_URL}/api/team/notifications", timeout=10)
        assert response.status_code == 200
        print(f"✓ Team notifications endpoint working")
    
    def test_jetons_stats_endpoint(self):
        """Test /api/jetons/stats returns 200"""
        response = requests.get(f"{BASE_URL}/api/jetons/stats", timeout=10)
        assert response.status_code == 200
        print(f"✓ Jetons stats endpoint working")
    
    def test_site_analytics_endpoint(self):
        """Test /api/analytics/site returns 200"""
        response = requests.get(f"{BASE_URL}/api/analytics/site", timeout=10)
        assert response.status_code == 200
        print(f"✓ Site analytics endpoint working")
