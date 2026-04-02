"""
Test Suite for Culture Connect 2026 Final Features
Tests: 
1. Batch send-badges with job_id tracking
2. Batch progress polling endpoint
3. Email logs endpoint
4. Advanced stats endpoint
5. Report summary endpoint
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    pytest.skip("REACT_APP_BACKEND_URL not set", allow_module_level=True)
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'CC2026admin')

class TestBatchBadgeProgress:
    """Tests for real-time batch progress tracking (Feature P3 #1)"""
    
    def test_send_badges_returns_job_id(self):
        """POST /api/registrations/batch/send-badges should return job_id for tracking"""
        # First create a test registration
        response = requests.post(f"{BASE_URL}/api/registrations/manual", json={
            "full_name": "TEST_Progress User",
            "organization_name": "Test Progress Org",
            "country": "MQ",
            "email": "test_progress@example.com",
            "phone": "+596123456789",
            "profile_type": "artist",
            "tier": "professional",
            "status": "approved",
            "show_in_catalog": True,
            "bio": "Test for progress tracking"
        })
        assert response.status_code in [200, 201], f"Failed to create test user: {response.text}"
        user_id = response.json()["id"]
        
        # Send badge to this user
        send_response = requests.post(f"{BASE_URL}/api/registrations/batch/send-badges", json={
            "registration_ids": [user_id]
        })
        
        assert send_response.status_code == 200, f"Failed to send badge: {send_response.text}"
        data = send_response.json()
        
        # Verify response structure
        assert "job_id" in data, "Response should contain job_id"
        assert "total" in data, "Response should contain total count"
        assert data["success"] is True, "Success should be True"
        
        job_id = data["job_id"]
        print(f"Job ID returned: {job_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/registrations/{user_id}")
        
        return job_id
    
    def test_batch_progress_endpoint_structure(self):
        """GET /api/registrations/batch/progress/{job_id} should return progress data"""
        # Create and send badge
        response = requests.post(f"{BASE_URL}/api/registrations/manual", json={
            "full_name": "TEST_Progress User 2",
            "organization_name": "Test Progress Org 2",
            "country": "FR",
            "email": "test_progress2@example.com",
            "phone": "+33123456789",
            "profile_type": "label",
            "tier": "emerging",
            "status": "approved",
            "show_in_catalog": True,
            "bio": "Test for progress endpoint"
        })
        user_id = response.json()["id"]
        
        send_response = requests.post(f"{BASE_URL}/api/registrations/batch/send-badges", json={
            "registration_ids": [user_id]
        })
        job_id = send_response.json()["job_id"]
        
        # Poll for progress
        time.sleep(1)  # Wait a bit for processing
        
        progress_response = requests.get(f"{BASE_URL}/api/registrations/batch/progress/{job_id}")
        assert progress_response.status_code == 200, f"Progress endpoint failed: {progress_response.text}"
        
        progress = progress_response.json()
        
        # Verify structure
        assert "job_id" in progress, "Should contain job_id"
        assert "status" in progress, "Should contain status"
        assert "total" in progress, "Should contain total"
        assert "processed" in progress, "Should contain processed count"
        assert "sent" in progress, "Should contain sent count"
        assert "failed" in progress, "Should contain failed count"
        assert "progress_percent" in progress or progress["status"] == "completed", "Should contain progress_percent or be completed"
        
        print(f"Progress data: status={progress['status']}, processed={progress['processed']}/{progress['total']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/registrations/{user_id}")
    
    def test_invalid_job_id_returns_404(self):
        """Invalid job_id should return 404"""
        response = requests.get(f"{BASE_URL}/api/registrations/batch/progress/invalid-job-12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        assert "not found" in response.json().get("detail", "").lower()


class TestEmailLogs:
    """Tests for email history/logs endpoint (Feature P3 #2)"""
    
    def test_email_logs_endpoint_returns_list(self):
        """GET /api/email-logs should return logs with summary"""
        response = requests.get(f"{BASE_URL}/api/email-logs")
        assert response.status_code == 200, f"Email logs endpoint failed: {response.text}"
        
        data = response.json()
        
        # Verify structure
        assert "logs" in data, "Should contain logs array"
        assert "total_count" in data, "Should contain total_count"
        assert "summary" in data, "Should contain summary"
        
        summary = data["summary"]
        assert "total_sent" in summary, "Summary should contain total_sent"
        assert "total_failed" in summary, "Summary should contain total_failed"
        assert "badges_sent" in summary, "Summary should contain badges_sent"
        
        print(f"Email logs: {data['total_count']} total, {summary['badges_sent']} badges sent")
        
        # Verify log entry structure if logs exist
        if data["logs"]:
            log = data["logs"][0]
            assert "id" in log, "Log should have id"
            assert "recipient_email" in log, "Log should have recipient_email"
            assert "recipient_name" in log, "Log should have recipient_name"
            assert "email_type" in log, "Log should have email_type"
            assert "status" in log, "Log should have status"
            assert "sent_at" in log, "Log should have sent_at"
    
    def test_email_logs_filter_by_type(self):
        """Email logs should be filterable by type"""
        response = requests.get(f"{BASE_URL}/api/email-logs?email_type=badge")
        assert response.status_code == 200
        
        data = response.json()
        # All returned logs should be of type 'badge'
        for log in data["logs"]:
            assert log.get("email_type") == "badge", f"Expected badge type, got {log.get('email_type')}"
    
    def test_email_logs_filter_by_status(self):
        """Email logs should be filterable by status"""
        response = requests.get(f"{BASE_URL}/api/email-logs?status=sent")
        assert response.status_code == 200
        
        data = response.json()
        for log in data["logs"]:
            assert log.get("status") == "sent", f"Expected sent status, got {log.get('status')}"


class TestAdvancedStats:
    """Tests for advanced analytics endpoint (Feature P3 #3)"""
    
    def test_advanced_stats_endpoint_structure(self):
        """GET /api/v1/stats/advanced should return KPIs and analytics"""
        response = requests.get(f"{BASE_URL}/api/v1/stats/advanced")
        assert response.status_code == 200, f"Advanced stats failed: {response.text}"
        
        data = response.json()
        
        # Verify main sections
        assert "kpis" in data, "Should contain kpis"
        assert "report_title" in data, "Should contain report_title"
        assert "generated_at" in data, "Should contain generated_at"
        assert "tier_analysis" in data, "Should contain tier_analysis"
        assert "partner_analysis" in data, "Should contain partner_analysis"
        assert "expertise_engagement" in data, "Should contain expertise_engagement"
        assert "email_delivery" in data, "Should contain email_delivery"
        assert "marche_culturel" in data, "Should contain marche_culturel"
        
        print(f"Report title: {data['report_title']}")
    
    def test_kpis_structure(self):
        """KPIs should contain revenue estimates and key metrics"""
        response = requests.get(f"{BASE_URL}/api/v1/stats/advanced")
        kpis = response.json()["kpis"]
        
        # Verify KPI fields
        assert "total_registrations" in kpis, "Should have total_registrations"
        assert "approval_rate" in kpis, "Should have approval_rate"
        assert "total_partners" in kpis, "Should have total_partners"
        assert "total_revenue_estimate" in kpis, "Should have total_revenue_estimate"
        assert "badges_sent" in kpis, "Should have badges_sent"
        assert "email_delivery_rate" in kpis, "Should have email_delivery_rate"
        
        print(f"KPIs: Revenue={kpis['total_revenue_estimate']}€, Badges Sent={kpis['badges_sent']}")
    
    def test_tier_analysis_has_revenue(self):
        """Tier analysis should include revenue estimates"""
        response = requests.get(f"{BASE_URL}/api/v1/stats/advanced")
        tier_analysis = response.json()["tier_analysis"]
        
        assert "registrations" in tier_analysis
        assert "total_registration_revenue" in tier_analysis
        
        registrations = tier_analysis["registrations"]
        for tier in ["emerging", "professional", "institutional"]:
            assert tier in registrations, f"Should have {tier} tier"
            assert "price" in registrations[tier], f"{tier} should have price"
            assert "count" in registrations[tier], f"{tier} should have count"
            assert "revenue" in registrations[tier], f"{tier} should have revenue"
    
    def test_partner_analysis_has_revenue(self):
        """Partner analysis should include revenue estimates"""
        response = requests.get(f"{BASE_URL}/api/v1/stats/advanced")
        partner_analysis = response.json()["partner_analysis"]
        
        assert "partners" in partner_analysis
        assert "total_partner_revenue" in partner_analysis
        
        partners = partner_analysis["partners"]
        for tier in ["bronze", "silver", "gold"]:
            assert tier in partners, f"Should have {tier} tier"
            assert "price" in partners[tier], f"{tier} should have price"


class TestReportSummary:
    """Tests for executive summary endpoint (Feature P3 #3)"""
    
    def test_report_summary_endpoint(self):
        """GET /api/v1/report/summary should return executive summary"""
        response = requests.get(f"{BASE_URL}/api/v1/report/summary")
        assert response.status_code == 200, f"Report summary failed: {response.text}"
        
        data = response.json()
        
        # Verify structure
        assert "title" in data, "Should contain title"
        assert "generated_at" in data, "Should contain generated_at"
        assert "highlights" in data, "Should contain highlights"
        assert "key_metrics" in data, "Should contain key_metrics"
        assert "marche_culturel" in data, "Should contain marche_culturel"
        assert "communication" in data, "Should contain communication"
        
        print(f"Report title: {data['title']}")
    
    def test_key_metrics_fields(self):
        """Key metrics should include required fields"""
        response = requests.get(f"{BASE_URL}/api/v1/report/summary")
        metrics = response.json()["key_metrics"]
        
        assert "inscriptions" in metrics, "Should have inscriptions"
        assert "approuves" in metrics, "Should have approuves"
        assert "partenaires" in metrics, "Should have partenaires"
        assert "revenus_estimes" in metrics, "Should have revenus_estimes"
        
        print(f"Key Metrics: {metrics}")
    
    def test_communication_fields(self):
        """Communication section should have badges and delivery rate"""
        response = requests.get(f"{BASE_URL}/api/v1/report/summary")
        comm = response.json()["communication"]
        
        assert "badges_envoyes" in comm, "Should have badges_envoyes"
        assert "taux_delivrabilite" in comm, "Should have taux_delivrabilite"


class TestAdminAuth:
    """Basic auth test"""
    
    def test_admin_verify(self):
        """POST /api/admin/verify with correct password should succeed"""
        response = requests.post(f"{BASE_URL}/api/admin/verify", json={
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        assert response.json()["success"] is True


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
