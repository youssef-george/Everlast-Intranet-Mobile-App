@echo off
echo ========================================
echo Configuring Windows Firewall
echo ========================================
echo.
echo This will allow ports 5173 and 3001 through Windows Firewall
echo You need to run this as Administrator
echo.
pause

powershell -ExecutionPolicy Bypass -File "%~dp0allow-firewall-ports.ps1"
