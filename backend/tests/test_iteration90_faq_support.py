"""
ITERATION 90 — FAQ & Support Tickets API Tests
Tests for:
- GET /api/faq (public FAQ list with categories)
- POST /api/support/tickets (create ticket)
- GET /api/support/tickets/mine?email=... (user tickets)
- GET /api/admin/support/tickets (admin tickets list with stats)
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Rate limiting delay between requests
RATE_LIMIT_DELAY = 3

class TestFAQEndpoints:
    """FAQ API endpoint tests"""
    
    def test_get_faq_list(self):
        """GET /api/faq returns list of FAQs with categories"""
        time.sleep(RATE_LIMIT_DELAY)
        response = requests.get(f"{BASE_URL}/api/faq", timeout=30)
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "faqs" in data, "Response should contain 'faqs' key"
        assert "categories" in data, "Response should contain 'categories' key"
        assert isinstance(data["faqs"], list), "faqs should be a list"
        assert isinstance(data["categories"], list), "categories should be a list"
        
        # Verify FAQ structure if any exist
        if len(data["faqs"]) > 0:
            faq = data["faqs"][0]
            assert "id" in faq, "FAQ should have 'id'"
            assert "question_fr" in faq, "FAQ should have 'question_fr'"
            assert "answer_fr" in faq, "FAQ should have 'answer_fr'"
            assert "category" in faq, "FAQ should have 'category'"
            print(f"✓ Found {len(data['faqs'])} FAQs with categories: {data['categories']}")
        else:
            print("⚠ No FAQs found (may need seeding)")
    
    def test_get_faq_by_category(self):
        """GET /api/faq?category=general filters by category"""
        time.sleep(RATE_LIMIT_DELAY)
        response = requests.get(f"{BASE_URL}/api/faq?category=general", timeout=30)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "faqs" in data
        
        # All returned FAQs should be in 'general' category
        for faq in data["faqs"]:
            assert faq.get("category") == "general", f"FAQ category should be 'general', got {faq.get('category')}"
        
        print(f"✓ Category filter works - {len(data['faqs'])} FAQs in 'general' category")


class TestSupportTicketEndpoints:
    """Support Tickets API endpoint tests"""
    
    def test_create_ticket_success(self):
        """POST /api/support/tickets creates a ticket and returns ticket_id"""
        time.sleep(RATE_LIMIT_DELAY)
        
        test_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "name": "Test User",
            "email": test_email,
            "subject": "Test Ticket Subject",
            "message": "This is a test ticket message for iteration 90 testing.",
            "category": "general"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/support/tickets",
            json=payload,
            timeout=30
        )
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "success" in data, "Response should contain 'success'"
        assert data["success"] == True, "success should be True"
        assert "ticket_id" in data, "Response should contain 'ticket_id'"
        assert data["ticket_id"].startswith("TK-"), f"ticket_id should start with 'TK-', got {data['ticket_id']}"
        
        print(f"✓ Ticket created successfully: {data['ticket_id']}")
        return data["ticket_id"], test_email
    
    def test_create_ticket_missing_fields(self):
        """POST /api/support/tickets with missing fields returns 400"""
        time.sleep(RATE_LIMIT_DELAY)
        
        payload = {
            "name": "",  # Empty name
            "email": "test@test.com",
            "message": "Test message"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/support/tickets",
            json=payload,
            timeout=30
        )
        
        # Should return 400 for missing required fields
        assert response.status_code == 400, f"Expected 400 for empty name, got {response.status_code}"
        print("✓ Empty name validation works")
    
    def test_get_my_tickets(self):
        """GET /api/support/tickets/mine?email=... returns user's tickets"""
        time.sleep(RATE_LIMIT_DELAY)
        
        # First create a ticket
        test_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        create_payload = {
            "name": "Test User",
            "email": test_email,
            "subject": "My Ticket",
            "message": "Test message for my tickets endpoint",
            "category": "technical"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/support/tickets",
            json=create_payload,
            timeout=30
        )
        assert create_response.status_code == 200
        created_ticket_id = create_response.json()["ticket_id"]
        
        time.sleep(RATE_LIMIT_DELAY)
        
        # Now get tickets for this email
        response = requests.get(
            f"{BASE_URL}/api/support/tickets/mine?email={test_email}",
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "tickets" in data, "Response should contain 'tickets'"
        assert isinstance(data["tickets"], list), "tickets should be a list"
        
        # Should find the ticket we just created
        ticket_ids = [t["id"] for t in data["tickets"]]
        assert created_ticket_id in ticket_ids, f"Created ticket {created_ticket_id} should be in user's tickets"
        
        print(f"✓ Found {len(data['tickets'])} tickets for {test_email}")
    
    def test_admin_get_all_tickets(self):
        """GET /api/admin/support/tickets returns all tickets with stats"""
        time.sleep(RATE_LIMIT_DELAY)
        
        response = requests.get(
            f"{BASE_URL}/api/admin/support/tickets",
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "tickets" in data, "Response should contain 'tickets'"
        assert "stats" in data, "Response should contain 'stats'"
        
        # Verify stats structure
        stats = data["stats"]
        assert "total" in stats, "stats should have 'total'"
        assert "open" in stats, "stats should have 'open'"
        assert "in_progress" in stats, "stats should have 'in_progress'"
        assert "resolved" in stats, "stats should have 'resolved'"
        
        print(f"✓ Admin tickets endpoint works - Total: {stats['total']}, Open: {stats['open']}")


class TestFREKMasking:
    """Test that FREK-ID is not visible on public pages (code review)"""
    
    def test_pricing_page_no_frek(self):
        """Verify PricingPage.jsx doesn't mention FREK-ID"""
        # This is a code review test - we check the file content
        pricing_file = "/app/frontend/src/components/PricingPage.jsx"
        try:
            with open(pricing_file, 'r') as f:
                content = f.read()
            
            # FREK should not appear in PricingPage
            assert "FREK" not in content, "PricingPage should not mention FREK-ID"
            print("✓ PricingPage.jsx does not mention FREK-ID")
        except FileNotFoundError:
            pytest.skip("PricingPage.jsx not found")
    
    def test_faq_page_no_frek(self):
        """Verify FAQPage.jsx doesn't mention FREK-ID"""
        faq_file = "/app/frontend/src/components/FAQPage.jsx"
        try:
            with open(faq_file, 'r') as f:
                content = f.read()
            
            assert "FREK" not in content, "FAQPage should not mention FREK-ID"
            print("✓ FAQPage.jsx does not mention FREK-ID")
        except FileNotFoundError:
            pytest.skip("FAQPage.jsx not found")
    
    def test_support_page_no_frek(self):
        """Verify SupportPage.jsx doesn't mention FREK-ID"""
        support_file = "/app/frontend/src/components/SupportPage.jsx"
        try:
            with open(support_file, 'r') as f:
                content = f.read()
            
            assert "FREK" not in content, "SupportPage should not mention FREK-ID"
            print("✓ SupportPage.jsx does not mention FREK-ID")
        except FileNotFoundError:
            pytest.skip("SupportPage.jsx not found")


class TestEmailUpdate:
    """Test that contact@kiltikonet.fr is used instead of cultureconnectorg@gmail.com"""
    
    def test_faq_page_correct_email(self):
        """Verify FAQPage uses contact@kiltikonet.fr"""
        faq_file = "/app/frontend/src/components/FAQPage.jsx"
        try:
            with open(faq_file, 'r') as f:
                content = f.read()
            
            assert "contact@kiltikonet.fr" in content, "FAQPage should use contact@kiltikonet.fr"
            assert "cultureconnectorg@gmail.com" not in content, "FAQPage should NOT use old email"
            print("✓ FAQPage.jsx uses correct email contact@kiltikonet.fr")
        except FileNotFoundError:
            pytest.skip("FAQPage.jsx not found")
    
    def test_support_page_correct_email(self):
        """Verify SupportPage uses contact@kiltikonet.fr"""
        support_file = "/app/frontend/src/components/SupportPage.jsx"
        try:
            with open(support_file, 'r') as f:
                content = f.read()
            
            assert "contact@kiltikonet.fr" in content, "SupportPage should use contact@kiltikonet.fr"
            assert "cultureconnectorg@gmail.com" not in content, "SupportPage should NOT use old email"
            print("✓ SupportPage.jsx uses correct email contact@kiltikonet.fr")
        except FileNotFoundError:
            pytest.skip("SupportPage.jsx not found")
    
    def test_pricing_page_correct_email(self):
        """Verify PricingPage uses contact@kiltikonet.fr"""
        pricing_file = "/app/frontend/src/components/PricingPage.jsx"
        try:
            with open(pricing_file, 'r') as f:
                content = f.read()
            
            assert "contact@kiltikonet.fr" in content, "PricingPage should use contact@kiltikonet.fr"
            assert "cultureconnectorg@gmail.com" not in content, "PricingPage should NOT use old email"
            print("✓ PricingPage.jsx uses correct email contact@kiltikonet.fr")
        except FileNotFoundError:
            pytest.skip("PricingPage.jsx not found")


class TestPricingPageContent:
    """Test PricingPage content for Visiteur description and exclusions"""
    
    def test_visiteur_description(self):
        """Verify Visiteur tier has correct description"""
        pricing_file = "/app/frontend/src/components/PricingPage.jsx"
        try:
            with open(pricing_file, 'r') as f:
                content = f.read()
            
            # Check for the specific description
            assert "Pré-inscription gratuite" in content or "Free pre-registration" in content, \
                "Visiteur should mention 'Pré-inscription gratuite'"
            assert "Marché Culturel uniquement" in content or "Cultural Market only" in content, \
                "Visiteur should mention 'Marché Culturel uniquement'"
            print("✓ Visiteur description is correct")
        except FileNotFoundError:
            pytest.skip("PricingPage.jsx not found")
    
    def test_visiteur_exclusions(self):
        """Verify Visiteur tier has exclusions for concerts and conferences"""
        pricing_file = "/app/frontend/src/components/PricingPage.jsx"
        try:
            with open(pricing_file, 'r') as f:
                content = f.read()
            
            # Check for exclusions
            assert "exclusions" in content.lower(), "PricingPage should have exclusions"
            assert "Concerts" in content or "concerts" in content, "Should mention concerts exclusion"
            assert "Conférences" in content or "Conferences" in content, "Should mention conferences exclusion"
            print("✓ Visiteur exclusions are present")
        except FileNotFoundError:
            pytest.skip("PricingPage.jsx not found")


class TestAppRoutes:
    """Test that FAQ and Support routes are configured in App.js"""
    
    def test_faq_routes_exist(self):
        """Verify /faq and /aide routes exist"""
        app_file = "/app/frontend/src/App.js"
        try:
            with open(app_file, 'r') as f:
                content = f.read()
            
            assert '"/faq"' in content, "App.js should have /faq route"
            assert '"/aide"' in content, "App.js should have /aide route"
            print("✓ FAQ routes (/faq, /aide) are configured")
        except FileNotFoundError:
            pytest.skip("App.js not found")
    
    def test_support_routes_exist(self):
        """Verify /support and /contact routes exist"""
        app_file = "/app/frontend/src/App.js"
        try:
            with open(app_file, 'r') as f:
                content = f.read()
            
            assert '"/support"' in content, "App.js should have /support route"
            assert '"/contact"' in content, "App.js should have /contact route"
            print("✓ Support routes (/support, /contact) are configured")
        except FileNotFoundError:
            pytest.skip("App.js not found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
