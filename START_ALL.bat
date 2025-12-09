@echo off
title Everlast Intranet - Start All Servers
color 0E
echo ========================================
echo   Everlast Intranet - Start All Servers
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
echo   Starting Backend Server
echo ========================================
echo.
echo This will open 1 window:
echo   1. Backend Server (Port 3001)
echo.
echo Backend API URL:
echo   Local:   http://localhost:3001/api
echo   Network: http://%LOCAL_IP%:3001/api
echo.
echo Note: This is a mobile app backend.
echo Use the React Native mobile app to connect.
echo.
echo ========================================
echo.
pause

REM Start backend in new window
start "Everlast Backend" cmd /k "cd /d %~dp0backend && npm run start:dev"

echo.
echo ========================================
echo   Backend Server Starting...
echo ========================================
echo.
echo Backend window has been opened.
echo.
echo Backend API is available at:
echo   http://localhost:3001/api (local)
echo   http://%LOCAL_IP%:3001/api (network)
echo.
echo ========================================
echo.
pause
