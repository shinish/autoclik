'use client';

import { useState, useEffect } from 'react';
import { CalendarClock, CheckCircle, XCircle, AlertCircle, Info, Edit, X, Plus } from 'lucide-react';
import { StatCard } from '@/components/Card';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    totalAutomations: 0,
    runs30d: 0,
    successRate: '0%',
    schedulesActive: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Check if user is admin from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'admin');
    setCurrentUser(user);

    fetchDashboardData();

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get user email from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userEmail = user.email || '';

      // Fetch dashboard data with user email parameter
      const url = userEmail ? `/api/dashboard?userEmail=${encodeURIComponent(userEmail)}` : '/api/dashboard';
      const res = await fetch(url);
      const data = await res.json();
      setStats(data.stats);
      setRecentActivity(data.recentActivity);
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getFormattedDateTime = () => {
    return currentTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const dismissNotification = (notificationId) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-5 w-5" style={{ color: '#DC2626' }} />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" style={{ color: '#F59E0B' }} />;
      case 'info':
        return <Info className="h-5 w-5" style={{ color: '#1B1B6F' }} />;
      default:
        return <Info className="h-5 w-5" style={{ color: '#1B1B6F' }} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--primary)' }}></div>
          <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-thin" style={{ color: 'var(--text)' }}>
          {getGreeting()}, {currentUser?.firstName} {currentUser?.lastName}
        </h1>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
          <CalendarClock className="h-4 w-4" />
          <span>{getFormattedDateTime()}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Automations" value={stats?.totalAutomations || 0} />
        <StatCard title="Runs (30d)" value={(stats?.runs30d || 0).toLocaleString()} />
        <StatCard
          title="Success Rate"
          value={<span style={{ color: 'var(--accent)' }}>{stats?.successRate || '0%'}</span>}
        />
        <StatCard title="Schedules Active" value={stats?.schedulesActive || 0} />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-light mb-4" style={{ color: 'var(--text)' }}>Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" icon={CalendarClock} onClick={() => router.push('/schedules')}>
            Create Schedule
          </Button>
        </div>
      </div>

      {/* Recent Activity and Notifications */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-md p-6 shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text)' }}>Recent Activity</h2>
          <div className="space-y-3">
            {!recentActivity || recentActivity.length === 0 ? (
              <div className="rounded-md p-8 text-center" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                <Info className="h-10 w-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--muted)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>No recent activity</p>
                <p className="text-xs mt-1.5" style={{ color: 'var(--muted)', opacity: 0.7 }}>Activities will appear here</p>
              </div>
            ) : (
              recentActivity.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-md p-4 transition-all hover:shadow-md cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Activity Icon */}
                    <div
                      className="flex-shrink-0 rounded-full p-2"
                      style={{
                        backgroundColor: activity.action === 'login' ? 'rgba(34, 197, 94, 0.1)' :
                                        activity.action === 'logout' ? 'rgba(239, 68, 68, 0.1)' :
                                        activity.action === 'created' ? 'rgba(59, 130, 246, 0.1)' :
                                        activity.action === 'updated' ? 'rgba(245, 158, 11, 0.1)' :
                                        'rgba(107, 114, 128, 0.1)'
                      }}
                    >
                      {activity.action === 'login' ? (
                        <CheckCircle className="h-4 w-4" style={{ color: '#22C55E' }} />
                      ) : activity.action === 'logout' ? (
                        <XCircle className="h-4 w-4" style={{ color: '#EF4444' }} />
                      ) : activity.action === 'created' ? (
                        <Plus className="h-4 w-4" style={{ color: '#3B82F6' }} />
                      ) : activity.action === 'updated' ? (
                        <Edit className="h-4 w-4" style={{ color: '#F59E0B' }} />
                      ) : (
                        <Info className="h-4 w-4" style={{ color: '#6B7280' }} />
                      )}
                    </div>

                    {/* Activity Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>{activity.time}</span>
                        {activity.entityType && (
                          <>
                            <span className="text-xs" style={{ color: 'var(--border)' }}>•</span>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: 'rgba(76, 18, 161, 0.1)',
                                color: 'var(--primary)'
                              }}
                            >
                              {activity.entityType}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-md p-6 shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-bold mb-5" style={{ color: 'var(--text)' }}>Notifications</h2>
          <div className="space-y-3">
            {!notifications || notifications.length === 0 ? (
              <div className="rounded-md p-8 text-center" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                <Info className="h-10 w-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--muted)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>No notifications</p>
                <p className="text-xs mt-1.5" style={{ color: 'var(--muted)', opacity: 0.7 }}>You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => (
              <div key={notification.id} className="rounded-md p-4 transition-all hover:shadow-md" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div className="flex gap-3 items-start">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{notification.title}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{notification.time}</p>
                  </div>
                  <button
                    onClick={() => dismissNotification(notification.id)}
                    className="rounded-lg p-1 hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--muted)' }}
                    title="Dismiss notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              ))
            )}
            <button
              onClick={() => router.push('/notifications')}
              className="w-full text-center text-sm font-semibold py-3 mt-2 rounded-md hover:opacity-90 transition-all"
              style={{ color: 'var(--primary)', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              View All
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
