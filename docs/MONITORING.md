# Budget App - Monitoring Guide

This guide explains how to monitor the Budget App infrastructure and application.

## Overview

Monitoring includes:
- System resources (CPU, memory, disk)
- Container health
- Application logs
- Backup status
- Performance metrics

## Monitoring Scripts

### 1. Resource Monitoring

**Script:** `scripts/monitor-resources.sh`

Monitors system resources and alerts on thresholds:
- Disk usage > 80%
- Memory usage > 90%
- CPU usage > 80%
- Unhealthy containers
- Missing containers

**Run manually:**
```bash
./scripts/monitor-resources.sh
```

**Automated:** Runs every 5 minutes via cron

**Logs:** `logs/monitoring.log`

### 2. Health Checks

**Script:** `scripts/check-health.sh`

Checks if all services are responding:
- Nginx health endpoint
- Backend API health
- Frontend loading
- Database connection
- Container status

**Run manually:**
```bash
./scripts/check-health.sh
```

**Automated:** Runs every 5 minutes via cron

**Logs:** `logs/health-check.log`

### 3. Backup Status

**Script:** `scripts/check-backup-status.sh`

Monitors backup health:
- Backup age (alerts if > 26 hours)
- Backup count (alerts if < 3)
- Backup integrity
- Backup size

**Run manually:**
```bash
./scripts/check-backup-status.sh
```

**Logs:** `logs/backup.log`

## Monitoring Dashboard

### Quick Status Check

```bash
# All-in-one status
echo "=== System Resources ==="
./scripts/monitor-resources.sh

echo ""
echo "=== Service Health ==="
./scripts/check-health.sh

echo ""
echo "=== Backup Status ==="
./scripts/check-backup-status.sh

echo ""
echo "=== Container Stats ==="
docker stats --no-stream
```

### Create Monitoring Dashboard Script

Save as `scripts/dashboard.sh`:

```bash
#!/bin/bash
# Quick monitoring dashboard

clear
echo "╔════════════════════════════════════════╗"
echo "║   Budget App - Monitoring Dashboard   ║"
echo "╚════════════════════════════════════════╝"
echo ""

# System Info
echo "System: $(hostname)"
echo "Time: $(date)"
echo ""

# Resources
echo "--- Resources ---"
df -h / | awk 'NR==2 {print "Disk: " $5 " used"}'
free -h | awk 'NR==2 {print "Memory: " $3 "/" $2}'
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"
echo ""

# Containers
echo "--- Containers ---"
docker ps --format "{{.Names}}: {{.Status}}" | grep budget
echo ""

# Recent Errors
echo "--- Recent Errors (last 5) ---"
docker-compose logs --tail=100 2>&1 | grep -i "error" | tail -5 || echo "No recent errors"
echo ""

# Backup
echo "--- Latest Backup ---"
ls -lh ~/budgetapp/backups/budget_db_*.sql.gz 2>/dev/null | tail -1 | awk '{print $9 " (" $5 ")"}'
echo ""
```

## Metrics to Monitor

### System Metrics

**Disk Usage:**
```bash
df -h /
```
- Alert if > 80%
- Action: Clean up old logs, Docker images

**Memory Usage:**
```bash
free -h
```
- Alert if > 90%
- Action: Restart containers, upgrade VM

**CPU Usage:**
```bash
top -bn1 | grep "Cpu(s)"
```
- Alert if > 80% sustained
- Action: Optimize queries, scale VM

### Container Metrics

**Container Status:**
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.State}}"
```
- All containers should be "Up" and "healthy"

**Container Resources:**
```bash
docker stats --no-stream
```
- Monitor CPU and memory per container

**Container Logs:**
```bash
docker-compose logs --tail=50
```
- Check for errors and warnings

### Application Metrics

**API Response Time:**
```bash
curl -w "@-" -o /dev/null -s http://localhost/api/health <<'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
      time_redirect:  %{time_redirect}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
