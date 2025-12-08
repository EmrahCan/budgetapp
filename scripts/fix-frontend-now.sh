#!/bin/bash

# Quick fix for frontend Index of build/ issue
# Rebuilds frontend container with nginx

set -e

echo "🔧 Fixing Frontend Index Issue..."
echo "=================================="

cd /root/budgetapp

# Stop and remove frontend container
echo "📦 Stopping and removing frontend container..."
docker-compose stop frontend
docker-compose rm -f frontend

# Remove old image
echo "🗑️  Removing old frontend image..."
docker rmi budgetapp-frontend 2>/dev/null || true

# Rebuild frontend with no cache
echo "🏗️  Rebuilding frontend with nginx..."
docker-compose build --no-cache frontend

# Start frontend
echo "🚀 Starting frontend..."
docker-compose up -d frontend

# Wait for it to start
echo "⏳ Waiting for frontend to start..."
sleep 15

# Check status
echo "📊 Container status:"
docker-compose ps frontend

# Verify the build directory
echo ""
echo "🔍 Checking nginx html directory:"
docker exec budget_frontend ls -la /usr/share/nginx/html/ || echo "Directory check failed"

echo ""
echo "✅ Frontend rebuild complete!"
echo ""
echo "🌐 Test your site: https://budgetapp.site"
echo ""
