@echo off
cd /d "%~dp0frontend"
powershell -ExecutionPolicy Bypass -File "start-dev.ps1"
pause
