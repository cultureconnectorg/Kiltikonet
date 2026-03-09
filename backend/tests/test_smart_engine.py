"""
Test Smart Engine APIs - Culture Connect 2026
Tests for: /api/smart-engine/* endpoints
- stats
- alerts/rules
- insights
- /api/team/notifications
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSmartEngineStats:
    """Tests for /api/smart-engine/stats endpoint"""
    
    def test_stats_returns_200(self):
        """Test that stats endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✅ /api/smart-engine/stats returns 200")
    
    def test_stats_has_required_fields(self):
        """Test that stats response has all required fields"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/stats")
        data = response.json()
        
        required_fields = [
            "total_events_24h",
            "active_sessions",
            "alerts_triggered",
            "recommendations_generated",
            "top_actions",
            "anomalies_detected",
            "engine_status",
            "last_check"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        print(f"✅ Stats response has all required fields: {list(data.keys())}")
    
    def test_stats_data_types(self):
        """Test that stats response has correct data types"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/stats")
        data = response.json()
        
        assert isinstance(data["total_events_24h"], int), "total_events_24h should be int"
        assert isinstance(data["active_sessions"], int), "active_sessions should be int"
        assert isinstance(data["alerts_triggered"], int), "alerts_triggered should be int"
        assert isinstance(data["recommendations_generated"], int), "recommendations_generated should be int"
        assert isinstance(data["top_actions"], list), "top_actions should be list"
        assert isinstance(data["anomalies_detected"], list), "anomalies_detected should be list"
        assert data["engine_status"] in ["healthy", "warning", "critical"], "engine_status should be valid"
        
        print(f"✅ Stats data types correct - events: {data['total_events_24h']}, sessions: {data['active_sessions']}, status: {data['engine_status']}")


class TestSmartEngineAlertRules:
    """Tests for /api/smart-engine/alerts/rules endpoint"""
    
    def test_alert_rules_returns_200(self):
        """Test that alert rules endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/alerts/rules")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✅ /api/smart-engine/alerts/rules returns 200")
    
    def test_alert_rules_returns_5_default_rules(self):
        """Test that alert rules returns 5 default rules"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/alerts/rules")
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        assert len(data) >= 5, f"Expected at least 5 default rules, got {len(data)}"
        
        print(f"✅ Alert rules returns {len(data)} rules (expected >= 5)")
    
    def test_alert_rules_structure(self):
        """Test that each alert rule has required fields"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/alerts/rules")
        data = response.json()
        
        required_fields = ["id", "name", "condition_type", "threshold", "enabled"]
        
        for rule in data:
            for field in required_fields:
                assert field in rule, f"Rule {rule.get('id', 'unknown')} missing field: {field}"
        
        rule_ids = [r["id"] for r in data]
        print(f"✅ All rules have required fields. Rule IDs: {rule_ids}")
    
    def test_default_rule_types(self):
        """Test that default rules include expected types"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/alerts/rules")
        data = response.json()
        
        expected_types = ["traffic_spike", "low_conversion", "deadline_approaching", "registration_batch", "error_spike"]
        actual_types = [r["condition_type"] for r in data]
        
        for expected in expected_types:
            assert expected in actual_types, f"Missing expected rule type: {expected}"
        
        print(f"✅ All expected rule types present: {expected_types}")


