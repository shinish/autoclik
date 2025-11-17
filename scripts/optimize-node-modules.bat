@echo off
REM Author: Shinish Sasidharan
REM Autoclik v1.0 - Automation Platform
REM ========================================
REM Optimize node_modules for Offline Package
REM Removes unnecessary files to reduce size
REM ========================================

echo.
echo ========================================
echo Optimizing node_modules
echo ========================================
echo.
echo This will remove unnecessary files from node_modules
echo to reduce the offline package size.
echo.
echo Files to be removed:
echo - Documentation (*.md, docs/, CHANGELOG, etc.)
echo - Test files (test/, *.test.js, *.spec.js)
echo - Example files
echo - Source maps (*.map)
echo - CI/CD configs
echo.
pause

echo.
echo Starting optimization...
echo.

REM Remove documentation files
echo [1/8] Removing documentation...
for /d /r node_modules %%d in (docs) do @if exist "%%d" rd /s /q "%%d" 2>nul
for /d /r node_modules %%d in (doc) do @if exist "%%d" rd /s /q "%%d" 2>nul
del /s /q node_modules\*.md >nul 2>&1
del /s /q node_modules\CHANGELOG* >nul 2>&1
del /s /q node_modules\README* >nul 2>&1
del /s /q node_modules\LICENSE* >nul 2>&1
echo Done.

REM Remove test files
echo [2/8] Removing test files...
for /d /r node_modules %%d in (test) do @if exist "%%d" rd /s /q "%%d" 2>nul
for /d /r node_modules %%d in (tests) do @if exist "%%d" rd /s /q "%%d" 2>nul
for /d /r node_modules %%d in (__tests__) do @if exist "%%d" rd /s /q "%%d" 2>nul
del /s /q node_modules\*.test.js >nul 2>&1
del /s /q node_modules\*.test.jsx >nul 2>&1
del /s /q node_modules\*.spec.js >nul 2>&1
del /s /q node_modules\*.spec.jsx >nul 2>&1
echo Done.

REM Remove example files
echo [3/8] Removing examples...
for /d /r node_modules %%d in (examples) do @if exist "%%d" rd /s /q "%%d" 2>nul
for /d /r node_modules %%d in (example) do @if exist "%%d" rd /s /q "%%d" 2>nul
for /d /r node_modules %%d in (demo) do @if exist "%%d" rd /s /q "%%d" 2>nul
echo Done.

REM Remove coverage and build artifacts
echo [4/8] Removing coverage and build artifacts...
for /d /r node_modules %%d in (coverage) do @if exist "%%d" rd /s /q "%%d" 2>nul
for /d /r node_modules %%d in (.nyc_output) do @if exist "%%d" rd /s /q "%%d" 2>nul
for /d /r node_modules %%d in (.cache) do @if exist "%%d" rd /s /q "%%d" 2>nul
echo Done.

REM Remove source maps
echo [5/8] Removing source maps...
del /s /q node_modules\*.map >nul 2>&1
echo Done.

REM Remove CI/CD configuration
echo [6/8] Removing CI/CD files...
del /s /q node_modules\.travis.yml >nul 2>&1
del /s /q node_modules\.gitlab-ci.yml >nul 2>&1
del /s /q node_modules\appveyor.yml >nul 2>&1
del /s /q node_modules\.circleci >nul 2>&1
echo Done.

REM Remove editor configs
echo [7/8] Removing editor configs...
del /s /q node_modules\.editorconfig >nul 2>&1
del /s /q node_modules\.eslintrc* >nul 2>&1
del /s /q node_modules\.prettierrc* >nul 2>&1
echo Done.

REM Remove miscellaneous unnecessary files
echo [8/8] Removing miscellaneous files...
del /s /q node_modules\.gitignore >nul 2>&1
del /s /q node_modules\.gitattributes >nul 2>&1
del /s /q node_modules\.npmignore >nul 2>&1
del /s /q node_modules\*.log >nul 2>&1
del /s /q node_modules\yarn.lock >nul 2>&1
echo Done.

echo.
echo ========================================
echo Optimization Complete!
echo ========================================
echo.
echo The node_modules folder has been optimized.
echo Typical size reduction: 50-150MB
echo.
echo Next steps:
echo 1. Run 'package-for-offline.bat' to create the offline package
echo 2. The optimized package will be significantly smaller
echo.
pause
