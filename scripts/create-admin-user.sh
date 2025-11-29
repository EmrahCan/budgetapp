#!/bin/bash
# Budget App - Create Admin User
# Creates an admin user using the backend script

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Budget App - Create Admin User      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if backend container is running
if ! docker ps | grep -q budget_backend; then
    echo -e "${RED}❌ Backend container is not running${NC}"
    echo "Start it with: docker-compose up -d"
    exit 1
fi

# Check if database container is running
if ! docker ps | grep -q budget_database; then
    echo -e "${RED}❌ Database container is not running${NC}"
    echo "Start it with: docker-compose up -d"
    exit 1
fi

echo -e "${YELLOW}Creating admin user...${NC}"
echo ""

# Run the Node.js script inside the backend container
docker exec budget_backend node scripts/create-admin.js

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Done!                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Login at:"
echo "  Test: https://test.budgetapp.site"
echo "  Prod: https://budgetapp.site"
echo ""

