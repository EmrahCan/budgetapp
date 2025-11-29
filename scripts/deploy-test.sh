#!/bin/bash
set -e

echo "🧪 Starting Test Environment Deployment"
echo "========================================"

cd ~/budgetapp

# Pull latest code
echo "📥 Pulling latest code..."
git fetch origin
git reset --hard origin/develop

# Copy test environment file
echo "⚙️  Setting up environment..."
if [ ! -f .env ]; then
  echo "❌ .env file not found! Please create it first."
  exit 1
fi

# Stop all containers
echo "🛑 Stopping containers..."
docker-compose down

# Remove any old SSL directories that might cause issues
echo "🗑️  Removing old SSL configurations..."
rm -rf nginx/ssl 2>/dev/null || true

# Build new images
echo "🔨 Building Docker images..."
docker-compose build --no-cache

# Start all containers
echo "🚀 Starting containers..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 20

# Health checks
echo "🏥 Running health checks..."

MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -f http://localhost/health; then
    echo "✓ All services are healthy"
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "⏳ Retry $RETRY_COUNT/$MAX_RETRIES..."
    sleep 10
  else
    echo "❌ Health checks failed after $MAX_RETRIES attempts"
    docker-compose logs --tail=50
    exit 1
  fi
done

# Cleanup
echo "🧹 Cleaning up..."
docker image prune -f

echo ""
echo "✅ Test deployment completed successfully!"
echo "========================================"
