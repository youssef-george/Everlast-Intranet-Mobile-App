# Fix: App Not Appearing in Emulator

## 🔍 Quick Diagnosis

Run this first:
```bash
.\check-emulator-setup.bat
```

This will check:
- ✅ Android SDK installed
- ✅ ADB available
- ✅ Emulator running
- ✅ Dependencies installed

---

## 🚀 Step-by-Step Fix

### Step 1: Make Sure Emulator is Running

1. **Open Android Studio**
2. **Tools → Device Manager**
3. **Start an emulator:**
   - Click ▶️ play button
   - **Wait for full boot** (you'll see Android home screen)
   - This takes 1-2 minutes

4. **Verify emulator is running:**
   ```powershell
   # Find your Android SDK path (usually):
   $env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe devices
   ```
   Should show: `emulator-5554   device`

---

### Step 2: Install Dependencies

**Open Terminal:**

```bash
cd mobile
npm install
```

**Wait for completion** (5-10 minutes first time)

---

### Step 3: Start Backend Server

**Open NEW Terminal 1:**

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

### Step 4: Start Metro Bundler

**Open NEW Terminal 2:**

```bash
cd mobile
npm start
```

**Wait for:** Metro bundler to start (React Native logo appears)

**Keep this terminal open!**

---

### Step 5: Build and Install App

**Open NEW Terminal 3:**

```bash
cd mobile
npm run android
```

**First build takes 5-10 minutes!** Watch for:
- ✅ `BUILD SUCCESSFUL`
- ✅ `Installing APK`
- ✅ App launching on emulator

---

## 🐛 Common Issues

### Issue: "adb: command not found"

**Fix:** Add Android SDK to PATH or use full path:

```powershell
# Find your path (usually):
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb devices
```

### Issue: "No emulator detected"

**Fix:**
1. Make sure emulator is **fully booted** (home screen visible)
2. Wait 30 seconds after boot
3. Check: `adb devices` should show emulator

### Issue: "Build failed" or Gradle errors

**Fix 1: Clean build**
```bash
cd mobile/android
.\gradlew clean
cd ..
npm run android
```

**Fix 2: Check Android Studio SDK**
- Open Android Studio
- Tools → SDK Manager
- Install: Android SDK Platform 34, Build-Tools 34.0.0

**Fix 3: Check Java version**
```bash
java -version
# Should be Java 17 or higher
```

### Issue: "Metro bundler errors"

**Fix:**
```bash
cd mobile
npm start -- --reset-cache
```

### Issue: "App builds but doesn't appear"

**Fix:**
1. **Check app drawer** in emulator - look for "Everlast Intranet"
2. **Manually launch** if found
3. **Reload:** Press `R` twice in Metro bundler, or `Ctrl+M` in emulator → Reload

---

## ✅ Complete Setup Checklist

- [ ] Android Studio installed
- [ ] Android SDK installed (API 34)
- [ ] Android Emulator created and started
- [ ] Emulator fully booted (home screen visible)
- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Mobile dependencies installed (`cd mobile && npm install`)
- [ ] Backend running (`cd backend && npm run start:dev`)
- [ ] Metro bundler running (`cd mobile && npm start`)
- [ ] App built successfully (`cd mobile && npm run android`)

---

## 🎯 Quick Test

**Run this script:**
```bash
.\run-emulator.bat
```

This will:
1. Check emulator is running
2. Install dependencies if needed
3. Start Metro bundler
4. Build and install app

---

## 📝 Manual Build Steps

If script doesn't work, do it manually:

### Terminal 1: Backend
```bash
cd backend
npm run start:dev
```

### Terminal 2: Metro
```bash
cd mobile
npm start
```

### Terminal 3: Build App
```bash
cd mobile
npm run android
```

**Watch Terminal 3 for build progress!**

---

## 🔍 Check Build Logs

If build fails, check the error message:

**"SDK location not found":**
- Set environment variable: `ANDROID_HOME`
- Value: `C:\Users\YourUsername\AppData\Local\Android\Sdk`

**"Gradle sync failed":**
- Open `mobile/android` folder in Android Studio
- Let it sync and download dependencies

**"Unable to resolve module":**
```bash
cd mobile
rm -rf node_modules
npm install
npm start -- --reset-cache
```

---

## 💡 Pro Tips

1. **First build is always slow** - be patient (5-10 minutes)
2. **Keep all 3 terminals open** while testing
3. **Check emulator is fully booted** before running `npm run android`
4. **Watch the build output** - errors will show there
5. **If stuck, clean build:**
   ```bash
   cd mobile/android
   .\gradlew clean
   cd ..
   npm run android
   ```

---

## 🆘 Still Not Working?

**Share the error message** from the terminal when you run `npm run android` and I'll help you fix it!

Common things to check:
1. What error appears in Terminal 3 when running `npm run android`?
2. Is the emulator showing the Android home screen?
3. Does `adb devices` show the emulator?
4. Are all dependencies installed?

