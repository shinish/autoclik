# Windows Quick Start Guide

**Automation Platform - Windows Deployment**

This is a quick reference for deploying the application on Windows systems with limited internet access.

---

## System Overview

- **Framework**: Next.js 16
- **Database**: SQLite (file-based, no server needed)
- **Size**: 200-730MB depending on packaging method
- **Port**: 3000 (configurable)
- **Requirements**: Windows 10+, Node.js 18+

---

## Quick Start

### Method 1: Online Installation (Internet Available)

```cmd
1. Extract application to C:\automation-platform
2. Run: setup.bat
3. Run: start.bat
4. Open: http://localhost:3000
```

### Method 2: Offline Installation (No Internet)

```cmd
1. Extract automation-platform-offline.zip to C:\automation-platform
2. Run: setup-offline.bat
3. Run: start.bat
4. Open: http://localhost:3000
```

---

## Package Size Optimization

### Option A: Minimal Package (~200MB) - RECOMMENDED

**Preparation (Internet Machine):**
```cmd
npm install
create-minimal-package.bat
```

**Result**: `automation-platform-minimal-[timestamp].zip` (~80-120MB compressed)

### Option B: Optimized Package (~600MB)

**Preparation (Internet Machine):**
```cmd
npm install
optimize-node-modules.bat
package-for-offline.bat
```

**Result**: `automation-platform-offline-[timestamp].zip` (~150-200MB compressed)

### Option C: Full Package (~730MB)

**Preparation (Internet Machine):**
```cmd
npm install
package-for-offline.bat
```

**Result**: `automation-platform-offline-[timestamp].zip` (~200-250MB compressed)

---

## Available Scripts

### Setup Scripts
- `setup.bat` - Online setup with internet
- `setup-offline.bat` - Offline setup (no internet needed)

### Startup Scripts
- `start.bat` - Start development server
- `start-production.bat` - Start production server
- `start-standalone.bat` - Start minimal standalone build

### Packaging Scripts
- `create-minimal-package.bat` - Create minimal offline package (~200MB)
- `optimize-node-modules.bat` - Optimize node_modules size
- `package-for-offline.bat` - Create standard offline package

### Maintenance Scripts
- `backup-database.bat` - Backup SQLite database

---

## Database Information

**Location**: `C:\automation-platform\prisma\dev.db`

**Backup**:
```cmd
backup-database.bat
# Or manually:
copy prisma\dev.db backups\dev.db.backup
```

**Restore**:
```cmd
# Stop application first
copy backups\dev.db.backup prisma\dev.db
```

**Benefits**:
- ✅ No database server needed
- ✅ Single file database
- ✅ Portable and easy to backup
- ✅ Works completely offline
- ✅ No complex configuration

---

## Configuration

### .env File

```env
# Database (already configured)
DATABASE_URL="file:./prisma/dev.db"

# AWX Configuration (optional)
AWX_BASE_URL=https://your-awx-server.com/api/v2
AWX_TOKEN=your_token_here

# Port (optional, default: 3000)
PORT=3000
```

### AWX Setup

**Option 1**: Edit `.env` file (recommended for production)
**Option 2**: Use Settings page in UI after startup

**Demo Mode**: If AWX not configured, app simulates executions

---

## Remote Access Setup

### Access from Other Computers

1. **Allow firewall**:
```cmd
netsh advfirewall firewall add rule name="Automation Platform" dir=in action=allow protocol=TCP localport=3000
```

2. **Start with network binding**:
```cmd
# Edit package.json, change:
"dev": "next dev -H 0.0.0.0"
```

3. **Access from remote PC**:
```
http://[server-ip]:3000
```

### Remote Desktop Access

```cmd
# Access via RDP, then in browser:
http://localhost:3000
```

---

## File Transfer Methods

For machines without internet:

1. **USB Drive** (most common)
   - Copy ZIP file to USB
   - Transfer to target machine

2. **Network Share** (if available)
   ```cmd
   copy package.zip \\server\share\
   ```

3. **CD/DVD** (very restricted environments)
   - Burn ZIP to disc
   - Transfer to target machine

