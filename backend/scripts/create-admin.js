const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function createAdminUser() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@budgetapp.site';
    const password = process.env.ADMIN_PASSWORD || 'Admin123!@#';
    const firstName = 'Admin';
    const lastName = 'User';
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Check if admin already exists
    const checkQuery = 'SELECT id FROM users WHERE email = $1';
    const checkResult = await pool.query(checkQuery, [email]);
    
    if (checkResult.rows.length > 0) {
      console.log('⚠️  Admin user already exists!');
      console.log('Email:', email);
      console.log('Updating password...');
      
      // Update existing admin user password
      const updateQuery = `
        UPDATE users 
        SET password_hash = $1, role = 'admin', updated_at = NOW()
        WHERE email = $2
        RETURNING id, email, first_name, last_name, role
      `;
      
      const result = await pool.query(updateQuery, [passwordHash, email]);
      
      console.log('✅ Admin user password updated successfully!');
      console.log('-----------------------------------');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Role:', result.rows[0].role);
      console.log('-----------------------------------');
      console.log('⚠️  Please change the password after first login!');
      
      process.exit(0);
    }
    
    // Create admin user
    const insertQuery = `
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      RETURNING id, email, first_name, last_name, role
    `;
    
    const result = await pool.query(insertQuery, [
      email,
      passwordHash,
      firstName,
      lastName,
      'admin'
    ]);
    
    console.log('✅ Admin user created successfully!');
    console.log('-----------------------------------');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Name:', result.rows[0].first_name, result.rows[0].last_name);
    console.log('Role:', result.rows[0].role);
    console.log('-----------------------------------');
    console.log('⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
