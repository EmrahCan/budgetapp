#!/bin/bash

echo "=== Simple Email Service Test ==="
echo ""

# Test 1: Check if backend is responding
echo "Test 1: Backend health check..."
HEALTH=$(curl -s http://localhost:5001/health)
if [ $? -eq 0 ]; then
    echo "✓ Backend is responding"
    echo "$HEALTH" | jq '.services.email' 2>/dev/null || echo "$HEALTH" | grep -o '"email":{[^}]*}'
else
    echo "✗ Backend is not responding"
    exit 1
fi
echo ""

# Test 2: Check email service status
echo "Test 2: Email service status..."
EMAIL_STATUS=$(echo "$HEALTH" | jq -r '.services.email.status' 2>/dev/null)
EMAIL_ENABLED=$(echo "$HEALTH" | jq -r '.services.email.enabled' 2>/dev/null)

echo "Status: $EMAIL_STATUS"
echo "Enabled: $EMAIL_ENABLED"
echo ""

# Test 3: Check backend logs for errors
echo "Test 3: Recent backend logs..."
pm2 logs budget-backend --lines 10 --nostream 2>/dev/null | tail -10
echo ""

# Test 4: Check if resend module is loaded
echo "Test 4: Checking if resend module exists..."
cd ~/budget-app/backend 2>/dev/null || cd ~/budgetapp/backend 2>/dev/null
if [ -d node_modules/resend ]; then
    echo "✓ resend module found"
    ls -lh node_modules/resend/package.json 2>/dev/null
else
    echo "✗ resend module NOT found"
    echo "Run: npm install resend"
fi
echo ""

echo "=== Test Complete ==="
