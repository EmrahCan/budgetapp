# Budget App - Logging Guide

This guide explains the logging infrastructure and how to access and manage logs.

## Log Architecture

The Budget App uses a multi-layered logging approach:

1. **Application Logs** - Backend Node.js application logs (Winston)
2. **Nginx Logs** - Web server access and error logs
3. **Docker Logs** - Container-level logs
4. **System Logs** - Monitoring and health check logs

## Log Locations

### Backend Application Logs

Located in `backend/logs/`:

- **combined.log** - All application logs (info, warn, error)
- **error.log** - Error logs only
- **performance.log** - Performance metrics and slow queries

### Nginx Logs

Located in `nginx/logs/`:

- **access.log** - HTTP request logs with detailed timing
- **error.log** - Nginx errors and warnings

### System Logs

Located in `logs/`:

- **monitoring.log** - Resource monitoring (CPU, memory, disk)
- **health-check.log** - Service health check results
- **cron.log** - Cron job execution logs

### Docker Container Logs

Accessible via Docker commands:
```bash
docker logs budget_backend
docker logs budget_frontend
docker logs budget_nginx
docker logs budget_database
```

## Log Format

### Backend Logs

JSON format with timestamps:
```json
{
  "timestamp": "2024-11-29 14:30:45",
  "level": "info",
  "message": "HTTP Request",
  "method": "GET",
  "path": "/api/transactions",
  "statusCode": 200,
  "duration": "45ms",
  "ip": "172.20.0.1",
  "userId": 123
}
```

### Nginx Access Logs

Custom detailed format:
```
172.20.0.1 - - [29/Nov/2024:14:30:45 +0000] "GET /api/transactions HTTP/1.1" 200 1234 
"https://example.com" "Mozilla/5.0..." rt=0.045 uct="0.001" uht="0.002" urt="0.042"
```

Fields:
- `rt` - Request time (total)
- `uct` - Upstream connect time
- `uht` - Upstream header time
- `urt` - Upstream response time

## Viewing Logs

### Quick Access Script

Use the interactive log viewer:
```bash
./scripts/view-logs.sh
```

This provides a menu to view different logs in real-time.

### Manual Commands

**Backend logs:**
```bash
# All logs
tail -f backend/logs/combined.log

# Errors only
tail -f backend/logs/error.log

# Performance metrics
tail -f backend/logs/performance.log
```

**Nginx logs:**
```bash
# Access logs
tail -f nginx/logs/access.log

# Error logs
tail -f nginx/logs/error.log
```

**Docker logs:**
```bash
# Follow backend logs
docker logs -f budget_backend

# Last 100 lines
docker logs --tail=100 budget_backend

# With timestamps
docker logs -f -t budget_backend
```

**System logs:**
```bash
# Monitoring
tail -f logs/monitoring.log

# Health checks
tail -f logs/health-check.log

# Cron jobs
tail -f logs/cron.log
```

## Log Rotation

Logs are automatically rotated to prevent disk space issues.

### Configuration

- **Rotation**: Daily
- **Retention**: 7 days
- **Compression**: Yes (gzip, delayed by 1 day)
- **Config file**: `/etc/logrotate.d/budgetapp`

### Setup Log Rotation

Run once on each VM:
```bash
./scripts/setup-log-rotation.sh
```

### Manual Rotation

Force log rotation:
```bash
sudo logrotate -f /etc/logrotate.d/budgetapp
```

Check rotation status:
```bash
cat /var/lib/logrotate/status
```

## Docker Logging

Docker containers use JSON file logging driver with automatic rotation:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"    # Max 10MB per file
    max-file: "3"      # Keep 3 files
