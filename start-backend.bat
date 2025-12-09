@echo off
title Everlast Backend Server
cd /d "%~dp0backend"

echo ========================================
echo STARTING EVERLAST BACKEND SERVER
echo ========================================
echo.

REM [1/4] Check/Create .env file
echo [1/4] Checking .env file...
if not exist ".env" (
    echo Creating .env file...
    (
        echo DATABASE_URL=file:./prisma/dev.db
        echo PORT=3001
        echo JWT_SECRET=your-secret-key
    ) > .env
    echo .env file created
) else (
    echo .env file exists
)
echo.

REM [2/4] Check dependencies
echo [2/4] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
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

REM [3/4] Generate Prisma client
echo [3/4] Generating Prisma client...
call npm run prisma:generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)
echo.

REM [4/4] Start the server
echo [4/4] Starting backend server...
echo.
echo ========================================
echo Backend running on http://localhost:3001
echo Press Ctrl+C to stop the server
echo ========================================
echo.

call npm run start:dev
pause
