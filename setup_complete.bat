@echo off
echo ============================================================
echo           PortaBella PSA System - Complete Setup
echo ============================================================
echo.

echo [STEP 1] Installing Python Dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)
echo [OK] Python dependencies installed

echo.
echo [STEP 2] Installing Frontend Dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed

echo.
echo [STEP 3] Processing Documents...
cd ..
echo Processing Word documents...
python import\ docx.py
if %errorlevel% neq 0 (
    echo WARNING: Document processing failed, continuing...
)

echo Processing case logs...
python parse_case_logs.py
if %errorlevel% neq 0 (
    echo WARNING: Case log processing failed, continuing...
)

echo.
echo [STEP 4] Setting up Databases...
python setup.py
if %errorlevel% neq 0 (
    echo ERROR: Database setup failed
    pause
    exit /b 1
)
echo [OK] Databases initialized

echo.
echo [STEP 5] Ingesting Knowledge Base...
python ingest.py
if %errorlevel% neq 0 (
    echo WARNING: Knowledge base ingestion failed, continuing...
)

echo.
echo [STEP 6] Creating Application Logs Directory...
if not exist "Application Logs" (
    mkdir "Application Logs"
    echo [OK] Created Application Logs directory
) else (
    echo [OK] Application Logs directory already exists
)

echo.
echo [STEP 7] Creating Environment File...
if not exist .env (
    copy env.example .env
    echo [OK] Created .env file from template
    echo [IMPORTANT] Please edit .env file with your API keys
) else (
    echo [OK] .env file already exists
)

echo.
echo ============================================================
echo                    SETUP COMPLETE!
echo ============================================================
echo.
echo [INFO] Starting PortaBella PSA System...
echo [INFO] Backend will run on: http://localhost:5000
echo [INFO] Frontend will run on: http://localhost:3000
echo.
echo Starting servers in background...

REM Start backend server
start "PortaBella Backend" cmd /k "set GOOGLE_API_KEY=test_key && python app.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server
start "PortaBella Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo [SUCCESS] PortaBella PSA System is now running!
echo.
echo Access your application at:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:5000
echo.
echo Press any key to exit this setup window...
pause >nul
