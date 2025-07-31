#!/bin/bash

# PdfAI Docker Stop Script
# This script stops all PdfAI Docker services

echo "🛑 Stopping PdfAI Docker services..."

# Stop all services
docker-compose down

echo "🧹 Cleaning up..."

# Optional: Remove volumes (uncomment if you want to reset the database)
# docker-compose down -v

echo "✅ All PdfAI services have been stopped!"
echo ""
echo "🔧 Other useful commands:"
echo "   • Remove volumes:     docker-compose down -v"
echo "   • Remove images:      docker-compose down --rmi all"
echo "   • Complete cleanup:   docker-compose down -v --rmi all --remove-orphans"
