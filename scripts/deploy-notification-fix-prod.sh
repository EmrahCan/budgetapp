#!/bin/bash

# Production Deployment Script - Notification Fix
# This script deploys the notification fix to production VM

set -e  # Exit on error

echo "🚀 Starting Production Deployment - Notification Fix"
echo "=================================================="
echo ""

# Production VM details
PROD_VM="obiwan@4.210.196.73"
PROD_PATH="~/budgetapp"

echo "📋 Deployment Details:"
echo "  VM: $PROD_VM"
echo "  Path: $PROD_PATH"
echo "  Commit: 6d6764b (NotificationContext fix)"
echo ""

# Confirm deployment
read -p "⚠️  Deploy to PRODUCTION? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🔄 Step 1: Pulling latest code on production VM..."
ssh $PROD_VM << 'ENDSSH'
cd ~/budgetapp
echo "Current commit:"
git log --oneline -1
echo ""
echo "Pulling latest changes..."
git pull origin main
echo ""
echo "New commit:"
git log --oneline -1
ENDSSH

echo ""
echo "🐳 Step 2: Rebuilding and restarting Docker containers..."
ssh $PROD_VM << 'ENDSSH'
cd ~/budgetapp
echo "Stopping containers..."
docker-compose down
echo ""
echo "Building and starting containers..."
docker-compose up -d --build
echo ""
echo "Waiting for containers to be healthy..."
sleep 10
ENDSSH

echo ""
echo "🏥 Step 3: Health check..."
ssh $PROD_VM << 'ENDSSH'
cd ~/budgetapp
echo "Container status:"
docker-compose ps
echo ""
echo "Backend logs (last 10 lines):"
docker-compose logs backend --tail=10
ENDSSH

echo ""
echo "🌐 Step 4: Testing production endpoint..."
echo "Testing: https://budgetapp.site/health"
curl -s https://budgetapp.site/health | jq '.' || echo "Health check response received"

echo ""
echo "✅ Production deployment completed!"
echo ""
echo "📝 Next steps:"
echo "  1. Login to https://budgetapp.site"
echo "  2. Check if notifications appear on dashboard"
echo "  3. Monitor logs: ssh $PROD_VM 'cd ~/budgetapp && docker-compose logs -f backend'"
echo ""
echo "🔄 Rollback if needed:"
echo "  ssh $PROD_VM 'cd ~/budgetapp && git reset --hard 4b07045 && docker-compose down && docker-compose up -d'"
echo ""
