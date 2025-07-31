#!/bin/bash

# PdfAI Docker Update Script
# This script pulls the latest changes from git and updates all Docker containers

echo "🔄 Starting PdfAI update process..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Please run this script from the project root."
    exit 1
fi

# Save current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Stash any local changes
echo "💾 Stashing local changes..."
git stash

# Switch to main branch
echo "🔀 Switching to main branch..."
git checkout main

# Pull latest changes
echo "📥 Pulling latest changes from origin/main..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Failed to pull changes from git. Please resolve conflicts manually."
    git checkout $CURRENT_BRANCH
    git stash pop
    exit 1
fi

# Stop current containers
echo "🛑 Stopping current containers..."
docker-compose down

# Remove old images to force rebuild
echo "🧹 Cleaning up old images..."
docker-compose down --rmi local

# Rebuild and start all services
echo "🏗️ Rebuilding and starting all services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
until docker-compose exec postgres pg_isready -U pdfai_user -d pdfai > /dev/null 2>&1; do
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Wait for Go backend
echo "Waiting for Go backend..."
until curl -f http://localhost:8080/health > /dev/null 2>&1; do
  sleep 2
done
echo "✅ Go backend is ready!"

# Wait for Python backend
echo "Waiting for Python backend..."
until curl -f http://localhost:8001/health > /dev/null 2>&1; do
  sleep 2
done
echo "✅ Python backend is ready!"

# Switch back to original branch if it wasn't main
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "🔀 Switching back to $CURRENT_BRANCH..."
    git checkout $CURRENT_BRANCH
    git stash pop
fi

echo "🎉 Update completed successfully!"
echo ""
echo "📋 Service URLs:"
echo "   • Frontend:        http://localhost:3000"
echo "   • Go Backend:      http://localhost:8080"
echo "   • Python Backend:  http://localhost:8001"
echo "   • PostgreSQL:      localhost:5432"
echo ""
echo "📊 To view service status:"
echo "   docker-compose ps"
