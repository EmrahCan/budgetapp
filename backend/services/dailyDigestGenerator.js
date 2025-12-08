const DatabaseUtils = require('../utils/database');

class DailyDigestGenerator {
  /**
   * Generate daily digest email content for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Email content with subject and html
   */
  static async generateDailyDigest(userId) {
    try {
      // Fetch user info
      const userResult = await DatabaseUtils.query(
        'SELECT email, first_name FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // Fetch account balances
      const accountsResult = await DatabaseUtils.query(
        `SELECT name, balance, type 
         FROM accounts 
         WHERE user_id = $1 AND is_active = true 
         ORDER BY created_at`,
        [userId]
      );

      // Fetch today's transactions
      const today = new Date().toISOString().split('T')[0];
      const transactionsResult = await DatabaseUtils.query(
        `SELECT description, amount, type, category, transaction_date
         FROM transactions 
         WHERE user_id = $1 AND transaction_date = $2
         ORDER BY created_at DESC
         LIMIT 10`,
        [userId, today]
      );

      // Calculate today's totals
      const todayIncome = transactionsResult.rows
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const todayExpenses = transactionsResult.rows
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const todayNet = todayIncome - todayExpenses;

      // Calculate total balance
      const totalBalance = accountsResult.rows
        .reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

      // Generate HTML email
      const html = this.generateEmailHTML({
        userName: user.first_name || 'User',
        accounts: accountsResult.rows,
        totalBalance,
        transactions: transactionsResult.rows,
        todayIncome,
        todayExpenses,
        todayNet,
        date: new Date().toLocaleDateString('tr-TR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      });

      return {
        to: user.email,
        subject: `📊 Günlük Finansal Özet - ${new Date().toLocaleDateString('tr-TR')}`,
        html
      };

    } catch (error) {
      console.error('Error generating daily digest:', error);
      throw error;
    }
  }

  /**
   * Generate HTML email content
   * @param {Object} data - Email data
   * @returns {string} HTML content
   */
  static generateEmailHTML(data) {
    const {
      userName,
      accounts,
      totalBalance,
      transactions,
      todayIncome,
      todayExpenses,
      todayNet,
      date
    } = data;

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
      }).format(amount);
    };

    const accountTypeNames = {
      checking: 'Vadesiz Hesap',
      savings: 'Vadeli Hesap',
      cash: 'Nakit',
      investment: 'Yatırım'
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Günlük Finansal Özet</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                📊 Günlük Finansal Özet
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">
                ${date}
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <p style="margin: 0; font-size: 16px; color: #333333;">
                Merhaba ${userName},
              </p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666666; line-height: 1.6;">
                İşte bugünkü finansal özetiniz:
              </p>
            </td>
          </tr>

          <!-- Total Balance -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">
                  Toplam Bakiye
                </p>
                <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: 700; color: #667eea;">
                  ${formatCurrency(totalBalance)}
                </p>
              </div>
            </td>
          </tr>

          <!-- Accounts -->
          ${accounts.length > 0 ? `
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #333333; font-weight: 600;">
                💰 Hesaplarınız
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${accounts.map(acc => `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <p style="margin: 0; font-size: 14px; color: #333333; font-weight: 500;">
                          ${acc.name}
                        </p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #999999;">
                          ${accountTypeNames[acc.type] || acc.type}
                        </p>
                      </div>
                      <p style="margin: 0; font-size: 16px; color: #333333; font-weight: 600;">
                        ${formatCurrency(acc.balance)}
                      </p>
                    </div>
                  </td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Today's Activity -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #333333; font-weight: 600;">
                📈 Bugünkü Aktivite
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px; background-color: #d4edda; border-radius: 6px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: #155724; font-size: 14px;">Gelir</span>
                      <span style="color: #155724; font-size: 16px; font-weight: 600;">+${formatCurrency(todayIncome)}</span>
                    </div>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px; background-color: #f8d7da; border-radius: 6px; margin-bottom: 8px;">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: #721c24; font-size: 14px;">Gider</span>
                      <span style="color: #721c24; font-size: 16px; font-weight: 600;">-${formatCurrency(todayExpenses)}</span>
                    </div>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px; background-color: ${todayNet >= 0 ? '#d1ecf1' : '#f8d7da'}; border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: ${todayNet >= 0 ? '#0c5460' : '#721c24'}; font-size: 14px; font-weight: 600;">Net</span>
                      <span style="color: ${todayNet >= 0 ? '#0c5460' : '#721c24'}; font-size: 16px; font-weight: 700;">
                        ${todayNet >= 0 ? '+' : ''}${formatCurrency(todayNet)}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Recent Transactions -->
          ${transactions.length > 0 ? `
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #333333; font-weight: 600;">
                🔄 Bugünkü İşlemler
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${transactions.map(tx => `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div>
                        <p style="margin: 0; font-size: 14px; color: #333333;">
                          ${tx.description}
                        </p>
                        ${tx.category ? `
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #999999;">
                          ${tx.category}
                        </p>
                        ` : ''}
                      </div>
                      <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${tx.type === 'income' ? '#28a745' : '#dc3545'};">
                        ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
                      </p>
                    </div>
                  </td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : `
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #666666;">
                  Bugün henüz işlem yapılmadı.
                </p>
              </div>
            </td>
          </tr>
          `}

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #999999;">
                Bu email otomatik olarak gönderilmiştir.
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                <a href="https://budgetapp.site/profile" style="color: #667eea; text-decoration: none;">
                  Email tercihlerini değiştir
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}

module.exports = DailyDigestGenerator;
