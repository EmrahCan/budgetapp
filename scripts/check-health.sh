#!/bin/bash
# Budget App - Health Check Script
# Checks if all services are healthy and responding

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Budget App - Health Check"
echo "=========================="
echo ""

ALL_HEALTHY=true

# Check Nginx
echo -n "Checking Nginx... "
if curl -f -s http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
    ALL_HEALTHY=false
fi

# Check Backend API
echo -n "Checking Backend API... "
if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
    ALL_HEALTHY=false
fi

# Check Frontend
echo -n "Checking Frontend... "
if curl -f -s http://localhost > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
    ALL_HEALTHY=false
fi

# Check Database (via Docker)
echo -n "Checking Database... "
if docker exec budget_database pg_isready -U budget_admin > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
    ALL_HEALTHY=false
fi

# Check Docker containers
echo ""
echo "Docker Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
if [ "$ALL_HEALTHY" = true ]; then
    echo -e "${GREEN}✅ All services are healthy!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some services are unhealthy!${NC}"
    exit 1
fi
