# Testing in Android Emulator - Quick Guide

## ✅ Good News!
The app is **already configured** for Android emulator testing! No changes needed.

The API is set to use `10.0.2.2` which is the emulator's way to access your computer's localhost.

---

## 🚀 Step-by-Step Instructions

### Step 1: Start Android Emulator

1. **Open Android Studio**
2. **Open AVD Manager:**
   - Tools → Device Manager
   - Or click the device icon in the toolbar
3. **Start an emulator:**
   - Click the ▶️ play button next to an emulator
   - Wait for it to fully boot (you'll see the Android home screen)

**Recommended:** Use Android 11 (API 30) or higher

---

### Step 2: Start Backend Server

**Open Terminal 1:**

```bash
cd backend
npm install
npm run prisma:generate
npx prisma db push
npm run start:dev
```

**Wait for:** `🚀 Server running on http://localhost:3001`

**Keep this terminal open!**

---

### Step 3: Install Mobile Dependencies (First Time Only)

**Open Terminal 2:**

```bash
cd mobile
npm install
```

This may take a few minutes. Wait for it to complete.

---

### Step 4: Start Metro Bundler

**In the same Terminal 2 (or new Terminal):**

```bash
cd mobile
npm start
```

**Wait for:** Metro bundler to start (you'll see the React Native logo)

**Keep this terminal open!**

---

### Step 5: Run App on Emulator

**Open Terminal 3:**

```bash
cd mobile
npm run android
```

This will:
1. Build the Android app
2. Install it on the emulator
3. Launch the app automatically

**First build may take 5-10 minutes.** Subsequent builds are faster.

---

## ✅ Verify It's Working

1. **Check Backend Logs** - You should see API requests:
   ```
   📥 Request: GET /api/users from ...
   ```

2. **Check Metro Bundler** - You should see:
   ```
   BUNDLE  ./index.js
   ```

3. **Check Emulator** - App should open and show:
   - User selector screen
   - List of users from the database

---

## 🔧 Troubleshooting

### Issue: "Could not connect to development server"

**Solution:**
```bash
# In Metro bundler terminal, press 'r' to reload
# Or shake emulator (Ctrl+M) → Reload
```

### Issue: "Backend Server Not Running" error in app

**Check:**
1. Backend is running on port 3001
2. Test in browser: `http://localhost:3001/api/users`
3. Should return JSON data

### Issue: "Metro bundler not starting"

**Solution:**
```bash
cd mobile
npm start -- --reset-cache
```

### Issue: "Build failed" or "Gradle error"

**Solution:**
```bash
cd mobile/android
./gradlew clean
cd ..
npm run android
```

### Issue: Emulator is slow

**Solutions:**
1. **Increase RAM:** AVD Manager → Edit → Show Advanced Settings → RAM: 2048MB
2. **Enable Hardware Acceleration:** AVD Manager → Edit → Graphics: Hardware - GLES 2.0
3. **Use x86/x86_64 image** (faster than ARM)

---

## 📱 Quick Commands Reference

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

### Reload App (in emulator)
- Press `R` twice quickly
- Or: `Ctrl+M` → Reload
- Or: Shake gesture (Ctrl+Ctrl)

---

## 🎯 Expected Flow

1. ✅ Emulator starts
2. ✅ Backend running on port 3001
3. ✅ Metro bundler running
4. ✅ App builds and installs
5. ✅ App opens on emulator
6. ✅ User selector screen appears
7. ✅ Can select a user and login
8. ✅ App navigates to main screens

---

## 💡 Tips

- **Keep all 3 terminals open** while testing
- **First build is slow** - be patient
- **Use `npm run android`** to rebuild after code changes
- **Check Metro bundler logs** for JavaScript errors
- **Check backend logs** for API errors

---

## 🐛 Still Having Issues?

1. **Verify emulator is running:**
   ```bash
   adb devices
   # Should show: emulator-5554   device
   ```

2. **Check backend is accessible:**
   - Open browser: `http://localhost:3001/api/users`
   - Should return JSON (even if empty array)

3. **Reset everything:**
   ```bash
   # Stop all processes
   # Close emulator
   # Then start fresh:
   # 1. Start emulator
   # 2. Start backend
   # 3. Start Metro
   # 4. Run app
   ```

---

**You're all set! The app is configured for emulator testing. Just follow the steps above.** 🚀

