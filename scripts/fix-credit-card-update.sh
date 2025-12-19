#!/bin/bash

# Credit Card Update Fix Deployment Script
# Fixes SQL parameter bug in CreditCard.update() method

set -e

echo "========================================="
echo "Credit Card Update Fix - Deployment"
echo "========================================="
echo ""

# Check if VM argument provided
if [ -z "$1" ]; then
    echo "Usage: $0 [test|prod]"
    echo "  test - Deploy to Test VM (20.224.194.131)"
    echo "  prod - Deploy to Production VM (4.210.196.73)"
    exit 1
fi

ENV=$1

# Set VM details based on environment
if [ "$ENV" == "test" ]; then
    VM_IP="20.224.194.131"
    VM_NAME="Test VM (Vm01)"
    BRANCH="develop"
elif [ "$ENV" == "prod" ]; then
    VM_IP="4.210.196.73"
    VM_NAME="Production VM (Vm02)"
    BRANCH="main"
else
    echo "❌ Invalid environment: $ENV"
    echo "Use 'test' or 'prod'"
    exit 1
fi

echo "🎯 Target: $VM_NAME"
echo "📍 IP: $VM_IP"
echo "🌿 Branch: $BRANCH"
echo ""

# Confirm deployment
read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🚀 Starting deployment..."
echo ""

# SSH and deploy
ssh obiwan@$VM_IP << 'ENDSSH'
set -e

echo "📂 Navigating to app directory..."
cd /home/obiwan/budgetapp

echo "🔍 Checking current status..."
git status
echo ""

echo "📥 Pulling latest code..."
git fetch origin
git pull origin $BRANCH
echo ""

echo "🔄 Restarting backend container..."
docker-compose restart backend

echo "⏳ Waiting for backend to be ready..."
sleep 5

echo "✅ Checking backend status..."
docker ps | grep backend

echo ""
echo "📋 Recent backend logs:"
docker logs budget_backend --tail 20

echo ""
echo "✅ Deployment complete!"
ENDSSH

echo ""
echo "========================================="
echo "✅ Deployment Successful!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Test credit card update in browser"
echo "2. Check backend logs: docker logs budget_backend --tail 50"
echo "3. Monitor for errors"
echo ""
