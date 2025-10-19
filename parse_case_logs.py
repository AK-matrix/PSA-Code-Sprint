import pandas as pd
import json
import os
from datetime import datetime

def parse_case_logs():
    """
    Parse Case Log.xlsx into structured format for ChromaDB ingestion.
    Returns a list of case log entries with proper structure.
    """
    print("Starting case log parsing process...")
    
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    case_log_file = os.path.join(script_dir, "Case Log.xlsx")
    
    # Check if Case Log.xlsx exists
    if not os.path.exists(case_log_file):
        print(f"Error: {case_log_file} not found.")
        return []
    
    # Read the Excel file
    print("Reading Case Log.xlsx...")
    try:
        df = pd.read_excel(case_log_file)
        print(f"Successfully loaded {len(df)} case log entries")
    except Exception as e:
        print(f"Error reading Case Log.xlsx: {e}")
        return []
    
    # Process each case log entry
    case_logs = []
    
    for index, row in df.iterrows():
        try:
            # Create structured case log entry
            case_log = {
                "case_id": f"case_{index + 1}",
                "module": str(row.get('Module', 'Unknown')).strip(),
                "mode": str(row.get('Mode', 'Unknown')).strip(),
                "is_edi": str(row.get('EDI?', 'Unknown')).strip(),
                "timestamp": str(row.get('TIMESTAMP', 'Unknown')).strip(),
                "alert_email": str(row.get('Alert / Email', '')).strip(),
                "problem_statement": str(row.get('Problem Statements', '')).strip(),
                "solution": str(row.get('Solution', '')).strip(),
                "sop_reference": str(row.get('SOP', '')).strip() if pd.notna(row.get('SOP')) else '',
                "created_at": datetime.now().isoformat()
            }
            
            # Create full content for embedding
            full_content = f"""
Module: {case_log['module']}
Mode: {case_log['mode']}
EDI: {case_log['is_edi']}
Timestamp: {case_log['timestamp']}
Alert/Email: {case_log['alert_email']}
Problem Statement: {case_log['problem_statement']}
Solution: {case_log['solution']}
SOP Reference: {case_log['sop_reference']}
            """.strip()
            
            case_log['full_content'] = full_content
            
            case_logs.append(case_log)
            
            print(f"Processed case log {index + 1}: {case_log['module']} - {case_log['problem_statement'][:50]}...")
            
        except Exception as e:
            print(f"Error processing case log {index + 1}: {e}")
            continue
    
    print(f"Successfully parsed {len(case_logs)} case log entries")
    return case_logs

def save_case_logs_to_json(case_logs):
    """Save case logs to JSON file"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(script_dir, "case_logs.json")
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(case_logs, f, indent=2, ensure_ascii=False)
        print(f"Case logs saved to {output_file}")
        return True
    except Exception as e:
        print(f"Error saving case logs to JSON: {e}")
        return False

if __name__ == "__main__":
    case_logs = parse_case_logs()
    if case_logs:
        save_case_logs_to_json(case_logs)
        print(f"\nSuccessfully parsed {len(case_logs)} case logs.")
        print("Output saved to case_logs.json")
    else:
        print("No case logs were parsed.")
