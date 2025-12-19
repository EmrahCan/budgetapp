#!/bin/bash

# Credit Card Update Bug Fix - Final Version
# Fixes SQL parameter syntax error in CreditCard.js update method

set -e

echo "=========================================="
echo "Credit Card Update Bug Fix - Test VM"
echo "=========================================="
echo ""

# Test VM details
TEST_VM="obiwan@20.224.194.131"
APP_DIR="/home/obiwan/budgetapp"

echo "Step 1: Connecting to Test VM and checking current status..."
ssh $TEST_VM << 'ENDSSH'
cd /home/obiwan/budgetapp

echo "Current git status:"
git status
echo ""

echo "Current branch:"
git branch
echo ""

echo "Checking CreditCard.js for the bug..."
grep -n "updates.push" backend/models/CreditCard.js | head -5
echo ""

ENDSSH

echo ""
echo "Step 2: Creating fixed CreditCard.js file..."

# Create the fix script on the VM
ssh $TEST_VM << 'ENDSSH'
cd /home/obiwan/budgetapp

# Backup the current file
cp backend/models/CreditCard.js backend/models/CreditCard.js.backup.$(date +%Y%m%d_%H%M%S)

# Apply the fix using sed
# Fix line: updates.push(`${dbField} = ${paramIndex++}`);
# To:       updates.push(`${dbField} = $${paramIndex++}`);
sed -i "s/updates\.push(\`\${dbField} = \${paramIndex++}\`);/updates.push(\`\${dbField} = \$\${paramIndex++}\`);/" backend/models/CreditCard.js

# Fix WHERE clause: WHERE id = ${paramIndex}
# To:               WHERE id = $${paramIndex}
sed -i "s/WHERE id = \${paramIndex}/WHERE id = \$\${paramIndex}/" backend/models/CreditCard.js

echo "Fix applied! Checking the changes..."
echo ""
echo "Line with updates.push:"
grep -n "updates.push" backend/models/CreditCard.js | head -5
echo ""
echo "Line with WHERE id:"
grep -n "WHERE id = " backend/models/CreditCard.js | grep paramIndex
echo ""

ENDSSH

echo ""
echo "Step 3: Restarting backend container..."
ssh $TEST_VM << 'ENDSSH'
cd /home/obiwan/budgetapp

echo "Stopping backend container..."
docker-compose stop backend

echo "Starting backend container..."
docker-compose up -d backend

echo "Waiting for backend to be ready..."
sleep 5

echo "Checking backend container status:"
docker ps | grep backend

echo ""
echo "Checking backend logs for errors:"
docker logs budget_backend --tail 30

ENDSSH

echo ""
echo "=========================================="
echo "Fix applied successfully on Test VM!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Test credit card update on test.budgetapp.site"
echo "2. Check backend logs: ssh $TEST_VM 'docker logs budget_backend --tail 50'"
echo "3. If successful, apply to production VM"
echo ""
