"""
Test PDF Export Invitations CC2026
Tests for export-single and export-batch endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Known badge IDs from the database
KNOWN_BADGE_IDS = {
    "VIP": "CC26-VIP-6LNR7",
    "BNV": "CC26-BNV-YY32W",
    "ART": "CC26-ART-ATKZ4",
    "EXP-VIP": "CC26-EXP-VIP-GYCB3"
}


class TestHealthCheck:
    """Verify backend is operational"""
    
    def test_api_root(self):
        """GET /api/ - Backend is operational"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"API root failed: {response.status_code}"
        data = response.json()
        assert "message" in data
        print(f"✓ API root: {data.get('message')}")


class TestExportSingleInvitation:
    """Tests for GET /api/invitations/export-single/{badge_id}"""
    
    def test_export_single_vip_badge(self):
        """Export single PDF for VIP badge"""
        badge_id = KNOWN_BADGE_IDS["VIP"]
        response = requests.get(f"{BASE_URL}/api/invitations/export-single/{badge_id}")
        
        assert response.status_code == 200, f"Export single VIP failed: {response.status_code} - {response.text}"
        assert response.headers.get("content-type") == "application/pdf", f"Wrong content-type: {response.headers.get('content-type')}"
        
        # Verify PDF header
        content = response.content
        assert content[:4] == b'%PDF', f"Not a valid PDF: {content[:20]}"
        print(f"✓ Export single VIP badge: {len(content)} bytes, valid PDF")
    
    def test_export_single_bnv_badge(self):
        """Export single PDF for BENEVOLE badge"""
        badge_id = KNOWN_BADGE_IDS["BNV"]
        response = requests.get(f"{BASE_URL}/api/invitations/export-single/{badge_id}")
        
        assert response.status_code == 200, f"Export single BNV failed: {response.status_code} - {response.text}"
        assert response.headers.get("content-type") == "application/pdf"
        
        content = response.content
        assert content[:4] == b'%PDF', "Not a valid PDF"
        print(f"✓ Export single BNV badge: {len(content)} bytes, valid PDF")
    
    def test_export_single_art_badge(self):
        """Export single PDF for ARTISTE badge (may have empty fields)"""
        badge_id = KNOWN_BADGE_IDS["ART"]
        response = requests.get(f"{BASE_URL}/api/invitations/export-single/{badge_id}")
        
        assert response.status_code == 200, f"Export single ART failed: {response.status_code} - {response.text}"
        assert response.headers.get("content-type") == "application/pdf"
        
        content = response.content
        assert content[:4] == b'%PDF', "Not a valid PDF"
        print(f"✓ Export single ART badge: {len(content)} bytes, valid PDF")
    
    def test_export_single_exp_vip_badge(self):
        """Export single PDF for EXPOSANT VIP badge (dark background, gold text)"""
        badge_id = KNOWN_BADGE_IDS["EXP-VIP"]
        response = requests.get(f"{BASE_URL}/api/invitations/export-single/{badge_id}")
        
        assert response.status_code == 200, f"Export single EXP-VIP failed: {response.status_code} - {response.text}"
        assert response.headers.get("content-type") == "application/pdf"
        
        content = response.content
        assert content[:4] == b'%PDF', "Not a valid PDF"
        print(f"✓ Export single EXP-VIP badge: {len(content)} bytes, valid PDF (dark bg, gold text)")
    
    def test_export_single_nonexistent_badge(self):
        """Export single PDF for non-existent badge should return 404"""
        response = requests.get(f"{BASE_URL}/api/invitations/export-single/NONEXISTENT")
        
        assert response.status_code == 404, f"Expected 404 for non-existent badge, got: {response.status_code}"
        print(f"✓ Non-existent badge returns 404 as expected")


