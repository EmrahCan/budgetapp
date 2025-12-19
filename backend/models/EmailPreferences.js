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
        `SELECT * FROM email_preferences WHERE user_id = $1`,
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
        `INSERT INTO email_preferences (
          user_id, 
          email_enabled, 
          daily_digest_enabled
        ) VALUES ($1, true, true)
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
      } = preferences;

      const result = await pool.query(
        `UPDATE email_preferences SET
          email_enabled = COALESCE($2, email_enabled),
          daily_digest_enabled = COALESCE($3, daily_digest_enabled),
          daily_digest_time = COALESCE($4, daily_digest_time),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *`,
        [
          userId,
          email_enabled,
          daily_digest_enabled,
          daily_digest_time,
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
        `SELECT ep.*, u.email, u.name 
         FROM email_preferences ep
         JOIN users u ON u.id = ep.user_id
         WHERE ep.email_enabled = true`
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
        SELECT ep.*, u.email, u.name 
        FROM email_preferences ep
        JOIN users u ON u.id = ep.user_id
        WHERE ep.email_enabled = true 
          AND ep.daily_digest_enabled = true
      `;

      const params = [];

      if (time) {
        query += ` AND ep.daily_digest_time = $1`;
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
        `UPDATE email_preferences SET
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *`,
        [userId]
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
        `UPDATE email_preferences SET
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *`,
        [userId]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error setting verification token', { userId, error: error.message });
      throw error;
    }
  }
}

module.exports = EmailPreferences;
