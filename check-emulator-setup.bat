@echo off
title Check Emulator Setup
color 0E
echo ========================================
echo   Checking Emulator Setup
echo ========================================
echo.

echo [1/5] Checking Android SDK...
set "SDK_PATH=%LOCALAPPDATA%\Android\Sdk"
if exist "%SDK_PATH%" (
    echo ✅ Android SDK found at: %SDK_PATH%
) else (
    echo ❌ Android SDK not found
    echo    Expected location: %SDK_PATH%
    echo    Please install Android Studio
)
echo.

echo [2/5] Checking ADB...
set "ADB_PATH=%SDK_PATH%\platform-tools\adb.exe"
if exist "%ADB_PATH%" (
    echo ✅ ADB found
    "%ADB_PATH%" devices
) else (
    echo ❌ ADB not found at: %ADB_PATH%
    echo    Please install Android SDK Platform-Tools
)
echo.

echo [3/5] Checking if emulator is running...
"%ADB_PATH%" devices 2>nul | findstr "emulator" >nul
if errorlevel 1 (
    echo ❌ No emulator detected
    echo.
    echo Please:
    echo 1. Open Android Studio
    echo 2. Start an Android Emulator
    echo 3. Wait for it to fully boot
    echo 4. Run this check again
) else (
    echo ✅ Emulator is running
)
echo.

echo [4/5] Checking mobile dependencies...
cd /d "%~dp0mobile"
if exist "node_modules" (
    echo ✅ Dependencies installed
) else (
    echo ❌ Dependencies not installed
    echo    Run: cd mobile && npm install
)
echo.

echo [5/5] Checking backend...
cd /d "%~dp0backend"
if exist "node_modules" (
    echo ✅ Backend dependencies installed
) else (
    echo ❌ Backend dependencies not installed
    echo    Run: cd backend && npm install
)
echo.

echo ========================================
echo   Setup Check Complete
echo ========================================
echo.
echo Next steps:
echo 1. Make sure emulator is running
echo 2. Start backend: cd backend && npm run start:dev
echo 3. Start Metro: cd mobile && npm start
echo 4. Run app: cd mobile && npm run android
echo.
pause

