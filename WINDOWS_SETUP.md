# Windows Setup Guide

**Author:** Shinish Sasidharan
**Platform:** Windows 10/11
**Version:** 1.0.2

---

## Prerequisites

### Required Software

1. **Node.js 18+ (LTS)**
   - Download: https://nodejs.org/
   - Verify installation:
     ```cmd
     node --version
     npm --version
     ```

2. **Git for Windows** (Optional)
   - Download: https://git-scm.com/download/win
   - Recommended for version control

3. **VS Code** (Recommended)
   - Download: https://code.visualstudio.com/
   - Install extensions:
     - Prisma
     - ES7+ React/Redux/React-Native snippets
     - Tailwind CSS IntelliSense

---

## Quick Start (Windows)

### Method 1: Using npm Scripts (Recommended)

```cmd
# 1. Install dependencies
npm install

# 2. Setup database with test data
npm run setup:win

# 3. Start development server
npm run dev
```

### Method 2: Manual Setup

```cmd
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Reset and seed database
npm run db:reset:win

# 4. Start development server
npm run dev
```

---

## Available npm Scripts (Windows-Compatible)

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | Start dev server | Runs on http://localhost:3000 |
| `npm run build` | Build for production | Creates optimized build |
| `npm start` | Start production | Runs production build |
| `npm run setup:win` | Complete setup | Install + DB setup + seed |
| `npm run db:reset:win` | Reset database | Clean DB + push + seed |
| `npm run clean` | Clean project | Remove node_modules, .next |
| `npm run prisma:studio` | Open Prisma Studio | Database GUI |

---

## Windows-Specific Considerations

### 1. Path Separators
All scripts use cross-platform Node.js `path` module:
- ✅ Uses `path.join()` for Windows compatibility
- ✅ No hardcoded Unix paths (`/`)
- ✅ Works with both `\` and `/` on Windows

### 2. Database File Paths
SQLite database files are automatically placed in the correct location:
- `prisma/dev.db` - Main database
- `prisma/dev.db-journal` - SQLite journal file

### 3. File Permissions
No file permission issues on Windows:
- No `chmod` commands required
- Scripts use Node.js built-in modules
- All operations are cross-platform

### 4. Shell Scripts
Batch file alternatives provided:
- Located in `/scripts` directory
- `.bat` files for Windows
- `.sh` files for Unix/Mac (optional)

---

## Troubleshooting

### Issue 1: "npm install" Fails

**Error:** `EACCES: permission denied`

**Solution:**
```cmd
# Run PowerShell as Administrator
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
npm cache clean --force
npm install
```

### Issue 2: Prisma Client Not Found

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```cmd
npx prisma generate
npm install
```

### Issue 3: Port 3000 Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```cmd
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
set PORT=3001 && npm run dev
```

### Issue 4: Database Locked

**Error:** `database is locked`

**Solution:**
```cmd
# Close all applications using the database
# Delete lock files
del prisma\dev.db-journal
npm run db:reset:win
```

### Issue 5: CRLF vs LF Line Endings

**Warning:** Git converting line endings

**Solution:**
```cmd
# Configure Git for Windows
git config --global core.autocrlf true
```

---

## Development Workflow (Windows)

### 1. Initial Setup
```cmd
git clone <repository-url>
cd automation-platform
npm run setup:win
```

### 2. Daily Development
```cmd
# Start development server
npm run dev

# In another terminal - watch database
npm run prisma:studio
```

### 3. Database Operations
```cmd
# View database
npm run prisma:studio

# Reset and seed database
npm run db:reset:win

# Just seed data
npm run prisma:seed
```

### 4. Before Committing
```cmd
# Clean build files
npm run clean

# Reinstall dependencies
npm install

# Test build
npm run build
```

---

## Production Deployment (Windows Server)

### Using PM2 (Process Manager)

```cmd
# Install PM2 globally
npm install -g pm2

