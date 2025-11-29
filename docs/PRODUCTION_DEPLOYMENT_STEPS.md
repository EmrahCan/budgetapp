# Production Environment Deployment - Step by Step

This guide walks you through deploying Budget App to the production VM with all fixes applied.

## Production VM Information

- **IP:** 4.210.196.73
- **Username:** obiwan
- **Domain:** budgetapp.site
- **SSH:** `ssh obiwan@4.210.196.73`

## Prerequisites

- [ ] SSH access to production VM
- [ ] Test environment deployed and verified
- [ ] Cloudflare DNS configured
- [ ] All fixes from test deployment applied

## ⚠️ Critical Pre-Deployment Checklist

**Before deploying to production, ensure:**
1. ✅ Test environment is stable and working
2. ✅ Frontend Dockerfile has `--legacy-peer-deps` fix
3. ✅ Nginx config has NO HTTPS block (Cloudflare handles SSL)
4. ✅ All features tested on test environment
5. ✅ Database backup strategy in place

## Step 1: Connect to Production VM

```bash
ssh obiwan@4.210.196.73
```

## Step 2: Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone repository
git clone https://github.com/EmrahCan/budgetapp.git

# Navigate to project
cd budgetapp
```

## Step 3: Generate Strong Passwords

```bash
# Generate database password (DIFFERENT from test!)
echo "DB_PASSWORD:" && openssl rand -base64 32

# Generate JWT secret (DIFFERENT from test!)
echo "JWT_SECRET:" && openssl rand -base64 32
```

**Save these values securely!** Production passwords must be different from test.

## Step 4: Create Environment File

```bash
# Create .env file
nano .env
```

**Paste this content (use PRODUCTION passwords from Step 3):**

```env
# Node Environment
NODE_ENV=production

# Database Configuration
DB_HOST=database
DB_PORT=5432
DB_NAME=budget_app_prod
DB_USER=budget_admin
DB_PASSWORD=PASTE_YOUR_PRODUCTION_DB_PASSWORD_HERE

# JWT Secret
JWT_SECRET=PASTE_YOUR_PRODUCTION_JWT_SECRET_HERE

# Frontend URL
FRONTEND_URL=https://budgetapp.site
ALLOWED_ORIGINS=https://budgetapp.site,https://www.budgetapp.site

# React App
REACT_APP_API_URL=https://budgetapp.site/api
```

**Save and exit:** `Ctrl+X`, `Y`, `Enter`

**Secure the file:**
```bash
chmod 600 .env
```

## Step 5: Create Log Directories

```bash
# Create log directories
mkdir -p logs backend/logs nginx/logs backups
```

## Step 6: Apply Critical Fixes

### Fix 1: Frontend Dockerfile (TypeScript dependency issue)

```bash
nano frontend/Dockerfile
```

**Find line 12 and change:**
```dockerfile
# OLD (will fail):
RUN npm ci

# NEW (correct):
RUN npm ci --legacy-peer-deps
```

Save: `Ctrl+X`, `Y`, `Enter`

### Fix 2: Nginx Config (Remove duplicate /health and HTTPS block)

```bash
nano nginx/nginx.conf
```

**Critical changes needed:**
1. Remove HTTPS server block (listen 443) - Cloudflare handles SSL
2. Remove duplicate `/health` location blocks - Keep only ONE

**Verify no duplicates:**
```bash
grep -n "location /health" nginx/nginx.conf
```

Should show only ONE line. If you see two, delete one.

**Verify no HTTPS:**
```bash
grep -c "listen 443" nginx/nginx.conf
```

Should return: `0`

**If issues found, use the corrected nginx.conf from test environment or see DEPLOYMENT_FIXES.md**

## Step 7: Start Docker Containers

```bash
# Build and start containers
docker-compose up -d --build

# This takes 3-5 minutes
```

**Monitor the build:**
```bash
# Watch logs in real-time
docker-compose logs -f
```

Press `Ctrl+C` to stop watching logs.

## Step 8: Verify All Containers

```bash
# Check container status
docker ps

# All 4 containers should show "healthy":
# - budget_database
# - budget_backend
# - budget_frontend
# - budget_nginx
```

**If nginx is restarting**, check for SSL errors:
```bash
docker logs budget_nginx --tail=20
```

## Step 9: Test Local Access

```bash
# Test nginx health
curl http://localhost/health
# Should return: healthy

# Test frontend
curl http://localhost/
# Should return: HTML content

