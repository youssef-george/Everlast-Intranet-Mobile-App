# PowerShell script to start the backend server
Write-Host "Starting Everlast Intranet Backend Server..." -ForegroundColor Cyan

# Navigate to backend directory
Set-Location -Path "$PSScriptRoot\backend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if Prisma client is generated
if (-not (Test-Path "node_modules\.prisma")) {
    Write-Host "Generating Prisma client..." -ForegroundColor Yellow
    npm run prisma:generate
}

# Verify database connection and sync schema
Write-Host "Verifying database connection..." -ForegroundColor Yellow
npx prisma db push --skip-generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Database push failed, but continuing..." -ForegroundColor Yellow
}

# Start the development server
Write-Host "Starting development server on http://localhost:3001..." -ForegroundColor Green
npm run start:dev
