@echo off
REM PSA System Docker Setup Script for Windows
REM This script sets up the complete PSA system using Docker

echo 🚀 PSA System Docker Setup
echo ==========================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Create environment file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy env.example .env
    echo ⚠️  Please edit .env file with your API keys and configuration
    echo    Required: OPENAI_API_KEY, GOOGLE_API_KEY, SENDER_EMAIL, EMAIL_APP_PASSWORD
)

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist logs mkdir logs
if not exist data mkdir data
if not exist ssl mkdir ssl

REM Build and start services
echo 🔨 Building Docker images...
docker-compose build

echo 🚀 Starting PSA System...
docker-compose up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Check service health
echo 🏥 Checking service health...

REM Check backend
curl -f http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is healthy
) else (
    echo ❌ Backend health check failed
)

REM Check frontend
curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is healthy
) else (
    echo ❌ Frontend health check failed
)

echo.
echo 🎉 PSA System is now running!
echo.
echo 📊 Services:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo    Health:   http://localhost:5000/health
echo.
echo 📋 Useful commands:
echo    View logs:     docker-compose logs -f
echo    Stop system:    docker-compose down
echo    Restart:        docker-compose restart
echo    Update:         docker-compose pull ^&^& docker-compose up -d
echo.
echo 🔧 Configuration:
echo    Edit .env file to configure API keys and settings
echo    Restart services after configuration changes
echo.
pause