```

This means each container keeps max 30MB of logs (3 files × 10MB).

## Log Analysis

### Search for Errors

**Backend errors:**
```bash
grep -i "error" backend/logs/combined.log | tail -20
```

**Nginx errors:**
```bash
grep -i "error" nginx/logs/error.log | tail -20
```

**Docker errors:**
```bash
docker-compose logs | grep -i "error" | tail -20
```

### Find Slow Requests

**Backend (>1 second):**
```bash
grep "duration" backend/logs/combined.log | grep -E "duration\":[0-9]{4,}" | tail -20
```

**Nginx (>1 second):**
```bash
awk '$NF > 1.0' nginx/logs/access.log | tail -20
```

### Monitor Specific User

```bash
grep "userId.*123" backend/logs/combined.log | tail -20
```

### Check API Endpoint Usage

```bash
grep "GET /api/transactions" nginx/logs/access.log | wc -l
```

## Monitoring Logs

The monitoring script logs system metrics every 5 minutes:

```bash
tail -f logs/monitoring.log
```

Example output:
```
[2024-11-29 14:30:00] === Starting resource monitoring ===
[2024-11-29 14:30:00] Disk usage: 45%
[2024-11-29 14:30:00] Memory usage: 62%
[2024-11-29 14:30:00] CPU usage: 23%
[2024-11-29 14:30:00] Running containers: 4/4
[2024-11-29 14:30:00] Unhealthy containers: 0
```

## Troubleshooting

### Logs Not Appearing

1. **Check log directories exist:**
   ```bash
   ./scripts/setup-log-directories.sh
   ```

2. **Check permissions:**
   ```bash
   ls -la backend/logs/
   ls -la nginx/logs/
   ```

3. **Check Docker volumes:**
   ```bash
   docker-compose config | grep volumes -A 5
   ```

### Disk Space Issues

1. **Check disk usage:**
   ```bash
   df -h
   du -sh backend/logs/ nginx/logs/ logs/
   ```

2. **Manual cleanup (old logs):**
   ```bash
   find backend/logs/ -name "*.log" -mtime +7 -delete
   find nginx/logs/ -name "*.log" -mtime +7 -delete
   ```

3. **Clean Docker logs:**
   ```bash
   docker system prune -f
   ```

### Log Rotation Not Working

1. **Check logrotate config:**
   ```bash
   sudo cat /etc/logrotate.d/budgetapp
   ```

2. **Test configuration:**
   ```bash
   sudo logrotate -d /etc/logrotate.d/budgetapp
   ```

3. **Check logrotate service:**
   ```bash
   sudo systemctl status logrotate
   ```

## Best Practices

1. **Regular Monitoring**: Check logs daily for errors
2. **Disk Space**: Monitor disk usage weekly
3. **Log Rotation**: Ensure logrotate is configured on all VMs
4. **Backup Logs**: Important logs should be backed up before rotation
5. **Search Efficiently**: Use grep, awk, and tail for quick analysis
6. **Alert on Errors**: Set up alerts for critical errors (future enhancement)

## Log Levels

### Backend (Winston)

- **error**: Application errors, exceptions
- **warn**: Warning messages, deprecated features
- **info**: General information, HTTP requests
- **debug**: Detailed debugging information (dev only)

### Nginx

- **emerg**: Emergency, system unusable
- **alert**: Alert, action must be taken
- **crit**: Critical conditions
- **error**: Error conditions
- **warn**: Warning conditions
- **notice**: Normal but significant
- **info**: Informational messages
- **debug**: Debug messages

## Performance Logging

The backend logs performance metrics for:

- **Database queries**: Query time, query text
- **API requests**: Response time, status code
- **Cache operations**: Hit/miss, TTL
- **External API calls**: Response time, status

View performance logs:
```bash
tail -f backend/logs/performance.log
```

## Security Considerations

1. **Sensitive Data**: Logs should NOT contain passwords, tokens, or PII
2. **Access Control**: Log files should have restricted permissions (644)
3. **Retention**: Logs older than 7 days are automatically deleted
4. **Monitoring**: Failed login attempts are logged for security analysis

## Next Steps

- Set up centralized logging (ELK stack, CloudWatch) for production
- Configure log shipping to external service
- Set up automated alerts for critical errors
- Implement log analytics dashboard

