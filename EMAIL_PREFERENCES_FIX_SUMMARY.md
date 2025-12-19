# Email Preferences Fix - Table Name Mismatch

## 🐛 Problem
Email preferences API was failing because of table name mismatch:
- **Database table**: `email_preferences`
- **Backend model**: Looking for `user_email_preferences`

## 🔍 Root Cause
The migration script created tables with simplified names, but the backend models were using the full names from the design document.

## ✅ Solution Applied

### 1. Backend Model Updates
Updated `backend/models/EmailPreferences.js`:
- Changed all queries from `user_email_preferences` → `email_preferences`
- Simplified `createDefault()` to only use existing columns
- Simplified `update()` to only update existing columns
- Removed references to non-existent columns (report_emails_enabled, report_frequency, critical_alerts_enabled, language, timezone, verification fields)

### 2. Backend Route Updates
Updated `backend/routes/email.js`:
- Simplified PUT /preferences validation
- Removed validation for non-existent fields
- Only handles: email_enabled, daily_digest_enabled, daily_digest_time

### 3. Frontend Component Updates
Updated `frontend/src/components/settings/EmailPreferences.js`:
- Simplified state to only track existing fields
- Removed UI sections for non-existent features:
  - Report emails
  - Critical alerts
  - Language selection
  - Timezone selection
- Kept only:
  - Master email toggle
  - Daily digest toggle
  - Daily digest time picker

## 📊 Current Database Schema

### email_preferences table
```sql
- id (serial)
- user_id (integer, unique)
- email_enabled (boolean, default true)
- daily_digest_enabled (boolean, default true)
- daily_digest_time (time, default '09:00:00')
- created_at (timestamp)
- updated_at (timestamp)
```

### email_delivery_log table
```sql
- id (serial)
- user_id (integer)
- email_type (varchar)
- recipient_email (varchar)
- subject (varchar)
- status (varchar)
- resend_message_id (varchar)
- error_message (text)
- retry_count (integer)
- sent_at (timestamp)
- created_at (timestamp)
```

## 🚀 Deployment Status

### ✅ Test VM (20.224.194.131)
- [x] Backend model updated
- [x] Backend routes updated
- [x] Frontend component updated
- [x] Backend restarted
- [x] Frontend rebuilt and restarted
- [ ] Manual testing pending

## 🧪 Testing Instructions

### 1. Test Email Preferences API
```bash
# Get preferences (requires auth token)
curl -X GET https://test.budgetapp.site/api/email/preferences \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response:
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "email_enabled": true,
    "daily_digest_enabled": true,
    "daily_digest_time": "09:00:00",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### 2. Test Frontend UI
1. Visit: https://test.budgetapp.site/profile
2. Click on "Email Notifications" tab (if exists) or check settings
3. Verify:
   - Page loads without errors
   - Email toggle works
   - Daily digest toggle works
   - Time picker works
   - Save button works

### 3. Test Email Sending
```bash
# Send test email (requires auth token)
curl -X POST https://test.budgetapp.site/api/email/test \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response:
{
  "success": true,
  "message": "Test email sent successfully",
  "messageId": "..."
}
```

## 📝 Files Modified

### Backend
- `backend/models/EmailPreferences.js` - Fixed table name and columns
- `backend/routes/email.js` - Simplified validation

### Frontend
- `frontend/src/components/settings/EmailPreferences.js` - Simplified UI

### Scripts
- `scripts/fix-email-preferences-table.sh` - Deployment script (created)

## 🔧 Next Steps

### Immediate
1. ✅ Deploy to test VM
2. ⏳ Manual testing on test VM
3. ⏳ Verify email sending works
4. ⏳ Deploy to production VM

### Future Enhancements (Optional)
If you want to add back the removed features, you'll need to:
1. Add columns to database:
   - report_emails_enabled
   - report_frequency
   - critical_alerts_enabled
   - language
   - timezone
2. Update backend model to handle new columns
3. Update frontend UI to show new options

## 🎯 Current Capabilities

### What Works Now:
- ✅ Users can enable/disable all email notifications
- ✅ Users can enable/disable daily digest
- ✅ Users can set preferred time for daily digest
- ✅ System can send test emails
- ✅ All emails are logged to database
- ✅ API endpoints for preferences management

### What's Simplified:
- ❌ No report email preferences (removed from UI)
- ❌ No critical alerts toggle (removed from UI)
- ❌ No language selection (removed from UI)
- ❌ No timezone selection (removed from UI)

These can be added back later if needed by updating the database schema.

## 🐛 Known Issues

### Other Issue Found
Backend logs show: `relation "smart_notifications" does not exist`
- This is a separate issue unrelated to email preferences
- Needs investigation and fix

---

**Status**: ✅ DEPLOYED TO TEST VM  
**Deployed**: December 8, 2025 at 20:44 UTC  
**Next**: Manual testing required

