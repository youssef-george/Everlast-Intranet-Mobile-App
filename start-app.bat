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
set "FRONTEND_DIR=%SCRIPT_DIR%frontend"

echo [1/3] Setting up Backend...
cd /d "%BACKEND_DIR%"
if errorlevel 1 (
    echo ERROR: Could not find backend directory
    pause
    exit /b 1
)

REM Create .env if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    powershell -Command "@\"`nDATABASE_URL=`"postgres://postgres:H8nwxPNqzCLLQRNT1k93Q0c165yST38CkjIeJDUZxQqWCYBfmZQArmXEPFbcf9Oc@196.219.160.253:5443/postgres?sslmode=disable`"`nPORT=3001`n`"@ | Out-File -FilePath .env -Encoding utf8"
)

REM Generate Prisma client
echo Generating Prisma client...
call npm run prisma:generate
if errorlevel 1 (
    echo WARNING: Prisma client generation had issues
)

echo.
echo [2/3] Starting Backend Server...
echo Backend will run on: http://localhost:3001
echo.
start "Everlast Backend" cmd /k "cd /d %BACKEND_DIR% && npm run start:dev"

timeout /t 3 /nobreak >nul

echo.
echo [3/3] Starting Frontend Server...
cd /d "%FRONTEND_DIR%"
if errorlevel 1 (
    echo ERROR: Could not find frontend directory
    pause
    exit /b 1
)

echo Frontend will run on: http://localhost:5173
echo.
start "Everlast Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo ========================================
echo   Servers are starting...
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Two new windows have opened - one for each server.
echo Wait for both servers to finish starting, then open:
echo   http://localhost:5173
echo.
echo Press any key to exit this window...
pause >nul
