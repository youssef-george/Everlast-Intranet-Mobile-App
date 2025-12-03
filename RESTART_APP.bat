@echo off
title Restart Everlast Intranet App
color 0A
echo ========================================
echo   Restarting Everlast Intranet App
echo ========================================
echo.

REM Kill existing processes on ports 3001 and 5173
echo [1/3] Stopping existing servers...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173"') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo ✅ Existing servers stopped
echo.

REM Start backend
echo [2/3] Starting backend server...
start "Everlast Backend" cmd /k "cd /d %~dp0backend && npm run start:dev"
timeout /t 3 /nobreak >nul
echo ✅ Backend server starting on http://localhost:3001
echo.

REM Start frontend
echo [3/3] Starting frontend server...
start "Everlast Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul
echo ✅ Frontend server starting on http://localhost:5173
echo.

echo ========================================
echo   ✅ App Restarted Successfully!
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Two new windows have opened for the servers.
echo Close them to stop the servers.
echo.
pause

