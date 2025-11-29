# Test Environment Deployment - Step by Step

This guide walks you through deploying Budget App to the test VM with all fixes applied.

## Test VM Information

- **IP:** 108.141.152.224
- **Username:** obiwan
- **Domain:** test.budgetapp.site
- **SSH:** `ssh obiwan@108.141.152.224`

## Prerequisites

- [ ] SSH access to test VM
- [ ] GitHub repository access
- [ ] Cloudflare account with domain added

## ⚠️ Important Notes

**Known Issues Fixed:**
1. Frontend TypeScript dependency conflict → Fixed with `--legacy-peer-deps`
2. Nginx SSL certificate error → Fixed by removing HTTPS block (Cloudflare handles SSL)

## Step 1: Connect to Test VM

```bash
ssh obiwan@108.141.152.224
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
# Generate database password
echo "DB_PASSWORD:" && openssl rand -base64 32

# Generate JWT secret
echo "JWT_SECRET:" && openssl rand -base64 32
```

**Save these values!** You'll need them in the next step.

## Step 4: Create Environment File

```bash
# Create .env file
nano .env
```

**Paste this content (replace PASSWORD and SECRET with values from Step 3):**

```env
# Node Environment
NODE_ENV=production

# Database Configuration
DB_HOST=database
DB_PORT=5432
DB_NAME=budget_app_test
DB_USER=budget_admin
DB_PASSWORD=PASTE_YOUR_DB_PASSWORD_HERE

# JWT Secret
JWT_SECRET=PASTE_YOUR_JWT_SECRET_HERE

# Frontend URL
FRONTEND_URL=https://test.budgetapp.site
ALLOWED_ORIGINS=https://test.budgetapp.site

# React App
REACT_APP_API_URL=https://test.budgetapp.site/api
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

**Secure the file:**
```bash
chmod 600 .env
```

## Step 5: Create Log Directories

```bash
# Create log directories manually
mkdir -p logs backend/logs nginx/logs backups
```

## Step 6: Fix Frontend Dockerfile (CRITICAL)

**This fixes the TypeScript dependency conflict:**

```bash
# Edit frontend Dockerfile
nano frontend/Dockerfile
```

Find line 12 that says:
```dockerfile
RUN npm ci
```

Change it to:
```dockerfile
RUN npm ci --legacy-peer-deps
```

**Save:** `Ctrl+X`, `Y`, `Enter`

## Step 7: Verify Nginx Config (CRITICAL)

**This fixes the SSL certificate error:**

The nginx config should NOT have HTTPS server block (Cloudflare handles SSL).

```bash
# Check if nginx config is correct
grep -A 5 "listen 443" nginx/nginx.conf
```

**If you see "listen 443", the config needs to be fixed.** The correct config should only have HTTP (port 80) server block.

## Step 8: Start Docker Containers

```bash
# Build and start containers
docker-compose up -d --build

# This will:
# - Build backend image
# - Build frontend image (with --legacy-peer-deps fix)
# - Start PostgreSQL database
# - Start nginx (without SSL)
# - Takes 3-5 minutes
```

**Wait for build to complete (3-5 minutes)**

## Step 9: Check Container Status

```bash
# View running containers
docker ps

# Should see 4 containers:
# - budget_database (healthy)
# - budget_backend (healthy)
# - budget_frontend (healthy)
# - budget_nginx (healthy or starting)
```

**If nginx is "Restarting"**, check logs:

```bash
docker logs budget_nginx --tail=20
```

**If you see SSL certificate errors**, nginx config needs to be fixed (see Troubleshooting below).

## Step 10: Fix Nginx if Needed

**If nginx keeps restarting with SSL errors:**

```bash
# Stop containers
docker-compose down

# Fix nginx config (remove HTTPS block)
nano nginx/nginx.conf
# Delete everything after the HTTP server block (line 68+)
# Keep only the HTTP server on port 80

# Restart
docker-compose up -d
```

## Step 11: Verify All Services

```bash
# Test nginx health
curl http://localhost/health
# Should return: healthy

# Test frontend
curl http://localhost/
# Should return: HTML content

