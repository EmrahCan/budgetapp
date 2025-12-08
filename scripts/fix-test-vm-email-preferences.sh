#!/bin/bash
# Test VM'de Email Preferences sorunlarını düzelt

echo "🔧 Test VM Email Preferences Fix Script"
echo "========================================"

# 1. Translation dosyalarını güncelle
echo "📝 Step 1: Updating translation files..."
cat > /home/azureuser/budgetapp/frontend/src/i18n/locales/tr.json << 'JSONEOF'
{
  "common": {
    "appTitle": "Bütçe Yönetimi",
    "save": "Kaydet",
    "cancel": "İptal",
    "sending": "Gönderiliyor...",
    "saving": "Kaydediliyor...",
    "loading": "Yükleniyor..."
  },
  "emailPreferences": {
    "title": "E-posta Bildirimleri",
    "description": "E-posta bildirim tercihlerinizi yönetin",
    "emailEnabled": "E-posta Bildirimleri",
    "emailEnabledHelp": "Tüm e-posta bildirimlerini etkinleştir/devre dışı bırak",
    "dailyDigest": "Günlük Özet",
    "dailyDigestEnabled": "Günlük özet e-postası gönder",
    "dailyDigestHelp": "Günlük harcama özetinizi e-posta ile alın",
    "digestTime": "Gönderim Saati",
    "digestTimeHelp": "Günlük özetin gönderileceği saat",
    "reports": "Raporlar",
    "reportEmailsEnabled": "Rapor e-postaları gönder",
    "reportEmailsHelp": "Periyodik harcama raporlarını e-posta ile alın",
    "reportFrequency": "Rapor Sıklığı",
    "reportFrequencyHelp": "Raporların ne sıklıkla gönderileceği",
    "daily": "Günlük",
    "weekly": "Haftalık",
    "monthly": "Aylık",
    "alerts": "Uyarılar",
    "criticalAlertsEnabled": "Kritik uyarıları gönder",
    "criticalAlertsHelp": "Önemli durumlar için anında e-posta uyarıları",
    "language": "Dil",
    "emailLanguage": "E-posta Dili",
    "emailLanguageHelp": "E-postaların gönderileceği dil",
    "sendTestEmail": "Test E-postası Gönder",
    "testEmailSent": "Test e-postası başarıyla gönderildi! Gelen kutunuzu kontrol edin.",
    "testEmailError": "Test e-postası gönderilemedi",
    "fetchError": "Tercihler yüklenemedi",
    "saveSuccess": "Tercihler başarıyla kaydedildi",
    "saveError": "Tercihler kaydedilemedi"
  }
}
JSONEOF

cat > /home/azureuser/budgetapp/frontend/src/i18n/locales/en.json << 'JSONEOF'
{
  "common": {
    "appTitle": "Budget Management",
    "save": "Save",
    "cancel": "Cancel",
    "sending": "Sending...",
    "saving": "Saving...",
    "loading": "Loading..."
  },
  "emailPreferences": {
    "title": "Email Notifications",
    "description": "Manage your email notification preferences",
    "emailEnabled": "Email Notifications",
    "emailEnabledHelp": "Enable/disable all email notifications",
    "dailyDigest": "Daily Digest",
    "dailyDigestEnabled": "Send daily digest email",
    "dailyDigestHelp": "Receive daily spending summary via email",
    "digestTime": "Send Time",
    "digestTimeHelp": "Time when daily digest will be sent",
    "reports": "Reports",
    "reportEmailsEnabled": "Send report emails",
    "reportEmailsHelp": "Receive periodic spending reports via email",
    "reportFrequency": "Report Frequency",
    "reportFrequencyHelp": "How often reports will be sent",
    "daily": "Daily",
    "weekly": "Weekly",
    "monthly": "Monthly",
    "alerts": "Alerts",
    "criticalAlertsEnabled": "Send critical alerts",
    "criticalAlertsHelp": "Instant email alerts for important situations",
    "language": "Language",
    "emailLanguage": "Email Language",
    "emailLanguageHelp": "Language for email notifications",
    "sendTestEmail": "Send Test Email",
    "testEmailSent": "Test email sent successfully! Check your inbox.",
    "testEmailError": "Failed to send test email",
    "fetchError": "Failed to load preferences",
    "saveSuccess": "Preferences saved successfully",
    "saveError": "Failed to save preferences"
  }
}
JSONEOF

echo "✅ Translation files updated"

# 2. Backend'de email route'ları kontrol et
echo ""
echo "📝 Step 2: Checking backend email routes..."
if [ -f "/home/azureuser/budgetapp/backend/routes/email.js" ]; then
    echo "✅ Email routes file exists"
else
    echo "❌ Email routes file missing!"
fi

# 3. Backend server.js'de route'un register edildiğini kontrol et
echo ""
echo "📝 Step 3: Checking if email routes are registered in server.js..."
if grep -q "email.js" /home/azureuser/budgetapp/backend/server.js; then
    echo "✅ Email routes are registered"
else
    echo "❌ Email routes NOT registered in server.js!"
fi

# 4. Docker container'ları rebuild et
echo ""
echo "📝 Step 4: Rebuilding Docker containers..."
cd /home/azureuser/budgetapp

# Frontend rebuild
echo "Building frontend..."
docker-compose -f docker-compose.test.yml build --no-cache frontend

# Backend restart (email routes için)
echo "Restarting backend..."
docker-compose -f docker-compose.test.yml restart backend

# Container'ları başlat
echo "Starting containers..."
docker-compose -f docker-compose.test.yml up -d

echo ""
echo "✅ Containers rebuilt and restarted"

# 5. Container durumlarını kontrol et
echo ""
echo "📝 Step 5: Checking container status..."
docker-compose -f docker-compose.test.yml ps

# 6. Backend logs kontrol et
echo ""
echo "📝 Step 6: Checking backend logs for email routes..."
docker-compose -f docker-compose.test.yml logs backend | grep -i "email" | tail -20

echo ""
echo "========================================"
echo "✅ Fix script completed!"
echo ""
echo "Test etmek için:"
echo "1. https://test.budgetapp.site/profile sayfasını yenileyin"
echo "2. Translation'ların düzgün göründüğünü kontrol edin"
echo "3. 'Test E-postası Gönder' butonuna tıklayın"
echo ""
