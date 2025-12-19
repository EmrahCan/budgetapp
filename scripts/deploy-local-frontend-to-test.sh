#!/bin/bash

# Local Frontend'i Test VM'e Deploy Script
set -e

TEST_SERVER="obiwan@20.224.194.131"

echo "=== Local Frontend -> Test VM Deploy ==="
echo ""

echo "Step 1: Local'de frontend build al..."
cd frontend
npm run build

echo ""
echo "Step 2: Build dosyalarını test VM'e kopyala..."
scp -r build/* $TEST_SERVER:/tmp/frontend-build/

echo ""
echo "Step 3: Test VM'de frontend container'ını güncelle..."
ssh $TEST_SERVER '
cd /home/obiwan/budget-app
docker-compose exec -T frontend rm -rf /usr/share/nginx/html/*
docker cp /tmp/frontend-build/. budget_frontend:/usr/share/nginx/html/
docker-compose restart frontend nginx
'

echo ""
echo "Step 4: Geçici dosyaları temizle..."
ssh $TEST_SERVER 'rm -rf /tmp/frontend-build'

echo ""
echo "✅ Frontend deploy tamamlandı!"
echo ""
echo "Test et: http://20.224.194.131"