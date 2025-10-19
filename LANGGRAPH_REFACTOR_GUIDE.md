# LangGraph Refactor Guide

## Overview

This document explains the comprehensive refactor of the PSA Flask application to use LangGraph as the primary orchestration engine. The refactor transforms the existing logic into a more formal, powerful, and maintainable agentic system.

## 🏗️ Architecture Changes

### Before (Original Flask App)
```
Flask App → Direct Function Calls → LLM → Response
```

### After (LangGraph Orchestration)
```
Flask App → LangGraph Workflow → Conditional Routing → Node Execution → State Management
```

## 📦 New Dependencies

The following dependencies have been added to `requirements.txt`:

```
langgraph
langchain
langchain-openai
langchain-google-genai
typing-extensions
```

## 🔄 Core Components

### 1. State Management (`PSAState`)

The `PSAState` TypedDict defines the complete state of the workflow:

```python
class PSAState(TypedDict):
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
```

### 2. Workflow Nodes

#### Triage Node (`_triage_node`)
- **Purpose**: Analyze alert and determine severity
- **Input**: Alert text
- **Output**: Severity, urgency, module, entities
- **LLM Integration**: Uses LLM for intelligent triage analysis

#### Diagnostic Node (`_diagnostic_node`)
- **Purpose**: Perform RAG-based root cause analysis
- **Input**: Alert text, module
- **Output**: Problem statement, root cause, confidence score, best SOP
- **RAG Integration**: Queries ChromaDB for relevant SOPs

#### Predictive Node (`_predictive_node`)
- **Purpose**: Analyze historical patterns and predict impacts
- **Input**: Problem statement, entities
- **Output**: Predicted impact, historical patterns, risk assessment
- **Historical Analysis**: Uses Case Log.xlsx data

#### Human Review Node (`_human_review_node`)
- **Purpose**: Handle human-in-the-loop scenarios
- **Input**: Workflow state
- **Output**: Human approval/rejection decision
- **Human Integration**: Pauses execution for human input

#### Escalation Node (`_escalation_node`)
- **Purpose**: Handle escalation and contact assignment
- **Input**: Workflow state
- **Output**: Escalation contact, email content
- **Contact Management**: Assigns appropriate escalation contacts

#### Finalize Node (`_finalize_node`)
- **Purpose**: Generate final recommendations and status
- **Input**: Complete workflow state
- **Output**: Final recommendation, completion status

### 3. Conditional Routing

The workflow uses sophisticated conditional routing based on:

#### After Triage Routing (`_route_after_triage`)
```python
def _route_after_triage(self, state: PSAState) -> str:
    severity = state.get("severity", "medium")
    
    if severity == "low":
        return "end"  # Skip processing for low severity
    elif severity in ["critical", "high"]:
        return "diagnostic"  # Go directly to diagnostic
    else:
        return "human_review"  # Require human review for medium severity
```

#### After Diagnostic Routing (`_route_after_diagnostic`)
```python
def _route_after_diagnostic(self, state: PSAState) -> str:
    confidence = state.get("confidence_score", 0.5)
    severity = state.get("severity", "medium")
    
    if confidence < 0.3:
        return "human_review"  # Low confidence requires human review
    elif severity in ["critical", "high"] and confidence > 0.7:
        return "escalation"  # Auto-escalate high confidence critical issues
    else:
        return "predictive"  # Continue to predictive analysis
```

#### After Predictive Routing (`_route_after_predictive`)
```python
def _route_after_predictive(self, state: PSAState) -> str:
    risk_level = state.get("risk_assessment", "medium")
    severity = state.get("severity", "medium")
    
    if risk_level == "high" and severity in ["critical", "high"]:
        return "escalation"  # Auto-escalate high-risk critical issues
    else:
        return "human_review"  # Require human review for other cases
```

## 🚀 Advanced Features

### 1. Human-in-the-Loop Integration

The workflow can pause execution and wait for human input:

```python
@app.route('/workflow/<case_id>/approve', methods=['POST'])
async def approve_workflow(case_id):
    """Approve a workflow that requires human review"""
    # Update workflow state with human approval
    workflow_state['human_approved'] = True
    workflow_state['needs_human_review'] = False
```

### 2. Conditional Auto-Escalation

The system automatically escalates based on severity and confidence:

```python
if severity in ["critical", "high"] and confidence > 0.7:
    return "escalation"  # Auto-escalate high confidence critical issues
```

### 3. Execution Path Tracking

The workflow tracks its execution path for debugging and analytics:

```python
state["execution_path"] = state.get("execution_path", []) + ["triage"]
```

### 4. Stateful Workflow Management

The system maintains state across workflow executions:

```python
workflow_history[case_id] = result
```

## 📊 API Endpoints

### Core Workflow Endpoints

#### `POST /process_alert`
- **Purpose**: Process alert through LangGraph workflow
- **Features**: 
  - Conditional routing based on severity
  - Human review requirements
  - Auto-escalation capabilities

#### `GET /workflow/<case_id>/status`
- **Purpose**: Get real-time workflow status
- **Features**:
  - Execution path tracking
  - Human review status
  - Confidence scores

