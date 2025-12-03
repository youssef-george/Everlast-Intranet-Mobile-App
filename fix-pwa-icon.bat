@echo off
echo ========================================
echo Fixing PWA Icon Issue
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Checking source file...
if not exist "cropped-EWMC-Logo-1.png" (
    echo [ERROR] Source file NOT found!
    echo Please ensure cropped-EWMC-Logo-1.png is in the root directory
    pause
    exit /b 1
)
echo [OK] Source file found

echo.
echo Step 2: Copying icon files...
copy /Y "cropped-EWMC-Logo-1.png" "frontend\public\icon.png" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Failed to copy icon.png
    pause
    exit /b 1
)
echo [OK] icon.png copied

copy /Y "cropped-EWMC-Logo-1.png" "frontend\public\apple-touch-icon.png" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Failed to copy apple-touch-icon.png
    pause
    exit /b 1
)
echo [OK] apple-touch-icon.png copied

echo.
echo Step 3: Verifying files...
if exist "frontend\public\icon.png" (
    echo [OK] icon.png verified
) else (
    echo [ERROR] icon.png NOT found after copy!
    pause
    exit /b 1
)

if exist "frontend\public\apple-touch-icon.png" (
    echo [OK] apple-touch-icon.png verified
) else (
    echo [ERROR] apple-touch-icon.png NOT found after copy!
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Files are ready.
echo ========================================
echo.
echo IMPORTANT NEXT STEPS:
echo.
echo 1. STOP your dev server (Press Ctrl+C)
echo.
echo 2. Clear browser cache and service worker:
echo    - Open DevTools (F12)
echo    - Go to Application tab
echo    - Click "Service Workers" - Unregister all
echo    - Click "Storage" - Clear site data
echo.
echo 3. RESTART dev server:
echo    cd frontend
echo    npm run dev
echo.
echo 4. Hard refresh browser (Ctrl+Shift+R)
echo.
echo 5. Check if icon loads: http://localhost:5173/icon.png
echo.
pause
