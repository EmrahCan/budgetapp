#!/bin/bash

# Deploy OCR fix to Test VM

set -e

TEST_VM_IP="20.224.194.131"
TEST_VM_USER="obiwan"
PROJECT_DIR="/home/obiwan/budget-app"

echo "🚀 Deploying OCR fix to Test VM..."
echo ""

# Copy updated server.js
echo "📦 Copying updated server.js..."
scp budget/backend/server.js ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/backend/server.js

# Copy OCR files if not already there
echo "📦 Copying OCR files..."
ssh ${TEST_VM_USER}@${TEST_VM_IP} "mkdir -p ${PROJECT_DIR}/backend/controllers ${PROJECT_DIR}/backend/services ${PROJECT_DIR}/backend/routes"

scp budget/backend/controllers/ocrController.js ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/backend/controllers/
scp budget/backend/services/ocrService.js ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/backend/services/
scp budget/backend/routes/ocr.js ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/backend/routes/

# Restart backend
echo "🔄 Restarting backend..."
ssh ${TEST_VM_USER}@${TEST_VM_IP} "cd ${PROJECT_DIR} && docker-compose restart backend"

echo "⏳ Waiting for backend to start..."
sleep 10

# Check backend logs
echo "📊 Checking backend logs..."
ssh ${TEST_VM_USER}@${TEST_VM_IP} "docker logs budget_backend_test --tail 20"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Testing OCR endpoint..."
sleep 2
curl -s -o /dev/null -w "OCR Endpoint Status: %{http_code}\n" https://test.budgetapp.site/api/ocr/supported-formats
