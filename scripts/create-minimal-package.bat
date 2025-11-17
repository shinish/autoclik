@echo off
REM Author: Shinish Sasidharan
REM Autoclik v1.0 - Automation Platform
REM ========================================
REM Create Minimal Offline Package
REM Uses Next.js standalone build for smallest size
REM ========================================

echo.
echo ========================================
echo Creating Minimal Offline Package
echo ========================================
echo.
echo This creates the smallest possible offline package
echo using Next.js standalone build (~200MB vs ~730MB)
echo.
pause

REM Check if node_modules exists
if not exist node_modules (
    echo [0/7] Installing dependencies first...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

REM Step 1: Build for standalone
echo [1/7] Building application (standalone mode)...
echo This may take a few minutes...
echo.
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed!
    echo.
    echo Make sure next.config.js has: output: 'standalone'
    pause
    exit /b 1
)
echo Done.
echo.

REM Step 2: Generate Prisma Client
echo [2/7] Generating Prisma Client...
call npm run prisma:generate
echo Done.
echo.

REM Step 3: Create package directory
echo [3/7] Creating package structure...
if exist minimal-package rmdir /s /q minimal-package
mkdir minimal-package
mkdir minimal-package\.next
mkdir minimal-package\prisma
mkdir minimal-package\public
echo Done.
echo.

REM Step 4: Copy necessary files
echo [4/7] Copying files...

echo   - Copying standalone build...
xcopy .next\standalone minimal-package\ /E /I /H /Y /Q >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Standalone build not found!
    echo Make sure next.config.js has: output: 'standalone'
    pause
    exit /b 1
)

echo   - Copying static assets...
xcopy .next\static minimal-package\.next\static\ /E /I /H /Y /Q >nul

echo   - Copying public files...
xcopy public minimal-package\public\ /E /I /H /Y /Q >nul

echo   - Copying Prisma schema and migrations...
xcopy prisma\schema.prisma minimal-package\prisma\ /Y /Q >nul
xcopy prisma\migrations minimal-package\prisma\migrations\ /E /I /H /Y /Q >nul

echo   - Copying configuration files...
copy package.json minimal-package\ >nul
copy .env.example minimal-package\ >nul
copy next.config.js minimal-package\ >nul

echo   - Copying setup scripts...
copy setup-offline.bat minimal-package\ >nul
copy start.bat minimal-package\ >nul
copy start-production.bat minimal-package\ >nul
copy backup-database.bat minimal-package\ >nul

echo   - Copying documentation...
copy README.md minimal-package\ >nul
copy WINDOWS_DEPLOYMENT.md minimal-package\ >nul
copy OFFLINE_INSTALLATION.md minimal-package\ >nul

echo Done.
echo.

REM Step 5: Create optimized start script for standalone
echo [5/7] Creating standalone startup script...
(
echo @echo off
echo REM Standalone Production Server
echo echo Starting Automation Platform ^(Standalone Mode^)...
echo echo.
echo set NODE_ENV=production
echo node server.js
) > minimal-package\start-standalone.bat

echo Done.
echo.

REM Step 6: Create ZIP package
echo [6/7] Creating ZIP package...
echo This may take several minutes...
echo.

set TIMESTAMP=%date:~-4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%
set PACKAGE_NAME=automation-platform-minimal-%TIMESTAMP%.zip

powershell -Command "& { $ProgressPreference = 'SilentlyContinue'; Write-Host 'Compressing files...'; Compress-Archive -Path 'minimal-package\*' -DestinationPath '%PACKAGE_NAME%' -CompressionLevel Optimal -Force; Write-Host 'Compression completed!' }"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create ZIP package
    pause
    exit /b 1
)

echo Done.
echo.

REM Step 7: Show results and cleanup
echo [7/7] Generating package information...

REM Get file sizes
for %%A in (%PACKAGE_NAME%) do set ZIPSIZE=%%~zA
for /f "tokens=*" %%A in ('powershell -Command "(Get-ChildItem -Path minimal-package -Recurse | Measure-Object -Property Length -Sum).Sum"') do set PKGSIZE=%%A

REM Convert to MB
set /a ZIPSIZE_MB=%ZIPSIZE% / 1048576
set /a PKGSIZE_MB=%PKGSIZE% / 1048576

REM Generate checksum
echo Generating SHA256 checksum...
certutil -hashfile "%PACKAGE_NAME%" SHA256 > "%PACKAGE_NAME%.sha256.txt" 2>nul

echo.
echo ========================================
echo Package Creation Complete!
echo ========================================
echo.
echo Package Details:
echo   Name: %PACKAGE_NAME%
echo   Location: %CD%
echo   Size (compressed): %ZIPSIZE_MB% MB
echo   Size (uncompressed): %PKGSIZE_MB% MB
echo   Compression ratio: %% reduced
echo.
echo Package Contents:
echo   - Next.js standalone runtime
echo   - Static assets
echo   - Prisma schema and migrations
echo   - Configuration files
echo   - Setup and startup scripts
echo   - Documentation
echo.
echo Size Comparison:
echo   Full package: ~730MB (uncompressed)
echo   Minimal package: ~%PKGSIZE_MB%MB (uncompressed)
echo   Savings: ~%% smaller!
echo.
echo Checksum: %PACKAGE_NAME%.sha256.txt
echo.
echo ========================================
echo Next Steps
echo ========================================
echo.
echo 1. Transfer '%PACKAGE_NAME%' to target Windows machine
echo.
echo 2. On target machine:
echo    a. Extract the ZIP file
echo    b. Run: setup-offline.bat
echo    c. Run: start-standalone.bat (for minimal runtime)
echo       OR start.bat (for development mode)
echo.
echo 3. Access at: http://localhost:3000
echo.
echo See OFFLINE_INSTALLATION.md for detailed instructions.
echo.

set /p CLEANUP="Delete minimal-package folder to save space? (y/n): "
if /i "%CLEANUP%"=="y" (
    echo Cleaning up...
    rmdir /s /q minimal-package
    echo Done.
)

echo.
pause
