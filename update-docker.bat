@echo off
REM PdfAI Docker Update Script for Windows
REM This script pulls the latest changes from git and updates all Docker containers

echo 🔄 Starting PdfAI update process...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo ❌ Not in a git repository. Please run this script from the project root.
    pause
    exit /b 1
)

REM Save current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo 📍 Current branch: %CURRENT_BRANCH%

REM Stash any local changes
echo 💾 Stashing local changes...
git stash

REM Switch to main branch
echo 🔀 Switching to main branch...
git checkout main

REM Pull latest changes
echo 📥 Pulling latest changes from origin/main...
git pull origin main

if errorlevel 1 (
    echo ❌ Failed to pull changes from git. Please resolve conflicts manually.
    git checkout %CURRENT_BRANCH%
    git stash pop
    pause
    exit /b 1
)

REM Stop current containers
echo 🛑 Stopping current containers...
docker-compose down

REM Remove old images to force rebuild
echo 🧹 Cleaning up old images...
docker-compose down --rmi local

REM Rebuild and start all services
echo 🏗️ Rebuilding and starting all services...
docker-compose up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 15 /nobreak >nul

echo ✅ Services are starting up!

REM Switch back to original branch if it wasn't main
if not "%CURRENT_BRANCH%"=="main" (
    echo 🔀 Switching back to %CURRENT_BRANCH%...
    git checkout %CURRENT_BRANCH%
    git stash pop
)

echo 🎉 Update completed successfully!
echo.
echo 📋 Service URLs:
echo    • Frontend:        http://localhost:3000
echo    • Go Backend:      http://localhost:8080
echo    • Python Backend:  http://localhost:8001
echo    • PostgreSQL:      localhost:5432
echo.
echo 📊 To view service status:
echo    docker-compose ps

pause
