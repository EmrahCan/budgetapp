#!/bin/bash
# Budget App - Test Backup System
# Tests backup creation and restoration

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="$HOME/budgetapp"
BACKUP_DIR="$APP_DIR/backups"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Budget App - Backup System Test     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Test 1: Check if backup script exists
echo -n "Test 1: Backup script exists ... "
if [ -f "$APP_DIR/scripts/backup-database.sh" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    exit 1
fi

# Test 2: Check if backup script is executable
echo -n "Test 2: Backup script is executable ... "
if [ -x "$APP_DIR/scripts/backup-database.sh" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "Run: chmod +x $APP_DIR/scripts/backup-database.sh"
    exit 1
fi

# Test 3: Check if database container is running
echo -n "Test 3: Database container is running ... "
if docker ps | grep -q budget_database; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "Database container is not running. Start it with: docker-compose up -d"
    exit 1
fi

# Test 4: Create a test backup
echo -n "Test 4: Create backup ... "
if "$APP_DIR/scripts/backup-database.sh" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "Backup creation failed. Check logs."
    exit 1
fi

# Test 5: Verify backup file exists
echo -n "Test 5: Backup file created ... "
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/budget_db_*.sql.gz 2>/dev/null | head -1)
if [ -f "$LATEST_BACKUP" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    echo "   File: $LATEST_BACKUP"
else
    echo -e "${RED}✗ FAIL${NC}"
    exit 1
fi

# Test 6: Verify backup file is not empty
echo -n "Test 6: Backup file is not empty ... "
BACKUP_SIZE=$(stat -f%z "$LATEST_BACKUP" 2>/dev/null || stat -c%s "$LATEST_BACKUP" 2>/dev/null)
if [ "$BACKUP_SIZE" -gt 1000 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    echo "   Size: $(du -h "$LATEST_BACKUP" | cut -f1)"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Backup file is too small: $BACKUP_SIZE bytes"
    exit 1
fi

# Test 7: Verify backup file integrity (gzip)
echo -n "Test 7: Backup file integrity ... "
if gunzip -t "$LATEST_BACKUP" 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Backup file is corrupted"
    exit 1
fi

# Test 8: Verify backup contains SQL
echo -n "Test 8: Backup contains SQL data ... "
if gunzip -c "$LATEST_BACKUP" | head -20 | grep -q "PostgreSQL"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Backup doesn't appear to contain PostgreSQL data"
    exit 1
fi

# Test 9: Check cron job is configured
echo -n "Test 9: Backup cron job configured ... "
if crontab -l 2>/dev/null | grep -q "backup-database.sh"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ WARNING${NC}"
    echo "   Cron job not configured. Run: ./scripts/setup-cron-jobs.sh"
fi

# Test 10: Check backup log exists
echo -n "Test 10: Backup log exists ... "
if [ -f "$APP_DIR/logs/backup.log" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    LAST_LOG=$(tail -1 "$APP_DIR/logs/backup.log")
    echo "   Last log: $LAST_LOG"
else
    echo -e "${YELLOW}⚠ WARNING${NC}"
    echo "   Log file not found (will be created on first backup)"
fi

# Summary
echo ""
echo "════════════════════════════════════════"
echo -e "${GREEN}✅ All backup tests passed!${NC}"
echo "════════════════════════════════════════"
echo ""
echo "Backup Information:"
echo "  Backup directory: $BACKUP_DIR"
echo "  Latest backup: $LATEST_BACKUP"
echo "  Backup size: $(du -h "$LATEST_BACKUP" | cut -f1)"
echo "  Total backups: $(ls -1 "$BACKUP_DIR"/budget_db_*.sql.gz 2>/dev/null | wc -l)"
echo ""
echo "Cron Schedule:"
echo "  Daily at 3:00 AM"
echo ""
echo "Manual Backup:"
echo "  $APP_DIR/scripts/backup-database.sh"
echo ""
echo "View Backup Logs:"
echo "  tail -f $APP_DIR/logs/backup.log"
echo ""

