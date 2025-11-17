'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Bell, Moon, Sun, CheckCircle, XCircle, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import Link from 'next/link';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();

    // Auto-refresh notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (id, event) => {
    event.stopPropagation();
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-5 w-5" style={{ color: '#ef4444' }} />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" style={{ color: '#f59e0b' }} />;
      case 'success':
        return <CheckCircle className="h-5 w-5" style={{ color: 'var(--success)' }} />;
      case 'info':
      default:
        return <Info className="h-5 w-5" style={{ color: '#3b82f6' }} />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return time.toLocaleDateString();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white dark:bg-slate-800 dark:border-slate-700 px-6 transition-colors" style={{ borderColor: 'var(--border)', backgroundColor: theme === 'dark' ? '#1e293b' : '#F3F4F6' }}>
      {/* Search */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Search catalog..."
            className="w-80 rounded-lg py-2 pl-10 pr-4 text-sm transition-colors"
            style={{
              border: '1px solid var(--border)',
              backgroundColor: theme === 'dark' ? '#0f172a' : 'white',
              color: 'var(--text)'
            }}
          />
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--muted)' }}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              className="absolute right-0 mt-2 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                width: '420px',
                maxHeight: '600px',
                top: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Notifications</h3>
                    {unreadCount > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {unreadCount} unread
                      </p>
                    )}
                  </div>
                  {unreadCount === 0 && notifications.length > 0 && (
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
                      All caught up!
                    </span>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto" style={{ maxHeight: '480px' }}>
                {notifications.length === 0 ? (
                  <div className="p-12 text-center" style={{ color: 'var(--muted)' }}>
                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No notifications yet</p>
                    <p className="text-xs mt-1 opacity-70">We'll notify you when something arrives</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {notifications.slice(0, 6).map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => {
                          if (!notification.read) {
                            handleMarkAsRead(notification.id, { stopPropagation: () => {} });
                          }
                        }}
                        className="px-5 py-4 hover:bg-opacity-50 transition-all cursor-pointer group relative"
                        style={{
                          backgroundColor: notification.read ? 'transparent' : 'rgba(76, 18, 161, 0.03)'
                        }}
                      >
                        {/* Unread indicator */}
                        {!notification.read && (
                          <div
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                            style={{ backgroundColor: 'var(--primary)' }}
                          />
                        )}

                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text)' }}>
                              {notification.title}
                            </p>
                            {notification.message && (
                              <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: 'var(--muted)' }}>
                                {notification.message}
                              </p>
                            )}
                            <p className="text-xs mt-2" style={{ color: 'var(--muted)', opacity: 0.7 }}>
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div
                  className="px-5 py-3 border-t"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
                >
                  <Link
                    href="/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="flex items-center justify-center gap-2 text-sm font-semibold hover:opacity-70 transition-opacity py-1"
                    style={{ color: 'var(--primary)' }}
                  >
                    View all notifications
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--muted)' }}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
      </div>
    </header>
  );
}
