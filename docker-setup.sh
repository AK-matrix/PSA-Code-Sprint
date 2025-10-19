#!/bin/bash

# PSA System Docker Setup Script
# This script sets up the complete PSA system using Docker

set -e

echo "🚀 PSA System Docker Setup"
echo "=========================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your API keys and configuration"
    echo "   Required: OPENAI_API_KEY, GOOGLE_API_KEY, SENDER_EMAIL, EMAIL_APP_PASSWORD"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs data ssl

# Set permissions
echo "🔐 Setting permissions..."
chmod +x docker-setup.sh
chmod +x *.py

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build

echo "🚀 Starting PSA System..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🏥 Checking service health..."

# Check backend
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
fi

echo ""
echo "🎉 PSA System is now running!"
echo ""
echo "📊 Services:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   Health:   http://localhost:5000/health"
echo ""
echo "📋 Useful commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop system:  docker-compose down"
echo "   Restart:      docker-compose restart"
echo "   Update:       docker-compose pull && docker-compose up -d"
echo ""
echo "🔧 Configuration:"
echo "   Edit .env file to configure API keys and settings"
echo "   Restart services after configuration changes"
