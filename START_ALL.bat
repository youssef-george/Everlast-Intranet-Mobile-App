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
echo   Starting Backend and Frontend Servers
echo ========================================
echo.
echo This will open 2 windows:
echo   1. Backend Server (Port 3001)
echo   2. Frontend Server (Port 5173)
echo.
echo Access URLs:
echo   Local:   http://localhost:5173
echo   Network: http://%LOCAL_IP%:5173
echo.
echo ========================================
echo.
pause

REM Start backend in new window
start "Everlast Backend" cmd /k "cd /d %~dp0backend && npm run start:dev"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "Everlast Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   Servers Starting...
echo ========================================
echo.
echo Backend and Frontend windows have been opened.
echo.
echo Access the app at:
echo   http://localhost:5173 (local)
echo   http://%LOCAL_IP%:5173 (network)
echo.
echo ========================================
echo.
pause
