@echo off
echo ========================================
echo Starting Everlast Intranet Backend
echo ========================================
cd /d "%~dp0backend"
echo.
echo [1/4] Checking dependencies...
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
    echo Database not found. Running migrations...
    call npx prisma migrate dev
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
echo Server starting on http://localhost:3001
echo Press Ctrl+C to stop the server
echo ========================================
echo.
call npm run start:dev
pause
