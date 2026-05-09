#!/usr/bin/env python3
"""
Test script for Auto-Resolution Agent

This script tests the auto-resolution functionality with sample alerts
to verify that the system can automatically resolve common issues.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from auto_resolution_agent import create_auto_resolution_agent
from ai_client import create_ai_client

def test_auto_resolution():
    """Test auto-resolution with sample alerts"""
    
    print("=" * 60)
    print("TESTING AUTO-RESOLUTION AGENT")
    print("=" * 60)
    
    # Create AI client and auto-resolution agent
    ai_client = create_ai_client()
    auto_resolution_agent = create_auto_resolution_agent(ai_client)
    
    # Test cases
    test_cases = [
        {
            "name": "Container Duplicate Issue",
            "alert_text": "Container CMAU1234567 has duplicate records in bay slots at Terminal 5",
            "expected_strategy": "merge_duplicate_containers"
        },
        {
            "name": "Vessel Name Mismatch",
            "alert_text": "VESSEL_ERR_4 - System Vessel Name does not match with BAPLIE vessel name for MV ATLANTIC WIND",
            "expected_strategy": "correct_vessel_name"
        },
        {
            "name": "EDI Message Stuck",
            "alert_text": "EDI message REF-IFT-0007 stuck in ERROR state for 24 hours, ack_at is NULL",
            "expected_strategy": "retry_edi_message"
        },
        {
            "name": "Critical System Issue",
            "alert_text": "CRITICAL: Database connection failed, all services down",
            "expected_strategy": "manual_intervention"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n--- Test Case {i}: {test_case['name']} ---")
        print(f"Alert: {test_case['alert_text']}")
        
        # Mock parsed entities (would come from triage agent)
        parsed_entities = {
            "module": "CNTR" if "container" in test_case['alert_text'].lower() else 
                     "VSL" if "vessel" in test_case['alert_text'].lower() else
                     "EDI/API" if "edi" in test_case['alert_text'].lower() else
                     "Infra/SRE",
            "entities": ["CMAU1234567"] if "CMAU" in test_case['alert_text'] else 
                       ["MV ATLANTIC WIND"] if "MV" in test_case['alert_text'] else
                       ["REF-IFT-0007"] if "REF-IFT" in test_case['alert_text'] else [],
            "severity": "critical" if "CRITICAL" in test_case['alert_text'] else "high",
            "urgency": "immediate" if "CRITICAL" in test_case['alert_text'] else "high"
        }
        
        # Mock analysis (would come from analyst agent)
        analysis = {
            "best_sop_id": "SOP-CNTR-001",
            "problem_statement": f"Test problem: {test_case['name']}",
            "resolution_summary": "Test resolution steps",
            "reasoning": "Test reasoning"
        }
        
        # Mock candidate SOPs
        candidate_sops = {
            "sops": [
                {
                    "id": "SOP-CNTR-001",
                    "document": "Test SOP content for container issues",
                    "metadata": {"title": "Container Duplicate Resolution", "module": "CNTR"},
                    "distance": 0.1
                }
            ],
            "case_logs": []
        }
        
        # Mock SQL data
        sql_data = {
            "container_data": [{"cntr_no": "CMAU1234567", "status": "ACTIVE"}],
            "vessel_data": [],
            "edi_data": [],
            "api_events": [],
            "vessel_advice": []
        }
        
        try:
            # Test auto-resolution
            result = auto_resolution_agent.attempt_auto_resolution(
                test_case['alert_text'],
                parsed_entities,
                analysis,
                candidate_sops,
                sql_data
            )
            
            print(f"✅ Auto-resolution attempted: {result.get('attempted', False)}")
            print(f"✅ Strategy: {result.get('strategy', 'None')}")
            print(f"✅ Success: {result.get('success', False)}")
            print(f"✅ Confidence: {result.get('confidence', 0.0):.2f}")
            print(f"✅ Escalate: {result.get('escalate', True)}")
            
            if result.get('commands_executed'):
                print(f"✅ Commands executed: {len(result['commands_executed'])}")
                for cmd in result['commands_executed']:
                    print(f"   - {cmd['command'][:50]}... ({'✅' if cmd['success'] else '❌'})")
            
            # Verify expected strategy
            if result.get('strategy') == test_case['expected_strategy']:
                print(f"✅ Strategy matches expected: {test_case['expected_strategy']}")
            else:
                print(f"⚠️  Strategy mismatch. Expected: {test_case['expected_strategy']}, Got: {result.get('strategy')}")
                
        except Exception as e:
            print(f"❌ Error in test case {i}: {e}")
    
    print("\n" + "=" * 60)
    print("AUTO-RESOLUTION TESTING COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    test_auto_resolution()






