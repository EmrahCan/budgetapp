#!/bin/bash

# Fix Production Database Authentication
# This script resets the database user and password

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Fix Production DB Authentication     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Database credentials from .env.production
DB_NAME="budget_app_prod"
DB_USER="postgres"
DB_PASSWORD="Prod_DB_P@ssw0rd_2024_Secure_Random_Key_9Ht03GrRP7iK"

echo -e "${YELLOW}📋 Step 1: Checking database container...${NC}"
if ! docker ps | grep -q budget_database; then
    echo -e "${RED}❌ Database container is not running!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Database container is running${NC}"

echo ""
echo -e "${YELLOW}📋 Step 2: Resetting postgres user password...${NC}"
docker exec -i budget_database psql -U postgres <<EOF
-- Reset postgres user password
ALTER USER postgres WITH PASSWORD '${DB_PASSWORD}';
\q
EOF
echo -e "${GREEN}✅ Password reset successfully${NC}"

echo ""
echo -e "${YELLOW}📋 Step 3: Verifying database exists...${NC}"
DB_EXISTS=$(docker exec -i budget_database psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'")
if [ "$DB_EXISTS" != "1" ]; then
    echo -e "${YELLOW}⚠️  Database doesn't exist, creating...${NC}"
    docker exec -i budget_database psql -U postgres -c "CREATE DATABASE ${DB_NAME};"
    echo -e "${GREEN}✅ Database created${NC}"
else
    echo -e "${GREEN}✅ Database exists${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Step 4: Setting database privileges...${NC}"
docker exec -i budget_database psql -U postgres -d ${DB_NAME} <<EOF
-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
\q
EOF
echo -e "${GREEN}✅ Privileges set${NC}"

echo ""
echo -e "${YELLOW}📋 Step 5: Restarting backend container...${NC}"
docker restart budget_backend
echo -e "${GREEN}✅ Backend restarted${NC}"

echo ""
echo -e "${YELLOW}⏳ Waiting for backend to start (15 seconds)...${NC}"
sleep 15

echo ""
echo -e "${YELLOW}📋 Step 6: Checking backend logs...${NC}"
docker logs budget_backend --tail=30 | tail -20

echo ""
echo -e "${YELLOW}📋 Step 7: Testing database connection from backend...${NC}"
docker exec budget_backend node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'database',
  port: 5432,
  database: '${DB_NAME}',
  user: '${DB_USER}',
  password: '${DB_PASSWORD}'
});

(async () => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connection successful!');
    console.log('Time:', result.rows[0].current_time);
    console.log('PostgreSQL:', result.rows[0].pg_version.split(' ')[0], result.rows[0].pg_version.split(' ')[1]);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
})();
" 2>&1

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Database Authentication Fixed!       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Test health endpoint: curl http://localhost/health"
echo "2. Create admin user: ./scripts/create-admin-user.sh"
echo "3. Test login at: http://4.180.255.34"
