#!/bin/bash
# Budget App - Create Admin User
# Creates an admin user directly in the database

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Budget App - Create Admin User      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Admin credentials (same for test and production)
ADMIN_EMAIL="admin@budgetapp.site"
ADMIN_PASSWORD="Admin123!@#"
ADMIN_NAME="Admin"
ADMIN_SURNAME="User"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Check if database container is running
if ! docker ps | grep -q budget_database; then
    echo -e "${RED}❌ Database container is not running${NC}"
    echo "Start it with: docker-compose up -d"
    exit 1
fi

echo -e "${YELLOW}Creating admin user...${NC}"
echo ""
echo "Email: $ADMIN_EMAIL"
echo "Password: $ADMIN_PASSWORD"
echo "Name: $ADMIN_NAME $ADMIN_SURNAME"
echo ""

# Create SQL script to insert admin user
# Password is hashed using bcrypt with salt rounds 10
# Hash for "Admin123!@#" is: $2b$10$rZ5YhkqJ9vX8K.xN5L5Ziu8YhkqJ9vX8K.xN5L5Ziu8YhkqJ9vX8K
# Note: In production, this should be generated dynamically

# Generate bcrypt hash using Node.js
HASHED_PASSWORD=$(docker exec budget_backend node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('$ADMIN_PASSWORD', 10, (err, hash) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(hash);
});
")

if [ -z "$HASHED_PASSWORD" ]; then
    echo -e "${RED}❌ Failed to generate password hash${NC}"
    exit 1
fi

# Check if admin user already exists
EXISTING_USER=$(docker exec budget_database psql -U ${DB_USER} -d ${DB_NAME} -t -c \
    "SELECT id FROM users WHERE email = '$ADMIN_EMAIL';")

if [ ! -z "$EXISTING_USER" ]; then
    echo -e "${YELLOW}⚠️  Admin user already exists${NC}"
    echo ""
    read -p "Do you want to update the password? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Update existing user
        docker exec budget_database psql -U ${DB_USER} -d ${DB_NAME} -c \
            "UPDATE users SET 
                password = '$HASHED_PASSWORD',
                role = 'admin',
                is_active = true,
                updated_at = NOW()
             WHERE email = '$ADMIN_EMAIL';"
        
        echo -e "${GREEN}✓ Admin user password updated${NC}"
    else
        echo -e "${YELLOW}Skipping update${NC}"
    fi
else
    # Insert new admin user
    docker exec budget_database psql -U ${DB_USER} -d ${DB_NAME} -c \
        "INSERT INTO users (email, password, name, surname, role, is_active, created_at, updated_at)
         VALUES (
             '$ADMIN_EMAIL',
             '$HASHED_PASSWORD',
             '$ADMIN_NAME',
             '$ADMIN_SURNAME',
             'admin',
             true,
             NOW(),
             NOW()
         );"
    
    echo -e "${GREEN}✓ Admin user created successfully${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Admin User Ready                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Admin Credentials:"
echo "  Email:    $ADMIN_EMAIL"
echo "  Password: $ADMIN_PASSWORD"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Change this password after first login!${NC}"
echo ""
echo "Login at:"
echo "  Test: https://test.budgetapp.site"
echo "  Prod: https://budgetapp.site"
echo ""

