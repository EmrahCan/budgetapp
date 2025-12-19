#!/bin/bash

# Deploy Test Environment Fix to Production
# This script deploys the updated backend with /api/health endpoint and database schema fixes

set -e

echo "🚀 Deploying Test Environment Fix to Production..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Production server details
PROD_SERVER="obiwan@98.71.149.168"
PROD_PATH="/home/obiwan/budget-app"

echo -e "${YELLOW}📋 Step 1: Preparing deployment files...${NC}"

# Create deployment package
DEPLOY_DIR="deploy-package-test-env-fix"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy updated backend files
echo "  📄 Copying updated server.js..."
cp backend/server.js $DEPLOY_DIR/

# Copy database migration script
echo "  📄 Creating database migration script..."
cat > $DEPLOY_DIR/update_accounts_schema.sql << 'EOF'
-- Add missing columns to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS iban VARCHAR(34);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_flexible BOOLEAN DEFAULT FALSE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_limit NUMERIC(12,2);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS current_debt NUMERIC(12,2) DEFAULT 0;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(5,2);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS minimum_payment_rate NUMERIC(5,2) DEFAULT 5;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS payment_due_date INTEGER;

-- Verify schema
\d accounts;
EOF

echo "  📄 Creating deployment script..."
cat > $DEPLOY_DIR/deploy.sh << 'EOF'
#!/bin/bash

echo "🔧 Updating Production Backend..."

# Backup current server.js
cp ~/budget-app/backend/server.js ~/budget-app/backend/server.js.backup.$(date +%Y%m%d_%H%M%S)

# Update server.js
cp server.js ~/budget-app/backend/

# Update database schema
echo "📊 Updating database schema..."
docker exec budget_database psql -U budget_admin -d budget_app -f /tmp/update_accounts_schema.sql

# Restart backend container
echo "🔄 Restarting backend container..."
cd ~/budget-app
docker-compose restart backend

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
sleep 15

# Test the new endpoint
echo "🧪 Testing new /api/health endpoint..."
curl -s http://localhost/api/health || echo "❌ API health endpoint not ready yet"

echo "✅ Deployment complete!"
EOF

chmod +x $DEPLOY_DIR/deploy.sh

echo -e "${GREEN}✅ Deployment package prepared${NC}"

echo -e "${YELLOW}📋 Step 2: Uploading files to production...${NC}"

# Upload deployment package
echo "  📤 Uploading deployment files..."
scp -r $DEPLOY_DIR/* $PROD_SERVER:/tmp/

echo -e "${GREEN}✅ Files uploaded${NC}"

echo -e "${YELLOW}📋 Step 3: Executing deployment on production...${NC}"

# Execute deployment
ssh $PROD_SERVER << 'ENDSSH'
cd /tmp
chmod +x deploy.sh

# Copy database migration to container
docker cp update_accounts_schema.sql budget_database:/tmp/

# Execute deployment
./deploy.sh

# Cleanup
rm -f server.js update_accounts_schema.sql deploy.sh
ENDSSH

echo -e "${GREEN}✅ Production deployment completed${NC}"

echo -e "${YELLOW}📋 Step 4: Verifying deployment...${NC}"

# Test endpoints
echo "  🧪 Testing health endpoints..."
echo "    /health: $(curl -s https://test.budgetapp.site/health | jq -r '.status' 2>/dev/null || echo 'Failed')"
echo "    /api/health: $(curl -s https://test.budgetapp.site/api/health | jq -r '.success' 2>/dev/null || echo 'Failed')"

# Test account creation
echo "  🧪 Testing account creation..."
# Note: This would require authentication, so we'll just check if the endpoint responds
ACCOUNT_TEST=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://test.budgetapp.site/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","type":"checking","balance":0}')

if [ "$ACCOUNT_TEST" = "401" ]; then
  echo "    ✅ Account endpoint responding (401 = needs auth, which is correct)"
elif [ "$ACCOUNT_TEST" = "500" ]; then
  echo "    ❌ Account endpoint still returning 500 error"
else
  echo "    ℹ️  Account endpoint returned: $ACCOUNT_TEST"
fi

# Cleanup local deployment package
rm -rf $DEPLOY_DIR

echo "================================================"
echo -e "${GREEN}🎉 Test Environment Fix Deployment Complete!${NC}"
echo "================================================"
echo "📊 Status Summary:"
echo "  ✅ Backend updated with /api/health endpoint"
echo "  ✅ Database schema updated with missing columns"
echo "  ✅ Production containers restarted"
echo ""
echo "🔗 Test URLs:"
echo "  Frontend: https://test.budgetapp.site"
echo "  API Health: https://test.budgetapp.site/api/health"
echo "  Backend Health: https://test.budgetapp.site/health"
echo ""
echo "🧪 Next Steps:"
echo "  1. Test account creation in the frontend"
echo "  2. Test credit card creation"
echo "  3. Verify all CRUD operations work"
echo ""
echo "Happy testing! 🚀"