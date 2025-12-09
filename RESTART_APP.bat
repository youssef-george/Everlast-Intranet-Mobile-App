@echo off
title Restart Everlast Intranet App
color 0A
echo ========================================
echo   Restarting Everlast Intranet App
echo ========================================
echo.

REM Kill existing processes on port 3001
echo [1/2] Stopping existing backend server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo ✅ Existing server stopped
echo.

REM Start backend
echo [2/2] Starting backend server...
start "Everlast Backend" cmd /k "cd /d %~dp0backend && npm run start:dev"
timeout /t 3 /nobreak >nul
echo ✅ Backend server starting on http://localhost:3001
echo.

echo ========================================
echo   ✅ Backend Restarted Successfully!
echo ========================================
echo.
echo Backend API: http://localhost:3001/api
echo.
echo Note: This is a mobile app backend.
echo Use the React Native mobile app to connect.
echo.
echo A new window has opened for the backend server.
echo Close it to stop the server.
echo.
pause

