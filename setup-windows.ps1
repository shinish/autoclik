# Windows Setup Script for AutoClik Platform (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AutoClik Platform - Windows Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Step 1: Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Check npm
Write-Host "Step 2: Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm is not installed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Remove macOS binaries
Write-Host "Step 3: Removing macOS-specific binaries..." -ForegroundColor Yellow
Write-Host "This is necessary because the repository contains macOS binaries." -ForegroundColor Gray
if (Test-Path "node_modules") {
    Write-Host "Backing up package-lock.json..." -ForegroundColor Gray
    if (Test-Path "package-lock.json") {
        Copy-Item "package-lock.json" "package-lock.json.bak" -Force
    }

    Write-Host "Removing node_modules..." -ForegroundColor Gray
    Remove-Item "node_modules" -Recurse -Force
    Write-Host "Done!" -ForegroundColor Green
}
Write-Host ""

# Install Windows dependencies
Write-Host "Step 4: Installing Windows-compatible dependencies..." -ForegroundColor Yellow
Write-Host "This will download and install Windows-specific binaries." -ForegroundColor Gray
Write-Host "This may take 2-5 minutes depending on your internet connection..." -ForegroundColor Gray
Write-Host ""

try {
    npm install
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm install failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Setup environment files
Write-Host "Step 5: Setting up environment files..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "Creating .env from .env.example..." -ForegroundColor Gray
        Copy-Item ".env.example" ".env"
        Write-Host "Please edit .env and add your AWX credentials!" -ForegroundColor Yellow
    }
}
Write-Host ""

# Setup database
Write-Host "Step 6: Setting up database..." -ForegroundColor Yellow
if (-not (Test-Path "prisma/dev.db")) {
    Write-Host "Generating Prisma client..." -ForegroundColor Gray
    npm run prisma:generate

    Write-Host "Creating database schema..." -ForegroundColor Gray
    npx prisma db push --accept-data-loss

    Write-Host "Seeding database with initial data (users, automations, etc.)..." -ForegroundColor Gray
    npm run prisma:seed

    Write-Host "Database setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Default admin credentials:" -ForegroundColor Cyan
    Write-Host "  Username: admin" -ForegroundColor White
    Write-Host "  Password: admin" -ForegroundColor White
} else {
    Write-Host "Database already exists. Skipping..." -ForegroundColor Gray
    Write-Host "To reset database, delete prisma/dev.db and run this script again." -ForegroundColor Gray
}
Write-Host ""

# Complete
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file and add your AWX credentials" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White
Write-Host "3. Open: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "For production deployment:" -ForegroundColor Cyan
Write-Host "1. Copy .env.production.example to .env.production" -ForegroundColor White
Write-Host "2. Edit with production credentials" -ForegroundColor White
Write-Host "3. Run: npm run build" -ForegroundColor White
Write-Host "4. Run: npm start" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
