#!/bin/bash

# PdfAI Docker Update Script (Advanced)
# This script pulls the latest changes from git and updates all Docker containers
# Usage: ./update-docker-advanced.sh [branch_name]
# If no branch is specified, it defaults to 'main'

TARGET_BRANCH=${1:-main}

echo "🔄 Starting PdfAI update process for branch: $TARGET_BRANCH"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
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

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes. They will be stashed."
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Update cancelled."
        exit 1
    fi
    
    echo "💾 Stashing local changes..."
    git stash push -m "Auto-stash before update $(date)"
    STASHED=true
else
    echo "✅ Working directory is clean"
    STASHED=false
fi

# Fetch latest changes
echo "📡 Fetching latest changes..."
git fetch origin

# Check if target branch exists
if ! git show-ref --verify --quiet refs/remotes/origin/$TARGET_BRANCH; then
    echo "❌ Branch 'origin/$TARGET_BRANCH' does not exist."
    if [ "$STASHED" = true ]; then
        git stash pop
    fi
    exit 1
fi

# Switch to target branch
if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
    echo "🔀 Switching to $TARGET_BRANCH branch..."
    git checkout $TARGET_BRANCH
fi

# Pull latest changes
echo "📥 Pulling latest changes from origin/$TARGET_BRANCH..."
git pull origin $TARGET_BRANCH

if [ $? -ne 0 ]; then
    echo "❌ Failed to pull changes from git. Please resolve conflicts manually."
    if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
        git checkout $CURRENT_BRANCH
    fi
    if [ "$STASHED" = true ]; then
        git stash pop
    fi
    exit 1
fi

# Show what changed
echo "📋 Latest commits:"
git log --oneline -5

# Stop current containers gracefully
echo "🛑 Stopping current containers..."
docker-compose down

# Clean up unused images and containers
echo "🧹 Cleaning up Docker resources..."
docker system prune -f

# Remove old images to force rebuild
echo "🗑️ Removing old images..."
docker-compose down --rmi local

# Rebuild and start all services
echo "🏗️ Rebuilding and starting all services..."
docker-compose up --build -d

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    echo "Waiting for $service_name..."
    while [ $attempt -le $max_attempts ]; do
        if curl -f $url > /dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        sleep 2
        ((attempt++))
    done
    
    echo "❌ $service_name failed to start within expected time"
    return 1
}

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
until docker-compose exec postgres pg_isready -U pdfai_user -d pdfai > /dev/null 2>&1; do
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Check service health
check_service "Go backend" "http://localhost:8080/health"
check_service "Python backend" "http://localhost:8001/health"

# Switch back to original branch if needed
if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ] && [ "$CURRENT_BRANCH" != "main" ]; then
    echo "🔀 Switching back to $CURRENT_BRANCH..."
    git checkout $CURRENT_BRANCH
fi

# Restore stashed changes if any
if [ "$STASHED" = true ]; then
    echo "📦 Restoring stashed changes..."
    git stash pop
fi

echo ""
echo "🎉 Update completed successfully!"
echo ""
echo "📋 Service URLs:"
echo "   • Frontend:        http://localhost:3000"
echo "   • Go Backend:      http://localhost:8080"
echo "   • Python Backend:  http://localhost:8001"
echo "   • PostgreSQL:      localhost:5432"
echo ""
echo "🔧 Useful commands:"
echo "   • View logs:       docker-compose logs -f"
echo "   • Check status:    docker-compose ps"
echo "   • Stop services:   docker-compose down"
