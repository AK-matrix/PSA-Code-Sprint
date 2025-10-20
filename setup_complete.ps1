#!/usr/bin/env pwsh

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "           PortaBella PSA System - Complete Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[STEP 1] Installing Python Dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install Python dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Python dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "[STEP 2] Installing Frontend Dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install frontend dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Frontend dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "[STEP 3] Processing Documents..." -ForegroundColor Yellow
Set-Location ..
Write-Host "Processing Word documents..."
python "import docx.py"
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Document processing failed, continuing..." -ForegroundColor Yellow
}

Write-Host "Processing case logs..."
python parse_case_logs.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Case log processing failed, continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[STEP 4] Setting up Databases..." -ForegroundColor Yellow
python setup.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Database setup failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Databases initialized" -ForegroundColor Green

Write-Host ""
Write-Host "[STEP 5] Ingesting Knowledge Base..." -ForegroundColor Yellow
python ingest.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Knowledge base ingestion failed, continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[STEP 6] Creating Application Logs Directory..." -ForegroundColor Yellow
if (!(Test-Path "Application Logs")) {
    New-Item -ItemType Directory -Name "Application Logs" | Out-Null
    Write-Host "[OK] Created Application Logs directory" -ForegroundColor Green
} else {
    Write-Host "[OK] Application Logs directory already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "[STEP 7] Creating Environment File..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item "env.example" ".env"
    Write-Host "[OK] Created .env file from template" -ForegroundColor Green
    Write-Host "[IMPORTANT] Please edit .env file with your API keys" -ForegroundColor Yellow
} else {
    Write-Host "[OK] .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "                    SETUP COMPLETE!" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Starting PortaBella PSA System..." -ForegroundColor Blue
Write-Host "[INFO] Backend will run on: http://localhost:5000" -ForegroundColor Blue
Write-Host "[INFO] Frontend will run on: http://localhost:3000" -ForegroundColor Blue
Write-Host ""
Write-Host "Starting servers in background..." -ForegroundColor Yellow

# Start backend server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:GOOGLE_API_KEY='test_key'; python app.py" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "[SUCCESS] PortaBella PSA System is now running!" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application at:" -ForegroundColor Blue
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API: http://localhost:5000" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit this setup window"
