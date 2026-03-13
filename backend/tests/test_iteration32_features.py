"""
CC2026 Iteration 32 - New Features Test Suite
Tests for:
1. Badge types API - VIS (Visiteur) type verification
2. Badge inscription with VIS type
3. Analytics jetons overview endpoint (Recharts dashboard)
4. SES domain status endpoint (AWS SES migration)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ============= BADGE TYPES TESTS =============
class TestBadgeTypes:
    """Badge types endpoint tests - verify VIS type exists"""
    
    def test_get_badge_types_success(self):
        """GET /api/badges/types returns all badge types including VIS"""
        response = requests.get(f"{BASE_URL}/api/badges/types")
        assert response.status_code == 200
        
        data = response.json()
        assert "types" in data
        assert "VIS" in data["types"], "VIS type should exist for Visiteur badge"
        assert data["types"]["VIS"] == "Visiteur"
        
    def test_vis_type_has_general_entry_access(self):
        """VIS type should have ENTREE_GENERALE zone access"""
        response = requests.get(f"{BASE_URL}/api/badges/types")
        assert response.status_code == 200
        
        data = response.json()
        assert "zones" in data
        assert "ENTREE_GENERALE" in data["zones"]
        assert "VIS" in data["zones"]["ENTREE_GENERALE"], "VIS should have general entry access"
        
    def test_vis_not_nfc_enabled(self):
        """VIS type should NOT be NFC enabled (free badge)"""
        response = requests.get(f"{BASE_URL}/api/badges/types")
        assert response.status_code == 200
        
        data = response.json()
        assert "nfc_enabled_types" in data
        assert "VIS" not in data["nfc_enabled_types"], "VIS should not be NFC enabled"


# ============= BADGE INSCRIPTION TESTS =============
class TestBadgeInscription:
    """Badge inscription tests with VIS type"""
    
    def test_inscribe_visiteur_badge(self):
        """POST /api/badges/inscrire with type_badge=VIS creates a free visitor badge"""
        unique_email = f"test_vis_{int(time.time())}@testcc2026.com"
        
        response = requests.post(
            f"{BASE_URL}/api/badges/inscrire",
            json={
                "prenom": "Test",
                "nom": "Visiteur",
                "email": unique_email,
                "type_badge": "VIS"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["type_badge"] == "VIS"
        assert data["type_label"] == "Visiteur"
        assert "badge_id" in data
        assert data["badge_id"].startswith("CC26-VIS-")
        assert data["nfc_enabled"] == False, "VIS badge should not have NFC"
        assert data["statut"] == "INSCRIT"
        assert "frek_id" in data  # FREK integration (may be LOCAL- in fallback mode)
        
    def test_inscribe_duplicate_email_rejected(self):
        """POST /api/badges/inscrire with duplicate email returns 409"""
        unique_email = f"test_dup_{int(time.time())}@testcc2026.com"
        
        # First inscription
        response1 = requests.post(
            f"{BASE_URL}/api/badges/inscrire",
            json={
                "prenom": "First",
                "nom": "User",
                "email": unique_email,
                "type_badge": "VIS"
            }
        )
        assert response1.status_code == 200
        
        # Duplicate inscription
        response2 = requests.post(
            f"{BASE_URL}/api/badges/inscrire",
            json={
                "prenom": "Second",
                "nom": "User",
                "email": unique_email,
                "type_badge": "VIS"
            }
        )
        assert response2.status_code == 409
        
    def test_inscribe_invalid_badge_type_rejected(self):
        """POST /api/badges/inscrire with invalid type returns 400"""
        unique_email = f"test_invalid_{int(time.time())}@testcc2026.com"
        
        response = requests.post(
            f"{BASE_URL}/api/badges/inscrire",
            json={
                "prenom": "Test",
                "nom": "Invalid",
                "email": unique_email,
                "type_badge": "INVALID_TYPE"
            }
        )
        assert response.status_code == 400


# ============= ANALYTICS JETONS TESTS =============
class TestJetonsAnalytics:
    """Analytics endpoint tests for Jetons dashboard (Recharts)"""
    
    def test_jetons_overview_returns_data(self):
        """GET /api/analytics/jetons/overview returns all required fields"""
        response = requests.get(f"{BASE_URL}/api/analytics/jetons/overview")
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify summary structure
        assert "summary" in data
        summary = data["summary"]
        assert "total_jetons_circulation" in summary
        assert "total_purchased" in summary
        assert "total_spent" in summary
        assert "total_revenue_eur" in summary
        assert "valeur_totale_eur" in summary
        assert "holders_count" in summary
        assert "total_badges" in summary
        assert "total_transactions" in summary
        
    def test_jetons_overview_timeline_structure(self):
        """GET /api/analytics/jetons/overview timeline is a list"""
        response = requests.get(f"{BASE_URL}/api/analytics/jetons/overview")
        assert response.status_code == 200
        
        data = response.json()
        assert "timeline" in data
        assert isinstance(data["timeline"], list)
        
    def test_jetons_overview_pack_distribution(self):
        """GET /api/analytics/jetons/overview pack_distribution is a list"""
        response = requests.get(f"{BASE_URL}/api/analytics/jetons/overview")
        assert response.status_code == 200
        
        data = response.json()
        assert "pack_distribution" in data
        assert isinstance(data["pack_distribution"], list)
        
    def test_jetons_overview_frek_core_status(self):
        """GET /api/analytics/jetons/overview includes frek_core connection status"""
        response = requests.get(f"{BASE_URL}/api/analytics/jetons/overview")
        assert response.status_code == 200
        
        data = response.json()
        assert "frek_core" in data
        frek = data["frek_core"]
        assert "connected" in frek
        assert isinstance(frek["connected"], bool)


# ============= SES DOMAIN STATUS TESTS =============
class TestSESDomainStatus:
    """SES domain verification status tests (AWS SES migration)"""
    
    def test_ses_domain_status_returns_domain_info(self):
        """GET /api/ses/domain/status returns kiltikonet.fr status"""
        response = requests.get(f"{BASE_URL}/api/ses/domain/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data["domain"] == "kiltikonet.fr"
        
    def test_ses_domain_status_has_verification_info(self):
        """GET /api/ses/domain/status returns verification status"""
        response = requests.get(f"{BASE_URL}/api/ses/domain/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "verification" in data
        assert "status" in data["verification"]
        
    def test_ses_domain_status_has_dkim_info(self):
        """GET /api/ses/domain/status returns DKIM configuration"""
        response = requests.get(f"{BASE_URL}/api/ses/domain/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "dkim" in data
        assert "enabled" in data["dkim"]
        assert "status" in data["dkim"]
        
    def test_ses_domain_status_has_dns_records_needed(self):
        """GET /api/ses/domain/status returns required DNS records"""
        response = requests.get(f"{BASE_URL}/api/ses/domain/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "dns_records_needed" in data
        dns = data["dns_records_needed"]
        
        # Check SPF record structure
        assert "spf" in dns
        assert dns["spf"]["type"] == "TXT"
        assert dns["spf"]["name"] == "kiltikonet.fr"
        assert "amazonses.com" in dns["spf"]["value"]
        
        # Check DMARC record structure
        assert "dmarc" in dns
        assert dns["dmarc"]["type"] == "TXT"
        assert "_dmarc" in dns["dmarc"]["name"]
        
    def test_ses_domain_status_has_quota_info(self):
        """GET /api/ses/domain/status returns sending quota"""
        response = requests.get(f"{BASE_URL}/api/ses/domain/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "quota" in data
        assert "max_24h" in data["quota"]
        assert "sent_last_24h" in data["quota"]


# ============= BADGE STATS TESTS =============
class TestBadgeStats:
    """Badge statistics endpoint tests"""
    
    def test_badge_stats_returns_totals(self):
        """GET /api/badges/stats returns total counts"""
        response = requests.get(f"{BASE_URL}/api/badges/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total" in data
        assert "by_type" in data
        assert "by_statut" in data
        
    def test_badge_stats_includes_vis_type(self):
        """GET /api/badges/stats by_type includes VIS if any exist"""
        response = requests.get(f"{BASE_URL}/api/badges/stats")
        assert response.status_code == 200
        
        data = response.json()
        # VIS type should exist in by_type if any VIS badges were created
        assert isinstance(data["by_type"], dict)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
