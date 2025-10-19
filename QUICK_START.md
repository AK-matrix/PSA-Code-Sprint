# PSA Alert Processing System - Quick Start Guide

## System Overview

This is a Multi-Agent RAG (Retrieval-Augmented Generation) system for automated PSA (Port System Alert) processing. It uses AI agents to analyze alerts, retrieve relevant documentation, and provide actionable recommendations.

## Architecture

```
┌─────────────────┐
│   Frontend      │  Next.js Dashboard
│  (Port 3003)    │  - Alert Submission
└────────┬────────┘  - Results Visualization
         │           - History & Settings
         │
         ▼
┌─────────────────┐
│   Backend       │  Flask API + AI Agents
│  (Port 5000)    │  - Triage Agent
└────────┬────────┘  - Analyst Agent
         │           - Email Escalation
         │
         ▼
┌─────────────────────────────────┐
│  Data Sources                   │
│  - ChromaDB (Vector Store)      │
│  - SQL Database                 │
│  - Gemini 2.5 Flash (LLM)      │
└─────────────────────────────────┘
```

## Quick Start (Both Services)

### 1. Start Backend (Terminal 1)

```bash
# Make sure you're in the project root
cd /Users/i3dlab/Documents/GitHub/versions/PSA-Code-Sprint

# Activate virtual environment (if using one)
source venv/bin/activate  # or your virtual environment

# Install Python dependencies if needed
pip install -r requirements.txt

# Start Flask backend
python app.py
```

Backend will run on: **http://localhost:5000**

### 2. Start Frontend (Terminal 2)

```bash
# Navigate to frontend directory
cd /Users/i3dlab/Documents/GitHub/versions/PSA-Code-Sprint/frontend

# Start Next.js development server
npm run dev
```

Frontend will run on: **http://localhost:3003** (or next available port)

### 3. Access the Application

Open your browser and navigate to:
- **Frontend Dashboard**: http://localhost:3003
- **Backend API**: http://localhost:5000

## First Time Setup

### Backend Configuration

1. Create/update `.env` file in project root:
```env
GOOGLE_API_KEY=your-gemini-api-key-here
SENDER_EMAIL=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password
```

2. Ensure ChromaDB is populated:
```bash
python ingest.py
```

3. Ensure SQL database is configured:
- Check `sql_connector.py` for database settings
- Populate with test data if needed

### Frontend Configuration

The `.env.local` file is already configured:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Using the System

### 1. Submit an Alert

Go to the **Alert Processor** tab and enter alert text, for example:

```
Container CMAU1234567 has duplicate records in bay slots at Terminal 5
```

Or:

```
MV NORTHERN STAR vessel advice stuck in ERROR state, ack_at is NULL
```

### 2. View Results

The system will process the alert through multiple agents:
- **Triage Agent**: Identifies module, severity, entities
- **Retrieval**: Finds relevant SOPs and case logs
- **SQL Extraction**: Queries database for context
- **Analyst Agent**: Provides recommendations
- **Escalation**: Generates email for escalation

### 3. Explore Other Features

- **Workflow Tab**: Learn how the multi-agent system works
- **History Tab**: Review previously processed alerts
- **Settings Tab**: Configure API URL, notifications, etc.

## Supported Alert Types

The system supports 7 modules:

1. **CNTR (Container)**: Container operations and errors
2. **VSL (Vessel)**: Vessel operations and scheduling
3. **EDI/API**: Electronic Data Interchange issues
4. **Infra/SRE**: Infrastructure and reliability
5. **Container Report**: Reporting and analytics
6. **Container Booking**: Booking management
7. **IMPORT/EXPORT**: Trade operations

## Sample Alerts to Try

### Container Alert
```
Container CMAU1234567 has identical duplicate records found in the system
```

### Vessel Alert
```
VESSEL_ERR_4 - System Vessel Name does not match with BAPLIE vessel name for MV ATLANTIC WIND
```

### EDI Alert
```
EDI message REF-IFT-0007 stuck in ERROR state for 24 hours, correlation_id: ABC123, ack_at is NULL
```

## Troubleshooting

### Backend Issues

**Problem**: Flask won't start
- Check if port 5000 is available: `lsof -i :5000`
- Verify Python dependencies: `pip list`
- Check `.env` file has GOOGLE_API_KEY

**Problem**: No SOPs/case logs returned
- Run `python ingest.py` to populate ChromaDB
- Check `chroma_db/` directory exists

### Frontend Issues

**Problem**: Can't connect to backend
- Verify backend is running on port 5000
- Check Settings tab and test connection
- Verify CORS is enabled in Flask

**Problem**: npm run dev fails
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version (18+ required)

## Development Tips

### Backend Development
- Edit `app.py` for API endpoints
- Modify agent prompts in `TRIAGE_AGENT_PROMPT` and `ANALYST_AGENT_PROMPT`
- Update `contacts.json` for escalation contacts

### Frontend Development
- Components are in `frontend/components/`
- Add new shadcn components: `npx shadcn@latest add [component]`
- Styling uses Tailwind CSS classes

## Production Deployment

### Backend
```bash
# Use production WSGI server
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Frontend
```bash
# Build for production
cd frontend
npm run build
npm start
```

## Support

For issues or questions:
1. Check the README files in each directory
2. Review the Workflow tab in the dashboard
3. Check the console logs for errors

## Next Steps

1. Customize the workflow for your specific use case
2. Add more modules to `contacts.json`
3. Enhance the prompts for better accuracy
4. Integrate with your actual SQL database
5. Configure email SMTP for real escalations

---

**Note**: This system is designed for demonstration and can be customized for production use with proper security, authentication, and database configurations.
