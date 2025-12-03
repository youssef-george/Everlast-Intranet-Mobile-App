@echo off
echo ========================================
echo Update PWA Icon - Quick Guide
echo ========================================
echo.
echo The PWA icon is cached by Windows/browser.
echo To see the new icon, you MUST uninstall and reinstall.
echo.
echo ========================================
echo STEP 1: Uninstall Existing PWA
echo ========================================
echo.
echo Option A - From Desktop:
echo   1. Right-click the "Everlast Intranet" shortcut
echo   2. Click "Uninstall" or "Remove"
echo.
echo Option B - From Chrome Apps:
echo   1. Open: chrome://apps
echo   2. Find "Everlast Intranet"
echo   3. Right-click → Remove
echo.
echo ========================================
echo STEP 2: Clear Browser Cache
echo ========================================
echo.
echo 1. Open DevTools (F12)
echo 2. Application tab → Service Workers → Unregister all
echo 3. Application tab → Storage → Clear site data
echo 4. Close DevTools
echo.
echo ========================================
echo STEP 3: Restart Dev Server
echo ========================================
echo.
echo 1. Stop current server (Ctrl+C)
echo 2. Run: cd frontend && npm run dev
echo.
echo ========================================
echo STEP 4: Reinstall PWA
echo ========================================
echo.
echo 1. Open: http://localhost:5173
echo 2. Click install icon (➕) in address bar
echo 3. Click "Install"
echo 4. New icon should appear!
echo.
echo ========================================
echo.
pause
