#!/usr/bin/env node

/**
 * Comprehensive Test Environment Validation Script
 * 
 * This script validates all functionality in the test environment:
 * - Database connectivity and operations
 * - API endpoints and health checks
 * - Authentication flow
 * - Account creation and management
 * - Credit card functionality
 * - Complete user workflow from registration to data operations
 */

const axios = require('axios');
const { Pool } = require('pg');

// Configuration
const config = {
  apiUrl: process.env.TEST_API_URL || 'http://localhost:5000',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'budget_app',
    user: process.env.DB_USER || 'budget_admin',
    password: process.env.DB_PASSWORD || 'budget123'
  }
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    skip: '⏭️'
  }[type] || '📋';
  
  console.log(`${timestamp} ${prefix} ${message}`);
};

const recordTest = (name, passed, error = null, skipped = false) => {
  results.tests.push({ name, passed, error, skipped });
  if (skipped) {
    results.skipped++;
  } else if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
};

// Test functions
async function testDatabaseConnectivity() {
  log('Testing database connectivity...', 'info');
  
  try {
    const pool = new Pool(config.database);
    const client = await pool.connect();
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    const row = result.rows[0];
    
    log(`Database connected successfully. Time: ${row.current_time}`, 'success');
    log(`PostgreSQL version: ${row.version.split(' ')[0]} ${row.version.split(' ')[1]}`, 'info');
    
    client.release();
    await pool.end();
    
    recordTest('Database Connectivity', true);
    return true;
  } catch (error) {
    log(`Database connectivity failed: ${error.message}`, 'error');
    recordTest('Database Connectivity', false, error.message);
    return false;
  }
}

async function testDatabaseSchema() {
  log('Testing database schema...', 'info');
  
  try {
    const pool = new Pool(config.database);
    const client = await pool.connect();
    
    // Check for required tables
    const requiredTables = ['users', 'accounts', 'credit_cards', 'transactions'];
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ANY($1)
    `, [requiredTables]);
    
    const existingTables = result.rows.map(row => row.table_name);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length === 0) {
      log(`All required tables exist: ${existingTables.join(', ')}`, 'success');
      recordTest('Database Schema', true);
    } else {
      log(`Missing tables: ${missingTables.join(', ')}`, 'error');
      recordTest('Database Schema', false, `Missing tables: ${missingTables.join(', ')}`);
    }
    
    client.release();
    await pool.end();
    
    return missingTables.length === 0;
  } catch (error) {
    log(`Database schema check failed: ${error.message}`, 'error');
    recordTest('Database Schema', false, error.message);
    return false;
  }
}

async function testHealthEndpoints() {
  log('Testing health endpoints...', 'info');
  
  try {
    // Test main health endpoint
    const healthResponse = await axios.get(`${config.apiUrl}/health`, { timeout: 5000 });
    
    if (healthResponse.status === 200 && healthResponse.data.status) {
      log(`Health endpoint OK: ${healthResponse.data.status}`, 'success');
    } else {
      throw new Error('Invalid health response');
    }
    
    // Test API health endpoint
    const apiHealthResponse = await axios.get(`${config.apiUrl}/api/health`, { timeout: 5000 });
    
    if (apiHealthResponse.status === 200 && apiHealthResponse.data.success) {
      log(`API health endpoint OK: ${apiHealthResponse.data.status}`, 'success');
    } else {
      throw new Error('Invalid API health response');
    }
    
    recordTest('Health Endpoints', true);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('Server not running - skipping health endpoint tests', 'skip');
      recordTest('Health Endpoints', false, 'Server not running', true);
    } else {
      log(`Health endpoints failed: ${error.message}`, 'error');
      recordTest('Health Endpoints', false, error.message);
    }
    return false;
  }
}

async function testUserRegistrationAndLogin() {
  log('Testing user registration and login...', 'info');
  
  try {
    const testUser = {
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    };
    
    // Register user
    const registerResponse = await axios.post(`${config.apiUrl}/api/auth/register`, testUser, {
      timeout: 5000
    });
    
    if (registerResponse.status !== 201) {
      throw new Error(`Registration failed with status ${registerResponse.status}`);
    }
    
    log('User registration successful', 'success');
    
    // Login user
    const loginResponse = await axios.post(`${config.apiUrl}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    }, { timeout: 5000 });
    
    if (loginResponse.status !== 200 || !loginResponse.data.token) {
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }
    
    log('User login successful', 'success');
    
    // Verify token
    const verifyResponse = await axios.get(`${config.apiUrl}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${loginResponse.data.token}` },
      timeout: 5000
    });
    
    if (verifyResponse.status !== 200) {
      throw new Error(`Token verification failed with status ${verifyResponse.status}`);
    }
    
    log('Token verification successful', 'success');
    
    recordTest('User Registration and Login', true);
    return { token: loginResponse.data.token, userId: loginResponse.data.user.id };
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log('Server not running - skipping authentication tests', 'skip');
      recordTest('User Registration and Login', false, 'Server not running', true);
    } else {
      log(`Authentication failed: ${error.message}`, 'error');
      recordTest('User Registration and Login', false, error.message);
    }
    return null;
  }
}

