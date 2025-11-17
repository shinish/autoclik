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

    // Public pages that don't require authentication
    const publicPages = ['/login', '/signup'];
    const isPublicPage = publicPages.includes(pathname);

    // If not authenticated and not on a public page, redirect to login
    if (!user && !isPublicPage) {
      router.replace('/login');
    }

    // If authenticated and on login or signup page, redirect to dashboard
    if (user && isPublicPage) {
      router.replace('/');
    }
  }, [pathname, router]);

  // Set up interval to check session timeout every minute
  useEffect(() => {
    // Public pages that don't need session timeout checks
    const publicPages = ['/login', '/signup'];
    if (publicPages.includes(pathname)) {
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
    const publicPages = ['/login', '/signup'];
    const isPublicPage = publicPages.includes(pathname);

    const handlePopState = () => {
      const user = localStorage.getItem('user');
      if (!user && !isPublicPage) {
        // User is not authenticated, force redirect to login
        window.location.href = '/login';
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Add history state to prevent back button
    if (!isPublicPage) {
      window.history.pushState(null, '', window.location.href);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname]);

  return <>{children}</>;
}
