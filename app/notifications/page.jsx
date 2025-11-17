'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, AlertCircle, Info, X, Trash2 } from 'lucide-react';
import Button from '@/components/Button';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setNotifications(notifications.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });

      if (res.ok) {
        setNotifications(notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);

      await Promise.all(
        unreadIds.map(id =>
          fetch(`/api/notifications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ read: true }),
          })
        )
      );

      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete all notifications?')) return;

    try {
      await Promise.all(
        notifications.map(n =>
          fetch(`/api/notifications/${n.id}`, { method: 'DELETE' })
        )
      );

      setNotifications([]);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-6 w-6" style={{ color: '#ef4444' }} />;
      case 'warning':
        return <AlertCircle className="h-6 w-6" style={{ color: '#f59e0b' }} />;
      case 'success':
        return <CheckCircle className="h-6 w-6" style={{ color: 'var(--success)' }} />;
      case 'info':
      default:
        return <Info className="h-6 w-6" style={{ color: '#3b82f6' }} />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light" style={{ color: 'var(--text)' }}>
            Notifications
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All notifications read'}
          </p>
        </div>
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" icon={Trash2} onClick={handleClearAll}>
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
          Show:
        </span>
        {['all', 'unread', 'read'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
            style={{
              backgroundColor: filter === filterOption ? 'var(--primary)' : 'var(--surface)',
              color: filter === filterOption ? 'white' : 'var(--text)',
              border: `1px solid ${filter === filterOption ? 'var(--primary)' : 'var(--border)'}`
            }}
          >
            {filterOption}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-12">
          <p style={{ color: 'var(--muted)' }}>Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div
          className="text-center py-12 rounded-lg"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--muted)' }} />
          <p className="text-lg font-medium" style={{ color: 'var(--text)' }}>
            No notifications
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {filter === 'unread' ? "You're all caught up!" : 'When you receive notifications, they will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-lg p-6 transition-all hover:shadow-md relative group"
              style={{
                border: '1px solid var(--border)',
                backgroundColor: notification.read ? 'var(--surface)' : 'rgba(76, 18, 161, 0.05)',
                borderLeft: notification.read ? '1px solid var(--border)' : '4px solid var(--primary)'
              }}
            >
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                        {notification.title}
                      </h3>
                      {notification.message && (
                        <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
                          {notification.message}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs font-medium hover:underline"
                            style={{ color: 'var(--primary)' }}
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="flex-shrink-0 p-2 rounded-lg transition-all hover:bg-red-50"
                      style={{ color: '#ef4444' }}
                      title="Delete notification"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Unread Indicator */}
              {!notification.read && (
                <div
                  className="absolute top-6 right-6"
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)'
                  }}
                  title="Unread"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
