#!/bin/bash
# Budget App - Database Backup Script
# Creates compressed backup of PostgreSQL database

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
BACKUP_DIR="$HOME/budget-app/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/budget_db_$TIMESTAMP.sql.gz"
KEEP_BACKUPS=7

# Load environment variables
if [ -f "$HOME/budget-app/.env" ]; then
    export $(cat "$HOME/budget-app/.env" | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

echo -e "${GREEN}Starting database backup...${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if database container is running
if ! docker ps | grep -q budget_database; then
    echo -e "${RED}❌ Database container is not running${NC}"
    exit 1
fi

# Create backup
echo "Creating backup: $BACKUP_FILE"
docker exec budget_database pg_dump \
    -U "${DB_USER:-budget_admin}" \
    -d "${DB_NAME:-budget_app}" \
    --clean --if-exists \
    | gzip > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Backup created successfully${NC}"
    echo "  File: $BACKUP_FILE"
    echo "  Size: $BACKUP_SIZE"
    
    # Verify backup integrity
    if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
        echo -e "${GREEN}✓ Backup integrity verified${NC}"
    else
        echo -e "${RED}❌ Backup file is corrupted${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
fi

# Clean up old backups (keep last N backups)
echo "Cleaning up old backups (keeping last $KEEP_BACKUPS)..."
cd "$BACKUP_DIR"
ls -t budget_db_*.sql.gz | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm -v

# List remaining backups
echo ""
echo "Available backups:"
ls -lh budget_db_*.sql.gz 2>/dev/null || echo "No backups found"

echo ""
echo -e "${GREEN}✅ Backup completed successfully!${NC}"
