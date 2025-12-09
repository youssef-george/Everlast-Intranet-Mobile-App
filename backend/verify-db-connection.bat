@echo off
echo ========================================
echo Verifying SQLite Database Connection
echo ========================================
echo.

cd /d "%~dp0"

echo Checking .env file...
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create .env file with DATABASE_URL
    pause
    exit /b 1
)

echo .env file exists
echo.

echo Testing database connection...
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => { console.log('✅ Database connected successfully!'); return prisma.$disconnect(); }).catch(err => { console.error('❌ Connection failed:', err.message); process.exit(1); });"

if errorlevel 1 (
    echo.
    echo ERROR: Database connection failed!
    echo Please check your DATABASE_URL in .env file
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Database connection verified!
echo ========================================
echo.
pause

