# Create .env
@"
DATABASE_URL="file:./prisma/dev.db"
PORT=3001
JWT_SECRET=your-secret-key
"@ | Out-File -FilePath "$PSScriptRoot\.env" -Encoding UTF8 -Force

# Wait a second
Start-Sleep -Seconds 1

# Generate Prisma
& npm run prisma:generate | Out-Null

# Start server
& npm run start:dev
