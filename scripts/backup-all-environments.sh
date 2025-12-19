#!/bin/bash

# Comprehensive Backup Script for All Environments
# Run this script on TEST VM (20.224.194.131)
# Creates backups of both Test and Production databases and code

set -e

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
PROD_SERVER="obiwan@test.budgetapp.site"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Starting comprehensive backup process...${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📦 1. Creating test VM code backup...${NC}"
# Backup test VM code (excluding node_modules, logs, etc.)
tar -czf "$BACKUP_DIR/test_code_backup_$DATE.tar.gz" \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='uploads-*' \
    --exclude='.git' \
    --exclude='backups' \
    --exclude='*.log' \
    .

echo -e "${GREEN}✅ Test VM code backup created: test_code_backup_$DATE.tar.gz${NC}"

echo -e "${YELLOW}📊 2. Backing up Production database...${NC}"
# Production database backup
ssh $PROD_SERVER "cd ~/budgetapp && docker exec budget_database_prod pg_dump -U budget_admin -d budget_app_prod --clean --if-exists > /tmp/prod_backup_$DATE.sql"
scp $PROD_SERVER:/tmp/prod_backup_$DATE.sql "$BACKUP_DIR/"
ssh $PROD_SERVER "rm /tmp/prod_backup_$DATE.sql"

echo -e "${GREEN}✅ Production database backup created: prod_backup_$DATE.sql${NC}"

echo -e "${YELLOW}🧪 3. Backing up Test database (local)...${NC}"
# Test database backup (local on test VM)
docker exec budget_database_test pg_dump -U budget_admin -d budget_app_test --clean --if-exists > "$BACKUP_DIR/test_backup_$DATE.sql"

echo -e "${GREEN}✅ Test database backup created: test_backup_$DATE.sql${NC}"

echo -e "${YELLOW}📋 4. Creating backup manifest...${NC}"
# Create backup manifest
cat > "$BACKUP_DIR/backup_manifest_$DATE.txt" << EOF
Backup Created: $(date)
Backup ID: $DATE
Created on: Test VM (20.224.194.131)

Files included:
- test_code_backup_$DATE.tar.gz (Test VM codebase)
- prod_backup_$DATE.sql (Production database)
- test_backup_$DATE.sql (Test database)

Production Server: $PROD_SERVER
Test Server: Local (this VM)

To restore:
1. Code: tar -xzf test_code_backup_$DATE.tar.gz
2. Production DB: ssh $PROD_SERVER "cd ~/budgetapp && docker exec -i budget_database_prod psql -U budget_admin -d budget_app_prod < /tmp/prod_backup_$DATE.sql"
3. Test DB: docker exec -i budget_database_test psql -U budget_admin -d budget_app_test < test_backup_$DATE.sql

Backup sizes:
$(ls -lh $BACKUP_DIR/*$DATE* | awk '{print $5 " " $9}')
EOF

echo -e "${GREEN}✅ Backup manifest created: backup_manifest_$DATE.txt${NC}"

echo -e "${YELLOW}📊 5. Backup summary:${NC}"
echo "Backup Directory: $BACKUP_DIR"
echo "Backup ID: $DATE"
echo ""
echo "Files created:"
ls -lh "$BACKUP_DIR"/*$DATE*

echo ""
echo -e "${GREEN}🎉 Comprehensive backup completed successfully!${NC}"
echo -e "${YELLOW}💡 Tip: Keep these backups safe before making any changes${NC}"

# Optional: Clean up old backups (keep last 5)
echo -e "${YELLOW}🧹 Cleaning up old backups (keeping last 5)...${NC}"
cd "$BACKUP_DIR"
ls -t backup_manifest_*.txt | tail -n +6 | while read manifest; do
    backup_id=$(echo $manifest | sed 's/backup_manifest_\(.*\)\.txt/\1/')
    echo "Removing old backup: $backup_id"
    rm -f *$backup_id*
done

echo -e "${GREEN}✅ Backup process complete! Ready for development.${NC}"