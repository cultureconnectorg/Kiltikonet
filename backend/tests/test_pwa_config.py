"""
PWA Configuration Tests - Iteration 58
Tests manifest.json, sw.js, icon-512.png, and PWA meta tags
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPWAConfiguration:
    """PWA Configuration endpoint tests"""
    
    def test_manifest_json_accessible(self):
        """Test manifest.json returns HTTP 200"""
        response = requests.get(f"{BASE_URL}/manifest.json", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ manifest.json accessible (HTTP 200)")
    
    def test_manifest_json_content_type(self):
        """Test manifest.json has correct content type"""
        response = requests.get(f"{BASE_URL}/manifest.json", timeout=10)
        content_type = response.headers.get('Content-Type', '')
        assert 'application/json' in content_type or 'text/json' in content_type, f"Expected JSON content type, got {content_type}"
        print("✓ manifest.json has JSON content type")
    
    def test_manifest_short_name(self):
        """Test manifest.json has correct short_name"""
        response = requests.get(f"{BASE_URL}/manifest.json", timeout=10)
        data = response.json()
        assert data.get('short_name') == 'CultureConnect', f"Expected 'CultureConnect', got {data.get('short_name')}"
        print("✓ manifest.json short_name = CultureConnect")
    
    def test_manifest_name(self):
        """Test manifest.json has correct name"""
        response = requests.get(f"{BASE_URL}/manifest.json", timeout=10)
        data = response.json()
        assert data.get('name') == 'Culture Connect Pro', f"Expected 'Culture Connect Pro', got {data.get('name')}"
        print("✓ manifest.json name = Culture Connect Pro")
    
    def test_manifest_theme_color(self):
        """Test manifest.json has correct theme_color"""
        response = requests.get(f"{BASE_URL}/manifest.json", timeout=10)
        data = response.json()
        assert data.get('theme_color') == '#214F4B', f"Expected '#214F4B', got {data.get('theme_color')}"
        print("✓ manifest.json theme_color = #214F4B")
    
    def test_manifest_background_color(self):
        """Test manifest.json has correct background_color"""
        response = requests.get(f"{BASE_URL}/manifest.json", timeout=10)
        data = response.json()
        assert data.get('background_color') == '#0a0a0b', f"Expected '#0a0a0b', got {data.get('background_color')}"
        print("✓ manifest.json background_color = #0a0a0b")
    
    def test_manifest_start_url(self):
        """Test manifest.json has correct start_url"""
        response = requests.get(f"{BASE_URL}/manifest.json", timeout=10)
        data = response.json()
        assert data.get('start_url') == '/espace-pro', f"Expected '/espace-pro', got {data.get('start_url')}"
        print("✓ manifest.json start_url = /espace-pro")
    
    def test_manifest_display(self):
        """Test manifest.json has correct display mode"""
        response = requests.get(f"{BASE_URL}/manifest.json", timeout=10)
        data = response.json()
        assert data.get('display') == 'standalone', f"Expected 'standalone', got {data.get('display')}"
        print("✓ manifest.json display = standalone")
    
    def test_manifest_icon(self):
        """Test manifest.json has icon-512.png"""
        response = requests.get(f"{BASE_URL}/manifest.json", timeout=10)
        data = response.json()
        icons = data.get('icons', [])
        assert len(icons) > 0, "Expected at least one icon"
        icon_src = icons[0].get('src', '')
        assert '/icon-512.png' in icon_src, f"Expected icon-512.png, got {icon_src}"
        print("✓ manifest.json has icon-512.png")
    
    def test_icon_512_accessible(self):
        """Test icon-512.png returns HTTP 200"""
        response = requests.get(f"{BASE_URL}/icon-512.png", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ icon-512.png accessible (HTTP 200)")
    
    def test_icon_512_content_type(self):
        """Test icon-512.png has correct content type"""
        response = requests.get(f"{BASE_URL}/icon-512.png", timeout=10)
        content_type = response.headers.get('Content-Type', '')
        assert 'image/png' in content_type, f"Expected image/png, got {content_type}"
        print("✓ icon-512.png has PNG content type")
    
    def test_sw_js_accessible(self):
        """Test sw.js returns HTTP 200"""
        response = requests.get(f"{BASE_URL}/sw.js", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ sw.js accessible (HTTP 200)")
    
    def test_sw_js_cache_version(self):
        """Test sw.js has CACHE_VERSION cc2026-v4.0"""
        response = requests.get(f"{BASE_URL}/sw.js", timeout=10)
        content = response.text
        assert "cc2026-v4.0" in content, "Expected CACHE_VERSION cc2026-v4.0 in sw.js"
        print("✓ sw.js has CACHE_VERSION cc2026-v4.0")
    
    def test_sw_js_auth_cache(self):
        """Test sw.js has AUTH_CACHE defined"""
        response = requests.get(f"{BASE_URL}/sw.js", timeout=10)
        content = response.text
        assert "AUTH_CACHE" in content, "Expected AUTH_CACHE in sw.js"
        print("✓ sw.js has AUTH_CACHE defined")
    
    def test_espace_pro_page_accessible(self):
        """Test /espace-pro page returns HTTP 200"""
        response = requests.get(f"{BASE_URL}/espace-pro", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ /espace-pro page accessible (HTTP 200)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
