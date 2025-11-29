#!/bin/bash

# Fix Nginx Configuration on VM
# This script removes SSL configuration and ensures HTTP-only setup

set -e

echo "🔧 Fixing Nginx Configuration..."

cd ~/budgetapp

# Stop containers
echo "🛑 Stopping containers..."
docker-compose down 2>/dev/null || true

# Remove any old SSL directories
echo "🗑️  Removing old SSL certificates and directories..."
rm -rf nginx/ssl 2>/dev/null || true
rm -rf /etc/nginx/ssl 2>/dev/null || true

# Ensure we have the latest nginx.conf from the repo
echo "📥 Pulling latest nginx configuration..."
git fetch origin
git checkout develop
git pull origin develop

# Verify nginx.conf doesn't have SSL configuration
echo "🔍 Verifying nginx configuration..."
if grep -q "ssl_certificate" nginx/nginx.conf; then
    echo "❌ ERROR: nginx.conf still contains SSL configuration!"
    exit 1
fi

if grep -q "listen.*443" nginx/nginx.conf; then
    echo "❌ ERROR: nginx.conf still contains port 443 configuration!"
    exit 1
fi

echo "✅ Nginx configuration verified - HTTP only"

# Rebuild and start containers
echo "🔨 Rebuilding all containers..."
docker-compose build --no-cache

echo "🚀 Starting containers..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 15

# Health check
echo "🏥 Running health check..."
for i in {1..5}; do
    if curl -f http://localhost/health; then
        echo "✅ Nginx is healthy!"
        echo "✅ Fix completed successfully!"
        exit 0
    fi
    echo "⏳ Retry $i/5..."
    sleep 5
done

echo "❌ Health check failed"
echo "📋 Checking nginx logs..."
docker-compose logs nginx --tail=50

exit 1
