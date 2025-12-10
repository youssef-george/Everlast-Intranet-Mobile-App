# Troubleshooting: App Not Appearing in Emulator

## 🔍 Quick Diagnosis

### Step 1: Check if Emulator is Running

1. **Open Android Studio**
2. **Check Device Manager:**
   - Tools → Device Manager
   - You should see an emulator with status "Running"
3. **Verify in terminal:**
   ```bash
   # Find ADB path (usually in Android SDK)
   C:\Users\YourUsername\AppData\Local\Android\Sdk\platform-tools\adb.exe devices
   ```
   Should show: `emulator-5554   device`

### Step 2: Check if Dependencies are Installed

```bash
cd mobile
npm install
```

Wait for all packages to install (may take 5-10 minutes first time).

### Step 3: Check if Metro Bundler is Running

```bash
cd mobile
npm start
```

You should see:
- React Native logo
- Metro bundler running
- No errors

**Keep this terminal open!**

### Step 4: Build and Install App

**In a NEW terminal:**

```bash
cd mobile
npm run android
```

**First build takes 5-10 minutes.** Watch for errors.

---

## 🛠️ Common Issues and Fixes

### Issue 1: "adb: command not found"

**Problem:** Android SDK platform-tools not in PATH

**Solution:**
1. Find your Android SDK path (usually):
   ```
   C:\Users\YourUsername\AppData\Local\Android\Sdk\platform-tools
   ```

2. Add to PATH:
   - Windows Settings → System → Advanced → Environment Variables
   - Add to PATH: `C:\Users\YourUsername\AppData\Local\Android\Sdk\platform-tools`

3. Or use full path:
   ```bash
   C:\Users\YourUsername\AppData\Local\Android\Sdk\platform-tools\adb.exe devices
   ```

### Issue 2: "No emulator detected"

**Solutions:**
1. **Start emulator from Android Studio:**
   - Tools → Device Manager
   - Click ▶️ play button
   - Wait for full boot (home screen appears)

2. **Check emulator is running:**
   ```bash
   adb devices
   # Should show: emulator-5554   device
   ```

3. **Restart emulator if needed**

### Issue 3: "Build failed" or Gradle errors

**Solution 1: Clean build**
```bash
cd mobile/android
gradlew clean
cd ..
npm run android
```

**Solution 2: Check Android SDK**
- Open Android Studio
- Tools → SDK Manager
- Install: Android SDK Platform 34, Android SDK Build-Tools

**Solution 3: Check Java/JDK**
- React Native needs JDK 17
- Android Studio usually includes it
- Verify: `java -version` (should show 17 or higher)

### Issue 4: "Metro bundler errors"

**Solution:**
```bash
cd mobile
npm start -- --reset-cache
```

### Issue 5: "App builds but doesn't launch"

**Solutions:**
1. **Manually launch:**
   - In emulator, find "Everlast Intranet" app
   - Tap to open

2. **Reload app:**
   - Press `R` twice quickly in Metro bundler
   - Or: `Ctrl+M` in emulator → Reload

3. **Check logs:**
   ```bash
   adb logcat | findstr "ReactNative"
   ```

### Issue 6: "Could not connect to development server"

**Solutions:**
1. **Check Metro bundler is running**
2. **Check backend is running on port 3001**
3. **Reload app:** `Ctrl+M` → Reload
4. **Restart Metro:** Stop (Ctrl+C) and `npm start` again

---

## 📋 Step-by-Step Complete Setup

### 1. Install Prerequisites

- ✅ Node.js 18+ installed
- ✅ Android Studio installed
- ✅ Android SDK installed
- ✅ Java JDK 17+ installed

### 2. Set Up Android Emulator

1. Open Android Studio
2. Tools → Device Manager
3. Create Virtual Device (if none):
   - Click "Create Device"
   - Choose a device (e.g., Pixel 5)
   - Download system image (Android 11+)
   - Finish setup
4. Start emulator (▶️ button)
5. Wait for full boot

### 3. Install Mobile Dependencies

```bash
cd mobile
npm install
```

**Wait for completion** (5-10 minutes first time)

### 4. Start Backend

**Terminal 1:**
```bash
cd backend
npm run start:dev
```

**Wait for:** `🚀 Server running on http://localhost:3001`

### 5. Start Metro Bundler

**Terminal 2:**
```bash
cd mobile
npm start
```

**Wait for:** Metro bundler to start (React Native logo)

### 6. Build and Run App

**Terminal 3:**
```bash
cd mobile
npm run android
```

**First build:** 5-10 minutes
**Subsequent builds:** 1-2 minutes

---

## ✅ Verification Checklist

- [ ] Emulator is running and fully booted
- [ ] `adb devices` shows emulator
- [ ] Backend running on port 3001
- [ ] Metro bundler running
- [ ] Dependencies installed (`mobile/node_modules` exists)
- [ ] No build errors in terminal
- [ ] App appears in emulator app drawer

---

## 🚀 Quick Test Script

Use the provided `run-emulator.bat` script:

```bash
# Double-click: run-emulator.bat
# Or run from terminal:
.\run-emulator.bat
```

This script will:
1. Check if emulator is running
2. Install dependencies if needed
3. Start Metro bundler
4. Build and install app

---

## 📞 Still Not Working?

### Check Build Logs

```bash
cd mobile
npm run android -- --verbose
```

Look for specific error messages.

### Check Metro Logs

In Metro bundler terminal, look for:
- Red error messages
- Failed to bundle errors
- Module not found errors

### Check Android Logs

```bash
adb logcat | findstr "ReactNativeJS"
```

### Common Error Messages

**"SDK location not found":**
- Set `ANDROID_HOME` environment variable
- Path: `C:\Users\YourUsername\AppData\Local\Android\Sdk`

**"Gradle sync failed":**
- Open `mobile/android` in Android Studio
- Let it sync and download dependencies

**"Unable to resolve module":**
```bash
cd mobile
npm install
npm start -- --reset-cache
```

---

## 💡 Pro Tips

1. **First build is always slow** - be patient
2. **Keep all terminals open** while testing
3. **Check emulator is fully booted** before running app
4. **Use `npm run android`** to rebuild after code changes
5. **Clean build if stuck:**
   ```bash
   cd mobile/android
   gradlew clean
   cd ..
   npm run android
   ```

---

**If you're still having issues, share the error message from the terminal and I'll help you fix it!**

