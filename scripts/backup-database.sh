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
BACKUP_DIR="$HOME/budgetapp/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/budget_db_$TIMESTAMP.sql.gz"
KEEP_BACKUPS=7
LOG_FILE="$HOME/budgetapp/logs/backup.log"

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Log function
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Load environment variables
if [ -f "$HOME/budgetapp/.env" ]; then
    export $(cat "$HOME/budgetapp/.env" | grep -v '^#' | xargs)
else
    log_message "ERROR: .env file not found"
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

log_message "Starting database backup..."
echo -e "${GREEN}Starting database backup...${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if database container is running
if ! docker ps | grep -q budget_database; then
    log_message "ERROR: Database container is not running"
    echo -e "${RED}❌ Database container is not running${NC}"
    exit 1
fi

# Create backup
log_message "Creating backup: $BACKUP_FILE"
echo "Creating backup: $BACKUP_FILE"
docker exec budget_database pg_dump \
    -U "${DB_USER:-budget_admin}" \
    -d "${DB_NAME:-budget_app}" \
    --clean --if-exists \
    | gzip > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_message "SUCCESS: Backup created - Size: $BACKUP_SIZE"
    echo -e "${GREEN}✓ Backup created successfully${NC}"
    echo "  File: $BACKUP_FILE"
    echo "  Size: $BACKUP_SIZE"
    
    # Verify backup integrity
    if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
        log_message "SUCCESS: Backup integrity verified"
        echo -e "${GREEN}✓ Backup integrity verified${NC}"
    else
        log_message "ERROR: Backup file is corrupted"
        echo -e "${RED}❌ Backup file is corrupted${NC}"
        exit 1
    fi
else
    log_message "ERROR: Backup failed"
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
fi

# Clean up old backups (keep last N backups)
log_message "Cleaning up old backups (keeping last $KEEP_BACKUPS)"
echo "Cleaning up old backups (keeping last $KEEP_BACKUPS)..."
cd "$BACKUP_DIR"
DELETED_COUNT=$(ls -t budget_db_*.sql.gz 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | wc -l)
ls -t budget_db_*.sql.gz 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm -v
if [ "$DELETED_COUNT" -gt 0 ]; then
    log_message "Deleted $DELETED_COUNT old backup(s)"
fi

# List remaining backups
BACKUP_COUNT=$(ls -1 budget_db_*.sql.gz 2>/dev/null | wc -l)
log_message "Total backups: $BACKUP_COUNT"
echo ""
echo "Available backups:"
ls -lh budget_db_*.sql.gz 2>/dev/null || echo "No backups found"

echo ""
log_message "Backup completed successfully"
echo -e "${GREEN}✅ Backup completed successfully!${NC}"
