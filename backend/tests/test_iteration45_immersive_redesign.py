"""
Iteration 45 - Immersive Redesign Testing
Tests for JetonsPage and AppelPage immersive redesign with animations
Backend APIs: jetons/packs, candidatures/cc2026
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestJetonsAPI:
    """Tests for Jetons API endpoints"""
    
    def test_get_packs_returns_4_packs(self):
        """GET /api/jetons/packs should return 4 packs"""
        response = requests.get(f"{BASE_URL}/api/jetons/packs")
        assert response.status_code == 200
        
        data = response.json()
        assert "packs" in data
        assert len(data["packs"]) == 4
        
        # Verify pack IDs
        pack_ids = [p["id"] for p in data["packs"]]
        assert "decouverte" in pack_ids
        assert "culture" in pack_ids
        assert "diaspora" in pack_ids
        assert "vip" in pack_ids
        print(f"✓ GET /api/jetons/packs - 4 packs returned: {pack_ids}")
    
    def test_packs_have_required_fields(self):
        """Each pack should have required fields"""
        response = requests.get(f"{BASE_URL}/api/jetons/packs")
        assert response.status_code == 200
        
        data = response.json()
        required_fields = ["id", "name", "jetons", "price_eur", "value_eur", "savings_pct"]
        
        for pack in data["packs"]:
            for field in required_fields:
                assert field in pack, f"Pack {pack.get('id')} missing field: {field}"
        
        print("✓ All packs have required fields")
    
    def test_vip_pack_has_best_savings(self):
        """VIP pack should have highest savings percentage"""
        response = requests.get(f"{BASE_URL}/api/jetons/packs")
        assert response.status_code == 200
        
        data = response.json()
        vip_pack = next((p for p in data["packs"] if p["id"] == "vip"), None)
        assert vip_pack is not None
        
        # VIP should have 33% savings (highest)
        assert vip_pack["savings_pct"] == 33
        assert vip_pack["jetons"] == 100
        print(f"✓ VIP pack has 33% savings and 100 jetons")


class TestCandidaturesAPI:
    """Tests for Candidatures CC2026 API endpoints"""
    
    def test_list_candidatures(self):
        """GET /api/candidatures/cc2026 should return candidatures list"""
        response = requests.get(f"{BASE_URL}/api/candidatures/cc2026")
        assert response.status_code == 200
        
        data = response.json()
        assert "candidatures" in data
        assert "total" in data
        assert isinstance(data["candidatures"], list)
        print(f"✓ GET /api/candidatures/cc2026 - {data['total']} candidatures returned")
    
    def test_submit_candidature_success(self):
        """POST /api/candidatures/cc2026 should create new candidature"""
        unique_id = uuid.uuid4().hex[:6]
        payload = {
            "nom_complet": f"Test Iteration45 {unique_id}",
            "email": f"test_iter45_{unique_id}@example.com",
            "organisation": "Test Organisation",
            "territoire": "Martinique",
            "profil": "Artiste",
            "nom_projet": f"Projet Test Iter45 {unique_id}",
            "description_projet": "Description du projet de test pour l'iteration 45.",
            "impact_culturel": "Impact culturel significatif.",
            "lien_web": "https://example.com/projet",
            "format_souhaite": "Conference/table ronde",
            "engagement_cc": True
        }
        
        response = requests.post(f"{BASE_URL}/api/candidatures/cc2026", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "id" in data
        assert data["id"].startswith("CC26-AAP-")
        print(f"✓ POST /api/candidatures/cc2026 - Created candidature: {data['id']}")
        
        return data["id"]
    
    def test_submit_candidature_without_engagement_fails(self):
        """POST /api/candidatures/cc2026 without engagement should fail"""
        unique_id = uuid.uuid4().hex[:6]
        payload = {
            "nom_complet": f"Test NoEngagement {unique_id}",
            "email": f"test_noeng_{unique_id}@example.com",
            "territoire": "Martinique",
            "profil": "Artiste",
            "nom_projet": f"Projet NoEngagement {unique_id}",
            "description_projet": "Description.",
            "impact_culturel": "Impact.",
            "format_souhaite": "Conference/table ronde",
            "engagement_cc": False  # Should fail
        }
        
        response = requests.post(f"{BASE_URL}/api/candidatures/cc2026", json=payload)
        assert response.status_code == 400
        print("✓ POST /api/candidatures/cc2026 without engagement - Correctly rejected (400)")


class TestDocsAPI:
    """Tests for Document download endpoints"""
    
    def test_download_cahier_des_charges_fr(self):
        """GET /api/docs/AAP_CahierDesCharges_FR.docx should return document"""
        response = requests.get(f"{BASE_URL}/api/docs/AAP_CahierDesCharges_FR.docx")
        assert response.status_code == 200
        assert "application/vnd.openxmlformats" in response.headers.get("content-type", "")
        print("✓ GET /api/docs/AAP_CahierDesCharges_FR.docx - Document available")
    
    def test_download_english_version(self):
        """GET /api/docs/AAP_CultureConnect2026_EN.docx should return document"""
        response = requests.get(f"{BASE_URL}/api/docs/AAP_CultureConnect2026_EN.docx")
        assert response.status_code == 200
        print("✓ GET /api/docs/AAP_CultureConnect2026_EN.docx - Document available")
    
    def test_download_creole_version(self):
        """GET /api/docs/AAP_CultureConnect2026_KW.docx should return document"""
        response = requests.get(f"{BASE_URL}/api/docs/AAP_CultureConnect2026_KW.docx")
        assert response.status_code == 200
        print("✓ GET /api/docs/AAP_CultureConnect2026_KW.docx - Document available")


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """GET /api/ should return health status"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print("✓ GET /api/ - API is healthy")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
