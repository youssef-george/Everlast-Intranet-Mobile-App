# Accessing the App from Another Device on the Same Network

## Quick Setup

### 1. Find Your Computer's IP Address

Run the `get-ip-address.bat` file or use one of these methods:

**Windows PowerShell:**
```powershell
ipconfig | findstr IPv4
```

**Windows Command Prompt:**
```cmd
ipconfig
```
Look for "IPv4 Address" - it will be something like `192.168.1.100` or `10.0.0.5`

### 2. Start the Servers

**Backend Server:**
```bash
cd backend
npm run start:dev
```

**Frontend Server:**
```bash
cd frontend
npm run dev
```

Both servers will automatically be accessible on your local network.

### 3. Access from Another Device

1. Make sure both devices are on the **same WiFi network**
2. On the other device, open a web browser
3. Navigate to: `http://YOUR_IP_ADDRESS:5173`
   - Example: `http://192.168.1.100:5173`

### 4. Windows Firewall (If Connection Fails)

If you can't connect, you may need to allow ports through Windows Firewall:

**Option A: Allow via Windows Settings**
1. Open Windows Security → Firewall & network protection
2. Click "Allow an app through firewall"
3. Add ports 5173 (frontend) and 3001 (backend)
4. Allow both Private and Public networks

**Option B: PowerShell (Run as Administrator)**
```powershell
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "NestJS Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

## Configuration Details

### Frontend (Vite)
- Already configured with `host: true` in `vite.config.ts`
- Accessible at: `http://YOUR_IP:5173`

### Backend (NestJS)
- Configured to listen on `0.0.0.0` (all network interfaces)
- CORS enabled for all origins in development
- Accessible at: `http://YOUR_IP:3001`

### API Configuration
- The frontend automatically detects the hostname
- When accessed from another device, API calls will use that device's IP
- No manual configuration needed!

## Troubleshooting

### Can't Connect from Another Device

1. **Check IP Address**: Make sure you're using the correct IP (run `get-ip-address.bat`)
2. **Same Network**: Both devices must be on the same WiFi network
3. **Firewall**: Windows Firewall may be blocking connections
4. **Server Running**: Make sure both frontend and backend servers are running
5. **Router Settings**: Some routers block device-to-device communication - check router settings

### API Calls Fail from Another Device

- The frontend automatically uses the current hostname for API calls
- If issues persist, check browser console for errors
- Verify backend is accessible at `http://YOUR_IP:3001` from the other device

### Socket.IO Connection Issues

- Socket.IO connections will automatically use the detected hostname
- Make sure backend is listening on `0.0.0.0` (already configured)

## Security Note

⚠️ **Development Only**: The current configuration allows all origins for CORS. This is fine for development but should be restricted in production.
