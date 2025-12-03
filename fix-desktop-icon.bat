@echo off
echo ========================================
echo Fix Desktop PWA Icon
echo ========================================
echo.
echo The desktop shortcut icon is cached separately.
echo We need to delete the shortcut and recreate it.
echo.
echo ========================================
echo STEP 1: Delete Desktop Shortcut
echo ========================================
echo.
echo 1. Go to your Desktop
echo 2. Find "Everlast Intranet" shortcut
echo 3. Right-click → Delete (or press Delete key)
echo.
echo ========================================
echo STEP 2: Clear Windows Icon Cache
echo ========================================
echo.
echo This will clear Windows icon cache to force refresh...
echo.
pause

REM Clear Windows icon cache
taskkill /f /im explorer.exe >nul 2>&1
timeout /t 2 /nobreak >nul
del /a /q "%localappdata%\IconCache.db" >nul 2>&1
del /a /f /q "%localappdata%\Microsoft\Windows\Explorer\iconcache*" >nul 2>&1
start explorer.exe
timeout /t 2 /nobreak >nul

echo.
echo [OK] Icon cache cleared
echo.
echo ========================================
echo STEP 3: Reinstall PWA
echo ========================================
echo.
echo 1. Open browser: http://localhost:5173
echo 2. Click install icon (➕) in address bar
echo 3. Click "Install"
echo 4. A new shortcut will be created with correct icon
echo.
echo ========================================
echo.
echo If icon still shows old logo:
echo 1. Right-click desktop shortcut → Properties
echo 2. Click "Change Icon" button
echo 3. Browse to: frontend\public\icon.png
echo 4. Click OK
echo.
pause
