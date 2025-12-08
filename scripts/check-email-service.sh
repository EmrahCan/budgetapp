#!/bin/bash

echo "=== Email Service Diagnostic Script ==="
echo ""

# Check if backend is running
echo "1. Checking if backend is running..."
pm2 list | grep budget-backend || echo "Backend not running with PM2"
echo ""

# Check environment variables
echo "2. Checking environment variables..."
cd ~/budget-app/backend || cd ~/budgetapp/backend || cd backend
if [ -f .env.production ]; then
    echo "✓ .env.production exists"
    echo "Checking Resend configuration:"
    grep "RESEND_API_KEY" .env.production | sed 's/=.*/=***HIDDEN***/'
    grep "RESEND_FROM_EMAIL" .env.production
    grep "EMAIL_ENABLED" .env.production
else
    echo "✗ .env.production NOT FOUND"
fi
echo ""

# Check if resend package is installed
echo "3. Checking if resend package is installed..."
if [ -f package.json ]; then
    grep "resend" package.json || echo "✗ resend package not found in package.json"
fi
echo ""

# Check backend logs for email service
echo "4. Checking backend logs for email service initialization..."
pm2 logs budget-backend --lines 50 --nostream | grep -i "email" || echo "No email-related logs found"
echo ""

# Test health endpoint
echo "5. Testing health endpoint..."
curl -s http://localhost:5001/health | jq '.services.email' || echo "Health endpoint failed"
echo ""

# Check if resend module exists
echo "6. Checking if resend module is installed in node_modules..."
if [ -d node_modules/resend ]; then
    echo "✓ resend module found"
    ls -la node_modules/resend/package.json
else
    echo "✗ resend module NOT FOUND in node_modules"
fi
echo ""

echo "=== Diagnostic Complete ==="
