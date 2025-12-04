const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const EmailPreferences = require('../models/EmailPreferences');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route   GET /api/email/test
 * @desc    Send a test email
 * @access  Private
 */
router.get('/test', authenticateToken, async (req, res) => {
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

module.exports = router;

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
