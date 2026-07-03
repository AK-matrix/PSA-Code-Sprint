# PSA PortaBella — Multi-Agent RAG Alert System

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2+-green.svg)](https://langchain-ai.github.io/langgraph/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-0.5+-purple.svg)](https://chromadb.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](https://docker.com)

A production-grade **multi-agent RAG system** for intelligent log analysis, incident triage, and automated escalation in port operations. Built during the PSA Code Sprint.

## Architecture

```
Frontend (Next.js 15)  ←→  Backend (Flask + LangGraph)  ←→  ChromaDB + SQLite
```

### Agent Pipeline

```
Alert Input
    │
    ▼
Triage Agent          ← classifies module, severity, entities via LLM
    │
    ├─ LOW severity ──────────────────────────────────────► End
    │
    ├─ MEDIUM ──────────────────────────────────────────► Human Review
    │
    └─ HIGH / CRITICAL
           │
           ▼
     Diagnostic Agent  ← Hybrid RAG search (semantic + keyword) against SOP knowledge base
           │
           ├─ confidence < 0.3 ──────────────────────────► Human Review
           ├─ high conf + critical ──────────────────────► Escalation
           └─ otherwise
                  │
                  ▼
           Predictive Agent  ← pattern-matches against historical Case Log
                  │
                  ├─ high risk + critical ──────────────► Escalation
                  └─ otherwise ──────────────────────────► Human Review
                                                              │
                                                              └── approved? ──► Escalation
                                                                               ► Finalize
```

### Hybrid Search

The Diagnostic Agent uses a **dual-retrieval strategy** against the ChromaDB SOP knowledge base:

1. **Semantic search** (5 results) — sentence-transformer embeddings for broad contextual match
2. **Keyword/entity search** (2 results) — entity-based exact matching for technical precision
3. Results are deduplicated and re-ranked; the LLM synthesises both channels

## Quick Start

### 1. Prerequisites

- Python 3.10+
- Node.js 18+
- API key for OpenAI **or** Google Gemini

### 2. Environment

```bash
cp .env.example .env
# Fill in OPENAI_API_KEY or GOOGLE_API_KEY, and RESEND_API_KEY
```

### 3. Backend

```bash
pip install -r requirements.txt

# One-time data ingestion (builds ChromaDB vector store)
python setup.py          # extracts SOPs from Knowledge Base.docx + Case Log.xlsx
python ingest.py         # embeds and indexes everything into ChromaDB

# Start the API
python app_langgraph.py
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### 5. Docker (full stack)

```bash
docker-compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
```

## Project Structure

```
├── app_langgraph.py       # Flask API — all endpoints
├── langgraph_workflow.py  # LangGraph agents + hybrid search
├── database.py            # SQLite persistence (incidents, SOP performance)
├── ai_client.py           # Provider-agnostic LLM client (OpenAI / Gemini)
├── email_service.py       # Resend-powered HTML email notifications
├── ingest.py              # ChromaDB ingestion pipeline
├── setup.py               # One-time data extraction + ingestion orchestrator
├── parse_case_logs.py     # Parses Case Log.xlsx → case_logs.json
├── frontend/              # Next.js 15 dashboard
│   ├── app/               # Route-based pages (dashboard, history, analytics, …)
│   └── components/        # Shared UI components
├── Dockerfile             # Backend container
├── docker-compose.yml     # Full-stack compose
├── requirements.txt       # Pinned Python dependencies
└── .env.example           # Environment variable template
```

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/health` | Service health check |
| `POST` | `/process_alert` | Submit an alert through the full pipeline |
| `GET`  | `/workflow/<id>/status` | Poll workflow state |
| `POST` | `/workflow/<id>/approve` | Human-in-the-loop approval |
| `POST` | `/workflow/<id>/reject` | Human-in-the-loop rejection |
| `GET`  | `/workflows` | List all in-process workflows |
| `GET`  | `/analytics` | Aggregate metrics |
| `POST` | `/simulation/start` | Batch-process log files |
| `GET`  | `/simulation/logs` | List available log files |

### Process Alert — Request / Response

```json
// POST /process_alert
{ "alert_text": "CNTR EDI 997 functional acknowledgement missing for shipment MSKU1234567" }

// Response (auto-escalated)
{
  "success": true,
  "case_id": "PSA-20250704-143022",
  "status": "auto_escalated",
  "workflow_state": {
    "severity": "high",
    "module": "EDI/API",
    "confidence_score": 0.87,
    "best_sop": "EDI-SOP-003 Functional Acknowledgement Failure",
    "resolution_summary": "...",
    "execution_path": ["triage", "diagnostic", "escalation", "finalize"]
  }
}
```

## Configuration

All configuration is via environment variables (see `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | One of these | OpenAI key (preferred) |
| `GOOGLE_API_KEY` | One of these | Google Gemini key |
| `RESEND_API_KEY` | For email | Resend transactional email key |
| `PORT` | No (5000) | Backend port |
| `LOG_LEVEL` | No (INFO) | Python logging level |
| `FLASK_DEBUG` | No (false) | Enable Flask debug mode |
| `NEXT_PUBLIC_API_URL` | No | Frontend → backend URL |

## Running Tests

```bash
# Hybrid search
python test_hybrid_search.py

# Full LangGraph workflow (requires API key or uses fallback)
python test_langgraph_workflow.py

# Triage-only smoke test
python test_triage_only.py
```

## Notes

- **In-process state**: The `/workflow/*` endpoints track state in memory — data is lost on restart. The SQLite `IncidentDatabase` provides durable history.
- **Fallback mode**: If no LLM API key is configured, the system falls back to rule-based triage and skips LLM diagnostic analysis — the pipeline still runs end-to-end.
- **ChromaDB**: The vector store must be built locally with `python ingest.py` before the diagnostic agent can retrieve SOPs. The `chroma_db/` directory is excluded from git.
