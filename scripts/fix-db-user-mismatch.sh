#!/bin/bash

# Fix Database User Mismatch
# This script fixes the mismatch between docker-compose and backend .env

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Fix Database User Mismatch           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}📋 Problem: Backend expects 'postgres' user but database has 'budget_admin'${NC}"
echo ""

# Check which user exists in database
echo -e "${YELLOW}📋 Step 1: Checking current database user...${NC}"
CURRENT_USER=$(docker exec budget_database psql -U budget_admin -d budget_app_prod -tAc "SELECT current_user;" 2>/dev/null || echo "NONE")

if [ "$CURRENT_USER" = "budget_admin" ]; then
    echo -e "${GREEN}✅ Database user is: budget_admin${NC}"
    echo -e "${YELLOW}📋 Step 2: Updating backend .env.production to use budget_admin...${NC}"
    
    # Update backend .env.production
    sed -i 's/DB_USER=postgres/DB_USER=budget_admin/g' backend/.env.production
    
    echo -e "${GREEN}✅ Backend configuration updated${NC}"
    
    echo ""
    echo -e "${YELLOW}📋 Step 3: Restarting backend container...${NC}"
    docker restart budget_backend
    
    echo ""
    echo -e "${YELLOW}⏳ Waiting for backend to start (15 seconds)...${NC}"
    sleep 15
    
    echo ""
    echo -e "${YELLOW}📋 Step 4: Testing database connection...${NC}"
    docker exec budget_backend node -e "
    const { Pool } = require('pg');
    const pool = new Pool({
      host: 'database',
      port: 5432,
      database: 'budget_app_prod',
      user: 'budget_admin',
      password: 'Prod_DB_P@ssw0rd_2024_Secure_Random_Key_9Ht03GrRP7iK'
    });
    
    (async () => {
      try {
        const result = await pool.query('SELECT current_user, current_database(), version()');
        console.log('✅ Connection successful!');
        console.log('User:', result.rows[0].current_user);
        console.log('Database:', result.rows[0].current_database);
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
    echo -e "${GREEN}║   Database User Mismatch Fixed!        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Create admin user: ./scripts/create-admin-user.sh"
    echo "2. Test login at: https://budgetapp.site"
    
else
    echo -e "${RED}❌ Could not connect to database${NC}"
    echo "Database might need to be recreated with correct user"
    exit 1
fi
