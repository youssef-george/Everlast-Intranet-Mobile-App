# How to Run and Test the Mobile App on Your Phone

## 📱 Step-by-Step Guide

### Prerequisites

1. **Install Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **Install Android Studio**
   - Download from: https://developer.android.com/studio
   - Install Android SDK (API level 23 or higher)
   - Set up Android Virtual Device (AVD) for emulator testing

3. **Enable Developer Options on Your Android Phone** (for physical device)
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

---

## 🚀 Step 1: Start the Backend Server

The mobile app needs the backend API to be running first.

### Option A: Using Batch File (Windows)
```bash
# Double-click: start-backend.bat
```

### Option B: Manual Start
```bash
cd backend
npm install
npm run prisma:generate
npx prisma db push
npm run start:dev
```

**Backend will run on:** `http://localhost:3001`

**Keep this terminal window open!**

---

## 📲 Step 2: Get Your Computer's IP Address

For the mobile app to connect to your backend, you need your computer's local IP address.

### Windows:
```powershell
ipconfig
# Look for "IPv4 Address" under your active network adapter
# Example: 192.168.1.100
```

### Or use this command:
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"} | Select-Object IPAddress
```

**Note down your IP address** (e.g., `192.168.1.100`)

---

## 🔧 Step 3: Update Mobile App API URL

Edit the file: `mobile/src/services/api.ts`

Find this section and update it with your computer's IP address:

```typescript
const getApiBaseURL = () => {
    if (__DEV__) {
        if (Platform.OS === 'android') {
            // For physical device, use your computer's IP
            return 'http://192.168.1.100:3001/api';  // ← Change this to your IP
            // For Android emulator, use:
            // return 'http://10.0.2.2:3001/api';
        } else if (Platform.OS === 'ios') {
            return 'http://localhost:3001/api';
        }
    }
    return 'http://localhost:3001/api';
};
```

**Important:**
- **Physical Device**: Use your computer's IP (e.g., `192.168.1.100`)
- **Android Emulator**: Use `10.0.2.2` (this is the emulator's way to access localhost)

Also update `mobile/src/context/SocketContext.ts` with the same IP:

```typescript
const getSocketURL = () => {
    if (__DEV__) {
        if (Platform.OS === 'android') {
            return 'http://192.168.1.100:3001';  // ← Change this to your IP
        }
    }
    return 'http://localhost:3001';
};
```

---

## 📦 Step 4: Install Mobile App Dependencies

```bash
cd mobile
npm install
```

This will install all React Native dependencies.

---

## 🔥 Step 5: Start Metro Bundler

In a **new terminal window**, run:

```bash
cd mobile
npm start
```

**Keep this terminal open!** This runs the Metro bundler that serves your JavaScript code.

---

## 📱 Step 6: Run on Your Phone

### Option A: Physical Android Device

1. **Connect your phone via USB**
2. **Enable USB Debugging** (if not already enabled)
3. **Verify device is connected:**
   ```bash
   adb devices
   # Should show your device
   ```

4. **Run the app:**
   ```bash
   cd mobile
   npm run android
   ```

   The app will build and install on your phone automatically.

### Option B: Android Emulator

1. **Start Android Emulator** from Android Studio
2. **Wait for emulator to fully boot**
3. **Run the app:**
   ```bash
   cd mobile
   npm run android
   ```

---

## 🔍 Step 7: Verify Connection

1. **Check Backend Logs** - You should see API requests coming in
2. **Check Mobile App** - The app should load and show the user selector
3. **Test API Connection:**
   - Open the app
   - It should try to fetch users from the backend
   - If you see "Backend Server Not Running" error, check:
     - Backend is running on port 3001
     - IP address in `api.ts` is correct
     - Phone and computer are on the same WiFi network

---

## 🛠️ Troubleshooting

### Issue: "Cannot connect to backend"

**Solutions:**
1. **Check Firewall:**
   - Windows Firewall might be blocking port 3001
   - Allow Node.js through firewall
   - Or temporarily disable firewall for testing

2. **Check Network:**
   - Phone and computer must be on the **same WiFi network**
   - Verify IP address is correct

3. **Check Backend:**
   - Backend must be running on `http://localhost:3001`
   - Test in browser: `http://localhost:3001/api/users`

### Issue: "Metro bundler not starting"

**Solutions:**
```bash
cd mobile
npm start -- --reset-cache
```

### Issue: "Build failed"

**Solutions:**
```bash
cd mobile/android
./gradlew clean
cd ..
npm run android
```

### Issue: "App crashes on startup"

**Check:**
1. All dependencies installed: `npm install` in mobile folder
2. Backend is running
3. IP address is correct in `api.ts` and `SocketContext.ts`

---

## 📝 Quick Reference

### Terminal 1: Backend
```bash
cd backend
npm run start:dev
```

### Terminal 2: Metro Bundler
```bash
cd mobile
npm start
```

### Terminal 3: Run App
```bash
cd mobile
npm run android
```

---

## ✅ Success Checklist

- [ ] Backend running on port 3001
- [ ] Computer IP address noted
- [ ] API URL updated in `mobile/src/services/api.ts`
- [ ] Socket URL updated in `mobile/src/context/SocketContext.ts`
- [ ] Mobile dependencies installed
- [ ] Metro bundler running
- [ ] Phone connected (or emulator running)
- [ ] App installed and running
- [ ] Can see user list in app

---

## 🎯 Next Steps

Once the app is running:
1. Select a user to login
2. Test the features:
   - View members directory
   - Send messages
   - Create groups
   - View notifications

Enjoy testing your mobile app! 🚀

