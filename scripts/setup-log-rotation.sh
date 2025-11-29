#!/bin/bash
# Budget App - Setup Log Rotation
# Configures logrotate for application logs

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Setting up log rotation for Budget App...${NC}"
echo ""

# Application directory
APP_DIR="$HOME/budgetapp"

# Create logrotate configuration
LOGROTATE_CONF="/etc/logrotate.d/budgetapp"

echo "Creating logrotate configuration..."

# Create logrotate config (requires sudo)
sudo tee "$LOGROTATE_CONF" > /dev/null << 'EOF'
# Budget App Log Rotation Configuration

# Backend logs
/home/*/budgetapp/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 obiwan obiwan
    sharedscripts
    postrotate
        # Reload backend if needed (optional)
        docker exec budget_backend kill -USR1 1 2>/dev/null || true
    endscript
}

# Nginx logs
/home/*/budgetapp/nginx/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 obiwan obiwan
    sharedscripts
    postrotate
        # Reload nginx to reopen log files
        docker exec budget_nginx nginx -s reopen 2>/dev/null || true
    endscript
}

# Monitoring logs
/home/*/budgetapp/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 obiwan obiwan
}

# Cron logs
/home/*/budgetapp/logs/cron.log {
    weekly
    rotate 4
    compress
    delaycompress
    missingok
    notifempty
    create 0644 obiwan obiwan
}
EOF

echo -e "${GREEN}✓ Logrotate configuration created${NC}"

# Test logrotate configuration
echo ""
echo "Testing logrotate configuration..."
if sudo logrotate -d "$LOGROTATE_CONF" 2>&1 | grep -q "error"; then
    echo -e "${RED}❌ Logrotate configuration has errors${NC}"
    sudo logrotate -d "$LOGROTATE_CONF"
    exit 1
else
    echo -e "${GREEN}✓ Logrotate configuration is valid${NC}"
fi

# Create log directories if they don't exist
echo ""
echo "Creating log directories..."
mkdir -p "$APP_DIR/backend/logs"
mkdir -p "$APP_DIR/nginx/logs"
mkdir -p "$APP_DIR/logs"

echo -e "${GREEN}✓ Log directories created${NC}"

echo ""
echo -e "${GREEN}✅ Log rotation setup complete!${NC}"
echo ""
echo "Configuration details:"
echo "  - Logs rotate: Daily"
echo "  - Keep: 7 days"
echo "  - Compression: Yes (delayed by 1 day)"
echo "  - Config file: $LOGROTATE_CONF"
echo ""
echo "Manual rotation test:"
echo "  sudo logrotate -f $LOGROTATE_CONF"
echo ""
echo "View logrotate status:"
echo "  cat /var/lib/logrotate/status"

