# Pre-Deployment Checklist

## ⚠️ CRITICAL: Apply These Fixes BEFORE Running docker-compose

### Fix 1: Frontend Dockerfile

**File:** `frontend/Dockerfile`  
**Line:** 12

**Change from:**
```dockerfile
RUN npm ci
```

**Change to:**
```dockerfile
RUN npm ci --legacy-peer-deps
```

**Why:** Resolves TypeScript 5.x dependency conflict with react-scripts

---

### Fix 2: Nginx Configuration

**File:** `nginx/nginx.conf`

**Two issues to fix:**

#### A) Remove HTTPS Server Block
- Delete entire block starting with `listen 443 ssl http2;`
- Keep only HTTP block (port 80)
- Cloudflare handles HTTPS

#### B) Remove Duplicate /health
- Keep only ONE `/health` location block
- Delete duplicate (usually around line 164)

**Verify:**
```bash
# Should return 0 (no HTTPS)
grep -c "listen 443" nginx/nginx.conf

# Should show only ONE line
grep -n "location /health" nginx/nginx.conf
```

---

## Deployment Steps

1. ✅ Apply Fix 1 (Frontend Dockerfile)
2. ✅ Apply Fix 2 (Nginx Config)
3. ✅ Create .env file with strong passwords
4. ✅ Run `docker-compose up -d --build`
5. ✅ Create admin user
6. ✅ Configure Cloudflare DNS
7. ✅ Test application

