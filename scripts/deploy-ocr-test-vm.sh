#!/bin/bash

# OCR Feature Deployment Script for Test VM
# This script deploys the OCR feature to the test environment

set -e

echo "🚀 Starting OCR Feature Deployment to Test VM..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
TEST_VM_IP="20.224.194.131"
TEST_VM_USER="obiwan"
PROJECT_DIR="/home/obiwan/budget-app"

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "  Test VM: $TEST_VM_IP"
echo "  User: $TEST_VM_USER"
echo "  Project Dir: $PROJECT_DIR"
echo ""

# Step 1: Check if we can connect to Test VM
echo -e "${YELLOW}🔍 Step 1: Checking connection to Test VM...${NC}"
if ssh -o ConnectTimeout=5 ${TEST_VM_USER}@${TEST_VM_IP} "echo 'Connection successful'" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to Test VM${NC}"
    echo "Please check:"
    echo "  1. SSH key is configured"
    echo "  2. Test VM is running"
    echo "  3. Network connection is available"
    exit 1
fi

# Step 2: Copy new files to Test VM
echo -e "${YELLOW}📦 Step 2: Copying OCR files to Test VM...${NC}"

# Backend files
echo "  Copying backend OCR service..."
scp backend/services/ocrService.js ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/backend/services/

echo "  Copying backend OCR controller..."
scp backend/controllers/ocrController.js ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/backend/controllers/

echo "  Copying backend OCR routes..."
scp backend/routes/ocr.js ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/backend/routes/

echo "  Copying updated server.js..."
scp backend/server.js ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/backend/

# Frontend files
echo "  Copying frontend OCR components..."
ssh ${TEST_VM_USER}@${TEST_VM_IP} "mkdir -p ${PROJECT_DIR}/frontend/src/components/ocr"
scp frontend/src/components/ocr/ReceiptScanner.js ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/frontend/src/components/ocr/
scp frontend/src/components/ocr/ReceiptScanner.css ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/frontend/src/components/ocr/

echo "  Copying updated SmartTransactionForm..."
scp frontend/src/components/transactions/SmartTransactionForm.js ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/frontend/src/components/transactions/

# Configuration files
echo "  Copying updated docker-compose.test.yml..."
scp docker-compose.test.yml ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/docker-compose.yml

echo "  Copying updated .env.test.template..."
scp .env.test.template ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/.env.template

echo -e "${GREEN}✅ Files copied successfully${NC}"

# Step 3: Update environment variables
echo -e "${YELLOW}⚙️  Step 3: Updating environment variables...${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << 'ENDSSH'
cd /home/obiwan/budget-app

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found, creating from template..."
    cp .env.template .env
    echo "⚠️  Please update .env with actual values (especially GEMINI_API_KEY)"
else
    # Add OCR variables if they don't exist
    if ! grep -q "OCR_ENABLED" .env; then
        echo "" >> .env
        echo "# OCR Configuration" >> .env
        echo "OCR_ENABLED=true" >> .env
        echo "OCR_MAX_FILE_SIZE=5242880" >> .env
        echo "OCR_RATE_LIMIT=20" >> .env
        echo "OCR_RATE_LIMIT_WINDOW=900000" >> .env
        echo "✅ OCR variables added to .env"
    else
        echo "✅ OCR variables already exist in .env"
    fi
fi
ENDSSH

echo -e "${GREEN}✅ Environment variables updated${NC}"

# Step 4: Rebuild and restart containers
echo -e "${YELLOW}🔨 Step 4: Rebuilding and restarting containers...${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << 'ENDSSH'
cd /home/obiwan/budget-app

echo "  Stopping containers..."
docker-compose down

echo "  Rebuilding backend..."
docker-compose build backend

echo "  Rebuilding frontend..."
docker-compose build frontend

echo "  Starting containers..."
docker-compose up -d

echo "  Waiting for services to be healthy..."
sleep 10

# Check container status
echo "  Container status:"
docker-compose ps
ENDSSH

echo -e "${GREEN}✅ Containers rebuilt and restarted${NC}"

# Step 5: Verify deployment
echo -e "${YELLOW}🔍 Step 5: Verifying deployment...${NC}"
sleep 5

# Check backend health
echo "  Checking backend health..."
if curl -f http://${TEST_VM_IP}/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}⚠️  Backend health check failed${NC}"
fi

# Check OCR endpoint
echo "  Checking OCR endpoint..."
if curl -f http://${TEST_VM_IP}/api/ocr/supported-formats -H "Authorization: Bearer test" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OCR endpoint is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  OCR endpoint check failed (might need authentication)${NC}"
fi

# Check frontend
echo "  Checking frontend..."
if curl -f http://${TEST_VM_IP}/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}⚠️  Frontend check failed${NC}"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}🎉 OCR Feature Deployment Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "📝 Next Steps:"
echo "  1. Test the OCR feature at: http://${TEST_VM_IP}"
echo "  2. Go to Transactions > Add Transaction"
echo "  3. Click '📷 Fiş Tara (OCR)' button"
echo "  4. Upload a receipt image or take a photo"
echo "  5. Verify the extracted data"
echo ""
echo "📊 Monitoring:"
echo "  - Backend logs: ssh ${TEST_VM_USER}@${TEST_VM_IP} 'docker logs budget_backend_test -f'"
echo "  - Frontend logs: ssh ${TEST_VM_USER}@${TEST_VM_IP} 'docker logs budget_frontend_test -f'"
echo "  - Nginx logs: ssh ${TEST_VM_USER}@${TEST_VM_IP} 'docker logs budget_nginx_test -f'"
echo ""
echo "⚠️  Important:"
echo "  - Make sure GEMINI_API_KEY is set in .env on Test VM"
echo "  - OCR requires valid Gemini API key to work"
echo "  - Check backend logs if OCR fails"
echo ""
