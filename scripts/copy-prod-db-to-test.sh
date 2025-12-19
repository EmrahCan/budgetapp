#!/bin/bash

# Production Database'ini Test VM'e Kopyalama Scripti
# Bu script production database'ini backup alıp test VM'e restore eder

set -e  # Hata durumunda scripti durdur

echo "🔄 Production Database'ini Test VM'e Kopyalama İşlemi Başlıyor..."
echo "================================================================="

# Değişkenler
PROD_HOST="test.budgetapp.site"
PROD_USER="obiwan"
TEST_HOST="20.224.194.131"
TEST_USER="obiwan"
BACKUP_FILE="prod_backup_$(date +%Y%m%d_%H%M%S).sql"
TEMP_DIR="/tmp/db_migration"

echo "📋 İşlem Bilgileri:"
echo "   Production Host: $PROD_HOST"
echo "   Test Host: $TEST_HOST"
echo "   Backup Dosyası: $BACKUP_FILE"
echo ""

# Geçici dizin oluştur
mkdir -p $TEMP_DIR

echo "1️⃣ Production Database Backup Alınıyor..."
echo "=========================================="

# Production'dan database backup al
ssh $PROD_USER@$PROD_HOST << EOF
echo "🔍 Production database container'ını buluyorum..."
PROD_CONTAINER=\$(docker ps --format "table {{.Names}}" | grep postgres | head -1)
if [ -z "\$PROD_CONTAINER" ]; then
    echo "❌ Production database container bulunamadı!"
    exit 1
fi
echo "✅ Container bulundu: \$PROD_CONTAINER"

echo "💾 Database backup alınıyor..."
docker exec \$PROD_CONTAINER pg_dump -U budget_admin -d budget_app --no-owner --no-privileges > /tmp/$BACKUP_FILE

echo "📊 Backup boyutu:"
ls -lh /tmp/$BACKUP_FILE

echo "✅ Production backup tamamlandı!"
EOF

if [ $? -ne 0 ]; then
    echo "❌ Production backup alınamadı!"
    exit 1
fi

echo ""
echo "2️⃣ Backup Dosyası Test VM'e Aktarılıyor..."
echo "==========================================="

# Backup dosyasını test VM'e kopyala
scp $PROD_USER@$PROD_HOST:/tmp/$BACKUP_FILE $TEMP_DIR/

echo "✅ Backup dosyası local'e indirildi"

# Local'den test VM'e yükle
scp $TEMP_DIR/$BACKUP_FILE $TEST_USER@$TEST_HOST:/tmp/

echo "✅ Backup dosyası test VM'e yüklendi"

echo ""
echo "3️⃣ Test VM Database Hazırlanıyor..."
echo "==================================="

# Test VM'de database'i temizle ve restore et
ssh $TEST_USER@$TEST_HOST << EOF
echo "🔍 Test database container'ını buluyorum..."
cd /home/obiwan/budget-app

# Container durumunu kontrol et
docker ps | grep budget_database_test

echo "🗑️ Mevcut database'i temizliyorum..."
# Database'i drop et ve yeniden oluştur
docker exec -i budget_database_test psql -U budget_admin -d postgres << 'PSQL_EOF'
-- Aktif bağlantıları sonlandır
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'budget_app_test' AND pid <> pg_backend_pid();

-- Database'i drop et
DROP DATABASE IF EXISTS budget_app_test;

-- Yeniden oluştur
CREATE DATABASE budget_app_test OWNER budget_admin;
PSQL_EOF

echo "✅ Database temizlendi ve yeniden oluşturuldu"

echo "📥 Production backup'ı restore ediyorum..."
# Backup'ı restore et
docker exec -i budget_database_test psql -U budget_admin -d budget_app_test < /tmp/$BACKUP_FILE

echo "✅ Database restore tamamlandı!"

echo "🔍 Restore edilen veri kontrol ediliyor..."
docker exec budget_database_test psql -U budget_admin -d budget_app_test -c "
SELECT 
    'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 
    'accounts' as table_name, COUNT(*) as record_count FROM accounts
UNION ALL
SELECT 
    'transactions' as table_name, COUNT(*) as record_count FROM transactions
UNION ALL
SELECT 
    'credit_cards' as table_name, COUNT(*) as record_count FROM credit_cards
ORDER BY table_name;
"

echo "👥 İlk 3 kullanıcı:"
docker exec budget_database_test psql -U budget_admin -d budget_app_test -c "
SELECT id, username, email, first_name, last_name, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 3;
"

# Geçici dosyayı temizle
rm -f /tmp/$BACKUP_FILE
EOF

if [ $? -ne 0 ]; then
    echo "❌ Test VM'de restore işlemi başarısız!"
    exit 1
fi

echo ""
echo "4️⃣ Backend Servisini Yeniden Başlatma..."
echo "========================================"

# Backend'i restart et ki yeni database'e bağlansın
ssh $TEST_USER@$TEST_HOST << EOF
cd /home/obiwan/budget-app
echo "🔄 Backend container'ını yeniden başlatıyorum..."
docker-compose restart backend

echo "⏳ Backend'in hazır olmasını bekliyorum..."
sleep 10

echo "🏥 Backend health check..."
docker exec budget_backend_test curl -f http://localhost:5001/health || echo "Health check başarısız"

echo "📊 Container durumları:"
docker-compose ps
EOF

echo ""
echo "5️⃣ Temizlik İşlemleri..."
echo "======================="

# Production'daki geçici dosyayı temizle
ssh $PROD_USER@$PROD_HOST "rm -f /tmp/$BACKUP_FILE"

# Local geçici dosyaları temizle
rm -rf $TEMP_DIR

echo ""
echo "✅ Production Database Test VM'e Başarıyla Kopyalandı!"
echo "======================================================"
echo ""
echo "🌐 Test Erişim Bilgileri:"
echo "   Frontend: http://20.224.194.131"
echo "   API: http://20.224.194.131/api/health"
echo ""
echo "🔑 Artık production kullanıcılarıyla login olabilirsin!"
echo ""
echo "📋 Sonraki Adımlar:"
echo "   1. Frontend'e git: http://20.224.194.131"
echo "   2. Production kullanıcı bilgileriyle login ol"
echo "   3. Tüm fonksiyonları test et"
echo ""
echo "🎉 İşlem Tamamlandı!"