const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * EmailDeliveryLog Model
 * Tracks email delivery attempts and status
 */
class EmailDeliveryLog {
  /**
   * Log an email delivery attempt
   */
  static async create({
    userId,
    emailType,
    recipientEmail,
    subject,
    status,
    resendMessageId = null,
    errorMessage = null,
    retryCount = 0,
  }) {
    try {
      const sentAt = status === 'sent' ? new Date() : null;

      const result = await pool.query(
        `INSERT INTO email_delivery_log (
          user_id,
          email_type,
          recipient_email,
          subject,
          status,
          resend_message_id,
          error_message,
          retry_count,
          sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          userId,
          emailType,
          recipientEmail,
          subject,
          status,
          resendMessageId,
          errorMessage,
          retryCount,
          sentAt,
        ]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating email delivery log', { error: error.message });
      throw error;
    }
  }

  /**
   * Update email delivery log status
   */
  static async updateStatus(id, status, errorMessage = null, resendMessageId = null) {
    try {
      const sentAt = status === 'sent' ? new Date() : null;

      const result = await pool.query(
        `UPDATE email_delivery_log SET
          status = $2,
          error_message = COALESCE($3, error_message),
          resend_message_id = COALESCE($4, resend_message_id),
          sent_at = COALESCE($5, sent_at)
        WHERE id = $1
        RETURNING *`,
        [id, status, errorMessage, resendMessageId, sentAt]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error updating email delivery log', { error: error.message });
      throw error;
    }
  }

  /**
   * Increment retry count
   */
  static async incrementRetryCount(id) {
    try {
      const result = await pool.query(
        `UPDATE email_delivery_log SET
          retry_count = retry_count + 1
        WHERE id = $1
        RETURNING *`,
        [id]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error incrementing retry count', { error: error.message });
      throw error;
    }
  }

  /**
   * Get delivery logs for a user
   */
  static async getByUserId(userId, limit = 50) {
    try {
      const result = await pool.query(
        `SELECT * FROM email_delivery_log 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting email delivery logs', { error: error.message });
      throw error;
    }
  }

  /**
   * Get delivery statistics
   */
  static async getStats(userId = null, startDate = null, endDate = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'sent') as sent,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          COUNT(*) FILTER (WHERE status = 'bounced') as bounced,
          COUNT(*) FILTER (WHERE status = 'queued') as queued,
          email_type
        FROM email_delivery_log
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      if (userId) {
        query += ` AND user_id = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }

      if (startDate) {
        query += ` AND created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        query += ` AND created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      query += ` GROUP BY email_type`;

      const result = await pool.query(query, params);

      // Calculate totals
      const totals = result.rows.reduce(
        (acc, row) => {
          acc.total += parseInt(row.total);
          acc.sent += parseInt(row.sent);
          acc.failed += parseInt(row.failed);
          acc.bounced += parseInt(row.bounced);
          acc.queued += parseInt(row.queued);
          return acc;
        },
        { total: 0, sent: 0, failed: 0, bounced: 0, queued: 0 }
      );

      return {
        totals,
        byType: result.rows,
        successRate:
          totals.total > 0 ? ((totals.sent / totals.total) * 100).toFixed(2) : 0,
      };
    } catch (error) {
      logger.error('Error getting email delivery stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Get recent failed emails
   */
  static async getRecentFailures(limit = 10) {
    try {
      const result = await pool.query(
        `SELECT edl.*, u.email as user_email, u.name as user_name
         FROM email_delivery_log edl
         JOIN users u ON u.id = edl.user_id
         WHERE edl.status = 'failed'
         ORDER BY edl.created_at DESC
         LIMIT $1`,
        [limit]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting recent failures', { error: error.message });
      throw error;
    }
  }

  /**
   * Clean up old logs (older than specified days)
   */
  static async cleanup(daysToKeep = 90) {
    try {
      const result = await pool.query(
        `DELETE FROM email_delivery_log 
         WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${daysToKeep} days'
         RETURNING id`,
        []
      );

      logger.info('Email delivery logs cleaned up', { deleted: result.rowCount });
      return result.rowCount;
    } catch (error) {
      logger.error('Error cleaning up email delivery logs', { error: error.message });
      throw error;
    }
  }
}

module.exports = EmailDeliveryLog;
