#!/bin/bash

# Fix Test VM Login Issue - Mixed Content Error
# Updates .env and rebuilds frontend with correct HTTPS API URL

set -e

echo "🔧 Fixing Test VM Login Issue..."
echo "================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
TEST_VM_IP="20.224.194.131"
TEST_VM_USER="obiwan"
PROJECT_DIR="/home/obiwan/budget-app"

echo -e "${YELLOW}Problem: Mixed Content Error${NC}"
echo "  - Site loads via HTTPS: https://test.budgetapp.site"
echo "  - Frontend tries HTTP API: http://20.224.194.131/api"
echo "  - Browser blocks HTTP requests from HTTPS pages"
echo ""
echo -e "${YELLOW}Solution: Update API URL to HTTPS${NC}"
echo ""

# Step 1: Check connection
echo -e "${YELLOW}🔍 Step 1: Checking connection...${NC}"
if ssh -o ConnectTimeout=5 ${TEST_VM_USER}@${TEST_VM_IP} "echo 'Connected'" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connected to Test VM${NC}"
else
    echo -e "${RED}❌ Cannot connect to Test VM${NC}"
    exit 1
fi

# Step 2: Copy updated .env template
echo -e "${YELLOW}📦 Step 2: Copying updated .env template...${NC}"
scp budget/.env.test.template ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/.env.template
echo -e "${GREEN}✅ Template copied${NC}"

# Step 3: Update .env on Test VM
echo -e "${YELLOW}⚙️  Step 3: Updating .env file on Test VM...${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << 'ENDSSH'
cd /home/obiwan/budget-app

# Backup current .env
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backed up current .env"
fi

# Update API URLs in .env
echo "📝 Updating API URLs..."

# Remove old URL settings
sed -i '/^FRONTEND_URL=/d' .env 2>/dev/null || true
sed -i '/^REACT_APP_API_URL=/d' .env 2>/dev/null || true
sed -i '/^ALLOWED_ORIGINS=/d' .env 2>/dev/null || true

# Add new HTTPS URLs
cat >> .env << 'EOF'

# URLs - Updated for Cloudflare HTTPS
FRONTEND_URL=https://test.budgetapp.site
REACT_APP_API_URL=https://test.budgetapp.site/api
ALLOWED_ORIGINS=https://test.budgetapp.site,http://test.budgetapp.site,http://20.224.194.131,https://20.224.194.131
EOF

echo "✅ .env updated with HTTPS URLs"
echo ""
echo "Current API configuration:"
grep -E "FRONTEND_URL|REACT_APP_API_URL|ALLOWED_ORIGINS" .env
ENDSSH

echo -e "${GREEN}✅ .env updated${NC}"

# Step 4: Update backend CORS
echo -e "${YELLOW}🔄 Step 4: Updating backend CORS settings...${NC}"
scp budget/backend/server.js ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/backend/server.js
echo -e "${GREEN}✅ Backend updated${NC}"

# Step 5: Rebuild frontend with new API URL
echo -e "${YELLOW}🔨 Step 5: Rebuilding frontend...${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << 'ENDSSH'
cd /home/obiwan/budget-app

echo "  Stopping containers..."
docker-compose stop frontend backend

echo "  Rebuilding frontend with HTTPS API URL..."
docker-compose build --no-cache frontend

echo "  Rebuilding backend..."
docker-compose build backend

echo "  Starting containers..."
docker-compose up -d

echo "  Waiting for services..."
sleep 15

# Check container status
echo ""
echo "Container status:"
docker-compose ps
ENDSSH

echo -e "${GREEN}✅ Containers rebuilt${NC}"

# Step 6: Verify
echo -e "${YELLOW}🔍 Step 6: Verifying fix...${NC}"
sleep 5

echo "  Checking backend health..."
if curl -f http://${TEST_VM_IP}/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}⚠️  Backend health check failed${NC}"
fi

echo "  Checking frontend..."
if curl -f http://${TEST_VM_IP}/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}⚠️  Frontend check failed${NC}"
fi

echo ""
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}🎉 Fix Complete!${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo "📝 Test the fix:"
echo "  1. Open: https://test.budgetapp.site"
echo "  2. Try to login"
echo "  3. Check browser console - no more Mixed Content errors"
echo ""
echo "🔍 If still having issues:"
echo "  - Clear browser cache (Ctrl+Shift+R)"
echo "  - Check backend logs: ssh ${TEST_VM_USER}@${TEST_VM_IP} 'docker logs budget_backend_test -f'"
echo "  - Check frontend logs: ssh ${TEST_VM_USER}@${TEST_VM_IP} 'docker logs budget_frontend_test -f'"
echo ""
echo "📊 Backend CORS should now allow:"
echo "  - https://test.budgetapp.site"
echo "  - http://test.budgetapp.site"
echo "  - http://20.224.194.131"
echo ""

