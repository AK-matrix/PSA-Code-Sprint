"""
SQLite persistence layer for PSA incidents, SOP performance, and system metrics.

All methods are synchronous and safe to call from multiple threads (each call
opens its own connection).
"""

from __future__ import annotations

import json
import logging
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from typing import Any, Dict, Generator, List, Optional

logger = logging.getLogger(__name__)


class IncidentDatabase:
    """Persistence layer for incident data, SOP performance, and system metrics."""

    def __init__(self, db_path: str = "psa_incidents.db") -> None:
        self.db_path = db_path
        self._init_schema()

    # ------------------------------------------------------------------
    # Connection management
    # ------------------------------------------------------------------

    @contextmanager
    def _connect(self) -> Generator[sqlite3.Connection, None, None]:
        """Yield a thread-local connection that commits on success and rolls back on error."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    # ------------------------------------------------------------------
    # Schema initialisation
    # ------------------------------------------------------------------

    def _init_schema(self) -> None:
        with self._connect() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS incidents (
                    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
                    case_id                 TEXT    UNIQUE NOT NULL,
                    alert_text              TEXT    NOT NULL,
                    source                  TEXT    DEFAULT 'manual',
                    module                  TEXT,
                    entities                TEXT,
                    alert_type              TEXT,
                    severity                TEXT,
                    urgency                 TEXT,
                    best_sop_id             TEXT,
                    sop_title               TEXT,
                    problem_statement       TEXT,
                    resolution_summary      TEXT,
                    reasoning               TEXT,
                    confidence_score        REAL    DEFAULT 0.0,
                    candidate_sops          TEXT,
                    status                  TEXT    DEFAULT 'open',
                    assigned_to             TEXT,
                    escalated_to            TEXT,
                    escalation_sent         BOOLEAN DEFAULT 0,
                    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    resolved_at             TIMESTAMP,
                    resolution_time_minutes INTEGER,
                    was_resolved            BOOLEAN,
                    was_sop_helpful         BOOLEAN,
                    feedback_text           TEXT,
                    feedback_rating         INTEGER,
                    similar_cases           TEXT,
                    tags                    TEXT
                );

                CREATE TABLE IF NOT EXISTS sop_performance (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    sop_id          TEXT    UNIQUE NOT NULL,
                    module          TEXT,
                    times_suggested INTEGER DEFAULT 0,
                    times_helpful   INTEGER DEFAULT 0,
                    times_used      INTEGER DEFAULT 0,
                    avg_resolution_time REAL DEFAULT 0.0,
                    success_rate    REAL    DEFAULT 0.0,
                    last_used       TIMESTAMP,
                    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS system_metrics (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    metric_date     DATE    DEFAULT CURRENT_DATE,
                    total_cases     INTEGER DEFAULT 0,
                    resolved_cases  INTEGER DEFAULT 0,
                    avg_resolution_time REAL DEFAULT 0.0,
                    cntr_cases      INTEGER DEFAULT 0,
                    vsl_cases       INTEGER DEFAULT 0,
                    edi_api_cases   INTEGER DEFAULT 0,
                    infra_sre_cases INTEGER DEFAULT 0,
                    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
        logger.debug("Database schema ready at %s", self.db_path)

    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------

    def generate_case_id(self) -> str:
        return f"PSA-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

    def store_incident(
        self,
        alert_text: str,
        parsed_entities: Dict[str, Any],
        analysis: Dict[str, Any],
        candidate_sops: Optional[List[Any]] = None,
    ) -> str:
        case_id = self.generate_case_id()
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO incidents (
                    case_id, alert_text, module, entities, alert_type,
                    severity, urgency, best_sop_id, problem_statement,
                    resolution_summary, reasoning, candidate_sops, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
                """,
                (
                    case_id,
                    alert_text,
                    parsed_entities.get("module"),
                    json.dumps(parsed_entities.get("entities", [])),
                    parsed_entities.get("alert_type"),
                    parsed_entities.get("severity"),
                    parsed_entities.get("urgency"),
                    analysis.get("best_sop_id"),
                    analysis.get("problem_statement"),
                    analysis.get("resolution_summary"),
                    analysis.get("reasoning"),
                    json.dumps(candidate_sops) if candidate_sops else None,
                ),
            )
            if sop_id := analysis.get("best_sop_id"):
                self._upsert_sop_performance(conn, sop_id, parsed_entities.get("module"))
        logger.info("Stored incident %s", case_id)
        return case_id

    def _upsert_sop_performance(
        self, conn: sqlite3.Connection, sop_id: str, module: Optional[str]
    ) -> None:
        conn.execute(
            """
            INSERT INTO sop_performance (sop_id, module, times_suggested, last_used)
            VALUES (?, ?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(sop_id) DO UPDATE SET
                times_suggested = times_suggested + 1,
                last_used = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            """,
            (sop_id, module),
        )

    def update_incident_status(self, case_id: str, status: str) -> bool:
        with self._connect() as conn:
            conn.execute(
                "UPDATE incidents SET status = ? WHERE case_id = ?", (status, case_id)
            )
            if status == "resolved":
                conn.execute(
                    """
                    UPDATE incidents
                    SET resolved_at = CURRENT_TIMESTAMP,
                        resolution_time_minutes =
                            CAST((julianday(CURRENT_TIMESTAMP) - julianday(created_at)) * 24 * 60 AS INTEGER)
                    WHERE case_id = ?
                    """,
                    (case_id,),
                )
        return True

    def submit_feedback(
        self,
        case_id: str,
        was_resolved: bool,
        was_helpful: bool,
        rating: Optional[int] = None,
        feedback_text: Optional[str] = None,
    ) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE incidents
                SET was_resolved = ?, was_sop_helpful = ?, feedback_rating = ?,
                    feedback_text = ?, status = 'closed'
                WHERE case_id = ?
                """,
                (was_resolved, was_helpful, rating, feedback_text, case_id),
            )
            if was_helpful is not None:
                row = conn.execute(
                    "SELECT best_sop_id FROM incidents WHERE case_id = ?", (case_id,)
                ).fetchone()
                if row and row["best_sop_id"]:
                    conn.execute(
                        """
                        UPDATE sop_performance
                        SET times_helpful = times_helpful + ?,
                            times_used = times_used + 1,
                            success_rate = CAST(times_helpful AS REAL) / CAST(times_used AS REAL),
                            updated_at = CURRENT_TIMESTAMP
                        WHERE sop_id = ?
                        """,
                        (1 if was_helpful else 0, row["best_sop_id"]),
                    )

    def delete_incident(self, case_id: str) -> bool:
        with self._connect() as conn:
            result = conn.execute(
                "DELETE FROM incidents WHERE case_id = ?", (case_id,)
            )
        return result.rowcount > 0

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    def get_incident_by_id(self, case_id: str) -> Optional[Dict[str, Any]]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM incidents WHERE case_id = ?", (case_id,)
            ).fetchone()
        return self._deserialise(dict(row)) if row else None

    def get_all_incidents(
        self,
        limit: int = 100,
        offset: int = 0,
        module: Optional[str] = None,
        severity: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        query = "SELECT * FROM incidents WHERE 1=1"
        params: list = []
        if module:
            query += " AND module = ?"
            params.append(module)
        if severity:
            query += " AND severity = ?"
            params.append(severity)
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params += [limit, offset]

        with self._connect() as conn:
            rows = conn.execute(query, params).fetchall()
        return [self._deserialise(dict(r)) for r in rows]

    def find_similar_incidents(
        self, alert_text: str, module: str, limit: int = 5
    ) -> List[Dict[str, Any]]:
        keywords = [w.lower() for w in alert_text.split() if len(w) > 3 and w.isalnum()][:10]
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT * FROM incidents
                WHERE module = ? AND status = 'resolved'
                ORDER BY created_at DESC LIMIT 50
                """,
                (module,),
            ).fetchall()

        candidates = []
        for row in rows:
            incident = self._deserialise(dict(row))
            score = sum(1 for kw in keywords if kw in incident["alert_text"].lower())
            if score > 0:
                incident["similarity_score"] = score / max(len(keywords), 1)
                candidates.append(incident)
        candidates.sort(key=lambda x: x["similarity_score"], reverse=True)
        return candidates[:limit]

    def search_incidents(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        term = f"%{query}%"
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT * FROM incidents
                WHERE alert_text LIKE ? OR problem_statement LIKE ? OR best_sop_id LIKE ?
                ORDER BY created_at DESC LIMIT ?
                """,
                (term, term, term, limit),
            ).fetchall()
        return [self._deserialise(dict(r)) for r in rows]

    def get_analytics(self) -> Dict[str, Any]:
        with self._connect() as conn:
            total = conn.execute("SELECT COUNT(*) FROM incidents").fetchone()[0]
            status_counts = dict(
                conn.execute("SELECT status, COUNT(*) FROM incidents GROUP BY status").fetchall()
            )
            avg_time = (
                conn.execute(
                    "SELECT AVG(resolution_time_minutes) FROM incidents WHERE resolution_time_minutes IS NOT NULL"
                ).fetchone()[0]
                or 0.0
            )
            module_counts = dict(
                conn.execute("SELECT module, COUNT(*) FROM incidents GROUP BY module").fetchall()
            )
            severity_counts = dict(
                conn.execute(
                    "SELECT severity, COUNT(*) FROM incidents GROUP BY severity"
                ).fetchall()
            )
            top_sops = [
                {"sop_id": r[0], "success_rate": r[1], "times_used": r[2]}
                for r in conn.execute(
                    """
                    SELECT sop_id, success_rate, times_used
                    FROM sop_performance WHERE times_used > 0
                    ORDER BY success_rate DESC, times_used DESC LIMIT 5
                    """
                ).fetchall()
            ]
            recent_trends = [
                {"date": r[0], "count": r[1]}
                for r in conn.execute(
                    """
                    SELECT DATE(created_at) as date, COUNT(*) as count
                    FROM incidents
                    WHERE created_at >= datetime('now', '-7 days')
                    GROUP BY DATE(created_at)
                    ORDER BY date DESC
                    """
                ).fetchall()
            ]

        open_count = status_counts.get("open", 0)
        resolved_count = status_counts.get("resolved", 0) + status_counts.get("closed", 0)
        return {
            "total_incidents": total,
            "open_incidents": open_count,
            "resolved_incidents": resolved_count,
            "avg_resolution_time": round(avg_time, 2),
            "module_distribution": module_counts,
            "severity_distribution": severity_counts,
            "status_distribution": status_counts,
            "top_performing_sops": top_sops,
            "recent_trends": recent_trends,
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _deserialise(incident: Dict[str, Any]) -> Dict[str, Any]:
        for field in ("entities", "candidate_sops"):
            if incident.get(field):
                try:
                    incident[field] = json.loads(incident[field])
                except (json.JSONDecodeError, TypeError):
                    pass
        return incident
