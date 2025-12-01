@echo off
title Everlast Intranet Backend Server
color 0A
echo ========================================
echo   Everlast Intranet Backend Server
echo ========================================
echo.

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%backend"

REM Change to backend directory
cd /d "%BACKEND_DIR%"
if errorlevel 1 (
    echo ERROR: Could not find backend directory at: %BACKEND_DIR%
    pause
    exit /b 1
)

echo Current directory: %CD%
echo.

echo [1/4] Checking dependencies...
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
echo [2/4] Generating Prisma client...
call npm run prisma:generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo [3/4] Checking database...
if not exist "prisma\dev.db" (
    echo Running database migrations...
    call npm run prisma:migrate
    if errorlevel 1 (
        echo ERROR: Failed to run migrations
        pause
        exit /b 1
    )
) else (
    echo Database exists
)

echo.
echo [4/4] Starting server...
echo.
echo ========================================
echo   Server starting on http://localhost:3001
echo   Press Ctrl+C to stop the server
echo ========================================
echo.

call npm run start:dev

pause
