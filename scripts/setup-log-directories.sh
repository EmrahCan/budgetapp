#!/bin/bash
# Budget App - Setup Log Directories
# Creates all necessary log directories with proper permissions

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Setting up log directories for Budget App...${NC}"
echo ""

# Application directory
APP_DIR="$HOME/budgetapp"

# Create log directories
echo "Creating log directories..."

# Backend logs
mkdir -p "$APP_DIR/backend/logs"
echo "  ✓ backend/logs"

# Nginx logs
mkdir -p "$APP_DIR/nginx/logs"
echo "  ✓ nginx/logs"

# General application logs
mkdir -p "$APP_DIR/logs"
echo "  ✓ logs"

# Backup logs
mkdir -p "$APP_DIR/backups/logs"
echo "  ✓ backups/logs"

# Set proper permissions
echo ""
echo "Setting permissions..."
chmod -R 755 "$APP_DIR/backend/logs"
chmod -R 755 "$APP_DIR/nginx/logs"
chmod -R 755 "$APP_DIR/logs"
chmod -R 755 "$APP_DIR/backups/logs"

echo ""
echo -e "${GREEN}✅ Log directories setup complete!${NC}"
echo ""
echo "Created directories:"
echo "  - $APP_DIR/backend/logs     (Backend application logs)"
echo "  - $APP_DIR/nginx/logs       (Nginx access & error logs)"
echo "  - $APP_DIR/logs             (Monitoring & cron logs)"
echo "  - $APP_DIR/backups/logs     (Backup operation logs)"
echo ""
echo "View logs:"
echo "  tail -f $APP_DIR/backend/logs/combined.log"
echo "  tail -f $APP_DIR/nginx/logs/access.log"
echo "  tail -f $APP_DIR/logs/monitoring.log"

