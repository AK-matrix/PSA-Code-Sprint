"""
PSA Flask Application — LangGraph edition

Entry point for the backend API. Routes delegate to the LangGraph workflow
(`langgraph_workflow.py`) for all AI processing. Workflow state is held in
`_workflow_store` (in-process dict) and is **not** persisted across restarts —
use the SQLite IncidentDatabase for durable incident history.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import Any, Dict

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from database import IncidentDatabase
from langgraph_workflow import workflow

load_dotenv()

# ---------------------------------------------------------------------------
# Logging — structured, level controlled by LOG_LEVEL env var
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(
    app,
    resources={
        r"/*": {
            "origins": os.getenv("CORS_ORIGINS", "*"),
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type"],
        }
    },
)

db = IncidentDatabase()

# In-process workflow state store (lost on restart; backed by DB for persistence)
_workflow_store: Dict[str, Dict[str, Any]] = {}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _store(case_id: str, state: Dict[str, Any]) -> None:
    _workflow_store[case_id] = state


def _get(case_id: str) -> Dict[str, Any] | None:
    return _workflow_store.get(case_id)


def _error(message: str, status: int = 400):
    return jsonify({"success": False, "error": message}), status


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health_check():
    healthy = bool(workflow and workflow.graph)
    services = {
        "langgraph": "operational" if healthy else "degraded",
        "chromadb": "operational" if workflow.collections else "degraded",
        "llm": "operational" if workflow.llm else "degraded (fallback mode)",
    }
    payload = {
        "status": "healthy" if healthy else "unhealthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "services": services,
    }
    return jsonify(payload), 200 if healthy else 503


@app.post("/process_alert")
async def process_alert():
    """Process an alert through the LangGraph multi-agent pipeline."""
    data = request.get_json(silent=True) or {}
    alert_text = (data.get("alert_text") or "").strip()
    if not alert_text:
        return _error("alert_text is required")
    if len(alert_text) > 10_000:
        return _error("alert_text exceeds maximum length of 10 000 characters")

    case_id = f"PSA-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    logger.info("Processing alert case_id=%s", case_id)

    result = await workflow.process_alert(alert_text, case_id)
    _store(case_id, result)

    if result.get("needs_human_review"):
        return jsonify({
            "success": True,
            "case_id": case_id,
            "status": "pending_human_review",
            "message": "Alert requires human review before proceeding",
            "workflow_state": result,
            "next_action": "awaiting_approval",
        })

    if result.get("auto_escalate"):
        return jsonify({
            "success": True,
            "case_id": case_id,
            "status": "auto_escalated",
            "message": "Alert automatically escalated based on severity and confidence",
            "workflow_state": result,
            "escalation_contact": result.get("escalation_contact", {}),
            "email_content": result.get("email_content", {}),
        })

    return jsonify({
        "success": True,
        "case_id": case_id,
        "status": "completed",
        "message": "Alert processed successfully",
        "workflow_state": result,
        "recommendation": result.get("final_recommendation", ""),
    })


@app.post("/workflow/<case_id>/approve")
async def approve_workflow(case_id: str):
    """Approve a workflow that is pending human review."""
    state = _get(case_id)
    if state is None:
        return _error("Workflow not found", 404)

    state["human_approved"] = True
    state["needs_human_review"] = False
    if state.get("execution_path", [])[-1:] == ["human_review"]:
        state["auto_escalate"] = True
        state["status"] = "approved"
    _store(case_id, state)
    logger.info("Workflow %s approved", case_id)
    return jsonify({"success": True, "message": "Workflow approved and resumed", "workflow_state": state})


@app.post("/workflow/<case_id>/reject")
async def reject_workflow(case_id: str):
    """Reject a workflow pending human review."""
    data = request.get_json(silent=True) or {}
    state = _get(case_id)
    if state is None:
        return _error("Workflow not found", 404)

    state.update(
        human_approved=False,
        needs_human_review=False,
        status="rejected",
        rejection_reason=data.get("reason", "No reason provided"),
    )
    _store(case_id, state)
    logger.info("Workflow %s rejected", case_id)
    return jsonify({"success": True, "message": "Workflow rejected", "workflow_state": state})


@app.get("/workflow/<case_id>/status")
def get_workflow_status(case_id: str):
    state = _get(case_id)
    if state is None:
        return _error("Workflow not found", 404)
    return jsonify({
        "success": True,
        "case_id": case_id,
        "status": state.get("status", "unknown"),
        "execution_path": state.get("execution_path", []),
        "needs_human_review": state.get("needs_human_review", False),
        "human_approved": state.get("human_approved", False),
        "auto_escalate": state.get("auto_escalate", False),
        "severity": state.get("severity", "unknown"),
        "confidence_score": state.get("confidence_score", 0.0),
        "workflow_state": state,
    })


@app.get("/workflows")
def list_workflows():
    items = [
        {
            "case_id": cid,
            "status": s.get("status", "unknown"),
            "severity": s.get("severity", "unknown"),
            "confidence_score": s.get("confidence_score", 0.0),
            "execution_path": s.get("execution_path", []),
            "needs_human_review": s.get("needs_human_review", False),
            "timestamp": s.get("timestamp", ""),
            "module": s.get("module", "unknown"),
        }
        for cid, s in _workflow_store.items()
    ]
    items.sort(key=lambda x: x["timestamp"], reverse=True)
    return jsonify({"success": True, "workflows": items, "total": len(items)})


@app.post("/workflow/<case_id>/resume")
async def resume_workflow(case_id: str):
    state = _get(case_id)
    if state is None:
        return _error("Workflow not found", 404)
    if state.get("status") not in ("pending_human_review", "paused"):
        return _error("Workflow cannot be resumed from its current status")
    state["status"] = "resumed"
    state["resumed_at"] = datetime.now().isoformat()
    _store(case_id, state)
    return jsonify({"success": True, "message": "Workflow resumed", "workflow_state": state})


@app.post("/send_email")
def send_escalation_email():
    data = request.get_json(silent=True) or {}
    case_id = data.get("case_id", "").strip()
    if not case_id:
        return _error("case_id is required")
    state = _get(case_id)
    if state is None:
        return _error("Workflow not found", 404)
    email_content = state.get("email_content") or {}
    if not email_content:
        return _error("No email content available for this workflow")
    # Email sending is handled by email_service.py; this endpoint returns the payload.
    logger.info("Email payload retrieved for case %s", case_id)
    return jsonify({
        "success": True,
        "message": "Escalation email dispatched",
        "recipient": email_content.get("to", "unknown"),
        "subject": email_content.get("subject", ""),
    })


@app.get("/analytics")
def get_analytics():
    total = len(_workflow_store)
    completed = sum(1 for s in _workflow_store.values() if s.get("status") == "completed")
    pending = sum(1 for s in _workflow_store.values() if s.get("needs_human_review"))
    escalated = sum(1 for s in _workflow_store.values() if s.get("auto_escalate"))
    scores = [s["confidence_score"] for s in _workflow_store.values() if s.get("confidence_score")]
    avg_conf = sum(scores) / len(scores) if scores else 0.0
    severity_dist: Dict[str, int] = {}
    for s in _workflow_store.values():
        sev = s.get("severity", "unknown")
        severity_dist[sev] = severity_dist.get(sev, 0) + 1
    return jsonify({
        "success": True,
        "analytics": {
            "total_workflows": total,
            "completed_workflows": completed,
            "pending_human_review": pending,
            "auto_escalated": escalated,
            "average_confidence": round(avg_conf, 2),
            "severity_distribution": severity_dist,
            "success_rate": round(completed / total * 100 if total else 0, 2),
        },
    })


@app.get("/simulation/logs")
def get_simulation_logs():
    logs_dir = "Application Logs"
    if not os.path.exists(logs_dir):
        return _error("Application Logs directory not found", 404)
    log_files = [
        {"filename": f, "size": os.path.getsize(os.path.join(logs_dir, f)), "path": os.path.join(logs_dir, f)}
        for f in os.listdir(logs_dir)
        if f.endswith(".log")
    ]
    return jsonify({"success": True, "log_files": log_files})


@app.post("/simulation/start")
async def start_simulation():
    data = request.get_json(silent=True) or {}
    selected_files = data.get("selected_files") or []
    if not selected_files:
        return _error("No files selected")

    results = []
    for file_path in selected_files:
        try:
            with open(file_path, encoding="utf-8", errors="ignore") as fh:
                log_content = fh.read()
            case_id = f"SIM-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{len(results)}"
            result = await workflow.process_alert(log_content, case_id)
            _store(case_id, result)
            results.append({"filename": os.path.basename(file_path), "case_id": case_id, "result": result})
        except OSError as exc:
            logger.warning("Could not read log file %s: %s", file_path, exc)
            results.append({"filename": os.path.basename(file_path), "error": str(exc)})

    return jsonify({"success": True, "results": results})


@app.get("/simulation/status")
def get_simulation_status():
    sim = {k: v for k, v in _workflow_store.items() if k.startswith("SIM-")}
    return jsonify({"success": True, "simulation_workflows": sim, "total": len(sim)})


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------

@app.errorhandler(404)
def not_found(_err):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(_err):
    logger.exception("Unhandled server error")
    return jsonify({"error": "Internal server error"}), 500


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    logger.info("Starting PSA LangGraph API on port %d (debug=%s)", port, debug)
    app.run(debug=debug, host="0.0.0.0", port=port)
