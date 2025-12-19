#!/bin/bash

# Production'dan Test VM'e Frontend Image Transfer Script
set -e

PROD_SERVER="obiwan@4.210.196.73"
TEST_SERVER="obiwan@20.224.194.131"
IMAGE_NAME="budgetapp-frontend:latest"
TEMP_FILE="/tmp/budgetapp-frontend-latest.tar.gz"

echo "=== Frontend Image Transfer: Production -> Test VM ==="
echo ""

echo "Step 1: Production'dan frontend image'ı tar.gz olarak kaydet..."
ssh $PROD_SERVER "docker save $IMAGE_NAME | gzip > $TEMP_FILE"

echo "Step 2: Tar dosyasını local'e kopyala..."
scp $PROD_SERVER:$TEMP_FILE $TEMP_FILE

echo "Step 3: Test VM'e tar dosyasını gönder..."
scp $TEMP_FILE $TEST_SERVER:$TEMP_FILE

echo "Step 4: Test VM'de image'ı yükle..."
ssh $TEST_SERVER "gunzip -c $TEMP_FILE | docker load"

echo "Step 5: Geçici dosyaları temizle..."
ssh $PROD_SERVER "rm -f $TEMP_FILE"
ssh $TEST_SERVER "rm -f $TEMP_FILE"
rm -f $TEMP_FILE

echo ""
echo "✅ Frontend transfer tamamlandı!"
echo ""
echo "Test VM'de frontend'i restart et:"
echo "  ssh $TEST_SERVER 'cd /home/obiwan/budget-app && docker-compose restart frontend nginx'"
