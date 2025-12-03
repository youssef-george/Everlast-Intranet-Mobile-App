@echo off
cd /d "%~dp0"
echo Checking database...
node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.findMany().then(users => { if (users.length === 0) { console.log('ERROR: No users in database! Run create-admin.bat first!'); } else { console.log('Users in database:'); users.forEach(u => console.log(' -', u.name, '-', u.email, '-', u.role)); } return p.$disconnect(); }).catch(e => { console.error('Database error:', e.message); });"
pause
