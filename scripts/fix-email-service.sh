#!/bin/bash

echo "=== Email Service Fix Script ==="
echo ""

# Navigate to backend directory
cd ~/budget-app/backend 2>/dev/null || cd ~/budgetapp/backend 2>/dev/null || cd backend 2>/dev/null

if [ ! -f package.json ]; then
    echo "✗ Error: Cannot find backend directory"
    exit 1
fi

echo "Current directory: $(pwd)"
echo ""

# Step 1: Check if resend is installed
echo "Step 1: Checking resend package..."
if [ ! -d node_modules/resend ]; then
    echo "✗ resend package not found. Installing..."
    npm install resend@^2.0.0
else
    echo "✓ resend package already installed"
fi
echo ""

# Step 2: Verify .env.production has email config
echo "Step 2: Checking .env.production..."
if [ -f .env.production ]; then
    if grep -q "RESEND_API_KEY" .env.production; then
        echo "✓ RESEND_API_KEY found"
    else
        echo "✗ RESEND_API_KEY missing - adding it..."
        cat >> .env.production << 'EOF'

# Resend Email Configuration
RESEND_API_KEY=re_hMbYvtBp_D7t3VQujdLRmtqZZBrufsQXB
RESEND_FROM_EMAIL=notifications@budgetapp.site
RESEND_FROM_NAME=Budget App

# Email Configuration
EMAIL_ENABLED=true
EMAIL_BATCH_SIZE=50
EMAIL_RATE_LIMIT_PER_MINUTE=100
EMAIL_RETRY_ATTEMPTS=3
EMAIL_RETRY_DELAY_MS=2000

# Email Scheduling
EMAIL_DIGEST_DEFAULT_TIME=08:00
EMAIL_REPORT_TIME=09:00
EOF
        echo "✓ Email configuration added"
    fi
else
    echo "✗ .env.production not found"
fi
echo ""

# Step 3: Restart backend
echo "Step 3: Restarting backend..."
pm2 restart budget-backend 2>/dev/null || pm2 restart all 2>/dev/null || echo "PM2 restart failed - try manually"
echo ""

# Step 4: Wait for backend to start
echo "Step 4: Waiting for backend to start..."
sleep 3
echo ""

# Step 5: Check logs
echo "Step 5: Checking recent logs..."
pm2 logs budget-backend --lines 20 --nostream | grep -i "email\|error\|initialized" || echo "No relevant logs"
echo ""

# Step 6: Test health endpoint
echo "Step 6: Testing health endpoint..."
sleep 2
HEALTH_RESPONSE=$(curl -s http://localhost:5001/health)
echo "$HEALTH_RESPONSE" | jq '.services.email' 2>/dev/null || echo "Health check failed or jq not installed"
echo ""

echo "=== Fix Complete ==="
echo ""
echo "Next steps:"
echo "1. Check logs: pm2 logs budget-backend"
echo "2. Test health: curl http://localhost:5001/health | jq"
echo "3. If still failing, check: pm2 logs budget-backend --err"
