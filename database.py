import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional
import os

class IncidentDatabase:
    """Database service for storing and retrieving incident history"""
    
    def __init__(self, db_path="psa_incidents.db"):
        self.db_path = db_path
        self.initialize_database()
    
    def get_connection(self):
        """Create a database connection"""
        return sqlite3.connect(self.db_path)
    
    def initialize_database(self):
        """Initialize database with required tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Main incidents table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS incidents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_id TEXT UNIQUE NOT NULL,
                alert_text TEXT NOT NULL,
                source TEXT DEFAULT 'manual',
                
                -- Triage data
                module TEXT,
                entities TEXT,
                alert_type TEXT,
                severity TEXT,
                urgency TEXT,
                
                -- Analysis data
                best_sop_id TEXT,
                sop_title TEXT,
                problem_statement TEXT,
                resolution_summary TEXT,
                reasoning TEXT,
                confidence_score REAL DEFAULT 0.0,
                
                -- Candidate SOPs
                candidate_sops TEXT,
                
                -- Resolution tracking
                status TEXT DEFAULT 'open',
                assigned_to TEXT,
                escalated_to TEXT,
                escalation_sent BOOLEAN DEFAULT 0,
                
                -- Timing
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP,
                resolution_time_minutes INTEGER,
                
                -- Feedback
                was_resolved BOOLEAN,
                was_sop_helpful BOOLEAN,
                feedback_text TEXT,
                feedback_rating INTEGER,
                
                -- Metadata
                similar_cases TEXT,
                tags TEXT
            )
        ''')
        
        # SOP performance tracking
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sop_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sop_id TEXT UNIQUE NOT NULL,
                module TEXT,
                times_suggested INTEGER DEFAULT 0,
                times_helpful INTEGER DEFAULT 0,
                times_used INTEGER DEFAULT 0,
                avg_resolution_time REAL DEFAULT 0.0,
                success_rate REAL DEFAULT 0.0,
                last_used TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # System metrics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS system_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_date DATE DEFAULT CURRENT_DATE,
                total_cases INTEGER DEFAULT 0,
                resolved_cases INTEGER DEFAULT 0,
                avg_resolution_time REAL DEFAULT 0.0,
                cntr_cases INTEGER DEFAULT 0,
                vsl_cases INTEGER DEFAULT 0,
                edi_api_cases INTEGER DEFAULT 0,
                infra_sre_cases INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        print("Database initialized successfully")
    
    def generate_case_id(self):
        """Generate a unique case ID"""
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        return f"PSA-{timestamp}"
    
    def store_incident(self, alert_text: str, parsed_entities: Dict, 
                      analysis: Dict, candidate_sops: List = None,
                      email_content: Dict = None) -> str:
        """Store a new incident in the database"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        case_id = self.generate_case_id()
        
        # Convert lists and dicts to JSON strings
        entities_json = json.dumps(parsed_entities.get('entities', []))
        candidate_sops_json = json.dumps(candidate_sops) if candidate_sops else None
        
        cursor.execute('''
            INSERT INTO incidents (
                case_id, alert_text, module, entities, alert_type, 
                severity, urgency, best_sop_id, problem_statement,
                resolution_summary, reasoning, candidate_sops, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            case_id,
            alert_text,
            parsed_entities.get('module'),
            entities_json,
            parsed_entities.get('alert_type'),
            parsed_entities.get('severity'),
            parsed_entities.get('urgency'),
            analysis.get('best_sop_id'),
            analysis.get('problem_statement'),
            analysis.get('resolution_summary'),
            analysis.get('reasoning'),
            candidate_sops_json,
            'open'
        ))
        
        # Update SOP performance
        sop_id = analysis.get('best_sop_id')
        if sop_id:
            self._update_sop_performance(cursor, sop_id, parsed_entities.get('module'))
        
        conn.commit()
        conn.close()
        
        print(f"Incident stored with case_id: {case_id}")
        return case_id
    
    def _update_sop_performance(self, cursor, sop_id: str, module: str):
        """Update SOP performance metrics"""
        cursor.execute('''
            INSERT INTO sop_performance (sop_id, module, times_suggested, last_used)
            VALUES (?, ?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(sop_id) DO UPDATE SET
                times_suggested = times_suggested + 1,
                last_used = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
        ''', (sop_id, module))
    
    def get_incident_by_id(self, case_id: str) -> Optional[Dict]:
        """Retrieve a specific incident by case ID"""
        conn = self.get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM incidents WHERE case_id = ?', (case_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            incident = dict(row)
            # Parse JSON fields
            if incident['entities']:
                incident['entities'] = json.loads(incident['entities'])
            if incident['candidate_sops']:
                incident['candidate_sops'] = json.loads(incident['candidate_sops'])
            return incident
        return None
    
    def get_all_incidents(self, limit: int = 100, offset: int = 0, 
                         module: str = None, severity: str = None) -> List[Dict]:
        """Retrieve all incidents with optional filters"""
        conn = self.get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = 'SELECT * FROM incidents WHERE 1=1'
        params = []
        
        if module:
            query += ' AND module = ?'
            params.append(module)
        
        if severity:
            query += ' AND severity = ?'
            params.append(severity)
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        incidents = []
        for row in rows:
            incident = dict(row)
            # Parse JSON fields
            if incident['entities']:
                incident['entities'] = json.loads(incident['entities'])
            if incident['candidate_sops']:
                incident['candidate_sops'] = json.loads(incident['candidate_sops'])
            incidents.append(incident)
        
        return incidents
    
    def find_similar_incidents(self, alert_text: str, module: str, 
                               limit: int = 5) -> List[Dict]:
        """Find similar past incidents based on module and keywords"""
        conn = self.get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Extract keywords from alert text (simple approach)
        keywords = [word.lower() for word in alert_text.split() 
                   if len(word) > 3 and word.isalnum()][:10]
        
        # Find incidents from the same module
        cursor.execute('''
            SELECT * FROM incidents 
            WHERE module = ? 
            AND status = 'resolved'
            ORDER BY created_at DESC 
            LIMIT 50
        ''', (module,))
        
        rows = cursor.fetchall()
        conn.close()
        
        # Simple similarity scoring based on keyword matches
        similar_incidents = []
        for row in rows:
            incident = dict(row)
            similarity_score = 0
            incident_text = incident['alert_text'].lower()
            
            for keyword in keywords:
                if keyword in incident_text:
                    similarity_score += 1
            
            if similarity_score > 0:
                incident['similarity_score'] = similarity_score / len(keywords)
                if incident['entities']:
                    incident['entities'] = json.loads(incident['entities'])
                similar_incidents.append(incident)
        
        # Sort by similarity and return top results
        similar_incidents.sort(key=lambda x: x['similarity_score'], reverse=True)
        return similar_incidents[:limit]
    
    def update_incident_status(self, case_id: str, status: str):
        """Update incident status"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE incidents 
            SET status = ?
            WHERE case_id = ?
        ''', (status, case_id))
        
        if status == 'resolved':
            cursor.execute('''
                UPDATE incidents 
                SET resolved_at = CURRENT_TIMESTAMP,
                    resolution_time_minutes = 
                        (julianday(CURRENT_TIMESTAMP) - julianday(created_at)) * 24 * 60
                WHERE case_id = ?
            ''', (case_id,))
        
        conn.commit()
        conn.close()
    
    def submit_feedback(self, case_id: str, was_resolved: bool, 
                       was_helpful: bool, rating: int = None, 
                       feedback_text: str = None):
        """Submit feedback for an incident"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE incidents 
            SET was_resolved = ?,
                was_sop_helpful = ?,
                feedback_rating = ?,
                feedback_text = ?,
                status = 'closed'
            WHERE case_id = ?
        ''', (was_resolved, was_helpful, rating, feedback_text, case_id))
        
        # Update SOP performance if feedback provided
        if was_helpful is not None:
            cursor.execute('SELECT best_sop_id FROM incidents WHERE case_id = ?', (case_id,))
            result = cursor.fetchone()
            if result and result[0]:
                sop_id = result[0]
                cursor.execute('''
                    UPDATE sop_performance 
                    SET times_helpful = times_helpful + ?,
                        times_used = times_used + 1,
                        success_rate = CAST(times_helpful AS REAL) / CAST(times_used AS REAL),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE sop_id = ?
                ''', (1 if was_helpful else 0, sop_id))
        
        conn.commit()
        conn.close()
    
    def get_analytics(self) -> Dict:
        """Get system analytics and metrics"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Total cases
        cursor.execute('SELECT COUNT(*) FROM incidents')
        total_cases = cursor.fetchone()[0]
        
        # Cases by status
        cursor.execute('''
            SELECT status, COUNT(*) 
            FROM incidents 
            GROUP BY status
        ''')
        status_counts = dict(cursor.fetchall())
        
        # Average resolution time
        cursor.execute('''
            SELECT AVG(resolution_time_minutes) 
            FROM incidents 
            WHERE resolution_time_minutes IS NOT NULL
        ''')
        avg_resolution_time = cursor.fetchone()[0] or 0
        
        # Cases by module
        cursor.execute('''
            SELECT module, COUNT(*) 
            FROM incidents 
            GROUP BY module
        ''')
        module_counts = dict(cursor.fetchall())
        
        # Cases by severity
        cursor.execute('''
            SELECT severity, COUNT(*) 
            FROM incidents 
            GROUP BY severity
        ''')
        severity_counts = dict(cursor.fetchall())
        
        # Top performing SOPs
        cursor.execute('''
            SELECT sop_id, success_rate, times_used
            FROM sop_performance 
            WHERE times_used > 0
            ORDER BY success_rate DESC, times_used DESC 
            LIMIT 5
        ''')
        top_sops = [
            {'sop_id': row[0], 'success_rate': row[1], 'times_used': row[2]}
            for row in cursor.fetchall()
        ]
        
        # Recent trends (last 7 days)
        cursor.execute('''
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM incidents 
            WHERE created_at >= datetime('now', '-7 days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        ''')
        recent_trends = [
            {'date': row[0], 'count': row[1]}
            for row in cursor.fetchall()
        ]
        
        conn.close()
        
        return {
            'total_cases': total_cases,
            'status_counts': status_counts,
            'avg_resolution_time_minutes': round(avg_resolution_time, 2),
            'module_distribution': module_counts,
            'severity_distribution': severity_counts,
            'top_performing_sops': top_sops,
            'recent_trends': recent_trends
        }
    
    def search_incidents(self, query: str, limit: int = 20) -> List[Dict]:
        """Search incidents by text"""
        conn = self.get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        search_term = f'%{query}%'
        cursor.execute('''
            SELECT * FROM incidents 
            WHERE alert_text LIKE ? 
               OR problem_statement LIKE ?
               OR best_sop_id LIKE ?
            ORDER BY created_at DESC
            LIMIT ?
        ''', (search_term, search_term, search_term, limit))
        
        rows = cursor.fetchall()
        conn.close()
        
        incidents = []
        for row in rows:
            incident = dict(row)
            if incident['entities']:
                incident['entities'] = json.loads(incident['entities'])
            incidents.append(incident)
        
        return incidents
    
    def delete_incident(self, case_id: str) -> bool:
        """Delete an incident (use with caution)"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM incidents WHERE case_id = ?', (case_id,))
        deleted = cursor.rowcount > 0
        
        conn.commit()
        conn.close()
        
        return deleted

# Initialize global database instance
db = IncidentDatabase()

