# Email Preferences and Delivery Logging Migration

## Overview

This migration adds support for user email preferences and email delivery tracking for the daily email notifications feature.

## Tables Created

### 1. user_email_preferences

Stores user preferences for email notifications.

**Columns:**
- `id`: Primary key
- `user_id`: Foreign key to users table (unique)
- `email_enabled`: Master switch for all email notifications (default: true)
- `daily_digest_enabled`: Enable/disable daily digest emails (default: true)
- `daily_digest_time`: Preferred time for daily digest delivery (default: 08:00:00)
- `report_emails_enabled`: Enable/disable report emails (default: true)
- `report_frequency`: Frequency for reports - 'daily', 'weekly', or 'monthly' (default: 'weekly')
- `critical_alerts_enabled`: Enable/disable critical alert emails (default: true)
- `language`: Email language preference - 'tr' or 'en' (default: 'tr')
- `verified_email`: Verified email address for notifications
- `email_verified_at`: Timestamp when email was verified
- `verification_token`: Token for email verification
- `verification_token_expires_at`: Expiration time for verification token
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp (auto-updated via trigger)

**Indexes:**
- `idx_user_email_preferences_user_id`: Fast lookup by user_id
- `idx_user_email_preferences_enabled`: Partial index for active users

**Constraints:**
- Unique constraint on user_id (one preference record per user)
- Check constraint on report_frequency (must be 'daily', 'weekly', or 'monthly')
- Check constraint on language (must be 'tr' or 'en')

### 2. email_delivery_log

Tracks all email delivery attempts and their status.

**Columns:**
- `id`: Primary key
- `user_id`: Foreign key to users table
- `email_type`: Type of email - 'daily_digest', 'report', 'budget_alert', 'payment_reminder', 'security_alert', 'test'
- `recipient_email`: Email address where the email was sent
- `subject`: Email subject line
- `status`: Delivery status - 'sent', 'failed', 'bounced', 'queued'
- `resend_message_id`: Message ID returned by Resend API
- `error_message`: Error message if delivery failed
- `retry_count`: Number of retry attempts
- `sent_at`: Timestamp when email was successfully sent
- `created_at`: Record creation timestamp

**Indexes:**
- `idx_email_delivery_log_user_id`: Fast lookup by user_id
- `idx_email_delivery_log_status`: Fast filtering by status
- `idx_email_delivery_log_created_at`: Fast sorting by creation time (descending)
- `idx_email_delivery_log_email_type`: Fast filtering by email type

**Constraints:**
- Check constraint on email_type (must be one of the defined types)
- Check constraint on status (must be 'sent', 'failed', 'bounced', or 'queued')

### 3. smart_notifications (columns added)

Added email tracking columns to existing smart_notifications table:

- `email_sent`: Boolean flag indicating if notification was sent via email (default: false)
- `email_sent_at`: Timestamp when notification was sent via email
- `email_delivery_log_id`: Foreign key to email_delivery_log table

**Indexes:**
- `idx_smart_notifications_email_sent`: Partial index for unsent notifications

## Features

### Automatic Triggers

- **update_user_email_preferences_updated_at**: Automatically updates the `updated_at` timestamp when preferences are modified

### Default Data

- Creates default email preferences for all existing users with:
  - Email enabled: true
  - Daily digest enabled: true
  - Report emails enabled: true
  - Language: User's existing language preference or 'tr'

## Usage

### Apply Migration

```bash
# Using psql
psql -U your_username -d budget_app -f add_email_preferences.sql

# Or using the migrate.js script
node database/migrate.js
```

### Rollback Migration

```bash
# Using psql
psql -U your_username -d budget_app -f rollback_email_preferences.sql
```

## Example Queries

### Get user email preferences

```sql
SELECT * FROM user_email_preferences WHERE user_id = 1;
```

### Update user preferences

```sql
UPDATE user_email_preferences 
SET daily_digest_enabled = false, 
    report_frequency = 'monthly'
WHERE user_id = 1;
```

### Get email delivery stats for a user

```sql
SELECT 
  email_type,
  status,
  COUNT(*) as count
FROM email_delivery_log
WHERE user_id = 1
GROUP BY email_type, status
ORDER BY email_type, status;
```

### Get recent failed emails

```sql
SELECT 
  u.email,
  edl.email_type,
  edl.subject,
  edl.error_message,
  edl.retry_count,
  edl.created_at
FROM email_delivery_log edl
JOIN users u ON u.id = edl.user_id
WHERE edl.status = 'failed'
ORDER BY edl.created_at DESC
LIMIT 10;
```

### Get notifications not yet sent via email

```sql
SELECT 
  sn.id,
  sn.user_id,
  sn.type,
  sn.title,
  sn.created_at
FROM smart_notifications sn
WHERE sn.email_sent = false
  AND sn.is_read = false
ORDER BY sn.created_at DESC;
```

## Related Files

- `add_email_preferences.sql`: Migration file
- `rollback_email_preferences.sql`: Rollback file
- `backend/services/emailService.js`: Email service implementation
- `backend/routes/email.js`: Email API endpoints

## Notes

- The migration is idempotent - it can be run multiple times safely
- Default preferences are created for all existing users
- The `updated_at` column is automatically maintained via trigger
- All foreign keys use CASCADE delete to maintain referential integrity
- Indexes are optimized for common query patterns
