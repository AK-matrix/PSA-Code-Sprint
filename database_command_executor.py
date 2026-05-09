"""
Database Command Executor for Auto-Resolution Agent

This module provides safe execution of database commands for auto-resolution.
It includes validation, rollback capabilities, and audit logging.
"""

import json
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import sqlite3
try:
    import pymysql
except ImportError:
    pymysql = None
from sql_connector import SQLConnector

class DatabaseCommandExecutor:
    """Executes database commands safely with validation and rollback"""
    
    def __init__(self, sql_connector: SQLConnector = None):
        self.sql_connector = sql_connector
        self.audit_log = []
        
        # Command templates for different operations (SQLite compatible)
        self.command_templates = {
            "merge_duplicate_containers": {
                "check": "SELECT cntr_no, status, bay_slot, terminal FROM container WHERE cntr_no = ?",
                "merge": """
                    UPDATE container 
                    SET status = 'MERGED', 
                        duplicate_flag = 1, 
                        merged_at = datetime('now'),
                        merge_reason = 'AUTO_RESOLUTION_DUPLICATE'
                    WHERE cntr_no = ? AND status = 'ACTIVE'
                """,
                "cleanup": "DELETE FROM container_duplicate WHERE cntr_no = ?",
                "audit": """
                    INSERT INTO container_audit (cntr_no, action, timestamp, details, bay_slot, terminal) 
                    VALUES (?, 'AUTO_MERGE_DUPLICATE', datetime('now'), ?, ?, ?)
                """
            },
            "correct_vessel_name": {
                "check": "SELECT vessel_name, system_vessel_name FROM vessel_advice WHERE vessel_name LIKE ?",
                "correct": "UPDATE vessel_advice SET system_vessel_name = ?, corrected_at = datetime('now') WHERE vessel_advice_no = ?",
                "audit": "INSERT INTO vessel_name_correction (vessel_name, corrected_name, timestamp, reason) VALUES (?, ?, datetime('now'), 'AUTO_CORRECTION')"
            },
            "retry_edi_message": {
                "check": "SELECT message_ref, status, retry_count FROM edi_message WHERE message_ref = ? AND status = 'ERROR'",
                "retry": "UPDATE edi_message SET status = 'RETRY', retry_count = retry_count + 1, last_retry = datetime('now') WHERE message_ref = ?",
                "queue": "INSERT INTO edi_retry_queue (message_ref, retry_at, priority) VALUES (?, datetime('now', '+5 minutes'), 'HIGH')",
                "audit": "INSERT INTO edi_audit (message_ref, action, timestamp, details) VALUES (?, 'AUTO_RETRY', datetime('now'), ?)"
            },
            "validate_booking": {
                "check": "SELECT cntr_no, status, validation_passed FROM container_booking WHERE cntr_no = ?",
                "validate": "UPDATE container_booking SET status = 'CONFIRMED', validated_at = datetime('now') WHERE cntr_no = ? AND validation_passed = 1",
                "audit": "INSERT INTO booking_audit (cntr_no, action, timestamp, details) VALUES (?, 'AUTO_CONFIRMED', datetime('now'), ?)"
            }
        }
    
    def execute_resolution_commands(self, strategy: str, entities: List[str], 
                                  context: Dict) -> Dict:
        """
        Execute database commands for a specific resolution strategy
        
        Args:
            strategy: The resolution strategy to execute
            entities: List of entities (container numbers, vessel names, etc.)
            context: Additional context data
            
        Returns:
            Dict with execution results
        """
        print(f"Executing resolution strategy: {strategy}")
        
        if strategy not in self.command_templates:
            return {
                "success": False,
                "error": f"Unknown strategy: {strategy}",
                "commands_executed": []
            }
        
        commands = self.command_templates[strategy]
        executed_commands = []
        
        try:
            # Step 1: Check current state
            check_result = self._execute_check_command(commands["check"], entities, context)
            executed_commands.append(check_result)
            
            if not check_result["success"]:
                return {
                    "success": False,
                    "error": "Check command failed",
                    "commands_executed": executed_commands
                }
            
            # Step 2: Execute main resolution command
            if "merge" in commands:
                main_result = self._execute_main_command(commands["merge"], entities, context)
            elif "correct" in commands:
                main_result = self._execute_main_command(commands["correct"], entities, context)
            elif "retry" in commands:
                main_result = self._execute_main_command(commands["retry"], entities, context)
            elif "validate" in commands:
                main_result = self._execute_main_command(commands["validate"], entities, context)
            else:
                main_result = {"success": False, "error": "No main command found"}
            
            executed_commands.append(main_result)
            
            if not main_result["success"]:
                return {
                    "success": False,
                    "error": "Main command failed",
                    "commands_executed": executed_commands
                }
            
            # Step 3: Execute cleanup commands if they exist
            if "cleanup" in commands:
                cleanup_result = self._execute_cleanup_command(commands["cleanup"], entities, context)
                executed_commands.append(cleanup_result)
            
            # Step 4: Execute audit command
            if "audit" in commands:
                audit_result = self._execute_audit_command(commands["audit"], entities, context, main_result)
                executed_commands.append(audit_result)
            
            # Step 5: Execute additional commands if they exist
            if "queue" in commands:
                queue_result = self._execute_queue_command(commands["queue"], entities, context)
                executed_commands.append(queue_result)
            
            success = all(cmd["success"] for cmd in executed_commands)
            
            return {
                "success": success,
                "commands_executed": executed_commands,
                "strategy": strategy,
                "entities_processed": entities,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "commands_executed": executed_commands
            }
    
    def _execute_check_command(self, command: str, entities: List[str], context: Dict) -> Dict:
        """Execute a check command to verify current state"""
        try:
            if not self.sql_connector or not self.sql_connector.connection:
                # Simulate check command
                return {
                    "command": command,
                    "success": True,
                    "result": f"Simulated check for entities: {entities}",
                    "rows_affected": len(entities),
                    "timestamp": datetime.now().isoformat()
                }
            
            # Execute real check command
            cursor = self.sql_connector.cursor
            
            for entity in entities:
                cursor.execute(command, (entity,))
                result = cursor.fetchall()
                
                if not result:
                    return {
                        "command": command,
                        "success": False,
                        "error": f"No records found for entity: {entity}",
                        "timestamp": datetime.now().isoformat()
                    }
            
            return {
                "command": command,
                "success": True,
                "result": f"Check completed for {len(entities)} entities",
                "rows_affected": len(entities),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "command": command,
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def _execute_main_command(self, command: str, entities: List[str], context: Dict) -> Dict:
        """Execute the main resolution command"""
        try:
            if not self.sql_connector or not self.sql_connector.connection:
                # Simulate main command
                return {
                    "command": command,
                    "success": True,
                    "result": f"Simulated main command for entities: {entities}",
                    "rows_affected": len(entities),
                    "timestamp": datetime.now().isoformat()
                }
            
            # Execute real main command
            cursor = self.sql_connector.cursor
            total_affected = 0
            
            for entity in entities:
                if "UPDATE" in command.upper():
                    cursor.execute(command, (entity,))
                    total_affected += cursor.rowcount
                elif "INSERT" in command.upper():
                    # For insert commands, we might need additional parameters
                    cursor.execute(command, (entity, context.get("details", "")))
                    total_affected += cursor.rowcount
            
            # Commit the transaction
            self.sql_connector.connection.commit()
            
            return {
                "command": command,
                "success": True,
                "result": f"Main command executed successfully",
                "rows_affected": total_affected,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            # Rollback on error
            if self.sql_connector and self.sql_connector.connection:
                self.sql_connector.connection.rollback()
            
            return {
                "command": command,
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def _execute_cleanup_command(self, command: str, entities: List[str], context: Dict) -> Dict:
        """Execute cleanup commands"""
        try:
            if not self.sql_connector or not self.sql_connector.connection:
                return {
                    "command": command,
                    "success": True,
                    "result": f"Simulated cleanup for entities: {entities}",
                    "timestamp": datetime.now().isoformat()
                }
            
            cursor = self.sql_connector.cursor
            total_affected = 0
            
            for entity in entities:
                cursor.execute(command, (entity,))
                total_affected += cursor.rowcount
            
            self.sql_connector.connection.commit()
            
            return {
                "command": command,
                "success": True,
                "result": f"Cleanup completed",
                "rows_affected": total_affected,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "command": command,
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def _execute_audit_command(self, command: str, entities: List[str], 
                             context: Dict, main_result: Dict) -> Dict:
        """Execute audit logging commands"""
        try:
            if not self.sql_connector or not self.sql_connector.connection:
                return {
                    "command": command,
                    "success": True,
                    "result": f"Simulated audit log for entities: {entities}",
                    "timestamp": datetime.now().isoformat()
                }
            
            cursor = self.sql_connector.cursor
            
            for entity in entities:
                audit_details = json.dumps({
                    "auto_resolution": True,
                    "main_command_result": main_result.get("result", ""),
                    "context": context
                })
                
                cursor.execute(command, (entity, audit_details))
            
            self.sql_connector.connection.commit()
            
            return {
                "command": command,
                "success": True,
                "result": f"Audit log created",
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "command": command,
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def _execute_queue_command(self, command: str, entities: List[str], context: Dict) -> Dict:
        """Execute queue commands for retry operations"""
        try:
            if not self.sql_connector or not self.sql_connector.connection:
                return {
                    "command": command,
                    "success": True,
                    "result": f"Simulated queue command for entities: {entities}",
                    "timestamp": datetime.now().isoformat()
                }
            
            cursor = self.sql_connector.cursor
            
            for entity in entities:
                cursor.execute(command, (entity,))
            
            self.sql_connector.connection.commit()
            
            return {
                "command": command,
                "success": True,
                "result": f"Queue command executed",
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "command": command,
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def get_audit_log(self) -> List[Dict]:
        """Get the audit log of executed commands"""
        return self.audit_log
    
    def clear_audit_log(self):
        """Clear the audit log"""
        self.audit_log = []

# Factory function
def create_database_command_executor(sql_connector: SQLConnector = None):
    """Create a database command executor instance"""
    return DatabaseCommandExecutor(sql_connector)
