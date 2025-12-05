const DatabaseUtils = require('../utils/database');

class CreditCard {
  constructor(cardData) {
    this.id = cardData.id;
    this.userId = cardData.user_id;
    this.name = cardData.name;
    this.bankId = cardData.bank_id || null;
    this.bankName = cardData.bank_name;
    this.creditLimit = parseFloat(cardData.credit_limit);
    this.currentBalance = parseFloat(cardData.current_balance);
    this.interestRate = parseFloat(cardData.interest_rate);
    this.minimumPaymentRate = parseFloat(cardData.minimum_payment_rate);
    this.paymentDueDate = cardData.payment_due_date;
    this.isActive = cardData.is_active;
    this.createdAt = cardData.created_at;
    this.updatedAt = cardData.updated_at;
  }

  // Create a new credit card
  static async create(userId, cardData) {
    try {
      const {
        name,
        bankId,
        bankName,
        creditLimit,
        currentBalance = 0,
        interestRate,
        minimumPaymentRate = 5.0,
        paymentDueDate
      } = cardData;

      const query = `
        INSERT INTO credit_cards (
          user_id, name, bank_name, credit_limit, current_balance, 
          interest_rate, minimum_payment_rate, payment_due_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await DatabaseUtils.query(query, [
        userId,
        name.trim(),
        bankName?.trim() || null,
        parseFloat(creditLimit),
        parseFloat(currentBalance),
        parseFloat(interestRate),
        parseFloat(minimumPaymentRate),
        paymentDueDate || null
      ]);

      return new CreditCard(result.rows[0]);
    } catch (error) {
      console.error('Error creating credit card:', error);
      throw error;
    }
  }

  // Find credit card by ID
  static async findById(id, userId = null) {
    try {
      let query = 'SELECT * FROM credit_cards WHERE id = $1';
      let params = [id];

      if (userId) {
        query += ' AND user_id = $2';
        params.push(userId);
      }

      const result = await DatabaseUtils.query(query, params);
      
      if (result.rows.length === 0) {
        return null;
      }

      return new CreditCard(result.rows[0]);
    } catch (error) {
      console.error('Error finding credit card:', error);
      throw error;
    }
  }

  // Get all credit cards for a user
  static async findByUserId(userId, options = {}) {
    try {
      const { includeInactive = false, page = 1, limit = 10 } = options;
      
      let query = 'SELECT * FROM credit_cards WHERE user_id = $1';
      let params = [userId];

      if (!includeInactive) {
        query += ' AND is_active = true';
      }

      // Add pagination
      const offset = (page - 1) * limit;
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await DatabaseUtils.query(query, params);
      
      return result.rows.map(row => new CreditCard(row));
    } catch (error) {
      console.error('Error finding credit cards by user:', error);
      throw error;
    }
  }

  // Calculate total credit card debt for a user
  static async calculateTotalDebt(userId) {
    try {
      const query = `
        SELECT COALESCE(SUM(current_balance), 0) as total_credit_card_debt
        FROM credit_cards
        WHERE user_id = $1
          AND is_active = true
      `;

      const result = await DatabaseUtils.query(query, [userId]);
      return parseFloat(result.rows[0].total_credit_card_debt) || 0;
    } catch (error) {
      console.error('Error calculating credit card debt:', error);
      throw error;
    }
  }

  // Update credit card
  async update(updateData) {
    try {
      const allowedFields = [
        'name', 'bank_id', 'bank_name', 'credit_limit', 'current_balance',
        'interest_rate', 'minimum_payment_rate', 'payment_due_date', 'is_active'
      ];

      const updates = [];
      const params = [];
      let paramIndex = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (allowedFields.includes(dbField) && value !== undefined) {
          updates.push(`${dbField} = $${paramIndex++}`);
          params.push(value);
        }
      });

      if (updates.length === 0) {
        throw new Error('Güncellenecek alan bulunamadı');
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(this.id);

      const query = `
        UPDATE credit_cards 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await DatabaseUtils.query(query, params);
      
      if (result.rows.length === 0) {
        throw new Error('Kredi kartı bulunamadı');
      }

      // Update current instance
      const updatedData = result.rows[0];
      Object.assign(this, new CreditCard(updatedData));

      return this;
    } catch (error) {
      console.error('Error updating credit card:', error);
      throw error;
    }
  }

