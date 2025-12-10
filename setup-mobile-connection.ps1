# Script to help set up mobile app connection to backend
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mobile App Connection Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get local IP address
Write-Host "Finding your computer's IP address..." -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.IPAddress -notlike "169.254.*"
} | Select-Object -First 1).IPAddress

if ($ipAddress) {
    Write-Host "✅ Your IP Address: $ipAddress" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "To connect your phone to the backend:" -ForegroundColor Cyan
    Write-Host "1. Make sure your phone and computer are on the SAME WiFi network" -ForegroundColor White
    Write-Host "2. Update mobile/src/services/api.ts:" -ForegroundColor White
    Write-Host "   Change: return 'http://10.0.2.2:3001/api';" -ForegroundColor Yellow
    Write-Host "   To:     return 'http://$ipAddress:3001/api';" -ForegroundColor Green
    Write-Host ""
    Write-Host "3. Update mobile/src/context/SocketContext.ts:" -ForegroundColor White
    Write-Host "   Change: return 'http://10.0.2.2:3001';" -ForegroundColor Yellow
    Write-Host "   To:     return 'http://$ipAddress:3001';" -ForegroundColor Green
    Write-Host ""
    Write-Host "Note: For Android Emulator, use: 10.0.2.2" -ForegroundColor Gray
    Write-Host "      For Physical Device, use: $ipAddress" -ForegroundColor Gray
} else {
    Write-Host "❌ Could not find IP address" -ForegroundColor Red
    Write-Host "Please run: ipconfig" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Start backend: cd backend && npm run start:dev" -ForegroundColor White
Write-Host "2. Start Metro: cd mobile && npm start" -ForegroundColor White
Write-Host "3. Run app: cd mobile && npm run android" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