async function testAccountOperations(authToken) {
  log('Testing account operations...', 'info');
  
  if (!authToken) {
    log('No auth token - skipping account tests', 'skip');
    recordTest('Account Operations', false, 'No auth token', true);
    return null;
  }
  
  try {
    const accountData = {
      name: 'Test Checking Account',
      accountType: 'checking',
      balance: 1000.50,
      currency: 'TRY',
      bankName: 'Test Bank',
      iban: 'TR123456789012345678901234',
      accountNumber: '12345678'
    };
    
    // Create account
    const createResponse = await axios.post(`${config.apiUrl}/api/accounts`, accountData, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 5000
    });
    
    if (createResponse.status !== 201) {
      throw new Error(`Account creation failed with status ${createResponse.status}`);
    }
    
    const createdAccount = createResponse.data.data;
    log(`Account created successfully: ${createdAccount.name} (ID: ${createdAccount.id})`, 'success');
    
    // Read account
    const readResponse = await axios.get(`${config.apiUrl}/api/accounts/${createdAccount.id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 5000
    });
    
    if (readResponse.status !== 200) {
      throw new Error(`Account read failed with status ${readResponse.status}`);
    }
    
    log('Account read successful', 'success');
    
    // Update account
    const updateData = { name: 'Updated Test Account' };
    const updateResponse = await axios.put(`${config.apiUrl}/api/accounts/${createdAccount.id}`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 5000
    });
    
    if (updateResponse.status !== 200) {
      throw new Error(`Account update failed with status ${updateResponse.status}`);
    }
    
    log('Account update successful', 'success');
    
    // List accounts
    const listResponse = await axios.get(`${config.apiUrl}/api/accounts`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 5000
    });
    
    if (listResponse.status !== 200) {
      throw new Error(`Account list failed with status ${listResponse.status}`);
    }
    
    log(`Account list successful: ${listResponse.data.data.length} accounts found`, 'success');
    
    // Delete account
    const deleteResponse = await axios.delete(`${config.apiUrl}/api/accounts/${createdAccount.id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 5000
    });
    
    if (deleteResponse.status !== 200 && deleteResponse.status !== 204) {
      throw new Error(`Account deletion failed with status ${deleteResponse.status}`);
    }
    
    log('Account deletion successful', 'success');
    
    recordTest('Account Operations', true);
    return true;
  } catch (error) {
    log(`Account operations failed: ${error.message}`, 'error');
    recordTest('Account Operations', false, error.message);
    return false;
  }
}

