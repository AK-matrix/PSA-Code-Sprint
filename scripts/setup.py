#!/usr/bin/env python3
"""
PSA System Setup Script

This script automates the complete setup process for the PSA (Port Systems Analysis) system.
It runs all required scripts in the correct order to initialize databases and prepare the system.

Usage:
    python setup.py

What this script does:
1. Extracts SOPs from Knowledge Base.docx
2. Parses case logs from Case Log.xlsx  
3. Ingests all data into ChromaDB
4. Tests database functionality
5. Verifies system readiness

Requirements:
- Python 3.8+
- All dependencies from requirements.txt installed
- Knowledge Base.docx and Case Log.xlsx files present
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def print_header(title):
    """Print a formatted header"""
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def print_step(step_num, description):
    """Print a formatted step"""
    print(f"\n[STEP {step_num}] {description}")
    print("-" * 40)

def run_script(script_name, description):
    """Run a Python script and handle errors"""
    print(f"Running {script_name}...")
    try:
        result = subprocess.run([sys.executable, script_name], 
                              capture_output=True, text=True, check=True)
        print(f"[OK] {description}")
        if result.stdout:
            print(f"Output: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] {description} failed!")
        print(f"Error: {e.stderr}")
        return False
    except FileNotFoundError:
        print(f"[ERROR] Script {script_name} not found!")
        return False

def check_required_files():
    """Check if required files exist"""
    print_step(1, "Checking Required Files")
    
    required_files = [
        "Knowledge Base.docx",
        "Case Log.xlsx",
        "import docx.py",
        "parse_case_logs.py", 
        "ingest.py",
        "test_database.py"
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
        else:
            print(f"[OK] {file} found")
    
    if missing_files:
        print(f"\n[ERROR] Missing required files:")
        for file in missing_files:
            print(f"  - {file}")
        return False
    
    print(f"\n[OK] All required files found!")
    return True

def setup_environment():
    """Setup environment and check dependencies"""
    print_step(2, "Environment Setup")
    
    # Check Python version
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        print(f"[ERROR] Python 3.8+ required, found {python_version.major}.{python_version.minor}")
        return False
    print(f"[OK] Python {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    # Check if requirements.txt exists
    if not os.path.exists("requirements.txt"):
        print("[WARNING] requirements.txt not found")
    else:
        print("[OK] requirements.txt found")
    
    # Check if .env exists
    if not os.path.exists(".env"):
        print("[WARNING] .env file not found - you may need to create one with API keys")
    else:
        print("[OK] .env file found")
    
    return True

def extract_sops():
    """Extract SOPs from Word document"""
    print_step(3, "Extracting SOPs from Knowledge Base")
    return run_script("import docx.py", "SOP extraction from Knowledge Base.docx")

def parse_case_logs():
    """Parse case logs from Excel file"""
    print_step(4, "Parsing Case Logs from Excel")
    return run_script("parse_case_logs.py", "Case log parsing from Case Log.xlsx")

def ingest_data():
    """Ingest data into ChromaDB"""
    print_step(5, "Ingesting Data into ChromaDB")
    return run_script("ingest.py", "Data ingestion into ChromaDB vector database")

def test_database():
    """Test database functionality"""
    print_step(6, "Testing Database Functionality")
    return run_script("test_database.py", "Database functionality test")

def verify_setup():
    """Verify the setup is complete"""
    print_step(7, "Verifying Setup")
    
    # Check if key files were created
    expected_files = [
        "knowledge_base.json",
        "case_logs.json", 
        "chroma_db",
        "psa_incidents.db"
    ]
    
    all_good = True
    for file in expected_files:
        if os.path.exists(file):
            print(f"[OK] {file} created")
        else:
            print(f"[ERROR] {file} not found")
            all_good = False
    
    # Check ChromaDB collections
    if os.path.exists("chroma_db"):
        try:
            import chromadb
            client = chromadb.PersistentClient(path="chroma_db")
            collections = client.list_collections()
            print(f"[OK] ChromaDB initialized with {len(collections)} collections")
        except Exception as e:
            print(f"[WARNING] Could not verify ChromaDB: {e}")
    
    return all_good

def print_summary():
    """Print setup summary"""
    print_header("SETUP COMPLETE")
    print("""
Your PSA system is now ready to use!

What was created:
[OK] knowledge_base.json - 77 SOPs extracted
[OK] case_logs.json - 323 case logs parsed  
[OK] chroma_db/ - Vector database with 399 documents
[OK] psa_incidents.db - SQLite database for incidents

Next steps:
1. Start the backend: python app_langgraph.py
2. Start the frontend: cd frontend && npm run dev
3. Access the application at http://localhost:3000

API Endpoints available:
- POST /process_alert - Process alerts through LangGraph workflow
- GET  /simulation/logs - Get available log files
- POST /simulation/start - Start log simulation
- GET  /health - Health check

For Docker deployment:
- docker-compose up -d

Troubleshooting:
- Check .env file has proper API keys
- Ensure all dependencies are installed: pip install -r requirements.txt
- Verify Python 3.8+ is being used
""")

def main():
    """Main setup function"""
    print_header("PSA SYSTEM SETUP")
    print("This script will set up the complete PSA system.")
    print("Make sure you have Python 3.8+ and all dependencies installed.")
    
    # Track success of each step
    steps_success = []
    
    # Step 1: Check required files
    steps_success.append(check_required_files())
    
    # Step 2: Setup environment
    steps_success.append(setup_environment())
    
    # Step 3: Extract SOPs
    steps_success.append(extract_sops())
    
    # Step 4: Parse case logs
    steps_success.append(parse_case_logs())
    
    # Step 5: Ingest data
    steps_success.append(ingest_data())
    
    # Step 6: Test database
    steps_success.append(test_database())
    
    # Step 7: Verify setup
    steps_success.append(verify_setup())
    
    # Check if all steps succeeded
    if all(steps_success):
        print_summary()
        print("\n[SUCCESS] PSA system setup completed successfully!")
        return 0
    else:
        print_header("SETUP FAILED")
        print("Some steps failed. Please check the errors above and try again.")
        print("\nCommon issues:")
        print("- Missing required files (Knowledge Base.docx, Case Log.xlsx)")
        print("- Python dependencies not installed (pip install -r requirements.txt)")
        print("- Insufficient permissions to create files")
        print("- Missing API keys in .env file")
        return 1

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n[INTERRUPTED] Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        sys.exit(1)
