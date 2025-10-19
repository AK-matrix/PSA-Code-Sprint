"""
Migration Script: Original Flask App → LangGraph Implementation

This script helps migrate from the original Flask application to the new
LangGraph-based implementation with advanced agentic capabilities.
"""

import os
import shutil
import subprocess
import sys
from datetime import datetime

def print_header():
    """Print migration header"""
    print("PSA LangGraph Migration Script")
    print("=" * 50)
    print(f"Migration started at: {datetime.now().isoformat()}")
    print()

def check_requirements():
    """Check if all requirements are met"""
    print("Checking requirements...")
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("ERROR: Python 3.8+ required")
        return False
    
    # Check if virtual environment is active
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("WARNING: Virtual environment not detected. Consider using a virtual environment.")
    
    print("SUCCESS: Requirements check passed")
    return True

def install_dependencies():
    """Install new dependencies"""
    print("Installing new dependencies...")
    
    try:
        # Install new requirements
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("SUCCESS: Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"ERROR: Error installing dependencies: {e}")
        return False

def backup_original_files():
    """Backup original files"""
    print("💾 Backing up original files...")
    
    backup_dir = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    os.makedirs(backup_dir, exist_ok=True)
    
    files_to_backup = [
        "app.py",
        "ai_client.py",
        "database.py",
        "email_service.py",
        "sql_connector.py"
    ]
    
    for file in files_to_backup:
        if os.path.exists(file):
            shutil.copy2(file, backup_dir)
            print(f"   ✅ Backed up {file}")
    
    print(f"✅ Original files backed up to {backup_dir}")
    return backup_dir

def create_langgraph_files():
    """Create new LangGraph files"""
    print("📝 Creating LangGraph files...")
    
    # Check if files already exist
    langgraph_files = [
        "langgraph_workflow.py",
        "app_langgraph.py",
        "test_langgraph_workflow.py"
    ]
    
    for file in langgraph_files:
        if os.path.exists(file):
            print(f"   ✅ {file} already exists")
        else:
            print(f"   ❌ {file} not found - please ensure it was created")
    
    print("✅ LangGraph files ready")

def update_environment():
    """Update environment configuration"""
    print("🔧 Updating environment configuration...")
    
    # Check if .env exists
    if not os.path.exists(".env"):
        print("   ⚠️  .env file not found - please create one with your API keys")
        return False
    
    # Check for required environment variables
    required_vars = [
        "OPENAI_API_KEY",
        "GOOGLE_API_KEY",
        "SENDER_EMAIL",
        "EMAIL_APP_PASSWORD"
    ]
    
    missing_vars = []
    with open(".env", "r") as f:
        env_content = f.read()
        for var in required_vars:
            if var not in env_content:
                missing_vars.append(var)
    
    if missing_vars:
        print(f"   ⚠️  Missing environment variables: {', '.join(missing_vars)}")
        print("   Please update your .env file with the required variables")
    else:
        print("   ✅ Environment configuration looks good")
    
    return len(missing_vars) == 0

def test_langgraph_workflow():
    """Test the LangGraph workflow"""
    print("🧪 Testing LangGraph workflow...")
    
    try:
        # Import and test the workflow
        from langgraph_workflow import workflow
        print("   ✅ LangGraph workflow imported successfully")
        
        # Test basic functionality
        import asyncio
        async def test_basic():
            result = await workflow.process_alert("Test alert")
            return result
        
        # Run basic test
        result = asyncio.run(test_basic())
        print(f"   ✅ Basic workflow test passed: {result.get('status')}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ LangGraph workflow test failed: {e}")
        return False

def create_migration_guide():
    """Create migration guide"""
    print("📚 Creating migration guide...")
    
    guide_content = f"""
# PSA LangGraph Migration Guide

## Migration Completed: {datetime.now().isoformat()}

## What Changed

### 1. New Files Created
- `langgraph_workflow.py` - Core LangGraph workflow implementation
- `app_langgraph.py` - New Flask app using LangGraph
- `test_langgraph_workflow.py` - Test script for LangGraph workflow
- `LANGGRAPH_REFACTOR_GUIDE.md` - Comprehensive refactor documentation
- `LANGGRAPH_COMPARISON.md` - Comparison between original and LangGraph

### 2. Updated Files
- `requirements.txt` - Added LangGraph dependencies

### 3. New Dependencies
- langgraph
- langchain
- langchain-openai
- langchain-google-genai
- typing-extensions

## How to Use

### 1. Run the New LangGraph App
```bash
python app_langgraph.py
```

### 2. Test the Workflow
```bash
python test_langgraph_workflow.py
```

### 3. Key Differences

#### Original App
- Linear processing
- No state management
- No human review
- Basic error handling

#### LangGraph App
- Conditional routing
- Full state management
- Human-in-the-loop
- Advanced error recovery
- Real-time status tracking
- Comprehensive analytics

## New API Endpoints

- `POST /process_alert` - Process alert with workflow
- `GET /workflow/<case_id>/status` - Get workflow status
- `POST /workflow/<case_id>/approve` - Approve workflow
- `POST /workflow/<case_id>/reject` - Reject workflow
- `GET /workflows` - List all workflows
- `GET /analytics` - Get workflow analytics

## Benefits

1. **Intelligent Routing**: Skip processing for low-severity alerts
2. **Auto-Escalation**: Automatically escalate high-confidence critical issues
3. **Human Review**: Smart human review for medium-confidence issues
4. **State Management**: Complete state tracking and persistence
5. **Analytics**: Comprehensive workflow performance analytics
6. **Scalability**: Async execution and modular design

## Next Steps

1. Update your frontend to use the new API endpoints
2. Test the workflow with your specific use cases
3. Configure human review workflows
4. Set up monitoring and analytics
5. Train your team on the new capabilities

## Support

If you encounter any issues:
1. Check the logs for error messages
2. Verify your environment variables
3. Test the workflow with the provided test script
4. Review the documentation files

Happy migrating! 🚀
"""
    
    with open("MIGRATION_GUIDE.md", "w") as f:
        f.write(guide_content)
    
    print("   ✅ Migration guide created: MIGRATION_GUIDE.md")

def main():
    """Main migration function"""
    print_header()
    
    # Step 1: Check requirements
    if not check_requirements():
        print("❌ Requirements check failed")
        return False
    
    # Step 2: Install dependencies
    if not install_dependencies():
        print("❌ Dependency installation failed")
        return False
    
    # Step 3: Backup original files
    backup_dir = backup_original_files()
    
    # Step 4: Create LangGraph files
    create_langgraph_files()
    
    # Step 5: Update environment
    env_ok = update_environment()
    
    # Step 6: Test LangGraph workflow
    test_ok = test_langgraph_workflow()
    
    # Step 7: Create migration guide
    create_migration_guide()
    
    # Summary
    print("\n" + "=" * 50)
    print("🎉 Migration Summary")
    print("=" * 50)
    print(f"✅ Dependencies installed")
    print(f"✅ Original files backed up to {backup_dir}")
    print(f"✅ LangGraph files created")
    print(f"✅ Environment: {'OK' if env_ok else 'Needs attention'}")
    print(f"✅ Workflow test: {'PASSED' if test_ok else 'FAILED'}")
    print(f"✅ Migration guide created")
    
    if env_ok and test_ok:
        print("\n🚀 Migration completed successfully!")
        print("Next steps:")
        print("1. Run: python app_langgraph.py")
        print("2. Test: python test_langgraph_workflow.py")
        print("3. Read: MIGRATION_GUIDE.md")
    else:
        print("\n⚠️  Migration completed with warnings")
        print("Please check the issues above and resolve them")
    
    return True

if __name__ == "__main__":
    main()
