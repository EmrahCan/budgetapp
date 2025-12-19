#!/bin/bash

# Production'dan Test VM'e Docker Image Transfer Script
# Bu script production'daki backend image'ı test VM'e transfer eder

set -e

echo "=== Docker Image Transfer: Production -> Test VM ==="
echo ""

PROD_SERVER="obiwan@4.210.196.73"
TEST_SERVER="obiwan@20.224.194.131"
IMAGE_NAME="budgetapp-backend:latest"
TEMP_FILE="/tmp/budgetapp-backend-latest.tar.gz"

echo "Step 1: Production'dan image'ı tar.gz olarak kaydet..."
ssh $PROD_SERVER "docker save $IMAGE_NAME | gzip > $TEMP_FILE"

echo "Step 2: Tar dosyasını test VM'e kopyala..."
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
echo "✅ Transfer tamamlandı!"
echo ""
echo "Test VM'de image'ı kontrol et:"
echo "  ssh $TEST_SERVER 'docker images | grep budgetapp-backend'"
