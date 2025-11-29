#!/bin/bash
# Budget App - Setup Cron Jobs
# Configures automated monitoring and backup jobs

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Setting up cron jobs for Budget App...${NC}"
echo ""

# Get the application directory
APP_DIR="$HOME/budgetapp"

if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}❌ Application directory not found: $APP_DIR${NC}"
    exit 1
fi

# Create a temporary cron file
TEMP_CRON=$(mktemp)

# Get existing crontab (if any)
crontab -l > "$TEMP_CRON" 2>/dev/null || true

# Remove old budget app cron jobs
sed -i.bak '/# Budget App/d' "$TEMP_CRON" 2>/dev/null || true
sed -i.bak '/budgetapp/d' "$TEMP_CRON" 2>/dev/null || true

# Add new cron jobs
cat >> "$TEMP_CRON" << EOF

# Budget App - Automated Jobs
# ============================

# Resource monitoring - every 5 minutes
*/5 * * * * $APP_DIR/scripts/monitor-resources.sh >> $APP_DIR/logs/cron.log 2>&1

# Health checks - every 5 minutes
*/5 * * * * $APP_DIR/scripts/check-health.sh >> $APP_DIR/logs/cron.log 2>&1

# Daily database backup - 3:00 AM
0 3 * * * $APP_DIR/scripts/backup-database.sh >> $APP_DIR/logs/cron.log 2>&1

# Weekly Docker cleanup - Sunday 4:00 AM
0 4 * * 0 cd $APP_DIR && docker system prune -f >> $APP_DIR/logs/cron.log 2>&1

# Log rotation - Daily at 2:00 AM
0 2 * * * find $APP_DIR/logs -name "*.log" -type f -mtime +7 -delete

EOF

# Install the new crontab
crontab "$TEMP_CRON"

# Clean up
rm "$TEMP_CRON"

echo -e "${GREEN}✓ Cron jobs installed successfully!${NC}"
echo ""
echo "Installed jobs:"
echo "  - Resource monitoring (every 5 minutes)"
echo "  - Health checks (every 5 minutes)"
echo "  - Database backup (daily at 3:00 AM)"
echo "  - Docker cleanup (weekly on Sunday at 4:00 AM)"
echo "  - Log rotation (daily at 2:00 AM)"
echo ""
echo "View cron jobs:"
echo "  crontab -l"
echo ""
echo "View cron logs:"
echo "  tail -f $APP_DIR/logs/cron.log"
echo ""
echo -e "${YELLOW}Note: Make sure all scripts have execute permissions:${NC}"
echo "  chmod +x $APP_DIR/scripts/*.sh"
