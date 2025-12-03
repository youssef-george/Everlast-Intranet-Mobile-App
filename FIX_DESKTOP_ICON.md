# Fix Desktop PWA Icon

The desktop shortcut icon is cached separately from the taskbar. Here's how to fix it:

## 🔧 Quick Fix

### Method 1: Delete and Reinstall (Recommended)

1. **Delete the desktop shortcut:**
   - Right-click "Everlast Intranet" on desktop
   - Click **"Delete"**

2. **Clear Windows icon cache:**
   - Press `Windows + R`
   - Type: `ie4uinit.exe -show`
   - Press Enter
   - Or restart Windows Explorer:
     - Press `Ctrl + Shift + Esc` (Task Manager)
     - Find "Windows Explorer"
     - Right-click → Restart

3. **Reinstall PWA:**
   - Open `http://localhost:5173` in browser
   - Click install icon (➕) in address bar
   - Click **"Install"**
   - New shortcut will be created with correct icon

### Method 2: Manually Change Icon

1. **Right-click** the desktop shortcut
2. Click **"Properties"**
3. Click **"Change Icon"** button
4. Click **"Browse"**
5. Navigate to: `C:\Users\youssef.george\Downloads\Everlast Intranet\frontend\public\icon.png`
6. Select `icon.png`
7. Click **"OK"** → **"Apply"** → **"OK"**

### Method 3: Clear All Icon Cache (Advanced)

1. **Close all programs**

2. **Open Command Prompt as Administrator:**
   - Press `Windows + X`
   - Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

3. **Run these commands:**
   ```cmd
   taskkill /f /im explorer.exe
   del /a /q "%localappdata%\IconCache.db"
   del /a /f /q "%localappdata%\Microsoft\Windows\Explorer\iconcache*"
   start explorer.exe
   ```

4. **Reinstall PWA** (as in Method 1)

## ✅ Verify

After fixing:
- ✅ Desktop shortcut shows your logo
- ✅ Taskbar icon shows your logo (already fixed)
- ✅ App window shows your logo

## 🔍 Why This Happens

Windows caches icons in multiple places:
- **Desktop shortcuts** - Cached separately
- **Taskbar icons** - Cached separately  
- **Start menu** - Cached separately

Each location needs to be refreshed individually.

---

**Note:** If the icon still doesn't update, try restarting your computer after clearing the cache.
