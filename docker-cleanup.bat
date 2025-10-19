@echo off
REM PSA System Docker Cleanup Script for Windows
REM This script cleans up Docker resources for the PSA system

echo 🧹 PSA System Docker Cleanup
echo ============================

REM Stop and remove containers
echo 🛑 Stopping containers...
docker-compose down

REM Remove images
echo 🗑️  Removing images...
docker-compose down --rmi all

REM Remove unused Docker resources
echo 🧹 Cleaning up unused Docker resources...
docker system prune -f

REM Remove PSA-specific images
echo 🗑️  Removing PSA-specific images...
for /f "tokens=3" %%i in ('docker images ^| findstr psa') do docker rmi -f %%i

echo.
echo ✅ Cleanup completed!
echo.
echo 📋 To start fresh:
echo    docker-setup.bat
echo.
echo 📋 To remove all data (including databases):
echo    docker-compose down -v
echo    docker system prune -a -f
echo.
pause
