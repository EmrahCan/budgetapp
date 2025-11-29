# Budget App - Troubleshooting Guide

Common issues and solutions for Budget App deployment and operations.

## Table of Contents

- [Deployment Issues](#deployment-issues)
- [Container Issues](#container-issues)
- [Database Issues](#database-issues)
- [Network Issues](#network-issues)
- [Performance Issues](#performance-issues)
- [Backup Issues](#backup-issues)
- [Cloudflare Issues](#cloudflare-issues)

## Deployment Issues

### GitHub Actions Deployment Fails

**Symptoms:** Deployment workflow fails in GitHub Actions

**Solutions:**

1. **Check GitHub Secrets:**
   ```bash
   # Verify all secrets are set in GitHub repo settings
   # Required: PROD_VM_HOST, PROD_VM_USER, PROD_VM_PASSWORD
   #          TEST_VM_HOST, TEST_VM_USER, TEST_VM_PASSWORD
   ```

2. **Check SSH Connection:**
   ```bash
   # Test SSH manually
   ssh obiwan@4.210.196.73
   ssh obiwan@108.141.152.224
   ```

3. **Check VM Disk Space:**
   ```bash
   df -h
   # If disk is full, clean up:
   docker system prune -af
   ```

### Docker Compose Build Fails

**Symptoms:** `docker-compose build` fails

**Solutions:**

1. **Check Docker is running:**
   ```bash
   docker ps
   sudo systemctl status docker
   ```

2. **Clean Docker cache:**
   ```bash
   docker system prune -af
   docker builder prune -af
   ```

3. **Check Dockerfile syntax:**
   ```bash
   docker build -t test-build ./backend
   docker build -t test-build ./frontend
   ```

## Container Issues

### Container Won't Start

**Symptoms:** Container exits immediately or won't start

**Solutions:**

1. **Check logs:**
   ```bash
   docker logs budget_backend
   docker logs budget_frontend
   docker logs budget_database
   docker logs budget_nginx
   ```

2. **Check environment variables:**
   ```bash
   cat .env
   # Verify all required variables are set
   ```

3. **Check port conflicts:**
   ```bash
   sudo lsof -i :80
   sudo lsof -i :443
   sudo lsof -i :5001
   ```

### Container Health Check Failing

**Symptoms:** Container shows as "unhealthy"

**Solutions:**

1. **Check health endpoint:**
   ```bash
   curl http://localhost/health
   curl http://localhost/api/health
   ```

2. **Increase health check timeout:**
   Edit `docker-compose.yml` and increase timeout values

3. **Check container resources:**
   ```bash
   docker stats
   ```

### All Containers Stop Unexpectedly

**Symptoms:** All containers exit

**Solutions:**

1. **Check system resources:**
   ```bash
   free -h
   df -h
   top
   ```

2. **Check Docker daemon:**
   ```bash
   sudo systemctl status docker
   sudo journalctl -u docker --since "1 hour ago"
   ```

3. **Restart Docker:**
   ```bash
   sudo systemctl restart docker
   docker-compose up -d
   ```

## Database Issues

### Database Connection Failed

**Symptoms:** Backend can't connect to database

**Solutions:**

1. **Check database container:**
   ```bash
   docker ps | grep database
   docker logs budget_database
   ```

2. **Check database credentials:**
   ```bash
   # Verify .env file has correct DB_PASSWORD
   cat .env | grep DB_
   ```

3. **Test database connection:**
   ```bash
   docker exec budget_database pg_isready -U budget_admin
   ```

4. **Check database is accepting connections:**
   ```bash
   docker exec -it budget_database psql -U budget_admin -d budget_app
   ```

### Database Initialization Failed

**Symptoms:** Tables not created

**Solutions:**

1. **Check schema file:**
   ```bash
   cat backend/database/schema.sql
   ```

2. **Manually run schema:**
   ```bash
   docker exec -i budget_database psql -U budget_admin -d budget_app < backend/database/schema.sql
   ```

3. **Check init logs:**
   ```bash
   docker logs budget_database | grep -i "init"
   ```

### Database Performance Issues

**Symptoms:** Slow queries

**Solutions:**

1. **Check database size:**
   ```bash
   docker exec budget_database psql -U budget_admin -d budget_app -c "\l+"
   ```

2. **Analyze slow queries:**
   ```bash
   # Check backend logs for slow queries
   grep "duration" backend/logs/performance.log
   ```

3. **Add indexes:**
   ```sql
   -- Connect to database and add indexes
   CREATE INDEX idx_transactions_user_id ON transactions(user_id);
   ```

## Network Issues

### Can't Access Application

**Symptoms:** Can't reach application via browser

**Solutions:**

1. **Check nginx is running:**
   ```bash
   docker ps | grep nginx
   curl http://localhost/health
   ```

2. **Check firewall:**
   ```bash
   sudo ufw status
   # Should allow ports 22, 80, 443
   ```

3. **Check Cloudflare:**
   - Verify DNS records point to correct IP
   - Check SSL/TLS mode is "Flexible"
   - Verify domain is active

### CORS Errors

**Symptoms:** Browser shows CORS errors

**Solutions:**

1. **Check allowed origins:**
   ```bash
   cat .env | grep ALLOWED_ORIGINS
   ```

2. **Update backend CORS config:**
   Edit `backend/server.js` and add your domain to `allowedOrigins`

3. **Restart backend:**
   ```bash
   docker-compose restart backend
   ```

### 502 Bad Gateway

**Symptoms:** Nginx returns 502 error

**Solutions:**

1. **Check backend is running:**
   ```bash
   docker ps | grep backend
   curl http://localhost:5001/health
   ```

2. **Check nginx logs:**
   ```bash
   tail -f nginx/logs/error.log
   ```

3. **Restart services:**
   ```bash
   docker-compose restart backend nginx
   ```

## Performance Issues

### High CPU Usage

**Symptoms:** Server is slow, high CPU

**Solutions:**

1. **Check container stats:**
   ```bash
   docker stats
   ```

2. **Check system processes:**
   ```bash
   top
   htop
   ```

3. **Optimize queries:**
   - Add database indexes
   - Implement caching
   - Optimize API endpoints

### High Memory Usage

**Symptoms:** Out of memory errors

**Solutions:**

1. **Check memory usage:**
   ```bash
   free -h
   docker stats
   ```

2. **Restart containers:**
   ```bash
   docker-compose restart
   ```

3. **Increase VM memory:**
   - Upgrade VM size in Azure Portal

### Slow Response Times

**Symptoms:** API is slow

**Solutions:**

1. **Check logs:**
   ```bash
   grep "duration" backend/logs/combined.log | tail -20
   ```

2. **Check database:**
   ```bash
   # Look for slow queries
   grep "query" backend/logs/performance.log
   ```

3. **Enable caching:**
   - Implement Redis caching
   - Use CDN for static assets

## Backup Issues

### Backup Failed

**Symptoms:** Backup script fails

**Solutions:**

1. **Check database is running:**
   ```bash
   docker ps | grep database
   ```

2. **Check disk space:**
   ```bash
   df -h
   ```

3. **Run backup manually:**
   ```bash
   ./scripts/backup-database.sh
   ```

4. **Check backup logs:**
   ```bash
   tail -f logs/backup.log
   ```

### Restore Failed

**Symptoms:** Can't restore from backup

**Solutions:**

1. **Verify backup file:**
   ```bash
   gunzip -t backups/budget_db_*.sql.gz
   ```

2. **Check backup content:**
   ```bash
   gunzip -c backups/budget_db_*.sql.gz | head -20
   ```

3. **Restore manually:**
   ```bash
   ./scripts/restore-database.sh
   ```

### Old Backups Not Deleted

**Symptoms:** Too many backup files

**Solutions:**

1. **Check cron job:**
   ```bash
   crontab -l | grep backup
   ```

2. **Manual cleanup:**
   ```bash
   cd backups
   ls -t budget_db_*.sql.gz | tail -n +8 | xargs rm
   ```

## Cloudflare Issues

### SSL Certificate Errors

**Symptoms:** Browser shows SSL errors

**Solutions:**

1. **Check Cloudflare SSL mode:**
   - Go to SSL/TLS → Overview
   - Set to "Flexible" or "Full"

2. **Clear browser cache:**
   - Hard refresh (Ctrl+Shift+R)
   - Clear SSL state

3. **Wait for propagation:**
   - SSL changes can take up to 24 hours

### Domain Not Resolving

**Symptoms:** Domain doesn't load

**Solutions:**

1. **Check DNS:**
   ```bash
   dig budgetapp.site
   dig test.budgetapp.site
   ```

2. **Verify nameservers:**
   ```bash
   dig NS budgetapp.site
   # Should show Cloudflare nameservers
   ```

3. **Check Cloudflare status:**
   - Visit https://www.cloudflarestatus.com/

### Real IP Not Showing in Logs

**Symptoms:** Logs show Cloudflare IPs

**Solutions:**

1. **Check nginx config:**
   ```bash
   grep "CF-Connecting-IP" nginx/nginx.conf
   ```

2. **Restart nginx:**
   ```bash
   docker-compose restart nginx
   ```

## General Debugging

### View All Logs

```bash
# Use the log viewer
./scripts/view-logs.sh

# Or manually:
tail -f backend/logs/combined.log
tail -f nginx/logs/access.log
tail -f logs/monitoring.log
docker-compose logs -f
```

### Check System Health

```bash
# Run health checks
./scripts/check-health.sh

# Check resources
./scripts/monitor-resources.sh

# Check backups
./scripts/check-backup-status.sh
```

### Complete System Restart

```bash
# Stop everything
docker-compose down

# Clean up
docker system prune -f

# Start fresh
docker-compose up -d

# Wait and check
sleep 30
./scripts/check-health.sh
```

## Getting Help

If you can't resolve the issue:

1. **Collect information:**
   ```bash
   # System info
   uname -a
   docker --version
   docker-compose --version
   
   # Container status
   docker ps -a
   
   # Recent logs
   docker-compose logs --tail=100
   
   # Resource usage
   free -h
   df -h
   ```

2. **Check documentation:**
   - README.md
   - docs/VM_DEPLOYMENT_GUIDE.md
   - docs/LOGGING.md

3. **Contact support:**
   - Include error messages
   - Include relevant logs
   - Describe steps to reproduce