class TestSmartEngineInsights:
    """Tests for /api/smart-engine/insights endpoint"""
    
    def test_insights_returns_200(self):
        """Test that insights endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/insights")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✅ /api/smart-engine/insights returns 200")
    
    def test_insights_has_required_sections(self):
        """Test that insights response has all required sections"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/insights")
        data = response.json()
        
        required_sections = ["insights", "metrics", "funnel", "generated_at"]
        
        for section in required_sections:
            assert section in data, f"Missing required section: {section}"
        
        print(f"✅ Insights response has all required sections: {list(data.keys())}")
    
    def test_insights_metrics_structure(self):
        """Test that metrics section has required fields"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/insights")
        data = response.json()
        
        metrics = data["metrics"]
        required_metric_fields = ["retention_rate", "conversion_rate", "returning_users"]
        
        for field in required_metric_fields:
            assert field in metrics, f"Missing metric field: {field}"
        
        print(f"✅ Metrics structure correct - retention: {metrics['retention_rate']}%, conversion: {metrics['conversion_rate']}%, returning: {metrics['returning_users']}")
    
    def test_insights_funnel_structure(self):
        """Test that funnel section has required fields"""
        response = requests.get(f"{BASE_URL}/api/smart-engine/insights")
        data = response.json()
        
        funnel = data["funnel"]
        required_funnel_fields = ["registrations", "approved", "connections", "messages"]
        
        for field in required_funnel_fields:
            assert field in funnel, f"Missing funnel field: {field}"
        
        print(f"✅ Funnel structure correct - regs: {funnel['registrations']}, approved: {funnel['approved']}, connections: {funnel['connections']}, messages: {funnel['messages']}")


class TestTeamNotifications:
    """Tests for /api/team/notifications endpoint"""
    
    def test_notifications_returns_200(self):
        """Test that team notifications endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/team/notifications?limit=20")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✅ /api/team/notifications returns 200")
    
    def test_notifications_response_structure(self):
        """Test that notifications response has required structure"""
        response = requests.get(f"{BASE_URL}/api/team/notifications?limit=20")
        data = response.json()
        
        assert "notifications" in data, "Missing 'notifications' field"
        assert "unread_count" in data, "Missing 'unread_count' field"
        assert isinstance(data["notifications"], list), "notifications should be a list"
        assert isinstance(data["unread_count"], int), "unread_count should be int"
        
        print(f"✅ Notifications structure correct - count: {len(data['notifications'])}, unread: {data['unread_count']}")
    
    def test_create_and_get_notification(self):
        """Test creating and retrieving a notification"""
        # Create notification - API expects JSON body
        create_response = requests.post(
            f"{BASE_URL}/api/team/notifications/create",
            json={
                "title": "Test Notification",
                "message": "This is a test from pytest",
                "priority": "low",
                "type": "manual"
            }
        )
        
        assert create_response.status_code == 200, f"Failed to create notification: {create_response.text}"
        created = create_response.json()
        assert created["success"] == True
        
        # Verify in list
        list_response = requests.get(f"{BASE_URL}/api/team/notifications?limit=5")
        data = list_response.json()
        
        notification_titles = [n.get("title") for n in data["notifications"]]
        assert "Test Notification" in notification_titles, "Created notification not found in list"
        
        print("✅ Notification creation and retrieval working")


class TestCheckAlerts:
    """Tests for /api/smart-engine/check-alerts endpoint"""
    
    def test_check_alerts_returns_200(self):
        """Test that check alerts endpoint returns 200"""
        response = requests.post(f"{BASE_URL}/api/smart-engine/check-alerts")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✅ /api/smart-engine/check-alerts returns 200")
    
    def test_check_alerts_response_structure(self):
        """Test that check alerts response has required structure"""
        response = requests.post(f"{BASE_URL}/api/smart-engine/check-alerts")
        data = response.json()
        
        assert "alerts_triggered" in data, "Missing 'alerts_triggered' field"
        assert "details" in data, "Missing 'details' field"
        assert isinstance(data["alerts_triggered"], int), "alerts_triggered should be int"
        assert isinstance(data["details"], list), "details should be list"
        
        print(f"✅ Check alerts response correct - triggered: {data['alerts_triggered']}")


class TestAlertRuleToggle:
    """Tests for toggling alert rules"""
    
    def test_toggle_alert_rule(self):
        """Test enabling/disabling an alert rule"""
        # Get current rules
        rules_response = requests.get(f"{BASE_URL}/api/smart-engine/alerts/rules")
        rules = rules_response.json()
        
        if len(rules) == 0:
            pytest.skip("No alert rules to toggle")
        
        rule = rules[0]
        rule_id = rule["id"]
        current_enabled = rule["enabled"]
        
        # Toggle the rule
        toggle_response = requests.patch(
            f"{BASE_URL}/api/smart-engine/alerts/rules/{rule_id}",
            params={"enabled": not current_enabled}
        )
        assert toggle_response.status_code == 200, f"Failed to toggle rule: {toggle_response.text}"
        
        # Verify toggle
        verify_response = requests.get(f"{BASE_URL}/api/smart-engine/alerts/rules")
        updated_rules = verify_response.json()
        updated_rule = next((r for r in updated_rules if r["id"] == rule_id), None)
        
        assert updated_rule is not None, f"Rule {rule_id} not found after toggle"
        assert updated_rule["enabled"] == (not current_enabled), "Rule enabled state did not change"
        
        # Reset to original state
        requests.patch(
            f"{BASE_URL}/api/smart-engine/alerts/rules/{rule_id}",
            params={"enabled": current_enabled}
        )
        
        print(f"✅ Alert rule toggle working - {rule_id}: {current_enabled} -> {not current_enabled} -> {current_enabled}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
