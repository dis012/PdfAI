@echo off
chcp 65001 >nul
REM PdfAI Docker Deployment Script for Windows
REM This script helps you deploy the entire PdfAI application using Docker

echo 🚀 Starting PdfAI Docker deployment...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not available. Please make sure Docker Desktop is properly installed.
    pause
    exit /b 1
)

echo 📦 Building and starting all services...

REM Build and start all services
docker-compose up --build -d

echo ⏳ Waiting for services to be ready...

REM Wait a bit for services to start
timeout /t 10 /nobreak >nul

echo ✅ Services are starting up!

echo 🎉 PdfAI is now running!
echo.
echo 📋 Service URLs:
echo    • Frontend:        http://localhost:3000
echo    • Go Backend:      http://localhost:8080
echo    • Python Backend:  http://localhost:8001
echo    • PostgreSQL:      localhost:5432
echo.
echo 🔧 Useful commands:
echo    • View logs:       docker-compose logs -f
echo    • Stop services:   docker-compose down
echo    • Rebuild:         docker-compose up --build
echo.
echo 📊 To view service status:
echo    docker-compose ps

pause
