#!/bin/bash
# Production VM'de Email Preferences düzeltmeleri

echo "🚀 Production Email Preferences Fix Deployment"
echo "=============================================="

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Hata kontrolü
set -e

echo ""
echo "${YELLOW}📝 Step 1: Updating translation files...${NC}"

# TR translation
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

# EN translation
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

echo "${GREEN}✅ Translation files updated${NC}"

echo ""
echo "${YELLOW}📝 Step 2: Updating backend email routes (GET -> POST)...${NC}"

# Backend email routes - /test endpoint'ini POST yap
cat > /home/azureuser/budgetapp/backend/routes/email.js << 'EOF'
const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const EmailPreferences = require('../models/EmailPreferences');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route   POST /api/email/test
 * @desc    Send a test email
 * @access  Private
 */
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email not found',
      });
    }

    logger.info('Sending test email', { userId: req.user.id, email: userEmail });

    const result = await emailService.sendTestEmail(userEmail);

    if (result.success) {
      return res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error,
      });
    }
  } catch (error) {
    logger.error('Test email error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/email/stats
 * @desc    Get email delivery statistics
 * @access  Private
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = emailService.getStats();
    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Email stats error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/email/health
 * @desc    Check email service health
 * @access  Private
 */
router.get('/health', authenticateToken, async (req, res) => {
  try {
    const health = await emailService.healthCheck();
    return res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    logger.error('Email health check error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/email/preferences
 * @desc    Get user email preferences
 * @access  Private
 */
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await EmailPreferences.getByUserId(userId);

    return res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    logger.error('Get email preferences error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/email/preferences
 * @desc    Update user email preferences
 * @access  Private
 */
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      email_enabled,
      daily_digest_enabled,
      daily_digest_time,
      report_emails_enabled,
      report_frequency,
      critical_alerts_enabled,
      language,
    } = req.body;

    // Validate report_frequency
    if (report_frequency && !['daily', 'weekly', 'monthly'].includes(report_frequency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report_frequency. Must be daily, weekly, or monthly',
      });
    }

    // Validate language
    if (language && !['tr', 'en'].includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid language. Must be tr or en',
      });
    }

    // Validate time format (HH:MM:SS or HH:MM)
    if (daily_digest_time) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (!timeRegex.test(daily_digest_time)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid time format. Must be HH:MM or HH:MM:SS',
        });
      }
    }

    const preferences = await EmailPreferences.update(userId, {
      email_enabled,
      daily_digest_enabled,
      daily_digest_time,
      report_emails_enabled,
      report_frequency,
      critical_alerts_enabled,
      language,
    });

    logger.info('Email preferences updated', { userId, preferences });

    return res.json({
      success: true,
      message: 'Email preferences updated successfully',
      data: preferences,
    });
  } catch (error) {
    logger.error('Update email preferences error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/email/metrics
 * @desc    Get email delivery metrics
 * @access  Private
 */
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const EmailDeliveryLog = require('../models/EmailDeliveryLog');
    const stats = await EmailDeliveryLog.getStats(userId, startDate, endDate);

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Email metrics error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/email/delivery-logs
 * @desc    Get email delivery logs for user
 * @access  Private
 */
router.get('/delivery-logs', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const EmailDeliveryLog = require('../models/EmailDeliveryLog');
    const logs = await EmailDeliveryLog.getByUserId(userId, limit);

    return res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    logger.error('Email delivery logs error', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

module.exports = router;
EOF

echo "${GREEN}✅ Backend email routes updated${NC}"

echo ""
echo "${YELLOW}📝 Step 3: Rebuilding Docker containers...${NC}"

cd /home/azureuser/budgetapp

# Frontend rebuild
echo "Building frontend..."
docker-compose build --no-cache frontend

# Backend rebuild
echo "Building backend..."
docker-compose build --no-cache backend

echo "${GREEN}✅ Containers rebuilt${NC}"

echo ""
echo "${YELLOW}📝 Step 4: Restarting containers...${NC}"

docker-compose up -d

echo "${GREEN}✅ Containers restarted${NC}"

echo ""
echo "${YELLOW}📝 Step 5: Checking container status...${NC}"

docker-compose ps

echo ""
echo "${YELLOW}📝 Step 6: Testing backend endpoint...${NC}"

sleep 5

# Test endpoint
docker exec budget_backend curl -s -X POST http://localhost:5001/api/email/test \
  -H "Content-Type: application/json" || echo "Endpoint test failed (expected - needs auth)"

echo ""
echo "=============================================="
echo "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo "Test etmek için:"
echo "1. https://budgetapp.site/profile sayfasını yenileyin"
echo "2. Translation'ların düzgün göründüğünü kontrol edin"
echo "3. 'Test E-postası Gönder' butonuna tıklayın"
echo ""
