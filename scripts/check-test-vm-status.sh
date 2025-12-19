#!/bin/bash

# Check Test VM Status
# Quick diagnostic script to check all containers and services

set -e

TEST_VM_IP="20.224.194.131"
TEST_VM_USER="obiwan"

echo "🔍 Checking Test VM Status..."
echo "=============================="
echo ""

ssh ${TEST_VM_USER}@${TEST_VM_IP} << 'ENDSSH'
cd /home/obiwan/budget-app

echo "📦 Container Status:"
echo "-------------------"
docker-compose ps

echo ""
echo "🔍 Container Health:"
echo "-------------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📊 Recent Backend Logs:"
echo "----------------------"
docker logs budget_backend_test --tail 30

echo ""
echo "📊 Recent Nginx Logs:"
echo "--------------------"
docker logs budget_nginx_test --tail 20

echo ""
echo "🌐 Network Test:"
echo "---------------"
echo "Testing backend from nginx container..."
docker exec budget_nginx_test wget -q -O- http://backend:5001/health 2>&1 || echo "❌ Backend not reachable"

echo ""
echo "Testing frontend from nginx container..."
docker exec budget_nginx_test wget -q -O- http://frontend:3000/ 2>&1 | head -5 || echo "❌ Frontend not reachable"

ENDSSH

echo ""
echo "✅ Status check complete"
