# PowerShell script to set up SQLite database
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up SQLite Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to script directory
Set-Location -Path $PSScriptRoot

# Step 1: Verify .env file
Write-Host "[1/4] Verifying .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content .env -Raw
    if ($envContent -match "DATABASE_URL.*file:") {
        Write-Host "✅ .env file contains SQLite URL" -ForegroundColor Green
    } else {
        Write-Host "⚠️  .env file exists but may not have SQLite URL" -ForegroundColor Yellow
    }
} else {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    @"
DATABASE_URL="file:./prisma/dev.db"
PORT=3001
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host "✅ .env file created" -ForegroundColor Green
}
Write-Host ""

# Step 2: Generate Prisma client
Write-Host "[2/4] Generating Prisma client for SQLite..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Step 3: Push schema to database
Write-Host "[3/4] Pushing schema to SQLite database..." -ForegroundColor Yellow
npx prisma db push --accept-data-loss
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push schema to database" -ForegroundColor Red
    Write-Host "Please check your database connection settings" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Database schema created/updated" -ForegroundColor Green
Write-Host ""

# Step 4: Verify connection
Write-Host "[4/4] Verifying database connection..." -ForegroundColor Yellow
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.`$connect().then(() => { console.log('✅ Database connected successfully!'); return prisma.`$disconnect(); }).catch(err => { console.error('❌ Connection failed:', err.message); process.exit(1); });"
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Connection verification failed, but schema may have been created" -ForegroundColor Yellow
} else {
    Write-Host " Database connection verified" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now start the server with:" -ForegroundColor Cyan
Write-Host "  npm run start:dev" -ForegroundColor White
Write-Host ""
Write-Host "Or use: START_SERVER.bat from the root directory" -ForegroundColor Cyan
Write-Host ""

