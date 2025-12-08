#!/bin/bash

echo "=== Email Service Fix for Docker ==="
echo ""

# Navigate to project directory
cd ~/budget || cd ~/budgetapp || cd ~/budget-app

if [ ! -f docker-compose.yml ]; then
    echo "✗ Error: Cannot find docker-compose.yml"
    exit 1
fi

echo "Current directory: $(pwd)"
echo ""

# Step 1: Check if resend is in package.json
echo "Step 1: Checking package.json..."
if grep -q '"resend"' backend/package.json; then
    echo "✓ resend package found in package.json"
else
    echo "✗ resend package NOT in package.json"
    echo "Adding resend to package.json..."
    # This should already be there, but just in case
fi
echo ""

# Step 2: Check .env.production
echo "Step 2: Checking backend/.env.production..."
if [ -f backend/.env.production ]; then
    if grep -q "RESEND_API_KEY" backend/.env.production; then
        echo "✓ RESEND_API_KEY found"
        grep "RESEND_API_KEY" backend/.env.production | sed 's/=.*/=***HIDDEN***/'
    else
        echo "✗ RESEND_API_KEY missing - adding it..."
        cat >> backend/.env.production << 'EOF'

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
    echo "✗ backend/.env.production not found"
fi
echo ""

# Step 3: Rebuild and restart backend container
echo "Step 3: Rebuilding backend container..."
docker-compose up -d --build backend
echo ""

# Step 4: Wait for backend to start
echo "Step 4: Waiting for backend to start..."
sleep 5
echo ""

# Step 5: Check container status
echo "Step 5: Checking container status..."
docker-compose ps
echo ""

# Step 6: Check backend logs
echo "Step 6: Checking backend logs for email service..."
docker-compose logs backend --tail=30 | grep -i "email\|error\|initialized" || echo "No relevant logs"
echo ""

# Step 7: Test health endpoint
echo "Step 7: Testing health endpoint..."
sleep 2
curl -s http://localhost/api/health | grep -o '"email":{[^}]*}' || curl -s http://localhost:5001/health | grep -o '"email":{[^}]*}' || echo "Health check failed"
echo ""

echo "=== Fix Complete ==="
echo ""
echo "Next steps:"
echo "1. Check logs: docker-compose logs backend -f"
echo "2. Check if backend is running: docker-compose ps"
echo "3. Test health: curl http://localhost/api/health"
echo "4. If still failing: docker-compose logs backend --tail=100"
