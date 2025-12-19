#!/bin/bash

# Fix Email Preferences - Table Name Mismatch
# This script fixes the mismatch between database table name and backend model

set -e

echo "🔧 Fixing Email Preferences Table Name Issue..."
echo "================================================"

VM_HOST="obiwan@20.224.194.131"
REMOTE_DIR="/home/obiwan/budget-app"

echo ""
echo "📦 Step 1: Copy updated backend files to VM..."
scp backend/models/EmailPreferences.js $VM_HOST:$REMOTE_DIR/backend/models/
scp backend/routes/email.js $VM_HOST:$REMOTE_DIR/backend/routes/

echo ""
echo "🔄 Step 2: Restart backend container..."
ssh $VM_HOST "cd $REMOTE_DIR && docker-compose restart backend"

echo ""
echo "⏳ Step 3: Wait for backend to be healthy..."
sleep 5

echo ""
echo "🧪 Step 4: Test email preferences API..."
ssh $VM_HOST "docker logs budget_backend --tail 20"

echo ""
echo "✅ Email preferences fix deployed!"
echo ""
echo "📋 Next steps:"
echo "1. Test API: curl -X GET https://test.budgetapp.site/api/email/preferences -H 'Authorization: Bearer TOKEN'"
echo "2. Visit: https://test.budgetapp.site/profile"
echo "3. Check Email Notifications tab"
echo ""
