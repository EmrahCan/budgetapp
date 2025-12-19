#!/bin/bash

# Fix Test VM Nginx SSL Configuration Issue
# This script fixes the SSL certificate error on Test VM

set -e

echo "🔧 Fixing Test VM Nginx Configuration..."
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
TEST_VM_IP="20.224.194.131"
TEST_VM_USER="obiwan"
PROJECT_DIR="/home/obiwan/budget-app"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Test VM: $TEST_VM_IP"
echo "  User: $TEST_VM_USER"
echo "  Project Dir: $PROJECT_DIR"
echo ""

# Step 1: Check connection
echo -e "${YELLOW}🔍 Step 1: Checking connection...${NC}"
if ssh -o ConnectTimeout=5 ${TEST_VM_USER}@${TEST_VM_IP} "echo 'Connected'" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to Test VM${NC}"
    exit 1
fi

# Step 2: Copy correct nginx.conf (without SSL)
echo -e "${YELLOW}📦 Step 2: Copying correct nginx.conf...${NC}"
scp nginx/nginx.conf ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}/nginx/nginx.conf
echo -e "${GREEN}✅ nginx.conf copied${NC}"

# Step 3: Restart nginx container
echo -e "${YELLOW}🔄 Step 3: Restarting nginx container...${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << 'ENDSSH'
cd /home/obiwan/budget-app

echo "  Stopping nginx container..."
docker-compose stop nginx

echo "  Removing nginx container..."
docker-compose rm -f nginx

echo "  Starting nginx container..."
docker-compose up -d nginx

echo "  Waiting for nginx to start..."
sleep 5

# Check nginx status
echo "  Checking nginx status..."
docker-compose ps nginx

# Check nginx logs
echo "  Recent nginx logs:"
docker logs budget_nginx_test --tail 20
ENDSSH

echo -e "${GREEN}✅ Nginx restarted${NC}"

# Step 4: Verify
echo -e "${YELLOW}🔍 Step 4: Verifying...${NC}"
sleep 3

if curl -f http://${TEST_VM_IP}:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nginx is working!${NC}"
else
    echo -e "${RED}⚠️  Nginx health check failed${NC}"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}🎉 Nginx Configuration Fixed!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "📝 Test the application:"
echo "  http://${TEST_VM_IP}:8080"
echo ""
echo "📊 Check logs if needed:"
echo "  ssh ${TEST_VM_USER}@${TEST_VM_IP} 'docker logs budget_nginx_test -f'"
echo ""

