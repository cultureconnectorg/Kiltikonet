"""
Iteration 44 - CC2026 Appel a Projet Candidatures API Tests
Tests for:
- POST /api/candidatures/cc2026 (submit candidature)
- GET /api/candidatures/cc2026 (list candidatures)
- PUT /api/candidatures/cc2026/{id}/status (change status)
- GET /api/candidatures/cc2026/export (CSV export)
- GET /api/docs/{filename} (DOCX file download)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tarifs-update.preview.emergentagent.com')

# Test data for candidature submission
def get_valid_candidature_body():
    unique_id = uuid.uuid4().hex[:6]
    return {
        "nom_complet": f"Test Candidat {unique_id}",
        "email": f"test_{unique_id}@example.com",
        "organisation": "Test Organisation",
        "territoire": "Martinique",
        "profil": "Artiste",
        "nom_projet": f"Projet Test {unique_id}",
        "description_projet": "Description du projet de test pour l'appel a projet Culture Connect 2026. Ce projet vise a promouvoir la culture caribéenne.",
        "impact_culturel": "Impact culturel significatif sur la communauté locale et la diaspora.",
        "lien_web": "https://example.com/projet",
        "format_souhaite": "Conference/table ronde",
        "engagement_cc": True
    }


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"API health check failed: {response.status_code}"
        print("✓ API health check passed")


class TestCandidatureSubmission:
    """POST /api/candidatures/cc2026 - Submit candidature tests"""
    
    def test_submit_candidature_success(self):
        """Test successful candidature submission with all required fields"""
        body = get_valid_candidature_body()
        response = requests.post(f"{BASE_URL}/api/candidatures/cc2026", json=body)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "success" in data, "Response should contain 'success' field"
        assert data["success"] == True, "success should be True"
        assert "id" in data, "Response should contain 'id' field"
        
        # Verify ID format CC26-AAP-xxx
        assert data["id"].startswith("CC26-AAP-"), f"ID should start with CC26-AAP-, got {data['id']}"
        print(f"✓ Candidature submitted successfully with ID: {data['id']}")
        
        return data["id"]
    
    def test_submit_candidature_without_engagement_cc(self):
        """Test candidature submission fails without engagement_cc=true"""
        body = get_valid_candidature_body()
        body["engagement_cc"] = False
        
        response = requests.post(f"{BASE_URL}/api/candidatures/cc2026", json=body)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data, "Error response should contain 'detail'"
        assert "engagement" in data["detail"].lower() or "obligatoire" in data["detail"].lower(), \
            f"Error should mention engagement, got: {data['detail']}"
        print("✓ Candidature without engagement_cc correctly rejected with 400")
    
    def test_submit_candidature_minimal_fields(self):
        """Test candidature with only required fields (no optional fields)"""
        unique_id = uuid.uuid4().hex[:6]
        body = {
            "nom_complet": f"Minimal Test {unique_id}",
            "email": f"minimal_{unique_id}@test.com",
            "territoire": "Caraibes",
            "profil": "Association culturelle",
            "nom_projet": f"Projet Minimal {unique_id}",
            "description_projet": "Description minimale du projet.",
            "impact_culturel": "Impact culturel minimal.",
            "format_souhaite": "Atelier/workshop",
            "engagement_cc": True
        }
        
        response = requests.post(f"{BASE_URL}/api/candidatures/cc2026", json=body)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert data["id"].startswith("CC26-AAP-")
        print(f"✓ Minimal candidature submitted successfully with ID: {data['id']}")


class TestCandidatureList:
    """GET /api/candidatures/cc2026 - List candidatures tests"""
    
    def test_list_candidatures(self):
        """Test listing all candidatures"""
        response = requests.get(f"{BASE_URL}/api/candidatures/cc2026")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify response structure
        assert "candidatures" in data, "Response should contain 'candidatures' field"
        assert "total" in data, "Response should contain 'total' field"
        assert isinstance(data["candidatures"], list), "candidatures should be a list"
        assert isinstance(data["total"], int), "total should be an integer"
        
        print(f"✓ Listed {data['total']} candidatures")
        return data
    
    def test_list_candidatures_with_status_filter(self):
        """Test listing candidatures filtered by status"""
        response = requests.get(f"{BASE_URL}/api/candidatures/cc2026?status=recue")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # All returned candidatures should have status 'recue'
        for c in data["candidatures"]:
            assert c["status"] == "recue", f"Expected status 'recue', got {c['status']}"
        
        print(f"✓ Listed {data['total']} candidatures with status 'recue'")


class TestCandidatureStatusUpdate:
    """PUT /api/candidatures/cc2026/{id}/status - Status update tests"""
    
    @pytest.fixture
    def created_candidature_id(self):
        """Create a candidature and return its ID for testing"""
        body = get_valid_candidature_body()
        response = requests.post(f"{BASE_URL}/api/candidatures/cc2026", json=body)
        assert response.status_code == 200
        return response.json()["id"]
    
    def test_update_status_to_retenue(self, created_candidature_id):
        """Test changing status to 'retenue'"""
        response = requests.put(
            f"{BASE_URL}/api/candidatures/cc2026/{created_candidature_id}/status?status=retenue"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["success"] == True
        assert data["id"] == created_candidature_id
        assert data["status"] == "retenue"
        print(f"✓ Status changed to 'retenue' for {created_candidature_id}")
    
    def test_update_status_to_en_instruction(self, created_candidature_id):
        """Test changing status to 'en_instruction'"""
        response = requests.put(
            f"{BASE_URL}/api/candidatures/cc2026/{created_candidature_id}/status?status=en_instruction"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["status"] == "en_instruction"
        print(f"✓ Status changed to 'en_instruction' for {created_candidature_id}")
    
    def test_update_status_to_refusee(self, created_candidature_id):
        """Test changing status to 'refusee'"""
        response = requests.put(
            f"{BASE_URL}/api/candidatures/cc2026/{created_candidature_id}/status?status=refusee"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["status"] == "refusee"
        print(f"✓ Status changed to 'refusee' for {created_candidature_id}")
    
    def test_update_status_invalid(self, created_candidature_id):
        """Test that invalid status returns 400"""
        response = requests.put(
            f"{BASE_URL}/api/candidatures/cc2026/{created_candidature_id}/status?status=invalide"
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print("✓ Invalid status correctly rejected with 400")
    
    def test_update_status_nonexistent_candidature(self):
        """Test updating status of non-existent candidature returns 404"""
        response = requests.put(
            f"{BASE_URL}/api/candidatures/cc2026/CC26-AAP-NONEXISTENT/status?status=retenue"
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent candidature correctly returns 404")


class TestCandidatureExport:
    """GET /api/candidatures/cc2026/export - CSV export tests"""
    
    def test_export_csv(self):
        """Test CSV export returns valid CSV file"""
        response = requests.get(f"{BASE_URL}/api/candidatures/cc2026/export")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Check content type
        content_type = response.headers.get("content-type", "")
        assert "text/csv" in content_type, f"Expected text/csv, got {content_type}"
        
        # Check content disposition header
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition, "Should have attachment disposition"
        assert "candidatures_cc2026.csv" in content_disposition, "Filename should be candidatures_cc2026.csv"
        
        # Verify CSV content has headers
        content = response.text
        assert "id" in content, "CSV should contain 'id' column"
        assert "nom_complet" in content, "CSV should contain 'nom_complet' column"
        assert "email" in content, "CSV should contain 'email' column"
        
        print("✓ CSV export successful with correct headers and content")


class TestDocumentDownload:
    """GET /api/docs/{filename} - DOCX file download tests"""
    
    def test_download_cahier_des_charges_fr(self):
        """Test downloading French cahier des charges"""
        response = requests.get(f"{BASE_URL}/api/docs/AAP_CahierDesCharges_FR.docx")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Check content type
        content_type = response.headers.get("content-type", "")
        assert "application/vnd.openxmlformats-officedocument.wordprocessingml.document" in content_type, \
            f"Expected DOCX content type, got {content_type}"
        
        # Check file size (should be > 0)
        assert len(response.content) > 0, "File should not be empty"
        
        print(f"✓ Downloaded AAP_CahierDesCharges_FR.docx ({len(response.content)} bytes)")
    
    def test_download_culture_connect_en(self):
        """Test downloading English version"""
        response = requests.get(f"{BASE_URL}/api/docs/AAP_CultureConnect2026_EN.docx")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert len(response.content) > 0, "File should not be empty"
        
        print(f"✓ Downloaded AAP_CultureConnect2026_EN.docx ({len(response.content)} bytes)")
    
    def test_download_culture_connect_kw(self):
        """Test downloading Creole version"""
        response = requests.get(f"{BASE_URL}/api/docs/AAP_CultureConnect2026_KW.docx")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert len(response.content) > 0, "File should not be empty"
        
        print(f"✓ Downloaded AAP_CultureConnect2026_KW.docx ({len(response.content)} bytes)")
    
    def test_download_nonexistent_file(self):
        """Test downloading non-existent file returns 404"""
        response = requests.get(f"{BASE_URL}/api/docs/fichier_inexistant.docx")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent file correctly returns 404")
    
    def test_download_unsafe_filename(self):
        """Test that unsafe filenames are rejected (whitelist protection)"""
        # The backend uses a whitelist of allowed filenames, so any filename not in the list returns 404
        response = requests.get(f"{BASE_URL}/api/docs/malicious_file.docx")
        
        assert response.status_code == 404, f"Expected 404 for non-whitelisted file, got {response.status_code}"
        print("✓ Non-whitelisted filename correctly rejected")


class TestEndToEndFlow:
    """End-to-end flow: Create -> List -> Update Status -> Verify"""
    
    def test_full_candidature_flow(self):
        """Test complete candidature lifecycle"""
        # 1. Create candidature
        body = get_valid_candidature_body()
        create_response = requests.post(f"{BASE_URL}/api/candidatures/cc2026", json=body)
        assert create_response.status_code == 200
        candidature_id = create_response.json()["id"]
        print(f"  1. Created candidature: {candidature_id}")
        
        # 2. Verify it appears in list
        list_response = requests.get(f"{BASE_URL}/api/candidatures/cc2026")
        assert list_response.status_code == 200
        candidatures = list_response.json()["candidatures"]
        found = any(c["id"] == candidature_id for c in candidatures)
        assert found, f"Candidature {candidature_id} not found in list"
        print(f"  2. Verified candidature appears in list")
        
        # 3. Update status to en_instruction
        update_response = requests.put(
            f"{BASE_URL}/api/candidatures/cc2026/{candidature_id}/status?status=en_instruction"
        )
        assert update_response.status_code == 200
        print(f"  3. Updated status to 'en_instruction'")
        
        # 4. Verify status change in list
        list_response2 = requests.get(f"{BASE_URL}/api/candidatures/cc2026?status=en_instruction")
        assert list_response2.status_code == 200
        candidatures2 = list_response2.json()["candidatures"]
        found_updated = any(c["id"] == candidature_id and c["status"] == "en_instruction" for c in candidatures2)
        assert found_updated, f"Candidature {candidature_id} not found with status 'en_instruction'"
        print(f"  4. Verified status change persisted")
        
        # 5. Update to retenue
        final_response = requests.put(
            f"{BASE_URL}/api/candidatures/cc2026/{candidature_id}/status?status=retenue"
        )
        assert final_response.status_code == 200
        print(f"  5. Updated status to 'retenue'")
        
        print(f"✓ Full candidature flow completed successfully for {candidature_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