# Build application
npm run build

# Start with PM2
pm2 start npm --name "autoclik" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# View logs
pm2 logs autoclik
```

### Using Windows Service

1. Install `node-windows`:
   ```cmd
   npm install -g node-windows
   ```

2. Create service script (`install-service.js`):
   ```javascript
   const Service = require('node-windows').Service;

   const svc = new Service({
     name: 'Autoclik',
     description: 'Autoclik Automation Platform',
     script: 'C:\\path\\to\\automation-platform\\server.js'
   });

   svc.on('install', () => {
     svc.start();
   });

   svc.install();
   ```

3. Run service installer:
   ```cmd
   node install-service.js
   ```

---

## Environment Variables (Windows)

### Setting Environment Variables

**PowerShell:**
```powershell
$env:AWX_BASE_URL = "https://awx.example.com/api/v2"
$env:AWX_TOKEN = "your-token-here"
npm run dev
```

**Command Prompt:**
```cmd
set AWX_BASE_URL=https://awx.example.com/api/v2
set AWX_TOKEN=your-token-here
npm run dev
```

### Using .env File (Recommended)
```cmd
# Copy example file
copy .env.example .env

# Edit .env file with your values
notepad .env
```

---

## Performance Optimization (Windows)

### 1. Exclude from Windows Defender
Add project folder to exclusions:
1. Open Windows Security
2. Virus & threat protection
3. Manage settings
4. Add exclusion → Folder
5. Select `automation-platform` folder

### 2. Use SSD Drive
- Install on SSD for faster `npm install` and builds
- Significantly improves development experience

### 3. Increase Node.js Memory
```cmd
set NODE_OPTIONS=--max-old-space-size=4096
npm run build
```

---

## Security Considerations

### 1. Firewall Rules
Allow Node.js through firewall:
```cmd
netsh advfirewall firewall add rule name="Node.js" dir=in action=allow program="C:\Program Files\nodejs\node.exe" enable=yes
```

### 2. HTTPS in Production
Use reverse proxy (IIS, nginx):
- Install IIS with URL Rewrite
- Configure reverse proxy to Node.js
- Use Let's Encrypt for SSL certificate

### 3. Database Backup
```cmd
# Manual backup
copy prisma\dev.db backup\dev_%date:~-4,4%%date:~-10,2%%date:~-7,2%.db

# Automated backup (Task Scheduler)
schtasks /create /tn "Autoclik Backup" /tr "C:\path\to\backup-script.bat" /sc daily /st 02:00
```

---

## Recommended VS Code Settings (Windows)

Create `.vscode/settings.json`:

```json
{
  "files.eol": "\n",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "prisma.showPrismaDataPlatformNotification": false
}
```

---

## FAQ

### Q: Can I use WSL (Windows Subsystem for Linux)?
**A:** Yes! The project works perfectly in WSL2. Use Unix commands instead of Windows commands.

### Q: Does it work with yarn or pnpm?
**A:** Yes, but npm is recommended. Replace `npm` with `yarn` or `pnpm` in all commands.

### Q: How do I update to the latest version?
```cmd
git pull
npm install
npm run db:reset:win
```

### Q: Can I deploy to Azure?
**A:** Yes! Use Azure App Service with Node.js runtime. Configure environment variables in Azure Portal.

---

## Support

For Windows-specific issues:
1. Check this guide
2. Review `scripts/` folder for cross-platform scripts
3. All scripts use Node.js (cross-platform)
4. No Unix-specific commands

---

## Resources

- Node.js Documentation: https://nodejs.org/docs
- Prisma Windows Guide: https://www.prisma.io/docs/guides/other/environment-variables
- Next.js Windows: https://nextjs.org/docs/deployment
- PM2 Windows: https://pm2.keymetrics.io/docs/usage/quick-start/

---

**Author:** Shinish Sasidharan
**Autoclik v1.0 - Automation Platform**
