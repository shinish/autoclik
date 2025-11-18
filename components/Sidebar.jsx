'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Zap,
  Clock,
  FileText,
  Settings,
  User,
  ChevronUp,
  LogOut,
  Activity,
  BarChart3,
  Bell
} from 'lucide-react';
import FlowerLogo from './FlowerLogo';
import { getCurrentUser, forceLogout } from '@/lib/auth';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'user'] },
  { name: 'Schedules', href: '/schedules', icon: Clock, roles: ['admin', 'user'] },
  { name: 'Activity', href: '/activity', icon: Activity, roles: ['admin'] },
  { name: 'Audit Report', href: '/audit', icon: BarChart3, roles: ['admin'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin', 'user'] },
  { name: 'Notifications', href: '/notifications', icon: Bell, showBadge: true, roles: ['admin', 'user'] },
];

const bottomNavigation = [
  { name: 'Documentation', href: '/documentation', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Get user from localStorage and validate
    const validUser = getCurrentUser();

    if (validUser) {
      setUser(validUser);
    } else {
      // Check if there was invalid user data
      const userData = localStorage.getItem('user');
      if (userData) {
        // Invalid user data detected - force logout
        console.error('Invalid user session detected (invalid ID format). Forcing logout...');
        forceLogout();
      } else {
        // No user data - redirect to login
        router.push('/login');
      }
      return;
    }

    // Fetch notifications to get unread count
    fetchNotifications();

    // Poll for notification updates every 5 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(interval);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      // Ensure data is an array before filtering
      if (Array.isArray(data)) {
        const unread = data.filter(n => !n.read).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setUnreadCount(0);
    }
  };

  const handleLogout = async () => {
    try {
      // Get user data before clearing
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);

        // Log logout activity
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            department: user.department,
            location: user.location,
            role: user.role
          })
        });
      }
    } catch (error) {
      console.error('Error logging logout:', error);
      // Continue with logout even if logging fails
    }

    // Clear all localStorage data
    localStorage.clear();

    // Use replace instead of push to prevent back navigation
    router.replace('/login');

    // Force page reload to clear any cached state
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen w-64 flex-col transition-colors" style={{ backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)' }}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-center px-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-full h-14">
          <FlowerLogo className="w-full h-full" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 flex flex-col">
        <div className="space-y-1">
          {navigation
            .filter((item) => !item.roles || item.roles.includes(user?.role || 'user'))
            .map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:opacity-80 relative"
                  style={
                    isActive
                      ? { backgroundColor: 'var(--primary)', color: 'white' }
                      : { color: 'var(--text)' }
                  }
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                  {item.showBadge && unreadCount > 0 && (
                    <span
                      className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full"
                      style={{ backgroundColor: '#ef4444', color: 'white', minWidth: '20px' }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
        </div>

        {/* Bottom Navigation Section */}
        <div className="mt-auto pt-4 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:opacity-80"
                style={
                  isActive
                    ? { backgroundColor: 'var(--primary)', color: 'white' }
                    : { color: 'var(--text)' }
                }
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 relative transition-colors" style={{ borderTop: '1px solid var(--border)' }} ref={dropdownRef}>
        {/* Dropdown Menu */}
        {showDropdown && (
          <div
            className="absolute bottom-full left-4 right-4 mb-2 rounded-lg shadow-lg overflow-hidden"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-3 text-sm hover:opacity-80 transition-opacity"
              style={{ color: 'var(--text)' }}
              onClick={() => setShowDropdown(false)}
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:opacity-80 transition-opacity"
              style={{ color: '#ef4444' }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}

        {/* Profile Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center gap-3 rounded-lg p-2 -m-2 transition-colors hover:opacity-80"
        >
          {user?.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt="Profile"
              className="h-10 w-10 rounded-full object-cover flex-shrink-0"
              style={{ border: '2px solid var(--border)' }}
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-200 flex-shrink-0">
              <User className="h-5 w-5 text-orange-700" />
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.name || 'Shinish Sasidharan'}
            </p>
            <p className="text-xs truncate capitalize" style={{ color: 'var(--muted)' }}>
              {user?.role || 'User'}
            </p>
          </div>
          <ChevronUp
            className={`h-4 w-4 transition-transform flex-shrink-0 ${
              showDropdown ? 'rotate-180' : ''
            }`}
            style={{ color: 'var(--muted)' }}
          />
        </button>
      </div>
    </div>
  );
}
