#!/bin/bash

# Test nginx-based frontend locally
# This script tests the nginx version before deploying to production

set -e

echo "🧪 Testing Nginx-based Frontend..."
echo "=================================="

cd "$(dirname "$0")/.."

# Build the test frontend
echo "🏗️  Building test frontend with nginx..."
docker build -f frontend/Dockerfile.nginx \
  --build-arg REACT_APP_API_URL=/api \
  -t budget-frontend-nginx-test \
  frontend/

# Stop any existing test container
echo "🛑 Stopping existing test container..."
docker stop budget-frontend-nginx-test 2>/dev/null || true
docker rm budget-frontend-nginx-test 2>/dev/null || true

# Run the test container
echo "🚀 Starting test container on port 8888..."
docker run -d \
  --name budget-frontend-nginx-test \
  -p 8888:3000 \
  budget-frontend-nginx-test

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 5

# Check if files exist
echo ""
echo "📁 Checking nginx html directory:"
docker exec budget-frontend-nginx-test ls -la /usr/share/nginx/html/

echo ""
echo "🔍 Checking for index.html:"
docker exec budget-frontend-nginx-test cat /usr/share/nginx/html/index.html | head -n 5

echo ""
echo "🌐 Testing HTTP response:"
curl -I http://localhost:8888/ || echo "Failed to connect"

echo ""
echo "✅ Test complete!"
echo ""
echo "📝 Next steps:"
echo "1. Visit http://localhost:8888 in your browser"
echo "2. If it works, update production Dockerfile"
echo "3. To stop test: docker stop budget-frontend-nginx-test"
echo ""
