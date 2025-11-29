# Deployment Fixes - Critical Issues and Solutions

This document lists all issues encountered during test deployment and their solutions.

## 🔴 Critical Fixes Required Before Deployment

### Fix 1: Frontend TypeScript Dependency Conflict

**Issue:** Frontend build fails with npm dependency resolution error
```
npm error ERESOLVE could not resolve
npm error While resolving: react-scripts@5.0.1
npm error Found: typescript@5.9.3
npm error Could not resolve dependency: typescript@"^3.2.1 || ^4"
```

**Root Cause:** TypeScript 5.x conflicts with react-scripts 5.0.1 which expects TypeScript 4.x

**Solution:** Add `--legacy-peer-deps` flag to npm install

**File:** `frontend/Dockerfile`

**Change line 12 from:**
```dockerfile
RUN npm ci
```

**To:**
```dockerfile
RUN npm ci --legacy-peer-deps
```

**Status:** ✅ Fixed and tested

---

### Fix 2: Nginx Configuration Errors

**Issue 1:** Nginx container keeps restarting with error:
```
nginx: [emerg] cannot load certificate "/etc/nginx/ssl/fullchain.pem": 
BIO_new_file() failed (SSL: error:80000002:system library::No such file or directory)
```

**Issue 2:** Nginx fails with duplicate location error:
```
nginx: [emerg] duplicate location "/health" in /etc/nginx/nginx.conf:164
```

**Root Causes:** 
1. Nginx config expects SSL certificates but we're using Cloudflare for SSL termination
2. `/health` endpoint defined twice in config (once in main server block, once at end)

**Solutions:**

**A) Remove HTTPS Server Block**

**File:** `nginx/nginx.conf`

Delete the entire HTTPS server block (starts with `listen 443 ssl http2;`). Keep only HTTP block (port 80).

**B) Remove Duplicate /health Location**

**File:** `nginx/nginx.conf`

Keep only ONE `/health` location block. Delete the duplicate (usually at end of file around line 164).

**Remove:** Entire HTTPS server block (starts with `listen 443 ssl http2;`)

**Keep:** Only HTTP server block (port 80)

**Why:** Cloudflare terminates HTTPS and forwards HTTP to our server

**Status:** ✅ Fixed and tested

---

## ⚠️ Configuration Notes

### Cloudflare Configuration

**SSL/TLS Mode:** Flexible
- Cloudflare ↔ Visitor: HTTPS
- Cloudflare ↔ Origin: HTTP

**DNS Records:**
- Test: `test.budgetapp.site` → `108.141.152.224` (Proxied)
- Prod: `budgetapp.site` → `4.210.196.73` (Proxied)

**Always Use HTTPS:** ON

---

### Environment Variables

**Required in .env:**
```env
NODE_ENV=production
DB_HOST=database
DB_PORT=5432
DB_NAME=budget_app_test  # or budget_app_prod
DB_USER=budget_admin
DB_PASSWORD=<strong-password>
JWT_SECRET=<strong-secret>
FRONTEND_URL=https://test.budgetapp.site  # or https://budgetapp.site
ALLOWED_ORIGINS=https://test.budgetapp.site  # or https://budgetapp.site
REACT_APP_API_URL=https://test.budgetapp.site/api  # or https://budgetapp.site/api
```

**Optional:**
```env
GEMINI_API_KEY=<api-key>  # For AI features
```

---

## 📋 Pre-Deployment Checklist

Before deploying to any environment:

### Code Fixes
- [ ] Frontend Dockerfile has `--legacy-peer-deps`
- [ ] Nginx config has NO HTTPS block
- [ ] All changes committed to GitHub

### Environment Setup
- [ ] Strong passwords generated
- [ ] .env file created with correct values
- [ ] .env file permissions set to 600

### Infrastructure
- [ ] VM accessible via SSH
- [ ] Docker and Docker Compose installed
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Cloudflare DNS configured

---

## 🚀 Quick Deployment Commands

### Test Environment

```bash
# Connect
ssh obiwan@108.141.152.224

# Clone
cd ~ && git clone https://github.com/EmrahCan/budgetapp.git && cd budgetapp

# Setup
mkdir -p logs backend/logs nginx/logs backups
nano .env  # Create and configure
chmod 600 .env

# Deploy
docker-compose up -d --build

# Verify
docker ps
curl http://localhost/health
curl https://test.budgetapp.site/health
```

