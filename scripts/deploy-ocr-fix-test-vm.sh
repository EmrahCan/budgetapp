#!/bin/bash

# OCR Fix for Test VM
set -e

TEST_SERVER="obiwan@20.224.194.131"

echo "=== OCR Fix for Test VM ==="
echo ""

echo "Step 1: OCR dosyalarını test VM'e kopyala..."
scp budget/backend/routes/ocr.js $TEST_SERVER:/tmp/
scp budget/backend/controllers/ocrController.js $TEST_SERVER:/tmp/
scp budget/backend/services/ocrService.js $TEST_SERVER:/tmp/

echo "Step 2: Backend container'a kopyala..."
ssh $TEST_SERVER 'docker cp /tmp/ocr.js budget_backend:/app/routes/'
ssh $TEST_SERVER 'docker cp /tmp/ocrController.js budget_backend:/app/controllers/'
ssh $TEST_SERVER 'docker cp /tmp/ocrService.js budget_backend:/app/services/'

echo "Step 3: Backend'i restart et..."
ssh $TEST_SERVER 'cd /home/obiwan/budget-app && docker-compose restart backend'

echo ""
echo "✅ OCR fix tamamlandı!"
echo ""
echo "Test et:"
echo "  curl -X GET http://20.224.194.131/api/ocr/health -H \"Authorization: Bearer TOKEN\""