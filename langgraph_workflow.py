"""
LangGraph-based PSA Alert Processing Workflow

This module implements a sophisticated agentic system using LangGraph for orchestrating
the PSA alert processing pipeline with advanced routing, human-in-the-loop capabilities,
and conditional logic.
"""

import os
import json
import asyncio
from typing import Dict, List, Optional, Any, TypedDict, Annotated
from datetime import datetime
import pandas as pd
import chromadb
from sentence_transformers import SentenceTransformer
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class PSAState(TypedDict):
    """State object for the PSA LangGraph workflow"""
    # Input
    alert_text: str
    case_id: str
    timestamp: str
    
    # Triage Node Output
    triage_result: Optional[Dict[str, Any]]
    severity: str
    urgency: str
    module: str
    entities: List[str]
    
    # Diagnostic Node Output
    diagnostic_result: Optional[Dict[str, Any]]
    problem_statement: str
    root_cause: str
    confidence_score: float
    best_sop: str
    resolution_summary: str
    
    # Predictive Node Output
    predictive_result: Optional[Dict[str, Any]]
    predicted_impact: str
    historical_patterns: List[str]
    risk_assessment: str
    
    # Routing and Control
    needs_human_review: bool
    auto_escalate: bool
    human_approved: bool
    execution_path: List[str]
    
    # Final Output
    escalation_contact: Dict[str, Any]
    email_content: Dict[str, str]
    final_recommendation: str
    status: str
    error_message: Optional[str]

