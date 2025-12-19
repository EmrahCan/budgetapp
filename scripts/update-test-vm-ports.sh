#!/bin/bash

# Update Test VM to use port 80 instead of 8080

TEST_VM_IP="20.224.194.131"
TEST_VM_USER="obiwan"

echo "🔧 Updating Test VM port configuration..."

# Copy updated docker-compose.yml
echo "📦 Copying docker-compose.yml..."
scp budget/docker-compose.test.yml ${TEST_VM_USER}@${TEST_VM_IP}:/home/obiwan/budget-app/docker-compose.yml

# Recreate nginx container with new port
echo "🔄 Recreating nginx container..."
ssh ${TEST_VM_USER}@${TEST_VM_IP} "cd /home/obiwan/budget-app && docker-compose stop nginx && docker-compose rm -f nginx && docker-compose up -d nginx"

echo "⏳ Waiting for nginx..."
sleep 8

# Check status
echo "📊 Checking status..."
ssh ${TEST_VM_USER}@${TEST_VM_IP} "docker ps | grep nginx"

echo ""
echo "✅ Done! Testing..."
sleep 2
curl -s -o /dev/null -w "HTTP Status from port 80: %{http_code}\n" http://20.224.194.131/api/health
curl -s -o /dev/null -w "HTTP Status from Cloudflare: %{http_code}\n" https://test.budgetapp.site/api/health
