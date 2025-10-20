"""
Refactored Flask Application using LangGraph

This is the new Flask application that uses LangGraph as the primary orchestration engine
for PSA alert processing. It provides a more sophisticated, maintainable, and powerful
agentic system with advanced routing and human-in-the-loop capabilities.
"""

import os
import json
import asyncio
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from database import IncidentDatabase
from langgraph_workflow import workflow

# Load environment variables
load_dotenv()

# Initialize database
db = IncidentDatabase()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Global variables for workflow state management
active_workflows = {}  # Track active workflow executions
workflow_history = {}  # Store completed workflow results

@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('index.html')

@app.route('/health')
def health_check():
    """Health check endpoint for Docker"""
    try:
        # Check if the workflow is initialized
        if workflow and workflow.graph:
            return jsonify({
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "version": "1.0.0",
                "services": {
                    "langgraph": "operational",
                    "chromadb": "operational" if workflow.collections else "degraded",
                    "llm": "operational" if workflow.llm else "degraded"
                }
            }), 200
        else:
            return jsonify({
                "status": "unhealthy",
                "timestamp": datetime.now().isoformat(),
                "error": "Workflow not initialized"
            }), 503
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }), 503

@app.route('/process_alert', methods=['POST'])
async def process_alert():
    """
    Process alert using LangGraph workflow
    
    This endpoint now uses the sophisticated LangGraph workflow with:
    - Conditional routing based on severity and confidence
    - Human-in-the-loop capabilities
    - Advanced agentic behaviors
    """
    try:
        data = request.get_json()
        alert_text = data.get('alert_text', '')
        
        if not alert_text:
            return jsonify({"error": "Alert text is required"}), 400
        
        # Generate case ID
        case_id = f"PSA-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        # Process alert through LangGraph workflow
        result = await workflow.process_alert(alert_text, case_id)
        
        # Store result in history
        workflow_history[case_id] = result
        
        # Check if workflow needs human review
        if result.get('needs_human_review', False):
            return jsonify({
                "success": True,
                "case_id": case_id,
                "status": "pending_human_review",
                "message": "Alert requires human review before proceeding",
                "workflow_state": result,
                "next_action": "awaiting_approval"
            })
        
        # Check if auto-escalation is triggered
        if result.get('auto_escalate', False):
            return jsonify({
                "success": True,
                "case_id": case_id,
                "status": "auto_escalated",
                "message": "Alert automatically escalated based on severity and confidence",
                "workflow_state": result,
                "escalation_contact": result.get('escalation_contact', {}),
                "email_content": result.get('email_content', {})
            })
        
        # Standard completion
        return jsonify({
            "success": True,
            "case_id": case_id,
            "status": "completed",
            "message": "Alert processed successfully",
            "workflow_state": result,
            "recommendation": result.get('final_recommendation', '')
        })
        
    except Exception as e:
        print(f"❌ Error processing alert: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/workflow/<case_id>/approve', methods=['POST'])
async def approve_workflow(case_id):
    """
    Approve a workflow that requires human review
    
    This endpoint allows human operators to approve workflows
    that were paused for human review.
    """
    try:
        if case_id not in workflow_history:
            return jsonify({"error": "Workflow not found"}), 404
        
        workflow_state = workflow_history[case_id]
        
        # Update workflow state with human approval
        workflow_state['human_approved'] = True
        workflow_state['needs_human_review'] = False
        
        # Continue workflow execution from where it left off
        if workflow_state.get('execution_path', [])[-1] == 'human_review':
            # Resume from escalation node
            workflow_state['auto_escalate'] = True
            workflow_state['status'] = 'approved'
        
        # Update history
        workflow_history[case_id] = workflow_state
        
        return jsonify({
            "success": True,
            "message": "Workflow approved and resumed",
            "workflow_state": workflow_state
        })
        
    except Exception as e:
        print(f"❌ Error approving workflow: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/workflow/<case_id>/reject', methods=['POST'])
async def reject_workflow(case_id):
    """
    Reject a workflow that requires human review
    
    This endpoint allows human operators to reject workflows
    and provide alternative actions.
    """
    try:
        data = request.get_json()
        rejection_reason = data.get('reason', 'No reason provided')
        
        if case_id not in workflow_history:
            return jsonify({"error": "Workflow not found"}), 404
        
        workflow_state = workflow_history[case_id]
        
        # Update workflow state with rejection
        workflow_state['human_approved'] = False
        workflow_state['needs_human_review'] = False
        workflow_state['status'] = 'rejected'
        workflow_state['rejection_reason'] = rejection_reason
        
        # Update history
        workflow_history[case_id] = workflow_state
        
        return jsonify({
            "success": True,
            "message": "Workflow rejected",
            "workflow_state": workflow_state
        })
        
    except Exception as e:
        print(f"❌ Error rejecting workflow: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/workflow/<case_id>/status', methods=['GET'])
def get_workflow_status(case_id):
    """
    Get the current status of a workflow
    
    This endpoint provides real-time status updates for workflows,
    including human review requirements and execution paths.
    """
    try:
        if case_id not in workflow_history:
            return jsonify({"error": "Workflow not found"}), 404
        
        workflow_state = workflow_history[case_id]
        
        return jsonify({
            "success": True,
            "case_id": case_id,
            "status": workflow_state.get('status', 'unknown'),
            "execution_path": workflow_state.get('execution_path', []),
            "needs_human_review": workflow_state.get('needs_human_review', False),
            "human_approved": workflow_state.get('human_approved', False),
            "auto_escalate": workflow_state.get('auto_escalate', False),
            "severity": workflow_state.get('severity', 'unknown'),
            "confidence_score": workflow_state.get('confidence_score', 0.0),
            "workflow_state": workflow_state
        })
        
    except Exception as e:
        print(f"❌ Error getting workflow status: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/workflows', methods=['GET'])
def list_workflows():
    """
    List all workflows with their current status
    
    This endpoint provides a comprehensive view of all workflows,
    including their execution paths and current states.
    """
    try:
        workflows = []
        
        for case_id, state in workflow_history.items():
            workflows.append({
                "case_id": case_id,
                "status": state.get('status', 'unknown'),
                "severity": state.get('severity', 'unknown'),
                "confidence_score": state.get('confidence_score', 0.0),
                "execution_path": state.get('execution_path', []),
                "needs_human_review": state.get('needs_human_review', False),
                "timestamp": state.get('timestamp', ''),
                "module": state.get('module', 'unknown')
            })
        
        # Sort by timestamp (newest first)
        workflows.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            "success": True,
            "workflows": workflows,
            "total": len(workflows)
        })
        
    except Exception as e:
        print(f"❌ Error listing workflows: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/workflow/<case_id>/resume', methods=['POST'])
async def resume_workflow(case_id):
    """
    Resume a paused workflow
    
    This endpoint allows resuming workflows that were paused
    for human review or other reasons.
    """
    try:
        if case_id not in workflow_history:
            return jsonify({"error": "Workflow not found"}), 404
        
        workflow_state = workflow_history[case_id]
        
        # Check if workflow can be resumed
        if workflow_state.get('status') not in ['pending_human_review', 'paused']:
            return jsonify({
                "error": "Workflow cannot be resumed from current status"
            }), 400
        
        # Resume workflow execution
        # This would involve continuing from the last node in the execution path
        # For now, we'll mark it as resumed
        workflow_state['status'] = 'resumed'
        workflow_state['resumed_at'] = datetime.now().isoformat()
        
        # Update history
        workflow_history[case_id] = workflow_state
        
        return jsonify({
            "success": True,
            "message": "Workflow resumed",
            "workflow_state": workflow_state
        })
        
    except Exception as e:
        print(f"❌ Error resuming workflow: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/send_email', methods=['POST'])
def send_escalation_email():
    """
    Send escalation email using workflow-generated content
    
    This endpoint uses the email content generated by the LangGraph workflow
    to send escalation emails.
    """
    try:
        data = request.get_json()
        case_id = data.get('case_id')
        
        if not case_id or case_id not in workflow_history:
            return jsonify({"error": "Invalid case ID"}), 400
        
        workflow_state = workflow_history[case_id]
        email_content = workflow_state.get('email_content', {})
        
        if not email_content:
            return jsonify({"error": "No email content available"}), 400
        
        # Here you would integrate with your email service
        # For now, we'll simulate success
        return jsonify({
            "success": True,
            "message": "Escalation email sent successfully",
            "recipient": email_content.get('to', 'unknown'),
            "subject": email_content.get('subject', 'No subject')
        })
        
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/analytics', methods=['GET'])
def get_analytics():
    """
    Get analytics data for workflows
    
    This endpoint provides analytics on workflow performance,
    including success rates, average processing times, and
    human review requirements.
    """
    try:
        total_workflows = len(workflow_history)
        completed_workflows = len([w for w in workflow_history.values() if w.get('status') == 'completed'])
        pending_review = len([w for w in workflow_history.values() if w.get('needs_human_review', False)])
        auto_escalated = len([w for w in workflow_history.values() if w.get('auto_escalate', False)])
        
        # Calculate average confidence scores
        confidence_scores = [w.get('confidence_score', 0) for w in workflow_history.values() if w.get('confidence_score')]
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        
        # Severity distribution
        severity_counts = {}
        for workflow in workflow_history.values():
            severity = workflow.get('severity', 'unknown')
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        return jsonify({
            "success": True,
            "analytics": {
                "total_workflows": total_workflows,
                "completed_workflows": completed_workflows,
                "pending_human_review": pending_review,
                "auto_escalated": auto_escalated,
                "average_confidence": round(avg_confidence, 2),
                "severity_distribution": severity_counts,
                "success_rate": round((completed_workflows / total_workflows * 100) if total_workflows > 0 else 0, 2)
            }
        })
        
    except Exception as e:
        print(f"❌ Error getting analytics: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/simulation/logs', methods=['GET'])
def get_simulation_logs():
    """Get available log files for simulation"""
    try:
        logs_dir = "Application Logs"
        if not os.path.exists(logs_dir):
            return jsonify({"error": "Application Logs directory not found"}), 404
        
        log_files = []
        for filename in os.listdir(logs_dir):
            if filename.endswith('.log'):
                file_path = os.path.join(logs_dir, filename)
                file_size = os.path.getsize(file_path)
                log_files.append({
                    "filename": filename,
                    "size": file_size,
                    "path": file_path
                })
        
        return jsonify({
            "success": True,
            "log_files": log_files
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/simulation/start', methods=['POST'])
async def start_simulation():
    """Start log simulation using LangGraph workflow"""
    try:
        data = request.get_json()
        selected_files = data.get('selected_files', [])
        
        if not selected_files:
            return jsonify({"error": "No files selected"}), 400
        
        results = []
        for file_path in selected_files:
            try:
                # Read log file content
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    log_content = f.read()
                
                # Generate case ID
                case_id = f"SIM-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{len(results)}"
                
                # Process through LangGraph workflow
                result = await workflow.process_alert(log_content, case_id)
                
                # Store result
                workflow_history[case_id] = result
                
                results.append({
                    "filename": os.path.basename(file_path),
                    "case_id": case_id,
                    "result": result
                })
                
            except Exception as e:
                results.append({
                    "filename": os.path.basename(file_path),
                    "error": str(e)
                })
        
        return jsonify({
            "success": True,
            "results": results
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/simulation/status', methods=['GET'])
def get_simulation_status():
    """Get simulation status"""
    try:
        simulation_workflows = {k: v for k, v in workflow_history.items() if k.startswith('SIM-')}
        
        return jsonify({
            "success": True,
            "simulation_workflows": simulation_workflows,
            "total": len(simulation_workflows)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    print("[STARTING] PSA LangGraph Flask Application...")
    print("[OK] LangGraph workflow initialized")
    print("[OK] Database connected")
    print("[OK] API endpoints ready")
    print("\n[ENDPOINTS] Available endpoints:")
    print("  POST /process_alert - Process alert through LangGraph workflow")
    print("  GET  /workflow/<case_id>/status - Get workflow status")
    print("  POST /workflow/<case_id>/approve - Approve workflow")
    print("  POST /workflow/<case_id>/reject - Reject workflow")
    print("  GET  /workflows - List all workflows")
    print("  GET  /analytics - Get workflow analytics")
    print("  GET  /health - Health check")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
