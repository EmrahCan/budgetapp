#!/bin/bash
# Budget App - Health Check Script
# Checks if all services are healthy and responding

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
LOG_FILE="$HOME/budgetapp/logs/health-check.log"
ALERT_EMAIL="admin@example.com"

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to send alert
send_alert() {
    local subject="$1"
    local message="$2"
    log_message "ALERT: $subject - $message"
    # TODO: Implement email or Slack notification
}

log_message "=== Starting health checks ==="

# Track overall health
ALL_HEALTHY=true

# Check 1: Nginx health
echo -n "Checking Nginx... "
if curl -f -s http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
    log_message "Nginx: Healthy"
else
    echo -e "${RED}✗ Unhealthy${NC}"
    log_message "Nginx: Unhealthy"
    send_alert "Nginx Health Check Failed" "Nginx is not responding"
    ALL_HEALTHY=false
fi

# Check 2: Backend API health
echo -n "Checking Backend API... "
if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
    log_message "Backend API: Healthy"
else
    echo -e "${RED}✗ Unhealthy${NC}"
    log_message "Backend API: Unhealthy"
    send_alert "Backend API Health Check Failed" "Backend API is not responding"
    ALL_HEALTHY=false
fi

# Check 3: Frontend
echo -n "Checking Frontend... "
if curl -f -s http://localhost/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
    log_message "Frontend: Healthy"
else
    echo -e "${RED}✗ Unhealthy${NC}"
    log_message "Frontend: Unhealthy"
    send_alert "Frontend Health Check Failed" "Frontend is not responding"
    ALL_HEALTHY=false
fi

# Check 4: Database connection
echo -n "Checking Database... "
if docker exec budget_database pg_isready -U budget_admin > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
    log_message "Database: Healthy"
else
    echo -e "${RED}✗ Unhealthy${NC}"
    log_message "Database: Unhealthy"
    send_alert "Database Health Check Failed" "Database is not responding"
    ALL_HEALTHY=false
fi

# Check 5: Docker containers status
echo ""
echo "Docker Containers Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.State}}" --filter "name=budget"

# Check for unhealthy containers
UNHEALTHY=$(docker ps --filter "health=unhealthy" --filter "name=budget" -q | wc -l)
if [ "$UNHEALTHY" -gt 0 ]; then
    echo -e "${RED}⚠️  Found $UNHEALTHY unhealthy container(s)${NC}"
    log_message "Unhealthy containers: $UNHEALTHY"
    ALL_HEALTHY=false
fi

# Check 6: Container resource usage
echo ""
echo "Container Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" --filter "name=budget"

# Check 7: Recent errors in logs
echo ""
echo "Recent Errors (last 10):"
docker-compose -f "$HOME/budgetapp/docker-compose.yml" logs --tail=100 2>&1 | grep -i "error" | tail -10 || echo "No recent errors found"

# Summary
echo ""
log_message "=== Health check complete ==="

if [ "$ALL_HEALTHY" = true ]; then
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   All Services Healthy ✓               ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    log_message "Overall status: All services healthy"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   Some Services Unhealthy ✗            ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    log_message "Overall status: Some services unhealthy"
    exit 1
fi
