@echo off
REM Author: Shinish Sasidharan
REM Autoclik v1.0 - Automation Platform
REM ========================================
REM Create Offline Installation Package
REM ========================================

echo.
echo ========================================
echo Automation Platform
echo Offline Package Creator
echo ========================================
echo.
echo This script creates a portable package for offline installation
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo ERROR: node_modules not found!
    echo.
    echo Please run 'npm install' first to download all dependencies.
    echo.
    pause
    exit /b 1
)

REM Check if PowerShell is available for compression
where powershell >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PowerShell not found!
    echo PowerShell is required for creating the ZIP package.
    pause
    exit /b 1
)

echo [1/5] Preparing package...
echo.

REM Create output directory
if not exist offline-package mkdir offline-package

REM Get version from package.json (optional)
echo [2/5] Reading version information...
for /f "tokens=2 delims=:, " %%a in ('type package.json ^| findstr "version"') do (
    set VERSION=%%a
)
set VERSION=%VERSION:"=%
echo Version: %VERSION%
echo.

REM Clean unnecessary files before packaging
echo [3/5] Cleaning temporary files...
if exist .next\cache rmdir /s /q .next\cache
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo ✓ Cleaned
echo.

REM Build for production (optional)
set /p BUILD="Build for production before packaging? (y/n): "
if /i "%BUILD%"=="y" (
    echo Building application...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo WARNING: Build failed, continuing anyway...
    ) else (
        echo ✓ Build completed
    )
)
echo.

REM Create the ZIP package
echo [4/5] Creating ZIP package...
echo This may take several minutes (730MB+ to compress)...
echo.

REM Set package name with timestamp
set TIMESTAMP=%date:~-4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%
set PACKAGE_NAME=automation-platform-v%VERSION%-offline-%TIMESTAMP%.zip

echo Creating: %PACKAGE_NAME%
echo.

REM Use PowerShell to create ZIP (excludes unnecessary files)
powershell -Command "& { ^
    $ProgressPreference = 'SilentlyContinue'; ^
    Write-Host 'Compressing files...'; ^
    $exclude = @('*.log', '*.tmp', '.git*', 'offline-package', '*.zip'); ^
    $files = Get-ChildItem -Path '.' -Exclude $exclude -Recurse; ^
    Compress-Archive -Path $files -DestinationPath 'offline-package\%PACKAGE_NAME%' -CompressionLevel Optimal -Force; ^
    Write-Host 'Compression completed!' ^
}"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to create ZIP package
    pause
    exit /b 1
)

echo ✓ Package created
echo.

REM Display package information
echo [5/5] Package Information
echo ========================================
for %%A in (offline-package\%PACKAGE_NAME%) do (
    set SIZE=%%~zA
)

REM Convert bytes to MB
set /a SIZE_MB=%SIZE% / 1048576

echo Package name: %PACKAGE_NAME%
echo Location: %CD%\offline-package\
echo Size: %SIZE_MB% MB
echo.
echo ========================================
echo Package Creation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Transfer the package to your target Windows machine via:
echo    - USB drive
echo    - Network share
echo    - CD/DVD
echo.
echo 2. On the target machine:
echo    a. Extract the ZIP file
echo    b. Run: setup-offline.bat
echo    c. Run: start.bat
echo.
echo See OFFLINE_INSTALLATION.md for detailed instructions.
echo.

REM Optional: Generate checksum for verification
echo Generating SHA256 checksum for verification...
certutil -hashfile "offline-package\%PACKAGE_NAME%" SHA256 > "offline-package\%PACKAGE_NAME%.sha256.txt"
echo ✓ Checksum saved to: %PACKAGE_NAME%.sha256.txt
echo.

REM Display checksum
echo SHA256 Checksum:
type "offline-package\%PACKAGE_NAME%.sha256.txt"
echo.
echo Use this checksum to verify package integrity on target machine.
echo.

pause
