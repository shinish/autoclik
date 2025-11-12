/**
 * Authentication utilities for client-side auth management
 */

/**
 * Validate if a string is a valid UUID format
 * @param {string} str - String to validate
 * @returns {boolean} - True if valid UUID
 */
export function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Get user from localStorage and validate
 * @returns {object|null} - User object or null if invalid
 */
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;

  try {
    const userData = localStorage.getItem('user');
    if (!userData) return null;

    const user = JSON.parse(userData);

    // Validate user object has required fields
    if (!user || !user.id || !user.email) {
      console.warn('Invalid user object in localStorage');
      return null;
    }

    // Validate user ID is a proper UUID
    if (!isValidUUID(user.id)) {
      console.warn('Invalid user ID format (expected UUID):', user.id);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
}

/**
 * Check if user is authenticated with valid session
 * If user data is invalid, clears localStorage and returns false
 * @returns {boolean} - True if authenticated with valid data
 */
export function isAuthenticated() {
  const user = getCurrentUser();
  return user !== null;
}

/**
 * Force logout by clearing localStorage
 * @param {string} redirectTo - Optional redirect path (defaults to /login)
 */
export function forceLogout(redirectTo = '/login') {
  if (typeof window === 'undefined') return;

  console.log('Forcing logout - clearing invalid session data');
  localStorage.clear();

  // Redirect to login page
  window.location.href = redirectTo;
}

/**
 * Validate current session and force logout if invalid
 * Call this on app initialization or page load
 * @returns {boolean} - True if session is valid
 */
export function validateSession() {
  if (typeof window === 'undefined') return true;

  const user = getCurrentUser();

  if (!user) {
    // Only force logout if there was user data (but invalid)
    const userData = localStorage.getItem('user');
    if (userData) {
      console.error('Invalid user session detected - forcing logout');
      forceLogout();
      return false;
    }
  }

  return true;
}

/**
 * Update user data in localStorage
 * @param {object} userData - User data to store
 * @returns {boolean} - True if successful
 */
export function updateUser(userData) {
  if (typeof window === 'undefined') return false;

  try {
    // Validate before storing
    if (!userData || !userData.id || !userData.email) {
      console.error('Invalid user data - missing required fields');
      return false;
    }

    if (!isValidUUID(userData.id)) {
      console.error('Invalid user ID format - expected UUID');
      return false;
    }

    localStorage.setItem('user', JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('Error updating user in localStorage:', error);
    return false;
  }
}
