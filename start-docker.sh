#!/bin/bash

# PdfAI Docker Deployment Script
# This script helps you deploy the entire PdfAI application using Docker

echo "🚀 Starting PdfAI Docker deployment..."

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

# Create necessary directories if they don't exist
mkdir -p backend/TestCases

echo "📦 Building and starting all services..."

# Build and start all services
docker-compose up --build -d

echo "⏳ Waiting for services to be ready..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker-compose exec postgres pg_isready -U pdfai_user -d pdfai > /dev/null 2>&1; do
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Wait for Go backend to be ready
echo "Waiting for Go backend to be ready..."
until curl -f http://localhost:8080/health > /dev/null 2>&1; do
  sleep 2
done

echo "✅ Go backend is ready!"

# Wait for Python backend to be ready
echo "Waiting for Python backend to be ready..."
until curl -f http://localhost:8001/health > /dev/null 2>&1; do
  sleep 2
done

echo "✅ Python backend is ready!"

echo "🎉 PdfAI is now running!"
echo ""
echo "📋 Service URLs:"
echo "   • Frontend:        http://localhost:3000"
echo "   • Go Backend:      http://localhost:8080"
echo "   • Python Backend:  http://localhost:8001"
echo "   • PostgreSQL:      localhost:5432"
echo ""
echo "🔧 Useful commands:"
echo "   • View logs:       docker-compose logs -f"
echo "   • Stop services:   docker-compose down"
echo "   • Rebuild:         docker-compose up --build"
echo ""
echo "📊 To view service status:"
echo "   docker-compose ps"
