# Windows Setup Guide for AutoClik Platform

## Important Note About Cross-Platform Compatibility

This repository contains macOS ARM64 binaries in `node_modules`, which **will not work on Windows**. Windows users need to replace these with Windows-specific binaries.

## Prerequisites

1. **Node.js 18 or higher** - Download from https://nodejs.org/
2. **Git** - Download from https://git-scm.com/
3. **Git LFS** (if cloning) - Download from https://git-lfs.github.com/

## Quick Setup (Recommended)

### Option 1: PowerShell Script (Recommended for Windows 10/11)

1. Clone the repository:
```powershell
git clone https://github.com/shinish/autoclik.git
cd autoclik
```

2. Run the PowerShell setup script:
```powershell
# Allow script execution (run as Administrator if needed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run setup
.\setup-windows.ps1
```

### Option 2: Batch Script (Works on all Windows versions)

1. Clone the repository:
```cmd
git clone https://github.com/shinish/autoclik.git
cd autoclik
```

2. Run the batch setup script:
```cmd
setup-windows.bat
```

## Manual Setup

If you prefer to set up manually:

### Step 1: Clone Repository
```cmd
git clone https://github.com/shinish/autoclik.git
cd autoclik
```

### Step 2: Remove macOS Binaries
```cmd
rmdir /s /q node_modules
```

### Step 3: Install Windows Dependencies
```cmd
npm install
```

This will download and install Windows-compatible binaries for:
- Next.js
- Prisma
- Sharp
- Bcrypt
- Other native modules

### Step 4: Configure Environment
```cmd
copy .env.example .env
notepad .env
```

Edit `.env` and add your AWX credentials:
```env
DATABASE_URL="file:./prisma/dev.db"
AWX_BASE_URL=http://your-awx-server/api/v2
AWX_TOKEN=your_awx_token_here
```

### Step 5: Initialize Database
```cmd
npx prisma generate
npx prisma db push
```

### Step 6: Start Development Server
```cmd
npm run dev
```

Open http://localhost:3000 in your browser.

## Production Deployment on Windows

### 1. Setup Production Environment
```cmd
copy .env.production.example .env.production
notepad .env.production
```

### 2. Build Application
```cmd
npm run build
```

### 3. Start Production Server
```cmd
npm start
```

Or use a process manager like PM2:
```cmd
npm install -g pm2
pm2 start npm --name "autoclik" -- start
pm2 save
pm2 startup
```

## Running as Windows Service

### Using NSSM (Non-Sucking Service Manager)

1. Download NSSM from https://nssm.cc/download
2. Install as service:
```cmd
nssm install AutoClik
```

3. Configure in NSSM GUI:
   - Path: `C:\Program Files\nodejs\node.exe`
   - Startup directory: `C:\path\to\autoclik`
   - Arguments: `node_modules\.bin\next start`

### Using Node-Windows
```cmd
npm install -g node-windows
```

Create `service-install.js`:
```javascript
const Service = require('node-windows').Service;

const svc = new Service({
  name: 'AutoClik Platform',
  description: 'Automation Platform for AWX',
  script: 'C:\\path\\to\\autoclik\\node_modules\\.bin\\next',
  scriptOptions: 'start',
  nodeOptions: []
});

svc.on('install', () => {
  svc.start();
});

svc.install();
```

Run:
```cmd
node service-install.js
```

## Troubleshooting

### Issue: "next is not recognized"
**Solution:** Run `npm install` to install Windows binaries.

### Issue: "sharp" module errors
**Solution:**
```cmd
npm rebuild sharp
```

### Issue: Prisma errors
**Solution:**
```cmd
npx prisma generate
```

### Issue: Port 3000 already in use
**Solution:** Change port in `.env`:
```env
PORT=3001
```

### Issue: SQLite database locked
**Solution:** Close any database browsers and restart the app.

## IIS Deployment (Optional)

To deploy behind IIS:

1. Install iisnode: https://github.com/tjanczuk/iisnode
2. Configure web.config:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeJS">
          <match url="/*" />
          <action type="Rewrite" url="server.js" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

## Support

For issues specific to Windows deployment, please check:
- Node.js version compatibility
- Windows Firewall settings
- Antivirus interference with npm install
- Windows Defender real-time protection (can slow npm install)

For general issues, see the main README.md
