@echo off
REM Author: Shinish Sasidharan
REM Autoclik v1.0 - Automation Platform
REM Batch script to reset the database
REM This will delete the existing database and create a fresh one with seed data

echo ========================================
echo Database Reset Script
echo ========================================
echo.

REM Step 1: Delete existing database
echo [1/3] Deleting existing database...

if exist "prisma\dev.db" (
    del /F /Q "prisma\dev.db"
    echo   √ Deleted dev.db
) else (
    echo   i dev.db not found (skipping)
)

if exist "prisma\dev.db-journal" (
    del /F /Q "prisma\dev.db-journal"
    echo   √ Deleted dev.db-journal
)

echo.

REM Step 2: Push Prisma schema to database
echo [2/3] Pushing Prisma schema to database...
call npx prisma db push --skip-generate

if %ERRORLEVEL% neq 0 (
    echo   × Prisma db push failed
    exit /b 1
)

echo   √ Schema pushed successfully
echo.

REM Step 3: Seed the database
echo [3/3] Seeding database...
call npm run prisma:seed

if %ERRORLEVEL% neq 0 (
    echo   × Database seeding failed
    exit /b 1
)

echo.
echo ========================================
echo √ Database reset completed successfully!
echo ========================================
echo.
echo Default admin login:
echo   Username: admin
echo   Password: admin123
echo.
