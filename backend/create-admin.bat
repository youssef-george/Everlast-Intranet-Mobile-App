@echo off
title Create Super Admin
cd /d "%~dp0"

echo ========================================
echo Creating Super Admin Account
echo ========================================
echo.

REM Check if admin already exists
node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.findMany({ where: { role: 'SUPER_ADMIN' } }).then(admins => { if (admins.length > 0) { console.log('Super Admin already exists:'); admins.forEach(a => console.log(' -', a.name, '-', a.email)); process.exit(1); } return p.$disconnect(); }).catch(e => { console.error('Error:', e.message); process.exit(1); });"

if errorlevel 1 (
    echo.
    echo ========================================
    pause
    exit /b 0
)

echo Creating Youssef George as Super Admin...
echo.

node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.create({ data: { name: 'Youssef George', email: 'youssef.george@everlastwellness.com', jobTitle: 'System Administrator', department: 'IT', role: 'SUPER_ADMIN', accountState: 'ACTIVE', isOnline: false } }).then(user => { console.log('✅ Super admin created successfully!'); console.log('Name:', user.name); console.log('Email:', user.email); console.log('Role:', user.role); console.log(''); console.log('You can now log in with this email.'); return p.$disconnect(); }).catch(e => { console.error('❌ Error creating admin:', e.message); if (e.code === 'P2002') { console.error('This email already exists in the database.'); } process.exit(1); });"

echo.
echo ========================================
echo.
pause
