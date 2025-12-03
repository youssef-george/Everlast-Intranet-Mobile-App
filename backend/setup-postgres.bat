@echo off
echo ========================================
echo Setting up PostgreSQL Database
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Verifying .env file...
if not exist .env (
    echo Creating .env file...
    echo DATABASE_URL="postgres://postgres:H8nwxPNqzCLLQRNT1k93Q0c165yST38CkjIeJDUZxQqWCYBfmZQArmXEPFbcf9Oc@196.219.160.253:5443/postgres?sslmode=require" > .env
    echo PORT=3001 >> .env
    echo .env file created
) else (
    echo .env file exists
)
echo.

echo [2/4] Generating Prisma client for PostgreSQL...
call npx prisma generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)
echo.

echo [3/4] Creating database migration...
call npx prisma migrate dev --name init
if errorlevel 1 (
    echo ERROR: Failed to create migration
    pause
    exit /b 1
)
echo.

echo [4/4] Verifying database connection...
call npx prisma db pull
if errorlevel 1 (
    echo WARNING: Could not verify connection, but migration may have succeeded
) else (
    echo Database connection verified successfully
)
echo.

echo ========================================
echo Setup complete!
echo ========================================
echo.
echo You can now start the server with: npm run start:dev
echo.
pause

