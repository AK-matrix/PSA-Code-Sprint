#!/bin/bash

# PSA System Docker Cleanup Script
# This script cleans up Docker resources for the PSA system

set -e

echo "🧹 PSA System Docker Cleanup"
echo "============================"

# Stop and remove containers
echo "🛑 Stopping containers..."
docker-compose down

# Remove images
echo "🗑️  Removing images..."
docker-compose down --rmi all

# Remove volumes (optional - uncomment if you want to remove data)
# echo "🗑️  Removing volumes..."
# docker-compose down -v

# Remove unused Docker resources
echo "🧹 Cleaning up unused Docker resources..."
docker system prune -f

# Remove PSA-specific images
echo "🗑️  Removing PSA-specific images..."
docker images | grep psa | awk '{print $3}' | xargs -r docker rmi -f

echo ""
echo "✅ Cleanup completed!"
echo ""
echo "📋 To start fresh:"
echo "   ./docker-setup.sh"
echo ""
echo "📋 To remove all data (including databases):"
echo "   docker-compose down -v"
echo "   docker system prune -a -f"