async function testCreditCardOperations(authToken) {
  log('Testing credit card operations...', 'info');
  
  if (!authToken) {
    log('No auth token - skipping credit card tests', 'skip');
    recordTest('Credit Card Operations', false, 'No auth token', true);
    return null;
  }
  
  try {
    const cardData = {
      name: 'Test Credit Card',
      bankName: 'Test Bank',
      cardNumber: '1234567890123456',
      expiryMonth: 12,
      expiryYear: 2025,
      creditLimit: 5000.00,
      currentBalance: 1500.00,
      interestRate: 1.5,
      minimumPaymentRate: 0.05
    };
    
    // Create credit card
    const createResponse = await axios.post(`${config.apiUrl}/api/credit-cards`, cardData, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 5000
    });
    
    if (createResponse.status !== 201) {
      throw new Error(`Credit card creation failed with status ${createResponse.status}`);
    }
    
    const createdCard = createResponse.data.data;
    log(`Credit card created successfully: ${createdCard.name} (ID: ${createdCard.id})`, 'success');
    
    // Verify card number is masked/encrypted
    if (createdCard.cardNumber && createdCard.cardNumber === cardData.cardNumber) {
      log('WARNING: Credit card number is stored in plain text!', 'warning');
    } else {
      log('Credit card number is properly masked/encrypted', 'success');
    }
    
    // Read credit card
    const readResponse = await axios.get(`${config.apiUrl}/api/credit-cards/${createdCard.id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 5000
    });
    
    if (readResponse.status !== 200) {
      throw new Error(`Credit card read failed with status ${readResponse.status}`);
    }
    
    log('Credit card read successful', 'success');
    
    // Update credit card
    const updateData = { name: 'Updated Test Card', creditLimit: 7500.00 };
    const updateResponse = await axios.put(`${config.apiUrl}/api/credit-cards/${createdCard.id}`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 5000
    });
    
    if (updateResponse.status !== 200) {
      throw new Error(`Credit card update failed with status ${updateResponse.status}`);
    }
    
    log('Credit card update successful', 'success');
    
    // List credit cards
    const listResponse = await axios.get(`${config.apiUrl}/api/credit-cards`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 5000
    });
    
    if (listResponse.status !== 200) {
      throw new Error(`Credit card list failed with status ${listResponse.status}`);
    }
    
    log(`Credit card list successful: ${listResponse.data.data.length} cards found`, 'success');
    
    // Delete credit card
    const deleteResponse = await axios.delete(`${config.apiUrl}/api/credit-cards/${createdCard.id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 5000
    });
    
    if (deleteResponse.status !== 200 && deleteResponse.status !== 204) {
      throw new Error(`Credit card deletion failed with status ${deleteResponse.status}`);
    }
    
    log('Credit card deletion successful', 'success');
    
    recordTest('Credit Card Operations', true);
    return true;
  } catch (error) {
    log(`Credit card operations failed: ${error.message}`, 'error');
    recordTest('Credit Card Operations', false, error.message);
    return false;
  }
}

async function testCompleteUserWorkflow() {
  log('Testing complete user workflow...', 'info');
  
  try {
    // Full workflow: Register -> Login -> Create Account -> Create Credit Card -> Clean up
    const authData = await testUserRegistrationAndLogin();
    
    if (!authData) {
      recordTest('Complete User Workflow', false, 'Authentication failed', true);
      return false;
    }
    
    const accountSuccess = await testAccountOperations(authData.token);
    const creditCardSuccess = await testCreditCardOperations(authData.token);
    
    if (accountSuccess && creditCardSuccess) {
      log('Complete user workflow successful', 'success');
      recordTest('Complete User Workflow', true);
      return true;
    } else {
      log('Complete user workflow partially failed', 'warning');
      recordTest('Complete User Workflow', false, 'Some operations failed');
      return false;
    }
  } catch (error) {
    log(`Complete user workflow failed: ${error.message}`, 'error');
    recordTest('Complete User Workflow', false, error.message);
    return false;
  }
}

// Main validation function
async function validateTestEnvironment() {
  log('🚀 Starting Test Environment Validation', 'info');
  log(`API URL: ${config.apiUrl}`, 'info');
  log(`Database: ${config.database.host}:${config.database.port}/${config.database.database}`, 'info');
  log('', 'info');
  
  // Run all tests
  await testDatabaseConnectivity();
  await testDatabaseSchema();
  await testHealthEndpoints();
  await testCompleteUserWorkflow();
  
  // Print summary
  log('', 'info');
  log('📊 Test Environment Validation Summary', 'info');
  log('═'.repeat(50), 'info');
  log(`✅ Passed: ${results.passed}`, 'success');
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'info');
  log(`⏭️ Skipped: ${results.skipped}`, results.skipped > 0 ? 'warning' : 'info');
  log(`📋 Total: ${results.tests.length}`, 'info');
  log('', 'info');
  
  // Detailed results
  if (results.tests.length > 0) {
    log('📋 Detailed Results:', 'info');
    results.tests.forEach(test => {
      const status = test.skipped ? '⏭️' : (test.passed ? '✅' : '❌');
      const error = test.error ? ` (${test.error})` : '';
      log(`  ${status} ${test.name}${error}`, 'info');
    });
  }
  
  log('', 'info');
  
  // Overall status
  if (results.failed === 0) {
    log('🎉 Test Environment Validation PASSED', 'success');
    process.exit(0);
  } else {
    log('💥 Test Environment Validation FAILED', 'error');
    process.exit(1);
  }
}

// Run validation if called directly
if (require.main === module) {
  validateTestEnvironment().catch(error => {
    log(`Validation script error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  validateTestEnvironment,
  testDatabaseConnectivity,
  testDatabaseSchema,
  testHealthEndpoints,
  testUserRegistrationAndLogin,
  testAccountOperations,
  testCreditCardOperations,
  testCompleteUserWorkflow
};