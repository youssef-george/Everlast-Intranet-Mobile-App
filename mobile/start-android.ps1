# PowerShell script to run Android app
# This avoids the "no terminal app" error

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting React Native Android App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Metro is already running
$metroProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*metro*" -or $_.CommandLine -like "*react-native start*"
}

if (-not $metroProcess) {
    Write-Host "Starting Metro bundler in background..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm start" -WindowStyle Minimized
    Write-Host "Waiting for Metro to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
} else {
    Write-Host "Metro bundler is already running" -ForegroundColor Green
}

Write-Host ""
Write-Host "Building and installing app on emulator..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes on first build..." -ForegroundColor Yellow
Write-Host ""

# Run the Android build
npx react-native run-android --no-packager

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ App installed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "The app should now be running on your emulator." -ForegroundColor Cyan
    Write-Host "If it doesn't appear, check the Metro bundler window." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ Build failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
}

