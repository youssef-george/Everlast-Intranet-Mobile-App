@echo off
echo ========================================
echo Running Database Migration
echo ========================================
echo.
echo This will add forwarded message fields to the database.
echo.

cd backend

echo Running Prisma migration...
npx prisma migrate dev --name add_forwarded_message_fields

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Migration completed successfully!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Uncomment the forwarded fields in:
    echo    - backend\src\modules\chat\chat.service.ts
    echo    - backend\src\modules\chat\chat.gateway.ts
    echo 2. Restart the backend server
    echo.
) else (
    echo.
    echo ========================================
    echo Migration failed!
    echo ========================================
    echo.
    echo Try running: npx prisma db push
    echo.
)

pause
