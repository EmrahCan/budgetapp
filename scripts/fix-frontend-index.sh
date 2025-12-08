#!/bin/bash

# Fix Frontend Index of build/ Issue
# This script rebuilds the frontend container with nginx instead of serve

set -e

echo "🔧 Fixing Frontend Index Issue..."
echo "=================================="

cd /root/budget

# Stop frontend container
echo "📦 Stopping frontend container..."
docker-compose stop frontend

# Remove frontend container and image
echo "🗑️  Removing old frontend container and image..."
docker-compose rm -f frontend
docker rmi budget_frontend 2>/dev/null || true

# Rebuild frontend with nginx
echo "🏗️  Rebuilding frontend with nginx..."
docker-compose build --no-cache frontend

# Start frontend
echo "🚀 Starting frontend..."
docker-compose up -d frontend

# Wait for frontend to be healthy
echo "⏳ Waiting for frontend to be healthy..."
sleep 10

# Check frontend health
echo "🏥 Checking frontend health..."
docker-compose ps frontend

# Test the frontend
echo "🧪 Testing frontend..."
curl -I http://localhost:80/ || echo "⚠️  Frontend not responding yet, give it a moment..."

echo ""
echo "✅ Frontend fix complete!"
echo ""
echo "📝 Next steps:"
echo "1. Visit your site: https://budgetapp.site"
echo "2. You should see the landing page instead of 'Index of build/'"
echo ""
echo "🔍 To check logs:"
echo "   docker-compose logs -f frontend"
echo ""
