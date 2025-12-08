#!/bin/bash
# Test VM'den Production VM'e sync script

echo "🚀 Syncing Test VM to Production VM"
echo "===================================="

# Production VM'de çalıştırılacak
cd ~/budgetapp

echo "📝 Step 1: Pulling latest code from test..."
# Test VM'deki mevcut commit'i al
git log -1 --oneline

echo ""
echo "📝 Step 2: Rebuilding containers..."
docker-compose build --no-cache frontend backend

echo ""
echo "📝 Step 3: Restarting services..."
docker-compose up -d

echo ""
echo "📝 Step 4: Checking container status..."
docker-compose ps

echo ""
echo "===================================="
echo "✅ Sync completed!"
echo ""
echo "Test: https://budgetapp.site/profile"
echo ""
