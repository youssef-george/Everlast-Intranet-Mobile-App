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

# Check if database exists, if not run migrations
if (-not (Test-Path "prisma\dev.db")) {
    Write-Host "Running database migrations..." -ForegroundColor Yellow
    npm run prisma:migrate
}

# Start the development server
Write-Host "Starting development server on http://localhost:3001..." -ForegroundColor Green
npm run start:dev
