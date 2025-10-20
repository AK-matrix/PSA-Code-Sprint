@echo off
echo ============================================================
echo PSA SYSTEM SETUP (Windows)
echo ============================================================
echo.
echo This script will set up the complete PSA system.
echo Make sure you have Python 3.8+ installed.
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Please install Python 3.8+ first.
    pause
    exit /b 1
)

echo [OK] Python found
echo.

REM Run the setup script
echo Starting PSA system setup...
python setup.py

echo.
echo Setup completed! Press any key to exit.
pause
