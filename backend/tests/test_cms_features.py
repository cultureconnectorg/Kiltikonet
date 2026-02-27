"""
CMS Feature Tests for Culture Connect 2026
Testing: CMS Admin endpoints, Program content, Theme, Pages

Features tested:
- CMS Theme API (colors, fonts)
- CMS Content API (program pages)  
- CMS Pages API (dynamic pages with slugs)
- Public API endpoints
"""

import pytest
import requests
import os
import uuid

# Load BASE_URL from frontend .env
def get_base_url():
    env_file = '/app/frontend/.env'
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip().rstrip('/')
    return os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

BASE_URL = get_base_url()

class TestCMSTheme:
    """Theme configuration tests"""
    
    def test_get_theme(self):
        """GET /api/cms/theme - should return theme configuration"""
        response = requests.get(f"{BASE_URL}/api/cms/theme")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify theme structure
        assert "primary_color" in data
        assert "secondary_color" in data
        assert "accent_color" in data
        assert "background_color" in data
        assert "text_color" in data
        assert "font_family" in data
        
        # Verify terracotta color for Day 3 highlighting
        assert data["primary_color"] == "#A65D47", f"Expected terracotta #A65D47, got {data['primary_color']}"
        print(f"✓ Theme loaded with primary_color: {data['primary_color']}")
    
    def test_public_theme_endpoint(self):
        """GET /api/public/theme - should work without auth"""
        response = requests.get(f"{BASE_URL}/api/public/theme")
        assert response.status_code == 200
        
        data = response.json()
        assert "primary_color" in data
        assert "font_family" in data
        print("✓ Public theme endpoint accessible")


class TestCMSContent:
    """Content management tests"""
    
    def test_get_program_content(self):
        """GET /api/public/content/program - should return 4 days with Day 3 highlighted"""
        response = requests.get(f"{BASE_URL}/api/public/content/program")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify program structure
        assert "official_program" in data, "Missing official_program section"
        assert "intro" in data, "Missing intro section"
        
        program = data["official_program"]
        assert "days" in program, "Missing days in program"
        
        days = program["days"]
        assert len(days) == 4, f"Expected 4 days, got {len(days)}"
        print(f"✓ Program has {len(days)} days")
        
        # Verify Day 3 is highlighted with terracotta
        day3 = days[2]  # 0-indexed
        assert day3["id"] == "day3", f"Day 3 ID mismatch: {day3['id']}"
        assert day3["is_highlight"] == True, "Day 3 should be highlighted"
        assert day3["highlight_color"] == "#A65D47", f"Day 3 color should be terracotta, got {day3['highlight_color']}"
        assert "ABOLITION" in day3["label"].upper(), f"Day 3 should mention Abolition: {day3['label']}"
        print(f"✓ Day 3 (Abolition) correctly highlighted with terracotta {day3['highlight_color']}")
        
        # Verify slots structure
        for day in days:
            assert "slots" in day, f"Day {day['id']} missing slots"
            assert "site" in day, f"Day {day['id']} missing site"
            assert "label" in day, f"Day {day['id']} missing label"
            for slot in day.get("slots", []):
                assert "time" in slot, "Slot missing time"
                assert "title" in slot, "Slot missing title"
        print("✓ All days have valid slot structure")
    
    def test_get_home_content(self):
        """GET /api/public/content/home - should return home page content"""
        response = requests.get(f"{BASE_URL}/api/public/content/home")
        assert response.status_code == 200
        
        data = response.json()
        # Home page should have hero and intro sections
        if "hero" in data:
            assert "title" in data["hero"]
        if "intro" in data:
            assert "title" in data["intro"]
        print("✓ Home content endpoint working")
    
    def test_cms_content_list(self):
        """GET /api/cms/content - should list all content"""
        response = requests.get(f"{BASE_URL}/api/cms/content")
        assert response.status_code == 200
        
        data = response.json()
        assert "content" in data
        assert "total" in data
        print(f"✓ CMS content list: {data['total']} items")
    
    def test_init_defaults(self):
        """POST /api/cms/content/init-defaults - should initialize default content"""
        response = requests.post(f"{BASE_URL}/api/cms/content/init-defaults")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        print("✓ Default content initialization working")


