@echo off
title Everlast Intranet - Starting Servers
color 0A
echo ========================================
echo   Everlast Intranet - Starting Servers
echo ========================================
echo.

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%backend"

echo [1/2] Setting up Backend...
cd /d "%BACKEND_DIR%"
if errorlevel 1 (
    echo ERROR: Could not find backend directory
    pause
    exit /b 1
)

REM Create .env if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    powershell -Command "@\"`nDATABASE_URL=`"file:./prisma/dev.db`"`nPORT=3001`n`"@ | Out-File -FilePath .env -Encoding utf8"
)

REM Generate Prisma client
echo Generating Prisma client...
call npm run prisma:generate
if errorlevel 1 (
    echo WARNING: Prisma client generation had issues
)

echo.
echo [2/2] Starting Backend Server...
echo Backend will run on: http://localhost:3001
echo.
start "Everlast Backend" cmd /k "cd /d %BACKEND_DIR% && npm run start:dev"

echo.
echo ========================================
echo   Backend Server is starting...
echo ========================================
echo.
echo Backend API:  http://localhost:3001/api
echo.
echo Note: This is a mobile app backend.
echo Use the React Native mobile app to connect.
echo.
echo Press any key to exit this window...
pause >nul
