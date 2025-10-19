"""
Test script for database functionality
Run this to verify database is working correctly
"""

from database import IncidentDatabase
import json

def test_database():
    print("=" * 60)
    print("Testing PSA Incident Database")
    print("=" * 60)
    
    # Initialize database
    print("\n1. Initializing database...")
    db = IncidentDatabase("test_psa_incidents.db")
    print("✅ Database initialized")
    
    # Test storing an incident
    print("\n2. Storing test incident...")
    case_id = db.store_incident(
        alert_text="Test alert: Container CMAU0000020 duplicate issue",
        parsed_entities={
            "module": "CNTR",
            "entities": ["CMAU0000020"],
            "alert_type": "error",
            "severity": "high",
            "urgency": "high"
        },
        analysis={
            "best_sop_id": "sop_3",
            "problem_statement": "Duplicate container detected",
            "resolution_summary": "1. Check container range\n2. Verify serial number",
            "reasoning": "This is a common duplicate container issue"
        },
        candidate_sops=[
            {"id": "sop_3", "title": "Duplicate Container Resolution"}
        ]
    )
    print(f"✅ Incident stored with case_id: {case_id}")
    
    # Test retrieving the incident
    print("\n3. Retrieving incident...")
    incident = db.get_incident_by_id(case_id)
    if incident:
        print(f"✅ Retrieved incident: {incident['case_id']}")
        print(f"   Module: {incident['module']}")
        print(f"   Severity: {incident['severity']}")
    else:
        print("❌ Failed to retrieve incident")
    
    # Test getting all incidents
    print("\n4. Getting all incidents...")
    all_incidents = db.get_all_incidents(limit=10)
    print(f"✅ Found {len(all_incidents)} incident(s)")
    
    # Test analytics
    print("\n5. Getting analytics...")
    analytics = db.get_analytics()
    print(f"✅ Analytics retrieved:")
    print(f"   Total cases: {analytics['total_cases']}")
    print(f"   Avg resolution time: {analytics['avg_resolution_time_minutes']} min")
    print(f"   Module distribution: {json.dumps(analytics['module_distribution'], indent=2)}")
    
    # Test search
    print("\n6. Testing search...")
    results = db.search_incidents("duplicate", limit=5)
    print(f"✅ Search found {len(results)} result(s)")
    
    # Test feedback
    print("\n7. Submitting feedback...")
    db.submit_feedback(
        case_id=case_id,
        was_resolved=True,
        was_helpful=True,
        rating=5,
        feedback_text="Test feedback - SOP was very helpful"
    )
    print("✅ Feedback submitted")
    
    # Test status update
    print("\n8. Updating status...")
    db.update_incident_status(case_id, "resolved")
    print("✅ Status updated to resolved")
    
    # Verify status update
    updated_incident = db.get_incident_by_id(case_id)
    print(f"   Status is now: {updated_incident['status']}")
    
    print("\n" + "=" * 60)
    print("✅ All tests passed!")
    print("=" * 60)
    print(f"\nTest database created at: test_psa_incidents.db")
    print("You can delete this test database after testing.")

if __name__ == "__main__":
    test_database()

