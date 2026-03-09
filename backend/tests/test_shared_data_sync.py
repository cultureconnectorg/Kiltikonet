"""
Test /api/shared/* endpoints for Culture Connect 2026
Testing data synchronization APIs: artistes, prestataires, partners, tasks, expenses, contacts, planning
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSharedArtistes:
    """Tests for /api/shared/artistes CRUD"""
    
    created_ids = []
    
    def test_get_artistes(self):
        """GET /api/shared/artistes should return list"""
        response = requests.get(f"{BASE_URL}/api/shared/artistes")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ GET artistes: {len(data)} artistes found")
    
    def test_create_artiste(self):
        """POST /api/shared/artistes should create new artiste"""
        payload = {
            "name": f"TEST_Artiste_{uuid.uuid4().hex[:6]}",
            "genre": "Test Genre",
            "status": "À contacter",
            "contrat": "Non signé",
            "cachet": "1000€",
            "rider": False,
            "horaire": "21h",
            "email": "test@test.com",
            "phone": "+596 000 000 000"
        }
        response = requests.post(f"{BASE_URL}/api/shared/artistes", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "artiste" in data
        artiste = data["artiste"]
        assert artiste["name"] == payload["name"]
        assert artiste["genre"] == payload["genre"]
        assert "id" in artiste
        self.__class__.created_ids.append(artiste["id"])
        print(f"✅ POST artiste created: {artiste['name']} (id: {artiste['id']})")
    
    def test_create_and_verify_persistence(self):
        """Create artiste then GET to verify it persists"""
        # Create
        payload = {
            "name": f"TEST_Persistence_{uuid.uuid4().hex[:6]}",
            "genre": "Dancehall",
            "status": "Confirmé"
        }
        create_res = requests.post(f"{BASE_URL}/api/shared/artistes", json=payload)
        assert create_res.status_code == 200
        artiste_id = create_res.json()["artiste"]["id"]
        self.__class__.created_ids.append(artiste_id)
        
        # Verify via GET all
        get_res = requests.get(f"{BASE_URL}/api/shared/artistes")
        assert get_res.status_code == 200
        artistes = get_res.json()
        found = any(a["id"] == artiste_id for a in artistes)
        assert found, f"Created artiste {artiste_id} not found in GET response"
        print(f"✅ Artiste persisted and verified via GET")
    
    def test_update_artiste(self):
        """PATCH /api/shared/artistes/{id} should update artiste"""
        # First create
        create_res = requests.post(f"{BASE_URL}/api/shared/artistes", json={
            "name": f"TEST_Update_{uuid.uuid4().hex[:6]}",
            "genre": "Zouk",
            "status": "À contacter"
        })
        artiste_id = create_res.json()["artiste"]["id"]
        self.__class__.created_ids.append(artiste_id)
        
        # Update
        update_payload = {"status": "Confirmé", "contrat": "Signé"}
        update_res = requests.patch(f"{BASE_URL}/api/shared/artistes/{artiste_id}", json=update_payload)
        assert update_res.status_code == 200
        data = update_res.json()
        assert data.get("success") == True
        assert data["artiste"]["status"] == "Confirmé"
        assert data["artiste"]["contrat"] == "Signé"
        print(f"✅ PATCH artiste updated: {artiste_id}")
    
    def test_delete_artiste(self):
        """DELETE /api/shared/artistes/{id} should delete artiste"""
        # First create
        create_res = requests.post(f"{BASE_URL}/api/shared/artistes", json={
            "name": f"TEST_Delete_{uuid.uuid4().hex[:6]}",
            "genre": "Hip-Hop"
        })
        artiste_id = create_res.json()["artiste"]["id"]
        
        # Delete
        delete_res = requests.delete(f"{BASE_URL}/api/shared/artistes/{artiste_id}")
        assert delete_res.status_code == 200
        assert delete_res.json().get("success") == True
        
        # Verify deletion via GET
        get_res = requests.get(f"{BASE_URL}/api/shared/artistes")
        artistes = get_res.json()
        found = any(a["id"] == artiste_id for a in artistes)
        assert not found, "Deleted artiste still in list"
        print(f"✅ DELETE artiste verified: {artiste_id}")


class TestSharedPrestataires:
    """Tests for /api/shared/prestataires CRUD"""
    
    created_ids = []
    
    def test_get_prestataires(self):
        """GET /api/shared/prestataires should return list"""
        response = requests.get(f"{BASE_URL}/api/shared/prestataires")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✅ GET prestataires: {len(response.json())} found")
    
    def test_create_prestataire(self):
        """POST /api/shared/prestataires should create"""
        payload = {
            "name": f"TEST_Presta_{uuid.uuid4().hex[:6]}",
            "type": "Son",
            "status": "À contacter",
            "devis": "2000€",
            "contact": "Test Contact",
            "email": "presta@test.com",
            "phone": "+596 111 111 111",
            "validated": False
        }
        response = requests.post(f"{BASE_URL}/api/shared/prestataires", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data["prestataire"]["name"] == payload["name"]
        self.__class__.created_ids.append(data["prestataire"]["id"])
        print(f"✅ POST prestataire created: {data['prestataire']['name']}")
    
    def test_update_prestataire(self):
        """PATCH /api/shared/prestataires/{id} should update"""
        # Create first
        create_res = requests.post(f"{BASE_URL}/api/shared/prestataires", json={
            "name": f"TEST_UpdatePresta_{uuid.uuid4().hex[:6]}",
            "type": "Lumière"
        })
        presta_id = create_res.json()["prestataire"]["id"]
        self.__class__.created_ids.append(presta_id)
        
        # Update
        update_res = requests.patch(f"{BASE_URL}/api/shared/prestataires/{presta_id}", json={
            "status": "Validé",
            "validated": True
        })
        assert update_res.status_code == 200
        assert update_res.json()["prestataire"]["status"] == "Validé"
        print(f"✅ PATCH prestataire updated")
    
    def test_delete_prestataire(self):
        """DELETE /api/shared/prestataires/{id} should delete"""
        create_res = requests.post(f"{BASE_URL}/api/shared/prestataires", json={
            "name": f"TEST_DelPresta_{uuid.uuid4().hex[:6]}",
            "type": "Sécurité"
        })
        presta_id = create_res.json()["prestataire"]["id"]
        
        delete_res = requests.delete(f"{BASE_URL}/api/shared/prestataires/{presta_id}")
        assert delete_res.status_code == 200
        assert delete_res.json().get("success") == True
        print(f"✅ DELETE prestataire verified")


class TestSharedPartners:
    """Tests for /api/shared/partners CRUD"""
    
    created_ids = []
    
    def test_get_partners(self):
        """GET /api/shared/partners should return list"""
        response = requests.get(f"{BASE_URL}/api/shared/partners")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✅ GET partners: {len(response.json())} found")
    
    def test_create_partner(self):
        """POST /api/shared/partners should create"""
        payload = {
            "name": f"TEST_Partner_{uuid.uuid4().hex[:6]}",
            "type": "Silver",
            "status": "Prospect",
            "contact": "Jean Test",
            "email": "partner@test.com"
        }
        response = requests.post(f"{BASE_URL}/api/shared/partners", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data["partner"]["name"] == payload["name"]
        self.__class__.created_ids.append(data["partner"]["id"])
        print(f"✅ POST partner created: {data['partner']['name']}")
    
    def test_update_partner(self):
        """PATCH /api/shared/partners/{id} should update"""
        create_res = requests.post(f"{BASE_URL}/api/shared/partners", json={
            "name": f"TEST_UpdatePartner_{uuid.uuid4().hex[:6]}",
            "type": "Bronze"
        })
        partner_id = create_res.json()["partner"]["id"]
        self.__class__.created_ids.append(partner_id)
        
        update_res = requests.patch(f"{BASE_URL}/api/shared/partners/{partner_id}", json={
            "status": "Signé",
            "type": "Or"
        })
        assert update_res.status_code == 200
        assert update_res.json()["partner"]["status"] == "Signé"
        print(f"✅ PATCH partner updated")
    
    def test_delete_partner(self):
        """DELETE /api/shared/partners/{id} should delete"""
        create_res = requests.post(f"{BASE_URL}/api/shared/partners", json={
            "name": f"TEST_DelPartner_{uuid.uuid4().hex[:6]}",
            "type": "Bronze"
        })
        partner_id = create_res.json()["partner"]["id"]
        
        delete_res = requests.delete(f"{BASE_URL}/api/shared/partners/{partner_id}")
        assert delete_res.status_code == 200
        print(f"✅ DELETE partner verified")


class TestSharedTasks:
    """Tests for /api/shared/tasks CRUD"""
    
    created_ids = []
    
    def test_get_tasks(self):
        """GET /api/shared/tasks should return list"""
        response = requests.get(f"{BASE_URL}/api/shared/tasks")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✅ GET tasks: {len(response.json())} found")
    
    def test_create_task(self):
        """POST /api/shared/tasks should create"""
        payload = {
            "title": f"TEST_Task_{uuid.uuid4().hex[:6]}",
            "description": "Test task description",
            "status": "a_faire",
            "priority": "haute",
            "deadline": "2026-05-20",
            "assigned_to": "Gwen"
        }
        response = requests.post(f"{BASE_URL}/api/shared/tasks", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data["task"]["title"] == payload["title"]
        self.__class__.created_ids.append(data["task"]["id"])
        print(f"✅ POST task created: {data['task']['title']}")
    
    def test_get_tasks_filtered_by_assignee(self):
        """GET /api/shared/tasks?assigned_to=Gwen should filter"""
        response = requests.get(f"{BASE_URL}/api/shared/tasks?assigned_to=Gwen")
        assert response.status_code == 200
        tasks = response.json()
        for task in tasks:
            assert task.get("assigned_to") == "Gwen"
        print(f"✅ GET tasks filtered: {len(tasks)} for Gwen")
    
    def test_update_task(self):
        """PATCH /api/shared/tasks/{id} should update"""
        create_res = requests.post(f"{BASE_URL}/api/shared/tasks", json={
            "title": f"TEST_UpdateTask_{uuid.uuid4().hex[:6]}",
            "status": "a_faire"
        })
        task_id = create_res.json()["task"]["id"]
        self.__class__.created_ids.append(task_id)
        
        update_res = requests.patch(f"{BASE_URL}/api/shared/tasks/{task_id}", json={
            "status": "fait"
        })
        assert update_res.status_code == 200
        assert update_res.json()["task"]["status"] == "fait"
        print(f"✅ PATCH task updated")
    
    def test_delete_task(self):
        """DELETE /api/shared/tasks/{id} should delete"""
        create_res = requests.post(f"{BASE_URL}/api/shared/tasks", json={
            "title": f"TEST_DelTask_{uuid.uuid4().hex[:6]}"
        })
        task_id = create_res.json()["task"]["id"]
        
        delete_res = requests.delete(f"{BASE_URL}/api/shared/tasks/{task_id}")
        assert delete_res.status_code == 200
        print(f"✅ DELETE task verified")


class TestSharedExpenses:
    """Tests for /api/shared/expenses CRUD"""
    
    created_ids = []
    
    def test_get_expenses(self):
        """GET /api/shared/expenses should return list"""
        response = requests.get(f"{BASE_URL}/api/shared/expenses")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✅ GET expenses: {len(response.json())} found")
    
    def test_create_expense(self):
        """POST /api/shared/expenses should create"""
        payload = {
            "label": f"TEST_Expense_{uuid.uuid4().hex[:6]}",
            "montant": 500.00,
            "category": "Logistique",
            "fournisseur": "Test Fournisseur",
            "justificatif": False,
            "date": "15/01/2026",
            "created_by": "Wudy"
        }
        response = requests.post(f"{BASE_URL}/api/shared/expenses", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data["expense"]["label"] == payload["label"]
        assert data["expense"]["montant"] == payload["montant"]
        self.__class__.created_ids.append(data["expense"]["id"])
        print(f"✅ POST expense created: {data['expense']['label']} ({data['expense']['montant']}€)")
    
    def test_update_expense(self):
        """PATCH /api/shared/expenses/{id} should update"""
        create_res = requests.post(f"{BASE_URL}/api/shared/expenses", json={
            "label": f"TEST_UpdateExpense_{uuid.uuid4().hex[:6]}",
            "montant": 100.00,
            "category": "Divers"
        })
        expense_id = create_res.json()["expense"]["id"]
        self.__class__.created_ids.append(expense_id)
        
        update_res = requests.patch(f"{BASE_URL}/api/shared/expenses/{expense_id}", json={
            "montant": 200.00,
            "justificatif": True
        })
        assert update_res.status_code == 200
        assert update_res.json()["expense"]["montant"] == 200.00
        print(f"✅ PATCH expense updated")
    
    def test_delete_expense(self):
        """DELETE /api/shared/expenses/{id} should delete"""
        create_res = requests.post(f"{BASE_URL}/api/shared/expenses", json={
            "label": f"TEST_DelExpense_{uuid.uuid4().hex[:6]}",
            "montant": 50.00,
            "category": "Divers"
        })
        expense_id = create_res.json()["expense"]["id"]
        
        delete_res = requests.delete(f"{BASE_URL}/api/shared/expenses/{expense_id}")
        assert delete_res.status_code == 200
        print(f"✅ DELETE expense verified")


class TestSharedContacts:
    """Tests for /api/shared/contacts CRUD"""
    
    created_ids = []
    
    def test_get_contacts(self):
        """GET /api/shared/contacts should return list"""
        response = requests.get(f"{BASE_URL}/api/shared/contacts")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✅ GET contacts: {len(response.json())} found")
    
    def test_create_contact(self):
        """POST /api/shared/contacts should create"""
        payload = {
            "prenom": "Test",
            "nom": f"Contact_{uuid.uuid4().hex[:6]}",
            "email": "contact@test.com",
            "phone": "+596 222 222 222",
            "organisation": "Test Org",
            "fonction": "Manager",
            "categorie": "Personnel",
            "owner": "Alirio"
        }
        response = requests.post(f"{BASE_URL}/api/shared/contacts", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data["contact"]["prenom"] == payload["prenom"]
        self.__class__.created_ids.append(data["contact"]["id"])
        print(f"✅ POST contact created: {data['contact']['prenom']} {data['contact']['nom']}")
    
    def test_get_contacts_filtered_by_owner(self):
        """GET /api/shared/contacts?owner=Alirio should filter"""
        response = requests.get(f"{BASE_URL}/api/shared/contacts?owner=Alirio")
        assert response.status_code == 200
        contacts = response.json()
        for contact in contacts:
            assert contact.get("owner") == "Alirio"
        print(f"✅ GET contacts filtered: {len(contacts)} for Alirio")
    
    def test_update_contact(self):
        """PATCH /api/shared/contacts/{id} should update"""
        create_res = requests.post(f"{BASE_URL}/api/shared/contacts", json={
            "prenom": "Update",
            "nom": f"Test_{uuid.uuid4().hex[:6]}"
        })
        contact_id = create_res.json()["contact"]["id"]
        self.__class__.created_ids.append(contact_id)
        
        update_res = requests.patch(f"{BASE_URL}/api/shared/contacts/{contact_id}", json={
            "statut": "VIP"
        })
        assert update_res.status_code == 200
        print(f"✅ PATCH contact updated")
    
    def test_delete_contact(self):
        """DELETE /api/shared/contacts/{id} should delete"""
        create_res = requests.post(f"{BASE_URL}/api/shared/contacts", json={
            "prenom": "Del",
            "nom": f"Contact_{uuid.uuid4().hex[:6]}"
        })
        contact_id = create_res.json()["contact"]["id"]
        
        delete_res = requests.delete(f"{BASE_URL}/api/shared/contacts/{contact_id}")
        assert delete_res.status_code == 200
        print(f"✅ DELETE contact verified")


class TestSharedPlanning:
    """Tests for /api/shared/planning CRUD"""
    
    created_ids = []
    
    def test_get_planning(self):
        """GET /api/shared/planning should return list"""
        response = requests.get(f"{BASE_URL}/api/shared/planning")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✅ GET planning: {len(response.json())} items found")
    
    def test_create_planning_item(self):
        """POST /api/shared/planning should create"""
        payload = {
            "time": "15:00",
            "event": f"TEST_Planning_{uuid.uuid4().hex[:6]}",
            "responsable": "Gwen",
            "status": "todo",
            "date": "2026-05-22"
        }
        response = requests.post(f"{BASE_URL}/api/shared/planning", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data["item"]["event"] == payload["event"]
        self.__class__.created_ids.append(data["item"]["id"])
        print(f"✅ POST planning created: {data['item']['event']}")
    
    def test_get_planning_filtered_by_date(self):
        """GET /api/shared/planning?date=2026-05-22 should filter"""
        response = requests.get(f"{BASE_URL}/api/shared/planning?date=2026-05-22")
        assert response.status_code == 200
        items = response.json()
        for item in items:
            assert item.get("date") == "2026-05-22"
        print(f"✅ GET planning filtered: {len(items)} items for 2026-05-22")
    
    def test_update_planning_item(self):
        """PATCH /api/shared/planning/{id} should update"""
        create_res = requests.post(f"{BASE_URL}/api/shared/planning", json={
            "time": "16:00",
            "event": f"TEST_UpdatePlan_{uuid.uuid4().hex[:6]}",
            "status": "todo"
        })
        item_id = create_res.json()["item"]["id"]
        self.__class__.created_ids.append(item_id)
        
        update_res = requests.patch(f"{BASE_URL}/api/shared/planning/{item_id}", json={
            "status": "done"
        })
        assert update_res.status_code == 200
        assert update_res.json()["item"]["status"] == "done"
        print(f"✅ PATCH planning updated")
    
    def test_delete_planning_item(self):
        """DELETE /api/shared/planning/{id} should delete"""
        create_res = requests.post(f"{BASE_URL}/api/shared/planning", json={
            "time": "17:00",
            "event": f"TEST_DelPlan_{uuid.uuid4().hex[:6]}"
        })
        item_id = create_res.json()["item"]["id"]
        
        delete_res = requests.delete(f"{BASE_URL}/api/shared/planning/{item_id}")
        assert delete_res.status_code == 200
        print(f"✅ DELETE planning verified")


class TestInitDefaultData:
    """Tests for /api/shared/init-default-data"""
    
    def test_init_default_data(self):
        """POST /api/shared/init-default-data should initialize empty collections"""
        response = requests.post(f"{BASE_URL}/api/shared/init-default-data")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✅ POST init-default-data: {data.get('initialized', {})}")


# Cleanup fixture
@pytest.fixture(scope="module", autouse=True)
def cleanup(request):
    """Cleanup TEST_ prefixed data after all tests"""
    yield
    # Cleanup artistes
    artistes = requests.get(f"{BASE_URL}/api/shared/artistes").json()
    for a in artistes:
        if a.get("name", "").startswith("TEST_"):
            requests.delete(f"{BASE_URL}/api/shared/artistes/{a['id']}")
    
    # Cleanup prestataires
    prestas = requests.get(f"{BASE_URL}/api/shared/prestataires").json()
    for p in prestas:
        if p.get("name", "").startswith("TEST_"):
            requests.delete(f"{BASE_URL}/api/shared/prestataires/{p['id']}")
    
    # Cleanup partners
    partners = requests.get(f"{BASE_URL}/api/shared/partners").json()
    for p in partners:
        if p.get("name", "").startswith("TEST_"):
            requests.delete(f"{BASE_URL}/api/shared/partners/{p['id']}")
    
    # Cleanup tasks
    tasks = requests.get(f"{BASE_URL}/api/shared/tasks").json()
    for t in tasks:
        if t.get("title", "").startswith("TEST_"):
            requests.delete(f"{BASE_URL}/api/shared/tasks/{t['id']}")
    
    # Cleanup expenses
    expenses = requests.get(f"{BASE_URL}/api/shared/expenses").json()
    for e in expenses:
        if e.get("label", "").startswith("TEST_"):
            requests.delete(f"{BASE_URL}/api/shared/expenses/{e['id']}")
    
    # Cleanup contacts
    contacts = requests.get(f"{BASE_URL}/api/shared/contacts").json()
    for c in contacts:
        if c.get("nom", "").startswith("Contact_") or c.get("nom", "").startswith("Test_"):
            requests.delete(f"{BASE_URL}/api/shared/contacts/{c['id']}")
    
    # Cleanup planning
    planning = requests.get(f"{BASE_URL}/api/shared/planning").json()
    for p in planning:
        if p.get("event", "").startswith("TEST_"):
            requests.delete(f"{BASE_URL}/api/shared/planning/{p['id']}")
    
    print("\n✅ Cleanup completed - TEST_ prefixed data removed")
