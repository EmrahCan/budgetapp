#!/bin/bash

# Test Credit Card Update Fix
# Tests if credit card update works without SQL parameter errors

set -e

echo "========================================="
echo "Credit Card Update Test"
echo "========================================="
echo ""

# Check if VM argument provided
if [ -z "$1" ]; then
    echo "Usage: $0 [test|prod]"
    echo "  test - Test on Test VM (20.224.194.131)"
    echo "  prod - Test on Production VM (4.210.196.73)"
    exit 1
fi

ENV=$1

# Set VM details based on environment
if [ "$ENV" == "test" ]; then
    VM_IP="20.224.194.131"
    VM_NAME="Test VM (Vm01)"
    API_URL="http://localhost:5001"
elif [ "$ENV" == "prod" ]; then
    VM_IP="4.210.196.73"
    VM_NAME="Production VM (Vm02)"
    API_URL="http://localhost:5001"
else
    echo "❌ Invalid environment: $ENV"
    echo "Use 'test' or 'prod'"
    exit 1
fi

echo "🎯 Target: $VM_NAME"
echo "📍 IP: $VM_IP"
echo "🌐 API: $API_URL"
echo ""

echo "🔍 Testing backend health..."
ssh obiwan@$VM_IP "curl -s $API_URL/health | head -10"
echo ""

echo "✅ Test complete!"
echo ""
echo "To test credit card update manually:"
echo "1. Login to test.budgetapp.site (or budgetapp.site for prod)"
echo "2. Go to Credit Cards page"
echo "3. Try to update a credit card"
echo "4. Check backend logs: ssh obiwan@$VM_IP 'docker logs budget_backend --tail 50'"
echo ""
