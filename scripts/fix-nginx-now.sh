#!/bin/bash

# Quick fix for nginx SSL issue on Test VM

TEST_VM_IP="20.224.194.131"
TEST_VM_USER="obiwan"

echo "🔧 Fixing nginx configuration on Test VM..."

# Copy the correct nginx.conf (without SSL)
echo "📦 Copying nginx.conf..."
scp budget/nginx/nginx.conf ${TEST_VM_USER}@${TEST_VM_IP}:/home/obiwan/budget-app/nginx/nginx.conf

# Restart nginx
echo "🔄 Restarting nginx..."
ssh ${TEST_VM_USER}@${TEST_VM_IP} "cd /home/obiwan/budget-app && docker-compose restart nginx"

echo "⏳ Waiting for nginx to start..."
sleep 5

# Check status
echo "📊 Checking nginx status..."
ssh ${TEST_VM_USER}@${TEST_VM_IP} "docker ps | grep nginx"

echo "✅ Done! Check https://test.budgetapp.site"
