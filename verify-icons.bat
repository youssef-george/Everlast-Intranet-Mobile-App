@echo off
echo ========================================
echo Verifying PWA Icon Files
echo ========================================
echo.

cd /d "%~dp0"

echo Checking source file...
if exist "cropped-EWMC-Logo-1.png" (
    echo [OK] Source file found: cropped-EWMC-Logo-1.png
) else (
    echo [ERROR] Source file NOT found: cropped-EWMC-Logo-1.png
    echo Please ensure the logo file is in the root directory
    pause
    exit /b 1
)

echo.
echo Copying files to frontend\public\...
copy /Y "cropped-EWMC-Logo-1.png" "frontend\public\icon.png" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Failed to copy icon.png
) else (
    echo [OK] icon.png copied
)

copy /Y "cropped-EWMC-Logo-1.png" "frontend\public\apple-touch-icon.png" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Failed to copy apple-touch-icon.png
) else (
    echo [OK] apple-touch-icon.png copied
)

echo.
echo Verifying files...
if exist "frontend\public\icon.png" (
    echo [OK] icon.png exists in public folder
) else (
    echo [ERROR] icon.png NOT found in public folder
)

if exist "frontend\public\apple-touch-icon.png" (
    echo [OK] apple-touch-icon.png exists in public folder
) else (
    echo [ERROR] apple-touch-icon.png NOT found in public folder
)

echo.
echo ========================================
echo IMPORTANT: Restart your dev server!
echo ========================================
echo 1. Stop the current server (Ctrl+C)
echo 2. Run: cd frontend && npm run dev
echo 3. Hard refresh browser (Ctrl+Shift+R)
echo.
pause
