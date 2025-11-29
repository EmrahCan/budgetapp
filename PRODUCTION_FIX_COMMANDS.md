# 🚨 Production Database Fix - Quick Commands

## Run These Commands on Production VM (vm02)

### 1. Upload the fix script to VM
```bash
# On your local machine
scp budget/scripts/fix-production-db-auth.sh obiwan@4.180.255.34:~/budgetapp/scripts/
```

### 2. SSH into production VM
```bash
ssh obiwan@4.180.255.34
```

### 3. Run the fix script
```bash
cd ~/budgetapp
chmod +x scripts/fix-production-db-auth.sh
./scripts/fix-production-db-auth.sh
```

### 4. Create admin user (after fix succeeds)
```bash
./scripts/create-admin-user.sh
```

### 5. Test the application
```bash
# Test health endpoint
curl http://localhost/health

# Check all containers
docker ps

# Check backend logs
docker logs budget_backend --tail=30
```

### 6. Test login in browser
- URL: http://4.180.255.34
- Email: admin@budgetapp.site
- Password: Admin123!@#

---

## Alternative: Manual Fix (if script fails)

```bash
# Reset postgres password
docker exec -it budget_database psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'Prod_DB_P@ssw0rd_2024_Secure_Random_Key_9Ht03GrRP7iK';"

# Verify database exists
docker exec budget_database psql -U postgres -c "\l" | grep budget_app_prod

# Restart backend
docker restart budget_backend

# Wait and check logs
sleep 10
docker logs budget_backend --tail=30
```

---

## What the fix does:
1. ✅ Resets postgres user password to match backend config
2. ✅ Verifies database exists (creates if needed)
3. ✅ Sets proper database privileges
4. ✅ Restarts backend container
5. ✅ Tests database connection

## Expected Output:
```
✅ Database container is running
✅ Password reset successfully
✅ Database exists
✅ Privileges set
✅ Backend restarted
✅ Database connection successful!
```
