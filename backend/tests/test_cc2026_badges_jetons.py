"""
Test suite for CC2026 Badge & Jetons System
Tests: Badge inscription (14 types), badge activation, zone access control, jetons packs
FREK API is in fallback mode - generates LOCAL-{uuid} IDs
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# 14 badge types
BADGE_TYPES = ['ART', 'INT', 'STF', 'BNV', 'PRS', 'VIP', 'OFF', 'SPO', 
               'EXP-B', 'EXP-S', 'EXP-G', 'EXP-P', 'EXP-D', 'EXP-VIP']

# 7 zones
ZONES = ['ENTREE_GENERALE', 'SCENE_PRINCIPALE', 'VIP_LOUNGE', 'BACKSTAGE', 'EXPOSANTS', 'PRESSE', 'ATELIERS_PREMIUM']

# Zone access matrix 
ZONE_ACCESS = {
    "ENTREE_GENERALE": set(BADGE_TYPES),
    "SCENE_PRINCIPALE": {"ART", "OFF", "VIP", "STF"},
    "VIP_LOUNGE": {"VIP", "OFF", "SPO", "EXP-VIP"},
    "BACKSTAGE": {"ART", "STF"},
    "EXPOSANTS": {"EXP-B", "EXP-S", "EXP-G", "EXP-P", "EXP-D", "EXP-VIP", "STF"},
    "PRESSE": {"PRS", "OFF"},
    "ATELIERS_PREMIUM": set(BADGE_TYPES),  # Requires 5 jetons minimum
}

# NFC enabled types
NFC_ENABLED_TYPES = {"VIP", "OFF", "SPO", "EXP-G", "EXP-P", "EXP-D", "EXP-VIP"}

@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestBadgeTypes:
    """Test GET /api/badges/types - Returns 14 types and 7 zones"""
    
    def test_get_badge_types(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/badges/types")
        assert response.status_code == 200
        
        data = response.json()
        assert "types" in data
        assert "zones" in data
        assert "nfc_enabled_types" in data
        
        # Verify 14 types
        types = data["types"]
        assert len(types) == 14
        for t in BADGE_TYPES:
            assert t in types
        
        # Verify 7 zones
        zones = data["zones"]
        assert len(zones) == 7
        for z in ZONES:
            assert z in zones
        
        # Verify NFC enabled types
        nfc_types = set(data["nfc_enabled_types"])
        assert nfc_types == NFC_ENABLED_TYPES
        
        print(f"SUCCESS: 14 badge types and 7 zones returned")


class TestBadgeInscription:
    """Test POST /api/badges/inscrire - Badge creation with all 14 types"""
    
    def test_inscription_vip_badge(self, api_client):
        """Test VIP badge inscription with CC26-TYPE-CODE5 format"""
        unique_email = f"test_vip_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "prenom": "Test",
            "nom": "VIPUser",
            "email": unique_email,
            "type_badge": "VIP",
            "organisation": "Test Org"
        }
        response = api_client.post(f"{BASE_URL}/api/badges/inscrire", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "badge_id" in data
        assert "frek_id" in data
        assert "qr_token" in data
        
        # Validate CC26-TYPE-CODE5 format
        badge_id = data["badge_id"]
        assert badge_id.startswith("CC26-VIP-")
        code5 = badge_id.split("-")[-1]
        assert len(code5) == 5
        assert code5.isupper()
        
        # FREK should be in fallback mode (LOCAL-xxx)
        frek_id = data["frek_id"]
        assert frek_id.startswith("LOCAL-")
        assert data["frek_status"] == "local_fallback"
        
        # Verify NFC enabled for VIP
        assert data["nfc_enabled"] == True
        assert data["statut"] == "INSCRIT"
        
        print(f"SUCCESS: VIP badge created: {badge_id}, FREK: {frek_id}")
        return badge_id, data["qr_token"]
    
    def test_inscription_bnv_badge(self, api_client):
        """Test BNV (Benevole) badge - no NFC"""
        unique_email = f"test_bnv_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "prenom": "Test",
            "nom": "Benevole",
            "email": unique_email,
            "type_badge": "BNV"
        }
        response = api_client.post(f"{BASE_URL}/api/badges/inscrire", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        badge_id = data["badge_id"]
        assert badge_id.startswith("CC26-BNV-")
        assert data["nfc_enabled"] == False  # BNV not NFC enabled
        
        print(f"SUCCESS: BNV badge created: {badge_id}")
    
    def test_inscription_art_badge(self, api_client):
        """Test ART (Artiste) badge - no NFC, can access BACKSTAGE"""
        unique_email = f"test_art_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "prenom": "Test",
            "nom": "Artiste",
            "email": unique_email,
            "type_badge": "ART"
        }
        response = api_client.post(f"{BASE_URL}/api/badges/inscrire", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        badge_id = data["badge_id"]
        assert badge_id.startswith("CC26-ART-")
        assert data["nfc_enabled"] == False
        
        print(f"SUCCESS: ART badge created: {badge_id}")
    
    def test_inscription_exp_vip_badge(self, api_client):
        """Test EXP-VIP (Exposant VIP) badge - NFC enabled"""
        unique_email = f"test_expvip_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "prenom": "Test",
            "nom": "ExposantVIP",
            "email": unique_email,
            "type_badge": "EXP-VIP",
            "organisation": "Premium Exhibitor"
        }
        response = api_client.post(f"{BASE_URL}/api/badges/inscrire", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        badge_id = data["badge_id"]
        assert badge_id.startswith("CC26-EXP-VIP-")
        assert data["nfc_enabled"] == True
        
        print(f"SUCCESS: EXP-VIP badge created: {badge_id}")
    
    def test_inscription_invalid_type(self, api_client):
        """Test invalid badge type returns 400"""
        payload = {
            "prenom": "Test",
            "nom": "Invalid",
            "email": "invalid@example.com",
            "type_badge": "INVALID"
        }
        response = api_client.post(f"{BASE_URL}/api/badges/inscrire", json=payload)
        assert response.status_code == 400
        assert "invalide" in response.json()["detail"].lower()
        
        print("SUCCESS: Invalid type rejected with 400")
    
    def test_inscription_duplicate_email(self, api_client):
        """Test duplicate email returns 409"""
        unique_email = f"test_dup_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "prenom": "First",
            "nom": "User",
            "email": unique_email,
            "type_badge": "BNV"
        }
        # First registration
        response = api_client.post(f"{BASE_URL}/api/badges/inscrire", json=payload)
        assert response.status_code == 200
        
        # Second registration with same email
        payload["prenom"] = "Second"
        response = api_client.post(f"{BASE_URL}/api/badges/inscrire", json=payload)
        assert response.status_code == 409
        assert "deja inscrit" in response.json()["detail"].lower()
        
        print("SUCCESS: Duplicate email rejected with 409")


class TestBadgeActivation:
    """Test GET /api/activer-badge/{qr_token} - Activate badge INSCRIT->ACTIVE"""
    
    def test_activate_badge(self, api_client):
        """Create badge and activate it via QR token"""
        unique_email = f"test_act_{uuid.uuid4().hex[:8]}@example.com"
        # Create badge
        payload = {
            "prenom": "Activate",
            "nom": "TestUser",
            "email": unique_email,
            "type_badge": "VIP"
        }
        create_res = api_client.post(f"{BASE_URL}/api/badges/inscrire", json=payload)
        assert create_res.status_code == 200
        create_data = create_res.json()
        qr_token = create_data["qr_token"]
        badge_id = create_data["badge_id"]
        
        # Wait for async Baserow mirror (optional)
        time.sleep(0.5)
        
        # Activate badge
        activate_res = api_client.get(f"{BASE_URL}/api/activer-badge/{qr_token}")
        assert activate_res.status_code == 200
        
        activate_data = activate_res.json()
        assert activate_data["badge_id"] == badge_id
        assert activate_data["statut"] == "ACTIVE"
        assert "message" in activate_data
        
        print(f"SUCCESS: Badge {badge_id} activated (INSCRIT -> ACTIVE)")
    
    def test_activate_invalid_token(self, api_client):
        """Test invalid QR token returns 404"""
        response = api_client.get(f"{BASE_URL}/api/activer-badge/invalid_token_12345")
        assert response.status_code == 404
        
        print("SUCCESS: Invalid token returns 404")


class TestBadgeScan:
    """Test POST /api/badges/scan - Zone access control"""
    
    def _create_and_activate_badge(self, api_client, badge_type):
        """Helper to create and activate a badge"""
        unique_email = f"test_scan_{badge_type}_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "prenom": "Scan",
            "nom": f"Test{badge_type}",
            "email": unique_email,
            "type_badge": badge_type
        }
        create_res = api_client.post(f"{BASE_URL}/api/badges/inscrire", json=payload)
        assert create_res.status_code == 200
        data = create_res.json()
        
        # Activate
        activate_res = api_client.get(f"{BASE_URL}/api/activer-badge/{data['qr_token']}")
        assert activate_res.status_code == 200
        
        return data["badge_id"]
    
    def test_vip_zone_access(self, api_client):
        """VIP can enter ENTREE_GENERALE, VIP_LOUNGE but NOT BACKSTAGE"""
        badge_id = self._create_and_activate_badge(api_client, "VIP")
        
        # Can enter ENTREE_GENERALE
        scan_res = api_client.post(f"{BASE_URL}/api/badges/scan", json={
            "badge_id": badge_id,
            "zone": "ENTREE_GENERALE"
        })
        assert scan_res.status_code == 200
        assert scan_res.json()["access"] == True
        
        # Can enter VIP_LOUNGE
        scan_res = api_client.post(f"{BASE_URL}/api/badges/scan", json={
            "badge_id": badge_id,
            "zone": "VIP_LOUNGE"
        })
        assert scan_res.status_code == 200
        assert scan_res.json()["access"] == True
        
        # CANNOT enter BACKSTAGE
        scan_res = api_client.post(f"{BASE_URL}/api/badges/scan", json={
            "badge_id": badge_id,
            "zone": "BACKSTAGE"
        })
        assert scan_res.status_code == 200
        assert scan_res.json()["access"] == False
        
        print(f"SUCCESS: VIP zone access verified")
    
    def test_art_backstage_access(self, api_client):
        """ART (Artiste) can enter BACKSTAGE"""
        badge_id = self._create_and_activate_badge(api_client, "ART")
        
        # Can enter BACKSTAGE
        scan_res = api_client.post(f"{BASE_URL}/api/badges/scan", json={
            "badge_id": badge_id,
            "zone": "BACKSTAGE"
        })
        assert scan_res.status_code == 200
        assert scan_res.json()["access"] == True
        
        # CANNOT enter VIP_LOUNGE
        scan_res = api_client.post(f"{BASE_URL}/api/badges/scan", json={
            "badge_id": badge_id,
            "zone": "VIP_LOUNGE"
        })
        assert scan_res.status_code == 200
        assert scan_res.json()["access"] == False
        
        print(f"SUCCESS: ART backstage access verified")
    
    def test_inactive_badge_cannot_scan(self, api_client):
        """Badge with status INSCRIT cannot scan (must be ACTIVE)"""
        unique_email = f"test_inactive_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "prenom": "Inactive",
            "nom": "User",
            "email": unique_email,
            "type_badge": "BNV"
        }
        create_res = api_client.post(f"{BASE_URL}/api/badges/inscrire", json=payload)
        badge_id = create_res.json()["badge_id"]
        
        # Try to scan without activation
        scan_res = api_client.post(f"{BASE_URL}/api/badges/scan", json={
            "badge_id": badge_id,
            "zone": "ENTREE_GENERALE"
        })
        assert scan_res.status_code == 403
        assert "non actif" in scan_res.json()["detail"].lower()
        
        print("SUCCESS: Inactive badge rejected for scan")


class TestBadgeLookupAndList:
    """Test GET /api/badges/lookup and /api/badges/list"""
    
    def test_badge_lookup(self, api_client):
        """Lookup badge by ID"""
        unique_email = f"test_lookup_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "prenom": "Lookup",
            "nom": "Test",
            "email": unique_email,
            "type_badge": "OFF"
        }
        create_res = api_client.post(f"{BASE_URL}/api/badges/inscrire", json=payload)
        badge_id = create_res.json()["badge_id"]
        
        lookup_res = api_client.get(f"{BASE_URL}/api/badges/lookup/{badge_id}")
        assert lookup_res.status_code == 200
        
        data = lookup_res.json()
        assert data["badge_id"] == badge_id
        assert data["prenom"] == "Lookup"
        assert data["nom"] == "Test"
        assert data["type_badge"] == "OFF"
        assert "qr_token" not in data  # Should be hidden
        
        print(f"SUCCESS: Badge lookup works for {badge_id}")
    
    def test_badge_lookup_not_found(self, api_client):
        """Lookup non-existent badge returns 404"""
        response = api_client.get(f"{BASE_URL}/api/badges/lookup/CC26-XXX-00000")
        assert response.status_code == 404
        
        print("SUCCESS: Non-existent badge returns 404")
    
    def test_badge_list(self, api_client):
        """List badges"""
        response = api_client.get(f"{BASE_URL}/api/badges/list")
        assert response.status_code == 200
        
        data = response.json()
        assert "badges" in data
        assert "total" in data
        
        print(f"SUCCESS: Badge list returns {data['total']} badges")
    
    def test_badge_list_filter_by_type(self, api_client):
        """List badges filtered by type"""
        response = api_client.get(f"{BASE_URL}/api/badges/list?type_badge=VIP")
        assert response.status_code == 200
        
        data = response.json()
        for badge in data["badges"]:
            assert badge["type_badge"] == "VIP"
        
        print(f"SUCCESS: Badge list filtered by VIP: {data['total']} badges")


class TestBadgeStats:
    """Test GET /api/badges/stats"""
    
    def test_badge_stats(self, api_client):
        """Get badge statistics"""
        response = api_client.get(f"{BASE_URL}/api/badges/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total" in data
        assert "by_type" in data
        assert "by_statut" in data
        assert "nfc_count" in data
        assert "jetons_total" in data
        
        print(f"SUCCESS: Badge stats - Total: {data['total']}, NFC: {data['nfc_count']}")


class TestJetonsPacks:
    """Test GET /api/jetons/packs - 4 packs"""
    
    def test_get_packs(self, api_client):
        """Get jetons packs - decouverte, culture, diaspora, vip"""
        response = api_client.get(f"{BASE_URL}/api/jetons/packs")
        assert response.status_code == 200
        
        data = response.json()
        assert "packs" in data
        assert "jeton_value_eur" in data
        assert data["jeton_value_eur"] == 1.5
        
        packs = {p["id"]: p for p in data["packs"]}
        assert len(packs) == 4
        
        # Verify pack details
        assert packs["decouverte"]["jetons"] == 10
        assert packs["decouverte"]["price_eur"] == 13.50
        
        assert packs["culture"]["jetons"] == 25
        assert packs["culture"]["price_eur"] == 30.00
        
        assert packs["diaspora"]["jetons"] == 50
        assert packs["diaspora"]["price_eur"] == 55.00
        
        assert packs["vip"]["jetons"] == 100
        assert packs["vip"]["price_eur"] == 100.00
        
        print("SUCCESS: 4 jetons packs verified with correct prices")


class TestJetonsWallet:
    """Test GET /api/jetons/wallet/{badge_id}"""
    
    def test_wallet_lookup(self, api_client):
        """Lookup wallet by badge ID"""
        unique_email = f"test_wallet_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "prenom": "Wallet",
            "nom": "Test",
            "email": unique_email,
            "type_badge": "BNV"
        }
        create_res = api_client.post(f"{BASE_URL}/api/badges/inscrire", json=payload)
        badge_id = create_res.json()["badge_id"]
        
        wallet_res = api_client.get(f"{BASE_URL}/api/jetons/wallet/{badge_id}")
        assert wallet_res.status_code == 200
        
        data = wallet_res.json()
        assert data["badge_id"] == badge_id
        assert data["jetons_solde"] == 0  # New badge has 0 jetons
        assert data["valeur_eur"] == 0.0
        
        print(f"SUCCESS: Wallet lookup for {badge_id}: {data['jetons_solde']} jetons")
    
    def test_wallet_not_found(self, api_client):
        """Wallet lookup for non-existent badge returns 404"""
        response = api_client.get(f"{BASE_URL}/api/jetons/wallet/CC26-XXX-00000")
        assert response.status_code == 404
        
        print("SUCCESS: Non-existent wallet returns 404")


class TestJetonsSpend:
    """Test POST /api/jetons/spend - Spend jetons"""
    
    def test_spend_insufficient_balance(self, api_client):
        """Spend more than balance returns 400"""
        unique_email = f"test_spend_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "prenom": "Spend",
            "nom": "Test",
            "email": unique_email,
            "type_badge": "BNV"
        }
        create_res = api_client.post(f"{BASE_URL}/api/badges/inscrire", json=payload)
        badge_id = create_res.json()["badge_id"]
        
        # Try to spend with 0 balance
        spend_res = api_client.post(f"{BASE_URL}/api/jetons/spend", json={
            "badge_id": badge_id,
            "amount": 5,
            "description": "Test spend"
        })
        assert spend_res.status_code == 400
        assert "insuffisant" in spend_res.json()["detail"].lower()
        
        print("SUCCESS: Insufficient balance rejected")
    
    def test_spend_invalid_amount(self, api_client):
        """Spend 0 or negative amount returns 400"""
        unique_email = f"test_spend_inv_{uuid.uuid4().hex[:8]}@example.com"
        payload = {
            "prenom": "SpendInv",
            "nom": "Test",
            "email": unique_email,
            "type_badge": "BNV"
        }
        create_res = api_client.post(f"{BASE_URL}/api/badges/inscrire", json=payload)
        badge_id = create_res.json()["badge_id"]
        
        spend_res = api_client.post(f"{BASE_URL}/api/jetons/spend", json={
            "badge_id": badge_id,
            "amount": 0
        })
        assert spend_res.status_code == 400
        
        print("SUCCESS: Invalid amount (0) rejected")


class TestJetonsStats:
    """Test GET /api/jetons/stats"""
    
    def test_jetons_stats(self, api_client):
        """Get jetons economy stats"""
        response = api_client.get(f"{BASE_URL}/api/jetons/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_jetons_circulation" in data
        assert "valeur_totale_eur" in data
        assert "holders" in data
        assert "total_badges" in data
        
        print(f"SUCCESS: Jetons stats - Total: {data['total_jetons_circulation']}, Holders: {data['holders']}")


class TestFREKHealth:
    """Test GET /api/frek/health"""
    
    def test_frek_health(self, api_client):
        """Check FREK health - should be in fallback mode"""
        response = api_client.get(f"{BASE_URL}/api/frek/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "healthy" in data
        assert "fallback_mode" in data
        # FREK is NOT reachable, so healthy should be False
        # But fallback_mode should be 'true'
        assert data["fallback_mode"] == "true"
        
        print(f"SUCCESS: FREK health - healthy: {data['healthy']}, fallback: {data['fallback_mode']}")


class TestFREKStatus:
    """Test GET /api/badges/frek-status"""
    
    def test_frek_status(self, api_client):
        """Check FREK status endpoint"""
        response = api_client.get(f"{BASE_URL}/api/badges/frek-status")
        assert response.status_code == 200
        
        data = response.json()
        assert "frek_available" in data
        assert "retry_queue_size" in data
        assert "fallback_mode" in data
        
        print(f"SUCCESS: FREK status - available: {data['frek_available']}, queue: {data['retry_queue_size']}")
