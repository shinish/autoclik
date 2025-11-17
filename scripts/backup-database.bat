@echo off
REM Author: Shinish Sasidharan
REM Autoclik v1.0 - Automation Platform
REM ========================================
REM Backup Database
REM ========================================

echo.
echo ========================================
echo Database Backup Utility
echo ========================================
echo.

REM Check if database exists
if not exist prisma\dev.db (
    echo ERROR: Database file not found!
    echo Location: prisma\dev.db
    echo.
    pause
    exit /b 1
)

REM Create backups directory
if not exist backups mkdir backups

REM Generate backup filename with timestamp
set TIMESTAMP=%date:~-4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_NAME=dev.db.backup-%TIMESTAMP%

echo Creating backup...
echo.
echo Source: prisma\dev.db
echo Destination: backups\%BACKUP_NAME%
echo.

REM Copy database file
copy prisma\dev.db backups\%BACKUP_NAME%

if %ERRORLEVEL% EQU 0 (
    REM Get file size
    for %%A in (backups\%BACKUP_NAME%) do set SIZE=%%~zA
    set /a SIZE_KB=%SIZE% / 1024

    echo ✓ Backup created successfully!
    echo.
    echo Backup details:
    echo - File: %BACKUP_NAME%
    echo - Size: %SIZE_KB% KB
    echo - Location: %CD%\backups\
    echo.

    REM List all backups
    echo All backups:
    dir /b backups\*.backup-*
    echo.
) else (
    echo ERROR: Backup failed!
    echo.
)

pause
