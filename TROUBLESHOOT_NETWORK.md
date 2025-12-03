# Troubleshooting Network Access Issues

## Problem: Can't access app from another device at http://192.168.11.211:5173

### Step 1: Verify Servers Are Running

**Check if servers are listening:**
```powershell
netstat -an | findstr "LISTENING" | findstr "5173"
netstat -an | findstr "LISTENING" | findstr "3001"
```

You should see:
- `0.0.0.0:5173` or `:::5173` (frontend)
- `0.0.0.0:3001` or `:::3001` (backend)

If you see `127.0.0.1:5173` instead of `0.0.0.0:5173`, the server is only listening on localhost.

### Step 2: Configure Windows Firewall

**Option A: Run the automated script (Recommended)**
1. Right-click `allow-firewall-ports.bat`
2. Select "Run as Administrator"
3. Follow the prompts

**Option B: Manual Windows Firewall Configuration**
1. Open Windows Security → Firewall & network protection
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port `5173` → Next
6. Select "Allow the connection" → Next
7. Check all profiles (Domain, Private, Public) → Next
8. Name it "Vite Dev Server" → Finish
9. Repeat for port `3001` (name it "NestJS Backend")

**Option C: PowerShell (Run as Administrator)**
```powershell
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "NestJS Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

### Step 3: Verify Vite Configuration

Check `frontend/vite.config.ts` - it should have:
```typescript
server: {
  host: true, // This is correct
  port: 5173,
}
```

### Step 4: Restart Servers

After configuring firewall, restart both servers:

**Backend:**
```bash
cd backend
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

When Vite starts, you should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.11.211:5173/
```

If you don't see the "Network:" line, Vite might not be binding to the network interface.

### Step 5: Test from Same Computer First

Before testing from another device, test from the same computer:
1. Open browser
2. Go to: `http://192.168.11.211:5173`
3. If this works, the server is configured correctly

### Step 6: Test from Another Device

1. **Same Network**: Both devices must be on the same WiFi network
2. **Correct IP**: Use the IP shown in Vite's "Network:" output
3. **Browser**: Try different browsers (Chrome, Firefox, Safari)
4. **Mobile**: Try both mobile browser and desktop browser

### Step 7: Check Router Settings

Some routers have "AP Isolation" or "Client Isolation" enabled, which prevents devices from communicating with each other:

1. Access your router's admin panel (usually `192.168.1.1` or `192.168.0.1`)
2. Look for "AP Isolation", "Client Isolation", or "Wireless Isolation"
3. **Disable** this feature
4. Save and restart router if needed

### Step 8: Verify IP Address

Make sure you're using the correct IP address:

**Find your IP:**
```powershell
ipconfig | findstr IPv4
```

Look for the IP address on your WiFi adapter (not Ethernet or Virtual adapters).

### Step 9: Test Backend Directly

From another device, try accessing the backend directly:
```
http://192.168.11.211:3001/api/users
```

If this fails, the backend isn't accessible from the network.

### Step 10: Check Antivirus/Firewall Software

Third-party antivirus or firewall software (Norton, McAfee, Kaspersky, etc.) might be blocking connections:

1. Temporarily disable the firewall/antivirus
2. Try accessing again
3. If it works, add exceptions for ports 5173 and 3001

## Common Issues

### Issue: "This site can't be reached" or "Connection refused"

**Causes:**
- Windows Firewall blocking ports
- Server not listening on `0.0.0.0`
- Wrong IP address
- Different network

**Solutions:**
1. Run `allow-firewall-ports.bat` as Administrator
2. Restart both servers
3. Verify IP address with `get-ip-address.bat`
4. Ensure both devices on same WiFi

### Issue: Page loads but API calls fail

**Causes:**
- Backend not accessible from network
- CORS issues
- Backend not listening on `0.0.0.0`

**Solutions:**
1. Check backend is listening on `0.0.0.0:3001` (not `127.0.0.1:3001`)
2. Verify CORS is enabled (already configured)
3. Check browser console for errors

### Issue: Works on computer but not on phone

**Causes:**
- Mobile browser security restrictions
- Different network (mobile data vs WiFi)
- Router AP isolation

**Solutions:**
1. Ensure phone is on same WiFi (not mobile data)
2. Try different mobile browser
3. Check router AP isolation settings

## Quick Diagnostic Commands

**Check what's listening on ports:**
```powershell
netstat -an | findstr "LISTENING" | findstr "5173\|3001"
```

**Test if port is accessible (from another device):**
```powershell
Test-NetConnection -ComputerName 192.168.11.211 -Port 5173
Test-NetConnection -ComputerName 192.168.11.211 -Port 3001
```

**Check firewall rules:**
```powershell
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Vite*" -or $_.DisplayName -like "*NestJS*"}
```

## Still Not Working?

1. **Check Windows Event Viewer** for firewall blocks
2. **Try disabling Windows Firewall temporarily** (for testing only)
3. **Check if another application is using ports 5173 or 3001**
4. **Verify network adapter** - make sure you're using WiFi IP, not VPN or virtual adapter IP
