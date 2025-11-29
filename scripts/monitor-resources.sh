#!/bin/bash
# Budget App - Resource Monitoring Script
# Run this via cron every 5 minutes to monitor system resources

# Configuration
DISK_THRESHOLD=80
MEMORY_THRESHOLD=90
CPU_THRESHOLD=80
LOG_FILE="/home/azureuser/budget-app/logs/monitoring.log"
ALERT_EMAIL="admin@example.com"  # Change this to your email

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to send alert (placeholder - implement email/slack notification)
send_alert() {
    local subject="$1"
    local message="$2"
    log_message "ALERT: $subject - $message"
    # TODO: Implement email or Slack notification
    # echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
}

log_message "=== Starting resource monitoring ==="

# Check disk usage
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
log_message "Disk usage: ${DISK_USAGE}%"

if [ "$DISK_USAGE" -gt "$DISK_THRESHOLD" ]; then
    send_alert "High Disk Usage" "Disk usage is at ${DISK_USAGE}% (threshold: ${DISK_THRESHOLD}%)"
    echo -e "${RED}⚠️  High disk usage: ${DISK_USAGE}%${NC}"
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", ($3/$2) * 100.0}')
log_message "Memory usage: ${MEMORY_USAGE}%"

if [ "$MEMORY_USAGE" -gt "$MEMORY_THRESHOLD" ]; then
    send_alert "High Memory Usage" "Memory usage is at ${MEMORY_USAGE}% (threshold: ${MEMORY_THRESHOLD}%)"
    echo -e "${RED}⚠️  High memory usage: ${MEMORY_USAGE}%${NC}"
fi

# Check CPU usage (5 minute average)
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}' | cut -d. -f1)
log_message "CPU usage: ${CPU_USAGE}%"

if [ "$CPU_USAGE" -gt "$CPU_THRESHOLD" ]; then
    send_alert "High CPU Usage" "CPU usage is at ${CPU_USAGE}% (threshold: ${CPU_THRESHOLD}%)"
    echo -e "${RED}⚠️  High CPU usage: ${CPU_USAGE}%${NC}"
fi

# Check unhealthy Docker containers
UNHEALTHY_CONTAINERS=$(docker ps --filter "health=unhealthy" -q | wc -l)
log_message "Unhealthy containers: $UNHEALTHY_CONTAINERS"

if [ "$UNHEALTHY_CONTAINERS" -gt 0 ]; then
    CONTAINER_NAMES=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" | tr '\n' ', ')
    send_alert "Unhealthy Docker Containers" "Found $UNHEALTHY_CONTAINERS unhealthy container(s): $CONTAINER_NAMES"
    echo -e "${RED}⚠️  Unhealthy containers: $CONTAINER_NAMES${NC}"
fi

# Check if containers are running
EXPECTED_CONTAINERS=4  # nginx, frontend, backend, database
RUNNING_CONTAINERS=$(docker ps --filter "status=running" | grep -c budget || echo "0")
log_message "Running containers: $RUNNING_CONTAINERS/$EXPECTED_CONTAINERS"

if [ "$RUNNING_CONTAINERS" -lt "$EXPECTED_CONTAINERS" ]; then
    send_alert "Missing Docker Containers" "Expected $EXPECTED_CONTAINERS containers, but only $RUNNING_CONTAINERS are running"
    echo -e "${RED}⚠️  Missing containers: $RUNNING_CONTAINERS/$EXPECTED_CONTAINERS running${NC}"
fi

# Check Docker disk usage
DOCKER_DISK=$(docker system df --format "{{.Size}}" | head -1)
log_message "Docker disk usage: $DOCKER_DISK"

# Log container stats
log_message "Container stats:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | tee -a "$LOG_FILE"

log_message "=== Monitoring complete ==="
echo ""

# Display summary
echo -e "${GREEN}Resource Monitoring Summary:${NC}"
echo "  Disk: ${DISK_USAGE}%"
echo "  Memory: ${MEMORY_USAGE}%"
echo "  CPU: ${CPU_USAGE}%"
echo "  Containers: $RUNNING_CONTAINERS/$EXPECTED_CONTAINERS running"
echo "  Unhealthy: $UNHEALTHY_CONTAINERS"
echo ""
echo "Log file: $LOG_FILE"
