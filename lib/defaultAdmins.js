/**
 * Default Admin Account Configuration
 *
 * These accounts are hardcoded and auto-created on system startup.
 * They have full admin access and can only be disabled if other admins exist.
 */

export const DEFAULT_ADMIN_ACCOUNTS = [
  {
    username: 'shinish',
    password: '3Mergency!',
    firstName: 'Shinish',
    lastName: 'Sasidharan',
  },
  {
    username: 'admin',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
  },
];

/**
 * Check if a username or email is a default admin account
 * @param {string} usernameOrEmail - Username or email to check
 * @returns {boolean} - True if it's a default admin account
 */
export function isDefaultAdmin(usernameOrEmail) {
  const defaultUsernames = DEFAULT_ADMIN_ACCOUNTS.map(admin => admin.username);
  return defaultUsernames.includes(usernameOrEmail?.toLowerCase());
}

/**
 * Get list of default admin usernames
 * @returns {string[]} - Array of default admin usernames
 */
export function getDefaultAdminUsernames() {
  return DEFAULT_ADMIN_ACCOUNTS.map(admin => admin.username);
}
