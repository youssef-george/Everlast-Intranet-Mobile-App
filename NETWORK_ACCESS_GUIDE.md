# Network Access Guide

## 🌐 How to Access the App from Other Devices on Your Network

### Quick Start

1. **Run `START_ALL.bat`** - This starts both backend and frontend servers
2. **Get your IP address** - Run `get-network-url.bat` to see your network URLs
3. **Share the URL** - Other devices on the same network can access: `http://YOUR_IP:5173`

---

## 📋 Step-by-Step Instructions

### Step 1: Start the Servers

**Option A: Start Both Servers (Recommended)**
```cmd
START_ALL.bat
```
This opens 2 windows:
- Backend server (port 3001)
- Frontend server (port 5173)

**Option B: Start Separately**
```cmd
START_SERVER.bat    # Backend only
START_FRONTEND.bat  # Frontend only
```

### Step 2: Get Your Network IP Address

Run this to see your network URLs:
```cmd
get-network-url.bat
```

You'll see output like:
```
Your Local IP Address: 192.168.1.100

Access URLs:
  Frontend: http://192.168.1.100:5173
  Backend:  http://192.168.1.100:3001
```

### Step 3: Access from Other Devices

**On the same network:**
1. Open a web browser on any device (phone, tablet, another computer)
2. Go to: `http://YOUR_IP:5173`
   - Replace `YOUR_IP` with the IP address from Step 2
   - Example: `http://192.168.1.100:5173`

---

## 🔧 Configuration

### Backend (Port 3001)
- ✅ Already configured to listen on `0.0.0.0` (all network interfaces)
- ✅ CORS enabled for all origins
- ✅ Accessible from network automatically

### Frontend (Port 5173)
- ✅ Configured with `host: '0.0.0.0'` to expose to network
- ✅ API calls automatically detect network access
- ✅ Socket.IO automatically uses correct URL

### Automatic Detection
The app automatically detects if you're accessing from:
- **Localhost** → Uses `http://localhost:3001` for API
- **Network** → Uses `http://YOUR_IP:3001` for API

No configuration needed! 🎉

---

## 🛡️ Firewall Configuration

If other devices can't connect, you may need to allow the ports in Windows Firewall:

### Automatic (Recommended)
Run these scripts:
```cmd
allow-firewall-ports.bat
```
or
```cmd
allow-firewall-ports.ps1
```

### Manual
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter ports: `3001, 5173`
6. Allow the connection
7. Apply to all profiles
8. Name it "Everlast Intranet"

---

## 📱 Mobile Access

### iOS (iPhone/iPad)
1. Make sure iPhone is on the same Wi-Fi network
2. Open Safari
3. Go to: `http://YOUR_IP:5173`
4. Tap "Share" → "Add to Home Screen" to install as PWA

### Android
1. Make sure Android device is on the same Wi-Fi network
2. Open Chrome
3. Go to: `http://YOUR_IP:5173`
4. Tap menu → "Add to Home screen" to install as PWA

---

## 🔍 Troubleshooting

### "Can't connect" or "Connection refused"

**Check:**
1. ✅ Both servers are running (check the windows)
2. ✅ Devices are on the same network (same Wi-Fi)
3. ✅ Firewall allows ports 3001 and 5173
4. ✅ IP address is correct (run `get-network-url.bat`)

### "Network access: http://localhost:3001"

**Solution:**
- The backend is running but couldn't detect your IP
- Check the console output for the actual IP
- Or run `get-network-url.bat` to find it

### Backend shows "Network access: http://<your-ip>:3001"

**Solution:**
- The IP detection failed
- Check your network connection
- The server still works, just use the IP from `get-network-url.bat`

### Can access from computer but not phone

**Check:**
1. Phone is on the same Wi-Fi network (not mobile data)
2. Windows Firewall is allowing connections
3. Antivirus isn't blocking the connection
4. Try disabling VPN if active

---

## 🎯 Quick Reference

| Service | Local URL | Network URL |
|---------|-----------|-------------|
| Frontend | http://localhost:5173 | http://YOUR_IP:5173 |
| Backend API | http://localhost:3001 | http://YOUR_IP:3001 |

**To find YOUR_IP:** Run `get-network-url.bat`

---

## ✅ Features That Work on Network

- ✅ All chat features
- ✅ File uploads and attachments
- ✅ Real-time messaging (Socket.IO)
- ✅ Voice notes
- ✅ Group chats
- ✅ User profiles
- ✅ Notifications
- ✅ PWA installation

Everything works exactly the same as localhost! 🚀

---

## 📝 Notes

- **Security**: This setup is for local network access only. For production, use proper security measures.
- **Performance**: Network access may be slightly slower than localhost, but should work fine.
- **Mobile**: Works great on mobile devices when on the same Wi-Fi network.

---

## 🆘 Still Having Issues?

1. Check that both servers show "Server running" messages
2. Verify your IP address with `get-network-url.bat`
3. Test from the same computer first: `http://localhost:5173`
4. Check Windows Firewall settings
5. Make sure all devices are on the same Wi-Fi network
