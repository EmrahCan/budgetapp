const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * EmailPreferences Model
 * Manages user email notification preferences
 */
class EmailPreferences {
  /**
   * Get user email preferences
   */
  static async getByUserId(userId) {
    try {
      const result = await pool.query(
        `SELECT * FROM user_email_preferences WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        // Create default preferences if they don't exist
        return await this.createDefault(userId);
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting email preferences', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Create default email preferences for a user
   */
  static async createDefault(userId) {
    try {
      const result = await pool.query(
        `INSERT INTO user_email_preferences (
          user_id, 
          email_enabled, 
          daily_digest_enabled, 
          report_emails_enabled,
          language
        ) VALUES ($1, true, true, true, 'tr')
        ON CONFLICT (user_id) DO UPDATE SET
          email_enabled = EXCLUDED.email_enabled
        RETURNING *`,
        [userId]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error creating default email preferences', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Update user email preferences
   */
  static async update(userId, preferences) {
    try {
      const {
        email_enabled,
        daily_digest_enabled,
        daily_digest_time,
        report_emails_enabled,
        report_frequency,
        critical_alerts_enabled,
        language,
      } = preferences;

      const result = await pool.query(
        `UPDATE user_email_preferences SET
          email_enabled = COALESCE($2, email_enabled),
          daily_digest_enabled = COALESCE($3, daily_digest_enabled),
          daily_digest_time = COALESCE($4, daily_digest_time),
          report_emails_enabled = COALESCE($5, report_emails_enabled),
          report_frequency = COALESCE($6, report_frequency),
          critical_alerts_enabled = COALESCE($7, critical_alerts_enabled),
          language = COALESCE($8, language),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *`,
        [
          userId,
          email_enabled,
          daily_digest_enabled,
          daily_digest_time,
          report_emails_enabled,
          report_frequency,
          critical_alerts_enabled,
          language,
        ]
      );

      if (result.rows.length === 0) {
        // If preferences don't exist, create them
        return await this.createDefault(userId);
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error updating email preferences', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get all users with email notifications enabled
   */
  static async getEnabledUsers() {
    try {
      const result = await pool.query(
        `SELECT uep.*, u.email, u.name 
         FROM user_email_preferences uep
         JOIN users u ON u.id = uep.user_id
         WHERE uep.email_enabled = true`
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting enabled users', { error: error.message });
      throw error;
    }
  }

  /**
   * Get users who should receive daily digest
   */
  static async getUsersForDailyDigest(time = null) {
    try {
      let query = `
        SELECT uep.*, u.email, u.name 
        FROM user_email_preferences uep
        JOIN users u ON u.id = uep.user_id
        WHERE uep.email_enabled = true 
          AND uep.daily_digest_enabled = true
      `;

      const params = [];

      if (time) {
        query += ` AND uep.daily_digest_time = $1`;
        params.push(time);
      }

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting users for daily digest', { error: error.message });
      throw error;
    }
  }

  /**
   * Verify user email address
   */
  static async verifyEmail(userId, email, token) {
    try {
      const result = await pool.query(
        `UPDATE user_email_preferences SET
          verified_email = $2,
          email_verified_at = CURRENT_TIMESTAMP,
          verification_token = NULL,
          verification_token_expires_at = NULL
        WHERE user_id = $1 
          AND verification_token = $3
          AND verification_token_expires_at > CURRENT_TIMESTAMP
        RETURNING *`,
        [userId, email, token]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error verifying email', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Set email verification token
   */
  static async setVerificationToken(userId, token, expiresInMinutes = 60) {
    try {
      const result = await pool.query(
        `UPDATE user_email_preferences SET
          verification_token = $2,
          verification_token_expires_at = CURRENT_TIMESTAMP + INTERVAL '${expiresInMinutes} minutes'
        WHERE user_id = $1
        RETURNING *`,
        [userId, token]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error setting verification token', { userId, error: error.message });
      throw error;
    }
  }
}

module.exports = EmailPreferences;