class PSALangGraphWorkflow:
    """Main LangGraph workflow for PSA alert processing"""
    
    def __init__(self):
        self.sentence_transformer = None
        self.chroma_client = None
        self.collections = {}
        self.historical_data = None
        self.llm = None
        self._initialize_components()
        self._build_graph()
    
    def _initialize_components(self):
        """Initialize all required components"""
        try:
            # Initialize sentence transformer
            self.sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Initialize ChromaDB
            self.chroma_client = chromadb.Client()
            
            # Load collections
            self._load_collections()
            
            # Load historical data
            self._load_historical_data()
            
            # Initialize LLM
            self._initialize_llm()
            
            print("[OK] LangGraph workflow components initialized successfully")
            
        except Exception as e:
            print(f"[ERROR] Error initializing components: {e}")
            raise
    
    def _load_collections(self):
        """Load ChromaDB collections"""
        try:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            chroma_db_path = os.path.join(script_dir, "chroma_db")
            
            if os.path.exists(chroma_db_path):
                self.chroma_client = chromadb.PersistentClient(path=chroma_db_path)
                
                # Get all collections
                all_collections = self.chroma_client.list_collections()
                for collection in all_collections:
                    self.collections[collection.name] = self.chroma_client.get_collection(collection.name)
                    
                print(f"[OK] Loaded {len(self.collections)} collections")
            else:
                print("[WARNING] ChromaDB not found, using empty collections")
                
        except Exception as e:
            print(f"[ERROR] Error loading collections: {e}")
            self.collections = {}
    
    def _load_historical_data(self):
        """Load historical case logs from Excel file"""
        try:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            case_log_path = os.path.join(script_dir, "Case Log.xlsx")
            
            if os.path.exists(case_log_path):
                self.historical_data = pd.read_excel(case_log_path)
                print(f"[OK] Loaded {len(self.historical_data)} historical cases")
            else:
                print("[WARNING] Case Log.xlsx not found, using empty DataFrame")
                self.historical_data = pd.DataFrame()
                
        except Exception as e:
            print(f"[ERROR] Error loading historical data: {e}")
            self.historical_data = pd.DataFrame()
    
    def _initialize_llm(self):
        """Initialize the LLM client"""
        try:
            # Try OpenAI first
            if os.getenv("OPENAI_API_KEY"):
                self.llm = ChatOpenAI(
                    model="gpt-4o",
                    temperature=0.1,
                    api_key=os.getenv("OPENAI_API_KEY")
                )
                print("[OK] Initialized OpenAI LLM")
            elif os.getenv("GOOGLE_API_KEY"):
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-pro",
                    temperature=0.1,
                    google_api_key=os.getenv("GOOGLE_API_KEY")
                )
                print("[OK] Initialized Google LLM")
            else:
                print("[WARNING] No API keys found, using mock LLM")
                self.llm = None
                
        except Exception as e:
            print(f"[ERROR] Error initializing LLM: {e}")
            self.llm = None
    
    def _build_graph(self):
        """Build the LangGraph workflow"""
        # Create the state graph
        workflow = StateGraph(PSAState)
        
        # Add nodes
        workflow.add_node("triage", self._triage_node)
        workflow.add_node("diagnostic", self._diagnostic_node)
        workflow.add_node("predictive", self._predictive_node)
        workflow.add_node("human_review", self._human_review_node)
        workflow.add_node("escalation", self._escalation_node)
        workflow.add_node("finalize", self._finalize_node)
        
        # Define the workflow
        workflow.set_entry_point("triage")
        
        # Add conditional routing
        workflow.add_conditional_edges(
            "triage",
            self._route_after_triage,
            {
                "diagnostic": "diagnostic",
                "human_review": "human_review",
                "end": END
            }
        )
        
        workflow.add_conditional_edges(
            "diagnostic",
            self._route_after_diagnostic,
            {
                "predictive": "predictive",
                "human_review": "human_review",
                "escalation": "escalation"
            }
        )
        
        workflow.add_conditional_edges(
            "predictive",
            self._route_after_predictive,
            {
                "escalation": "escalation",
                "human_review": "human_review"
            }
        )
        
        workflow.add_conditional_edges(
            "human_review",
            self._route_after_human_review,
            {
                "escalation": "escalation",
                "finalize": "finalize",
                "end": END
            }
        )
        
        workflow.add_edge("escalation", "finalize")
        workflow.add_edge("finalize", END)
        
        # Compile the graph
        self.graph = workflow.compile()
        print("[OK] LangGraph workflow compiled successfully")
    
    def _triage_node(self, state: PSAState) -> PSAState:
        """Triage Node: Analyze alert and determine severity"""
        print("[SEARCH] Running Triage Node...")
        
        try:
            alert_text = state["alert_text"]
            
            # Use LLM for triage analysis
            if self.llm:
                triage_prompt = f"""
                Analyze this alert and extract key information in JSON format:
                
                Alert: {alert_text}
                
                Return JSON with:
                {{
                    "module": "CNTR|VSL|EDI/API|Infra/SRE",
                    "entities": ["entity1", "entity2"],
                    "alert_type": "error|warning|info",
                    "severity": "critical|high|medium|low",
                    "urgency": "immediate|high|medium|low"
                }}
                """
                
                response = self.llm.invoke([HumanMessage(content=triage_prompt)])
                triage_result = json.loads(response.content)
            else:
                # Fallback triage logic
                triage_result = self._fallback_triage(alert_text)
            
            # Update state
            state["triage_result"] = triage_result
            state["severity"] = triage_result.get("severity", "medium")
            state["urgency"] = triage_result.get("urgency", "medium")
            state["module"] = triage_result.get("module", "Unknown")
            state["entities"] = triage_result.get("entities", [])
            state["execution_path"] = state.get("execution_path", []) + ["triage"]
            
            print(f"[OK] Triage completed: {state['severity']} severity")
            
        except Exception as e:
            print(f"[ERROR] Triage node error: {e}")
            state["error_message"] = str(e)
            state["status"] = "error"
        
        return state
    
    def _diagnostic_node(self, state: PSAState) -> PSAState:
        """Diagnostic Node: Perform Hybrid Search RAG-based root cause analysis"""
        print("[DIAGNOSTIC] Running Diagnostic Node with Hybrid Search...")
        
        try:
            alert_text = state["alert_text"]
            module = state["module"]
            entities = state.get("entities", [])
            
            # Retrieve candidate SOPs using Hybrid Search
            candidate_sops = self._retrieve_candidate_sops(alert_text, module, entities)
            
            # Perform diagnostic analysis with enhanced prompt
            if self.llm and candidate_sops:
                diagnostic_result = self._perform_diagnostic_analysis(
                    alert_text, candidate_sops, entities
                )
            else:
                diagnostic_result = self._fallback_diagnostic(alert_text)
            
            # Update state
            state["diagnostic_result"] = diagnostic_result
            state["problem_statement"] = diagnostic_result.get("problem_statement", "Unknown")
            state["root_cause"] = diagnostic_result.get("reasoning", "Unknown")
            state["confidence_score"] = diagnostic_result.get("confidence_score", 0.5)
            state["best_sop"] = diagnostic_result.get("best_sop_id", "None")
            state["resolution_summary"] = diagnostic_result.get("resolution_summary", "Manual review required")
            state["execution_path"] = state.get("execution_path", []) + ["diagnostic"]
            
            print(f"[OK] Diagnostic completed: {state['confidence_score']} confidence")
            
        except Exception as e:
            print(f"[ERROR] Diagnostic node error: {e}")
            state["error_message"] = str(e)
            state["status"] = "error"
        
        return state
    
    def _predictive_node(self, state: PSAState) -> PSAState:
        """Predictive Node: Analyze historical patterns and predict impacts"""
        print("[PREDICTIVE] Running Predictive Node...")
        
        try:
            problem_statement = state["problem_statement"]
            entities = state["entities"]
            
            # Analyze historical patterns
            if not self.historical_data.empty:
                predictive_result = self._analyze_historical_patterns(
                    problem_statement, entities
                )
            else:
                predictive_result = self._fallback_predictive(problem_statement)
            
            # Update state
            state["predictive_result"] = predictive_result
            state["predicted_impact"] = predictive_result.get("predictive_insight", "Unknown")
            state["historical_patterns"] = predictive_result.get("patterns", [])
            state["risk_assessment"] = predictive_result.get("risk_level", "medium")
            state["execution_path"] = state.get("execution_path", []) + ["predictive"]
            
            print(f"[OK] Predictive completed: {state['risk_assessment']} risk")
            
        except Exception as e:
            print(f"[ERROR] Predictive node error: {e}")
            state["error_message"] = str(e)
            state["status"] = "error"
        
        return state
    
    def _human_review_node(self, state: PSAState) -> PSAState:
        """Human Review Node: Handle human-in-the-loop scenarios"""
        print("[HUMAN] Human Review Node - Awaiting approval...")
        
        # In a real implementation, this would pause execution and wait for human input
        # For now, we'll simulate the decision based on severity
        severity = state.get("severity", "medium")
        confidence = state.get("confidence_score", 0.5)
        
        if severity in ["critical", "high"] and confidence > 0.7:
            state["human_approved"] = True
            state["auto_escalate"] = True
        else:
            state["human_approved"] = False
            state["auto_escalate"] = False
        
        state["execution_path"] = state.get("execution_path", []) + ["human_review"]
        print(f"[OK] Human review completed: {'Approved' if state['human_approved'] else 'Pending'}")
        
        return state
    
    def _escalation_node(self, state: PSAState) -> PSAState:
        """Escalation Node: Handle escalation and contact assignment"""
        print("📧 Running Escalation Node...")
        
        try:
            module = state["module"]
            severity = state["severity"]
            
            # Get escalation contact
            escalation_contact = self._get_escalation_contact(module)
            
            # Generate email content
            email_content = self._generate_escalation_email(state)
            
            # Update state
            state["escalation_contact"] = escalation_contact
            state["email_content"] = email_content
            state["execution_path"] = state.get("execution_path", []) + ["escalation"]
            
            print(f"[OK] Escalation completed: {escalation_contact.get('escalation_contact', {}).get('email', 'Unknown')}")
            
        except Exception as e:
            print(f"[ERROR] Escalation node error: {e}")
            state["error_message"] = str(e)
            state["status"] = "error"
        
        return state
    
    def _finalize_node(self, state: PSAState) -> PSAState:
        """Finalize Node: Generate final recommendations and status"""
        print("[OK] Running Finalize Node...")
        
        try:
            # Generate final recommendation
            recommendation = self._generate_final_recommendation(state)
            
            # Update state
            state["final_recommendation"] = recommendation
            state["status"] = "completed"
            state["execution_path"] = state.get("execution_path", []) + ["finalize"]
            
            print(f"[OK] Finalization completed: {state['status']}")
            
        except Exception as e:
            print(f"[ERROR] Finalize node error: {e}")
            state["error_message"] = str(e)
            state["status"] = "error"
        
        return state
    
    # Routing functions
    def _route_after_triage(self, state: PSAState) -> str:
        """Route after triage based on severity"""
        severity = state.get("severity", "medium")
        
        if severity == "low":
            return "end"  # Skip processing for low severity
        elif severity in ["critical", "high"]:
            return "diagnostic"  # Go directly to diagnostic
        else:
            return "human_review"  # Require human review for medium severity
    
    def _route_after_diagnostic(self, state: PSAState) -> str:
        """Route after diagnostic based on confidence"""
        confidence = state.get("confidence_score", 0.5)
        severity = state.get("severity", "medium")
        
        if confidence < 0.3:
            return "human_review"  # Low confidence requires human review
        elif severity in ["critical", "high"] and confidence > 0.7:
            return "escalation"  # Auto-escalate high confidence critical issues
        else:
            return "predictive"  # Continue to predictive analysis
    
    def _route_after_predictive(self, state: PSAState) -> str:
        """Route after predictive based on risk assessment"""
        risk_level = state.get("risk_assessment", "medium")
        severity = state.get("severity", "medium")
        
        if risk_level == "high" and severity in ["critical", "high"]:
            return "escalation"  # Auto-escalate high-risk critical issues
        else:
            return "human_review"  # Require human review for other cases
    
    def _route_after_human_review(self, state: PSAState) -> str:
        """Route after human review based on approval"""
        approved = state.get("human_approved", False)
        
        if approved:
            return "escalation"
        else:
            return "finalize"  # Complete without escalation
    
    # Helper methods
    def _retrieve_candidate_sops(self, alert_text: str, module: str, entities: List[str] = None) -> List[Dict]:
        """Retrieve candidate SOPs using Hybrid Search (Semantic + Keyword)"""
        try:
            if module not in self.collections:
                return []
            
            collection = self.collections[module]
            all_sops = []
            
            # 1. SEMANTIC SEARCH (Vector Similarity)
            print("[SEARCH] Performing semantic vector search...")
            semantic_results = collection.query(
                query_texts=[alert_text],
                n_results=5,
                where={"doc_type": "SOP"}
            )
            
            semantic_sops = []
            if semantic_results['documents'] and semantic_results['documents'][0]:
                for i, doc in enumerate(semantic_results['documents'][0]):
                    semantic_sops.append({
                        'id': semantic_results['ids'][0][i],
                        'document': doc,
                        'metadata': semantic_results['metadatas'][0][i],
                        'distance': semantic_results['distances'][0][i],
                        'search_type': 'semantic',
                        'relevance_score': 1 - semantic_results['distances'][0][i]
                    })
            
            # 2. KEYWORD SEARCH (Entity-based)
            print("[SEARCH] Performing keyword search...")
            keyword_sops = []
            
            if entities and len(entities) > 0:
                # Create keyword search query using entities
                keyword_query = " ".join(entities)
                
                # Use ChromaDB's where_document clause for keyword matching
                try:
                    keyword_results = collection.query(
                        query_texts=[keyword_query],
                        n_results=2,
                        where={"doc_type": "SOP"},
                        where_document={"$contains": keyword_query}
                    )
                    
                    if keyword_results['documents'] and keyword_results['documents'][0]:
                        for i, doc in enumerate(keyword_results['documents'][0]):
                            keyword_sops.append({
                                'id': keyword_results['ids'][0][i],
                                'document': doc,
                                'metadata': keyword_results['metadatas'][0][i],
                                'distance': keyword_results['distances'][0][i],
                                'search_type': 'keyword',
                                'relevance_score': 1 - keyword_results['distances'][0][i]
                            })
                except Exception as e:
                    print(f"[WARNING] Keyword search failed, using fallback: {e}")
                    # Fallback: search by individual entities
                    for entity in entities:
                        try:
                            entity_results = collection.query(
                                query_texts=[entity],
                                n_results=1,
                                where={"doc_type": "SOP"}
                            )
                            
                            if entity_results['documents'] and entity_results['documents'][0]:
                                for i, doc in enumerate(entity_results['documents'][0]):
                                    keyword_sops.append({
                                        'id': entity_results['ids'][0][i],
                                        'document': doc,
                                        'metadata': entity_results['metadatas'][0][i],
                                        'distance': entity_results['distances'][0][i],
                                        'search_type': 'keyword',
                                        'relevance_score': 1 - entity_results['distances'][0][i]
                                    })
                        except Exception as entity_e:
                            print(f"[WARNING] Entity search failed for {entity}: {entity_e}")
                            continue
            
            # 3. COMBINE AND DEDUPLICATE RESULTS
            print("[PROCESSING] Combining and deduplicating results...")
            combined_sops = []
            seen_ids = set()
            
            # Add semantic results first (higher priority)
            for sop in semantic_sops:
                if sop['id'] not in seen_ids:
                    combined_sops.append(sop)
                    seen_ids.add(sop['id'])
            
            # Add keyword results (avoiding duplicates)
            for sop in keyword_sops:
                if sop['id'] not in seen_ids:
                    combined_sops.append(sop)
                    seen_ids.add(sop['id'])
            
            # Sort by relevance score (highest first)
            combined_sops.sort(key=lambda x: x['relevance_score'], reverse=True)
            
            print(f"[OK] Hybrid search completed: {len(semantic_sops)} semantic + {len(keyword_sops)} keyword = {len(combined_sops)} unique results")
            
            return combined_sops
            
        except Exception as e:
            print(f"[ERROR] Error in hybrid search: {e}")
            # Fallback to simple semantic search
            try:
                collection = self.collections[module]
                results = collection.query(
                    query_texts=[alert_text],
                    n_results=3,
                    where={"doc_type": "SOP"}
                )
                
                sops = []
                if results['documents'] and results['documents'][0]:
                    for i, doc in enumerate(results['documents'][0]):
                        sops.append({
                            'id': results['ids'][0][i],
                            'document': doc,
                            'metadata': results['metadatas'][0][i],
                            'distance': results['distances'][0][i],
                            'search_type': 'fallback',
                            'relevance_score': 1 - results['distances'][0][i]
                        })
                
                return sops
            except Exception as fallback_e:
                print(f"[ERROR] Fallback search also failed: {fallback_e}")
                return []
    
    def _perform_diagnostic_analysis(self, alert_text: str, candidate_sops: List[Dict], entities: List[str] = None) -> Dict:
        """Perform diagnostic analysis using LLM with Hybrid Search context"""
        try:
            # Separate semantic and keyword results for enhanced analysis
            semantic_sops = [sop for sop in candidate_sops if sop.get('search_type') == 'semantic']
            keyword_sops = [sop for sop in candidate_sops if sop.get('search_type') == 'keyword']
            
            # Format candidate SOPs with search context
            sop_text = ""
            
            if semantic_sops:
                sop_text += "\n=== SEMANTIC SEARCH RESULTS (Broad Context) ===\n"
                for i, sop in enumerate(semantic_sops, 1):
                    sop_text += f"\n--- Semantic SOP {i} ---\n"
                    sop_text += f"Title: {sop['metadata'].get('title', 'Unknown')}\n"
                    sop_text += f"Relevance Score: {sop.get('relevance_score', 0):.3f}\n"
                    sop_text += f"Content: {sop['document'][:800]}...\n"
            
            if keyword_sops:
                sop_text += "\n=== KEYWORD SEARCH RESULTS (Precise Matches) ===\n"
                for i, sop in enumerate(keyword_sops, 1):
                    sop_text += f"\n--- Keyword SOP {i} ---\n"
                    sop_text += f"Title: {sop['metadata'].get('title', 'Unknown')}\n"
                    sop_text += f"Relevance Score: {sop.get('relevance_score', 0):.3f}\n"
                    sop_text += f"Content: {sop['document'][:800]}...\n"
            
            # Enhanced prompt for hybrid analysis
            entities_text = f"Key Entities: {', '.join(entities)}" if entities else "No specific entities identified"
            
            prompt = f"""
            You are an expert systems analyst reviewing context from two different search methods to provide the most accurate diagnosis.
            
            ALERT TO ANALYZE:
            {alert_text}
            
            {entities_text}
            
            SEARCH RESULTS FROM HYBRID SEARCH:
            {sop_text}
            
            ANALYSIS INSTRUCTIONS:
            1. Review the SEMANTIC SEARCH RESULTS for broad contextual understanding
            2. Review the KEYWORD SEARCH RESULTS for precise technical matches
            3. Synthesize both perspectives to identify the most accurate root cause
            4. Consider both broad semantic context and precise technical matches
            5. Select the best SOP based on combined evidence from both search methods
            
            Return JSON with:
            {{
                "problem_statement": "Clear, comprehensive description of the issue based on hybrid analysis",
                "reasoning": "Detailed explanation of why this SOP is the best match, considering both semantic context and keyword precision",
                "best_sop_id": "Selected SOP title",
                "resolution_summary": "Step-by-step resolution based on hybrid search insights",
                "confidence_score": 0.85
            }}
            
            CONFIDENCE SCORING:
            - 0.9-1.0: Both semantic and keyword searches strongly support the same SOP
            - 0.7-0.9: Strong semantic match with some keyword support, or vice versa
            - 0.5-0.7: Moderate match from one search method
            - 0.3-0.5: Weak match, manual review recommended
            """
            
            response = self.llm.invoke([HumanMessage(content=prompt)])
            return json.loads(response.content)
            
        except Exception as e:
            print(f"[ERROR] Error in diagnostic analysis: {e}")
            return self._fallback_diagnostic(alert_text)
    
    def _analyze_historical_patterns(self, problem_statement: str, entities: List[str]) -> Dict:
        """Analyze historical patterns from case logs"""
        try:
            if self.historical_data.empty:
                return self._fallback_predictive(problem_statement)
            
            # Filter historical data based on problem statement and entities
            filtered_data = self.historical_data[
                self.historical_data['Problem Statement'].str.contains(
                    problem_statement[:50], case=False, na=False
                )
            ]
            
            if filtered_data.empty:
                return self._fallback_predictive(problem_statement)
            
            # Analyze patterns
            common_issues = filtered_data['Problem Statement'].value_counts().head(3)
            avg_resolution_time = filtered_data.get('Resolution Time', pd.Series([0])).mean()
            
            return {
                "predictive_insight": f"Based on {len(filtered_data)} similar cases, expect resolution time of {avg_resolution_time:.1f} hours",
                "patterns": common_issues.index.tolist(),
                "risk_level": "high" if len(filtered_data) > 5 else "medium"
            }
            
        except Exception as e:
            print(f"[ERROR] Error analyzing historical patterns: {e}")
            return self._fallback_predictive(problem_statement)
    
    def _get_escalation_contact(self, module: str) -> Dict:
        """Get escalation contact for module"""
        # Simplified contact mapping
        contacts = {
            "CNTR": {
                "primary_contact": {"name": "Container Support", "email": "container@company.com", "phone": "+1-555-CONTAINER"},
                "escalation_contact": {"name": "Container Manager", "email": "container-mgr@company.com", "phone": "+1-555-CONTAINER-MGR"}
            },
            "VSL": {
                "primary_contact": {"name": "Vessel Support", "email": "vessel@company.com", "phone": "+1-555-VESSEL"},
                "escalation_contact": {"name": "Vessel Manager", "email": "vessel-mgr@company.com", "phone": "+1-555-VESSEL-MGR"}
            },
            "EDI/API": {
                "primary_contact": {"name": "EDI Support", "email": "edi@company.com", "phone": "+1-555-EDI"},
                "escalation_contact": {"name": "EDI Manager", "email": "edi-mgr@company.com", "phone": "+1-555-EDI-MGR"}
            }
        }
        
        return contacts.get(module, contacts["CNTR"])
    
    def _generate_escalation_email(self, state: PSAState) -> Dict:
        """Generate escalation email content"""
        return {
            "to": state["escalation_contact"]["escalation_contact"]["email"],
            "subject": f"URGENT: {state['severity'].upper()} Alert - {state['module']} Module",
            "body": f"""
            AUTOMATED ALERT ANALYSIS
            
            Alert: {state['alert_text']}
            Severity: {state['severity']}
            Module: {state['module']}
            
            Problem Statement: {state['problem_statement']}
            Root Cause: {state['root_cause']}
            
            Recommended SOP: {state['best_sop']}
            Resolution: {state['resolution_summary']}
            
            Predicted Impact: {state['predicted_impact']}
            
            Please review and take appropriate action.
            """
        }
    
    def _generate_final_recommendation(self, state: PSAState) -> str:
        """Generate final recommendation"""
        return f"""
        ALERT PROCESSING COMPLETE
        
        Status: {state['status']}
        Severity: {state['severity']}
        Confidence: {state['confidence_score']}
        
        Recommended Action: {state['best_sop']}
        Resolution: {state['resolution_summary']}
        
        Next Steps: {'Escalation sent' if state.get('auto_escalate') else 'Awaiting human review'}
        """
    
    # Fallback methods
    def _fallback_triage(self, alert_text: str) -> Dict:
        """Fallback triage when LLM is unavailable"""
        return {
            "module": "CNTR",
            "entities": ["unknown"],
            "alert_type": "error",
            "severity": "medium",
            "urgency": "medium"
        }
    
    def _fallback_diagnostic(self, alert_text: str) -> Dict:
        """Fallback diagnostic when LLM is unavailable"""
        return {
            "problem_statement": "Alert requires manual analysis",
            "reasoning": "Automated analysis unavailable",
            "best_sop_id": "Manual Review Required",
            "resolution_summary": "Escalate to human analyst",
            "confidence_score": 0.3
        }
    
    def _fallback_predictive(self, problem_statement: str) -> Dict:
        """Fallback predictive when historical data is unavailable"""
        return {
            "predictive_insight": "Historical analysis unavailable",
            "patterns": [],
            "risk_level": "medium"
        }
    
    # Public interface
    async def process_alert(self, alert_text: str, case_id: str = None) -> Dict:
        """Process an alert through the LangGraph workflow"""
        if not case_id:
            case_id = f"PSA-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        # Initialize state
        initial_state = PSAState(
            alert_text=alert_text,
            case_id=case_id,
            timestamp=datetime.now().isoformat(),
            triage_result=None,
            severity="",
            urgency="",
            module="",
            entities=[],
            diagnostic_result=None,
            problem_statement="",
            root_cause="",
            confidence_score=0.0,
            best_sop="",
            resolution_summary="",
            predictive_result=None,
            predicted_impact="",
            historical_patterns=[],
            risk_assessment="",
            needs_human_review=False,
            auto_escalate=False,
            human_approved=False,
            execution_path=[],
            escalation_contact={},
            email_content={},
            final_recommendation="",
            status="processing",
            error_message=None
        )
        
        try:
            # Run the workflow
            final_state = await self.graph.ainvoke(initial_state)
            return dict(final_state)
            
        except Exception as e:
            print(f"[ERROR] Workflow execution error: {e}")
            return {
                "status": "error",
                "error_message": str(e),
                "case_id": case_id
            }

# Global workflow instance
workflow = PSALangGraphWorkflow()
