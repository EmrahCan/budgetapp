#!/usr/bin/env node

/**
 * Test script to send a test email via the email service
 * Usage: node test-email-send.js <email>
 */

require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmail() {
  try {
    const testEmail = process.argv[2];

    if (!testEmail) {
      console.error('❌ Please provide an email address');
      console.log('Usage: node test-email-send.js <email>');
      process.exit(1);
    }

    console.log('🚀 Initializing email service...');
    await emailService.initialize();

    console.log(`📧 Sending test email to: ${testEmail}`);
    const result = await emailService.sendTestEmail(testEmail);

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', result.messageId);
    } else {
      console.error('❌ Failed to send test email');
      console.error('Reason:', result.reason || result.error);
    }

    // Show stats
    const stats = emailService.getStats();
    console.log('\n📊 Email Stats:');
    console.log(JSON.stringify(stats, null, 2));

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testEmail();
