const db = require('../config/database');
const logger = require('../utils/logger');
const overduePaymentDetector = require('./overduePaymentDetector');

/**
 * NotificationGeneratorService - Generates smart notifications based on financial data
 * This service runs as a scheduled job to check for upcoming payments, credit card deadlines,
 * budget thresholds, and overdue payments, creating appropriate notifications for users.
 */
class NotificationGeneratorService {
  constructor() {
    this.notificationTypes = {
      FIXED_PAYMENT_3DAY: 'fixed_payment_3day',
      FIXED_PAYMENT_1DAY: 'fixed_payment_1day',
      FIXED_PAYMENT_TODAY: 'fixed_payment_today',
      CREDIT_CARD_5DAY: 'credit_card_5day',
      CREDIT_CARD_TODAY: 'credit_card_today',
      BUDGET_WARNING_80: 'budget_warning_80',
      BUDGET_EXCEEDED: 'budget_exceeded',
      FIXED_PAYMENT_OVERDUE: 'fixed_payment_overdue',
      CREDIT_CARD_OVERDUE: 'credit_card_overdue',
      INSTALLMENT_OVERDUE: 'installment_overdue',
    };
  }

  /**
   * Main entry point - generates all notification types for all users
   * This method is called by the scheduled job
   */
  async generateDailyNotifications() {
    try {
      logger.info('Starting daily notification generation');

      // Get all active users
      const usersResult = await db.query(
        'SELECT id FROM users WHERE is_active = true'
      );
      const users = usersResult.rows;

      let totalNotifications = 0;

      for (const user of users) {
        try {
          await this.checkFixedPayments(user.id);
          await this.checkCreditCardDeadlines(user.id);
          await this.checkBudgetThresholds(user.id);
          await this.checkOverduePayments(user.id);
          totalNotifications++;
        } catch (error) {
          logger.error('Error generating notifications for user', {
            userId: user.id,
            error: error.message,
          });
          // Continue with other users even if one fails
        }
      }

      logger.info('Daily notification generation completed', {
        usersProcessed: totalNotifications,
      });

      return {
        success: true,
        usersProcessed: totalNotifications,
      };
    } catch (error) {
      logger.error('Daily notification generation failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check fixed payments and create notifications for 3-day, 1-day, and same-day alerts
   * @param {string} userId - User ID (UUID)
   */
  async checkFixedPayments(userId) {
    try {
      const today = new Date();
      const currentDay = today.getDate();

      // Get all active fixed payments for user
      const result = await db.query(
        'SELECT * FROM fixed_payments WHERE user_id = $1 AND is_active = true',
        [userId]
      );

      const payments = result.rows;

      for (const payment of payments) {
        const daysUntilDue = this.calculateDaysUntil(currentDay, payment.due_day);

        // 3-day advance notification
        if (daysUntilDue === 3) {
          await this.createNotification({
            userId,
            type: this.notificationTypes.FIXED_PAYMENT_3DAY,
            title: `${payment.name} - 3 gün sonra`,
            message: `${payment.name} ödemesi 3 gün sonra (${payment.due_day} ${this.getMonthName()}) - ${payment.amount} TL`,
            priority: 'medium',
            relatedEntityId: payment.id,
            relatedEntityType: 'fixed_payment',
          });
        }

        // 1-day advance notification
        if (daysUntilDue === 1) {
          await this.createNotification({
            userId,
            type: this.notificationTypes.FIXED_PAYMENT_1DAY,
            title: `${payment.name} - Yarın ödeme günü`,
            message: `${payment.name} ödemesi yarın (${payment.due_day} ${this.getMonthName()}) - ${payment.amount} TL`,
            priority: 'high',
            relatedEntityId: payment.id,
            relatedEntityType: 'fixed_payment',
          });
        }

        // Same-day notification
        if (daysUntilDue === 0) {
          await this.createNotification({
            userId,
            type: this.notificationTypes.FIXED_PAYMENT_TODAY,
            title: `${payment.name} - Bugün ödeme günü!`,
            message: `${payment.name} ödemesi bugün yapılmalı - ${payment.amount} TL`,
            priority: 'high',
            relatedEntityId: payment.id,
            relatedEntityType: 'fixed_payment',
          });
        }
      }

      logger.info('Fixed payment notifications checked', {
        userId,
        paymentsChecked: payments.length,
      });
    } catch (error) {
      logger.error('Error checking fixed payments', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check credit card payment deadlines and create notifications
   * @param {string} userId - User ID (UUID)
   */
  async checkCreditCardDeadlines(userId) {
    try {
      const today = new Date();
      const currentDay = today.getDate();

      // Get all active credit cards for user
      const result = await db.query(
        'SELECT * FROM credit_cards WHERE user_id = $1 AND is_active = true',
        [userId]
      );

      const cards = result.rows;

      for (const card of cards) {
        if (!card.payment_due_date) {
          continue; // Skip cards without payment due date
        }

        const daysUntilDue = this.calculateDaysUntil(currentDay, card.payment_due_date);

        // 5-day advance notification
        if (daysUntilDue === 5) {
          const minimumPayment = (parseFloat(card.current_balance) * parseFloat(card.minimum_payment_rate)) / 100;
          
          await this.createNotification({
            userId,
            type: this.notificationTypes.CREDIT_CARD_5DAY,
            title: `${card.name} - Son ödeme tarihi yaklaşıyor`,
            message: `${card.name} kredi kartı son ödeme tarihi 5 gün sonra (${card.payment_due_date} ${this.getMonthName()}) - Minimum ödeme: ${minimumPayment.toFixed(2)} TL`,
            priority: 'medium',
            relatedEntityId: card.id,
            relatedEntityType: 'credit_card',
          });
        }

        // Same-day notification
        if (daysUntilDue === 0) {
          const minimumPayment = (parseFloat(card.current_balance) * parseFloat(card.minimum_payment_rate)) / 100;
          
          await this.createNotification({
            userId,
            type: this.notificationTypes.CREDIT_CARD_TODAY,
            title: `${card.name} - Bugün son ödeme günü!`,
            message: `${card.name} kredi kartı ödemesi bugün yapılmalı - Minimum ödeme: ${minimumPayment.toFixed(2)} TL, Toplam borç: ${parseFloat(card.current_balance).toFixed(2)} TL`,
            priority: 'high',
            relatedEntityId: card.id,
            relatedEntityType: 'credit_card',
          });
        }
      }

      logger.info('Credit card deadline notifications checked', {
        userId,
        cardsChecked: cards.length,
      });
    } catch (error) {
      logger.error('Error checking credit card deadlines', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Check budget thresholds and create alerts
   * @param {string} userId - User ID (UUID)
   */
  async checkBudgetThresholds(userId) {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Get spending by category for current month
      const spendingResult = await db.query(
        `SELECT category, SUM(amount) as total
         FROM transactions
         WHERE user_id = $1 AND type = 'expense'
           AND EXTRACT(MONTH FROM transaction_date) = $2 
           AND EXTRACT(YEAR FROM transaction_date) = $3
         GROUP BY category`,
        [userId, currentMonth, currentYear]
      );

      const spending = spendingResult.rows;

      // Get budget allocations (if budgets table exists)
      // For now, we'll use hardcoded thresholds as per the existing notificationService.js
      // In a real implementation, this would query a budgets table
      const budgetThresholds = {
        'Yiyecek ve İçecek': 2000,
        'Ulaşım': 1000,
        'Eğlence': 500,
        'Alışveriş': 1500,
        'Faturalar': 1000,
        'Sağlık': 500,
        'Eğitim': 1000,
      };

      for (const spendingRow of spending) {
        const category = spendingRow.category;
        const spent = parseFloat(spendingRow.total);
        const budget = budgetThresholds[category];

        if (!budget) {
          continue; // Skip categories without budget
        }

        const percentage = (spent / budget) * 100;

        // 80% threshold warning
        if (percentage >= 80 && percentage < 100) {
          await this.createNotification({
            userId,
            type: this.notificationTypes.BUDGET_WARNING_80,
            title: `${category} bütçesi uyarısı`,
            message: `${category} kategorisinde bütçenizin %${Math.round(percentage)}'ini kullandınız (${spent.toFixed(2)} TL / ${budget} TL)`,
            priority: 'medium',
            relatedEntityId: null,
            relatedEntityType: 'budget',
            data: {
              category,
              spent,
              budget,
              percentage: percentage.toFixed(2),
            },
          });
        }

        // 100% threshold exceeded
        if (percentage >= 100) {
          const overage = spent - budget;
          
          await this.createNotification({
            userId,
            type: this.notificationTypes.BUDGET_EXCEEDED,
            title: `${category} bütçesi aşıldı!`,
            message: `${category} kategorisinde bütçenizi ${overage.toFixed(2)} TL aştınız (${spent.toFixed(2)} TL / ${budget} TL)`,
            priority: 'high',
            relatedEntityId: null,
            relatedEntityType: 'budget',
            data: {
              category,
              spent,
              budget,
              overage: overage.toFixed(2),
              percentage: percentage.toFixed(2),
            },
          });
        }
      }

      logger.info('Budget threshold notifications checked', {
        userId,
        categoriesChecked: spending.length,
      });
    } catch (error) {
      logger.error('Error checking budget thresholds', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Helper: Calculate days until due date
   * @param {number} currentDay - Current day of month (1-31)
   * @param {number} dueDay - Due day of month (1-31)
   * @returns {number} Days until due date
   */
  calculateDaysUntil(currentDay, dueDay) {
    if (dueDay >= currentDay) {
      return dueDay - currentDay;
    } else {
      // Due date is in next month
      const today = new Date();
      const daysInCurrentMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      ).getDate();
      return (daysInCurrentMonth - currentDay) + dueDay;
    }
  }

  /**
   * Helper: Get current month name in Turkish
   * @returns {string} Month name
   */
  getMonthName() {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return months[new Date().getMonth()];
  }

  /**
   * Helper: Create notification with duplicate check
   * @param {Object} data - Notification data
   */
  async createNotification(data) {
    try {
      const { userId, type, title, message, priority, relatedEntityId, relatedEntityType, data: additionalData } = data;

      // Check for existing notification to prevent duplicates
      // Skip duplicate check for overdue notifications (they are handled separately with updates)
      const isOverdueNotification = type.includes('overdue');
      
      if (!isOverdueNotification) {
        const existingResult = await db.query(
          `SELECT id FROM smart_notifications
           WHERE user_id = $1 AND notification_type = $2
             AND related_entity_id = $3 AND is_dismissed = false
             AND DATE(created_at) = CURRENT_DATE`,
          [userId, type, relatedEntityId]
        );

        if (existingResult.rows.length > 0) {
          logger.debug('Duplicate notification skipped', {
            userId,
            type,
            relatedEntityId,
          });
          return; // Duplicate, skip
        }
      }

      // Create new notification
      const insertResult = await db.query(
        `INSERT INTO smart_notifications
         (user_id, notification_type, title, message, priority, 
          related_entity_id, related_entity_type, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          userId,
          type,
          title,
          message,
          priority || 'medium',
          relatedEntityId,
          relatedEntityType,
          additionalData ? JSON.stringify(additionalData) : null,
        ]
      );

      logger.debug('Notification created', {
        notificationId: insertResult.rows[0].id,
        userId,
        type,
      });

      return insertResult.rows[0].id;
    } catch (error) {
      logger.error('Error creating notification', {
        error: error.message,
        data,
      });
      throw error;
    }
  }

  /**
   * Check for overdue payments and create notifications
   * @param {string} userId - User ID
   */
  async checkOverduePayments(userId) {
    try {
      logger.info('Checking overdue payments', { userId });

      const overduePayments = await overduePaymentDetector.detectOverduePayments(userId);

      // Create notifications for overdue fixed payments
      for (const payment of overduePayments.fixedPayments) {
        await this.createOverdueFixedPaymentNotification(userId, payment, payment.daysOverdue);
      }

      // Create notifications for overdue credit cards
      for (const card of overduePayments.creditCards) {
        await this.createOverdueCreditCardNotification(userId, card, card.daysOverdue);
      }

      // Create notifications for overdue installments
      for (const installment of overduePayments.installments) {
        await this.createOverdueInstallmentNotification(userId, installment, installment.daysOverdue);
      }

      logger.info('Overdue payment notifications checked', {
        userId,
        fixedPayments: overduePayments.fixedPayments.length,
        creditCards: overduePayments.creditCards.length,
        installments: overduePayments.installments.length,
      });
    } catch (error) {
      logger.error('Error checking overdue payments', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create overdue fixed payment notification
   * @param {string} userId - User ID
   * @param {Object} payment - Payment object
   * @param {number} daysOverdue - Days overdue
   */
  async createOverdueFixedPaymentNotification(userId, payment, daysOverdue) {
    try {
      const title = `Ödeme Gecikti: ${payment.name}`;
      const message = `${payment.name} ödemesi ${daysOverdue} gün önce yapılmalıydı - ${payment.amount} TL`;
      const priority = payment.priority;

      // Check if there's an existing overdue notification for this payment
      const existingResult = await db.query(
        `SELECT id, title, message FROM smart_notifications
         WHERE user_id = $1 
           AND notification_type = $2
           AND related_entity_id = $3 
           AND is_dismissed = false`,
        [userId, this.notificationTypes.FIXED_PAYMENT_OVERDUE, payment.id]
      );

      if (existingResult.rows.length > 0) {
        // Update existing notification with new days overdue
        await db.query(
          `UPDATE smart_notifications
           SET title = $1, message = $2, priority = $3, data = $4, sent_at = NOW()
           WHERE id = $5`,
          [
            title,
            message,
            priority,
            JSON.stringify({
              payment_id: payment.id,
              payment_name: payment.name,
              amount: payment.amount,
              due_date: payment.dueDate,
              days_overdue: daysOverdue,
              payment_type: 'fixed_payment',
            }),
            existingResult.rows[0].id,
          ]
        );

        logger.debug('Overdue notification updated', {
          notificationId: existingResult.rows[0].id,
          userId,
          paymentId: payment.id,
          daysOverdue,
        });
      } else {
        // Create new notification
        await this.createNotification({
          userId,
          type: this.notificationTypes.FIXED_PAYMENT_OVERDUE,
          title,
          message,
          priority,
          relatedEntityId: payment.id,
          relatedEntityType: 'fixed_payment',
          data: {
            payment_id: payment.id,
            payment_name: payment.name,
            amount: payment.amount,
            due_date: payment.dueDate,
            days_overdue: daysOverdue,
            payment_type: 'fixed_payment',
          },
        });
      }
    } catch (error) {
      logger.error('Error creating overdue fixed payment notification', {
        userId,
        paymentId: payment.id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create overdue credit card notification
   * @param {string} userId - User ID
   * @param {Object} card - Credit card object
   * @param {number} daysOverdue - Days overdue
   */
  async createOverdueCreditCardNotification(userId, card, daysOverdue) {
    try {
      const title = `Kredi Kartı Ödemesi Gecikti: ${card.name}`;
      const message = `${card.name} kredi kartı ödemesi ${daysOverdue} gün gecikti - Minimum ödeme: ${card.minimumPayment.toFixed(2)} TL, Toplam borç: ${card.currentBalance.toFixed(2)} TL`;
      const priority = card.priority;

      // Check if there's an existing overdue notification for this card
      const existingResult = await db.query(
        `SELECT id FROM smart_notifications
         WHERE user_id = $1 
           AND notification_type = $2
           AND related_entity_id = $3 
           AND is_dismissed = false`,
        [userId, this.notificationTypes.CREDIT_CARD_OVERDUE, card.id]
      );

      if (existingResult.rows.length > 0) {
        // Update existing notification
        await db.query(
          `UPDATE smart_notifications
           SET title = $1, message = $2, priority = $3, data = $4, sent_at = NOW()
           WHERE id = $5`,
          [
            title,
            message,
            priority,
            JSON.stringify({
              card_id: card.id,
              card_name: card.name,
              current_balance: card.currentBalance,
              minimum_payment: card.minimumPayment,
              due_date: card.dueDate,
              days_overdue: daysOverdue,
              payment_type: 'credit_card',
            }),
            existingResult.rows[0].id,
          ]
        );

        logger.debug('Overdue credit card notification updated', {
          notificationId: existingResult.rows[0].id,
          userId,
          cardId: card.id,
          daysOverdue,
        });
      } else {
        // Create new notification
        await this.createNotification({
          userId,
          type: this.notificationTypes.CREDIT_CARD_OVERDUE,
          title,
          message,
          priority,
          relatedEntityId: card.id,
          relatedEntityType: 'credit_card',
          data: {
            card_id: card.id,
            card_name: card.name,
            current_balance: card.currentBalance,
            minimum_payment: card.minimumPayment,
            due_date: card.dueDate,
            days_overdue: daysOverdue,
            payment_type: 'credit_card',
          },
        });
      }
    } catch (error) {
      logger.error('Error creating overdue credit card notification', {
        userId,
        cardId: card.id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create overdue installment notification
   * @param {string} userId - User ID
   * @param {Object} installment - Installment object
   * @param {number} daysOverdue - Days overdue
   */
  async createOverdueInstallmentNotification(userId, installment, daysOverdue) {
    try {
      const installmentNumber = installment.paidInstallments + 1;
      const title = `Taksit Ödemesi Gecikti: ${installment.itemName}`;
      const message = `${installment.itemName} - ${installmentNumber}. taksit ödemesi ${daysOverdue} gün gecikti - ${installment.installmentAmount.toFixed(2)} TL`;
      const priority = installment.priority;

      // Check if there's an existing overdue notification for this installment
      const existingResult = await db.query(
        `SELECT id FROM smart_notifications
         WHERE user_id = $1 
           AND notification_type = $2
           AND related_entity_id = $3 
           AND is_dismissed = false`,
        [userId, this.notificationTypes.INSTALLMENT_OVERDUE, installment.id]
      );

      if (existingResult.rows.length > 0) {
        // Update existing notification
        await db.query(
          `UPDATE smart_notifications
           SET title = $1, message = $2, priority = $3, data = $4, sent_at = NOW()
           WHERE id = $5`,
          [
            title,
            message,
            priority,
            JSON.stringify({
              installment_id: installment.id,
              item_name: installment.itemName,
              installment_amount: installment.installmentAmount,
              installment_number: installmentNumber,
              total_installments: installment.totalInstallments,
              due_date: installment.dueDate,
              days_overdue: daysOverdue,
              payment_type: 'installment_payment',
            }),
            existingResult.rows[0].id,
          ]
        );

        logger.debug('Overdue installment notification updated', {
          notificationId: existingResult.rows[0].id,
          userId,
          installmentId: installment.id,
          daysOverdue,
        });
      } else {
        // Create new notification
        await this.createNotification({
          userId,
          type: this.notificationTypes.INSTALLMENT_OVERDUE,
          title,
          message,
          priority,
          relatedEntityId: installment.id,
          relatedEntityType: 'installment_payment',
          data: {
            installment_id: installment.id,
            item_name: installment.itemName,
            installment_amount: installment.installmentAmount,
            installment_number: installmentNumber,
            total_installments: installment.totalInstallments,
            due_date: installment.dueDate,
            days_overdue: daysOverdue,
            payment_type: 'installment_payment',
          },
        });
      }
    } catch (error) {
      logger.error('Error creating overdue installment notification', {
        userId,
        installmentId: installment.id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get all active users (helper method)
   * @returns {Array} Array of user IDs
   */
  async getAllActiveUsers() {
    try {
      const result = await db.query(
        'SELECT id FROM users WHERE is_active = true'
      );
      return result.rows.map(row => row.id);
    } catch (error) {
      logger.error('Error getting active users', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new NotificationGeneratorService();
