"""
Simple Migration Script: Original Flask App → LangGraph Implementation
"""

import os
import shutil
import subprocess
import sys
from datetime import datetime

def main():
    """Main migration function"""
    print("PSA LangGraph Migration Script")
    print("=" * 50)
    print(f"Migration started at: {datetime.now().isoformat()}")
    print()
    
    # Step 1: Check requirements
    print("Checking requirements...")
    if sys.version_info < (3, 8):
        print("ERROR: Python 3.8+ required")
        return False
    print("SUCCESS: Requirements check passed")
    
    # Step 2: Install dependencies
    print("Installing new dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("SUCCESS: Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"ERROR: Error installing dependencies: {e}")
        return False
    
    # Step 3: Backup original files
    print("Backing up original files...")
    backup_dir = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    os.makedirs(backup_dir, exist_ok=True)
    
    files_to_backup = ["app.py", "ai_client.py", "database.py", "email_service.py", "sql_connector.py"]
    for file in files_to_backup:
        if os.path.exists(file):
            shutil.copy2(file, backup_dir)
            print(f"   Backed up {file}")
    
    print(f"SUCCESS: Original files backed up to {backup_dir}")
    
    # Step 4: Check LangGraph files
    print("Checking LangGraph files...")
    langgraph_files = ["langgraph_workflow.py", "app_langgraph.py", "test_langgraph_workflow.py"]
    for file in langgraph_files:
        if os.path.exists(file):
            print(f"   {file} exists")
        else:
            print(f"   WARNING: {file} not found")
    
    # Step 5: Check environment
    print("Checking environment configuration...")
    if not os.path.exists(".env"):
        print("   WARNING: .env file not found - please create one with your API keys")
    else:
        print("   .env file exists")
    
    # Summary
    print("\n" + "=" * 50)
    print("Migration Summary")
    print("=" * 50)
    print(f"SUCCESS: Dependencies installed")
    print(f"SUCCESS: Original files backed up to {backup_dir}")
    print(f"SUCCESS: LangGraph files checked")
    print(f"SUCCESS: Environment checked")
    
    print("\nMigration completed successfully!")
    print("Next steps:")
    print("1. Run: python app_langgraph.py")
    print("2. Test: python test_langgraph_workflow.py")
    print("3. Read: LANGGRAPH_REFACTOR_GUIDE.md")
    
    return True

if __name__ == "__main__":
    main()
