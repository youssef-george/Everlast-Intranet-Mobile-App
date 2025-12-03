@echo off
title Everlast Intranet Frontend Server
color 0B
echo ========================================
echo   Everlast Intranet Frontend Server
echo ========================================
echo.

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
set "FRONTEND_DIR=%SCRIPT_DIR%frontend"

REM Change to frontend directory
cd /d "%FRONTEND_DIR%"
if errorlevel 1 (
    echo ERROR: Could not find frontend directory at: %FRONTEND_DIR%
    pause
    exit /b 1
)

echo Current directory: %CD%
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set LOCAL_IP=%%a
    goto :found
)

:found
set LOCAL_IP=%LOCAL_IP:~1%

echo [1/2] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies, please wait...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed
)

echo.
echo [2/2] Starting frontend server...
echo.
echo ========================================
echo   Frontend Server Starting
echo ========================================
echo.
echo Local Access:
echo   http://localhost:5173
echo.
echo Network Access:
echo   http://%LOCAL_IP%:5173
echo.
echo ========================================
echo   Share this URL with others on your network:
echo   http://%LOCAL_IP%:5173
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev

pause
