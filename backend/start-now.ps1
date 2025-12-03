# Create .env
@"
DATABASE_URL="postgres://postgres:H8nwxPNqzCLLQRNT1k93Q0c165yST38CkjIeJDUZxQqWCYBfmZQArmXEPFbcf9Oc@196.219.160.253:5443/postgres?sslmode=require"
PORT=3001
JWT_SECRET=your-secret-key
"@ | Out-File -FilePath "$PSScriptRoot\.env" -Encoding UTF8 -Force

# Wait a second
Start-Sleep -Seconds 1

# Generate Prisma
& npm run prisma:generate | Out-Null

# Start server
& npm run start:dev
