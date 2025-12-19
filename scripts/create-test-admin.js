const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'budget_app',
  user: process.env.DB_USER || 'budget_admin',
  password: process.env.DB_PASSWORD
});

async function createAdminUser() {
  try {
    const email = 'emrahcan@hotmail.com';
    const password = 'Eben2010++**';
    const firstName = 'Emrah';
    const lastName = 'Can';
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user exists
    const checkResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (checkResult.rows.length > 0) {
      // Update existing user
      await pool.query(
        'UPDATE users SET password_hash = $1, first_name = $2, last_name = $3, role = $4 WHERE email = $5',
        [hashedPassword, firstName, lastName, 'admin', email]
      );
      console.log('✅ Kullanıcı güncellendi ve admin yapıldı!');
    } else {
      // Create new user
      await pool.query(
        'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5)',
        [email, hashedPassword, firstName, lastName, 'admin']
      );
      console.log('✅ Yeni admin kullanıcı oluşturuldu!');
    }
    
    console.log('\nGiriş Bilgileri:');
    console.log('Email:', email);
    console.log('Şifre:', password);
    console.log('Admin: Evet');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await pool.end();
  }
}

createAdminUser();
