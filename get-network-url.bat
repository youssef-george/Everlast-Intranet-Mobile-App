@echo off
title Get Network Access URL
echo ========================================
echo   Network Access Information
echo ========================================
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set LOCAL_IP=%%a
    goto :found
)

:found
set LOCAL_IP=%LOCAL_IP:~1%

echo Your Local IP Address: %LOCAL_IP%
echo.
echo ========================================
echo   Access URLs:
echo ========================================
echo.
echo Frontend (Web App):
echo   http://%LOCAL_IP%:5173
echo   http://localhost:5173
echo.
echo Backend API:
echo   http://%LOCAL_IP%:3001
echo   http://localhost:3001
echo.
echo ========================================
echo   To access from other devices:
echo ========================================
echo.
echo 1. Make sure both devices are on the same network
echo 2. Open browser on other device
echo 3. Go to: http://%LOCAL_IP%:5173
echo.
echo ========================================
echo.
pause
