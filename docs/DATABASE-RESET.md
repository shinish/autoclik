# Database Reset Scripts

This folder contains scripts to completely delete and recreate the database with fresh migrations and seed data.

## Available Scripts

### Option 1: PowerShell (Windows/Cross-platform)
```powershell
.\reset-db.ps1
```

### Option 2: Batch Script (Windows)
```cmd
reset-db.bat
```

### Option 3: Shell Script (Mac/Linux)
```bash
./reset-db.sh
```

### Option 4: NPM Script (Cross-platform)
```bash
npm run db:reset
```

## What These Scripts Do

1. **Delete existing database**
   - Removes `prisma/dev.db`
   - Removes `prisma/dev.db-journal` (if exists)

2. **Run Prisma migrations**
   - Applies all migrations from scratch
   - Creates fresh database schema

3. **Seed the database**
   - Creates default admin user (if no users exist)
   - Creates system settings
   - Populates initial data

## Default Admin Credentials

After running any reset script, you can login with:

**Default Admin:**
- **Username:** `admin`
- **Password:** `admin123`

**Alternative Admin:**
- **Username:** `shinish`
- **Password:** `3Mergency!`

## Warning

⚠️ **These scripts will DELETE ALL DATA in your database!**

Only use these scripts in development environments. Never run on production databases.

## Troubleshooting

If you encounter permission errors:

**On Mac/Linux:**
```bash
chmod +x reset-db.sh
```

**On Windows PowerShell:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Author

**Shinish Sasidharan**

---

**Autoclik v1.0 - Automation Platform**
