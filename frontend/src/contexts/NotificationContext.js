import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Alias for backward compatibility
export const useNotification = useNotifications;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch notifications from the API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/notifications');
      const notificationData = response.data.data || response.data;
      
      setNotifications(notificationData);
      
      // Calculate unread count
      const unread = notificationData.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err.response?.data?.message || 'Failed to fetch notifications');
      
      // Don't clear notifications on error, keep showing cached data
      if (notifications.length === 0) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [notifications.length]);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      
      // Update local state optimistically
      setNotifications(prev =>
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() } 
            : n
        )
      );
      
      // Decrease unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      setError(err.response?.data?.message || 'Failed to mark notification as read');
      
      // Revert optimistic update by refetching
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // Dismiss a notification
  const dismissNotification = useCallback(async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      
      // Find the notification to check if it was unread
      const dismissedNotification = notifications.find(n => n.id === notificationId);
      const wasUnread = dismissedNotification && !dismissedNotification.is_read;
      
      // Update local state optimistically
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Decrease unread count if the dismissed notification was unread
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
      setError(err.response?.data?.message || 'Failed to dismiss notification');
      
      // Revert optimistic update by refetching
      fetchNotifications();
    }
  }, [notifications, fetchNotifications]);

  // Manually trigger notification check
  const checkNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await api.post('/notifications/check');
      
      // Fetch updated notifications after check
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to check notifications:', err);
      setError(err.response?.data?.message || 'Failed to check notifications');
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      // Execute all mark as read requests in parallel
      await Promise.all(
        unreadNotifications.map(n => api.put(`/notifications/${n.id}/read`))
      );
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      setError(err.response?.data?.message || 'Failed to mark all as read');
      
      // Refetch to ensure consistency
      fetchNotifications();
    }
  }, [notifications, fetchNotifications]);

  // Dismiss all notifications
  const dismissAll = useCallback(async () => {
    try {
      // Dismiss all notifications
      await Promise.all(
        notifications.map(n => api.delete(`/notifications/${n.id}`))
      );
      
      // Clear local state
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to dismiss all notifications:', err);
      setError(err.response?.data?.message || 'Failed to dismiss all notifications');
      
      // Refetch to ensure consistency
      fetchNotifications();
    }
  }, [notifications, fetchNotifications]);

  // Get notifications by priority
  const getNotificationsByPriority = useCallback((priority) => {
    return notifications.filter(n => n.priority === priority);
  }, [notifications]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(n => n.notification_type === type);
  }, [notifications]);

  // Initial fetch on mount
  useEffect(() => {
    // Only fetch if user is authenticated (token exists)
    const token = localStorage.getItem('token');
    if (token) {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // Poll for new notifications every 60 seconds
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return; // Don't poll if not authenticated
    }

    // Set up polling interval
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 60000); // 60 seconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchNotifications]);

  // Toast notification methods for backward compatibility
  const showError = useCallback((message) => {
    console.error('Notification Error:', message);
    setError(message);
    // You can integrate with a toast library here (e.g., react-toastify, notistack)
  }, []);

  const showSuccess = useCallback((message) => {
    console.log('Notification Success:', message);
    // You can integrate with a toast library here (e.g., react-toastify, notistack)
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    dismissNotification,
    checkNotifications,
    markAllAsRead,
    dismissAll,
    getNotificationsByPriority,
    getNotificationsByType,
    // Backward compatibility methods
    showError,
    showSuccess,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