EOF
```
- Should be < 1 second

**Request Rate:**
```bash
# Count requests in last hour
grep "$(date +%d/%b/%Y:%H)" nginx/logs/access.log | wc -l
```

**Error Rate:**
```bash
# Count 5xx errors in last hour
grep "$(date +%d/%b/%Y:%H)" nginx/logs/access.log | grep " 5[0-9][0-9] " | wc -l
```

### Database Metrics

**Database Size:**
```bash
docker exec budget_database psql -U budget_admin -d budget_app -c "\l+"
```

**Active Connections:**
```bash
docker exec budget_database psql -U budget_admin -d budget_app -c "SELECT count(*) FROM pg_stat_activity;"
```

**Slow Queries:**
```bash
grep "duration" backend/logs/performance.log | awk '$NF > 1000' | tail -10
```

## Alerting

### Email Alerts (Future Enhancement)

Configure email alerts in monitoring scripts:

```bash
# In monitor-resources.sh
send_alert() {
    local subject="$1"
    local message="$2"
    echo "$message" | mail -s "$subject" admin@example.com
}
```

### Slack Alerts (Future Enhancement)

```bash
send_slack_alert() {
    local message="$1"
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"$message\"}" \
        YOUR_SLACK_WEBHOOK_URL
}
```

## Log Analysis

### Find Errors

```bash
# Backend errors
grep -i "error" backend/logs/combined.log | tail -20

# Nginx errors
grep -i "error" nginx/logs/error.log | tail -20

# All container errors
docker-compose logs | grep -i "error" | tail -20
```

### Analyze Traffic

```bash
# Top 10 requested URLs
awk '{print $7}' nginx/logs/access.log | sort | uniq -c | sort -rn | head -10

# Top 10 IPs
awk '{print $1}' nginx/logs/access.log | sort | uniq -c | sort -rn | head -10

# Status code distribution
awk '{print $9}' nginx/logs/access.log | sort | uniq -c | sort -rn
```

### Performance Analysis

```bash
# Slowest API endpoints
grep "duration" backend/logs/combined.log | \
    jq -r '[.path, .duration] | @tsv' | \
    sort -k2 -rn | head -10

# Average response time
awk '{print $NF}' nginx/logs/access.log | \
    awk '{sum+=$1; count++} END {print sum/count}'
```

## Automated Monitoring

### Cron Jobs

Monitoring runs automatically via cron:

```bash
# View cron jobs
crontab -l

# Expected jobs:
# */5 * * * * ~/budgetapp/scripts/monitor-resources.sh
# */5 * * * * ~/budgetapp/scripts/check-health.sh
# 0 3 * * * ~/budgetapp/scripts/backup-database.sh
```

### View Cron Logs

```bash
tail -f ~/budgetapp/logs/cron.log
```

## Monitoring Checklist

### Daily

- [ ] Check system resources
- [ ] Review error logs
- [ ] Verify all containers are healthy
- [ ] Check backup status

### Weekly

- [ ] Review performance metrics
- [ ] Analyze traffic patterns
- [ ] Check disk space trends
- [ ] Review security logs

### Monthly

- [ ] Review and optimize slow queries
- [ ] Update monitoring thresholds
- [ ] Test backup restoration
- [ ] Review and update documentation

## Monitoring Tools

### Built-in Tools

- `docker stats` - Container resource usage
- `docker logs` - Container logs
- `top` / `htop` - System processes
- `df` - Disk usage
- `free` - Memory usage
- `netstat` - Network connections

### Log Viewer

```bash
./scripts/view-logs.sh
```

Interactive menu to view different logs.

### External Tools (Future)

Consider integrating:
- **Prometheus** - Metrics collection
- **Grafana** - Visualization
- **ELK Stack** - Log aggregation
- **Datadog** - Full monitoring suite
- **New Relic** - APM

## Best Practices

1. **Regular Monitoring:** Check dashboards daily
2. **Set Alerts:** Configure alerts for critical metrics
3. **Log Retention:** Keep logs for at least 7 days
4. **Backup Monitoring:** Verify backups daily
5. **Performance Baseline:** Establish normal performance metrics
6. **Documentation:** Document any incidents and resolutions
7. **Proactive:** Fix issues before they become critical

## Troubleshooting

If monitoring scripts fail:

1. **Check script permissions:**
   ```bash
   chmod +x scripts/*.sh
   ```

2. **Check cron is running:**
   ```bash
   sudo systemctl status cron
   ```

3. **Check log directories exist:**
   ```bash
   mkdir -p ~/budgetapp/logs
   ```

4. **Run scripts manually to see errors:**
   ```bash
   ./scripts/monitor-resources.sh
   ```

## Next Steps

- Set up external monitoring service
- Configure email/Slack alerts
- Create Grafana dashboards
- Implement APM (Application Performance Monitoring)
- Set up log aggregation