class TestCMSPages:
    """Dynamic pages tests"""
    
    def test_get_pages_list(self):
        """GET /api/cms/pages - should return list of custom pages"""
        response = requests.get(f"{BASE_URL}/api/cms/pages")
        assert response.status_code == 200
        
        data = response.json()
        assert "pages" in data
        assert "total" in data
        assert isinstance(data["pages"], list)
        print(f"✓ Pages list: {data['total']} pages")
    
    def test_create_and_delete_page(self):
        """POST/DELETE /api/cms/pages - CRUD for dynamic pages"""
        unique_slug = f"test-page-{uuid.uuid4().hex[:8]}"
        
        # Create page
        create_payload = {
            "title": "TEST Page de test",
            "slug": unique_slug,
            "content": "<h2>Contenu de test</h2><p>Ceci est une page de test.</p>",
            "meta_description": "Test description",
            "published": True,
            "tenant_id": "culture-connect-2026"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/cms/pages", json=create_payload)
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        
        created_page = create_response.json()
        assert created_page.get("success") == True
        assert "page" in created_page
        page_id = created_page["page"]["id"]
        print(f"✓ Created page with ID: {page_id}")
        
        # Verify page via public endpoint
        public_response = requests.get(f"{BASE_URL}/api/public/page/{unique_slug}")
        assert public_response.status_code == 200, f"Public page fetch failed: {public_response.status_code}"
        
        public_data = public_response.json()
        assert public_data["title"] == "TEST Page de test"
        print(f"✓ Public page accessible at /p/{unique_slug}")
        
        # Delete page (cleanup)
        delete_response = requests.delete(f"{BASE_URL}/api/cms/pages/{page_id}")
        assert delete_response.status_code == 200
        print("✓ Page deleted successfully")
    
    def test_public_page_404(self):
        """GET /api/public/page/nonexistent - should return 404"""
        response = requests.get(f"{BASE_URL}/api/public/page/nonexistent-slug-12345")
        assert response.status_code == 404
        print("✓ Non-existent page returns 404")


class TestCMSMedia:
    """Media management tests"""
    
    def test_get_media_list(self):
        """GET /api/cms/media - should return media items"""
        response = requests.get(f"{BASE_URL}/api/cms/media")
        assert response.status_code == 200
        
        data = response.json()
        assert "media" in data
        assert "total" in data
        print(f"✓ Media list: {data['total']} items")


class TestCMSSpeakers:
    """Speakers/intervenants tests"""
    
    def test_get_speakers_list(self):
        """GET /api/cms/speakers - should return speakers list"""
        response = requests.get(f"{BASE_URL}/api/cms/speakers")
        assert response.status_code == 200
        
        data = response.json()
        assert "speakers" in data
        assert "total" in data
        print(f"✓ Speakers list: {data['total']} speakers")


class TestCMSPartners:
    """Partners tests"""
    
    def test_get_partners_list(self):
        """GET /api/cms/partners - should return partners list"""
        response = requests.get(f"{BASE_URL}/api/cms/partners")
        assert response.status_code == 200
        
        data = response.json()
        assert "partners" in data
        assert "total" in data
        print(f"✓ Partners list: {data['total']} partners")


class TestProgramFeatures:
    """Specific program feature tests as per requirements"""
    
    def test_4_day_program_structure(self):
        """Verify 4-day program structure with correct dates"""
        response = requests.get(f"{BASE_URL}/api/public/content/program")
        assert response.status_code == 200
        
        data = response.json()
        days = data["official_program"]["days"]
        
        expected_days = [
            ("day1", "2026-05-20", "Mardi 20 Mai", False),
            ("day2", "2026-05-21", "Mercredi 21 Mai", False),
            ("day3", "2026-05-22", "Jeudi 22 Mai", True),  # Abolition - highlighted
            ("day4", "2026-05-23", "Vendredi 23 Mai", False),
        ]
        
        for i, (day_id, date, label_contains, is_highlight) in enumerate(expected_days):
            day = days[i]
            assert day["id"] == day_id, f"Day {i+1} ID mismatch"
            assert day["date"] == date, f"Day {i+1} date mismatch"
            assert label_contains.lower() in day["label"].lower(), f"Day {i+1} label should contain {label_contains}"
            assert day["is_highlight"] == is_highlight, f"Day {i+1} highlight mismatch"
            print(f"✓ {day_id}: {day['date']} - highlight={is_highlight}")
    
    def test_day3_terracotta_highlight(self):
        """Verify Day 3 (Abolition) has terracotta #A65D47 highlight"""
        response = requests.get(f"{BASE_URL}/api/public/content/program")
        data = response.json()
        
        day3 = data["official_program"]["days"][2]
        
        assert day3["is_highlight"] == True, "Day 3 must be highlighted"
        assert day3["highlight_color"] == "#A65D47", f"Day 3 must use terracotta #A65D47, got {day3['highlight_color']}"
        assert "ABOLITION" in day3["label"].upper(), "Day 3 label must mention ABOLITION"
        print(f"✓ Day 3 Abolition correctly highlighted with terracotta {day3['highlight_color']}")
    
    def test_slot_structure(self):
        """Verify slots have required fields: time, title, description, speaker"""
        response = requests.get(f"{BASE_URL}/api/public/content/program")
        data = response.json()
        
        for day in data["official_program"]["days"]:
            for slot in day["slots"]:
                assert "time" in slot, f"Slot in {day['id']} missing time"
                assert "title" in slot, f"Slot in {day['id']} missing title"
                assert "description" in slot, f"Slot in {day['id']} missing description"
                assert "speaker" in slot, f"Slot in {day['id']} missing speaker"
        
        print("✓ All slots have required fields (time, title, description, speaker)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
