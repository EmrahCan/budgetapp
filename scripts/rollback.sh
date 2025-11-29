#!/bin/bash
# Budget App - Rollback Script
# Rolls back to previous commit and restarts services

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
APP_DIR="$HOME/budgetapp"
BACKUP_DIR="$APP_DIR/backups"

echo -e "${YELLOW}╔════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   ROLLBACK PROCEDURE - DANGER ZONE             ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in the right directory
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}❌ Application directory not found: $APP_DIR${NC}"
    exit 1
fi

cd "$APP_DIR"

# Get current commit
CURRENT_COMMIT=$(git rev-parse HEAD)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "Current branch: $CURRENT_BRANCH"
echo "Current commit: $CURRENT_COMMIT"
echo ""

# Get previous commit
PREVIOUS_COMMIT=$(git rev-parse HEAD~1)
echo "Previous commit: $PREVIOUS_COMMIT"
echo ""

# Show commit details
echo "Current commit details:"
git log -1 --oneline HEAD
echo ""
echo "Previous commit details:"
git log -1 --oneline HEAD~1
echo ""

# Confirmation
echo -e "${RED}⚠️  WARNING: This will rollback to the previous commit!${NC}"
echo ""
read -p "Are you sure you want to rollback? Type 'yes' to continue: " confirm

if [ "$confirm" != "yes" ]; then
    echo "Rollback cancelled"
    exit 0
fi

echo ""
echo -e "${YELLOW}Starting rollback procedure...${NC}"
echo "=================================="

# Step 1: Create database backup
echo ""
echo "📦 Step 1/5: Creating database backup..."
if [ -f "$APP_DIR/scripts/backup-database.sh" ]; then
    ./scripts/backup-database.sh
    echo -e "${GREEN}✓ Database backup created${NC}"
else
    echo -e "${YELLOW}⚠️  Backup script not found, skipping...${NC}"
fi

# Step 2: Checkout previous commit
echo ""
echo "📥 Step 2/5: Checking out previous commit..."
git checkout $PREVIOUS_COMMIT
echo -e "${GREEN}✓ Checked out commit: $PREVIOUS_COMMIT${NC}"

# Step 3: Rebuild Docker images
echo ""
echo "🔨 Step 3/5: Rebuilding Docker images..."
docker-compose build --no-cache
echo -e "${GREEN}✓ Docker images rebuilt${NC}"

# Step 4: Restart services
echo ""
echo "🔄 Step 4/5: Restarting services..."

# Stop all services
docker-compose down

# Start all services
docker-compose up -d

echo -e "${GREEN}✓ Services restarted${NC}"

# Step 5: Verify health
echo ""
echo "🏥 Step 5/5: Verifying service health..."
echo "Waiting for services to be ready..."
sleep 20

# Health check with retries
MAX_RETRIES=5
RETRY_COUNT=0
HEALTH_OK=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f -s http://localhost/health > /dev/null 2>&1 && \
       curl -f -s http://localhost/api/health > /dev/null 2>&1; then
        HEALTH_OK=true
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo "⏳ Retry $RETRY_COUNT/$MAX_RETRIES..."
        sleep 10
    fi
done

if [ "$HEALTH_OK" = true ]; then
    echo -e "${GREEN}✓ All services are healthy${NC}"
else
    echo -e "${RED}❌ Health checks failed!${NC}"
    echo ""
    echo "Showing recent logs:"
    docker-compose logs --tail=50
    echo ""
    echo -e "${YELLOW}⚠️  Services may need manual intervention${NC}"
    exit 1
fi

# Cleanup old images
echo ""
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Rollback Completed Successfully!            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo "Rolled back from: $CURRENT_COMMIT"
echo "Current commit:   $PREVIOUS_COMMIT"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: You are now in detached HEAD state${NC}"
echo ""
echo "To make this rollback permanent:"
echo "  git checkout $CURRENT_BRANCH"
echo "  git reset --hard $PREVIOUS_COMMIT"
echo "  git push origin $CURRENT_BRANCH --force"
echo ""
echo "To undo this rollback:"
echo "  git checkout $CURRENT_BRANCH"
echo "  git reset --hard $CURRENT_COMMIT"
echo ""
echo -e "${YELLOW}⚠️  Please verify the application is working correctly${NC}"
