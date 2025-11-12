@echo off
REM ========================================
REM Automation Platform - Offline Setup
REM ========================================

echo.
echo ========================================
echo Automation Platform - Offline Setup
echo ========================================
echo.
echo This script sets up the pre-packaged application
echo No internet connection required!
echo.
pause

REM Check if Node.js is installed
echo.
echo [1/5] Checking Node.js installation...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js 18+ from the offline installer:
    echo   node-v18.x.x-x64.msi
    echo.
    echo If you don't have the installer, download it from:
    echo   https://nodejs.org/ (on a machine with internet)
    echo.
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo npm version:
npm --version
echo ✓ Node.js is installed
echo.

REM Verify node_modules exists
echo [2/5] Verifying package contents...
if not exist node_modules (
    echo.
    echo ERROR: node_modules folder not found!
    echo.
    echo This appears to be an incomplete offline package.
    echo Please ensure you extracted the complete offline package
    echo that includes the node_modules directory.
    echo.
    pause
    exit /b 1
)
echo ✓ Package verified (node_modules present)
echo.

REM Create .env file
echo [3/5] Setting up configuration...
if not exist .env (
    copy .env.example .env
    echo ✓ Created .env configuration file
    echo.
    echo Edit .env to configure AWX settings, or configure later via Settings page
) else (
    echo ✓ .env file already exists
)
echo.

REM Generate Prisma Client for Windows platform
echo [4/5] Generating Prisma Client for Windows...
echo (This regenerates platform-specific binaries)
echo.
call npm run prisma:generate
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to generate Prisma Client
    echo.
    echo Troubleshooting:
    echo - Ensure npm is working correctly
    echo - Run Command Prompt as Administrator
    echo.
    pause
    exit /b 1
)
echo ✓ Prisma Client generated
echo.

REM Initialize database
echo [5/5] Initializing database...
if exist prisma\dev.db (
    echo Database file already exists
    echo ✓ Using existing database
) else (
    echo Creating database...
    call npx prisma migrate deploy
    if %ERRORLEVEL% NEQ 0 (
        echo Trying alternative database creation method...
        call npx prisma db push --skip-generate
    )

    if %ERRORLEVEL% EQU 0 (
        echo ✓ Database created

        REM Ask about seeding
        echo.
        set /p SEED="Seed database with sample data? (y/n): "
        if /i "%SEED%"=="y" (
            call npm run prisma:seed
            if %ERRORLEVEL% EQU 0 (
                echo ✓ Database seeded
            )
        )
    ) else (
        echo WARNING: Database creation had errors
        echo You may need to run this manually:
        echo   npx prisma db push
    )
)
echo.

echo ========================================
echo Offline setup completed!
echo ========================================
echo.
echo Installation directory: %CD%
echo Configuration file: .env
echo Database location: prisma\dev.db
echo.
echo To start the application:
echo   start.bat
echo.
echo The application will be available at:
echo   http://localhost:3000
echo.
echo Configuration:
echo   - Edit .env file for AWX settings
echo   - Or use Settings page after starting
echo.
pause
