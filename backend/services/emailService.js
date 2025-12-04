const { Resend } = require('resend');
const logger = require('../utils/logger');
const EmailDeliveryLog = require('../models/EmailDeliveryLog');

/**
 * EmailService - Handles email sending via Resend API
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
      batchSize: parseInt(process.env.EMAIL_BATCH_SIZE) || 50,
      rateLimitPerMinute: parseInt(process.env.EMAIL_RATE_LIMIT_PER_MINUTE) || 100,
      retryAttempts: parseInt(process.env.EMAIL_RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY_MS) || 2000,
    };
    this.stats = {
      sent: 0,
      failed: 0,
      pending: 0,
    };
    // Circuit breaker state
    this.circuitBreaker = {
      consecutiveFailures: 0,
      isOpen: false,
      openedAt: null,
      resetTimeout: 5 * 60 * 1000, // 5 minutes
      failureThreshold: 10, // Open after 10 consecutive failures
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

      if (!this.config.apiKey) {
        logger.error('RESEND_API_KEY is not configured');
        throw new Error('RESEND_API_KEY is required');
      }

      // Validate API key format
      if (!this.config.apiKey.startsWith('re_')) {
        logger.error('Invalid RESEND_API_KEY format');
        throw new Error('RESEND_API_KEY must start with "re_"');
      }

      // Initialize Resend client
      this.resend = new Resend(this.config.apiKey);
      
      // Test the API key by attempting to get API info (if available)
      // For now, we'll just mark as initialized
      this.initialized = true;

      logger.info('Email service initialized successfully', {
        fromEmail: this.config.fromEmail,
        fromName: this.config.fromName,
        batchSize: this.config.batchSize,
        rateLimit: this.config.rateLimitPerMinute,
      });
    } catch (error) {
      logger.error('Failed to initialize email service', { error: error.message });
      this.initialized = false;
      
      // If API key is invalid, disable email functionality
      if (error.message.includes('API_KEY')) {
        this.config.enabled = false;
        logger.error('Email functionality disabled due to invalid API key');
      }
      
      throw error;
    }
  }

  /**
   * Check and reset circuit breaker if timeout has passed
   */
  checkCircuitBreaker() {
    if (this.circuitBreaker.isOpen) {
      const now = Date.now();
      const timeSinceOpen = now - this.circuitBreaker.openedAt;
      
      if (timeSinceOpen >= this.circuitBreaker.resetTimeout) {
        logger.info('Circuit breaker reset - attempting to resume email sending');
        this.circuitBreaker.isOpen = false;
        this.circuitBreaker.consecutiveFailures = 0;
        this.circuitBreaker.openedAt = null;
      }
    }
  }

  /**
   * Record email failure for circuit breaker
   */
  recordFailure() {
    this.circuitBreaker.consecutiveFailures++;
    
    if (this.circuitBreaker.consecutiveFailures >= this.circuitBreaker.failureThreshold) {
      if (!this.circuitBreaker.isOpen) {
        this.circuitBreaker.isOpen = true;
        this.circuitBreaker.openedAt = Date.now();
        logger.error('Circuit breaker opened - email sending paused', {
          consecutiveFailures: this.circuitBreaker.consecutiveFailures,
          threshold: this.circuitBreaker.failureThreshold,
        });
      }
    } else if (this.circuitBreaker.consecutiveFailures >= 5) {
      // Warning after 5 failures
      logger.warn('Email delivery rate dropping', {
        consecutiveFailures: this.circuitBreaker.consecutiveFailures,
        threshold: this.circuitBreaker.failureThreshold,
      });
    }
  }

  /**
   * Record email success for circuit breaker
   */
  recordSuccess() {
    if (this.circuitBreaker.consecutiveFailures > 0) {
      logger.info('Email delivery recovered', {
        previousFailures: this.circuitBreaker.consecutiveFailures,
      });
    }
    this.circuitBreaker.consecutiveFailures = 0;
  }

  /**
   * Send an email via Resend API with delivery logging
   */
  async sendEmail(to, subject, html, text = null, options = {}) {
    const { userId = null, emailType = 'test', retryCount = 0 } = options;
    let deliveryLogId = null;

    try {
      if (!this.initialized) {
        throw new Error('Email service not initialized');
      }

      if (!this.config.enabled) {
        logger.info('Email sending skipped (service disabled)', { to, subject });
        
        // Log as skipped
        if (userId) {
          await EmailDeliveryLog.create({
            userId,
            emailType,
            recipientEmail: to,
            subject,
            status: 'failed',
            errorMessage: 'Email service disabled',
            retryCount,
          });
        }
        
        return { success: false, reason: 'service_disabled' };
      }

      // Check circuit breaker
      this.checkCircuitBreaker();
      
      if (this.circuitBreaker.isOpen) {
        logger.warn('Email sending blocked by circuit breaker', { to, subject });
        
        if (userId) {
          await EmailDeliveryLog.create({
            userId,
            emailType,
            recipientEmail: to,
            subject,
            status: 'failed',
            errorMessage: 'Circuit breaker open - too many failures',
            retryCount,
          });
        }
        
        return { success: false, reason: 'circuit_breaker_open' };
      }

      // Validate email address
      if (!this.isValidEmail(to)) {
        throw new Error(`Invalid email address: ${to}`);
      }

      // Create initial log entry
      if (userId) {
        const log = await EmailDeliveryLog.create({
          userId,
          emailType,
          recipientEmail: to,
          subject,
          status: 'queued',
          retryCount,
        });
        deliveryLogId = log.id;
      }

      logger.info('Sending email', { to, subject, deliveryLogId });

      // Send via Resend
      const result = await this.resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [to],
        subject: subject,
        html: html,
        text: text || this.stripHtml(html),
      });

      const messageId = result.data?.id || result.id;
      this.stats.sent++;

      // Record success for circuit breaker
      this.recordSuccess();

      // Update log with success
      if (deliveryLogId) {
        await EmailDeliveryLog.updateStatus(deliveryLogId, 'sent', null, messageId);
      }

      logger.info('Email sent successfully', {
        to,
        subject,
        messageId,
        deliveryLogId,
      });

      return {
        success: true,
        messageId,
        deliveryLogId,
      };
    } catch (error) {
      this.stats.failed++;

      // Record failure for circuit breaker
      this.recordFailure();

      // Detect rate limit errors
      const isRateLimit = error.message?.includes('rate limit') || 
                          error.statusCode === 429;

      // Update log with failure
      if (deliveryLogId) {
        await EmailDeliveryLog.updateStatus(
          deliveryLogId,
          'failed',
          error.message
        );
      } else if (userId) {
        // Create failure log if we didn't create one earlier
        await EmailDeliveryLog.create({
          userId,
          emailType,
          recipientEmail: to,
          subject,
          status: 'failed',
          errorMessage: error.message,
          retryCount,
        });
      }

      logger.error('Failed to send email', {
        to,
        subject,
        error: error.message,
        isRateLimit,
        statusCode: error.statusCode,
        deliveryLogId,
        circuitBreakerFailures: this.circuitBreaker.consecutiveFailures,
      });

      return {
        success: false,
        error: error.message,
        isRateLimit,
        shouldRetry: isRateLimit || error.statusCode >= 500,
        deliveryLogId,
      };
    }
  }

  /**
   * Send a test email
   */
  async sendTestEmail(to) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Budget App Test Email</h1>
        <p>This is a test email from Budget App email service.</p>
        <p>If you received this email, the email service is working correctly!</p>
        <hr style="border: 1px solid #E5E7EB; margin: 20px 0;">
        <p style="color: #6B7280; font-size: 12px;">
          This is an automated test email from Budget App.
        </p>
      </div>
    `;

    return await this.sendEmail(
      to,
      'Budget App - Test Email',
      html
    );
  }

  /**
   * Validate email address format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Strip HTML tags from text
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Get email delivery statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.sent > 0
        ? ((this.stats.sent / (this.stats.sent + this.stats.failed)) * 100).toFixed(2)
        : 0,
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: this.initialized ? 'healthy' : 'unhealthy',
      enabled: this.config.enabled,
      stats: this.getStats(),
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      sent: 0,
      failed: 0,
      pending: 0,
    };
  }
}

// Export singleton instance
module.exports = new EmailService();
