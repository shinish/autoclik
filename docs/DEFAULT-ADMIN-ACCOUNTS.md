# Default Admin Accounts

## Overview

The system has two hardcoded default admin accounts that are automatically created and maintained:

| Username | Password     | Full Name           |
|----------|--------------|---------------------|
| `admin`  | `admin123`   | Admin User          |
| `shinish`| `3Mergency!` | Shinish Sasidharan  |

## Features

### Auto-Creation on Startup
- Both accounts are automatically created when the database is seeded
- If they don't exist, they are created with full admin privileges
- Runs every time `npm run prisma:seed` is executed

### Auto-Approval
- Both accounts are always approved (`approved: true`)
- Set to `approvedBy: 'system'`
- Approval timestamp is automatically set
- No manual approval required

### Full Admin Access
- Both accounts have `role: 'admin'`
- Full access to all features and settings
- Can manage users, automations, schedules, etc.

### Protection Mechanism

These default admin accounts have special protection:

#### Cannot Disable Unless Other Admins Exist
- You **cannot** disable a default admin if it's the last active admin
- System requires at least one other active admin before allowing disable
- Prevents system lockout scenarios

#### Cannot Delete Unless Other Admins Exist
- You **cannot** delete a default admin if it's the last active admin
- System checks for other active admins before allowing deletion
- Ensures system always has admin access

#### Cannot Demote Unless Other Admins Exist
- You **cannot** change role from 'admin' to 'user' if it's the last active admin
- Role changes are blocked if no other admins exist

### Auto-Maintenance

The seed script automatically maintains these accounts:

```javascript
// If accounts exist but are disabled/locked/demoted
// They are automatically restored to proper state:
- approved: true
- enabled: true
- locked: false
- role: 'admin'
- approvedBy: 'system'
```

## Security Considerations

⚠️ **Important**: Change these default passwords in production!

1. **After Initial Setup:**
   - Login with one of the default accounts
   - Create a new admin account with a strong password
   - Change the passwords of the default accounts
   - Or disable the default accounts (if another admin exists)

2. **Best Practices:**
   - Use strong, unique passwords
   - Enable 2FA (if available)
   - Regularly rotate admin passwords
   - Monitor admin account activity

## API Protection

### PUT /api/users/[id]
When updating a default admin account:
- Checks if trying to disable, lock, or demote
- Counts other active admins (excluding current)
- Returns 403 error if no other admins exist

**Error Message:**
```json
{
  "error": "Cannot disable, lock, or demote the last default admin account. At least one other admin must exist."
}
```

### DELETE /api/users/[id]
When deleting a default admin account:
- Checks if it's a default admin
- Counts other active admins (excluding current)
- Returns 403 error if no other admins exist

**Error Message:**
```json
{
  "error": "Cannot delete the last default admin account. At least one other admin must exist."
}
```

## Configuration Files

### Default Admin List
Located at: `lib/defaultAdmins.js`

```javascript
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
```

### Helper Functions
- `isDefaultAdmin(usernameOrEmail)` - Check if user is default admin
- `getDefaultAdminUsernames()` - Get list of default admin usernames

## Testing Admin Accounts

Run the test script to verify both accounts:

```bash
node scripts/test-admin-login.js
```

**Expected Output:**
```
Testing admin account logins...

Testing: shinish
  Username: shinish
  Name: Shinish Sasidharan
  Role: admin
  Approved: true
  Enabled: true
  Password Valid: ✓ YES

Testing: admin
  Username: admin
  Name: Admin User
  Role: admin
  Approved: true
  Enabled: true
  Password Valid: ✓ YES
```

## Troubleshooting

### Admin Account Not Found
Run the seed script to create missing accounts:
```bash
npm run prisma:seed
```

### Admin Account Disabled
The seed script will automatically re-enable default admin accounts:
```bash
npm run prisma:seed
```

### Can't Login with Default Credentials
1. Verify accounts exist: `node scripts/check-admin.js`
2. Test passwords: `node scripts/test-admin-login.js`
3. Reset password if needed: `node scripts/reset-admin-password.js`

## Related Files

- `/prisma/seed.js` - Auto-creation and maintenance logic
- `/lib/defaultAdmins.js` - Configuration and helper functions
- `/app/api/users/[id]/route.js` - API protection logic
- `/scripts/test-admin-login.js` - Testing script
- `/scripts/check-admin.js` - Verification script
