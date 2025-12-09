# Restore Super Admin Account
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Restoring Super Admin Account" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to script directory
Set-Location -Path $PSScriptRoot

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please ensure .env file exists with DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

Write-Host "Running seed script..." -ForegroundColor Yellow
Write-Host ""

# Run the TypeScript seed script
npx ts-node prisma/seed-admin.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Super admin account restored!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now log in with:" -ForegroundColor Cyan
    Write-Host "Email: youssef.george@everlastwellness.com" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Failed to restore admin account" -ForegroundColor Red
    exit 1
}

