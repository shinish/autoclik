@echo off
REM ========================================
REM Automation Platform - Online Setup
REM ========================================

echo.
echo ========================================
echo Automation Platform - Setup Wizard
echo ========================================
echo.
echo This script will set up the Automation Platform on your Windows system.
echo.
echo Prerequisites:
echo - Node.js 18+ installed
echo - Internet connection (for downloading packages)
echo.
pause

REM Check if Node.js is installed
echo.
echo [1/6] Checking Node.js installation...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Node.js is not installed!
    echo.
    echo Please download and install Node.js 18 LTS from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

node --version
npm --version
echo ✓ Node.js is installed
echo.

REM Install dependencies
echo [2/6] Installing dependencies...
echo This may take 5-10 minutes...
echo.
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to install dependencies
    echo.
    echo Troubleshooting:
    echo - Check your internet connection
    echo - Try running as Administrator
    echo - Delete node_modules folder and try again
    echo.
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

REM Create .env file
echo [3/6] Setting up configuration...
if not exist .env (
    copy .env.example .env
    echo ✓ Created .env configuration file
    echo.
    echo IMPORTANT: Edit .env file to configure AWX settings
    echo Or you can configure AWX later via the Settings page
) else (
    echo ✓ .env file already exists
)
echo.

REM Generate Prisma Client
echo [4/6] Generating Prisma Client...
call npm run prisma:generate
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate Prisma Client
    pause
    exit /b 1
)
echo ✓ Prisma Client generated
echo.

REM Initialize database
echo [5/6] Initializing database...
if exist prisma\dev.db (
    echo Database file already exists
    set /p RECREATE="Do you want to recreate the database? This will delete all data! (y/n): "
    if /i "%RECREATE%"=="y" (
        del prisma\dev.db
        echo Database deleted
    )
)

if not exist prisma\dev.db (
    echo Creating database schema...
    call npm run prisma:migrate
    if %ERRORLEVEL% NEQ 0 (
        echo WARNING: Migration failed, trying push...
        call npx prisma db push --skip-generate
    )
    echo ✓ Database initialized
) else (
    echo ✓ Database already initialized
)
echo.

REM Optional: Seed database
echo [6/6] Database seeding (optional)...
set /p SEED="Do you want to seed the database with sample data? (y/n): "
if /i "%SEED%"=="y" (
    echo Seeding database...
    call npm run prisma:seed
    if %ERRORLEVEL% NEQ 0 (
        echo WARNING: Seeding failed or script not found
    ) else (
        echo ✓ Database seeded with sample data
    )
)
echo.

echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo Configuration file: .env
echo Database location: prisma\dev.db
echo.
echo To start the application:
echo   start.bat
echo.
echo The application will be available at:
echo   http://localhost:3000
echo.
echo For AWX configuration, either:
echo   1. Edit .env file manually
echo   2. Use Settings page after starting the app
echo.
pause
