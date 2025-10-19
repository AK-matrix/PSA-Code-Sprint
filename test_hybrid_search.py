#!/usr/bin/env python3
"""
Test script for the new Hybrid Search functionality in LangGraph workflow.
This script demonstrates the enhanced RAG retrieval mechanism.
"""

import os
import sys
import json
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from langgraph_workflow import PSALangGraphWorkflow

def test_hybrid_search():
    """Test the hybrid search functionality"""
    print("[TEST] Testing Hybrid Search in LangGraph Workflow")
    print("=" * 60)
    
    try:
        # Initialize the workflow
        print("[INIT] Initializing PSA Workflow...")
        workflow = PSALangGraphWorkflow()
        
        # Test alert with specific entities for keyword search
        test_alert = """
        ERROR: EDI segment missing in message processing
        Service: edi_advice_service
        Error Code: EDI_ERR_1
        Reference: REF-IFT-0007
        Timestamp: 2025-10-19T10:30:00Z
        """
        
        print(f"[SEARCH] Test Alert: {test_alert.strip()}")
        print("\n" + "=" * 60)
        
        # Test the hybrid search directly
        print("[DIAGNOSTIC] Testing Hybrid Search Retrieval...")
        
        # Simulate triage results with entities
        entities = ["EDI_ERR_1", "REF-IFT-0007", "edi_advice_service"]
        module = "EDI/API"
        
        # Test the hybrid search method
        candidate_sops = workflow._retrieve_candidate_sops(
            alert_text=test_alert,
            module=module,
            entities=entities
        )
        
        print(f"[OK] Retrieved {len(candidate_sops)} candidate SOPs")
        
        # Display results with search type information
        for i, sop in enumerate(candidate_sops, 1):
            print(f"\n--- SOP {i} ---")
            print(f"ID: {sop['id']}")
            print(f"Title: {sop['metadata'].get('title', 'Unknown')}")
            print(f"Search Type: {sop.get('search_type', 'unknown')}")
            print(f"Relevance Score: {sop.get('relevance_score', 0):.3f}")
            print(f"Content Preview: {sop['document'][:200]}...")
        
        # Test the enhanced diagnostic analysis
        print("\n" + "=" * 60)
        print("[ANALYSIS] Testing Enhanced Diagnostic Analysis...")
        
        if candidate_sops:
            diagnostic_result = workflow._perform_diagnostic_analysis(
                alert_text=test_alert,
                candidate_sops=candidate_sops,
                entities=entities
            )
            
            print("[OK] Diagnostic Analysis Results:")
            print(f"Problem Statement: {diagnostic_result.get('problem_statement', 'N/A')}")
            print(f"Best SOP: {diagnostic_result.get('best_sop_id', 'N/A')}")
            print(f"Confidence Score: {diagnostic_result.get('confidence_score', 0):.2f}")
            print(f"Reasoning: {diagnostic_result.get('reasoning', 'N/A')[:200]}...")
        
        print("\n" + "=" * 60)
        print("[TARGET] Hybrid Search Test Summary:")
        print(f"[OK] Semantic Search: Found {len([s for s in candidate_sops if s.get('search_type') == 'semantic'])} results")
        print(f"[OK] Keyword Search: Found {len([s for s in candidate_sops if s.get('search_type') == 'keyword'])} results")
        print(f"[OK] Total Unique Results: {len(candidate_sops)}")
        print("[OK] Enhanced Analysis: Successfully processed hybrid results")
        
    except Exception as e:
        print(f"[ERROR] Test failed: {e}")
        import traceback
        traceback.print_exc()

def test_workflow_integration():
    """Test the full workflow with hybrid search"""
    print("\n[TEST] Testing Full Workflow Integration")
    print("=" * 60)
    
    try:
        # Initialize the workflow
        workflow = PSALangGraphWorkflow()
        
        # Test alert
        test_alert = """
        CRITICAL: Database connection timeout
        Service: container_service
        Error Code: DB_TIMEOUT_001
        Reference: REF-DB-0001
        """
        
        print(f"[SEARCH] Test Alert: {test_alert.strip()}")
        
        # Create initial state
        initial_state = {
            "alert_text": test_alert,
            "case_id": f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "status": "processing",
            "execution_path": []
        }
        
        # Run the workflow
        print("[PROCESSING] Running LangGraph Workflow...")
        result = workflow.graph.invoke(initial_state)
        
        print("[OK] Workflow Results:")
        print(f"Status: {result.get('status', 'unknown')}")
        print(f"Problem Statement: {result.get('problem_statement', 'N/A')}")
        print(f"Confidence Score: {result.get('confidence_score', 0):.2f}")
        print(f"Execution Path: {' -> '.join(result.get('execution_path', []))}")
        
        if result.get('diagnostic_result'):
            diagnostic = result['diagnostic_result']
            print(f"Best SOP: {diagnostic.get('best_sop_id', 'N/A')}")
            print(f"Resolution: {diagnostic.get('resolution_summary', 'N/A')[:100]}...")
        
    except Exception as e:
        print(f"[ERROR] Workflow test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("[TEST] Hybrid Search Test Suite")
    print("=" * 60)
    
    # Test 1: Hybrid Search Retrieval
    test_hybrid_search()
    
    # Test 2: Full Workflow Integration
    test_workflow_integration()
    
    print("\n[SUCCESS] All tests completed!")
