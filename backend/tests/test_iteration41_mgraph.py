"""
Iteration 41 - Mgraph 3D Testing
Tests for /api/smart-engine/mgraph endpoint and related Smart Engine features
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"Health check passed: {data}")


class TestMgraphEndpoint:
    """Tests for /api/smart-engine/mgraph - Mgraph 3D graph data"""
    
    def test_mgraph_returns_200(self):
        """GET /api/smart-engine/mgraph returns 200"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/mgraph")
        assert response.status_code == 200
        print("Mgraph endpoint returns 200 OK")
    
    def test_mgraph_has_nodes(self):
        """Mgraph returns 58+ nodes"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/mgraph")
        assert response.status_code == 200
        data = response.json()
        
        assert "nodes" in data
        assert "total_nodes" in data
        assert data["total_nodes"] >= 58, f"Expected 58+ nodes, got {data['total_nodes']}"
        assert len(data["nodes"]) >= 58
        print(f"Mgraph has {data['total_nodes']} nodes (expected 58+)")
    
    def test_mgraph_has_edges(self):
        """Mgraph returns 100+ edges"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/mgraph")
        assert response.status_code == 200
        data = response.json()
        
        assert "edges" in data
        assert "total_edges" in data
        assert data["total_edges"] >= 100, f"Expected 100+ edges, got {data['total_edges']}"
        print(f"Mgraph has {data['total_edges']} edges (expected 100+)")
    
    def test_mgraph_has_clusters(self):
        """Mgraph returns clusters by type"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/mgraph")
        assert response.status_code == 200
        data = response.json()
        
        assert "clusters" in data
        assert isinstance(data["clusters"], dict)
        assert len(data["clusters"]) > 0
        print(f"Mgraph clusters: {data['clusters']}")
    
    def test_node_has_required_fields(self):
        """Each node has: id, frek_id, label, type, score, org, statut"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/mgraph")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["id", "frek_id", "label", "type", "score", "org", "statut"]
        
        for node in data["nodes"][:10]:  # Check first 10 nodes
            for field in required_fields:
                assert field in node, f"Node missing field: {field}"
        
        # Verify score is numeric
        sample_node = data["nodes"][0]
        assert isinstance(sample_node["score"], (int, float))
        assert isinstance(sample_node["frek_id"], str)
        print(f"Sample node: {sample_node}")
    
    def test_edge_has_required_fields(self):
        """Each edge has: source, target, link_type, strength"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/mgraph")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["source", "target", "link_type", "strength"]
        
        for edge in data["edges"][:10]:  # Check first 10 edges
            for field in required_fields:
                assert field in edge, f"Edge missing field: {field}"
        
        # Verify link_type values
        link_types = set(e["link_type"] for e in data["edges"])
        expected_types = {"org", "type", "brain"}
        assert link_types.issubset(expected_types), f"Unexpected link types: {link_types - expected_types}"
        print(f"Edge link types found: {link_types}")
    
    def test_edge_strength_values(self):
        """Edge strength values are valid (0-1 range)"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/mgraph")
        assert response.status_code == 200
        data = response.json()
        
        for edge in data["edges"]:
            assert 0 <= edge["strength"] <= 1, f"Invalid strength: {edge['strength']}"
        
        # Check expected strength values by link_type
        org_edges = [e for e in data["edges"] if e["link_type"] == "org"]
        type_edges = [e for e in data["edges"] if e["link_type"] == "type"]
        brain_edges = [e for e in data["edges"] if e["link_type"] == "brain"]
        
        if org_edges:
            assert org_edges[0]["strength"] == 0.8, "Org edges should have strength 0.8"
        if type_edges:
            assert type_edges[0]["strength"] == 0.3, "Type edges should have strength 0.3"
        if brain_edges:
            assert brain_edges[0]["strength"] == 0.6, "Brain edges should have strength 0.6"
        
        print(f"Edge counts - org: {len(org_edges)}, type: {len(type_edges)}, brain: {len(brain_edges)}")


class TestSmartEngineOtherEndpoints:
    """Tests for other Smart Engine endpoints to ensure they still work"""
    
    def test_dashboard_endpoint(self):
        """GET /api/smart-engine/dashboard returns 200"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "stream" in data
        assert data["stream"] == "dashboard"
        assert "overview" in data
        print(f"Dashboard overview: {data['overview']}")
    
    def test_predictive_endpoint(self):
        """GET /api/smart-engine/predictive returns 200"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/predictive")
        assert response.status_code == 200
        data = response.json()
        assert "stream" in data
        assert data["stream"] == "predictive"
        print(f"Predictive: current_total={data.get('current_total')}, projected={data.get('projected_total_at_event')}")
    
    def test_live_audience_endpoint(self):
        """GET /api/smart-engine/live-audience returns 200"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/live-audience")
        assert response.status_code == 200
        data = response.json()
        assert "stream" in data
        assert data["stream"] == "live-audience"
        print(f"Live audience: active_now={data.get('active_now')}")
    
    def test_verified_identity_endpoint(self):
        """GET /api/smart-engine/verified-identity returns 200"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/verified-identity")
        assert response.status_code == 200
        data = response.json()
        assert "stream" in data
        assert data["stream"] == "verified-identity"
        assert "total_badges" in data
        print(f"Verified identity: total_badges={data.get('total_badges')}")
    
    def test_conversion_endpoint(self):
        """GET /api/smart-engine/conversion returns 200"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/conversion")
        assert response.status_code == 200
        data = response.json()
        assert "stream" in data
        assert data["stream"] == "conversion"
        assert "funnel" in data
        print(f"Conversion funnel: {data.get('funnel')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
