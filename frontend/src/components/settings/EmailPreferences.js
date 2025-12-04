import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { emailAPI } from '../../services/api';
import './EmailPreferences.css';

const EmailPreferences = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    daily_digest_enabled: true,
    daily_digest_time: '08:00',
    report_emails_enabled: true,
    report_frequency: 'weekly',
    critical_alerts_enabled: true,
    language: 'tr',
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await emailAPI.getPreferences();

      if (response.data.success) {
        const prefs = response.data.data;
        setPreferences({
          email_enabled: prefs.email_enabled,
          daily_digest_enabled: prefs.daily_digest_enabled,
          daily_digest_time: prefs.daily_digest_time?.substring(0, 5) || '08:00',
          report_emails_enabled: prefs.report_emails_enabled,
          report_frequency: prefs.report_frequency,
          critical_alerts_enabled: prefs.critical_alerts_enabled,
          language: prefs.language,
        });
      }
    } catch (error) {
      console.error('Error fetching email preferences:', error);
      setMessage({
        type: 'error',
        text: t('emailPreferences.fetchError') || 'Failed to load preferences',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const response = await emailAPI.updatePreferences(preferences);

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: t('emailPreferences.saveSuccess') || 'Preferences saved successfully',
        });
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Error saving email preferences:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('emailPreferences.saveError') || 'Failed to save preferences',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSendTestEmail = async () => {
    try {
      setSendingTest(true);
      setMessage({ type: '', text: '' });

      const response = await emailAPI.testEmail();

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: t('emailPreferences.testEmailSent') || 'Test email sent successfully! Check your inbox.',
        });
        
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('emailPreferences.testEmailError') || 'Failed to send test email',
      });
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="email-preferences-loading">
        <div className="spinner"></div>
        <p>{t('common.loading') || 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="email-preferences">
      <div className="email-preferences-header">
        <h2>{t('emailPreferences.title') || 'Email Notifications'}</h2>
        <p className="email-preferences-description">
          {t('emailPreferences.description') || 'Manage your email notification preferences'}
        </p>
      </div>

      {message.text && (
        <div className={`email-preferences-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="email-preferences-content">
        {/* Master Switch */}
        <div className="preference-section">
          <div className="preference-item master-switch">
            <div className="preference-info">
              <label className="preference-label">
                {t('emailPreferences.emailEnabled') || 'Enable Email Notifications'}
              </label>
              <p className="preference-help">
                {t('emailPreferences.emailEnabledHelp') || 'Turn off all email notifications'}
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.email_enabled}
                onChange={(e) => handleChange('email_enabled', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Daily Digest */}
        <div className="preference-section">
          <h3 className="section-title">
            {t('emailPreferences.dailyDigest') || 'Daily Digest'}
          </h3>
          
          <div className="preference-item">
            <div className="preference-info">
              <label className="preference-label">
                {t('emailPreferences.dailyDigestEnabled') || 'Daily Digest Email'}
              </label>
              <p className="preference-help">
                {t('emailPreferences.dailyDigestHelp') || 'Receive a daily summary of your notifications'}
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.daily_digest_enabled}
                onChange={(e) => handleChange('daily_digest_enabled', e.target.checked)}
                disabled={!preferences.email_enabled}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {preferences.daily_digest_enabled && (
            <div className="preference-item">
              <div className="preference-info">
                <label className="preference-label">
                  {t('emailPreferences.digestTime') || 'Preferred Time'}
                </label>
                <p className="preference-help">
                  {t('emailPreferences.digestTimeHelp') || 'What time should we send your daily digest?'}
                </p>
              </div>
              <input
                type="time"
                className="time-input"
                value={preferences.daily_digest_time}
                onChange={(e) => handleChange('daily_digest_time', e.target.value)}
                disabled={!preferences.email_enabled}
              />
            </div>
          )}
        </div>

        {/* Report Emails */}
        <div className="preference-section">
          <h3 className="section-title">
            {t('emailPreferences.reports') || 'Financial Reports'}
          </h3>
          
          <div className="preference-item">
            <div className="preference-info">
              <label className="preference-label">
                {t('emailPreferences.reportEmailsEnabled') || 'Report Emails'}
              </label>
              <p className="preference-help">
                {t('emailPreferences.reportEmailsHelp') || 'Receive financial reports via email'}
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.report_emails_enabled}
                onChange={(e) => handleChange('report_emails_enabled', e.target.checked)}
                disabled={!preferences.email_enabled}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {preferences.report_emails_enabled && (
            <div className="preference-item">
              <div className="preference-info">
                <label className="preference-label">
                  {t('emailPreferences.reportFrequency') || 'Report Frequency'}
                </label>
                <p className="preference-help">
                  {t('emailPreferences.reportFrequencyHelp') || 'How often should we send reports?'}
                </p>
              </div>
              <select
                className="frequency-select"
                value={preferences.report_frequency}
                onChange={(e) => handleChange('report_frequency', e.target.value)}
                disabled={!preferences.email_enabled}
              >
                <option value="daily">{t('emailPreferences.daily') || 'Daily'}</option>
                <option value="weekly">{t('emailPreferences.weekly') || 'Weekly'}</option>
                <option value="monthly">{t('emailPreferences.monthly') || 'Monthly'}</option>
              </select>
            </div>
          )}
        </div>

        {/* Critical Alerts */}
        <div className="preference-section">
          <h3 className="section-title">
            {t('emailPreferences.alerts') || 'Critical Alerts'}
          </h3>
          
          <div className="preference-item">
            <div className="preference-info">
              <label className="preference-label">
                {t('emailPreferences.criticalAlertsEnabled') || 'Critical Alerts'}
              </label>
              <p className="preference-help">
                {t('emailPreferences.criticalAlertsHelp') || 'Receive immediate alerts for budget limits and overdue payments'}
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.critical_alerts_enabled}
                onChange={(e) => handleChange('critical_alerts_enabled', e.target.checked)}
                disabled={!preferences.email_enabled}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Language */}
        <div className="preference-section">
          <h3 className="section-title">
            {t('emailPreferences.language') || 'Email Language'}
          </h3>
          
          <div className="preference-item">
            <div className="preference-info">
              <label className="preference-label">
                {t('emailPreferences.emailLanguage') || 'Preferred Language'}
              </label>
              <p className="preference-help">
                {t('emailPreferences.emailLanguageHelp') || 'Language for email notifications'}
              </p>
            </div>
            <select
              className="language-select"
              value={preferences.language}
              onChange={(e) => handleChange('language', e.target.value)}
              disabled={!preferences.email_enabled}
            >
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      <div className="email-preferences-actions">
        <button
          className="btn-test"
          onClick={handleSendTestEmail}
          disabled={sendingTest || !preferences.email_enabled}
        >
          {sendingTest ? (t('common.sending') || 'Sending...') : (t('emailPreferences.sendTestEmail') || 'Send Test Email')}
        </button>
        <button
          className="btn-save"
          onClick={handleSave}
          disabled={saving || !preferences.email_enabled}
        >
          {saving ? (t('common.saving') || 'Saving...') : (t('common.save') || 'Save Preferences')}
        </button>
      </div>
    </div>
  );
};

export default EmailPreferences;
