@echo off
title Backend Complete Setup
cd /d "%~dp0"

echo ========================================
echo Complete Backend Setup
echo ========================================
echo.
echo This script will:
echo 1. Check database connection
echo 2. Set up database schema (if needed)
echo 3. Create super admin (if needed)
echo 4. Verify everything is working
echo.
pause

echo.
echo ========================================
echo Step 1: Database Connection
echo ========================================
echo.

node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.$connect().then(() => { console.log('✅ Database connected'); return p.$disconnect(); }).catch(e => { console.error('❌ Database connection failed'); console.error('Error:', e.message); console.error(''); console.error('FIX: Check your .env file and make sure DATABASE_URL is set correctly'); process.exit(1); });"

if errorlevel 1 (
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 2: Database Schema
echo ========================================
echo.
echo Checking if database tables exist...

node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.count().then(() => { console.log('✅ Database schema exists'); return p.$disconnect(); }).catch(() => { console.log('⚠️ Database schema missing - will create it now'); process.exit(1); });"

if errorlevel 1 (
    echo.
    echo Creating database schema...
    call npx prisma db push --skip-generate
    if errorlevel 1 (
        echo ❌ Failed to create database schema
        pause
        exit /b 1
    )
    echo ✅ Database schema created
)

echo.
echo ========================================
echo Step 3: Super Admin Account
echo ========================================
echo.
echo Checking for super admin...

node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.findMany({ where: { role: 'SUPER_ADMIN' } }).then(admins => { if (admins.length > 0) { console.log('✅ Super Admin exists:', admins[0].name, '-', admins[0].email); process.exit(0); } else { console.log('⚠️ No super admin found - will create one now'); process.exit(1); } return p.$disconnect(); }).catch(e => { console.error('Error:', e.message); process.exit(1); });"

if errorlevel 1 (
    echo.
    echo Creating Super Admin: Youssef George
    node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.create({ data: { name: 'Youssef George', email: 'youssef.george@everlastwellness.com', jobTitle: 'System Administrator', department: 'IT', role: 'SUPER_ADMIN', accountState: 'ACTIVE', isOnline: false } }).then(user => { console.log('✅ Super admin created!'); console.log('   Name:', user.name); console.log('   Email:', user.email); console.log('   Role:', user.role); return p.$disconnect(); }).catch(e => { if (e.code === 'P2002') { console.log('⚠️ Super admin already exists with this email'); } else { console.error('❌ Error:', e.message); process.exit(1); } });"
)

echo.
echo ========================================
echo Step 4: Final Verification
echo ========================================
echo.

node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); Promise.all([ p.user.count(), p.user.findMany({ where: { role: 'SUPER_ADMIN' } }) ]).then(([total, admins]) => { console.log('✅ Total users:', total); console.log('✅ Super admins:', admins.length); console.log(''); admins.forEach(a => console.log('   -', a.name, '-', a.email)); return p.$disconnect(); }).catch(e => { console.error('Error:', e.message); process.exit(1); });"

echo.
echo ========================================
echo ✅ SETUP COMPLETE!
echo ========================================
echo.
echo Your backend is now ready to use!
echo.
echo Next steps:
echo 1. Start the backend: npm run start:dev
echo 2. Open the app: http://localhost:5173
echo 3. Login with: youssef.george@everlastwellness.com
echo 4. Start adding employees!
echo.
echo Note: Departments are created automatically when you
echo       add an employee with a new department name.
echo.
pause