#### `POST /workflow/<case_id>/approve`
- **Purpose**: Approve workflows requiring human review
- **Features**:
  - Resume workflow execution
  - Update approval status

#### `POST /workflow/<case_id>/reject`
- **Purpose**: Reject workflows with alternative actions
- **Features**:
  - Provide rejection reasons
  - Alternative workflow paths

### Management Endpoints

#### `GET /workflows`
- **Purpose**: List all workflows with status
- **Features**:
  - Execution path visualization
  - Status filtering
  - Timestamp sorting

#### `GET /analytics`
- **Purpose**: Get workflow performance analytics
- **Features**:
  - Success rates
  - Average confidence scores
  - Severity distribution
  - Human review requirements

## 🔧 Implementation Details

### 1. Workflow Initialization

```python
def _initialize_components(self):
    """Initialize all required components"""
    # Initialize sentence transformer
    self.sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Initialize ChromaDB
    self.chroma_client = chromadb.Client()
    
    # Load collections and historical data
    self._load_collections()
    self._load_historical_data()
    
    # Initialize LLM
    self._initialize_llm()
```

### 2. Graph Construction

```python
def _build_graph(self):
    """Build the LangGraph workflow"""
    workflow = StateGraph(PSAState)
    
    # Add nodes
    workflow.add_node("triage", self._triage_node)
    workflow.add_node("diagnostic", self._diagnostic_node)
    workflow.add_node("predictive", self._predictive_node)
    workflow.add_node("human_review", self._human_review_node)
    workflow.add_node("escalation", self._escalation_node)
    workflow.add_node("finalize", self._finalize_node)
    
    # Add conditional routing
    workflow.add_conditional_edges("triage", self._route_after_triage, {...})
    workflow.add_conditional_edges("diagnostic", self._route_after_diagnostic, {...})
    workflow.add_conditional_edges("predictive", self._route_after_predictive, {...})
    
    # Compile the graph
    self.graph = workflow.compile()
```

### 3. Async Workflow Execution

```python
async def process_alert(self, alert_text: str, case_id: str = None) -> Dict:
    """Process an alert through the LangGraph workflow"""
    # Initialize state
    initial_state = PSAState(...)
    
    try:
        # Run the workflow
        final_state = await self.graph.ainvoke(initial_state)
        return dict(final_state)
    except Exception as e:
        return {"status": "error", "error_message": str(e)}
```

## 🎯 Benefits of LangGraph Refactor

### 1. **Formal Orchestration**
- Clear separation of concerns
- Explicit state management
- Predictable execution flow

### 2. **Advanced Routing**
- Conditional logic based on multiple factors
- Dynamic path selection
- Intelligent decision making

### 3. **Human-in-the-Loop**
- Pause execution for human input
- Resume from any point
- Approval/rejection workflows

### 4. **Maintainability**
- Modular node design
- Easy to add new nodes
- Clear execution paths

### 5. **Observability**
- Execution path tracking
- State visibility
- Performance analytics

### 6. **Scalability**
- Async execution
- Stateful workflows
- Concurrent processing

## 🚀 Usage Examples

### Basic Alert Processing

```python
# Process an alert
result = await workflow.process_alert("Container CMAU1234567 has duplicate records")

# Check if human review is needed
if result.get('needs_human_review'):
    print("Alert requires human review")
    # Show UI for human approval
else:
    print("Alert processed automatically")
```

### Human Review Workflow

```python
# Approve a workflow
response = await client.post(f'/workflow/{case_id}/approve')
if response.json()['success']:
    print("Workflow approved and resumed")
```

### Analytics and Monitoring

```python
# Get workflow analytics
analytics = await client.get('/analytics')
print(f"Success rate: {analytics['success_rate']}%")
print(f"Average confidence: {analytics['average_confidence']}")
```

## 🔄 Migration from Original App

### 1. **Install Dependencies**
```bash
pip install -r requirements.txt
```

### 2. **Run LangGraph App**
```bash
python app_langgraph.py
```

### 3. **Update Frontend**
- Update API endpoints to use new LangGraph endpoints
- Add human review UI components
- Implement workflow status monitoring

### 4. **Test Workflow**
- Test basic alert processing
- Test human review scenarios
- Test auto-escalation
- Verify analytics

## 📈 Performance Improvements

### 1. **Intelligent Routing**
- Skip unnecessary processing for low-severity alerts
- Auto-escalate high-confidence critical issues
- Reduce human intervention requirements

### 2. **State Management**
- Persistent workflow state
- Resume from any point
- Better error handling

### 3. **Analytics**
- Track workflow performance
- Identify bottlenecks
- Optimize routing decisions

## 🎉 Conclusion

The LangGraph refactor transforms the PSA application into a sophisticated, maintainable, and powerful agentic system. It provides:

- **Formal orchestration** with clear state management
- **Advanced routing** with conditional logic
- **Human-in-the-loop** capabilities for complex scenarios
- **Observability** with execution tracking and analytics
- **Scalability** with async execution and stateful workflows

This refactor positions the PSA system as a cutting-edge agentic application that can handle complex, multi-step workflows with human oversight and intelligent decision-making.
