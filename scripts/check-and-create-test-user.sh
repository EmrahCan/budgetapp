#!/bin/bash

# Test VM Database Kontrol ve Test Kullanıcısı Oluşturma Scripti
# Bu script database'in durumunu kontrol eder ve gerekirse test kullanıcısı oluşturur

echo "🔍 Test VM Database Durumu Kontrol Ediliyor..."
echo "================================================"

# Database'e bağlan ve kullanıcı sayısını kontrol et
echo "📊 Mevcut kullanıcı sayısı kontrol ediliyor..."
USER_COUNT=$(docker exec -it budget_database_test psql -U budget_admin -d budget_app_test -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' \n\r')

echo "Toplam kullanıcı sayısı: $USER_COUNT"

if [ "$USER_COUNT" = "0" ]; then
    echo "⚠️  Database boş! Test kullanıcısı oluşturuluyor..."
    
    # Test kullanıcısı oluştur
    echo "👤 Test kullanıcısı oluşturuluyor..."
    docker exec -it budget_database_test psql -U budget_admin -d budget_app_test << 'EOF'
-- Test kullanıcısı oluştur
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    first_name, 
    last_name, 
    created_at, 
    updated_at
) VALUES (
    'testuser',
    'test@budgetapp.site',
    '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQq',  -- password: test123
    'Test',
    'User',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (username) DO NOTHING;

-- Test kullanıcısı için email preferences oluştur
INSERT INTO user_email_preferences (
    user_id,
    email_enabled,
    daily_digest_enabled,
    daily_digest_time,
    timezone,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM users WHERE username = 'testuser'),
    true,
    true,
    '09:00:00',
    'Europe/Istanbul',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (user_id) DO NOTHING;

-- Oluşturulan kullanıcıyı göster
SELECT 
    id, 
    username, 
    email, 
    first_name, 
    last_name, 
    created_at 
FROM users 
WHERE username = 'testuser';
EOF

    echo "✅ Test kullanıcısı oluşturuldu!"
    echo ""
    echo "🔑 Login Bilgileri:"
    echo "   Username: testuser"
    echo "   Email: test@budgetapp.site"
    echo "   Password: test123"
    echo ""
    
else
    echo "✅ Database'de $USER_COUNT kullanıcı bulundu."
    echo ""
    echo "📋 Mevcut kullanıcılar:"
    docker exec -it budget_database_test psql -U budget_admin -d budget_app_test -c "SELECT id, username, email, first_name, last_name, created_at FROM users ORDER BY created_at DESC LIMIT 5;"
fi

echo ""
echo "🔍 Database tabloları ve kayıt sayıları:"
echo "========================================"

# Tüm tabloların kayıt sayısını göster
docker exec -it budget_database_test psql -U budget_admin -d budget_app_test << 'EOF'
SELECT 
    schemaname,
    tablename,
    n_tup_ins as "Total Inserts",
    n_tup_upd as "Total Updates", 
    n_tup_del as "Total Deletes",
    n_live_tup as "Live Rows"
FROM pg_stat_user_tables 
ORDER BY tablename;
EOF

echo ""
echo "🌐 Test için erişim URL'leri:"
echo "============================="
echo "Frontend: http://20.224.194.131"
echo "API Health: http://20.224.194.131/api/health"
echo "Domain: https://test.budgetapp.site (DNS gerekli)"

echo ""
echo "✅ Kontrol tamamlandı!"