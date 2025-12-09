# Fix Backend Configuration and Start Server
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Backend Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
Set-Location -Path $PSScriptRoot

# Step 1: Create/update .env file
Write-Host "[1/5] Creating .env file..." -ForegroundColor Yellow
@"
DATABASE_URL="file:./prisma/dev.db"
PORT=3001
JWT_SECRET=your-secret-key-here-change-in-production
"@ | Out-File -FilePath .env -Encoding utf8 -Force
Write-Host "✅ .env file created" -ForegroundColor Green
Write-Host ""

# Step 2: Display the DATABASE_URL (masked password)
Write-Host "[2/5] Checking configuration..." -ForegroundColor Yellow
$envContent = Get-Content .env -Raw
if ($envContent -match "DATABASE_URL") {
    Write-Host "✅ DATABASE_URL is set" -ForegroundColor Green
} else {
    Write-Host "❌ DATABASE_URL not found!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Test network connectivity to database server
Write-Host "[3/5] Testing network connectivity to database server..." -ForegroundColor Yellow
try {
    $connection = Test-NetConnection -ComputerName 196.219.160.253 -Port 5443 -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "✅ Can reach database server on port 5443" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Cannot reach database server - firewall or network issue?" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Network test failed: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Generate Prisma client
Write-Host "[4/5] Generating Prisma client..." -ForegroundColor Yellow
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Step 5: Test database connection
Write-Host "[5/5] Testing database connection..." -ForegroundColor Yellow
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.`$connect().then(() => { console.log('✅ Database connected successfully!'); return prisma.`$disconnect(); }).catch(err => { console.error('❌ Connection failed:', err.message); process.exit(1); });"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Database connection FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "1. Firewall blocking port 5443" -ForegroundColor White
    Write-Host "2. Database server SSL certificate issues" -ForegroundColor White
    Write-Host "3. Invalid credentials" -ForegroundColor White
    Write-Host "4. Database server not accessible from this network" -ForegroundColor White
    Write-Host ""
    Write-Host "Try running: backend\allow-firewall-ports.bat (as Administrator)" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Configuration successful!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Starting server..." -ForegroundColor Cyan
Write-Host ""

# Start the server
npm run start:dev
