import mysql.connector
import json
import os
from typing import Dict, List, Any, Optional

class SQLConnector:
    """
    SQL Database connector for extracting relevant data based on alert entities.
    Maps alert entities to database fields and extracts relevant records.
    """
    
    def __init__(self):
        self.connection = None
        self.cursor = None
        
    def connect(self):
        """Connect to MySQL database"""
        try:
            # Database connection parameters
            config = {
                'host': 'localhost',
                'user': 'root',
                'password': '',  # Add password if needed
                'database': 'appdb',
                'charset': 'utf8mb4'
            }
            
            self.connection = mysql.connector.connect(**config)
            self.cursor = self.connection.cursor(dictionary=True)
            print("Successfully connected to MySQL database")
            return True
            
        except mysql.connector.Error as e:
            print(f"Error connecting to MySQL: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        print("Database connection closed")
    
    def extract_relevant_data(self, parsed_entities: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract relevant data from SQL database based on parsed alert entities.
        Returns structured data for LLM analysis.
        """
        if not self.connection:
            print("No database connection available")
            return {}
        
        extracted_data = {
            "vessel_data": [],
            "container_data": [],
            "edi_data": [],
            "api_events": [],
            "vessel_advice": []
        }
        
        try:
            # Extract entities from parsed alert
            entities = parsed_entities.get('entities', [])
            module = parsed_entities.get('module', 'Unknown')
            
            print(f"Extracting data for module: {module}")
            print(f"Entities to search: {entities}")
            
            # 1. VESSEL DATA EXTRACTION
            vessel_data = self._extract_vessel_data(entities, module)
            extracted_data["vessel_data"] = vessel_data
            
            # 2. CONTAINER DATA EXTRACTION
            container_data = self._extract_container_data(entities, module)
            extracted_data["container_data"] = container_data
            
            # 3. EDI MESSAGE DATA EXTRACTION
            edi_data = self._extract_edi_data(entities, module)
            extracted_data["edi_data"] = edi_data
            
            # 4. API EVENTS EXTRACTION
            api_events = self._extract_api_events(entities, module)
            extracted_data["api_events"] = api_events
            
            # 5. VESSEL ADVICE EXTRACTION
            vessel_advice = self._extract_vessel_advice(entities, module)
            extracted_data["vessel_advice"] = vessel_advice
            
            print(f"Extracted data summary:")
            print(f"- Vessels: {len(vessel_data)}")
            print(f"- Containers: {len(container_data)}")
            print(f"- EDI Messages: {len(edi_data)}")
            print(f"- API Events: {len(api_events)}")
            print(f"- Vessel Advice: {len(vessel_advice)}")
            
            return extracted_data
            
        except Exception as e:
            print(f"Error extracting data: {e}")
            return {}
    
    def _extract_vessel_data(self, entities: List[str], module: str) -> List[Dict]:
        """Extract vessel data based on entities and module"""
        vessel_data = []
        
        try:
            # Search for vessel names in entities
            vessel_entities = [e for e in entities if any(keyword in e.upper() for keyword in ['MV', 'VESSEL', 'SHIP'])]
            
            if vessel_entities or module in ['VSL', 'Vessel']:
                query = """
                SELECT vessel_id, imo_no, vessel_name, call_sign, operator_name, 
                       flag_state, built_year, capacity_teu, loa_m, beam_m, draft_m,
                       last_port, next_port, created_at
                FROM vessel
                """
                
                conditions = []
                params = []
                
                # Add vessel name conditions
                for entity in vessel_entities:
                    if 'MV' in entity.upper():
                        conditions.append("vessel_name LIKE %s")
                        params.append(f"%{entity}%")
                
                # Add IMO number conditions
                imo_entities = [e for e in entities if e.isdigit() and len(e) >= 6]
                for imo in imo_entities:
                    conditions.append("imo_no = %s")
                    params.append(imo)
                
                if conditions:
                    query += " WHERE " + " OR ".join(conditions)
                
                query += " LIMIT 10"
                
                self.cursor.execute(query, params)
                vessel_data = self.cursor.fetchall()
                
        except Exception as e:
            print(f"Error extracting vessel data: {e}")
        
        return vessel_data
    
    def _extract_container_data(self, entities: List[str], module: str) -> List[Dict]:
        """Extract container data based on entities and module"""
        container_data = []
        
        try:
            # Search for container numbers in entities
            container_entities = [e for e in entities if any(keyword in e.upper() for keyword in ['CMAU', 'MSCU', 'MSKU', 'OOLU', 'TEMU', 'TGHU', 'HLCU', 'NYKU', 'EITU', 'MAEU', 'ONEU', 'EMCU'])]
            
            if container_entities or module in ['CNTR', 'Container', 'Container Report', 'Container Booking']:
                query = """
                SELECT c.container_id, c.cntr_no, c.iso_code, c.size_type, c.gross_weight_kg,
                       c.status, c.origin_port, c.tranship_port, c.destination_port,
                       c.hazard_class, c.vessel_id, c.eta_ts, c.etd_ts, c.last_free_day,
                       v.vessel_name, v.imo_no
                FROM container c
                LEFT JOIN vessel v ON v.vessel_id = c.vessel_id
                """
                
                conditions = []
                params = []
                
                # Add container number conditions
                for entity in container_entities:
                    if any(prefix in entity.upper() for prefix in ['CMAU', 'MSCU', 'MSKU', 'OOLU', 'TEMU', 'TGHU', 'HLCU', 'NYKU', 'EITU', 'MAEU', 'ONEU', 'EMCU']):
                        conditions.append("c.cntr_no LIKE %s")
                        params.append(f"%{entity}%")
                
                if conditions:
                    query += " WHERE " + " OR ".join(conditions)
                
                query += " ORDER BY c.created_at DESC LIMIT 15"
                
                self.cursor.execute(query, params)
                container_data = self.cursor.fetchall()
                
        except Exception as e:
            print(f"Error extracting container data: {e}")
        
        return container_data
    
    def _extract_edi_data(self, entities: List[str], module: str) -> List[Dict]:
        """Extract EDI message data based on entities and module"""
        edi_data = []
        
        try:
            if module in ['EDI/API', 'EDI', 'API']:
                query = """
                SELECT e.edi_id, e.container_id, e.vessel_id, e.message_type, e.direction,
                       e.status, e.message_ref, e.sender, e.receiver, e.sent_at, e.ack_at,
                       e.error_text, c.cntr_no, v.vessel_name
                FROM edi_message e
                LEFT JOIN container c ON c.container_id = e.container_id
                LEFT JOIN vessel v ON v.vessel_id = e.vessel_id
                """
                
                conditions = []
                params = []
                
                # Add message reference conditions
                ref_entities = [e for e in entities if 'REF-' in e.upper()]
                for ref in ref_entities:
                    conditions.append("e.message_ref LIKE %s")
                    params.append(f"%{ref}%")
                
                # Add error status conditions
                if any('ERROR' in e.upper() for e in entities):
                    conditions.append("e.status = 'ERROR'")
                
                if conditions:
                    query += " WHERE " + " OR ".join(conditions)
                
                query += " ORDER BY e.sent_at DESC LIMIT 10"
                
                self.cursor.execute(query, params)
                edi_data = self.cursor.fetchall()
                
        except Exception as e:
            print(f"Error extracting EDI data: {e}")
        
        return edi_data
    
    def _extract_api_events(self, entities: List[str], module: str) -> List[Dict]:
        """Extract API events data based on entities and module"""
        api_events = []
        
        try:
            if module in ['EDI/API', 'API', 'Infra/SRE']:
                query = """
                SELECT a.api_id, a.container_id, a.vessel_id, a.event_type, a.source_system,
                       a.http_status, a.correlation_id, a.event_ts, a.payload_json,
                       c.cntr_no, v.vessel_name
                FROM api_event a
                LEFT JOIN container c ON c.container_id = a.container_id
                LEFT JOIN vessel v ON v.vessel_id = a.vessel_id
                """
                
                conditions = []
                params = []
                
                # Add correlation ID conditions
                corr_entities = [e for e in entities if 'corr-' in e.lower()]
                for corr in corr_entities:
                    conditions.append("a.correlation_id LIKE %s")
                    params.append(f"%{corr}%")
                
                # Add HTTP status conditions
                status_entities = [e for e in entities if e.isdigit() and len(e) == 3]
                for status in status_entities:
                    conditions.append("a.http_status = %s")
                    params.append(int(status))
                
                if conditions:
                    query += " WHERE " + " OR ".join(conditions)
                
                query += " ORDER BY a.event_ts DESC LIMIT 10"
                
                self.cursor.execute(query, params)
                api_events = self.cursor.fetchall()
                
        except Exception as e:
            print(f"Error extracting API events: {e}")
        
        return api_events
    
    def _extract_vessel_advice(self, entities: List[str], module: str) -> List[Dict]:
        """Extract vessel advice data based on entities and module"""
        vessel_advice = []
        
        try:
            if module in ['VSL', 'Vessel']:
                query = """
                SELECT va.vessel_advice_no, va.vessel_name, va.system_vessel_name,
                       va.effective_start_datetime, va.effective_end_datetime,
                       ba.application_no, ba.vessel_close_datetime, ba.berthing_status
                FROM vessel_advice va
                LEFT JOIN berth_application ba ON ba.vessel_advice_no = va.vessel_advice_no
                """
                
                conditions = []
                params = []
                
                # Add vessel name conditions
                vessel_entities = [e for e in entities if any(keyword in e.upper() for keyword in ['MV', 'VESSEL', 'SHIP'])]
                for vessel in vessel_entities:
                    if 'MV' in vessel.upper():
                        conditions.append("va.vessel_name LIKE %s")
                        params.append(f"%{vessel}%")
                
                if conditions:
                    query += " WHERE " + " OR ".join(conditions)
                
                query += " ORDER BY va.effective_start_datetime DESC LIMIT 5"
                
                self.cursor.execute(query, params)
                vessel_advice = self.cursor.fetchall()
                
        except Exception as e:
            print(f"Error extracting vessel advice: {e}")
        
        return vessel_advice

def test_sql_connector():
    """Test the SQL connector with sample data"""
    connector = SQLConnector()
    
    if connector.connect():
        # Test with sample parsed entities
        sample_entities = {
            "module": "VSL",
            "entities": ["MV Lion City 07", "VESSEL_ERR_4", "System Vessel Name"],
            "alert_type": "error",
            "severity": "high",
            "urgency": "high"
        }
        
        extracted_data = connector.extract_relevant_data(sample_entities)
        print("\nExtracted data:")
        print(json.dumps(extracted_data, indent=2, default=str))
        
        connector.disconnect()
    else:
        print("Failed to connect to database")

if __name__ == "__main__":
    test_sql_connector()
