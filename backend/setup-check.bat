@echo off
title Backend Setup Check
cd /d "%~dp0"

echo ========================================
echo Backend Setup Diagnostic
echo ========================================
echo.

echo [1/4] Checking database connection...
node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.$connect().then(() => { console.log('✅ Database connected'); return p.$disconnect(); }).catch(e => { console.error('❌ Database connection failed:', e.message); process.exit(1); });"

if errorlevel 1 (
    echo.
    echo ❌ FAILED: Cannot connect to database
    echo 🔧 FIX: Make sure PostgreSQL is running and .env is configured correctly
    echo.
    pause
    exit /b 1
)

echo.
echo [2/4] Checking database schema...
node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.count().then(count => { console.log('✅ Database schema is valid'); return p.$disconnect(); }).catch(e => { console.error('❌ Database schema error:', e.message); process.exit(1); });"

if errorlevel 1 (
    echo.
    echo ❌ FAILED: Database schema is not set up
    echo 🔧 FIX: Run "npx prisma db push" to create the tables
    echo.
    pause
    exit /b 1
)

echo.
echo [3/4] Checking for Super Admin...
node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.findMany({ where: { role: 'SUPER_ADMIN' } }).then(admins => { if (admins.length === 0) { console.log('❌ No Super Admin found'); process.exit(1); } else { console.log('✅ Super Admin exists:', admins[0].name, '-', admins[0].email); } return p.$disconnect(); }).catch(e => { console.error('Error:', e.message); process.exit(1); });"

if errorlevel 1 (
    echo.
    echo ❌ FAILED: No Super Admin account exists
    echo 🔧 FIX: Run "create-admin.bat" to create a super admin
    echo.
    pause
    exit /b 1
)

echo.
echo [4/4] Checking total users...
node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.count().then(count => { console.log('✅ Total users in database:', count); return p.$disconnect(); }).catch(e => { console.error('Error:', e.message); process.exit(1); });"

echo.
echo ========================================
echo ✅ ALL CHECKS PASSED!
echo ========================================
echo Your backend is properly configured.
echo You can now start the server with: npm run start:dev
echo.
pause
