# 🚨 Fix Production Database - Run These Commands Now

## Problem
Backend cannot connect to database:
```
FATAL: password authentication failed for user "budget_admin"
```

## Solution - 3 Simple Steps

### Step 1: Upload Fix Script (from your local machine)
```bash
scp budget/scripts/fix-production-db-auth.sh obiwan@4.180.255.34:~/budgetapp/scripts/
```

### Step 2: SSH to Production VM and Run Fix
```bash
# SSH into production
ssh obiwan@4.180.255.34

# Navigate to app directory
cd ~/budgetapp

# Make script executable
chmod +x scripts/fix-production-db-auth.sh

# Run the fix
./scripts/fix-production-db-auth.sh
```

**Expected output:**
```
✅ Database container is running
✅ Password reset successfully
✅ Database exists
✅ Privileges set
✅ Backend restarted
✅ Database connection successful!
```

### Step 3: Create Admin User
```bash
# Still on production VM
./scripts/create-admin-user.sh
```

**Expected output:**
```
✅ Admin user created successfully!
-----------------------------------
Email: admin@budgetapp.site
Password: Admin123!@#
-----------------------------------
```

## Verify Everything Works

```bash
# Check all containers are running
docker ps

# Test health endpoint
curl http://localhost/health

# Check backend logs (should see no errors)
docker logs budget_backend --tail=30
```

## Test in Browser
1. Open: http://4.180.255.34
2. Login with:
   - Email: `admin@budgetapp.site`
   - Password: `Admin123!@#`

## If Something Goes Wrong

### Check backend logs:
```bash
docker logs budget_backend --tail=50
```

### Check database logs:
```bash
docker logs budget_database --tail=50
```

### Restart everything:
```bash
docker-compose restart
```

### Manual database password reset:
```bash
docker exec -it budget_database psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'Prod_DB_P@ssw0rd_2024_Secure_Random_Key_9Ht03GrRP7iK';"
docker restart budget_backend
```

## What This Fixes
- ✅ Resets postgres user password to match backend configuration
- ✅ Ensures database exists with correct name
- ✅ Sets proper database privileges
- ✅ Restarts backend to pick up changes
- ✅ Verifies connection works

## Files Involved
- `backend/.env.production` - Contains correct DB credentials
- `scripts/fix-production-db-auth.sh` - Automated fix script
- `scripts/create-admin-user.sh` - Creates admin user
- `docs/PRODUCTION_DB_FIX.md` - Detailed documentation

---

**Ready to fix? Start with Step 1 above! 🚀**
