# Windows Deployment Guide

This guide explains how to deploy the Automation Platform on Windows systems, especially in environments with limited internet access.

## System Requirements

- **Operating System**: Windows 10 or Windows Server 2016+
- **Node.js**: Version 18.x or higher (LTS recommended)
- **RAM**: Minimum 2GB (4GB recommended)
- **Disk Space**: 1.5GB (1GB for dependencies + 500MB for application and database)
- **Network**: Internet access for initial setup (or offline installation package)

## Pre-Installation Checklist

- [ ] Node.js 18+ installed on target system
- [ ] npm package manager available (comes with Node.js)
- [ ] User has write permissions to installation directory
- [ ] Firewall configured to allow port 3000 (or your chosen port)
- [ ] AWX/Ansible Tower credentials available (optional)

---

## Installation Methods

### Method 1: Online Installation (Direct Internet Access)

If the target Windows machine has internet access:

1. **Copy the application**
   ```cmd
   # Extract the application files to a directory, e.g.:
   C:\automation-platform\
   ```

2. **Run the setup script**
   ```cmd
   cd C:\automation-platform
   setup.bat
   ```

3. **The script will automatically**:
   - Install all npm dependencies
   - Generate Prisma client
   - Set up the database
   - Create initial configuration files

4. **Start the application**
   ```cmd
   start.bat
   ```

### Method 2: Offline Installation (No Internet Access)

For Windows machines with limited or no internet access:

#### Step A: Prepare Installation Package (On Internet-Connected Machine)

1. **On a machine with internet access**, clone/download the project:
   ```cmd
   git clone <repository-url>
   cd automation-platform
   ```

2. **Install dependencies**:
   ```cmd
   npm install
   ```

3. **Create portable package**:
   ```cmd
   package-for-offline.bat
   ```

   This creates: `automation-platform-offline.zip`

4. **Transfer the ZIP file** to the target Windows machine via:
   - USB drive
   - Internal network share
   - CD/DVD
   - Secure file transfer

#### Step B: Install on Target Machine (Offline)

1. **Extract the package**:
   ```cmd
   # Extract automation-platform-offline.zip to:
   C:\automation-platform\
   ```

2. **Run offline setup**:
   ```cmd
   cd C:\automation-platform
   setup-offline.bat
   ```

3. **Start the application**:
   ```cmd
   start.bat
   ```

---

## Configuration

### 1. Database Configuration (SQLite)

The application uses SQLite, a file-based database that requires no separate database server.

**Database Location**: `C:\automation-platform\prisma\dev.db`

**Benefits for Windows Deployment**:
- ✅ No database server installation required
- ✅ Portable - entire database is a single file
- ✅ Easy backup - just copy the `.db` file
- ✅ Works offline without network configuration
- ✅ No complex permissions setup

**Backup the Database**:
```cmd
# Stop the application first
copy prisma\dev.db prisma\dev.db.backup
```

**Restore the Database**:
```cmd
# Stop the application first
copy prisma\dev.db.backup prisma\dev.db
```

### 2. Environment Configuration

Edit the `.env` file in the application root:

```env
# Database (already configured for SQLite)
DATABASE_URL="file:./prisma/dev.db"

# AWX Configuration (Optional)
# Configure these OR use the Settings page in the UI
AWX_BASE_URL=https://your-awx-server.com/api/v2
AWX_TOKEN=your_token_here

# Application Port (default: 3000)
PORT=3000
```

**Configuration Priority**:
1. `.env` file (highest priority)
2. Settings page in UI (fallback)
3. Demo mode (if AWX not configured)

### 3. AWX Integration Setup

You can configure AWX integration in two ways:

#### Option A: Environment File (Recommended for Production)
Edit `.env` file:
```env
AWX_BASE_URL=https://your-awx-server.com/api/v2
AWX_TOKEN=your_awx_api_token
```

#### Option B: Settings Page (Recommended for Testing)
1. Start the application
2. Navigate to Settings > General
3. Enter AWX Base URL and API Token
4. Click Save

**Demo Mode**: If AWX is not configured, the application runs in demo mode and simulates successful automation executions.

---

## Running the Application

### Start the Application

```cmd
cd C:\automation-platform
start.bat
```

The application will be available at: `http://localhost:3000`

### Stop the Application

Press `Ctrl + C` in the command window, or close the window.

### Run as Windows Service (Production)

For production deployments, use a tool like:
- **NSSM** (Non-Sucking Service Manager) - Recommended
- **node-windows**
- **PM2** with pm2-windows-service

**Example with NSSM**:
```cmd
# Download NSSM from https://nssm.cc/download
nssm install AutomationPlatform "C:\Program Files\nodejs\node.exe"
nssm set AutomationPlatform AppDirectory "C:\automation-platform"
nssm set AutomationPlatform AppParameters "node_modules\next\dist\bin\next start"
nssm set AutomationPlatform DisplayName "Automation Platform"
nssm set AutomationPlatform Description "IT Automation Platform"
nssm set AutomationPlatform Start SERVICE_AUTO_START
nssm start AutomationPlatform
```