### Production Environment

```bash
# Connect
ssh obiwan@4.210.196.73

# Clone
cd ~ && git clone https://github.com/EmrahCan/budgetapp.git && cd budgetapp

# Setup
mkdir -p logs backend/logs nginx/logs backups
nano .env  # Create and configure (DIFFERENT passwords!)
chmod 600 .env

# Deploy
docker-compose up -d --build

# Verify
docker ps
curl http://localhost/health
curl https://budgetapp.site/health
```

---

## 🔍 Verification Steps

### 1. Container Health

```bash
docker ps
```

Expected output:
- All 4 containers running
- All showing "healthy" status
- nginx on ports 80 and 443

### 2. Local Access

```bash
curl http://localhost/health
# Expected: healthy

curl http://localhost/
# Expected: HTML content
```

### 3. External Access

```bash
curl https://test.budgetapp.site/health  # or budgetapp.site
# Expected: healthy
```

### 4. Application Test

- Open browser: https://test.budgetapp.site (or budgetapp.site)
- Register user
- Login
- Create transaction
- Verify all features work

---

## 🐛 Common Issues and Solutions

### Issue: Frontend build fails

**Check:**
```bash
grep "legacy-peer-deps" frontend/Dockerfile
```

**Fix if needed:**
```bash
nano frontend/Dockerfile
# Add --legacy-peer-deps to line 12
docker-compose up -d --build
```

### Issue: Nginx keeps restarting

**Check:**
```bash
docker logs budget_nginx --tail=20
```

**If SSL errors:**
```bash
grep -c "listen 443" nginx/nginx.conf
# Should return 0
```

**Fix if needed:**
```bash
nano nginx/nginx.conf
# Remove HTTPS server block
docker-compose restart nginx
```

### Issue: Can't access via domain

**Check DNS:**
```bash
dig test.budgetapp.site  # or budgetapp.site
```

**Check Cloudflare:**
- Verify A record exists
- Verify Proxy is enabled (orange cloud)
- Wait 5 minutes for DNS propagation

### Issue: Database connection fails

**Check:**
```bash
docker logs budget_database
docker logs budget_backend
cat .env | grep DB_
```

**Fix:**
```bash
docker-compose restart backend
```

---

## 📝 Files Modified

### 1. frontend/Dockerfile
**Line 12 changed:**
```dockerfile
# Before
RUN npm ci

# After
RUN npm ci --legacy-peer-deps
```

### 2. nginx/nginx.conf
**HTTPS server block removed:**
- Removed entire `server { listen 443 ssl http2; ... }` block
- Kept only HTTP server block on port 80
- Added Cloudflare real IP configuration

---

## ✅ Deployment Success Criteria

Deployment is successful when:

1. ✅ All 4 containers running and healthy
2. ✅ `curl http://localhost/health` returns "healthy"
3. ✅ `curl https://domain/health` returns "healthy"
4. ✅ Application accessible via browser
5. ✅ Can register and login
6. ✅ All features working
7. ✅ No errors in logs
8. ✅ HTTPS working (Cloudflare SSL)

---

## 🔄 Rollback Procedure

If deployment fails:

```bash
# Stop containers
docker-compose down

# Check previous commits
git log --oneline -5

# Rollback to previous version
git checkout <previous-commit>

# Rebuild
docker-compose up -d --build

# Or restore from backup
./scripts/restore-database.sh
```

---

## 📚 Related Documentation

- [Test Deployment Steps](TEST_DEPLOYMENT_STEPS.md)
- [Production Deployment Steps](PRODUCTION_DEPLOYMENT_STEPS.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Cloudflare Setup](CLOUDFLARE_SETUP.md)

---

## 🎯 Summary

**Two critical fixes are required for successful deployment:**

1. **Frontend Dockerfile:** Add `--legacy-peer-deps` to npm ci command
2. **Nginx Config:** Remove HTTPS server block (Cloudflare handles SSL)

**Without these fixes, deployment will fail.**

Apply these fixes before deploying to production!

