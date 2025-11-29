# Production Database Authentication Fix

## Problem
The backend container cannot authenticate with PostgreSQL database. Error:
```
password authentication failed for user "budget_admin"
```

## Root Cause
The backend `.env.production` file is configured to use `DB_USER=postgres` but the database was not properly initialized with this user's password.

## Solution

### Quick Fix (Run on Production VM)

```bash
cd ~/budgetapp
./scripts/fix-production-db-auth.sh
```

This script will:
1. ✅ Check database container is running
2. ✅ Reset postgres user password to match `.env.production`
3. ✅ Verify database exists (create if needed)
4. ✅ Set proper database privileges
5. ✅ Restart backend container
6. ✅ Test database connection

### Manual Fix (If script fails)

```bash
# 1. Reset postgres password
docker exec -it budget_database psql -U postgres
ALTER USER postgres WITH PASSWORD 'Prod_DB_P@ssw0rd_2024_Secure_Random_Key_9Ht03GrRP7iK';
\q

# 2. Verify database exists
docker exec -it budget_database psql -U postgres -c "\l" | grep budget_app_prod

# 3. If database doesn't exist, create it
docker exec -it budget_database psql -U postgres -c "CREATE DATABASE budget_app_prod;"

# 4. Grant privileges
docker exec -it budget_database psql -U postgres -d budget_app_prod <<EOF
GRANT ALL PRIVILEGES ON DATABASE budget_app_prod TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
\q
EOF

# 5. Restart backend
docker restart budget_backend

# 6. Check logs
docker logs budget_backend --tail=50
```

### Verify Fix

```bash
# Test database connection
docker exec budget_backend node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'database',
  port: 5432,
  database: 'budget_app_prod',
  user: 'postgres',
  password: 'Prod_DB_P@ssw0rd_2024_Secure_Random_Key_9Ht03GrRP7iK'
});

(async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connection successful!', result.rows[0]);
    await pool.end();
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
})();
"

# Test health endpoint
curl http://localhost/health

# Check backend logs
docker logs budget_backend --tail=20
```

## After Fix

Once database authentication is working:

1. **Create admin user:**
   ```bash
   ./scripts/create-admin-user.sh
   ```

2. **Test login:**
   - URL: http://4.180.255.34
   - Email: admin@budgetapp.site
   - Password: Admin123!@#

3. **Verify all services:**
   ```bash
   docker ps
   curl http://localhost/health
   curl http://localhost/api/health
   ```

## Configuration Files

The correct database credentials are in:
- `backend/.env.production`:
  ```
  DB_USER=postgres
  DB_PASSWORD=Prod_DB_P@ssw0rd_2024_Secure_Random_Key_9Ht03GrRP7iK
  DB_NAME=budget_app_prod
  ```

## Common Issues

### Issue: "database does not exist"
**Solution:** Run the create database command:
```bash
docker exec -it budget_database psql -U postgres -c "CREATE DATABASE budget_app_prod;"
```

### Issue: "permission denied for schema public"
**Solution:** Grant proper privileges:
```bash
docker exec -it budget_database psql -U postgres -d budget_app_prod -c "GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;"
```

### Issue: Backend still can't connect
**Solution:** Check environment variables are loaded:
```bash
docker exec budget_backend env | grep DB_
```

If variables are missing, restart with proper env file:
```bash
docker-compose down
docker-compose --env-file backend/.env.production up -d
```

## Prevention

To prevent this issue in future deployments:

1. Always use consistent database credentials across environments
2. Initialize database with proper user/password before first deployment
3. Test database connection before deploying backend
4. Keep `.env.production` in sync with database initialization scripts

## Related Files
- `backend/.env.production` - Backend database configuration
- `docker-compose.yml` - Database container configuration
- `scripts/fix-production-db-auth.sh` - Automated fix script
- `scripts/create-admin-user.sh` - Admin user creation script
