# Quick Start Guide

## Access the Application

**URL:** http://localhost:3000

## Default Login Credentials

```
Username: admin
Password: admin123
```

## Alternative Admin Account

```
Username: shinish
Password: 3Mergency!
```

---

## First Time Setup

### 1. Start the Application
```bash
npm run dev
```

### 2. Login
- Open http://localhost:3000/login
- Enter username: `admin`
- Enter password: `admin123`
- Click "Sign In"

### 3. You're In!
You now have full admin access to:
- Dashboard
- Automation Catalog
- User Management
- Run History
- Schedules
- Settings

---

## Account Features

### Admin Account (`admin`)
- ✓ Auto-created on first startup
- ✓ Auto-approved (no manual approval needed)
- ✓ Full admin privileges
- ✓ Cannot be disabled unless another admin exists
- ✓ Protected from accidental deletion

### Both Default Accounts
- `admin` / `admin123`
- `shinish` / `3Mergency!`

**Both accounts:**
- Have full admin access
- Are auto-approved
- Are protected from deletion (if last admin)
- Should be changed in production!

---

## Security Warning

⚠️ **IMPORTANT:** Change these default passwords immediately in production!

### How to Change Password:
1. Login with default credentials
2. Go to Users → Find your account
3. Click "Reset Password"
4. Enter new password
5. Confirm and save

---

## Quick Verification

Run this command to verify admin account:
```bash
node scripts/quick-test-admin.js
```

**Expected Output:**
```
✅ Admin account is ready to use!

Login at: http://localhost:3000/login
  Username: admin
  Password: admin123
```

---

## Troubleshooting

### Can't Login?

1. **Verify account exists:**
   ```bash
   node scripts/check-admin.js
   ```

2. **Test password:**
   ```bash
   node scripts/test-admin-login.js
   ```

3. **Reset database:**
   ```bash
   npm run db:reset
   ```

### Account Not Approved?

The default admin accounts are auto-approved. If you see "pending approval" error:
```bash
npm run prisma:seed
```

This will ensure both accounts are approved and enabled.

---

## Next Steps

After logging in:

1. **Change Default Password**
2. **Create Additional Admin Users** (if needed)
3. **Configure AWX Integration** (Settings → API)
4. **Import Automations** (Catalog → Import)
5. **Invite Team Members** (Users → New User)

---

## Support

For issues or questions:
- Check `/docs` folder for detailed documentation
- Run `node scripts/check-admin.js` for diagnostics
- Review logs in the console

---

**Generated:** November 2025
**Version:** 1.0.0
