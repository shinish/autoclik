'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  // Session timeout: 60 minutes in milliseconds
  const SESSION_TIMEOUT = 60 * 60 * 1000; // 60 minutes

  // Function to check session timeout
  const checkSessionTimeout = () => {
    const user = localStorage.getItem('user');
    const loginTimestamp = localStorage.getItem('loginTimestamp');

    if (user && loginTimestamp) {
      const currentTime = Date.now();
      const loginTime = parseInt(loginTimestamp, 10);
      const elapsedTime = currentTime - loginTime;

      // If session has expired (more than 60 minutes)
      if (elapsedTime > SESSION_TIMEOUT) {
        console.log('Session expired after 60 minutes. Logging out...');
        // Clear all session data
        localStorage.removeItem('user');
        localStorage.removeItem('loginTimestamp');
        // Redirect to login page
        router.replace('/login');
        return true; // Session expired
      }
    }
    return false; // Session still valid
  };

  useEffect(() => {
    // Check if user is authenticated
    const user = localStorage.getItem('user');

    // Check session timeout first
    const isExpired = checkSessionTimeout();
    if (isExpired) {
      return; // Already redirected to login
    }

    // If not authenticated and not on login page, redirect to login
    if (!user && pathname !== '/login') {
      router.replace('/login');
    }

    // If authenticated and on login page, redirect to dashboard
    if (user && pathname === '/login') {
      router.replace('/');
    }
  }, [pathname, router]);

  // Set up interval to check session timeout every minute
  useEffect(() => {
    // Only check if user is logged in and not on login page
    if (pathname === '/login') {
      return;
    }

    // Check immediately on mount
    checkSessionTimeout();

    // Then check every minute
    const intervalId = setInterval(() => {
      checkSessionTimeout();
    }, 60 * 1000); // Check every 1 minute

    return () => {
      clearInterval(intervalId);
    };
  }, [pathname, router]);

  // Prevent browser back button after logout
  useEffect(() => {
    const handlePopState = () => {
      const user = localStorage.getItem('user');
      if (!user && pathname !== '/login') {
        // User is not authenticated, force redirect to login
        window.location.href = '/login';
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Add history state to prevent back button
    if (pathname !== '/login') {
      window.history.pushState(null, '', window.location.href);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname]);

  return <>{children}</>;
}
