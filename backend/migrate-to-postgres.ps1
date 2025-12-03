# Migrate from SQLite to PostgreSQL
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migrating to PostgreSQL Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Remove old SQLite migrations
Write-Host "[1/5] Removing old SQLite migrations..." -ForegroundColor Yellow
$migrationsPath = "prisma\migrations"
if (Test-Path $migrationsPath) {
    Get-ChildItem -Path $migrationsPath -Directory | Where-Object { $_.Name -match "^\d{14}_" } | Remove-Item -Recurse -Force
    Write-Host "✅ Old migrations removed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Migrations directory not found" -ForegroundColor Yellow
}

# Step 2: Verify .env file exists
Write-Host ""
Write-Host "[2/5] Verifying .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content .env -Raw
    if ($envContent -match "DATABASE_URL.*postgres") {
        Write-Host "✅ .env file contains PostgreSQL URL" -ForegroundColor Green
    } else {
        Write-Host "❌ .env file does not contain PostgreSQL URL" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    exit 1
}

# Step 3: Generate Prisma client
Write-Host ""
Write-Host "[3/5] Generating Prisma client for PostgreSQL..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma client generated" -ForegroundColor Green

# Step 4: Create and run migration
Write-Host ""
Write-Host "[4/5] Creating and applying database migration..." -ForegroundColor Yellow
npx prisma migrate dev --name init_postgresql
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to run migration" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Migration completed" -ForegroundColor Green

# Step 5: Verify connection
Write-Host ""
Write-Host "[5/5] Verifying database connection..." -ForegroundColor Yellow
npx prisma db pull
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database connection verified" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not verify connection, but migration may have succeeded" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Migration to PostgreSQL complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now start the backend server with: npm run start:dev" -ForegroundColor Cyan

