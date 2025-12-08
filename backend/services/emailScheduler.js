const cron = require('node-cron');
const DatabaseUtils = require('../utils/database');
const emailService = require('./emailService');
const DailyDigestGenerator = require('./dailyDigestGenerator');

class EmailScheduler {
  constructor() {
    this.cronJob = null;
    this.isRunning = false;
  }

  /**
   * Initialize and start the email scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Email scheduler is already running');
      return;
    }

    console.log('📧 Starting email scheduler...');

    // Run every minute
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.checkAndSendDailyDigests();
    });

    this.isRunning = true;
    console.log('✅ Email scheduler started successfully');
  }

  /**
   * Stop the email scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('🛑 Email scheduler stopped');
    }
  }

  /**
   * Check all users and send daily digests if needed
   */
  async checkAndSendDailyDigests() {
    try {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const today = now.toISOString().split('T')[0];

      // Debug log every 5 minutes
      if (now.getMinutes() % 5 === 0) {
        console.log(`⏰ Email scheduler check at ${currentTime}`);
      }

      // Find users who should receive digest at this time
      // Note: daily_digest_time is stored as TIME type, so we need to cast for comparison
      const query = `
        SELECT u.id, u.email, u.first_name, ep.daily_digest_time
        FROM users u
        INNER JOIN user_email_preferences ep ON u.id = ep.user_id
        WHERE ep.email_enabled = true
          AND ep.daily_digest_enabled = true
          AND TO_CHAR(ep.daily_digest_time, 'HH24:MI') = $1
      `;

      const result = await DatabaseUtils.query(query, [currentTime]);

      if (result.rows.length === 0) {
        // No users to send at this time
        return;
      }

      console.log(`📧 Found ${result.rows.length} user(s) to send daily digest at ${currentTime}`);

      // Process each user
      for (const user of result.rows) {
        await this.sendDailyDigestToUser(user.id, today);
      }

    } catch (error) {
      console.error('Error in checkAndSendDailyDigests:', error);
      // Don't throw - we don't want to crash the server
    }
  }

  /**
   * Send daily digest to a specific user
   * @param {number} userId - User ID
   * @param {string} today - Today's date (YYYY-MM-DD)
   */
  async sendDailyDigestToUser(userId, today) {
    try {
      // Check if already sent today
      const checkQuery = `
        SELECT id FROM email_delivery_log
        WHERE user_id = $1
          AND email_type = 'daily_digest'
          AND created_at::date = $2::date
        LIMIT 1
      `;

      const checkResult = await DatabaseUtils.query(checkQuery, [userId, today]);

      if (checkResult.rows.length > 0) {
        console.log(`⏭️  Daily digest already sent to user ${userId} today`);
        return;
      }

      // Generate digest content
      console.log(`📝 Generating daily digest for user ${userId}...`);
      const digestContent = await DailyDigestGenerator.generateDailyDigest(userId);

      // Send email
      console.log(`📤 Sending daily digest to ${digestContent.to}...`);
      const result = await emailService.sendEmail(
        digestContent.to,
        digestContent.subject,
        digestContent.html,
        null, // text version
        {
          emailType: 'daily_digest',
          userId: userId
        }
      );

      console.log(`✅ Daily digest sent successfully to user ${userId}`, result);

    } catch (error) {
      console.error(`❌ Error sending daily digest to user ${userId}:`, error);
      // Log the error but continue with other users
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.cronJob ? 'Every minute' : 'Not scheduled'
    };
  }
}

// Create singleton instance
const emailScheduler = new EmailScheduler();

module.exports = emailScheduler;
