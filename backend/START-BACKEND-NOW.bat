@echo off
title Everlast Backend Server
cd /d "%~dp0"

echo ========================================
echo STARTING EVERLAST BACKEND
echo ========================================
echo.

REM Create .env
echo Creating .env file...
(
echo DATABASE_URL=file:./prisma/dev.db
echo PORT=3001
echo JWT_SECRET=your-secret-key
) > .env

echo .env file contents:
type .env
echo.
echo.

echo Generating Prisma client...
call npm run prisma:generate
echo.

echo Starting backend server...
echo.
echo ========================================
echo Backend running on http://localhost:3001
echo ========================================
echo.

npm run start:dev
