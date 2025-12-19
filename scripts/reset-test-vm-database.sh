#!/bin/bash

# Test VM Database Reset Script
set -e

TEST_SERVER="obiwan@20.224.194.131"

echo "=== Test VM Database Reset ==="
echo ""

echo "Step 1: Container'ları durdur..."
ssh $TEST_SERVER 'cd /home/obiwan/budget-app && docker-compose down'

echo "Step 2: Database volume'unu sil..."
ssh $TEST_SERVER 'docker volume rm budget-app_postgres_data || true'

echo "Step 3: .env dosyasını düzelt (DB_NAME=budget_app)..."
ssh $TEST_SERVER 'cd /home/obiwan/budget-app && sed -i "s/DB_NAME=budget_app_prod/DB_NAME=budget_app/" .env'

echo "Step 4: Container'ları yeniden başlat..."
ssh $TEST_SERVER 'cd /home/obiwan/budget-app && docker-compose up -d'

echo "Step 5: Database'in hazır olmasını bekle (30 saniye)..."
sleep 30

echo ""
echo "✅ Test VM database reset tamamlandı!"
echo ""
echo "Kontrol et:"
echo "  ssh $TEST_SERVER 'cd /home/obiwan/budget-app && docker-compose logs database | tail -20'"
