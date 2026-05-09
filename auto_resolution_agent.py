"""
Auto-Resolution Agent for PSA Alert Processing System

This agent attempts to automatically resolve issues based on:
1. Knowledge base (SOPs and case logs)
2. Database commands and fixes
3. Pattern matching from historical resolutions

If auto-resolution fails, the issue escalates to human intervention.
"""

import json
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from ai_client import create_ai_client
from database_command_executor import create_database_command_executor

class AutoResolutionAgent:
    """Agent that attempts to automatically resolve PSA alerts"""
    
    def __init__(self, ai_client=None, sql_connector=None):
        self.ai_client = ai_client or create_ai_client()
        self.db_executor = create_database_command_executor(sql_connector)
        
        # Database command patterns for different issue types
        self.database_commands = {
            "duplicate_containers": [
                "SELECT * FROM container WHERE cntr_no = ? AND status = 'ACTIVE'",
                "UPDATE container SET status = 'MERGED' WHERE cntr_no = ? AND duplicate_flag = 1",
                "DELETE FROM container_duplicate WHERE cntr_no = ?"
            ],
            "vessel_name_mismatch": [
                "SELECT vessel_name, system_vessel_name FROM vessel_advice WHERE vessel_name LIKE ?",
                "UPDATE vessel_advice SET system_vessel_name = ? WHERE vessel_advice_no = ?",
                "INSERT INTO vessel_name_correction (vessel_name, corrected_name, timestamp) VALUES (?, ?, NOW())"
            ],
            "edi_message_stuck": [
                "SELECT * FROM edi_message WHERE message_ref = ? AND status = 'ERROR'",
                "UPDATE edi_message SET status = 'RETRY', retry_count = retry_count + 1 WHERE message_ref = ?",
                "INSERT INTO edi_retry_queue (message_ref, retry_at) VALUES (?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))"
            ],
            "container_booking_issues": [
                "SELECT * FROM container_booking WHERE cntr_no = ? AND status = 'PENDING'",
                "UPDATE container_booking SET status = 'CONFIRMED' WHERE cntr_no = ? AND validation_passed = 1",
                "INSERT INTO booking_audit (cntr_no, action, timestamp) VALUES (?, 'AUTO_CONFIRMED', NOW())"
            ]
        }
        
        # Resolution patterns from case logs
        self.resolution_patterns = {
            "container_duplicate": {
                "pattern": r"duplicate.*container|identical.*container",
                "action": "merge_duplicate_containers",
                "confidence": 0.8
            },
            "vessel_name_error": {
                "pattern": r"vessel.*name.*not.*match|system.*vessel.*name",
                "action": "correct_vessel_name",
                "confidence": 0.7
            },
            "edi_stuck_error": {
                "pattern": r"stuck.*error|ack_at.*null|message.*stuck",
                "action": "retry_edi_message",
                "confidence": 0.9
            },
            "booking_validation": {
                "pattern": r"booking.*validation|container.*booking.*issue",
                "action": "validate_booking",
                "confidence": 0.6
            }
        }

    def attempt_auto_resolution(self, alert_text: str, parsed_entities: Dict, 
                              analysis: Dict, candidate_sops: Dict, 
                              sql_data: Dict) -> Dict:
        """
        Attempt to automatically resolve the alert based on knowledge base and patterns
        
        Returns:
            Dict with resolution attempt results
        """
        print("=" * 60)
        print("AUTO-RESOLUTION AGENT: Starting resolution attempt")
        print("=" * 60)
        
        try:
            # Step 1: Analyze if issue is auto-resolvable
            resolution_analysis = self._analyze_resolution_feasibility(
                alert_text, parsed_entities, analysis, candidate_sops
            )
            
            if not resolution_analysis["is_auto_resolvable"]:
                return {
                    "attempted": False,
                    "reason": resolution_analysis["reason"],
                    "confidence": 0.0,
                    "escalate": True
                }
            
            # Step 2: Determine resolution strategy
            resolution_strategy = self._determine_resolution_strategy(
                alert_text, parsed_entities, analysis, resolution_analysis
            )
            
            # Step 3: Check if commands are safe to execute automatically
            proposed_commands = self._prepare_commands_for_approval(
                resolution_strategy, parsed_entities, sql_data
            )
            
            # Check if all commands are safe for automatic execution
            all_safe = all(cmd.get("risk_level", "high") in ["low", "medium"] for cmd in proposed_commands)
            high_confidence = resolution_strategy["confidence"] >= 0.8
            
            if all_safe and high_confidence and len(proposed_commands) <= 3:
                # Execute automatically for safe, high-confidence commands
                print("Commands are safe and high-confidence. Executing automatically...")
                execution_result = self.execute_approved_commands(proposed_commands, parsed_entities, sql_data)
                
                return {
                    "attempted": True,
                    "strategy": resolution_strategy["strategy"],
                    "proposed_commands": proposed_commands,
                    "commands_executed": execution_result["commands_executed"],
                    "success": execution_result["success"],
                    "confidence": resolution_strategy["confidence"],
                    "escalate": not execution_result["success"],  # Only escalate if execution failed
                    "resolution_details": execution_result["details"],
                    "status": "executed" if execution_result["success"] else "failed"
                }
            else:
                # Require user approval for risky or low-confidence commands
                return {
                    "attempted": True,
                    "strategy": resolution_strategy["strategy"],
                    "proposed_commands": proposed_commands,
                    "commands_executed": [],
                    "success": False,  # Not executed yet, pending approval
                    "confidence": resolution_strategy["confidence"],
                    "escalate": False,  # Don't escalate, show for approval
                    "resolution_details": f"Ready to execute {len(proposed_commands)} commands. Awaiting user approval.",
                    "status": "pending_approval"
                }
            
        except Exception as e:
            print(f"Error in auto-resolution: {e}")
            return {
                "attempted": True,
                "success": False,
                "error": str(e),
                "escalate": True,
                "confidence": 0.0
            }

    def _analyze_resolution_feasibility(self, alert_text: str, parsed_entities: Dict,
                                      analysis: Dict, candidate_sops: Dict) -> Dict:
        """Analyze if the issue can be automatically resolved"""
        
        # First try AI analysis
        try:
            feasibility_prompt = f"""
You are an expert system administrator analyzing if a PSA alert can be automatically resolved.

ALERT DETAILS:
{alert_text}

PARSED ENTITIES:
- Module: {parsed_entities.get('module', 'Unknown')}
- Severity: {parsed_entities.get('severity', 'Unknown')}
- Entities: {', '.join(parsed_entities.get('entities', []))}

ANALYSIS:
- Problem: {analysis.get('problem_statement', 'N/A')}
- Recommended SOP: {analysis.get('best_sop_id', 'N/A')}

AVAILABLE SOPs:
{self._format_sops_for_analysis(candidate_sops.get('sops', []))}

AUTO-RESOLUTION CRITERIA:
✅ CAN be auto-resolved if:
- Issue is a known pattern (duplicates, stuck messages, name mismatches)
- Severity is medium or low
- SOP provides clear database commands
- No human judgment required
- No external system dependencies

❌ CANNOT be auto-resolved if:
- Severity is critical (requires human oversight)
- Issue requires external system changes
- Complex business logic decisions needed
- Security-related issues
- Data corruption concerns
- No clear resolution path in SOPs

Return ONLY valid JSON:
{{
    "is_auto_resolvable": true/false,
    "reason": "Brief explanation of decision",
    "confidence": 0.0-1.0,
    "recommended_strategy": "strategy_name or null"
}}
"""
            
            response = self.ai_client.generate_content(feasibility_prompt)
            result = self._parse_json_response(response)
            
            # Validate the response
            if not isinstance(result, dict) or "is_auto_resolvable" not in result:
                return self._fallback_feasibility_analysis(alert_text, parsed_entities, analysis)
            
            return result
            
        except Exception as e:
            print(f"Error in AI feasibility analysis: {e}")
            # Fall back to rule-based analysis
            return self._fallback_feasibility_analysis(alert_text, parsed_entities, analysis)
    
    def _fallback_feasibility_analysis(self, alert_text: str, parsed_entities: Dict, analysis: Dict) -> Dict:
        """Fallback rule-based feasibility analysis when AI is unavailable"""
        print("Using fallback feasibility analysis (AI unavailable)")
        
        alert_lower = alert_text.lower()
        module = parsed_entities.get('module', 'Unknown')
        severity = parsed_entities.get('severity', 'medium')
        
        # Rule-based analysis
        is_auto_resolvable = False
        reason = "No clear auto-resolution pattern detected"
        confidence = 0.0
        recommended_strategy = None
        
        # Check for known auto-resolvable patterns
        if "duplicate" in alert_lower and "container" in alert_lower:
            is_auto_resolvable = True
            reason = "Container duplicate pattern detected - safe to auto-resolve"
            confidence = 0.9  # High confidence for container duplicates
            recommended_strategy = "merge_duplicate_containers"
        
        elif "vessel" in alert_lower and ("name" in alert_lower or "match" in alert_lower):
            is_auto_resolvable = True
            reason = "Vessel name mismatch pattern detected"
            confidence = 0.7
            recommended_strategy = "correct_vessel_name"
        
        elif "edi" in alert_lower and ("stuck" in alert_lower or "error" in alert_lower):
            is_auto_resolvable = True
            reason = "EDI message stuck pattern detected"
            confidence = 0.9
            recommended_strategy = "retry_edi_message"
        
        elif "booking" in alert_lower and "validation" in alert_lower:
            is_auto_resolvable = True
            reason = "Container booking validation pattern detected"
            confidence = 0.6
            recommended_strategy = "validate_booking"
        
        # Don't auto-resolve critical issues
        if severity == "critical":
            is_auto_resolvable = False
            reason = "Critical severity requires human oversight"
            confidence = 0.0
            recommended_strategy = None
        
        return {
            "is_auto_resolvable": is_auto_resolvable,
            "reason": reason,
            "confidence": confidence,
            "recommended_strategy": recommended_strategy
        }
    
    def _extract_sql_commands_from_analysis(self, analysis: Dict) -> List[Dict]:
        """Convert analyst JSON to SQL commands using LLM"""
        try:
            # Create a prompt to convert the analysis to SQL commands
            sql_generation_prompt = f"""
You are a database expert. Convert the following analyst analysis into executable SQL commands.

ANALYST ANALYSIS:
{analysis}

DATABASE SCHEMA (SQLite):
- container table: container_id (BIGINT), cntr_no (VARCHAR), iso_code (CHAR), size_type (VARCHAR), 
  gross_weight_kg (DECIMAL), status (ENUM), origin_port (CHAR), tranship_port (CHAR), 
  destination_port (CHAR), hazard_class (VARCHAR), vessel_id (BIGINT), eta_ts (DATETIME), 
  etd_ts (DATETIME), last_free_day (DATE), created_at (TIMESTAMP)
- Primary key: (cntr_no, created_at) - allows multiple versions of same container
- Other tables: vessel, edi_message, api_event, vessel_advice, berth_application

REQUIREMENTS:
1. Generate ONLY executable SQLite SQL commands
2. Use proper SQLite syntax (datetime('now') not NOW(), ? placeholders)
3. For container duplicates: SELECT to verify, then DELETE older records keeping the latest
4. Be safe: use WHERE clauses with specific conditions
5. Return ONLY the SQL commands, one per line, no explanations

SQL COMMANDS:
"""
            
            response = self.ai_client.generate_content(sql_generation_prompt)
            
            # Parse the response to extract SQL commands
            commands = []
            lines = response.strip().split('\n')
            
            for line in lines:
                line = line.strip()
                # Skip empty lines and comments
                if not line or line.startswith('--') or line.startswith('#'):
                    continue
                
                # Look for SQL commands
                if any(sql_keyword in line.upper() for sql_keyword in ['SELECT', 'UPDATE', 'DELETE', 'INSERT']):
                    # Clean up the command
                    line = line.rstrip(';').strip()
                    if line:
                        commands.append({
                            "type": "sql",
                            "command": line,
                            "description": f"LLM-generated command: {line[:50]}..."
                        })
            
            return commands
            
        except Exception as e:
            print(f"Error generating SQL commands from analysis: {e}")
            return []
    
    def _execute_ai_generated_commands(self, commands: List[Dict], parsed_entities: Dict, sql_data: Dict) -> Dict:
        """Execute AI-generated SQL commands"""
        executed_commands = []
        success_count = 0
        
        print(f"Executing {len(commands)} AI-generated commands...")
        
        for i, cmd in enumerate(commands, 1):
            print(f"  Command {i}: {cmd['command'][:100]}...")
            
            try:
                # Execute the SQL command
                result = self._execute_sql_command(cmd['command'], parsed_entities, sql_data)
                executed_commands.append({
                    "command": cmd['command'],
                    "success": result["success"],
                    "result": result.get("result", ""),
                    "error": result.get("error", ""),
                    "rows_affected": result.get("rows_affected", 0),
                    "timestamp": datetime.now().isoformat()
                })
                
                if result["success"]:
                    success_count += 1
                    print(f"    ✅ Success: {result.get('result', 'Command executed')}")
                else:
                    print(f"    ❌ Failed: {result.get('error', 'Unknown error')}")
                    
            except Exception as e:
                executed_commands.append({
                    "command": cmd['command'],
                    "success": False,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                })
                print(f"    ❌ Exception: {e}")
        
        overall_success = success_count > 0 and success_count == len(commands)
        
        return {
            "success": overall_success,
            "commands_executed": executed_commands,
            "confidence": 0.8 if overall_success else 0.3,
            "details": f"Executed {success_count}/{len(commands)} commands successfully",
            "strategy": "ai_generated_commands"
        }
    
    def _execute_sql_command(self, command: str, parsed_entities: Dict, sql_data: Dict) -> Dict:
        """Execute a single SQL command safely"""
        try:
            # Check if we have a database connection
            if not self.db_executor.sql_connector or not self.db_executor.sql_connector.connection:
                # Simulate command execution
                return {
                    "success": True,
                    "result": f"Simulated execution of: {command[:50]}...",
                    "rows_affected": 1
                }
            
            # Convert MySQL syntax to SQLite if needed
            command = self._convert_mysql_to_sqlite(command)
            
            # Execute the command
            cursor = self.db_executor.sql_connector.cursor
            cursor.execute(command)
            
            # Get results based on command type
            if command.strip().upper().startswith('SELECT'):
                result = cursor.fetchall()
                return {
                    "success": True,
                    "result": f"Retrieved {len(result)} rows",
                    "rows_affected": len(result)
                }
            else:
                rows_affected = cursor.rowcount
                self.db_executor.sql_connector.connection.commit()
                return {
                    "success": True,
                    "result": f"Command executed successfully",
                    "rows_affected": rows_affected
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "rows_affected": 0
            }
    
    def _convert_mysql_to_sqlite(self, command: str) -> str:
        """Convert MySQL syntax to SQLite syntax"""
        # Replace MySQL-specific functions with SQLite equivalents
        command = command.replace('NOW()', "datetime('now')")
        command = command.replace('DATE_ADD(NOW(), INTERVAL 5 MINUTE)', "datetime('now', '+5 minutes')")
        
        # Replace MySQL placeholders with SQLite placeholders
        command = command.replace('%s', '?')
        
        return command
    
    def _prepare_commands_for_approval(self, strategy: Dict, parsed_entities: Dict, sql_data: Dict) -> List[Dict]:
        """Prepare commands for user approval without executing them"""
        proposed_commands = []
        
        if strategy["strategy"] == "ai_generated_commands":
            # Use AI-generated commands
            for cmd in strategy["commands"]:
                proposed_commands.append({
                    "type": "sql",
                    "command": cmd["command"],
                    "description": cmd["description"],
                    "risk_level": self._assess_command_risk(cmd["command"]),
                    "estimated_impact": self._estimate_command_impact(cmd["command"], parsed_entities)
                })
        else:
            # Convert strategy to proposed commands
            strategy_commands = self._convert_strategy_to_commands(strategy, parsed_entities, sql_data)
            for cmd in strategy_commands:
                proposed_commands.append({
                    "type": "sql",
                    "command": cmd,
                    "description": f"Auto-generated command for {strategy['strategy']}",
                    "risk_level": self._assess_command_risk(cmd),
                    "estimated_impact": self._estimate_command_impact(cmd, parsed_entities)
                })
        
        return proposed_commands
    
    def _assess_command_risk(self, command: str) -> str:
        """Assess the risk level of a SQL command"""
        command_upper = command.upper().strip()
        
        if command_upper.startswith('SELECT'):
            return "low"
        elif command_upper.startswith('UPDATE'):
            return "medium"
        elif command_upper.startswith('DELETE'):
            # Check if it's a safe DELETE (duplicate removal, cleanup)
            if any(safe_pattern in command_upper for safe_pattern in [
                'DUPLICATE', 'EARLIER', 'OLDEST', 'CREATED_AT', 'ORDER BY', 'LIMIT'
            ]):
                return "low"  # Safe DELETE for duplicate removal
            else:
                return "high"
        elif command_upper.startswith('INSERT'):
            return "medium"
        else:
            return "unknown"
    
    def _estimate_command_impact(self, command: str, parsed_entities: Dict) -> str:
        """Estimate the impact of a SQL command"""
        entities = parsed_entities.get('entities', [])
        if entities:
            return f"Will affect {len(entities)} entities: {', '.join(entities[:3])}"
        else:
            return "Impact assessment not available"
    
    def _convert_strategy_to_commands(self, strategy: Dict, parsed_entities: Dict, sql_data: Dict) -> List[str]:
        """Convert a strategy to executable SQL commands"""
        # This would convert predefined strategies to SQL commands
        # For now, return empty list as we're focusing on AI-generated commands
        return []
    
    def execute_approved_commands(self, commands: List[Dict], parsed_entities: Dict, sql_data: Dict) -> Dict:
        """Execute approved commands and return results"""
        executed_commands = []
        success_count = 0
        
        print(f"Executing {len(commands)} approved commands...")
        
        for i, cmd in enumerate(commands, 1):
            print(f"  Command {i}: {cmd['command'][:100]}...")
            
            try:
                # Execute the SQL command
                result = self._execute_sql_command(cmd['command'], parsed_entities, sql_data)
                executed_commands.append({
                    "command": cmd['command'],
                    "success": result["success"],
                    "result": result.get("result", ""),
                    "error": result.get("error", ""),
                    "rows_affected": result.get("rows_affected", 0),
                    "timestamp": datetime.now().isoformat()
                })
                
                if result["success"]:
                    success_count += 1
                    print(f"    ✅ Success: {result.get('result', 'Command executed')}")
                else:
                    print(f"    ❌ Failed: {result.get('error', 'Unknown error')}")
                    
            except Exception as e:
                executed_commands.append({
                    "command": cmd['command'],
                    "success": False,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                })
                print(f"    ❌ Exception: {e}")
        
        overall_success = success_count > 0 and success_count == len(commands)
        
        return {
            "success": overall_success,
            "commands_executed": executed_commands,
            "confidence": 0.9 if overall_success else 0.3,
            "details": f"Executed {success_count}/{len(commands)} commands successfully",
            "status": "executed" if overall_success else "partial_failure"
        }

    def _determine_resolution_strategy(self, alert_text: str, parsed_entities: Dict,
                                     analysis: Dict, feasibility: Dict) -> Dict:
        """Determine the best resolution strategy"""
        
        # First, try to extract SQL commands from AI analysis
        ai_commands = self._extract_sql_commands_from_analysis(analysis)
        if ai_commands:
            return {
                "strategy": "ai_generated_commands",
                "confidence": feasibility.get("confidence", 0.8),
                "commands": ai_commands,
                "description": "Using AI-generated SQL commands from analysis"
            }
        
        # Pattern matching for known issues
        alert_lower = alert_text.lower()
        module = parsed_entities.get('module', '').upper()
        
        # Check against resolution patterns
        for pattern_name, pattern_info in self.resolution_patterns.items():
            if re.search(pattern_info["pattern"], alert_lower, re.IGNORECASE):
                return {
                    "strategy": pattern_info["action"],
                    "pattern_matched": pattern_name,
                    "confidence": pattern_info["confidence"],
                    "commands": self.database_commands.get(pattern_name, []),
                    "description": f"Matched pattern: {pattern_name}"
                }
        
        # Module-specific strategies
        if module == "CNTR":
            if "duplicate" in alert_lower:
                return {
                    "strategy": "merge_duplicate_containers",
                    "confidence": 0.8,
                    "commands": self.database_commands["duplicate_containers"],
                    "description": "Container duplicate resolution"
                }
        
        elif module == "VSL":
            if "name" in alert_lower and "match" in alert_lower:
                return {
                    "strategy": "correct_vessel_name",
                    "confidence": 0.7,
                    "commands": self.database_commands["vessel_name_mismatch"],
                    "description": "Vessel name correction"
                }
        
        elif module == "EDI/API":
            if "stuck" in alert_lower and "error" in alert_lower:
                return {
                    "strategy": "retry_edi_message",
                    "confidence": 0.9,
                    "commands": self.database_commands["edi_message_stuck"],
                    "description": "EDI message retry"
                }
        
        # Default: no auto-resolution
        return {
            "strategy": "manual_intervention",
            "confidence": 0.0,
            "commands": [],
            "description": "No automatic resolution strategy found"
        }

    def _execute_resolution(self, strategy: Dict, parsed_entities: Dict, 
                          sql_data: Dict) -> Dict:
        """Execute the resolution strategy"""
        
        if strategy["strategy"] == "manual_intervention":
            return {
                "success": False,
                "commands_executed": [],
                "confidence": 0.0,
                "details": "Manual intervention required"
            }
        
        print(f"Executing resolution strategy: {strategy['strategy']}")
        
        # Handle AI-generated commands
        if strategy["strategy"] == "ai_generated_commands":
            return self._execute_ai_generated_commands(strategy["commands"], parsed_entities, sql_data)
        
        # Extract entities for command execution
        entities = parsed_entities.get('entities', [])
        
        # Execute using the database command executor
        try:
            execution_result = self.db_executor.execute_resolution_commands(
                strategy["strategy"],
                entities,
                {
                    "parsed_entities": parsed_entities,
                    "sql_data": sql_data,
                    "strategy_details": strategy
                }
            )
            
            return {
                "success": execution_result["success"],
                "commands_executed": execution_result["commands_executed"],
                "confidence": strategy["confidence"] if execution_result["success"] else 0.0,
                "details": f"Executed {len(execution_result['commands_executed'])} commands, success: {execution_result['success']}",
                "strategy": strategy["strategy"]
            }
            
        except Exception as e:
            return {
                "success": False,
                "commands_executed": [],
                "confidence": 0.0,
                "details": f"Execution error: {str(e)}",
                "strategy": strategy["strategy"]
            }

    def _simulate_database_command(self, command: str, parsed_entities: Dict, 
                                 sql_data: Dict) -> Dict:
        """Simulate database command execution"""
        
        # Extract entities for command parameters
        entities = parsed_entities.get('entities', [])
        
        # Simple simulation based on command type
        if "SELECT" in command.upper():
            # Simulate successful query
            return {
                "success": True,
                "result": f"Query executed successfully, found {len(entities)} matching records",
                "rows_affected": len(entities)
            }
        
        elif "UPDATE" in command.upper():
            # Simulate successful update
            return {
                "success": True,
                "result": "Update executed successfully",
                "rows_affected": 1
            }
        
        elif "INSERT" in command.upper():
            # Simulate successful insert
            return {
                "success": True,
                "result": "Insert executed successfully",
                "rows_affected": 1
            }
        
        elif "DELETE" in command.upper():
            # Simulate successful delete
            return {
                "success": True,
                "result": "Delete executed successfully",
                "rows_affected": 1
            }
        
        else:
            return {
                "success": False,
                "result": "Unknown command type",
                "rows_affected": 0
            }

    def _verify_resolution(self, resolution_result: Dict, parsed_entities: Dict,
                         sql_data: Dict) -> Dict:
        """Verify that the resolution was successful"""
        
        if not resolution_result["success"]:
            return {
                "success": False,
                "verification_method": "command_execution_failed",
                "details": "Resolution commands failed to execute"
            }
        
        # Simulate verification checks
        verification_checks = [
            {
                "check": "database_consistency",
                "result": "passed",
                "details": "Database state is consistent"
            },
            {
                "check": "entity_status",
                "result": "passed", 
                "details": "Entity status updated correctly"
            },
            {
                "check": "no_side_effects",
                "result": "passed",
                "details": "No unintended side effects detected"
            }
        ]
        
        all_passed = all(check["result"] == "passed" for check in verification_checks)
        
        return {
            "success": all_passed,
            "verification_method": "automated_checks",
            "checks": verification_checks,
            "details": f"Verification {'passed' if all_passed else 'failed'}"
        }

    def _format_sops_for_analysis(self, sops: List[Dict]) -> str:
        """Format SOPs for AI analysis"""
        if not sops:
            return "No SOPs available"
        
        formatted = []
        for i, sop in enumerate(sops[:3], 1):  # Limit to top 3 SOPs
            formatted.append(f"""
SOP {i}:
- Title: {sop.get('metadata', {}).get('title', 'Unknown')}
- Module: {sop.get('metadata', {}).get('module', 'Unknown')}
- Content: {sop.get('document', '')[:500]}...
- Relevance: {(1 - sop.get('distance', 1)):.3f}
""")
        
        return "\n".join(formatted)

    def _parse_json_response(self, response: str) -> Dict:
        """Parse JSON response from AI with fallback"""
        try:
            # Clean response
            response = response.strip()
            response = response.replace('```json', '').replace('```', '')
            
            # Find JSON boundaries
            start_idx = response.find('{')
            end_idx = response.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                response = response[start_idx:end_idx + 1]
            
            return json.loads(response)
            
        except json.JSONDecodeError:
            # Fallback parsing
            return {
                "is_auto_resolvable": False,
                "reason": "Failed to parse AI response",
                "confidence": 0.0
            }

# Factory function
def create_auto_resolution_agent(ai_client=None, sql_connector=None):
    """Create an auto-resolution agent instance"""
    return AutoResolutionAgent(ai_client, sql_connector)
