@echo off
REM ========================================
REM Automation Platform - Start Server
REM ========================================

echo.
echo ========================================
echo Starting Automation Platform...
echo ========================================
echo.

REM Check if setup has been run
if not exist node_modules (
    echo ERROR: Application not set up!
    echo.
    echo Please run setup first:
    echo   setup.bat         (if you have internet)
    echo   setup-offline.bat (if you have offline package)
    echo.
    pause
    exit /b 1
)

if not exist .env (
    echo WARNING: .env file not found!
    echo Creating from .env.example...
    copy .env.example .env
    echo.
    echo Please edit .env to configure AWX settings
    echo Or configure later via Settings page
    echo.
)

REM Display startup information
echo Server Configuration:
echo - Port: 3000 (default)
echo - Database: SQLite (prisma\dev.db)
echo - Mode: Development
echo.
echo The application will be available at:
echo   http://localhost:3000
echo.
echo To stop the server:
echo   Press Ctrl+C
echo.
echo Starting server...
echo.

REM Start the development server
call npm run dev

REM If server stops
echo.
echo Server stopped.
pause