  // Delete credit card (soft delete)
  async delete() {
    try {
      const query = `
        UPDATE credit_cards 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await DatabaseUtils.query(query, [this.id]);
      
      if (result.rows.length === 0) {
        throw new Error('Kredi kartı bulunamadı');
      }

      this.isActive = false;
      return true;
    } catch (error) {
      console.error('Error deleting credit card:', error);
      throw error;
    }
  }

  // Hard delete (permanent)
  async hardDelete() {
    try {
      const query = 'DELETE FROM credit_cards WHERE id = $1';
      await DatabaseUtils.query(query, [this.id]);
      return true;
    } catch (error) {
      console.error('Error hard deleting credit card:', error);
      throw error;
    }
  }

  // Calculate available credit
  getAvailableCredit() {
    return Math.max(0, this.creditLimit - this.currentBalance);
  }

  // Calculate utilization percentage
  getUtilizationPercentage() {
    if (this.creditLimit === 0) return 0;
    return Math.round((this.currentBalance / this.creditLimit) * 100 * 100) / 100;
  }

  // Calculate minimum payment amount
  getMinimumPayment() {
    return Math.round(this.currentBalance * (this.minimumPaymentRate / 100) * 100) / 100;
  }

  // Calculate monthly interest
  getMonthlyInterest() {
    const monthlyRate = this.interestRate / 12 / 100;
    return Math.round(this.currentBalance * monthlyRate * 100) / 100;
  }

  // Get next payment due date
  getNextPaymentDueDate() {
    if (!this.paymentDueDate) return null;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let dueDate = new Date(currentYear, currentMonth, this.paymentDueDate);
    
    // If the due date has passed this month, move to next month
    if (dueDate <= today) {
      dueDate = new Date(currentYear, currentMonth + 1, this.paymentDueDate);
    }

    return dueDate;
  }

  // Check if payment is overdue
  isPaymentOverdue() {
    const nextDueDate = this.getNextPaymentDueDate();
    if (!nextDueDate) return false;
    
    return new Date() > nextDueDate && this.currentBalance > 0;
  }

  // Get days until next payment
  getDaysUntilPayment() {
    const nextDueDate = this.getNextPaymentDueDate();
    if (!nextDueDate) return null;

    const today = new Date();
    const diffTime = nextDueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Record a payment
  async recordPayment(amount, description = 'Kredi kartı ödemesi') {
    try {
      if (amount <= 0) {
        throw new Error('Ödeme tutarı pozitif olmalıdır');
      }

      if (amount > this.currentBalance) {
        throw new Error('Ödeme tutarı mevcut borçtan fazla olamaz');
      }

      // Start transaction
      const queries = [
        {
          text: `
            UPDATE credit_cards 
            SET current_balance = current_balance - $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
          `,
          params: [amount, this.id]
        },
        {
          text: `
            INSERT INTO transactions (user_id, credit_card_id, type, amount, description, transaction_date)
            VALUES ($1, $2, 'payment', $3, $4, CURRENT_DATE)
            RETURNING *
          `,
          params: [this.userId, this.id, amount, description]
        }
      ];

      const results = await DatabaseUtils.transaction(queries);
      
      // Update current instance
      this.currentBalance = parseFloat(results[0].rows[0].current_balance);
      this.updatedAt = results[0].rows[0].updated_at;

      return {
        creditCard: this,
        transaction: results[1].rows[0]
      };
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }

  // Add expense to credit card
  async addExpense(amount, description, category = null) {
    try {
      if (amount <= 0) {
        throw new Error('Harcama tutarı pozitif olmalıdır');
      }

      const newBalance = this.currentBalance + amount;
      if (newBalance > this.creditLimit) {
        throw new Error('Kredi limiti aşılacak');
      }

      // Start transaction
      const queries = [
        {
          text: `
            UPDATE credit_cards 
            SET current_balance = current_balance + $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
          `,
          params: [amount, this.id]
        },
        {
          text: `
            INSERT INTO transactions (user_id, credit_card_id, type, amount, description, category, transaction_date)
            VALUES ($1, $2, 'expense', $3, $4, $5, CURRENT_DATE)
            RETURNING *
          `,
          params: [this.userId, this.id, amount, description, category]
        }
      ];

      const results = await DatabaseUtils.transaction(queries);
      
      // Update current instance
      this.currentBalance = parseFloat(results[0].rows[0].current_balance);
      this.updatedAt = results[0].rows[0].updated_at;

      return {
        creditCard: this,
        transaction: results[1].rows[0]
      };
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  // Get transaction history
  async getTransactions(options = {}) {
    try {
      const { page = 1, limit = 10, startDate, endDate, type } = options;
      
      let query = `
        SELECT * FROM transactions 
        WHERE credit_card_id = $1
      `;
      let params = [this.id];
      let paramIndex = 2;

      // Add filters
      if (startDate) {
        query += ` AND transaction_date >= $${paramIndex++}`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND transaction_date <= $${paramIndex++}`;
        params.push(endDate);
      }

      if (type) {
        query += ` AND type = $${paramIndex++}`;
        params.push(type);
      }

      // Add pagination
      const offset = (page - 1) * limit;
      query += ` ORDER BY transaction_date DESC, created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(limit, offset);

      const result = await DatabaseUtils.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      bankId: this.bankId,
      bankName: this.bankName,
      creditLimit: this.creditLimit,
      currentBalance: this.currentBalance,
      availableCredit: this.getAvailableCredit(),
      utilizationPercentage: this.getUtilizationPercentage(),
      interestRate: this.interestRate,
      minimumPaymentRate: this.minimumPaymentRate,
      minimumPayment: this.getMinimumPayment(),
      monthlyInterest: this.getMonthlyInterest(),
      paymentDueDate: this.paymentDueDate,
      nextPaymentDueDate: this.getNextPaymentDueDate(),
      daysUntilPayment: this.getDaysUntilPayment(),
      isPaymentOverdue: this.isPaymentOverdue(),
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = CreditCard;
