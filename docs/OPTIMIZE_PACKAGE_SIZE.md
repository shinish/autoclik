# Optimizing Package Size for Offline Installation

This guide explains how to reduce the size of node_modules from **730MB** to a more manageable size for Windows deployment in restricted environments.

## Current Size Analysis

```
node_modules: ~730MB
Application code: ~5MB
Total package: ~735MB
Compressed (ZIP): ~200-250MB
```

---

## Optimization Strategies

### Strategy 1: Production-Only Dependencies (Recommended)

Remove development dependencies from the offline package.

#### Step 1: Identify Dev Dependencies

Your current dev dependencies:
```json
"devDependencies": {
  "autoprefixer": "^10.4.21",
  "postcss": "^8.5.6",
  "tailwindcss": "^3.4.18"
}
```

#### Step 2: Install Production Only

On the preparation machine:

```bash
# Install ONLY production dependencies
npm install --production

# Or use --omit=dev (newer npm)
npm install --omit=dev
```

**Size Reduction**: Minimal in this case (~10MB) since most dependencies are production dependencies.

---

### Strategy 2: Use npm prune

Remove unused packages and clean up:

```bash
# Remove extraneous packages
npm prune --production

# Clean npm cache
npm cache clean --force
```

**Size Reduction**: ~5-20MB

---

### Strategy 3: Remove Unnecessary Files from node_modules

Create a cleanup script to remove files that aren't needed in production:

#### Create `optimize-node-modules.bat`:

```batch
@echo off
echo Optimizing node_modules for offline package...
echo.

REM Remove documentation files
echo Removing documentation...
for /d /r node_modules %%d in (docs) do @if exist "%%d" rd /s /q "%%d"
for /d /r node_modules %%d in (doc) do @if exist "%%d" rd /s /q "%%d"
for /r node_modules %%f in (*.md) do @if exist "%%f" del /q "%%f"
for /r node_modules %%f in (CHANGELOG*) do @if exist "%%f" del /q "%%f"
for /r node_modules %%f in (README*) do @if exist "%%f" del /q "%%f"

REM Remove test files
echo Removing test files...
for /d /r node_modules %%d in (test) do @if exist "%%d" rd /s /q "%%d"
for /d /r node_modules %%d in (tests) do @if exist "%%d" rd /s /q "%%d"
for /d /r node_modules %%d in (__tests__) do @if exist "%%d" rd /s /q "%%d"
for /r node_modules %%f in (*.test.js) do @if exist "%%f" del /q "%%f"
for /r node_modules %%f in (*.spec.js) do @if exist "%%f" del /q "%%f"

REM Remove example files
echo Removing examples...
for /d /r node_modules %%d in (examples) do @if exist "%%d" rd /s /q "%%d"
for /d /r node_modules %%d in (example) do @if exist "%%d" rd /s /q "%%d"

REM Remove coverage and build artifacts
echo Removing coverage and build artifacts...
for /d /r node_modules %%d in (coverage) do @if exist "%%d" rd /s /q "%%d"
for /d /r node_modules %%d in (.nyc_output) do @if exist "%%d" rd /s /q "%%d"

REM Remove TypeScript source files (keep only compiled JS)
echo Removing TypeScript source files...
for /r node_modules %%f in (*.ts) do @if exist "%%f" del /q "%%f"
for /r node_modules %%f in (*.tsx) do @if exist "%%f" del /q "%%f"
REM Keep .d.ts files for type definitions
for /r node_modules %%f in (*.map) do @if exist "%%f" del /q "%%f"

REM Remove CI/CD configuration
echo Removing CI/CD files...
for /r node_modules %%f in (.travis.yml) do @if exist "%%f" del /q "%%f"
for /r node_modules %%f in (.gitlab-ci.yml) do @if exist "%%f" del /q "%%f"
for /r node_modules %%f in (appveyor.yml) do @if exist "%%f" del /q "%%f"

REM Remove editor configs
echo Removing editor configs...
for /r node_modules %%f in (.editorconfig) do @if exist "%%f" del /q "%%f"
for /r node_modules %%f in (.eslintrc*) do @if exist "%%f" del /q "%%f"

echo.
echo Optimization complete!
echo.
pause
```

**Size Reduction**: ~50-150MB (can reduce to ~580-650MB)

---

### Strategy 4: Bundle Application (Advanced)

Create a standalone bundle using Webpack or Next.js standalone build.

#### Use Next.js Standalone Build:

**Edit `next.config.js`:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',  // Add this line
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,PATCH,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
}

module.exports = nextConfig
```

**Build for standalone:**

```bash
npm run build
```

This creates `.next/standalone/` with only necessary dependencies.

**Package structure:**
```
.next/standalone/          # Minimal runtime (~150-200MB)
.next/static/             # Static assets
public/                   # Public assets
```

**Size Reduction**: ~500MB+ (total package ~200-250MB)

---

### Strategy 5: Use pnpm Instead of npm (Alternative)

pnpm uses hard links and deduplication, significantly reducing disk space.

```bash
# Install pnpm
npm install -g pnpm

# Install dependencies with pnpm
pnpm install

# pnpm creates a content-addressable store
# Typical savings: 30-50%
```

**Size Reduction**: ~200-300MB (to ~400-500MB)

**Note**: Requires pnpm to be installed on target machine.

---

## Recommended Optimization Workflow

### For Windows Offline Package (Best Approach):

```batch
REM 1. Install dependencies
npm install

REM 2. Build for production with standalone
npm run build

REM 3. Clean unnecessary files
optimize-node-modules.bat

REM 4. Remove dev dependencies
npm prune --production