---

## Firewall Configuration

### Allow Inbound Connections

```cmd
# Run as Administrator
netsh advfirewall firewall add rule name="Automation Platform" dir=in action=allow protocol=TCP localport=3000

# Or use Windows Firewall GUI:
# Control Panel > System and Security > Windows Defender Firewall
# > Advanced Settings > Inbound Rules > New Rule
```

### Access from Other Computers

By default, the application listens on `localhost` (127.0.0.1). To allow access from other computers:

1. **Edit** `package.json`, modify the dev script:
   ```json
   "dev": "next dev -H 0.0.0.0"
   ```

2. **Or set environment variable**:
   ```cmd
   set HOST=0.0.0.0
   npm run dev
   ```

---

## Remote Desktop Configuration

### For Remote Access via RDP:

1. **Enable Remote Desktop**:
   ```cmd
   # Run as Administrator
   reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Terminal Server" /v fDenyTSConnections /t REG_DWORD /d 0 /f
   netsh advfirewall firewall set rule group="remote desktop" new enable=Yes
   ```

2. **Connect via RDP**:
   - Use Remote Desktop Connection (mstsc.exe)
   - Connect to: `server-ip-address:3389`

3. **Access the application**:
   - Once connected, open browser: `http://localhost:3000`

### For Remote Access via Web Browser:

1. **Configure firewall** (see above)
2. **Start application** with network binding
3. **Access from remote computer**: `http://server-ip-address:3000`

---

## Maintenance

### Update Application

1. **Backup database**:
   ```cmd
   copy prisma\dev.db backups\dev.db.%date:~-4,4%%date:~-10,2%%date:~-7,2%
   ```

2. **Stop application**

3. **Update files**:
   - Replace application files with new version
   - Keep `.env` and `prisma\dev.db`

4. **Run database migrations** (if needed):
   ```cmd
   npm run prisma:migrate
   ```

5. **Restart application**

### View Logs

Application logs are displayed in the console. To save logs:

```cmd
# Redirect output to log file
start.bat > logs\app.log 2>&1
```

### Monitor Database Size

```cmd
dir prisma\dev.db
# SQLite is very efficient - typical size: 1-100MB
```

### Database Maintenance

```cmd
# Vacuum database (optimize size)
sqlite3 prisma\dev.db "VACUUM;"
```

---

## Troubleshooting

### Port Already in Use

```cmd
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID <process_id> /F
```

### Permission Errors

- Run Command Prompt as Administrator
- Ensure user has write access to installation directory
- Check antivirus is not blocking Node.js

### Database Locked Error

- Ensure only one instance of the application is running
- Close any database tools (Prisma Studio, SQLite Browser)
- Restart the application

### Missing Dependencies

```cmd
# Reinstall dependencies
npm clean-install
```

---

## Security Best Practices

1. **Change default credentials** (if authentication is enabled)
2. **Use HTTPS** in production (configure reverse proxy like IIS)
3. **Restrict firewall access** to specific IP ranges
4. **Regular backups** of database file
5. **Keep Node.js updated** to latest LTS version
6. **Protect `.env` file** - do not commit to version control
7. **Use Windows Defender** or antivirus software

---

## Performance Optimization

### For Better Performance on Windows:

1. **Exclude from antivirus scanning**:
   - Add `C:\automation-platform\node_modules` to exclusions
   - Add `node.exe` process to exclusions

2. **Disable Windows Indexing**:
   - Right-click folder > Properties > Advanced
   - Uncheck "Allow files in this folder to have contents indexed"

3. **Use SSD storage** for database file

4. **Allocate sufficient RAM**:
   - Minimum: 2GB
   - Recommended: 4GB+

---

## Migration from Development to Production

1. **Build for production**:
   ```cmd
   npm run build
   ```

2. **Update start script** to use production build:
   ```cmd
   npm start
   ```

3. **Configure environment**:
   ```cmd
   set NODE_ENV=production
   ```

---

## Support and Resources

- **Node.js Download**: https://nodejs.org/
- **SQLite Information**: https://www.sqlite.org/
- **NSSM (Windows Service)**: https://nssm.cc/
- **Application Documentation**: See README.md

---

## Quick Reference Commands

```cmd
# Setup
setup.bat                    # Initial setup (online)
setup-offline.bat            # Initial setup (offline)

# Operations
start.bat                    # Start application
npm run dev                  # Start development server
npm run build                # Build for production
npm start                    # Start production server

# Database
npm run prisma:studio        # Open database browser
npm run prisma:migrate       # Run migrations
npm run prisma:generate      # Regenerate Prisma client

# Maintenance
backup-database.bat          # Backup database file
```

---

## License

ISC

---

## Author

**Shinish Sasidharan**

---

**Autoclik v1.0 - Automation Platform**