# Check backend
docker logs budget_backend --tail=10
# Should show: "Server is running on port 5001"
```

## Step 10: Configure Cloudflare DNS

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select domain: `budgetapp.site`
3. Go to **DNS** → **Records**
4. Add A record:
   - **Type:** A
   - **Name:** @ (or budgetapp.site)
   - **IPv4 address:** `4.210.196.73`
   - **Proxy status:** ✅ Proxied (orange cloud)
   - **TTL:** Auto
5. Click **Save**

**Optional - Add www subdomain:**
- **Type:** CNAME
- **Name:** www
- **Target:** budgetapp.site
- **Proxy status:** ✅ Proxied
- **TTL:** Auto

## Step 11: Test External Access

**Wait 2-5 minutes for DNS propagation, then:**

```bash
# From production VM
curl https://budgetapp.site/health
# Should return: healthy
```

**Test from your local machine:**
```bash
curl https://budgetapp.site/health
```

**Open in browser:**
- https://budgetapp.site

## Step 12: Production Testing

1. **Open browser:** https://budgetapp.site
2. **Register a test user**
3. **Login**
4. **Test all major features:**
   - Create transactions
   - View reports
   - Add credit cards
   - Test notifications
5. **Verify performance**
6. **Check for errors**

## Step 13: Setup Monitoring & Backups

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Setup automated cron jobs
./scripts/setup-cron-jobs.sh

# Verify cron jobs
crontab -l

# Setup log rotation
./scripts/setup-log-rotation.sh

# Create initial backup
./scripts/backup-database.sh

# Verify backup
ls -lh backups/
```

## Step 14: Security Hardening

```bash
# Verify firewall
sudo ufw status
# Should show: 22, 80, 443 allowed

# Check fail2ban
sudo systemctl status fail2ban

# Verify .env permissions
ls -la .env
# Should show: -rw------- (600)
```

## Step 15: Monitor for 24 Hours

**First 24 hours are critical:**

```bash
# Check logs regularly
docker-compose logs --tail=100

# Monitor resources
docker stats --no-stream

# Check for errors
docker-compose logs | grep -i error

# Verify backups
ls -lh backups/
```

## Production Verification Checklist

- [ ] All 4 containers running and healthy
- [ ] Application accessible via https://budgetapp.site
- [ ] HTTPS working (Cloudflare SSL)
- [ ] Can register and login
- [ ] All features working
- [ ] No errors in logs
- [ ] Automated backups configured
- [ ] Monitoring active
- [ ] Firewall configured
- [ ] .env file secured (600 permissions)

## Troubleshooting

### Issue 1: Frontend Build Fails

**Solution:**
```bash
# Verify Dockerfile has fix
grep "legacy-peer-deps" frontend/Dockerfile

# If not, add it
nano frontend/Dockerfile
# Line 12: RUN npm ci --legacy-peer-deps

# Rebuild
docker-compose down
docker-compose up -d --build
```

### Issue 2: Nginx SSL Errors

**Solution:**
```bash
# Nginx config should NOT have HTTPS block
grep -A 5 "listen 443" nginx/nginx.conf

# If found, remove it
nano nginx/nginx.conf
# Delete HTTPS server block

# Restart
docker-compose restart nginx
```

### Issue 3: Can't Access Domain

**Check DNS:**
```bash
dig budgetapp.site
# Should show Cloudflare IPs
```

**Check Cloudflare:**
- Verify A record: @ → 4.210.196.73
- Verify Proxy enabled (orange cloud)
- SSL/TLS mode: Flexible or Full
- "Always Use HTTPS": ON

### Issue 4: Database Issues

```bash
# Check database logs
docker logs budget_database

# Check connection
docker exec budget_database pg_isready -U budget_admin

# Restart if needed
docker-compose restart database backend
```

### Issue 5: Performance Issues

```bash
# Check resources
docker stats

# Check system resources
free -h
df -h

# Check logs for slow queries
grep "duration" backend/logs/combined.log | tail -20
```

## Rollback Procedure

**If deployment fails:**

```bash
# Stop containers
docker-compose down

# Restore from backup (if needed)
./scripts/restore-database.sh

# Check previous version
git log --oneline -5

# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild
docker-compose up -d --build
```

## Post-Deployment

### Daily Tasks
- Check logs for errors
- Verify backups are running
- Monitor resource usage
- Check application performance

### Weekly Tasks
- Review performance metrics
- Analyze traffic patterns
- Check security logs
- Update dependencies if needed

### Monthly Tasks
- Test backup restoration
- Security audit
- Performance optimization
- Documentation updates

## Support

**If you encounter issues:**

1. Check logs: `docker-compose logs --tail=100`
2. Check documentation: `docs/TROUBLESHOOTING.md`
3. Check monitoring: `docker stats`
4. Review test environment for comparison

## Next Steps

After successful production deployment:

1. ✅ Monitor for 24-48 hours
2. ✅ Set up GitHub Actions CI/CD (Task 22)
3. ✅ Configure alerts
4. ✅ Performance testing
5. ✅ Security hardening verification

