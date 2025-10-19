import pandas as pd
import json
import os
from datetime import datetime

def parse_case_log(excel_file):
    """
    Parse Case Log.xlsx into structured JSON data for AI analysis.
    
    This script:
    1. Reads the Excel file containing historical incident data
    2. Extracts and structures case information
    3. Generates metrics and statistics
    4. Saves data as JSON for easy integration
    """
    
    print("=" * 60)
    print("PSA CASE LOG PARSER")
    print("=" * 60)
    
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    excel_path = os.path.join(script_dir, excel_file)
    
    # Check if file exists
    if not os.path.exists(excel_path):
        print(f"Error: {excel_path} not found!")
        return None
    
    print(f"Reading Excel file: {excel_file}")
    
    try:
        # Read Excel file
        df = pd.read_excel(excel_path)
        print(f"✓ Successfully loaded Excel file")
        print(f"✓ Found {len(df)} rows and {len(df.columns)} columns")
        print(f"\nColumns detected: {list(df.columns)}")
        
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return None
    
    # Parse cases
    print("\nParsing case data...")
    cases = []
    
    for idx, row in df.iterrows():
        try:
            # Convert row to dict and handle NaN values
            case = {
                column: (None if pd.isna(row[column]) else row[column])
                for column in df.columns
            }
            
            # Add parsed timestamp
            case['parsed_at'] = datetime.now().isoformat()
            case['case_index'] = idx
            
            cases.append(case)
            
        except Exception as e:
            print(f"Warning: Error parsing row {idx}: {e}")
            continue
    
    print(f"✓ Successfully parsed {len(cases)} cases")
    
    # Generate summary statistics
    print("\nGenerating statistics...")
    
    # Try to detect key columns (flexible for different Excel structures)
    possible_module_cols = ['Module', 'module', 'Product', 'product', 'Category', 'category']
    possible_date_cols = ['Date', 'date', 'Created', 'created', 'Timestamp', 'timestamp']
    possible_status_cols = ['Status', 'status', 'State', 'state', 'Resolution', 'resolution']
    
    module_col = next((col for col in possible_module_cols if col in df.columns), None)
    date_col = next((col for col in possible_date_cols if col in df.columns), None)
    status_col = next((col for col in possible_status_cols if col in df.columns), None)
    
    statistics = {
        "total_cases": len(cases),
        "columns": list(df.columns),
        "data_quality": {
            "complete_rows": len(df.dropna()),
            "rows_with_missing_data": len(df) - len(df.dropna())
        }
    }
    
    # Module distribution if found
    if module_col:
        module_counts = df[module_col].value_counts().to_dict()
        statistics["module_distribution"] = module_counts
        print(f"✓ Module distribution: {module_counts}")
    
    # Status distribution if found
    if status_col:
        status_counts = df[status_col].value_counts().to_dict()
        statistics["status_distribution"] = status_counts
        print(f"✓ Status distribution: {status_counts}")
    
    # Date range if found
    if date_col:
        try:
            df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
            date_range = {
                "earliest": str(df[date_col].min()),
                "latest": str(df[date_col].max()),
                "span_days": (df[date_col].max() - df[date_col].min()).days
            }
            statistics["date_range"] = date_range
            print(f"✓ Date range: {date_range['earliest']} to {date_range['latest']}")
        except Exception as e:
            print(f"Warning: Could not parse dates: {e}")
    
    # Save as JSON
    output_file = os.path.join(script_dir, "case_history.json")
    
    output_data = {
        "metadata": {
            "source_file": excel_file,
            "parsed_at": datetime.now().isoformat(),
            "total_cases": len(cases),
            "parser_version": "1.0"
        },
        "statistics": statistics,
        "cases": cases
    }
    
    print(f"\nSaving data to case_history.json...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"✓ Successfully saved {len(cases)} cases to case_history.json")
    
    # Print summary
    print("\n" + "=" * 60)
    print("PARSING COMPLETE")
    print("=" * 60)
    print(f"Total Cases: {len(cases)}")
    print(f"Output File: case_history.json")
    print(f"File Size: {os.path.getsize(output_file) / 1024:.2f} KB")
    print("=" * 60)
    
    return output_data

if __name__ == "__main__":
    # Parse the case log
    result = parse_case_log("Case Log.xlsx")
    
    if result:
        print("\n✓ Case log parsing successful!")
        print("\nNext steps:")
        print("1. Review case_history.json to verify data")
        print("2. Run app.py to use historical data in analysis")
        print("3. Access /metrics endpoint for case statistics")
    else:
        print("\n✗ Case log parsing failed!")
        print("Please check the Excel file and try again.")

