@echo off
REM Author: Shinish Sasidharan
REM Autoclik v1.0 - Automation Platform
REM Windows Setup Script for AutoClik Platform
echo ========================================
echo AutoClik Platform - Windows Setup
echo ========================================
echo.

echo Step 1: Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js found:
node --version
echo.

echo Step 2: Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed!
    pause
    exit /b 1
)
echo npm found:
npm --version
echo.

echo Step 3: Removing macOS-specific binaries...
echo This is necessary because the repository contains macOS binaries.
if exist node_modules (
    echo Backing up package-lock.json...
    copy package-lock.json package-lock.json.bak

    echo Removing node_modules...
    rmdir /s /q node_modules
    echo Done!
)
echo.

echo Step 4: Installing Windows-compatible dependencies...
echo This will download and install Windows-specific binaries.
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo.

echo Step 5: Setting up environment files...
if not exist .env (
    if exist .env.example (
        echo Creating .env from .env.example...
        copy .env.example .env
        echo Please edit .env and add your AWX credentials!
    )
)
echo.

echo Step 6: Setting up database...
if not exist prisma\dev.db (
    echo Generating Prisma client...
    call npm run prisma:generate

    echo Creating database schema...
    call npx prisma db push --accept-data-loss

    echo Seeding database with initial data ^(users, automations, etc.^)...
    call npm run prisma:seed

    echo Database setup complete!
    echo.
    echo Default admin login:
    echo   Username: admin
    echo   Password: admin123
) else (
    echo Database already exists. Skipping...
    echo To reset database, delete prisma\dev.db and run this script again.
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env file and add your AWX credentials
echo 2. Run: npm run dev
echo 3. Open: http://localhost:3000
echo.
echo For production deployment:
echo 1. Copy .env.production.example to .env.production
echo 2. Edit with production credentials
echo 3. Run: npm run build
echo 4. Run: npm start
echo.
pause
