# Push Everlast Intranet to GitHub
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Pushing to GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

Write-Host "Current directory: $projectDir" -ForegroundColor Yellow
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
}

# Check remote
Write-Host "Checking remote configuration..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Adding remote origin..." -ForegroundColor Yellow
    git remote add origin https://github.com/youssef-george/Everlast-Intranet.git
} else {
    Write-Host "Remote already configured: $remote" -ForegroundColor Green
}

Write-Host ""
Write-Host "Checking git status..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "Adding all files..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "Checking if there are changes to commit..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git commit -m "Initial commit: Everlast Intranet application"
} else {
    Write-Host "No changes to commit" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setting branch to main..." -ForegroundColor Yellow
git branch -M main

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You may be prompted for GitHub credentials." -ForegroundColor Yellow
Write-Host "If using password, use a Personal Access Token instead." -ForegroundColor Yellow
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/youssef-george/Everlast-Intranet" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Push failed. Please check the error above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. Authentication required - use Personal Access Token" -ForegroundColor Yellow
    Write-Host "2. Repository doesn't exist or you don't have access" -ForegroundColor Yellow
    Write-Host "3. Network connection issues" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to exit"
