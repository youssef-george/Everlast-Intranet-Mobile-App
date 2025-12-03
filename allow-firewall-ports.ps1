# PowerShell script to allow ports through Windows Firewall
# Run this as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuring Windows Firewall" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Adding firewall rules for development servers..." -ForegroundColor Yellow
Write-Host ""

# Remove existing rules if they exist (ignore errors)
Remove-NetFirewallRule -DisplayName "Vite Dev Server" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "NestJS Backend" -ErrorAction SilentlyContinue

# Add firewall rules
$success = $true

try {
    $rule1 = New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow -Profile Private,Public -ErrorAction Stop
    Write-Host "Port 5173 - Frontend allowed" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to add rule for port 5173" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    $success = $false
}

try {
    $rule2 = New-NetFirewallRule -DisplayName "NestJS Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -Profile Private,Public -ErrorAction Stop
    Write-Host "Port 3001 - Backend allowed" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to add rule for port 3001" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    $success = $false
}

if ($success) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Firewall rules added successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Now you can access the app from other devices:" -ForegroundColor Yellow
    Write-Host "1. Make sure both servers are running" -ForegroundColor White
    Write-Host "2. Find your IP address (run get-ip-address.bat)" -ForegroundColor White
    Write-Host "3. On another device, go to: http://YOUR_IP:5173" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Some firewall rules failed to add. Please check the errors above." -ForegroundColor Yellow
    Write-Host ""
}

pause
