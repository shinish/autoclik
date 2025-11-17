# Offline Installation Guide

This guide explains how to install the Automation Platform on Windows systems **without internet access**.

## Overview

Since the application requires npm packages (~730MB), we need to prepare an offline installation package on a machine with internet access, then transfer it to the target system.

---

## Part 1: Prepare Offline Package (Internet-Connected Machine)

### Prerequisites on Preparation Machine

- Windows, macOS, or Linux with internet access
- Node.js 18+ and npm installed
- Git (optional)
- 2GB free disk space

### Step 1: Download the Application

**Option A: Using Git**
```bash
git clone <repository-url>
cd automation-platform
```

**Option B: Download ZIP**
- Download the source code as ZIP
- Extract to a folder, e.g., `automation-platform`
- Open terminal/command prompt in that folder

### Step 2: Install All Dependencies

```bash
# Install all npm packages
npm install

# This will download ~730MB of dependencies to node_modules/
```

### Step 3: Generate Prisma Client

```bash
npm run prisma:generate
```

### Step 4: Build the Application (Optional - for Production)

```bash
# For production deployment, build the app
npm run build

# This creates optimized .next folder
```

### Step 5: Create Offline Package

#### On Windows:
```cmd
package-for-offline.bat
```

#### On macOS/Linux:
```bash
chmod +x package-for-offline.sh
./package-for-offline.sh
```

#### Manual Method (All Platforms):
```bash
# Create a clean package excluding unnecessary files
zip -r automation-platform-offline.zip . \
  -x "*.git*" \
  -x "*node_modules/.cache*" \
  -x "*.next/cache*" \
  -x "*.log" \
  -x "*.tmp"
```

### Step 6: Verify Package

The package should be approximately **800MB-1GB** and include:
- ✅ All source code files
- ✅ `node_modules/` directory (complete)
- ✅ `.next/` directory (if built)
- ✅ `package.json` and `package-lock.json`
- ✅ `prisma/` directory
- ✅ `.env.example`

### Step 7: Transfer Package

Transfer `automation-platform-offline.zip` to the target Windows machine using:

- **USB Drive** (most common for air-gapped systems)
- **Internal Network Share** (if available)
- **CD/DVD** (for very restricted environments)
- **Secure File Transfer** (if allowed)

---

## Part 2: Install on Target Machine (Offline)

### Prerequisites on Target Machine

- **Windows 10 or Windows Server 2016+**
- **Node.js 18+ installed** (see Node.js offline installation below)
- **No internet connection required**

### Step 1: Install Node.js (If Not Already Installed)

#### Download Node.js Installer (on internet-connected machine):

1. Visit: https://nodejs.org/
2. Download Windows Installer (.msi) for Node.js 18 LTS or higher:
   - For 64-bit: `node-v18.x.x-x64.msi`
   - For 32-bit: `node-v18.x.x-x86.msi`

#### Install Node.js on Target Machine:

1. Transfer the `.msi` file to target machine
2. Double-click the installer
3. Follow the installation wizard
4. Verify installation:
   ```cmd
   node --version
   npm --version
   ```

### Step 2: Extract Application Package

```cmd
# Create installation directory
mkdir C:\automation-platform

# Extract the ZIP file to this directory
# Using Windows Explorer: Right-click > Extract All
# Or using PowerShell:
Expand-Archive -Path automation-platform-offline.zip -DestinationPath C:\automation-platform
```

### Step 3: Verify Extraction

```cmd
cd C:\automation-platform
dir

# You should see:
# - node_modules\     (large folder with all dependencies)
# - app\
# - components\
# - lib\
# - prisma\
# - package.json
# - next.config.js
# - etc.
```

### Step 4: Configure Environment

```cmd
# Copy example environment file
copy .env.example .env

# Edit .env file with Notepad
notepad .env
```

**Configure these settings in `.env`:**

```env
# Database (SQLite - already configured, no changes needed)
DATABASE_URL="file:./prisma/dev.db"

# AWX Configuration (Optional - can also configure via UI later)
AWX_BASE_URL=https://your-awx-server.com/api/v2
AWX_TOKEN=your_awx_token_here
```

### Step 5: Initialize Database

```cmd
# Generate Prisma client (should already be generated, but just in case)
npm run prisma:generate

# Run database migrations to create tables
npm run prisma:migrate
```

**Note**: If `prisma:migrate` fails because it tries to create a new migration, use:

```cmd
# Apply existing migrations without creating new ones
npx prisma migrate deploy
```

### Step 6: Seed Database (Optional)

```cmd
# Add sample data for testing (optional)
npm run prisma:seed
```

### Step 7: Start the Application

#### Development Mode:
```cmd
start.bat
# Or manually:
npm run dev
```

#### Production Mode:
```cmd
npm run build
npm start
```

### Step 8: Access the Application

Open a web browser and navigate to:
```
http://localhost:3000
```

---

## Troubleshooting Offline Installation

### Issue: "npm command not found"

**Solution**: Node.js is not installed or not in PATH

```cmd
# Check if Node.js is installed
where node
where npm

# If not found, install Node.js (see Step 1)
```

### Issue: "Cannot find module" errors

**Solution**: node_modules directory is incomplete or missing

```cmd
# Verify node_modules exists and is populated
dir node_modules

# If empty or missing, you need to re-package on the prep machine
# ensuring node_modules is fully included in the ZIP
```

### Issue: Prisma Client errors

**Solution**: Prisma Client not generated for Windows

```cmd
# Regenerate Prisma Client for current platform
npm run prisma:generate

# This generates platform-specific binaries
```

**Note**: If Prisma was generated on macOS/Linux, it needs to be regenerated on Windows. Include this in your offline setup script.

### Issue: Database migration errors

