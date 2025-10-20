# 🚀 PSA System Setup Guide

## Quick Start (Recommended)

For new users, simply run the automated setup script:

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Run the automated setup
python setup.py

# 3. Start the backend
python app_langgraph.py

# 4. Start the frontend (in another terminal)
cd frontend
npm install
npm run dev
```

## What the Setup Script Does

The `setup.py` script automates the complete PSA system setup:

### Step 1: Extract SOPs
- Runs `python import docx.py`
- Extracts 77 SOPs from `Knowledge Base.docx`
- Creates `knowledge_base.json`

### Step 2: Parse Case Logs  
- Runs `python parse_case_logs.py`
- Parses 323 case logs from `Case Log.xlsx`
- Creates `case_logs.json`

### Step 3: Ingest Data
- Runs `python ingest.py`
- Loads 399 documents into ChromaDB (77 SOPs + 322 case logs)
- Creates vector embeddings for semantic search

### Step 4: Test Database
- Runs `python test_database.py`
- Verifies SQLite database functionality
- Tests all database operations

### Step 5: Verify Setup
- Checks all required files are created
- Verifies ChromaDB collections
- Confirms system readiness

## Manual Setup (Alternative)

If you prefer to run scripts individually:

```bash
# Extract SOPs
python import docx.py

# Parse case logs
python parse_case_logs.py

# Ingest into ChromaDB
python ingest.py

# Test database
python test_database.py
```

## Docker Setup (Alternative)

For containerized deployment:

```bash
# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

## Platform-Specific Scripts

### Windows
```bash
# Run the Windows batch file
setup.bat
```

### Linux/macOS
```bash
# Run the shell script
./setup.sh
```

## Verification

After setup, verify everything is working:

1. **Backend Health Check**: `curl http://localhost:5000/health`
2. **Frontend Access**: Open http://localhost:3000
3. **Database Files**: Check for `chroma_db/`, `psa_incidents.db`
4. **JSON Files**: Check for `knowledge_base.json`, `case_logs.json`

## Troubleshooting

### Common Issues

1. **Missing Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Python Version**
   - Ensure Python 3.8+ is installed
   - Check with `python --version`

3. **Missing Files**
   - Ensure `Knowledge Base.docx` and `Case Log.xlsx` are present
   - Check file permissions

4. **API Keys**
   - Create `.env` file with your API keys
   - Set `OPENAI_API_KEY` or `GOOGLE_API_KEY`

5. **Port Conflicts**
   - Backend runs on port 5000
   - Frontend runs on port 3000
   - Ensure these ports are available

### Database Issues

If databases are corrupted, delete and re-run setup:
```bash
# Remove existing databases
rm -rf chroma_db/
rm -f psa_incidents.db
rm -f knowledge_base.json
rm -f case_logs.json

# Re-run setup
python setup.py
```

## System Requirements

- **Python 3.8+**
- **Node.js 18+**
- **8GB+ RAM** (for ChromaDB and embeddings)
- **2GB+ Disk Space** (for databases and models)
- **OpenAI API Key** or **Google API Key**

## File Structure After Setup

```
psa-system/
├── chroma_db/                 # Vector database
├── psa_incidents.db          # SQLite database
├── knowledge_base.json       # 77 SOPs
├── case_logs.json           # 323 case logs
├── app_langgraph.py         # Backend server
├── frontend/                # Next.js frontend
└── setup.py                 # Setup script
```

## Next Steps

1. **Start Backend**: `python app_langgraph.py`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Access Application**: http://localhost:3000
4. **Test Process Alert**: Use the Process Alert tab
5. **Test Log Simulation**: Use the Log Simulation tab

## Support

If you encounter issues:

1. Check the console output for error messages
2. Verify all dependencies are installed
3. Ensure API keys are properly configured
4. Check file permissions and disk space
5. Review the troubleshooting section above

The setup script provides detailed output for each step, making it easy to identify where issues occur.
