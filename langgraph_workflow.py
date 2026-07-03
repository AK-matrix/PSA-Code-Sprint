"""
LangGraph-based PSA Alert Processing Workflow

Orchestrates the PSA alert pipeline: triage → diagnostic (hybrid RAG search) →
predictive → human review → escalation → finalize.

All nodes are synchronous; the public `process_alert` coroutine bridges to asyncio
via `graph.ainvoke` so Flask async routes can await it without blocking.
"""

from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, TypedDict

import chromadb
import pandas as pd
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from sentence_transformers import SentenceTransformer

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# State schema
# ---------------------------------------------------------------------------

class PSAState(TypedDict):
    # Input
    alert_text: str
    case_id: str
    timestamp: str

    # Triage
    triage_result: Optional[Dict[str, Any]]
    severity: str
    urgency: str
    module: str
    entities: List[str]

    # Diagnostic
    diagnostic_result: Optional[Dict[str, Any]]
    problem_statement: str
    root_cause: str
    confidence_score: float
    best_sop: str
    resolution_summary: str

    # Predictive
    predictive_result: Optional[Dict[str, Any]]
    predicted_impact: str
    historical_patterns: List[str]
    risk_assessment: str

    # Routing & control
    needs_human_review: bool
    auto_escalate: bool
    human_approved: bool
    execution_path: List[str]

    # Output
    escalation_contact: Dict[str, Any]
    email_content: Dict[str, str]
    final_recommendation: str
    status: str
    error_message: Optional[str]


# ---------------------------------------------------------------------------
# JSON extraction helper
# ---------------------------------------------------------------------------

_JSON_FENCE = re.compile(r"```(?:json)?\s*([\s\S]*?)```", re.IGNORECASE)


def _parse_llm_json(text: str) -> Dict[str, Any]:
    """Extract a JSON object from an LLM response that may contain markdown fences."""
    # Try fenced block first
    m = _JSON_FENCE.search(text)
    if m:
        text = m.group(1).strip()
    # Fall back to finding the first '{…}' span
    else:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            text = text[start:end]
    return json.loads(text)


# ---------------------------------------------------------------------------
# Workflow class
# ---------------------------------------------------------------------------

