"""
Test script for LangGraph PSA Workflow

This script demonstrates the LangGraph workflow capabilities including:
- Basic alert processing
- Conditional routing
- Human review scenarios
- Analytics and monitoring
"""

import asyncio
import json
from datetime import datetime
from langgraph_workflow import workflow

async def test_basic_workflow():
    """Test basic workflow execution"""
    print("🧪 Testing Basic Workflow...")
    
    # Test critical alert (should auto-escalate)
    critical_alert = "CRITICAL: Database connection failed, all services down"
    result = await workflow.process_alert(critical_alert)
    
    print(f"✅ Critical Alert Result:")
    print(f"   Status: {result.get('status')}")
    print(f"   Severity: {result.get('severity')}")
    print(f"   Confidence: {result.get('confidence_score')}")
    print(f"   Execution Path: {result.get('execution_path')}")
    print(f"   Auto-escalate: {result.get('auto_escalate')}")
    print()

async def test_human_review_workflow():
    """Test workflow requiring human review"""
    print("🧪 Testing Human Review Workflow...")
    
    # Test medium severity alert (should require human review)
    medium_alert = "WARNING: Container CMAU1234567 has minor duplicate records"
    result = await workflow.process_alert(medium_alert)
    
    print(f"✅ Medium Alert Result:")
    print(f"   Status: {result.get('status')}")
    print(f"   Severity: {result.get('severity')}")
    print(f"   Needs Human Review: {result.get('needs_human_review')}")
    print(f"   Execution Path: {result.get('execution_path')}")
    print()

async def test_low_severity_workflow():
    """Test low severity workflow (should skip processing)"""
    print("🧪 Testing Low Severity Workflow...")
    
    # Test low severity alert (should skip processing)
    low_alert = "INFO: System maintenance completed successfully"
    result = await workflow.process_alert(low_alert)
    
    print(f"✅ Low Alert Result:")
    print(f"   Status: {result.get('status')}")
    print(f"   Severity: {result.get('severity')}")
    print(f"   Execution Path: {result.get('execution_path')}")
    print()

async def test_workflow_analytics():
    """Test workflow analytics and monitoring"""
    print("🧪 Testing Workflow Analytics...")
    
    # Process multiple alerts to generate analytics data
    alerts = [
        "CRITICAL: Database connection failed",
        "HIGH: Container processing delayed",
        "MEDIUM: Minor EDI message stuck",
        "LOW: System maintenance completed"
    ]
    
    results = []
    for alert in alerts:
        result = await workflow.process_alert(alert)
        results.append(result)
    
    # Calculate analytics
    total_workflows = len(results)
    completed_workflows = len([r for r in results if r.get('status') == 'completed'])
    pending_review = len([r for r in results if r.get('needs_human_review', False)])
    auto_escalated = len([r for r in results if r.get('auto_escalate', False)])
    
    print(f"✅ Analytics Results:")
    print(f"   Total Workflows: {total_workflows}")
    print(f"   Completed: {completed_workflows}")
    print(f"   Pending Human Review: {pending_review}")
    print(f"   Auto-escalated: {auto_escalated}")
    print(f"   Success Rate: {(completed_workflows / total_workflows * 100):.1f}%")
    print()

async def test_conditional_routing():
    """Test conditional routing scenarios"""
    print("🧪 Testing Conditional Routing...")
    
    # Test different severity levels and their routing
    test_cases = [
        ("CRITICAL: System down", "critical"),
        ("HIGH: Service degraded", "high"),
        ("MEDIUM: Minor issue", "medium"),
        ("LOW: Informational", "low")
    ]
    
    for alert, expected_severity in test_cases:
        result = await workflow.process_alert(alert)
        actual_severity = result.get('severity', 'unknown')
        execution_path = result.get('execution_path', [])
        
        print(f"   Alert: {alert[:30]}...")
        print(f"   Expected Severity: {expected_severity}")
        print(f"   Actual Severity: {actual_severity}")
        print(f"   Execution Path: {execution_path}")
        print(f"   Routing Correct: {actual_severity == expected_severity}")
        print()

async def test_error_handling():
    """Test error handling and recovery"""
    print("🧪 Testing Error Handling...")
    
    # Test with empty alert
    try:
        result = await workflow.process_alert("")
        print(f"   Empty Alert Result: {result.get('status')}")
    except Exception as e:
        print(f"   Empty Alert Error: {e}")
    
    # Test with malformed alert
    try:
        result = await workflow.process_alert("Invalid alert format")
        print(f"   Malformed Alert Result: {result.get('status')}")
    except Exception as e:
        print(f"   Malformed Alert Error: {e}")
    
    print()

async def main():
    """Run all tests"""
    print("🚀 Starting LangGraph Workflow Tests...")
    print("=" * 50)
    
    try:
        await test_basic_workflow()
        await test_human_review_workflow()
        await test_low_severity_workflow()
        await test_conditional_routing()
        await test_error_handling()
        await test_workflow_analytics()
        
        print("✅ All tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
