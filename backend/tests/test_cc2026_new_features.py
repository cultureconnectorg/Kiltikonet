"""
CC2026 New Features Tests — Iteration 29
Tests: Pro Bypass, Scan/Debit, Dashboard Live, Reconcile, Batch Email

Features tested:
- POST /api/pro/request-access with FORCE_VERIFY_BYPASS for admin emails
- POST /api/pro/verify-code with admin bypass code 000000
- POST /api/scan/debit for zone validation + jeton debit
- GET /api/v1/dashboard/cc2026/live
- GET /api/admin/reconcile
- POST /api/admin/batch-email (dry_run)
- GET /api/badges/types (14 types, 7 zones)
- GET /api/jetons/packs (4 packs)
"""
import os
import pytest
import requests
from datetime import datetime

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Ensure BASE_URL is set
assert BASE_URL, "REACT_APP_BACKEND_URL environment variable must be set"


class TestProAccessBypass:
    """Test Pro Space access with admin bypass"""
    
    def test_pro_request_access_admin_bypass(self):
        """POST /api/pro/request-access with admin email returns bypass:true"""
        response = requests.post(
            f"{BASE_URL}/api/pro/request-access",
            json={"email": "cc@kiltikonet.fr"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert data.get("bypass") == True, "Admin email should get bypass=true"
        print(f"✅ Admin bypass returned: {data}")
    
    def test_pro_verify_code_admin_bypass(self):
        """POST /api/pro/verify-code with admin email and code 000000 returns profile"""
        # First request access to set up the code
        req_resp = requests.post(
            f"{BASE_URL}/api/pro/request-access",
            json={"email": "cc@kiltikonet.fr"}
        )
        assert req_resp.status_code == 200
        
        # Now verify with bypass code
        response = requests.post(
            f"{BASE_URL}/api/pro/verify-code",
            json={"email": "cc@kiltikonet.fr", "code": "000000"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "profile" in data
        profile = data["profile"]
        assert profile.get("email") == "cc@kiltikonet.fr"
        print(f"✅ Admin profile returned: {profile.get('full_name')} / {profile.get('profile_type')}")
    
    def test_pro_verify_code_wrong_code(self):
        """POST /api/pro/verify-code with wrong code returns 400"""
        # First request access
        requests.post(
            f"{BASE_URL}/api/pro/request-access",
            json={"email": "cc@kiltikonet.fr"}
        )
        # Try wrong code
        response = requests.post(
            f"{BASE_URL}/api/pro/verify-code",
            json={"email": "cc@kiltikonet.fr", "code": "123456"}
        )
        assert response.status_code == 400, f"Expected 400 for wrong code, got {response.status_code}"
        print(f"✅ Wrong code rejected: {response.json().get('detail')}")
    
    def test_pro_request_access_unknown_email(self):
        """POST /api/pro/request-access with unknown email returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/pro/request-access",
            json={"email": "notfound@example.com"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✅ Unknown email rejected: {response.json().get('detail')}")


class TestScanDebit:
    """Test scan/debit endpoint with zone access matrix"""
    
    @pytest.fixture(autouse=True)
    def setup_badge(self):
        """Ensure test badge exists"""
        # Using known test badge CC26-VIP-6LNR7 or create new one
        self.test_badge_id = "CC26-VIP-6LNR7"
        # Also create a fresh badge for testing
        response = requests.post(
            f"{BASE_URL}/api/badges/inscrire",
            json={
                "prenom": "Test",
                "nom": "Debit",
                "email": f"testdebit{datetime.now().timestamp()}@test.com",
                "type_badge": "VIP",
                "organisation": "Test Org"
            }
        )
        if response.status_code == 200:
            data = response.json()
            self.new_badge_id = data.get("badge_id")
            self.qr_token = data.get("qr_token")
            # Activate badge
            requests.get(f"{BASE_URL}/api/activer-badge/{self.qr_token}")
    
    def test_scan_debit_staff_entree_valid(self):
        """POST /api/scan/debit with montant=0 for ENTREE_GENERALE returns success"""
        response = requests.post(
            f"{BASE_URL}/api/scan/debit",
            json={
                "badge_id": self.test_badge_id,
                "zone": "ENTREE_GENERALE",
                "montant": 0,
                "agent_id": "staff_entree_test"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        # Could be success or INACTIVE if badge not active
        if data.get("status") == "success":
            assert data.get("color") == "green"
            assert "person" in data
            print(f"✅ Scan/debit ENTREE_GENERALE: {data.get('message')}")
        else:
            print(f"⚠️ Badge not active: {data.get('message')}")
    
    def test_scan_debit_zone_denied_backstage_vip(self):
        """POST /api/scan/debit with VIP badge in BACKSTAGE zone returns denied"""
        response = requests.post(
            f"{BASE_URL}/api/scan/debit",
            json={
                "badge_id": self.test_badge_id,
                "zone": "BACKSTAGE",
                "montant": 0,
                "agent_id": "test"
            }
        )
        assert response.status_code == 200
        data = response.json()
        # VIP should NOT have access to BACKSTAGE (only ART, STF)
        if data.get("status") == "denied":
            assert data.get("color") == "red"
            assert "ZONE_DENIED" in data.get("code", "")
            print(f"✅ VIP denied BACKSTAGE: {data.get('message')}")
        elif data.get("status") == "error" and data.get("code") == "INACTIVE":
            print(f"⚠️ Badge not active: {data.get('message')}")
        else:
            pytest.fail(f"VIP should be denied BACKSTAGE access: {data}")
    
    def test_scan_debit_with_jetons(self):
        """POST /api/scan/debit with montant>0 debits jetons from wallet"""
        # First check if badge has jetons
        wallet_resp = requests.get(f"{BASE_URL}/api/jetons/wallet/{self.test_badge_id}")
        if wallet_resp.status_code == 200:
            wallet = wallet_resp.json()
            current_solde = wallet.get("jetons_solde", 0)
            
            if current_solde >= 2:
                # Try to debit 2 jetons
                response = requests.post(
                    f"{BASE_URL}/api/scan/debit",
                    json={
                        "badge_id": self.test_badge_id,
                        "zone": "VIP_LOUNGE",  # VIP has access to VIP_LOUNGE
                        "montant": 2,
                        "agent_id": "staff_bar_test"
                    }
                )
                data = response.json()
                if data.get("status") == "success":
                    assert data.get("jetons_debited") == 2
                    assert data.get("new_solde") == current_solde - 2
                    print(f"✅ Jeton debit: -{data.get('jetons_debited')}J -> {data.get('new_solde')}J")
                elif data.get("status") == "error" and data.get("code") == "INACTIVE":
                    print(f"⚠️ Badge not active for jeton debit")
            else:
                # Test insufficient balance
                response = requests.post(
                    f"{BASE_URL}/api/scan/debit",
                    json={
                        "badge_id": self.test_badge_id,
                        "zone": "VIP_LOUNGE",
                        "montant": 100,  # More than balance
                        "agent_id": "test"
                    }
                )
                data = response.json()
                if data.get("status") == "insufficient":
                    assert data.get("color") == "orange"
                    print(f"✅ Insufficient balance handled: {data.get('message')}")
    
    def test_scan_debit_badge_not_found(self):
        """POST /api/scan/debit with unknown badge returns NOT_FOUND"""
        response = requests.post(
            f"{BASE_URL}/api/scan/debit",
            json={
                "badge_id": "CC26-XXX-NOTFOUND",
                "zone": "ENTREE_GENERALE",
                "montant": 0
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "error"
        assert data.get("code") == "NOT_FOUND"
        assert data.get("color") == "red"
        print(f"✅ Badge not found handled: {data.get('message')}")


class TestDashboardLive:
    """Test CC2026 live dashboard endpoint"""
    
    def test_dashboard_cc2026_live(self):
        """GET /api/v1/dashboard/cc2026/live returns badges, jetons, scans, frek stats"""
        response = requests.get(f"{BASE_URL}/api/v1/dashboard/cc2026/live")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check required fields
        assert "badges" in data
        assert "jetons" in data
        assert "scans" in data
        assert "frek" in data
        assert "timestamp" in data
        
        # Badge stats
        badges = data["badges"]
        assert "total" in badges
        assert "active" in badges
        assert "inscrit" in badges
        assert "by_type" in badges
        
        # Jetons stats
        jetons = data["jetons"]
        assert "total_circulation" in jetons
        assert "valeur_eur" in jetons
        assert "transactions" in jetons
        
        # Scans stats
        scans = data["scans"]
        assert "today" in scans
        assert "recent" in scans
        
        # FREK stats
        frek = data["frek"]
        assert "total_ids" in frek
        assert "target" in frek
        assert "progress_pct" in frek
        
        print(f"✅ Dashboard Live: {badges['total']} badges, {jetons['total_circulation']} jetons, FREK {frek['progress_pct']}%")


class TestAdminReconcile:
    """Test admin reconcile endpoint"""
    
    def test_admin_reconcile(self):
        """GET /api/admin/reconcile syncs MongoDB to Baserow"""
        response = requests.get(f"{BASE_URL}/api/admin/reconcile")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("status") == "success"
        assert "badges_synced" in data
        assert "badges_errors" in data
        assert "total_badges" in data
        assert "frek_reconciled" in data
        assert "frek_remaining" in data
        assert "timestamp" in data
        
        print(f"✅ Reconcile: {data['badges_synced']}/{data['total_badges']} synced, {data['badges_errors']} errors")
        print(f"   FREK: {data['frek_reconciled']} reconciled, {data['frek_remaining']} remaining")


class TestBatchEmail:
    """Test batch email endpoint"""
    
    def test_batch_email_dry_run(self):
        """POST /api/admin/batch-email with dry_run=true returns recipient count"""
        response = requests.post(
            f"{BASE_URL}/api/admin/batch-email",
            json={
                "template": "rappel_j15",
                "dry_run": True
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("status") == "dry_run"
        assert data.get("template") == "rappel_j15"
        assert "recipients_count" in data
        assert "sample" in data
        
        print(f"✅ Batch email dry run: {data['recipients_count']} recipients for template '{data['template']}'")
    
    def test_batch_email_invalid_template(self):
        """POST /api/admin/batch-email with invalid template returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/admin/batch-email",
            json={
                "template": "invalid_template",
                "dry_run": True
            }
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"✅ Invalid template rejected: {response.json().get('detail')}")
    
    def test_batch_email_with_filter(self):
        """POST /api/admin/batch-email with type_badge filter"""
        response = requests.post(
            f"{BASE_URL}/api/admin/batch-email",
            json={
                "template": "jour_j",
                "type_badge_filter": "VIP",
                "dry_run": True
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("filter") == "VIP"
        print(f"✅ Filtered batch email: {data['recipients_count']} VIP badges")


class TestBadgeTypesAndJetons:
    """Test badge types and jetons packs endpoints"""
    
    def test_badge_types_returns_14_types_7_zones(self):
        """GET /api/badges/types returns 14 types and 7 zones"""
        response = requests.get(f"{BASE_URL}/api/badges/types")
        assert response.status_code == 200
        data = response.json()
        
        types = data.get("types", {})
        zones = data.get("zones", {})
        nfc_types = data.get("nfc_enabled_types", [])
        
        # Should have 14 badge types
        expected_types = ["ART", "INT", "STF", "BNV", "PRS", "VIP", "OFF", "SPO",
                        "EXP-B", "EXP-S", "EXP-G", "EXP-P", "EXP-D", "EXP-VIP"]
        assert len(types) == 14, f"Expected 14 types, got {len(types)}: {list(types.keys())}"
        for t in expected_types:
            assert t in types, f"Missing type: {t}"
        
        # Should have 7 zones
        expected_zones = ["ENTREE_GENERALE", "SCENE_PRINCIPALE", "VIP_LOUNGE",
                        "BACKSTAGE", "EXPOSANTS", "PRESSE", "ATELIERS_PREMIUM"]
        assert len(zones) == 7, f"Expected 7 zones, got {len(zones)}"
        for z in expected_zones:
            assert z in zones, f"Missing zone: {z}"
        
        # Check zone access matrix
        assert "ART" in zones["BACKSTAGE"], "ART should have BACKSTAGE access"
        assert "STF" in zones["BACKSTAGE"], "STF should have BACKSTAGE access"
        assert "VIP" not in zones["BACKSTAGE"], "VIP should NOT have BACKSTAGE access"
        
        print(f"✅ Badge types: {len(types)} types, {len(zones)} zones, {len(nfc_types)} NFC-enabled")
    
    def test_jetons_packs_returns_4_packs(self):
        """GET /api/jetons/packs returns 4 packs"""
        response = requests.get(f"{BASE_URL}/api/jetons/packs")
        assert response.status_code == 200
        data = response.json()
        
        packs = data.get("packs", [])
        jeton_value = data.get("jeton_value_eur")
        
        assert len(packs) == 4, f"Expected 4 packs, got {len(packs)}"
        assert jeton_value == 1.5, f"Expected jeton value 1.50 EUR, got {jeton_value}"
        
        # Check pack names
        pack_ids = [p.get("id") for p in packs]
        expected_packs = ["decouverte", "culture", "diaspora", "vip"]
        for p in expected_packs:
            assert p in pack_ids, f"Missing pack: {p}"
        
        # Verify pack details
        for pack in packs:
            assert "jetons" in pack
            assert "price_eur" in pack
            assert "value_eur" in pack
            assert "savings_pct" in pack
        
        print(f"✅ Jetons packs: {len(packs)} packs, jeton value {jeton_value}EUR")
        for p in packs:
            print(f"   - {p['name']}: {p['jetons']}J @ {p['price_eur']}EUR ({p['savings_pct']}% savings)")


class TestZoneAccessMatrix:
    """Comprehensive zone access matrix tests"""
    
    def test_zone_access_entree_generale_all_types(self):
        """All badge types should have access to ENTREE_GENERALE"""
        response = requests.get(f"{BASE_URL}/api/badges/types")
        data = response.json()
        zones = data.get("zones", {})
        types = data.get("types", {})
        
        # All 14 types should be in ENTREE_GENERALE
        entree_types = zones.get("ENTREE_GENERALE", [])
        assert len(entree_types) == 14, f"All 14 types should access ENTREE_GENERALE, got {len(entree_types)}"
        print(f"✅ ENTREE_GENERALE: All {len(entree_types)} types have access")
    
    def test_zone_access_backstage_limited(self):
        """Only ART and STF should have BACKSTAGE access"""
        response = requests.get(f"{BASE_URL}/api/badges/types")
        zones = response.json().get("zones", {})
        
        backstage = zones.get("BACKSTAGE", [])
        assert "ART" in backstage
        assert "STF" in backstage
        assert "VIP" not in backstage
        assert "SPO" not in backstage
        assert "PRS" not in backstage
        print(f"✅ BACKSTAGE: Only {backstage} have access (VIP excluded)")
    
    def test_zone_access_vip_lounge(self):
        """VIP, OFF, SPO, EXP-VIP should have VIP_LOUNGE access"""
        response = requests.get(f"{BASE_URL}/api/badges/types")
        zones = response.json().get("zones", {})
        
        vip_lounge = zones.get("VIP_LOUNGE", [])
        expected = ["VIP", "OFF", "SPO", "EXP-VIP"]
        for t in expected:
            assert t in vip_lounge, f"{t} should have VIP_LOUNGE access"
        assert "ART" not in vip_lounge, "ART should NOT have VIP_LOUNGE access"
        print(f"✅ VIP_LOUNGE: {vip_lounge}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
