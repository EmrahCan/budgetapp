#!/bin/bash
# Budget App - Setup Cron Jobs
# This script sets up automated tasks for monitoring, backups, and maintenance

set -e

echo "Setting up cron jobs for Budget App..."
echo ""

# Get the application directory
APP_DIR="$HOME/budget-app"

# Create a temporary cron file
CRON_FILE=$(mktemp)

# Get existing cron jobs (if any)
crontab -l > "$CRON_FILE" 2>/dev/null || true

# Remove old Budget App cron jobs
sed -i '/# Budget App/d' "$CRON_FILE"
sed -i '/budget-app/d' "$CRON_FILE"

# Add new cron jobs
cat >> "$CRON_FILE" <<EOF

# Budget App - Automated Tasks
# ==============================

# Monitor resources every 5 minutes
*/5 * * * * $APP_DIR/scripts/monitor-resources.sh >> $APP_DIR/logs/cron.log 2>&1

# Health check every 2 minutes
*/2 * * * * $APP_DIR/scripts/check-health.sh >> $APP_DIR/logs/health-check.log 2>&1

# Daily database backup at 3 AM
0 3 * * * $APP_DIR/scripts/backup-database.sh >> $APP_DIR/logs/backup.log 2>&1

# Weekly Docker cleanup on Sunday at 2 AM
0 2 * * 0 docker system prune -f >> $APP_DIR/logs/docker-cleanup.log 2>&1

# SSL certificate renewal check daily at 2:30 AM
30 2 * * * certbot renew --quiet && docker-compose -f $APP_DIR/docker-compose.yml restart nginx >> $APP_DIR/logs/ssl-renewal.log 2>&1

# Log rotation weekly on Monday at 1 AM
0 1 * * 1 find $APP_DIR/logs -name "*.log" -mtime +7 -delete >> $APP_DIR/logs/cleanup.log 2>&1

EOF

# Install the new cron jobs
crontab "$CRON_FILE"

# Clean up
rm "$CRON_FILE"

echo "✅ Cron jobs installed successfully!"
echo ""
echo "Installed jobs:"
echo "  - Resource monitoring: Every 5 minutes"
echo "  - Health checks: Every 2 minutes"
echo "  - Database backup: Daily at 3:00 AM"
echo "  - Docker cleanup: Weekly on Sunday at 2:00 AM"
echo "  - SSL renewal: Daily at 2:30 AM"
echo "  - Log rotation: Weekly on Monday at 1:00 AM"
echo ""
echo "View cron jobs: crontab -l"
echo "View cron logs: tail -f $APP_DIR/logs/cron.log"
