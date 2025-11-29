#!/bin/bash

# Fix Nginx Configuration on Test VM
# This script removes SSL configuration and ensures HTTP-only setup

set -e

echo "🔧 Fixing Nginx Configuration..."

# Stop containers
echo "🛑 Stopping containers..."
cd ~/budgetapp
docker compose down

# Ensure we have the latest nginx.conf from the repo
echo "📥 Pulling latest nginx configuration..."
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

# Remove any old SSL certificates
echo "🗑️  Removing old SSL certificates if they exist..."
rm -rf nginx/ssl

# Rebuild and start containers
echo "🔨 Rebuilding containers..."
docker compose build --no-cache nginx

echo "🚀 Starting containers..."
docker compose up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 10

# Health check
echo "🏥 Running health check..."
for i in {1..5}; do
    if curl -f http://localhost/health; then
        echo "✅ Nginx is healthy!"
        exit 0
    fi
    echo "⏳ Retry $i/5..."
    sleep 5
done

echo "❌ Health check failed"
echo "📋 Checking nginx logs..."
docker compose logs nginx --tail=50

exit 1
