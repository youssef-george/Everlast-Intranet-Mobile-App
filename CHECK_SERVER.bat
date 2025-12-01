@echo off
echo Checking if backend server is running...
echo.

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3001' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; Write-Host '✅ Server is RUNNING on http://localhost:3001' -ForegroundColor Green } catch { Write-Host '❌ Server is NOT running' -ForegroundColor Red; Write-Host ''; Write-Host 'To start the server:' -ForegroundColor Yellow; Write-Host '1. Open a terminal in the backend folder' -ForegroundColor Yellow; Write-Host '2. Run: npm run start:dev' -ForegroundColor Yellow }"

echo.
echo Checking port 3001...
netstat -ano | findstr :3001
if errorlevel 1 (
    echo Port 3001 is not in use
) else (
    echo Port 3001 is in use
)
echo.
pause
