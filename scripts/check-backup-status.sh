#!/bin/bash
# Budget App - Check Backup Status
# Monitors backup health and alerts if backups are missing or old

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
BACKUP_DIR="$HOME/budgetapp/backups"
MAX_AGE_HOURS=26  # Alert if latest backup is older than 26 hours (daily backup at 3 AM)
MIN_BACKUPS=3     # Alert if fewer than 3 backups exist

echo -e "${GREEN}Checking backup status...${NC}"
echo ""

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ Backup directory not found: $BACKUP_DIR${NC}"
    exit 1
fi

# Count backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/budget_db_*.sql.gz 2>/dev/null | wc -l)
echo "Total backups: $BACKUP_COUNT"

if [ "$BACKUP_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ No backups found!${NC}"
    echo "Create a backup: ./scripts/backup-database.sh"
    exit 1
fi

if [ "$BACKUP_COUNT" -lt "$MIN_BACKUPS" ]; then
    echo -e "${YELLOW}⚠️  Warning: Only $BACKUP_COUNT backup(s) found (recommended: $MIN_BACKUPS)${NC}"
fi

# Get latest backup
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/budget_db_*.sql.gz 2>/dev/null | head -1)
LATEST_BACKUP_NAME=$(basename "$LATEST_BACKUP")
BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)

echo "Latest backup: $LATEST_BACKUP_NAME"
echo "Backup size: $BACKUP_SIZE"

# Check backup age
if [ "$(uname)" = "Darwin" ]; then
    # macOS
    BACKUP_TIME=$(stat -f %m "$LATEST_BACKUP")
    CURRENT_TIME=$(date +%s)
else
    # Linux
    BACKUP_TIME=$(stat -c %Y "$LATEST_BACKUP")
    CURRENT_TIME=$(date +%s)
fi

AGE_SECONDS=$((CURRENT_TIME - BACKUP_TIME))
AGE_HOURS=$((AGE_SECONDS / 3600))
AGE_MINUTES=$(((AGE_SECONDS % 3600) / 60))

echo "Backup age: ${AGE_HOURS}h ${AGE_MINUTES}m"

if [ "$AGE_HOURS" -gt "$MAX_AGE_HOURS" ]; then
    echo -e "${RED}❌ Latest backup is too old (${AGE_HOURS}h)!${NC}"
    echo "Expected: Less than ${MAX_AGE_HOURS}h"
    echo "Action: Check cron job and backup script"
    exit 1
fi

# Verify backup integrity
echo -n "Verifying backup integrity... "
if gunzip -t "$LATEST_BACKUP" 2>/dev/null; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ CORRUPTED${NC}"
    exit 1
fi

# List all backups
echo ""
echo "All backups:"
ls -lh "$BACKUP_DIR"/budget_db_*.sql.gz

echo ""
echo -e "${GREEN}✅ Backup system is healthy${NC}"

