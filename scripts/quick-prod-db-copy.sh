#!/bin/bash

echo "🔍 Production Database Kopyalama - Hızlı Yöntem"
echo "=============================================="

echo "1️⃣ Production'a bağlanıp container'ı buluyorum..."

# Production'da postgres container'ını bul ve backup al
ssh obiwan@test.budgetapp.site << 'EOF'
echo "📋 Çalışan container'ları listeliyorum..."
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

echo ""
echo "🔍 PostgreSQL container'ını buluyorum..."
POSTGRES_CONTAINER=$(docker ps --filter "ancestor=postgres" --format "{{.Names}}" | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ PostgreSQL container bulunamadı!"
    echo "Mevcut container'lar:"
    docker ps
    exit 1
fi

echo "✅ PostgreSQL container bulundu: $POSTGRES_CONTAINER"

echo ""
echo "💾 Database backup alınıyor..."
docker exec $POSTGRES_CONTAINER pg_dump -U budget_admin -d budget_app --no-owner --no-privileges > /tmp/prod_backup.sql

if [ $? -eq 0 ]; then
    echo "✅ Backup başarılı!"
    echo "📊 Backup boyutu:"
    ls -lh /tmp/prod_backup.sql
    
    echo ""
    echo "📋 Backup içeriği özeti:"
    head -20 /tmp/prod_backup.sql | grep -E "(CREATE TABLE|INSERT INTO)" | head -5
    echo "..."
    echo "Toplam satır sayısı: $(wc -l < /tmp/prod_backup.sql)"
else
    echo "❌ Backup başarısız!"
    exit 1
fi
EOF

if [ $? -ne 0 ]; then
    echo "❌ Production backup işlemi başarısız!"
    exit 1
fi

echo ""
echo "2️⃣ Backup'ı test VM'e kopyalıyorum..."
scp obiwan@test.budgetapp.site:/tmp/prod_backup.sql /tmp/

echo "✅ Backup local'e indirildi"

scp /tmp/prod_backup.sql obiwan@20.224.194.131:/tmp/

echo "✅ Backup test VM'e yüklendi"

echo ""
echo "3️⃣ Test VM'de database restore ediyorum..."

ssh obiwan@20.224.194.131 << 'EOF'
cd /home/obiwan/budget-app

echo "🔍 Test database container durumu:"
docker ps | grep database

echo ""
echo "🗑️ Mevcut test database'ini temizliyorum..."

# Database'i drop et ve yeniden oluştur
docker exec budget_database_test psql -U budget_admin -d postgres << 'PSQL_EOF'
-- Aktif bağlantıları sonlandır
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'budget_app_test' AND pid <> pg_backend_pid();

-- Database'i drop et
DROP DATABASE IF EXISTS budget_app_test;

-- Yeniden oluştur
CREATE DATABASE budget_app_test OWNER budget_admin;
PSQL_EOF

echo "✅ Database temizlendi"

echo ""
echo "📥 Production backup'ı restore ediyorum..."
docker exec -i budget_database_test psql -U budget_admin -d budget_app_test < /tmp/prod_backup.sql

if [ $? -eq 0 ]; then
    echo "✅ Restore başarılı!"
    
    echo ""
    echo "📊 Restore edilen veri kontrol ediliyor..."
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
    
    echo ""
    echo "👥 Kullanıcı örnekleri:"
    docker exec budget_database_test psql -U budget_admin -d budget_app_test -c "
    SELECT id, username, email, first_name, last_name 
    FROM users 
    ORDER BY created_at DESC 
    LIMIT 3;
    "
else
    echo "❌ Restore başarısız!"
    exit 1
fi

# Geçici dosyayı temizle
rm -f /tmp/prod_backup.sql
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "4️⃣ Backend'i yeniden başlatıyorum..."
    ssh obiwan@20.224.194.131 << 'EOF'
cd /home/obiwan/budget-app
docker-compose restart backend
sleep 5
echo "🏥 Health check:"
curl -s http://localhost/api/health || echo "API henüz hazır değil"
EOF

    echo ""
    echo "✅ İşlem Tamamlandı!"
    echo "==================="
    echo ""
    echo "🌐 Test sitesi: http://20.224.194.131"
    echo "🔑 Artık production kullanıcılarıyla login olabilirsin!"
    
    # Local geçici dosyayı temizle
    rm -f /tmp/prod_backup.sql
    
    # Production geçici dosyayı temizle
    ssh obiwan@test.budgetapp.site "rm -f /tmp/prod_backup.sql"
    
else
    echo "❌ Test VM'de işlem başarısız!"
    exit 1
fi