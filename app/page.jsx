'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Mail, CalendarClock, CheckCircle, XCircle, AlertCircle, Info, Play, Edit, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { StatCard } from '@/components/Card';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalAutomations: 0,
    runs30d: 0,
    successRate: '0%',
    schedulesActive: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [pinnedAutomations, setPinnedAutomations] = useState([]);
  const [activityScrollPosition, setActivityScrollPosition] = useState(0);
  const [showActivityNav, setShowActivityNav] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check if user is admin from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'admin');

    fetchDashboardData();
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
      setPinnedAutomations(data.pinnedAutomations);
      setShowWelcome(data.firstTimeSetup || false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissNotification = (notificationId) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const dismissWelcome = async () => {
    try {
      // Update the first_time_setup setting to false
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'first_time_setup',
          value: 'false',
        }),
      });
      setShowWelcome(false);
    } catch (error) {
      console.error('Error dismissing welcome message:', error);
    }
  };

  const scrollActivity = (direction) => {
    const container = document.getElementById('activity-slider');
    if (!container) return;

    const scrollAmount = 300; // pixels to scroll
    const newPosition = direction === 'left'
      ? Math.max(0, activityScrollPosition - scrollAmount)
      : activityScrollPosition + scrollAmount;

    container.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
    setActivityScrollPosition(newPosition);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5" style={{ color: 'var(--fis-green)' }} />;
      case 'failed':
        return <XCircle className="h-5 w-5" style={{ color: '#DC2626' }} />;
      default:
        return <Info className="h-5 w-5" style={{ color: '#1B1B6F' }} />;
    }
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#4C12A1' }}></div>
          <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-light" style={{ color: 'var(--text)' }}>Dashboard Overview</h1>

      {/* Welcome Message for First Time Setup */}
      {showWelcome && (
        <div className="rounded-lg p-6" style={{ backgroundColor: '#EBF5FF', border: '1px solid #3B82F6' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2" style={{ color: '#1E40AF' }}>
                Welcome to the Automation Platform!
              </h2>
              <p className="text-sm mb-4" style={{ color: '#1E40AF' }}>
                You're all set with your admin account. Get started by:
              </p>
              <ul className="space-y-2 text-sm" style={{ color: '#1E40AF' }}>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>Adding your first automation to the catalog</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>Configuring AWX connection in Settings</span>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>Creating additional user accounts</span>
                </li>
              </ul>
              <div className="mt-4 flex gap-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    dismissWelcome();
                    router.push('/catalog/new');
                  }}
                >
                  Add First Automation
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    dismissWelcome();
                    router.push('/settings');
                  }}
                >
                  Go to Settings
                </Button>
              </div>
            </div>
            <button
              onClick={dismissWelcome}
              className="ml-4 p-1 rounded hover:bg-blue-200 transition-colors"
              aria-label="Dismiss welcome message"
            >
              <X className="h-5 w-5" style={{ color: '#1E40AF' }} />
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Automations" value={stats?.totalAutomations || 0} />
        <StatCard title="Runs (30d)" value={(stats?.runs30d || 0).toLocaleString()} />
        <StatCard
          title="Success Rate"
          value={<span style={{ color: 'var(--fis-green)' }}>{stats?.successRate || '0%'}</span>}
        />
        <StatCard title="Schedules Active" value={stats?.schedulesActive || 0} />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-light mb-4" style={{ color: 'var(--text)' }}>Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {isAdmin && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => router.push('/catalog/new')}
            >
              Add New Catalog Item
            </Button>
          )}
          <Button variant="outline" icon={Search} onClick={() => router.push('/catalog')}>
            Search Catalog
          </Button>
          <Button variant="outline" icon={Mail} onClick={() => router.push('/catalog')}>
            My Drafts
          </Button>
          <Button variant="outline" icon={CalendarClock} onClick={() => router.push('/schedules')}>
            Create Schedule
          </Button>
        </div>
      </div>

      {/* Recent Activity and Notifications */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-light mb-4" style={{ color: 'var(--text)' }}>Recent Activity</h2>
          <div
            className="relative group"
            onMouseEnter={() => setShowActivityNav(true)}
            onMouseLeave={() => setShowActivityNav(false)}
          >
            {/* Navigation Buttons */}
            {recentActivity && recentActivity.length > 3 && (
              <>
                <button
                  onClick={() => scrollActivity('left')}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-lg transition-opacity ${
                    showActivityNav ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <ChevronLeft className="h-4 w-4" style={{ color: 'var(--text)' }} />
                </button>
                <button
                  onClick={() => scrollActivity('right')}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-lg transition-opacity ${
                    showActivityNav ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <ChevronRight className="h-4 w-4" style={{ color: 'var(--text)' }} />
                </button>
              </>
            )}

            {/* Slider Container */}
            <div
              id="activity-slider"
              className="flex gap-4 overflow-x-hidden scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style jsx>{`
                #activity-slider::-webkit-scrollbar {
                  display: none;
                }
              `}</style>

              {!recentActivity || recentActivity.length === 0 ? (
                <div className="w-full rounded-lg p-4 text-center transition-colors" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex-shrink-0 rounded-lg p-4 transition-colors hover:shadow-md"
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      minWidth: '280px',
                      maxWidth: '280px'
                    }}
                  >
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-medium line-clamp-2" style={{ color: 'var(--text)' }}>
                        {activity.description}
                      </p>
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>{activity.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h2 className="text-lg font-light mb-4" style={{ color: 'var(--text)' }}>Notifications</h2>
          <div className="space-y-3">
            {!notifications || notifications.length === 0 ? (
              <div className="rounded-lg p-4 transition-colors text-center" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
              <div key={notification.id} className="rounded-lg p-4 transition-colors" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
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
              className="w-full text-center text-sm font-medium py-2 hover:opacity-80 transition-opacity"
              style={{ color: '#4C12A1' }}
            >
              View All
            </button>
          </div>
        </div>
      </div>

      {/* Pinned Automations */}
      <div>
        <h2 className="text-lg font-light mb-4" style={{ color: 'var(--text)' }}>Pinned Automations</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {!pinnedAutomations || pinnedAutomations.length === 0 ? (
            <div className="col-span-2 rounded-lg p-6 text-center transition-colors" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>No pinned automations</p>
            </div>
          ) : (
            pinnedAutomations.map((automation) => (
            <div key={automation.id} className="rounded-lg p-6 transition-colors" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{automation.name}</h3>
              <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>{automation.description}</p>
              <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>{automation.runs} runs</p>
              <div className="mt-4 flex gap-2">
                <Button variant="primary" size="sm" icon={Play} onClick={() => router.push(`/catalog/${automation.id}`)}>
                  Run
                </Button>
                <Button variant="ghost" size="sm" icon={Edit} onClick={() => router.push(`/catalog/${automation.id}`)}>
                  Edit
                </Button>
              </div>
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