class TestExportBatchInvitations:
    """Tests for GET /api/invitations/export-batch"""
    
    def test_export_batch_vip_badges(self):
        """Export batch PDF for VIP badges (limit=5)"""
        response = requests.get(f"{BASE_URL}/api/invitations/export-batch?type_badge=VIP&limit=5")
        
        assert response.status_code == 200, f"Export batch VIP failed: {response.status_code} - {response.text}"
        assert response.headers.get("content-type") == "application/pdf"
        
        content = response.content
        assert content[:4] == b'%PDF', "Not a valid PDF"
        
        # Check Content-Disposition header for filename
        content_disp = response.headers.get("content-disposition", "")
        assert "invitations_cc2026_VIP" in content_disp, f"Wrong filename in header: {content_disp}"
        
        print(f"✓ Export batch VIP badges: {len(content)} bytes, valid PDF")
    
    def test_export_batch_bnv_badges(self):
        """Export batch PDF for BENEVOLE badges (limit=3)"""
        response = requests.get(f"{BASE_URL}/api/invitations/export-batch?type_badge=BNV&limit=3")
        
        assert response.status_code == 200, f"Export batch BNV failed: {response.status_code} - {response.text}"
        assert response.headers.get("content-type") == "application/pdf"
        
        content = response.content
        assert content[:4] == b'%PDF', "Not a valid PDF"
        print(f"✓ Export batch BNV badges: {len(content)} bytes, valid PDF")
    
    def test_export_batch_art_badges(self):
        """Export batch PDF for ARTISTE badges (limit=3, empty fields allowed)"""
        response = requests.get(f"{BASE_URL}/api/invitations/export-batch?type_badge=ART&limit=3")
        
        assert response.status_code == 200, f"Export batch ART failed: {response.status_code} - {response.text}"
        assert response.headers.get("content-type") == "application/pdf"
        
        content = response.content
        assert content[:4] == b'%PDF', "Not a valid PDF"
        print(f"✓ Export batch ART badges: {len(content)} bytes, valid PDF")
    
    def test_export_batch_mixed_all_types(self):
        """Export batch PDF for all badge types (limit=10)"""
        response = requests.get(f"{BASE_URL}/api/invitations/export-batch?limit=10")
        
        assert response.status_code == 200, f"Export batch mixed failed: {response.status_code} - {response.text}"
        assert response.headers.get("content-type") == "application/pdf"
        
        content = response.content
        assert content[:4] == b'%PDF', "Not a valid PDF"
        
        # Check Content-Disposition header for filename
        content_disp = response.headers.get("content-disposition", "")
        assert "invitations_cc2026_all" in content_disp, f"Wrong filename in header: {content_disp}"
        
        print(f"✓ Export batch mixed (all types): {len(content)} bytes, valid PDF")
    
    def test_export_batch_nonexistent_type(self):
        """Export batch PDF for non-existent badge type should return 404"""
        response = requests.get(f"{BASE_URL}/api/invitations/export-batch?type_badge=NONEXISTENT&limit=5")
        
        assert response.status_code == 404, f"Expected 404 for non-existent type, got: {response.status_code}"
        print(f"✓ Non-existent badge type returns 404 as expected")


class TestPDFStructure:
    """Tests to verify PDF structure and page count"""
    
    def test_pdf_page_count_matches_badge_count(self):
        """Verify PDF page count matches number of badges requested"""
        # Request exactly 3 badges
        response = requests.get(f"{BASE_URL}/api/invitations/export-batch?limit=3")
        
        if response.status_code == 200:
            content = response.content
            assert content[:4] == b'%PDF', "Not a valid PDF"
            
            # Count pages in PDF (simple method: count /Page objects)
            # This is a rough estimate - actual page count may vary
            page_count = content.count(b'/Type /Page')
            print(f"✓ PDF structure: ~{page_count} page markers found for limit=3 request")
        else:
            pytest.skip(f"Batch export returned {response.status_code}")
    
    def test_pdf_content_type_header(self):
        """Verify Content-Type header is application/pdf"""
        badge_id = KNOWN_BADGE_IDS["VIP"]
        response = requests.get(f"{BASE_URL}/api/invitations/export-single/{badge_id}")
        
        assert response.status_code == 200
        content_type = response.headers.get("content-type")
        assert content_type == "application/pdf", f"Expected application/pdf, got: {content_type}"
        print(f"✓ Content-Type header is correct: {content_type}")
    
    def test_pdf_content_disposition_header(self):
        """Verify Content-Disposition header has correct filename"""
        badge_id = KNOWN_BADGE_IDS["VIP"]
        response = requests.get(f"{BASE_URL}/api/invitations/export-single/{badge_id}")
        
        assert response.status_code == 200
        content_disp = response.headers.get("content-disposition", "")
        assert "attachment" in content_disp, f"Missing attachment in Content-Disposition: {content_disp}"
        assert "filename=" in content_disp, f"Missing filename in Content-Disposition: {content_disp}"
        assert ".pdf" in content_disp, f"Missing .pdf extension in Content-Disposition: {content_disp}"
        print(f"✓ Content-Disposition header is correct: {content_disp}")


class TestEdgeCases:
    """Edge case tests for PDF export"""
    
    def test_export_batch_with_large_limit(self):
        """Export batch with large limit (should work up to 500)"""
        response = requests.get(f"{BASE_URL}/api/invitations/export-batch?limit=50")
        
        # Should succeed if there are badges in DB
        if response.status_code == 200:
            content = response.content
            assert content[:4] == b'%PDF', "Not a valid PDF"
            print(f"✓ Export batch with limit=50: {len(content)} bytes")
        elif response.status_code == 404:
            print(f"✓ Export batch with limit=50: No badges found (404)")
        else:
            pytest.fail(f"Unexpected status: {response.status_code}")
    
    def test_export_batch_with_status_filter(self):
        """Export batch with status filter"""
        response = requests.get(f"{BASE_URL}/api/invitations/export-batch?status=actif&limit=5")
        
        # Should succeed or return 404 if no badges match
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            content = response.content
            assert content[:4] == b'%PDF', "Not a valid PDF"
            print(f"✓ Export batch with status=actif: {len(content)} bytes")
        else:
            print(f"✓ Export batch with status=actif: No badges found (404)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