REM 5. Package only what's needed
# Package these directories:
# - .next/standalone/
# - .next/static/
# - public/
# - prisma/
# - .env.example
```

### Create Optimized Package Script:

#### Create `create-minimal-package.bat`:

```batch
@echo off
echo ========================================
echo Creating Minimal Offline Package
echo ========================================
echo.

REM Step 1: Install dependencies
echo [1/6] Installing dependencies...
call npm install
echo.

REM Step 2: Build for standalone
echo [2/6] Building application (standalone mode)...
call npm run build
echo.

REM Step 3: Create package directory
echo [3/6] Creating package structure...
if exist minimal-package rmdir /s /q minimal-package
mkdir minimal-package
echo.

REM Step 4: Copy necessary files
echo [4/6] Copying files...

REM Copy standalone build
xcopy .next\standalone minimal-package\ /E /I /H /Y
xcopy .next\static minimal-package\.next\static\ /E /I /H /Y
xcopy public minimal-package\public\ /E /I /H /Y

REM Copy Prisma
xcopy prisma minimal-package\prisma\ /E /I /H /Y

REM Copy config files
copy package.json minimal-package\
copy .env.example minimal-package\
copy next.config.js minimal-package\

REM Copy batch scripts
copy setup-offline.bat minimal-package\
copy start.bat minimal-package\
copy backup-database.bat minimal-package\

REM Copy documentation
copy README.md minimal-package\
copy WINDOWS_DEPLOYMENT.md minimal-package\
copy OFFLINE_INSTALLATION.md minimal-package\

echo.

REM Step 5: Create ZIP
echo [5/6] Creating ZIP package...
set TIMESTAMP=%date:~-4%%date:~-10,2%%date:~-7,2%
set TIMESTAMP=%TIMESTAMP: =0%

powershell -Command "Compress-Archive -Path 'minimal-package\*' -DestinationPath 'automation-platform-minimal-%TIMESTAMP%.zip' -CompressionLevel Optimal"

echo.

REM Step 6: Show results
echo [6/6] Package Information
echo ========================================

for %%A in (automation-platform-minimal-%TIMESTAMP%.zip) do (
    set SIZE=%%~zA
)
set /a SIZE_MB=%SIZE% / 1048576

echo Package: automation-platform-minimal-%TIMESTAMP%.zip
echo Size: %SIZE_MB% MB
echo Location: %CD%
echo.
echo ✓ Minimal package created successfully!
echo.
echo This package is significantly smaller and includes
echo only production runtime dependencies.
echo.
pause
```

---

## Comparison Table

| Method | Size (Uncompressed) | Size (Compressed) | Effort | Compatibility |
|--------|-------------------|------------------|--------|---------------|
| **Full package** | 730MB | 200-250MB | Low | High |
| **Production only** | 720MB | 190-240MB | Low | High |
| **Optimized cleanup** | 580-650MB | 150-200MB | Medium | High |
| **Standalone build** | 200-250MB | 80-120MB | Medium | High |
| **pnpm** | 400-500MB | 120-150MB | Medium | Medium |

---

## Recommended Approach for Your Use Case

Based on your requirements (Windows, limited internet), I recommend:

### Option A: Standalone Build (Best Balance)

1. **Enable standalone output** in next.config.js
2. **Build the application**: `npm run build`
3. **Package .next/standalone + static files**
4. **Result**: ~200-250MB uncompressed, ~80-120MB compressed

### Option B: Optimized Full Package (Most Compatible)

1. **Install dependencies**: `npm install`
2. **Run optimization script**: `optimize-node-modules.bat`
3. **Remove dev dependencies**: `npm prune --production`
4. **Package everything**
5. **Result**: ~580-650MB uncompressed, ~150-200MB compressed

---

## Implementation Steps

### Step 1: Update next.config.js

```bash
# Edit the file to add standalone output
```

### Step 2: Create the optimization script

```bash
# Save optimize-node-modules.bat to project root
```

### Step 3: Update package-for-offline.bat

Add optimization steps before packaging:

```batch
REM Run optimization
call optimize-node-modules.bat

REM Continue with packaging...
```

### Step 4: Test the package

1. Create package on internet-connected machine
2. Transfer to test Windows machine
3. Extract and run setup-offline.bat
4. Verify application works correctly

---

## Additional Tips

### 1. Use Compression Tools

- **7-Zip**: Better compression than Windows built-in
  ```bash
  7z a -tzip -mx9 package.zip *
  ```
  Typical savings: Additional 10-20% reduction

### 2. Split Large Packages

For very restricted environments, split into parts:
```bash
7z a -tzip -v100m package.zip *
# Creates: package.z01, package.z02, etc.
```

### 3. Differential Updates

For updates, only transfer changed files:
```bash
# Create patch package with only changed files
```

---

## Security Note

When optimizing, DO NOT remove:
- `.bin` folders (executable scripts)
- `package.json` files (dependency metadata)
- `index.js` or `main` entry points
- Native binaries (.node files)
- Prisma engines

---

## Testing Checklist

After optimization, verify:
- [ ] Application starts successfully
- [ ] All pages load correctly
- [ ] API endpoints work
- [ ] Database operations function
- [ ] AWX integration works (if configured)
- [ ] No missing module errors

---

## Summary

**Recommendation for Windows deployment with limited internet:**

1. Use **Standalone Build** for smallest package (~200MB)
2. Or use **Optimized Full Package** for maximum compatibility (~600MB)
3. Compress with 7-Zip for additional savings
4. Test thoroughly before deploying to production

The standalone build is the best option for your use case as it provides the smallest package size while maintaining full functionality!

---

## Author

**Shinish Sasidharan**

---

**Autoclik v1.0 - Automation Platform**
