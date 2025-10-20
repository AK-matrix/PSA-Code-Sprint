# PortaBella PSA System - Setup Guide

## 🚀 Quick Start (Recommended)

### Option 1: Automated Setup (Windows)
```bash
setup_complete.bat
```

### Option 2: PowerShell Setup (Windows)
```powershell
.\setup_complete.ps1
```

## 📋 Manual Setup Steps

### 1. Install Dependencies

**Backend (Python)**
```bash
pip install -r requirements.txt
```

**Frontend (Node.js)**
```bash
cd frontend
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
copy env.example .env

# Edit .env file with your API keys
# Required: GOOGLE_API_KEY, OPENAI_API_KEY
```

### 3. Database Setup
```bash
# Create SQLite database
python database.py

# Ingest knowledge base
python ingest.py
```

### 4. Application Logs
```bash
# Create logs directory
mkdir "Application Logs"

# Add your .log files to the "Application Logs" directory
```

### 5. Start Services

**Backend (Terminal 1)**
```bash
python app.py
```

**Frontend (Terminal 2)**
```bash
cd frontend
npm run dev
```

## 🌐 Access Your Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📁 Project Structure

```
PSA-Code-Sprint/
├── Application Logs/          ← Your log files go here
├── app.py                    ← Backend server
├── frontend/                 ← React frontend
├── database.py              ← Database setup
├── ingest.py                ← Knowledge base ingestion
├── setup_complete.bat       ← Windows setup script
├── setup_complete.ps1       ← PowerShell setup script
└── .env                     ← Environment variables
```

## 🔧 Troubleshooting

### Backend Issues
- Ensure `GOOGLE_API_KEY` is set in `.env`
- Check port 5000 is available
- Verify Python dependencies are installed

### Frontend Issues
- Ensure Node.js is installed
- Check port 3000 is available
- Run `npm install` in frontend directory

### Log Simulation Issues
- Ensure "Application Logs" directory exists
- Add `.log` files to the directory
- Check backend is running on port 5000

## 📞 Support

For issues or questions, contact the development team.
