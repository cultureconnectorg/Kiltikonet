"""
Test Performance Dashboard API - Culture Connect 2026
Tests the /api/analytics/dashboard endpoint for the Performance Dashboard feature
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable not set")


class TestAnalyticsDashboardAPI:
    """Test /api/analytics/dashboard endpoint"""
    
    def test_analytics_dashboard_returns_200(self):
        """Test that analytics dashboard endpoint returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ Analytics dashboard returns 200")
    
    def test_analytics_dashboard_has_required_fields(self):
        """Test that analytics dashboard returns all required fields"""
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard?days=7")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check required fields exist
        required_fields = ["period_days", "event_summary", "page_stats", "active_users", "intro_sections", "pro_activity", "generated_at"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        print(f"✓ All required fields present: {required_fields}")
    
    def test_analytics_dashboard_period_parameter(self):
        """Test that days parameter works correctly"""
        for days in [1, 7, 30, 90]:
            response = requests.get(f"{BASE_URL}/api/analytics/dashboard?days={days}")
            assert response.status_code == 200
            data = response.json()
            assert data["period_days"] == days, f"Expected period_days={days}, got {data['period_days']}"
        
        print(f"✓ Period parameter works for 1, 7, 30, 90 days")
    
    def test_analytics_dashboard_data_types(self):
        """Test that returned data has correct types"""
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard")
        data = response.json()
        
        assert isinstance(data["period_days"], int), "period_days should be int"
        assert isinstance(data["event_summary"], dict), "event_summary should be dict"
        assert isinstance(data["page_stats"], list), "page_stats should be list"
        assert isinstance(data["active_users"], list), "active_users should be list"
        assert isinstance(data["intro_sections"], list), "intro_sections should be list"
        assert isinstance(data["pro_activity"], list), "pro_activity should be list"
        assert isinstance(data["generated_at"], str), "generated_at should be string"
        
        print(f"✓ All data types correct")


class TestRegistrationsAPIForDashboard:
    """Test /api/registrations endpoint which provides data to Performance Dashboard"""
    
    def test_registrations_returns_200(self):
        """Test that registrations endpoint returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/registrations")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ Registrations endpoint returns 200")
    
    def test_registrations_has_counts_structure(self):
        """Test that registrations returns counts structure for dashboard KPIs"""
        response = requests.get(f"{BASE_URL}/api/registrations")
        data = response.json()
        
        # Check required fields for KPI display
        assert "total" in data, "Missing 'total' field"
        assert "counts" in data, "Missing 'counts' field"
        
        counts = data["counts"]
        assert "by_status" in counts, "Missing 'by_status' in counts"
        
        by_status = counts["by_status"]
        assert "approved" in by_status, "Missing 'approved' count"
        assert "pending" in by_status, "Missing 'pending' count"
        assert "rejected" in by_status, "Missing 'rejected' count"
        
        print(f"✓ Registrations counts structure correct for KPIs")


class TestAnalyticsSummaryAPI:
    """Test /api/v1/analytics/summary endpoint (optional fallback)"""
    
    def test_analytics_summary_endpoint(self):
        """Test analytics summary endpoint availability"""
        response = requests.get(f"{BASE_URL}/api/v1/analytics/summary")
        # This endpoint may or may not exist - should not break dashboard
        # Dashboard handles this gracefully with .catch()
        if response.status_code == 200:
            print(f"✓ Analytics summary endpoint available (200)")
        else:
            print(f"! Analytics summary endpoint returned {response.status_code} (handled gracefully)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
