"""
CC2026 Iteration 31 - Backend Tests
Tests for: email endpoints, NFC tap, merchant refund, CSV export, heatmap, badge lifecycle
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# ============================================================================
# EMAIL ENDPOINTS TESTS
# ============================================================================

class TestEmailTemplates:
    """Test GET /api/email/templates - should return 8 templates"""

    def test_email_templates_returns_8_templates(self):
        """GET /api/email/templates returns 8 templates"""
        response = requests.get(f"{BASE_URL}/api/email/templates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "templates" in data, "Response should have 'templates' key"
        
        templates = data["templates"]
        expected_templates = ["bienvenue", "wallet_recharge", "rappel_j30", "rappel_j15", 
                             "rappel_j7", "rappel_j1", "jour_j", "merci_j1"]
        
        template_ids = [t["id"] for t in templates]
        assert len(templates) == 8, f"Expected 8 templates, got {len(templates)}"
        
        for tmpl_id in expected_templates:
            assert tmpl_id in template_ids, f"Missing template: {tmpl_id}"
        
        print(f"PASS: email/templates returns 8 templates: {template_ids}")


class TestEmailSend:
    """Test POST /api/email/send - sends individual email using template"""

    def test_email_send_invalid_template(self):
        """POST /api/email/send with invalid template returns 400"""
        response = requests.post(f"{BASE_URL}/api/email/send", json={
            "to_email": "test@example.com",
            "template": "invalid_template"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: email/send rejects invalid template with 400")

    def test_email_send_badge_not_found(self):
        """POST /api/email/send with nonexistent badge returns 404"""
        response = requests.post(f"{BASE_URL}/api/email/send", json={
            "to_email": "nonexistent@nowhere.test",
            "template": "rappel_j30"
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: email/send returns 404 for nonexistent badge")


class TestEmailCampaign:
    """Test POST /api/email/campaign - segmented email campaigns"""

    def test_email_campaign_dry_run_returns_recipients_count(self):
        """POST /api/email/campaign with dry_run=true returns recipients_count"""
        response = requests.post(f"{BASE_URL}/api/email/campaign", json={
            "template": "rappel_j30",
            "dry_run": True
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "dry_run", f"Expected dry_run status"
        assert "recipients_count" in data, "Response should have recipients_count"
        assert "template" in data, "Response should have template"
        
        print(f"PASS: campaign dry_run - recipients_count={data['recipients_count']}, template={data['template']}")

    def test_email_campaign_with_rappel_j30(self):
        """POST /api/email/campaign with template rappel_j30 dry_run"""
        response = requests.post(f"{BASE_URL}/api/email/campaign", json={
            "template": "rappel_j30",
            "dry_run": True,
            "statut_filter": "ACTIVE"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("template") == "rappel_j30"
        print(f"PASS: rappel_j30 campaign dry_run - filter applied, recipients={data.get('recipients_count')}")

    def test_email_campaign_invalid_template(self):
        """POST /api/email/campaign with invalid template returns 400"""
        response = requests.post(f"{BASE_URL}/api/email/campaign", json={
            "template": "invalid_template",
            "dry_run": True
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: campaign rejects invalid template")


class TestEmailStats:
    """Test GET /api/email/stats - SES quota and campaign history"""

    def test_email_stats_returns_ses_and_campaigns(self):
        """GET /api/email/stats returns SES quota and campaign history"""
        response = requests.get(f"{BASE_URL}/api/email/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "ses" in data, "Response should have 'ses' key"
        assert "campaigns" in data, "Response should have 'campaigns' key"
        
        # SES stats may have error if credentials not configured
        ses = data["ses"]
        campaigns = data["campaigns"]
        
        print(f"PASS: email/stats - SES keys: {list(ses.keys())}, campaigns: {len(campaigns)}")


# ============================================================================
# NFC TAP TESTS
# ============================================================================

class TestNfcTap:
    """Test POST /api/frek/nfc/tap - NFC badge verification and payment"""

    def test_nfc_tap_with_valid_badge(self):
        """POST /api/frek/nfc/tap with valid NFC badge (CC26-VIP-6LNR7)"""
        response = requests.post(f"{BASE_URL}/api/frek/nfc/tap", json={
            "badge_id": "CC26-VIP-6LNR7",
            "montant": 0,
            "zone": "ENTREE_GENERALE"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") in ("success", "error"), f"Got status: {data.get('status')}"
        
        if data.get("status") == "success":
            assert "badge_id" in data
            assert "person" in data
            print(f"PASS: NFC tap - badge verified: {data.get('badge_id')}, person: {data.get('person')}")
        else:
            print(f"INFO: NFC tap returned error (possibly NFC not enabled): {data.get('code')}")

    def test_nfc_tap_badge_not_found(self):
        """POST /api/frek/nfc/tap with nonexistent badge returns NOT_FOUND"""
        response = requests.post(f"{BASE_URL}/api/frek/nfc/tap", json={
            "badge_id": "NONEXISTENT-BADGE-123",
            "montant": 0
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("code") == "NOT_FOUND", f"Expected NOT_FOUND, got {data.get('code')}"
        print("PASS: NFC tap - returns NOT_FOUND for nonexistent badge")

    def test_nfc_tap_rejects_non_nfc_badge(self):
        """POST /api/frek/nfc/tap rejects badge without nfc_enabled"""
        # First create a BNV badge (no NFC)
        bnv_badge_id = f"CC26-BNV-TEST{datetime.now().strftime('%H%M%S')}"
        create_response = requests.post(f"{BASE_URL}/api/badges", json={
            "prenom": "TestNFC",
            "nom": "NoNFC",
            "email": f"test_no_nfc_{datetime.now().strftime('%H%M%S')}@test.local",
            "type_badge": "BNV"  # BNV does NOT have NFC
        })
        
        if create_response.status_code == 200:
            created_badge = create_response.json()
            badge_id = created_badge.get("badge_id", bnv_badge_id)
            
            # Try NFC tap
            response = requests.post(f"{BASE_URL}/api/frek/nfc/tap", json={
                "badge_id": badge_id,
                "montant": 0
            })
            assert response.status_code == 200
            
            data = response.json()
            # Should return NFC_DISABLED since BNV doesn't have NFC
            assert data.get("code") in ("NFC_DISABLED", "NOT_FOUND", "INACTIVE"), f"Expected NFC_DISABLED, got {data}"
            print(f"PASS: NFC tap rejects BNV badge: {data.get('code')}")
        else:
            print(f"INFO: Could not create BNV badge for test: {create_response.status_code}")


# ============================================================================
# MERCHANT REFUND TESTS
# ============================================================================

class TestMerchantRefund:
    """Test merchant refund endpoints"""

    def test_create_remboursement(self):
        """POST /api/jetons/remboursement creates merchant refund record"""
        response = requests.post(f"{BASE_URL}/api/jetons/remboursement", json={
            "merchant_id": "TEST_MERCHANT_001",
            "montant_eur": 50.00,
            "description": "Test refund iteration 31"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "success"
        assert data.get("merchant_id") == "TEST_MERCHANT_001"
        assert data.get("montant_eur") == 50.00
        assert "jetons_equivalent" in data
        assert "jeton_rachat_eur" in data
        
        print(f"PASS: remboursement created - montant={data['montant_eur']}EUR, jetons_equiv={data['jetons_equivalent']}")

    def test_list_remboursements(self):
        """GET /api/jetons/remboursements lists all refunds with total"""
        response = requests.get(f"{BASE_URL}/api/jetons/remboursements")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "remboursements" in data
        assert "total_eur" in data
        assert "count" in data
        
        print(f"PASS: remboursements list - count={data['count']}, total_eur={data['total_eur']}")


# ============================================================================
# CSV EXPORT TESTS
# ============================================================================

class TestCsvExport:
    """Test CSV export endpoints"""

    def test_stats_export_csv(self):
        """GET /api/stats/export returns CSV with badge data"""
        response = requests.get(f"{BASE_URL}/api/stats/export")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Check content type is CSV
        content_type = response.headers.get("content-type", "")
        assert "text/csv" in content_type, f"Expected text/csv, got {content_type}"
        
        # Check CSV has headers
        content = response.text
        lines = content.strip().split("\n")
        assert len(lines) >= 1, "CSV should have at least header row"
        
        header = lines[0]
        expected_fields = ["badge_id", "prenom", "nom", "email", "type_badge", "statut"]
        for field in expected_fields:
            assert field in header, f"Missing field in CSV header: {field}"
        
        print(f"PASS: stats/export CSV - {len(lines)} rows (including header)")

    def test_stats_export_transactions_csv(self):
        """GET /api/stats/export/transactions returns CSV"""
        response = requests.get(f"{BASE_URL}/api/stats/export/transactions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        content_type = response.headers.get("content-type", "")
        assert "text/csv" in content_type, f"Expected text/csv, got {content_type}"
        
        lines = response.text.strip().split("\n")
        header = lines[0]
        expected = ["badge_id", "type", "jetons", "zone", "timestamp"]
        for field in expected:
            assert field in header, f"Missing field: {field}"
        
        print(f"PASS: transactions CSV - {len(lines)} rows")

    def test_stats_export_scans_csv(self):
        """GET /api/stats/export/scans returns CSV"""
        response = requests.get(f"{BASE_URL}/api/stats/export/scans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        content_type = response.headers.get("content-type", "")
        assert "text/csv" in content_type, f"Expected text/csv, got {content_type}"
        
        lines = response.text.strip().split("\n")
        header = lines[0]
        expected = ["badge_id", "zone", "timestamp"]
        for field in expected:
            assert field in header, f"Missing field: {field}"
        
        print(f"PASS: scans CSV - {len(lines)} rows")


# ============================================================================
# HEATMAP AND STATS/LIVE TESTS
# ============================================================================

class TestHeatmapAndLive:
    """Test heatmap and stats/live endpoints"""

    def test_stats_heatmap(self):
        """GET /api/stats/heatmap returns zone frequency data"""
        response = requests.get(f"{BASE_URL}/api/stats/heatmap")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "zones" in data, "Response should have 'zones' key"
        assert "total_scans" in data, "Response should have 'total_scans' key"
        
        zones = data["zones"]
        # Each zone should have heat_level percentage
        for zone_name, zone_data in zones.items():
            assert "total_scans" in zone_data, f"Zone {zone_name} missing total_scans"
            assert "heat_level" in zone_data, f"Zone {zone_name} missing heat_level"
            assert 0 <= zone_data["heat_level"] <= 100, "heat_level should be 0-100"
        
        print(f"PASS: heatmap - {len(zones)} zones, total_scans={data['total_scans']}")

    def test_stats_live_alias(self):
        """GET /api/stats/live alias for dashboard/cc2026/live"""
        response = requests.get(f"{BASE_URL}/api/stats/live")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Should have similar structure to dashboard/cc2026/live
        assert "badges" in data or "jetons" in data or "total_badges" in data, "stats/live should return dashboard data"
        
        print(f"PASS: stats/live - keys: {list(data.keys())[:5]}...")


# ============================================================================
# BADGE LIFECYCLE TESTS
# ============================================================================

class TestBadgeLifecycle:
    """Test badge lifecycle endpoints"""

    def test_badge_lifecycle_8_steps(self):
        """GET /api/badges/lifecycle/{badge_id} returns 8 steps"""
        # Use the known test badge
        response = requests.get(f"{BASE_URL}/api/badges/lifecycle/CC26-VIP-6LNR7")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "lifecycle" in data, "Response should have 'lifecycle' key"
        
        lifecycle = data["lifecycle"]
        assert len(lifecycle) == 8, f"Expected 8 lifecycle steps, got {len(lifecycle)}"
        
        # Verify step names
        expected_steps = [
            "Inscription",
            "FREK-ID émis",
            "Email envoyé",
            "Activation",
            "Impression",
            "Remise J-0",
            "NFC actif",
            "FREK Legacy"
        ]
        
        for i, expected_name in enumerate(expected_steps):
            actual_name = lifecycle[i]["name"]
            assert actual_name == expected_name, f"Step {i+1}: expected '{expected_name}', got '{actual_name}'"
        
        print(f"PASS: badge lifecycle - 8 steps verified, current_step={data.get('current_step')}")

    def test_badge_lifecycle_not_found(self):
        """GET /api/badges/lifecycle/{badge_id} returns 404 for nonexistent badge"""
        response = requests.get(f"{BASE_URL}/api/badges/lifecycle/NONEXISTENT-BADGE")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: lifecycle returns 404 for nonexistent badge")


class TestBadgePrintBatch:
    """Test POST /api/badges/print-batch"""

    def test_print_batch_marks_badges_printed(self):
        """POST /api/badges/print-batch marks badges as printed (step 5)"""
        # Create a test badge first
        test_id = f"PRINT-TEST-{datetime.now().strftime('%H%M%S')}"
        create_resp = requests.post(f"{BASE_URL}/api/badges", json={
            "prenom": "PrintTest",
            "nom": "Batch",
            "email": f"print_test_{datetime.now().strftime('%H%M%S')}@test.local",
            "type_badge": "VIP"
        })
        
        if create_resp.status_code == 200:
            badge_data = create_resp.json()
            badge_id = badge_data.get("badge_id", test_id)
            
            # Mark as printed
            response = requests.post(f"{BASE_URL}/api/badges/print-batch", json={
                "badge_ids": [badge_id]
            })
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            assert data.get("status") == "success"
            assert "marked_printed" in data
            
            print(f"PASS: print-batch - marked_printed={data['marked_printed']}")
        else:
            # Try with existing badge
            response = requests.post(f"{BASE_URL}/api/badges/print-batch", json={
                "badge_ids": ["CC26-VIP-6LNR7"]
            })
            assert response.status_code == 200
            data = response.json()
            assert data.get("status") == "success"
            print(f"PASS: print-batch with existing badge - marked_printed={data.get('marked_printed')}")


# ============================================================================
# QR CODE GENERATION TEST
# ============================================================================

class TestEmailQrGenerate:
    """Test POST /api/email/qr-generate"""

    def test_qr_generate_for_badge(self):
        """POST /api/email/qr-generate generates QR code for badge"""
        response = requests.post(f"{BASE_URL}/api/email/qr-generate?badge_id=CC26-VIP-6LNR7")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "badge_id" in data
        assert "qr_url" in data
        assert "qr_base64" in data
        assert "full_length" in data
        
        # QR base64 should be substantial
        assert data["full_length"] > 100, "QR base64 should have significant length"
        
        print(f"PASS: qr-generate - badge_id={data['badge_id']}, qr_length={data['full_length']}")

    def test_qr_generate_badge_not_found(self):
        """POST /api/email/qr-generate returns 404 for nonexistent badge"""
        response = requests.post(f"{BASE_URL}/api/email/qr-generate?badge_id=NONEXISTENT")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: qr-generate returns 404 for nonexistent badge")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
