@echo off
cd /d "%~dp0"

echo Creating .env file...
(
echo DATABASE_URL=file:./prisma/dev.db
echo PORT=3001
echo JWT_SECRET=your-secret-key-here
) > .env

echo.
echo .env file created with contents:
type .env
echo.

echo Generating Prisma client...
call npm run prisma:generate
echo.

echo Testing database connection...
node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); console.log('Connecting...'); prisma.$connect().then(() => { console.log('SUCCESS: Connected to database!'); return prisma.$disconnect(); }).catch(err => { console.error('FAILED:', err.message); console.error('Error code:', err.code); process.exit(1); });"

if errorlevel 1 (
    echo.
    echo ========================================
    echo DATABASE CONNECTION FAILED
    echo ========================================
    echo.
    echo This might be due to:
    echo 1. Firewall blocking port 5443
    echo 2. SSL certificate issues
    echo 3. Network connectivity
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Starting Backend Server...
echo ========================================
echo.
npm run start:dev
