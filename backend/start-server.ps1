# Start Backend Server with SQLite
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Everlast Intranet Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to script directory
Set-Location -Path $PSScriptRoot

# Step 1: Check .env file
Write-Host "[1/4] Checking .env file..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    @"
DATABASE_URL="file:./prisma/dev.db"
PORT=3001
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host "✅ .env file created" -ForegroundColor Green
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}
Write-Host ""

# Step 2: Generate Prisma client
Write-Host "[2/4] Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Step 3: Push schema to database (if needed)
Write-Host "[3/4] Ensuring database schema is up to date..." -ForegroundColor Yellow
npx prisma db push --skip-generate --accept-data-loss
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Database push had issues, but continuing..." -ForegroundColor Yellow
} else {
    Write-Host "✅ Database schema synchronized" -ForegroundColor Green
}
Write-Host ""

# Step 4: Start the server
Write-Host "[4/4] Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Server starting on http://localhost:3001" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run start:dev
