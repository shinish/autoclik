@echo off
REM ========================================
REM Automation Platform - Production Server
REM ========================================

echo.
echo ========================================
echo Starting Automation Platform (Production)
echo ========================================
echo.

REM Check if application is built
if not exist .next (
    echo ERROR: Application not built for production!
    echo.
    echo Please build first:
    echo   npm run build
    echo.
    pause
    exit /b 1
)

REM Set production environment
set NODE_ENV=production

echo Server Configuration:
echo - Port: 3000 (default)
echo - Database: SQLite (prisma\dev.db)
echo - Mode: Production
echo - Environment: %NODE_ENV%
echo.
echo The application will be available at:
echo   http://localhost:3000
echo.
echo To stop the server:
echo   Press Ctrl+C
echo.
echo Starting production server...
echo.

REM Start the production server
call npm start

echo.
echo Server stopped.
pause
