@echo off
REM PdfAI Docker Stop Script for Windows
REM This script stops all PdfAI Docker services

echo 🛑 Stopping PdfAI Docker services...

REM Stop all services
docker-compose down

echo 🧹 Cleaning up...

echo ✅ All PdfAI services have been stopped!
echo.
echo 🔧 Other useful commands:
echo    • Remove volumes:     docker-compose down -v
echo    • Remove images:      docker-compose down --rmi all
echo    • Complete cleanup:   docker-compose down -v --rmi all --remove-orphans

pause
