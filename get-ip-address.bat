@echo off
echo ========================================
echo Finding Your Local IP Address
echo ========================================
echo.
echo Your local IP address(es):
echo.
ipconfig | findstr /i "IPv4"
echo.
echo ========================================
echo Instructions:
echo 1. Copy one of the IP addresses above (usually starts with 192.168.x.x or 10.x.x.x)
echo 2. On another device, open a browser and go to: http://YOUR_IP:5173
echo 3. Make sure both devices are on the same WiFi network
echo 4. Make sure Windows Firewall allows connections on ports 5173 and 3001
echo ========================================
pause
