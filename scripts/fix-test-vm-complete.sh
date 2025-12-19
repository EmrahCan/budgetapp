#!/bin/bash

# Complete Fix for Test VM - Login and Frontend Issues
# Fixes: Missing Dockerfile, API URL, CORS

set -e

echo "🔧 Complete Test VM Fix..."
echo "=========================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
TEST_VM_IP="20.224.194.131"
TEST_VM_USER="obiwan"
PROJECT_DIR="/home/obiwan/budget-app"

echo -e "${YELLOW}Fixing:${NC}"
echo "  1. Missing frontend Dockerfile.nginx"
echo "  2. Wrong API URL (HTTP instead of HTTPS)"
echo "  3. CORS configuration"
echo ""

# Step 1: Check connection
echo -e "${YELLOW}🔍 Step 1: Checking connection...${NC}"
if ssh -o ConnectTimeout=5 ${TEST_VM_USER}@${TEST_VM_IP} "echo 'Connected'" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connected${NC}"
else
    echo -e "${RED}❌ Cannot connect${NC}"
    exit 1
fi

# Step 2: Copy all necessary files
echo -e "${YELLOW}📦 Step 2: Copying files...${NC}"

echo "  Copying frontend Dockerfile.nginx..."
scp budget/frontend/Dockerfile.nginx ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/frontend/

echo "  Copying frontend default.conf.nginx..."
scp budget/frontend/default.conf.nginx ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/frontend/

echo "  Copying docker-compose.test.yml..."
scp budget/docker-compose.test.yml ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/docker-compose.yml

echo "  Copying backend server.js..."
scp budget/backend/server.js ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/backend/

echo "  Copying .env template..."
scp budget/.env.test.template ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/.env.template

echo -e "${GREEN}✅ Files copied${NC}"

# Step 3: Update .env
echo -e "${YELLOW}⚙️  Step 3: Updating .env...${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << 'ENDSSH'
cd /home/obiwan/budget-app

# Backup
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Update URLs
sed -i '/^FRONTEND_URL=/d' .env 2>/dev/null || true
sed -i '/^REACT_APP_API_URL=/d' .env 2>/dev/null || true
sed -i '/^ALLOWED_ORIGINS=/d' .env 2>/dev/null || true

cat >> .env << 'EOF'

# URLs - HTTPS via Cloudflare
FRONTEND_URL=https://test.budgetapp.site
REACT_APP_API_URL=https://test.budgetapp.site/api
ALLOWED_ORIGINS=https://test.budgetapp.site,http://test.budgetapp.site,http://20.224.194.131,https://20.224.194.131
EOF

echo "✅ .env updated"
ENDSSH

echo -e "${GREEN}✅ .env updated${NC}"

# Step 4: Rebuild everything
echo -e "${YELLOW}🔨 Step 4: Rebuilding containers...${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << 'ENDSSH'
cd /home/obiwan/budget-app

echo "  Stopping all containers..."
docker-compose down

echo "  Removing old images..."
docker-compose rm -f

echo "  Building backend..."
docker-compose build --no-cache backend

echo "  Building frontend..."
docker-compose build --no-cache frontend

echo "  Starting all services..."
docker-compose up -d

echo "  Waiting 20 seconds for services to start..."
sleep 20

echo ""
echo "Container status:"
docker-compose ps

echo ""
echo "Backend logs (last 10 lines):"
docker logs budget_backend_test --tail 10
ENDSSH

echo -e "${GREEN}✅ Containers rebuilt${NC}"

# Step 5: Verify
echo -e "${YELLOW}🔍 Step 5: Verifying...${NC}"
sleep 5

if curl -f http://${TEST_VM_IP}/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}⚠️  Backend health check failed${NC}"
    echo "Check logs: ssh ${TEST_VM_USER}@${TEST_VM_IP} 'docker logs budget_backend_test'"
fi

if curl -f http://${TEST_VM_IP}/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}⚠️  Frontend check failed${NC}"
fi

echo ""
echo -e "${GREEN}==========================${NC}"
echo -e "${GREEN}🎉 Fix Complete!${NC}"
echo -e "${GREEN}==========================${NC}"
echo ""
echo "📝 Test now:"
echo "  1. Open: https://test.budgetapp.site"
echo "  2. Clear browser cache (Ctrl+Shift+R)"
echo "  3. Try to login"
echo ""
echo "🔍 If issues persist:"
echo "  Backend logs: ssh ${TEST_VM_USER}@${TEST_VM_IP} 'docker logs budget_backend_test -f'"
echo "  Frontend logs: ssh ${TEST_VM_USER}@${TEST_VM_IP} 'docker logs budget_frontend_test -f'"
echo "  Nginx logs: ssh ${TEST_VM_USER}@${TEST_VM_IP} 'docker logs budget_nginx_test -f'"
echo ""

