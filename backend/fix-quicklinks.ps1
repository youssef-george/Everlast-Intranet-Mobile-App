# Fix QuickLinks Prisma Client Issue
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing QuickLinks Prisma Client" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to script directory
Set-Location -Path $PSScriptRoot

Write-Host "[1/5] Stopping any running Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✅ Processes stopped" -ForegroundColor Green
Write-Host ""

Write-Host "[2/5] Cleaning Prisma cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.prisma") {
    Remove-Item -Recurse -Force "node_modules\.prisma" -ErrorAction SilentlyContinue
}
if (Test-Path "node_modules\@prisma\client") {
    Remove-Item -Recurse -Force "node_modules\@prisma\client" -ErrorAction SilentlyContinue
}
Write-Host "✅ Cache cleaned" -ForegroundColor Green
Write-Host ""

Write-Host "[3/5] Cleaning TypeScript build cache..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
}
Write-Host "✅ Build cache cleaned" -ForegroundColor Green
Write-Host ""

Write-Host "[4/5] Regenerating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma client generated" -ForegroundColor Green
Write-Host ""

Write-Host "[5/5] Verifying QuickLink model..." -ForegroundColor Yellow
node check-prisma.js
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Fix complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now restart your backend server:" -ForegroundColor Yellow
Write-Host "  npm run start:dev" -ForegroundColor White
Write-Host ""

