# How to Run Android App - Fixed for Windows

## 🚀 Quick Start (Recommended)

### Option 1: Use PowerShell Script (Easiest)

```powershell
cd mobile
.\start-android.ps1
```

This script will:
1. Start Metro bundler automatically
2. Build and install the app
3. Handle the Windows terminal issue

---

### Option 2: Manual Steps (If script doesn't work)

**Step 1: Start Metro Bundler (Terminal 1)**
```powershell
cd mobile
npm start
```
**Keep this terminal open!** Wait for Metro to start (React Native logo).

**Step 2: Build and Install App (Terminal 2)**
```powershell
cd mobile
npm run android
```

**Note:** The `--no-packager` flag is added to prevent the "no terminal app" error.

---

## 🔧 Why This Error Happens

The error "Cannot start server in new window because no terminal app was specified" occurs because React Native tries to open Metro bundler in a new terminal window, but Windows PowerShell doesn't know which terminal app to use.

**Solution:** Start Metro bundler manually first, then run the build command.

---

## ✅ Complete Setup Steps

### 1. Make Sure Emulator is Running

1. Open Android Studio
2. Tools → Device Manager
3. Start an emulator (▶️ button)
4. Wait for full boot

### 2. Start Backend (Terminal 1)

```powershell
cd backend
npm run start:dev
```

Wait for: `🚀 Server running on http://localhost:3001`

### 3. Start Metro Bundler (Terminal 2)

```powershell
cd mobile
npm start
```

Wait for Metro to start (React Native logo appears).

### 4. Build and Install App (Terminal 3)

```powershell
cd mobile
npm run android
```

Or use the script:
```powershell
.\start-android.ps1
```

---

## 🐛 Troubleshooting

### Issue: "Metro bundler not starting"

**Fix:**
```powershell
cd mobile
npm start -- --reset-cache
```

### Issue: "Build failed"

**Fix:**
```powershell
cd mobile/android
.\gradlew clean
cd ..
npm run android
```

### Issue: "No emulator detected"

**Fix:**
1. Make sure emulator is fully booted
2. Check: `adb devices` should show emulator
3. Restart emulator if needed

---

## 📝 Alternative: Use Batch File

You can also use:
```bash
.\run-emulator.bat
```

This handles everything automatically.

---

**The key is to start Metro bundler BEFORE running `npm run android`!**

