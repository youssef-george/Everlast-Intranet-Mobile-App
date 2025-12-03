@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

echo.
echo ========================================
echo   EVERLAST INTRANET - BACKEND SETUP
echo ========================================
echo.

cd /d "%~dp0"

REM Step 1: Create .env file
echo [1/5] Creating .env file...
(
echo DATABASE_URL=postgres://postgres:H8nwxPNqzCLLQRNT1k93Q0c165yST38CkjIeJDUZxQqWCYBfmZQArmXEPFbcf9Oc@196.219.160.253:5443/postgres?sslmode=require
echo PORT=3001
echo JWT_SECRET=your-secret-key-change-in-production
) > .env

if exist .env (
    echo    SUCCESS: .env file created
) else (
    echo    ERROR: Could not create .env file
    pause
    exit /b 1
)
echo.

REM Step 2: Verify .env contents
echo [2/5] Verifying .env contents...
type .env
echo.
echo.

REM Step 3: Generate Prisma client
echo [3/5] Generating Prisma client...
call npm run prisma:generate 2>&1
if errorlevel 1 (
    echo    ERROR: Prisma generation failed
    pause
    exit /b 1
)
echo    SUCCESS: Prisma client generated
echo.

REM Step 4: Test connection
echo [4/5] Testing database connection...
echo    Attempting to connect to PostgreSQL at 196.219.160.253:5443...
node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.$connect().then(() => { console.log('    SUCCESS: Database connection established!'); return p.$disconnect(); }).catch(e => { console.error('    ERROR: Connection failed -', e.message); process.exit(1); });"

if errorlevel 1 (
    echo.
    echo ========================================
    echo   DATABASE CONNECTION FAILED!
    echo ========================================
    echo.
    echo Possible causes:
    echo  1. Firewall blocking port 5443
    echo  2. SSL/TLS certificate issues
    echo  3. Wrong credentials
    echo  4. Server not reachable
    echo.
    echo Please check:
    echo  - Is the database server online?
    echo  - Can you ping 196.219.160.253?
    echo  - Is port 5443 open?
    echo.
    pause
    exit /b 1
)
echo.

REM Step 5: Start the server
echo [5/5] Starting Backend Server...
echo.
echo ========================================
echo   Backend will run on: http://localhost:3001
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

npm run start:dev

pause
