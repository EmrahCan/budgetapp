#!/bin/bash

# Production Database'i Test VM'e Sync Script
set -e

PROD_SERVER="obiwan@4.210.196.73"
TEST_SERVER="obiwan@20.224.194.131"
BACKUP_FILE="/tmp/budget_prod_backup_$(date +%Y%m%d_%H%M%S).sql"

echo "=== Database Sync: Production -> Test VM ==="
echo ""

echo "Step 1: Production'dan database backup al..."
ssh $PROD_SERVER "cd /home/obiwan/budget && docker-compose exec -T database pg_dump -U budget_admin -d budget_app_prod --clean --if-exists" > $BACKUP_FILE

echo "Step 2: Backup dosyasını test VM'e kopyala..."
scp $BACKUP_FILE $TEST_SERVER:$BACKUP_FILE

echo "Step 3: Test VM'de database'i restore et..."
ssh $TEST_SERVER "cd /home/obiwan/budget-app && docker-compose exec -T database psql -U budget_admin -d budget_app_prod < $BACKUP_FILE"

echo "Step 4: Geçici dosyaları temizle..."
ssh $TEST_SERVER "rm -f $BACKUP_FILE"
rm -f $BACKUP_FILE

echo ""
echo "✅ Database sync tamamlandı!"
echo ""
echo "Test VM'de database'i kontrol et:"
echo "  ssh $TEST_SERVER 'cd /home/obiwan/budget-app && docker-compose exec database psql -U budget_admin -d budget_app_prod -c \"SELECT COUNT(*) FROM users\"'"
