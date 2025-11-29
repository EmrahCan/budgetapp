#!/bin/bash
# Budget App - Database Restore Script
# Restores database from a backup file

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Usage: $0 <backup-file>${NC}"
    echo ""
    echo "Available backups:"
    ls -lh "$HOME/budget-app/backups/"budget_db_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Load environment variables
if [ -f "$HOME/budget-app/.env" ]; then
    export $(cat "$HOME/budget-app/.env" | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

echo -e "${YELLOW}╔════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   DATABASE RESTORE - DANGER ZONE               ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${RED}⚠️  WARNING: This will REPLACE the current database!${NC}"
echo ""
echo "Backup file: $BACKUP_FILE"
echo "Database: ${DB_NAME:-budget_app}"
echo ""
read -p "Are you absolutely sure? Type 'yes' to continue: " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo ""
echo -e "${YELLOW}Creating safety backup before restore...${NC}"
SAFETY_BACKUP="$HOME/budget-app/backups/before_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
docker exec budget_database pg_dump \
    -U "${DB_USER:-budget_admin}" \
    -d "${DB_NAME:-budget_app}" \
    | gzip > "$SAFETY_BACKUP"
echo -e "${GREEN}✓ Safety backup created: $SAFETY_BACKUP${NC}"

echo ""
echo -e "${YELLOW}Stopping backend to prevent connections...${NC}"
docker-compose -f "$HOME/budget-app/docker-compose.yml" stop backend

echo ""
echo -e "${YELLOW}Restoring database...${NC}"

# Restore database
gunzip < "$BACKUP_FILE" | docker exec -i budget_database psql \
    -U "${DB_USER:-budget_admin}" \
    -d "${DB_NAME:-budget_app}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restored successfully${NC}"
else
    echo -e "${RED}❌ Database restore failed${NC}"
    echo "Attempting to restore from safety backup..."
    gunzip < "$SAFETY_BACKUP" | docker exec -i budget_database psql \
        -U "${DB_USER:-budget_admin}" \
        -d "${DB_NAME:-budget_app}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Starting backend...${NC}"
docker-compose -f "$HOME/budget-app/docker-compose.yml" start backend

# Wait for backend to be healthy
echo "Waiting for backend to be healthy..."
sleep 10

# Check health
if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed, but restore completed${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Database Restore Complete!                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo "Restored from: $BACKUP_FILE"
echo "Safety backup: $SAFETY_BACKUP"
echo ""
echo -e "${YELLOW}⚠️  Please verify the application is working correctly${NC}"
