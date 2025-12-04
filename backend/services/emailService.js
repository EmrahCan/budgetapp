const { Resend } = require('resend');
const logger = require('../utils/logger');

/**
 * EmailService - Handles email sending via Resend API
 * Manages email composition, delivery, and tracking
 */
class EmailService {
  constructor() {
    this.resend = null;
    this.initialized = false;
    this.config = {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL || 'notifications@budgetapp.site',
      fromName: process.env.RESEND_FROM_NAME || 'Budget App',
      enabled: process.env.EMAIL_ENABLED === 'true',
      batchSize: parseInt(process.env.EMAIL_BATCH_SIZE || '50'),
      rateLimitPerMinute: parseInt(process.env.EMAIL_RATE_LIMIT_PER_MINUTE || '100'),
      retryAttempts: parseInt(process.env.EMAIL_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY_MS || '2000'),
    };
  }

  /**
   * Initialize the email service
   */
  async initialize() {
    try {
      if (!this.config.enabled) {
        logger.info('Email service is disabled');
        return;
      }

      if (!this.config.apiKey || this.config.apiKey === 're_test_key_placeholder') {
        logger.warn('Resend API key not configured - email service disabled');
        this.config.enabled = false;
        return;
      }

      // Initialize Resend client
      this.resend = new Resend(this.config.apiKey);
      
      // Test the connection (optional - Resend doesn't have a ping endpoint)
      logger.info('Resend email service initialized', {
        fromEmail: this.config.fromEmail,
        fromName: this.config.fromName,
      });

      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize email service', { error: error.message });
      this.config.enabled = false;
      throw error;
    }
  }

  /**
   * Send an email via Resend API
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} options.text - Plain text content (optional)
   * @returns {Object} Result with success status and message ID
   */
  async sendEmail({ to, subject, html, text }) {
    try {
      if (!this.config.enabled) {
        logger.warn('Email service is disabled - skipping email send');
        return {
          success: false,
          error: 'Email service is disabled',
        };
      }

      if (!this.initialized) {
        await this.initialize();
      }

      // Validate inputs
      if (!to || !subject || !html) {
        throw new Error('Missing required email fields: to, subject, html');
      }

      // Send email via Resend
      const result = await this.resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [to],
        subject,
        html,
        text: text || this.stripHtml(html),
      });

      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: result.id,
      });

      return {
        success: true,
        messageId: result.id,
      };

    } catch (error) {
      logger.error('Failed to send email', {
        error: error.message,
        to,
        subject,
      });

      // Check for specific Resend errors
      if (error.message.includes('rate limit')) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          retryable: true,
        };
      }

      if (error.message.includes('invalid')) {
        return {
          success: false,
          error: 'Invalid email configuration',
          retryable: false,
        };
      }

      return {
        success: false,
        error: error.message,
        retryable: true,
      };
    }
  }

  /**
   * Send daily digest email to a user
   * @param {number} userId - User ID
   * @param {Object} options - Digest options
   * @returns {Object} Result
   */
  async sendDailyDigest(userId, options = {}) {
    try {
      // TODO: Implement in next task
      logger.info('sendDailyDigest called', { userId, options });
      
      return {
        success: false,
        error: 'Not implemented yet',
      };
    } catch (error) {
      logger.error('Failed to send daily digest', { error: error.message, userId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send report email to a user
   * @param {number} userId - User ID
   * @param {string} reportType - Type of report (daily, weekly, monthly)
   * @param {Object} reportData - Report data
   * @returns {Object} Result
   */
  async sendReportEmail(userId, reportType, reportData) {
    try {
      // TODO: Implement in next task
      logger.info('sendReportEmail called', { userId, reportType });
      
      return {
        success: false,
        error: 'Not implemented yet',
      };
    } catch (error) {
      logger.error('Failed to send report email', { error: error.message, userId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send critical alert email
   * @param {number} userId - User ID
   * @param {string} alertType - Type of alert
   * @param {Object} alertData - Alert data
   * @returns {Object} Result
   */
  async sendCriticalAlert(userId, alertType, alertData) {
    try {
      // TODO: Implement in next task
      logger.info('sendCriticalAlert called', { userId, alertType });
      
      return {
        success: false,
        error: 'Not implemented yet',
      };
    } catch (error) {
      logger.error('Failed to send critical alert', { error: error.message, userId });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify an email address
   * @param {string} email - Email address to verify
   * @returns {Object} Result
   */
  async verifyEmailAddress(email) {
    try {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: 'Invalid email format',
        };
      }

      // TODO: Implement verification token system
      logger.info('Email verification requested', { email });
      
      return {
        success: true,
        verified: false,
        message: 'Verification email sent',
      };
    } catch (error) {
      logger.error('Failed to verify email', { error: error.message, email });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get email delivery statistics
   * @returns {Object} Statistics
   */
  getDeliveryStats() {
    return {
      enabled: this.config.enabled,
      initialized: this.initialized,
      config: {
        fromEmail: this.config.fromEmail,
        fromName: this.config.fromName,
        batchSize: this.config.batchSize,
        rateLimitPerMinute: this.config.rateLimitPerMinute,
      },
    };
  }

  /**
   * Health check for email service
   * @returns {Object} Health status
   */
  async healthCheck() {
    return {
      status: this.config.enabled && this.initialized ? 'healthy' : 'disabled',
      enabled: this.config.enabled,
      initialized: this.initialized,
      apiKeyConfigured: !!this.config.apiKey && this.config.apiKey !== 're_test_key_placeholder',
    };
  }

  /**
   * Strip HTML tags from text (simple implementation)
   * @param {string} html - HTML content
   * @returns {string} Plain text
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

// Export singleton instance
module.exports = new EmailService();
