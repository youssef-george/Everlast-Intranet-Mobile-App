@echo off
cd /d "%~dp0"
copy "EWMC-Logo-1.png" "frontend\public\logo-light.png" /Y
copy "EWMC-Logo-1-768x199-1.webp" "frontend\public\logo-dark.webp" /Y
echo.
echo Logo files copied!
echo.
dir "frontend\public\logo*.*"
pause