---

## Troubleshooting

### Port Already in Use
```cmd
netstat -ano | findstr :3000
taskkill /PID [process_id] /F
```

### Permission Errors
```cmd
# Run Command Prompt as Administrator
Right-click Command Prompt > Run as Administrator
```

### Database Locked
```cmd
# Ensure only one instance running
# Close any database tools
# Restart application
```

### Missing Dependencies
```cmd
npm clean-install
```

---

## Production Deployment

### 1. Build Application
```cmd
npm run build
```

### 2. Run Production Server
```cmd
start-production.bat
# Or manually:
npm start
```

### 3. Windows Service (Optional)

**Using NSSM** (recommended):
```cmd
# Download NSSM from https://nssm.cc/
nssm install AutomationPlatform "C:\Program Files\nodejs\node.exe"
nssm set AutomationPlatform AppDirectory "C:\automation-platform"
nssm set AutomationPlatform AppParameters ".next\standalone\server.js"
nssm start AutomationPlatform
```

---

## Security Checklist

- [ ] Change default credentials (if auth enabled)
- [ ] Configure firewall rules
- [ ] Protect .env file
- [ ] Regular database backups
- [ ] Keep Node.js updated
- [ ] Use antivirus software
- [ ] Restrict network access to specific IPs

---

## Performance Tips

1. **Exclude from antivirus scanning**:
   - `C:\automation-platform\node_modules`
   - `node.exe` process

2. **Disable Windows Indexing**:
   - Right-click folder > Properties > Advanced
   - Uncheck "Allow files to have contents indexed"

3. **Use SSD storage** for better database performance

4. **Allocate sufficient RAM**: 4GB+ recommended

---

## Size Comparison

| Package Type | Uncompressed | Compressed | Best For |
|--------------|-------------|------------|----------|
| **Minimal** | ~200MB | ~80-120MB | Production, limited bandwidth |
| **Optimized** | ~600MB | ~150-200MB | Balance of size and compatibility |
| **Full** | ~730MB | ~200-250MB | Development, maximum compatibility |

---

## Common Commands

```cmd
# Setup
setup.bat                           # First-time setup (online)
setup-offline.bat                   # First-time setup (offline)

# Operations
start.bat                           # Start development server
start-production.bat                # Start production server
npm run build                       # Build for production

# Database
backup-database.bat                 # Backup database
npm run prisma:studio               # Open database browser

# Maintenance
optimize-node-modules.bat           # Reduce package size
create-minimal-package.bat          # Create minimal package
```

---

## Documentation Files

- `README.md` - General application documentation
- `WINDOWS_DEPLOYMENT.md` - Complete Windows deployment guide
- `OFFLINE_INSTALLATION.md` - Detailed offline installation steps
- `OPTIMIZE_PACKAGE_SIZE.md` - Package optimization strategies
- `WINDOWS_QUICK_START.md` - This file

---

## Support

For detailed information, see:
- **Installation**: OFFLINE_INSTALLATION.md
- **Deployment**: WINDOWS_DEPLOYMENT.md
- **Optimization**: OPTIMIZE_PACKAGE_SIZE.md

For issues:
- Check application logs in console
- Review troubleshooting section in WINDOWS_DEPLOYMENT.md
- Verify system requirements

---

## Summary

**For Windows deployment with limited internet access:**

1. ✅ Uses SQLite (no database server needed)
2. ✅ Minimal package option available (~200MB)
3. ✅ Complete offline installation support
4. ✅ Easy-to-use batch scripts for setup
5. ✅ Portable and easy to configure
6. ✅ Works entirely offline after installation

**Recommended Workflow:**

```
Internet Machine          Target Windows Machine
================          ======================
1. npm install     →      1. Extract package
2. create-minimal        2. setup-offline.bat
   -package.bat          3. start.bat
3. Transfer ZIP          4. Access http://localhost:3000
```

---

**License**: ISC

---

## Author

**Shinish Sasidharan**

---

**Autoclik v1.0 - Automation Platform**
