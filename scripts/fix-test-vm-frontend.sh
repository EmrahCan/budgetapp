#!/bin/bash

# Fix Test VM Frontend - Switch from serve to nginx
# This fixes the "Index of build/" issue

set -e

echo "🔧 Fixing Test VM Frontend..."
echo "=============================="

# Determine the correct directory
if [ -d "/root/budgetapp" ]; then
    cd /root/budgetapp
elif [ -d "/root/budget" ]; then
    cd /root/budget
else
    echo "❌ Error: Cannot find budget directory"
    exit 1
fi

echo "📂 Working directory: $(pwd)"

# Stop frontend container
echo "🛑 Stopping frontend container..."
docker-compose stop frontend

# Remove frontend container and image
echo "🗑️  Removing old frontend container and image..."
docker-compose rm -f frontend
docker rmi budgetapp-frontend 2>/dev/null || true

# Rebuild frontend with nginx (no cache)
echo "🏗️  Rebuilding frontend with nginx..."
docker-compose build --no-cache frontend

# Start frontend
echo "🚀 Starting frontend..."
docker-compose up -d frontend

# Wait for frontend to be healthy
echo "⏳ Waiting for frontend to start..."
sleep 15

# Check frontend health
echo ""
echo "📊 Container status:"
docker-compose ps frontend

# Verify nginx is serving files
echo ""
echo "🔍 Checking nginx html directory:"
docker exec budget_frontend ls -la /usr/share/nginx/html/ | head -n 10

echo ""
echo "🔍 Checking for index.html:"
docker exec budget_frontend test -f /usr/share/nginx/html/index.html && echo "✅ index.html exists" || echo "❌ index.html NOT found"

# Test the frontend
echo ""
echo "🧪 Testing frontend response:"
curl -I http://localhost:80/ 2>/dev/null | head -n 5 || echo "⚠️  Frontend not responding yet"

echo ""
echo "✅ Frontend fix complete!"
echo ""
echo "📝 Next steps:"
echo "1. Visit test.budgetapp.site in your browser"
echo "2. You should see the landing page instead of 'Index of build/'"
echo ""
echo "🔍 To check logs:"
echo "   docker-compose logs -f frontend"
echo ""
echo "🔄 To check nginx config:"
echo "   docker exec budget_frontend cat /etc/nginx/conf.d/default.conf"
echo ""
