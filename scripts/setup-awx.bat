@echo off
REM AWX Setup Script for Windows
REM This script helps set up and configure AWX for testing the catalog system

setlocal enabledelayedexpansion

REM Check if Docker is running
echo Checking prerequisites...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not running.
    echo Please install Docker Desktop for Windows and ensure it's running.
    pause
    exit /b 1
)
echo [OK] Docker is installed

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed.
    echo Please install Docker Desktop for Windows which includes Docker Compose.
    pause
    exit /b 1
)
echo [OK] Docker Compose is installed

REM Parse command
set COMMAND=%1
if "%COMMAND%"=="" set COMMAND=help

if "%COMMAND%"=="setup" goto setup
if "%COMMAND%"=="start" goto start
if "%COMMAND%"=="stop" goto stop
if "%COMMAND%"=="status" goto status
if "%COMMAND%"=="playbook" goto playbook
if "%COMMAND%"=="logs" goto logs
if "%COMMAND%"=="cleanup" goto cleanup
if "%COMMAND%"=="help" goto help
goto help

:setup
echo.
echo ========================================
echo Starting AWX Setup
echo ========================================
echo.

echo Starting Docker containers...
docker-compose -f docker-compose.awx.yml up -d
if errorlevel 1 (
    echo [ERROR] Failed to start AWX containers
    pause
    exit /b 1
)

echo [OK] AWX containers started
echo.
echo Waiting for AWX to initialize (this may take 5-10 minutes)...
echo.

REM Wait for AWX to be ready
set /a attempt=0
set /a max_attempts=60

:wait_loop
curl -s http://localhost:8080/api/v2/ping/ >nul 2>&1
if not errorlevel 1 (
    echo.
    echo [OK] AWX is ready!
    goto copy_playbook
)

set /a attempt+=1
if !attempt! geq !max_attempts! (
    echo.
    echo [ERROR] AWX did not start within the expected time
    echo Check logs with: scripts\setup-awx.bat logs
    pause
    exit /b 1
)

echo|set /p="."
timeout /t 10 /nobreak >nul
goto wait_loop

:copy_playbook
echo.
echo Copying test playbook to AWX container...
docker cp awx-playbooks\test-playbook.yml awx-web:/var/lib/awx/projects/ 2>nul
if errorlevel 1 (
    echo [WARNING] Could not copy playbook. AWX may not be fully started yet.
    echo Run: scripts\setup-awx.bat playbook
) else (
    echo [OK] Test playbook copied successfully
)

echo.
echo ========================================
echo AWX Status
echo ========================================
docker-compose -f docker-compose.awx.yml ps

echo.
echo ========================================
echo Next Steps
echo ========================================
echo.
echo 1. Access AWX Web Interface:
echo    URL: http://localhost:8080
echo    Username: admin
echo    Password: password
echo.
echo 2. Create an API Token in AWX
echo 3. Update .env file with: AWX_TOKEN=your_token_here
echo 4. Create Job Template in AWX
echo 5. Create Catalog Item in application
echo.
echo For detailed instructions, see: AWX_QUICK_START.md
echo.
pause
exit /b 0

:start
echo Starting AWX containers...
docker-compose -f docker-compose.awx.yml up -d
echo [OK] AWX containers started
docker-compose -f docker-compose.awx.yml ps
pause
exit /b 0

:stop
echo Stopping AWX containers...
docker-compose -f docker-compose.awx.yml stop
echo [OK] AWX containers stopped
pause
exit /b 0

:status
echo ========================================
echo AWX Status
echo ========================================
docker-compose -f docker-compose.awx.yml ps
echo.
echo AWX Web Interface: http://localhost:8080
echo Default Credentials:
echo   Username: admin
echo   Password: password
pause
exit /b 0

:playbook
echo Copying test playbook to AWX container...
docker cp awx-playbooks\test-playbook.yml awx-web:/var/lib/awx/projects/
if errorlevel 1 (
    echo [ERROR] Failed to copy playbook
    pause
    exit /b 1
)
echo [OK] Test playbook copied successfully
pause
exit /b 0

:logs
echo ========================================
echo AWX Logs
echo ========================================
docker-compose -f docker-compose.awx.yml logs -f --tail=100 awx-web
exit /b 0

:cleanup
echo.
echo WARNING: This will remove all AWX data!
set /p confirm="Continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo Cleanup cancelled
    pause
    exit /b 0
)
echo Cleaning up AWX...
docker-compose -f docker-compose.awx.yml down -v
echo [OK] AWX containers and data removed
pause
exit /b 0

:help
echo.
echo AWX Setup Script for Windows
echo =============================
echo.
echo Commands:
echo   setup      - Check prerequisites and start AWX
echo   start      - Start AWX containers
echo   stop       - Stop AWX containers
echo   status     - Show AWX status
echo   playbook   - Copy test playbook to AWX
echo   logs       - Show AWX logs
echo   cleanup    - Remove AWX containers and data
echo   help       - Show this menu
echo.
echo Usage: scripts\setup-awx.bat [command]
echo.
pause
exit /b 0
