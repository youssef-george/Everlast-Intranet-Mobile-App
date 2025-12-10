@echo off
title Run Mobile App on Emulator
color 0A
echo ========================================
echo   Running Mobile App on Android Emulator
echo ========================================
echo.

cd /d "%~dp0mobile"

echo [1/4] Checking if emulator is running...
adb devices >nul 2>&1
if errorlevel 1 (
    echo.
    echo ⚠️  ADB not found in PATH
    echo.
    echo Please:
    echo 1. Make sure Android Studio is installed
    echo 2. Start Android Emulator from Android Studio
    echo 3. Add Android SDK platform-tools to PATH, or use full path:
    echo    C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools\adb.exe
    echo.
    pause
    exit /b 1
)

adb devices | findstr "device" >nul
if errorlevel 1 (
    echo ❌ No emulator or device detected
    echo.
    echo Please:
    echo 1. Open Android Studio
    echo 2. Start an Android Emulator (Tools → Device Manager)
    echo 3. Wait for emulator to fully boot
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ Emulator detected
echo.

echo [2/4] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies (this may take a few minutes)...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependencies already installed
)
echo.

echo [3/4] Starting Metro bundler in background...
start "Metro Bundler" cmd /k "cd /d %~dp0mobile && npm start"
timeout /t 3 /nobreak >nul
echo ✅ Metro bundler started
echo.

echo [4/4] Building and installing app on emulator...
echo This may take 5-10 minutes on first build...
echo.
call npm run android

if errorlevel 1 (
    echo.
    echo ❌ Build failed
    echo.
    echo Common fixes:
    echo 1. Make sure emulator is fully booted
    echo 2. Check Android Studio SDK is installed
    echo 3. Try: cd android && gradlew clean && cd .. && npm run android
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ App should now be running on emulator!
echo ========================================
echo.
echo If app doesn't appear:
echo 1. Check Metro bundler window for errors
echo 2. Shake emulator (Ctrl+M) and select Reload
echo 3. Check backend is running on port 3001
echo.
pause

