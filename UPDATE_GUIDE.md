# Update Guide

## How to Get the Latest Updates

### On Windows:

1. **Stop the development server** (if running)
   ```bash
   # Press Ctrl+C in the terminal where npm run dev is running
   ```

2. **Pull the latest changes**
   ```bash
   git pull origin main
   ```

3. **If you get merge conflicts or errors:**
   ```bash
   # Stash any local changes first
   git stash

   # Then pull
   git pull origin main

   # If you want your changes back
   git stash pop
   ```

4. **Clean the Next.js cache**
   ```bash
   # Remove .next directory
   rmdir /s /q .next

   # Or if above doesn't work
   rd /s /q .next
   ```

5. **Reinstall dependencies** (if package.json changed)
   ```bash
   npm install
   ```

6. **Run database migrations** (IMPORTANT for catalog feature!)
   ```bash
   npm run db:reset
   ```
   This will:
   - Create the Catalog and CatalogExecution tables
   - Seed default namespaces (Default, Infrastructure, Deployment, Monitoring)
   - Seed AWX environment from .env file
   - Create admin users (shinish / 3Mergency!)

7. **Restart the development server**
   ```bash
   npm run dev
   ```

### On macOS/Linux:

1. **Stop the development server** (if running)
   ```bash
   # Press Ctrl+C in the terminal
   ```

2. **Pull the latest changes**
   ```bash
   git pull origin main
   ```

3. **If you get merge conflicts:**
   ```bash
   # Stash any local changes
   git stash

   # Then pull
   git pull origin main

   # Restore your changes if needed
   git stash pop
   ```

4. **Clean the Next.js cache**
   ```bash
   rm -rf .next
   ```

5. **Reinstall dependencies** (if package.json changed)
   ```bash
   npm install
   ```

6. **Run database migrations** (IMPORTANT for catalog feature!)
   ```bash
   npm run db:reset
   ```
   This will:
   - Create the Catalog and CatalogExecution tables
   - Seed default namespaces (Default, Infrastructure, Deployment, Monitoring)
   - Seed AWX environment from .env file
   - Create admin users (shinish / 3Mergency!)

7. **Restart the development server**
   ```bash
   npm run dev
   ```

## Latest Updates (December 2024)

### Version History:

**4f394b5e - Remove all proxy settings**
- ✅ Removed 419 lines of proxy code from settings page
- ✅ Deleted proxy settings from database
- ✅ Now using middleware for CORS (more reliable, Windows-compatible)

**c2f3db09 - Clean up old proxy API**
- ✅ Removed experimental config warnings
- ✅ Removed old `/api/proxy/test` endpoint

**e58852d9 - Fix Windows source map errors**
- ✅ Fixed "invalid source map" errors on Windows
- ✅ Added source map warning suppressions

**6b946271 - Windows compatibility**
- ✅ Added webpack config for Windows path handling
- ✅ Platform-specific module resolution

**ed3fe762 - Fix middleware**
- ✅ Middleware now only applies to API routes
- ✅ Fixed page blocking issues

## What Changed in Latest Update:

### 🗑️ Removed:
- Proxy configuration UI from Settings page
- `/api/proxy/test` endpoint
- All proxy-related state and functions
- Proxy settings from database

### ✅ Added/Improved:
- Middleware-based CORS handling (automatic, no config needed)
- Better Windows compatibility
- Cleaner codebase (419 lines removed)
- No more proxy configuration headaches!

## Troubleshooting

### "Already up to date" but changes aren't showing:

1. **Check your current branch:**
   ```bash
   git branch
   # Should show: * main
   ```

2. **Check remote connection:**
   ```bash
   git remote -v
   # Should show: origin https://github.com/shinish/autoclik.git
   ```

3. **Force pull (CAREFUL - loses local changes):**
   ```bash
   git fetch origin
   git reset --hard origin/main
   ```

4. **Clean everything and start fresh:**
   ```bash
   # Windows
   rd /s /q .next
   rd /s /q node_modules
   npm install

   # macOS/Linux
   rm -rf .next node_modules
   npm install
   ```

### Port already in use:

```bash
# Windows - Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill
```

### Database issues after update:

```bash
# Reset database to fresh state
npm run db:reset
```

## Need Help?

- Check the main README.md for general documentation
- Review WINDOWS_SETUP.md for Windows-specific issues
- Check GitHub issues: https://github.com/shinish/autoclik/issues