**Solution**: Use deploy instead of migrate

```cmd
# Use deploy for existing migrations
npx prisma migrate deploy

# This applies existing migrations without trying to create new ones
```

### Issue: Port 3000 already in use

**Solution**: Kill the process or use a different port

```cmd
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace <PID> with actual process ID)
taskkill /PID <PID> /F

# Or change the port
set PORT=3001
npm run dev
```

### Issue: Permission denied errors

**Solution**: Run as Administrator

```cmd
# Right-click Command Prompt > Run as Administrator
```

---

## Automated Offline Setup Script

### Create `setup-offline.bat`

```batch
@echo off
echo ========================================
echo Automation Platform - Offline Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js 18+ first.
    echo.
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo npm version:
npm --version
echo.

REM Create .env if it doesn't exist
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo ✓ .env file created
) else (
    echo ✓ .env file already exists
)
echo.

REM Regenerate Prisma Client for current platform
echo Generating Prisma Client...
call npm run prisma:generate
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate Prisma Client
    pause
    exit /b 1
)
echo ✓ Prisma Client generated
echo.

REM Initialize database
echo Initializing database...
if exist prisma\dev.db (
    echo Database already exists, skipping creation
) else (
    echo Creating database and running migrations...
    call npx prisma migrate deploy
    if %ERRORLEVEL% NEQ 0 (
        echo WARNING: Migration failed, trying alternative method...
        call npx prisma db push
    )
)
echo ✓ Database initialized
echo.

REM Optional: Seed database
echo.
set /p SEED="Seed database with sample data? (y/n): "
if /i "%SEED%"=="y" (
    echo Seeding database...
    call npm run prisma:seed
    echo ✓ Database seeded
)
echo.

echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo To start the application, run:
echo   start.bat
echo.
echo The application will be available at:
echo   http://localhost:3000
echo.
pause
```

---

## Updating Offline Installation

### To update an existing offline installation:

1. **Backup current installation**:
   ```cmd
   xcopy C:\automation-platform C:\automation-platform-backup /E /I /H

   # Backup database specifically
   copy C:\automation-platform\prisma\dev.db C:\automation-platform\prisma\dev.db.backup
   ```

2. **Prepare new package** (on internet-connected machine):
   - Follow Part 1 with updated source code

3. **Stop application** on target machine

4. **Extract new package** to a temporary location:
   ```cmd
   Expand-Archive -Path automation-platform-offline-new.zip -DestinationPath C:\automation-platform-new
   ```

5. **Copy database and config** from old installation:
   ```cmd
   copy C:\automation-platform\prisma\dev.db C:\automation-platform-new\prisma\dev.db
   copy C:\automation-platform\.env C:\automation-platform-new\.env
   ```

6. **Run migrations** (if database schema changed):
   ```cmd
   cd C:\automation-platform-new
   npx prisma migrate deploy
   ```

7. **Replace old installation**:
   ```cmd
   # Delete old installation
   rmdir /S /Q C:\automation-platform

   # Rename new installation
   move C:\automation-platform-new C:\automation-platform
   ```

8. **Start application**:
   ```cmd
   cd C:\automation-platform
   start.bat
   ```

---

## Offline Package Checklist

Before transferring, verify your package includes:

- [ ] `node_modules/` directory (complete, ~730MB)
- [ ] `app/` directory (all source files)
- [ ] `components/` directory
- [ ] `lib/` directory
- [ ] `prisma/` directory (schema and migrations)
- [ ] `public/` directory (static assets)
- [ ] `package.json` and `package-lock.json`
- [ ] `next.config.js`
- [ ] `.env.example`
- [ ] `setup-offline.bat`
- [ ] `start.bat`
- [ ] `README.md` and documentation files
- [ ] `.next/` directory (if pre-built for production)

---

## Network-Restricted Environments

### For environments with some network access but restrictions:

1. **Use a local npm registry**:
   - Set up Verdaccio or Nexus Repository
   - Cache packages locally
   - Point npm to local registry:
     ```cmd
     npm config set registry http://your-local-registry:4873
     ```

2. **Use npm cache**:
   ```cmd
   # Save npm cache on prep machine
   npm cache verify
   # Copy %APPDATA%\npm-cache to target machine
   ```

3. **Use shrinkwrap**:
   ```cmd
   npm shrinkwrap
   # Creates npm-shrinkwrap.json with exact versions
   ```

---

## Security Considerations for Offline Environments

1. **Verify package integrity**:
   ```cmd
   # Generate checksum on prep machine
   certutil -hashfile automation-platform-offline.zip SHA256 > checksum.txt

   # Verify on target machine
   certutil -hashfile automation-platform-offline.zip SHA256
   # Compare with checksum.txt
   ```

2. **Scan for malware** before transferring

3. **Keep transfer media secure** (encrypt USB drives)

4. **Document transfer chain** for audit purposes

5. **Version control** - tag packages with version numbers:
   ```
   automation-platform-v1.0.0-offline.zip
   ```

---

## Support

For issues specific to offline installation:
1. Check logs in Command Prompt output
2. Verify all files extracted correctly
3. Ensure Node.js version compatibility
4. Check Windows Event Viewer for system errors

---

## Summary

**Preparation** (Internet Machine):
```
1. Download source code
2. npm install
3. npm run build (optional)
4. Create ZIP package
5. Transfer to target machine
```

**Installation** (Target Machine):
```
1. Install Node.js (one-time)
2. Extract package
3. Configure .env
4. Run setup-offline.bat
5. Start application with start.bat
```

**Result**: Fully functional automation platform running entirely offline with SQLite database!

---

## Author

**Shinish Sasidharan**

---

**Autoclik v1.0 - Automation Platform**