class PSALangGraphWorkflow:
    """LangGraph workflow for PSA alert processing."""

    def __init__(self) -> None:
        self.sentence_transformer: Optional[SentenceTransformer] = None
        self.chroma_client: Optional[chromadb.ClientAPI] = None
        self.collections: Dict[str, Any] = {}
        self.historical_data: pd.DataFrame = pd.DataFrame()
        self.llm = None
        self._initialize_components()
        self._build_graph()

    # ------------------------------------------------------------------
    # Initialisation
    # ------------------------------------------------------------------

    def _initialize_components(self) -> None:
        try:
            self.sentence_transformer = SentenceTransformer("all-MiniLM-L6-v2")
            self._load_collections()
            self._load_historical_data()
            self._initialize_llm()
            logger.info("LangGraph workflow components initialised")
        except Exception:
            logger.exception("Failed to initialise workflow components")
            raise

    def _load_collections(self) -> None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        chroma_path = os.path.join(script_dir, "chroma_db")
        if not os.path.exists(chroma_path):
            logger.warning("ChromaDB directory not found — run ingest.py first")
            return
        try:
            self.chroma_client = chromadb.PersistentClient(path=chroma_path)
            for col in self.chroma_client.list_collections():
                self.collections[col.name] = self.chroma_client.get_collection(col.name)
            logger.info("Loaded %d ChromaDB collections", len(self.collections))
        except Exception:
            logger.exception("Failed to load ChromaDB collections")
            self.collections = {}

    def _load_historical_data(self) -> None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        path = os.path.join(script_dir, "Case Log.xlsx")
        if not os.path.exists(path):
            logger.warning("Case Log.xlsx not found — predictive node will use fallback")
            return
        try:
            self.historical_data = pd.read_excel(path)
            logger.info("Loaded %d historical cases", len(self.historical_data))
        except Exception:
            logger.exception("Failed to load historical data")

    def _initialize_llm(self) -> None:
        if openai_key := os.getenv("OPENAI_API_KEY"):
            self.llm = ChatOpenAI(model="gpt-4o", temperature=0.1, api_key=openai_key)
            logger.info("LLM: OpenAI gpt-4o")
        elif google_key := os.getenv("GOOGLE_API_KEY"):
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-pro", temperature=0.1, google_api_key=google_key
            )
            logger.info("LLM: Google Gemini Pro")
        else:
            logger.warning("No LLM API key found — nodes will use rule-based fallback")

    # ------------------------------------------------------------------
    # Graph construction
    # ------------------------------------------------------------------

    def _build_graph(self) -> None:
        g = StateGraph(PSAState)
        g.add_node("triage", self._triage_node)
        g.add_node("diagnostic", self._diagnostic_node)
        g.add_node("predictive", self._predictive_node)
        g.add_node("human_review", self._human_review_node)
        g.add_node("escalation", self._escalation_node)
        g.add_node("finalize", self._finalize_node)

        g.set_entry_point("triage")
        g.add_conditional_edges(
            "triage",
            self._route_after_triage,
            {"diagnostic": "diagnostic", "human_review": "human_review", "end": END},
        )
        g.add_conditional_edges(
            "diagnostic",
            self._route_after_diagnostic,
            {"predictive": "predictive", "human_review": "human_review", "escalation": "escalation"},
        )
        g.add_conditional_edges(
            "predictive",
            self._route_after_predictive,
            {"escalation": "escalation", "human_review": "human_review"},
        )
        g.add_conditional_edges(
            "human_review",
            self._route_after_human_review,
            {"escalation": "escalation", "finalize": "finalize", "end": END},
        )
        g.add_edge("escalation", "finalize")
        g.add_edge("finalize", END)

        self.graph = g.compile()
        logger.info("LangGraph workflow compiled")

    # ------------------------------------------------------------------
    # Nodes
    # ------------------------------------------------------------------

    def _triage_node(self, state: PSAState) -> PSAState:
        logger.info("[triage] processing case %s", state["case_id"])
        try:
            if self.llm:
                prompt = (
                    "Analyze this alert and return ONLY a JSON object with keys: "
                    "module (CNTR|VSL|EDI/API|Infra/SRE), entities (list of strings), "
                    "alert_type (error|warning|info), severity (critical|high|medium|low), "
                    "urgency (immediate|high|medium|low).\n\nAlert:\n" + state["alert_text"]
                )
                response = self.llm.invoke([HumanMessage(content=prompt)])
                triage_result = _parse_llm_json(response.content)
            else:
                triage_result = self._fallback_triage(state["alert_text"])

            state["triage_result"] = triage_result
            state["severity"] = triage_result.get("severity", "medium")
            state["urgency"] = triage_result.get("urgency", "medium")
            state["module"] = triage_result.get("module", "CNTR")
            state["entities"] = triage_result.get("entities", [])
            state["execution_path"] = state.get("execution_path", []) + ["triage"]
            logger.info("[triage] severity=%s module=%s", state["severity"], state["module"])
        except json.JSONDecodeError as exc:
            logger.warning("[triage] LLM returned unparseable JSON — using fallback (%s)", exc)
            fallback = self._fallback_triage(state["alert_text"])
            state.update(
                triage_result=fallback,
                severity=fallback["severity"],
                urgency=fallback["urgency"],
                module=fallback["module"],
                entities=fallback["entities"],
                execution_path=state.get("execution_path", []) + ["triage"],
            )
        except Exception:
            logger.exception("[triage] unexpected error")
            state["error_message"] = "Triage failed"
            state["status"] = "error"
        return state

    def _diagnostic_node(self, state: PSAState) -> PSAState:
        logger.info("[diagnostic] case %s", state["case_id"])
        try:
            candidate_sops = self._retrieve_candidate_sops(
                state["alert_text"], state["module"], state.get("entities")
            )
            if self.llm and candidate_sops:
                diagnostic_result = self._perform_diagnostic_analysis(
                    state["alert_text"], candidate_sops, state.get("entities")
                )
            else:
                diagnostic_result = self._fallback_diagnostic(state["alert_text"])

            state["diagnostic_result"] = diagnostic_result
            state["problem_statement"] = diagnostic_result.get("problem_statement", "Unknown")
            state["root_cause"] = diagnostic_result.get("reasoning", "Unknown")
            state["confidence_score"] = float(diagnostic_result.get("confidence_score", 0.5))
            state["best_sop"] = diagnostic_result.get("best_sop_id", "None")
            state["resolution_summary"] = diagnostic_result.get(
                "resolution_summary", "Manual review required"
            )
            state["execution_path"] = state.get("execution_path", []) + ["diagnostic"]
            logger.info("[diagnostic] confidence=%.2f", state["confidence_score"])
        except Exception:
            logger.exception("[diagnostic] unexpected error")
            state["error_message"] = "Diagnostic failed"
            state["status"] = "error"
        return state

    def _predictive_node(self, state: PSAState) -> PSAState:
        logger.info("[predictive] case %s", state["case_id"])
        try:
            if not self.historical_data.empty:
                predictive_result = self._analyze_historical_patterns(
                    state["problem_statement"], state["entities"]
                )
            else:
                predictive_result = self._fallback_predictive(state["problem_statement"])

            state["predictive_result"] = predictive_result
            state["predicted_impact"] = predictive_result.get("predictive_insight", "Unknown")
            state["historical_patterns"] = predictive_result.get("patterns", [])
            state["risk_assessment"] = predictive_result.get("risk_level", "medium")
            state["execution_path"] = state.get("execution_path", []) + ["predictive"]
            logger.info("[predictive] risk=%s", state["risk_assessment"])
        except Exception:
            logger.exception("[predictive] unexpected error")
            state["error_message"] = "Predictive analysis failed"
            state["status"] = "error"
        return state

    def _human_review_node(self, state: PSAState) -> PSAState:
        """Checkpoint node — in production, execution pauses here for operator input."""
        logger.info("[human_review] awaiting approval for case %s", state["case_id"])
        severity = state.get("severity", "medium")
        confidence = state.get("confidence_score", 0.5)
        # Simulate auto-approval for high-confidence critical cases
        if severity in ("critical", "high") and confidence > 0.7:
            state["human_approved"] = True
            state["auto_escalate"] = True
        else:
            state["human_approved"] = False
            state["auto_escalate"] = False
        state["needs_human_review"] = True
        state["execution_path"] = state.get("execution_path", []) + ["human_review"]
        return state

    def _escalation_node(self, state: PSAState) -> PSAState:
        logger.info("[escalation] case %s", state["case_id"])
        try:
            state["escalation_contact"] = self._get_escalation_contact(state["module"])
            state["email_content"] = self._generate_escalation_email(state)
            state["execution_path"] = state.get("execution_path", []) + ["escalation"]
        except Exception:
            logger.exception("[escalation] unexpected error")
            state["error_message"] = "Escalation failed"
            state["status"] = "error"
        return state

    def _finalize_node(self, state: PSAState) -> PSAState:
        logger.info("[finalize] case %s", state["case_id"])
        try:
            state["final_recommendation"] = self._generate_final_recommendation(state)
            state["status"] = "completed"
            state["execution_path"] = state.get("execution_path", []) + ["finalize"]
        except Exception:
            logger.exception("[finalize] unexpected error")
            state["error_message"] = "Finalization failed"
            state["status"] = "error"
        return state

    # ------------------------------------------------------------------
    # Routing
    # ------------------------------------------------------------------

    def _route_after_triage(self, state: PSAState) -> str:
        severity = state.get("severity", "medium")
        if severity == "low":
            return "end"
        if severity in ("critical", "high"):
            return "diagnostic"
        return "human_review"

    def _route_after_diagnostic(self, state: PSAState) -> str:
        confidence = state.get("confidence_score", 0.5)
        severity = state.get("severity", "medium")
        if confidence < 0.3:
            return "human_review"
        if severity in ("critical", "high") and confidence > 0.7:
            return "escalation"
        return "predictive"

    def _route_after_predictive(self, state: PSAState) -> str:
        if state.get("risk_assessment") == "high" and state.get("severity") in ("critical", "high"):
            return "escalation"
        return "human_review"

    def _route_after_human_review(self, state: PSAState) -> str:
        return "escalation" if state.get("human_approved") else "finalize"

    # ------------------------------------------------------------------
    # Hybrid search (semantic + keyword)
    # ------------------------------------------------------------------

    def _retrieve_candidate_sops(
        self, alert_text: str, module: str, entities: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Hybrid search: semantic vector search + entity keyword search, deduplicated."""
        collection = self.collections.get(module)
        if collection is None:
            logger.debug("[search] no collection for module '%s'", module)
            return []

        seen_ids: set[str] = set()
        results: List[Dict[str, Any]] = []

        def _add(docs, ids, metas, distances, search_type: str) -> None:
            for doc, doc_id, meta, dist in zip(docs, ids, metas, distances):
                if doc_id not in seen_ids:
                    seen_ids.add(doc_id)
                    results.append(
                        {
                            "id": doc_id,
                            "document": doc,
                            "metadata": meta,
                            "relevance_score": max(0.0, 1.0 - dist),
                            "search_type": search_type,
                        }
                    )

        # Semantic search
        try:
            sem = collection.query(
                query_texts=[alert_text], n_results=5, where={"doc_type": "SOP"}
            )
            if sem["documents"] and sem["documents"][0]:
                _add(
                    sem["documents"][0],
                    sem["ids"][0],
                    sem["metadatas"][0],
                    sem["distances"][0],
                    "semantic",
                )
        except Exception:
            logger.warning("[search] semantic search failed", exc_info=True)

        # Keyword search
        if entities:
            keyword_query = " ".join(entities)
            try:
                kw = collection.query(
                    query_texts=[keyword_query],
                    n_results=2,
                    where={"doc_type": "SOP"},
                    where_document={"$contains": keyword_query},
                )
                if kw["documents"] and kw["documents"][0]:
                    _add(
                        kw["documents"][0],
                        kw["ids"][0],
                        kw["metadatas"][0],
                        kw["distances"][0],
                        "keyword",
                    )
            except Exception:
                logger.debug("[search] where_document keyword search failed; trying per-entity")
                for entity in entities:
                    try:
                        er = collection.query(
                            query_texts=[entity], n_results=1, where={"doc_type": "SOP"}
                        )
                        if er["documents"] and er["documents"][0]:
                            _add(
                                er["documents"][0],
                                er["ids"][0],
                                er["metadatas"][0],
                                er["distances"][0],
                                "keyword",
                            )
                    except Exception:
                        logger.debug("[search] entity search failed for '%s'", entity)

        results.sort(key=lambda r: r["relevance_score"], reverse=True)
        logger.info("[search] hybrid search returned %d unique SOPs", len(results))
        return results

    def _perform_diagnostic_analysis(
        self,
        alert_text: str,
        candidate_sops: List[Dict[str, Any]],
        entities: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        semantic = [s for s in candidate_sops if s.get("search_type") == "semantic"]
        keyword = [s for s in candidate_sops if s.get("search_type") == "keyword"]

        def _fmt_sops(sops: List[Dict[str, Any]], label: str) -> str:
            if not sops:
                return ""
            lines = [f"\n=== {label} ==="]
            for i, s in enumerate(sops, 1):
                lines += [
                    f"\n[{i}] {s['metadata'].get('title', 'Unknown')} "
                    f"(score={s.get('relevance_score', 0):.3f})",
                    s["document"][:600],
                ]
            return "\n".join(lines)

        sop_context = _fmt_sops(semantic, "SEMANTIC MATCHES") + _fmt_sops(keyword, "KEYWORD MATCHES")
        entities_str = ", ".join(entities) if entities else "none identified"

        prompt = f"""You are an expert systems analyst for a port operations platform.

Alert: {alert_text}
Key entities: {entities_str}

{sop_context}

Return ONLY a JSON object:
{{
  "problem_statement": "...",
  "reasoning": "...",
  "best_sop_id": "...",
  "resolution_summary": "...",
  "confidence_score": 0.0
}}

Confidence: 0.9+ if both search types agree; 0.7-0.9 strong one-sided match; below 0.5 → manual review."""

        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            return _parse_llm_json(response.content)
        except Exception:
            logger.warning("[diagnostic] LLM analysis failed — using fallback", exc_info=True)
            return self._fallback_diagnostic(alert_text)

    # ------------------------------------------------------------------
    # Historical pattern analysis
    # ------------------------------------------------------------------

    def _analyze_historical_patterns(
        self, problem_statement: str, entities: List[str]
    ) -> Dict[str, Any]:
        try:
            mask = self.historical_data["Problem Statement"].str.contains(
                problem_statement[:50], case=False, na=False
            )
            filtered = self.historical_data[mask]
            if filtered.empty:
                return self._fallback_predictive(problem_statement)

            avg_time = filtered.get("Resolution Time", pd.Series(dtype=float)).mean()
            patterns = filtered["Problem Statement"].value_counts().head(3).index.tolist()
            return {
                "predictive_insight": (
                    f"Based on {len(filtered)} similar cases, "
                    f"expected resolution ~{avg_time:.1f} h"
                ),
                "patterns": patterns,
                "risk_level": "high" if len(filtered) > 5 else "medium",
            }
        except Exception:
            logger.warning("[predictive] historical analysis failed", exc_info=True)
            return self._fallback_predictive(problem_statement)

    # ------------------------------------------------------------------
    # Escalation helpers
    # ------------------------------------------------------------------

    _CONTACTS: Dict[str, Dict[str, Any]] = {
        "CNTR": {
            "primary_contact": {"name": "Container Support", "email": "container@company.com"},
            "escalation_contact": {"name": "Container Manager", "email": "container-mgr@company.com"},
        },
        "VSL": {
            "primary_contact": {"name": "Vessel Support", "email": "vessel@company.com"},
            "escalation_contact": {"name": "Vessel Manager", "email": "vessel-mgr@company.com"},
        },
        "EDI/API": {
            "primary_contact": {"name": "EDI Support", "email": "edi@company.com"},
            "escalation_contact": {"name": "EDI Manager", "email": "edi-mgr@company.com"},
        },
    }

    def _get_escalation_contact(self, module: str) -> Dict[str, Any]:
        return self._CONTACTS.get(module, self._CONTACTS["CNTR"])

    def _generate_escalation_email(self, state: PSAState) -> Dict[str, str]:
        contact = state["escalation_contact"]["escalation_contact"]
        return {
            "to": contact["email"],
            "subject": f"URGENT: {state['severity'].upper()} Alert — {state['module']}",
            "body": (
                f"Alert: {state['alert_text']}\n\n"
                f"Severity: {state['severity']} | Module: {state['module']}\n"
                f"Problem: {state['problem_statement']}\n"
                f"Root cause: {state['root_cause']}\n\n"
                f"Recommended SOP: {state['best_sop']}\n"
                f"Resolution: {state['resolution_summary']}\n\n"
                f"Predicted impact: {state['predicted_impact']}"
            ),
        }

    def _generate_final_recommendation(self, state: PSAState) -> str:
        next_step = (
            "Escalation notification sent."
            if state.get("auto_escalate")
            else "Awaiting human review."
        )
        return (
            f"Severity: {state['severity']} | Confidence: {state['confidence_score']:.0%}\n"
            f"Recommended SOP: {state['best_sop']}\n"
            f"Resolution: {state['resolution_summary']}\n"
            f"Next step: {next_step}"
        )

    # ------------------------------------------------------------------
    # Fallback methods (no LLM / no data)
    # ------------------------------------------------------------------

    @staticmethod
    def _fallback_triage(alert_text: str) -> Dict[str, Any]:
        text_lower = alert_text.lower()
        severity = "high" if any(w in text_lower for w in ("critical", "fail", "error", "down")) else "medium"
        return {
            "module": "CNTR",
            "entities": [],
            "alert_type": "error",
            "severity": severity,
            "urgency": "medium",
        }

    @staticmethod
    def _fallback_diagnostic(_alert_text: str) -> Dict[str, Any]:
        return {
            "problem_statement": "Alert requires manual analysis",
            "reasoning": "Automated analysis unavailable",
            "best_sop_id": "Manual Review Required",
            "resolution_summary": "Escalate to human analyst",
            "confidence_score": 0.3,
        }

    @staticmethod
    def _fallback_predictive(_problem: str) -> Dict[str, Any]:
        return {
            "predictive_insight": "Historical analysis unavailable",
            "patterns": [],
            "risk_level": "medium",
        }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def process_alert(
        self, alert_text: str, case_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Run the full LangGraph pipeline for a single alert and return the final state."""
        if not case_id:
            case_id = f"PSA-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

        initial: PSAState = {
            "alert_text": alert_text,
            "case_id": case_id,
            "timestamp": datetime.now().isoformat(),
            "triage_result": None,
            "severity": "",
            "urgency": "",
            "module": "",
            "entities": [],
            "diagnostic_result": None,
            "problem_statement": "",
            "root_cause": "",
            "confidence_score": 0.0,
            "best_sop": "",
            "resolution_summary": "",
            "predictive_result": None,
            "predicted_impact": "",
            "historical_patterns": [],
            "risk_assessment": "",
            "needs_human_review": False,
            "auto_escalate": False,
            "human_approved": False,
            "execution_path": [],
            "escalation_contact": {},
            "email_content": {},
            "final_recommendation": "",
            "status": "processing",
            "error_message": None,
        }

        try:
            final = await self.graph.ainvoke(initial)
            return dict(final)
        except Exception:
            logger.exception("Workflow execution failed for case %s", case_id)
            return {"status": "error", "case_id": case_id, "error_message": "Workflow failed"}


# ---------------------------------------------------------------------------
# Module-level singleton — initialised once on first import
# ---------------------------------------------------------------------------
workflow = PSALangGraphWorkflow()