# Check backend logs
docker logs budget_backend --tail=10
# Should show: "Server is running on port 5001"
```

## Step 12: Configure Cloudflare DNS

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain: `budgetapp.site`
3. Go to **DNS** → **Records**
4. Add A record:
   - **Type:** A
   - **Name:** test
   - **IPv4 address:** 108.141.152.224
   - **Proxy status:** ✅ Proxied (orange cloud)
   - **TTL:** Auto
5. Click **Save**

## Step 13: Test External Access

**Wait 2-5 minutes for DNS propagation, then test:**

```bash
# From test VM
curl https://test.budgetapp.site/health
# Should return: healthy

# Test from your local machine
curl https://test.budgetapp.site/health
```

**Open in browser:**
- https://test.budgetapp.site

## Step 14: Test Application

1. **Open browser:** https://test.budgetapp.site
2. **Register new user**
3. **Login**
4. **Create a transaction**
5. **Verify everything works**

## Step 15: Optional - Setup Automation

**Only if you want automated monitoring and backups:**

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Setup cron jobs (optional)
# ./scripts/setup-cron-jobs.sh

# Setup log rotation (optional)
# ./scripts/setup-log-rotation.sh
```

## Verification Checklist

- [ ] All 4 containers running
- [ ] Health checks passing
- [ ] Application accessible via https://test.budgetapp.site
- [ ] Can register and login
- [ ] Can create transactions
- [ ] Logs are being written
- [ ] Cron jobs configured
- [ ] Backups working
- [ ] Monitoring active

## Troubleshooting

### Issue 1: Frontend Build Fails with TypeScript Error

**Error:** `npm error ERESOLVE could not resolve` or TypeScript version conflict

**Solution:**
```bash
# Edit frontend/Dockerfile
nano frontend/Dockerfile

# Change line 12 from:
RUN npm ci

# To:
RUN npm ci --legacy-peer-deps

# Rebuild
docker-compose up -d --build
```

### Issue 2: Nginx Keeps Restarting with SSL Error

**Error:** `cannot load certificate "/etc/nginx/ssl/fullchain.pem"`

**Solution:**
```bash
# Stop containers
docker-compose down

# Edit nginx config
nano nginx/nginx.conf

# Remove the entire HTTPS server block (starts with "listen 443")
# Keep only the HTTP server block (port 80)
# Cloudflare handles HTTPS for us

# Restart
docker-compose up -d
```

### Issue 3: Can't Access via Domain

**Check DNS:**
```bash
dig test.budgetapp.site
# Should show Cloudflare IPs, not your VM IP
```

**Check Cloudflare:**
- Verify A record points to 108.141.152.224
- Verify Proxy is enabled (orange cloud)
- Wait 5 minutes for DNS propagation

### Issue 4: Containers Won't Start

```bash
# Check logs
docker-compose logs --tail=50

# Check disk space
df -h

# If disk full, clean up
docker system prune -af

# Restart
docker-compose down
docker-compose up -d --build
```

### Issue 5: Database Connection Failed

```bash
# Check database logs
docker logs budget_database

# Check .env file
cat .env | grep DB_

# Verify database is healthy
docker ps | grep database

# Restart backend
docker-compose restart backend
```

## Post-Deployment

### Monitor for 24 Hours

```bash
# Check logs regularly
./scripts/view-logs.sh

# Monitor resources
watch -n 60 './scripts/monitor-resources.sh'

# Check health
watch -n 300 './scripts/check-health.sh'
```

### Test Rollback

```bash
# Test rollback procedure
./scripts/rollback.sh
```

## Next Steps

After test environment is stable:
1. ✅ Monitor for 24-48 hours
2. ✅ Fix any issues found
3. ✅ Document any changes
4. ➡️ Proceed to Production Deployment (Task 21)

## Useful Commands

```bash
# View logs
./scripts/view-logs.sh

# Check health
./scripts/check-health.sh

# Monitor resources
./scripts/monitor-resources.sh

# Create backup
./scripts/backup-database.sh

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Start services
docker-compose up -d

# View container stats
docker stats

# Clean up
docker system prune -f
```

## Support

If you encounter issues:
1. Check logs: `./scripts/view-logs.sh`
2. Check documentation: `docs/TROUBLESHOOTING.md`
3. Run health checks: `./scripts/check-health.sh`
4. Check monitoring: `./scripts/monitor-resources.sh`

