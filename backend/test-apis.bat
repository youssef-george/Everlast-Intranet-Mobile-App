@echo off
title Test API Endpoints
cd /d "%~dp0"

echo ========================================
echo Testing API Endpoints
echo ========================================
echo.

echo [1/3] Testing GET /users endpoint...
curl -s http://localhost:3001/users | find "["
if errorlevel 1 (
    echo    ERROR: Users endpoint not responding
) else (
    echo    SUCCESS: Users endpoint working
)
echo.

echo [2/3] Testing GET /departments endpoint...
curl -s http://localhost:3001/departments | find "["
if errorlevel 1 (
    echo    ERROR: Departments endpoint not responding
) else (
    echo    SUCCESS: Departments endpoint working
)
echo.

echo [3/3] Testing backend health...
curl -s http://localhost:3001/ > nul 2>&1
if errorlevel 1 (
    echo    WARNING: Backend might not be running
) else (
    echo    SUCCESS: Backend is responding
)
echo.

echo ========================================
echo Test Complete
echo ========================================
echo.
echo If you see errors above:
echo 1. Make sure backend is running (npm run start:dev)
echo 2. Check for errors in the backend terminal
echo.
pause

