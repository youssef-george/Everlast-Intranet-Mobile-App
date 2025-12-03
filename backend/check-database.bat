@echo off
title Check Database
cd /d "%~dp0"

echo ========================================
echo Checking Database Contents
echo ========================================
echo.

echo [1/2] Checking Users...
node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.findMany().then(users => { console.log('Total users:', users.length); users.forEach(u => console.log(' -', u.name, '|', u.email, '|', u.department, '|', u.role)); return p.$disconnect(); }).catch(e => { console.error('Error:', e.message); process.exit(1); });"

echo.
echo [2/2] Checking Departments...
node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.findMany({ where: { accountState: 'ACTIVE' }, select: { department: true }, distinct: ['department'] }).then(depts => { console.log('Total departments:', depts.length); depts.forEach(d => console.log(' -', d.department)); return p.$disconnect(); }).catch(e => { console.error('Error:', e.message); process.exit(1); });"

echo.
echo ========================================
echo.
pause
