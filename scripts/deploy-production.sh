#!/bin/bash
set -e

echo "🚀 Starting Production Environment Deployment"
echo "=============================================="

cd ~/budgetapp

# Pull latest code from main branch
echo "📥 Pulling latest code..."
git fetch origin
git reset --hard origin/main

# Verify environment file exists
echo "⚙️  Verifying environment..."
if [ ! -f .env ]; then
  echo "❌ .env file not found! Please create it first."
  exit 1
fi

# Create backup before deployment
echo "💾 Creating database backup..."
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"

if docker ps | grep -q budget_database; then
  docker exec budget_database pg_dump -U budget_admin budget_app_prod > $BACKUP_FILE
  echo "✅ Backup created: $BACKUP_FILE"
else
  echo "⚠️  Database not running, skipping backup"
fi

# Stop all containers
echo "🛑 Stopping containers..."
docker-compose down

# Remove any old SSL directories
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
    echo "✅ All services are healthy"
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "⏳ Retry $RETRY_COUNT/$MAX_RETRIES..."
    sleep 10
  else
    echo "❌ Health checks failed after $MAX_RETRIES attempts"
    echo "🔄 Rolling back to previous version..."
    
    # Rollback
    git reset --hard HEAD~1
    docker-compose down
    docker-compose up -d
    
    echo "❌ Deployment failed and rolled back"
    docker-compose logs --tail=50
    exit 1
  fi
done

# Cleanup old images
echo "🧹 Cleaning up old images..."
docker image prune -f

# Keep only last 7 backups
echo "🗑️  Cleaning old backups..."
cd $BACKUP_DIR
ls -t backup-*.sql | tail -n +8 | xargs -r rm
cd ..

echo ""
echo "✅ Production deployment completed successfully!"
echo "=============================================="
echo "🌐 Application: https://budgetapp.site"
echo "💾 Backup: $BACKUP_FILE"
echo ""

