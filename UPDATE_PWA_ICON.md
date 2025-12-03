# How to Update PWA Icon After Installation

The PWA icon is cached by your operating system/browser. To see the new icon, you need to **uninstall and reinstall** the PWA.

## 🔄 Steps to Update PWA Icon

### On Windows (Chrome/Edge)

1. **Uninstall the existing PWA:**
   - Right-click on the PWA shortcut/icon
   - Select **"Uninstall"** or **"Remove"**
   - Or go to: `chrome://apps` → Find "Everlast Intranet" → Right-click → Remove

2. **Clear browser cache:**
   - Open DevTools (F12)
   - Go to **Application** tab
   - Click **"Service Workers"** → Unregister all
   - Click **"Storage"** → **"Clear site data"**
   - Close DevTools

3. **Restart dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   cd frontend
   npm run dev
   ```

4. **Reinstall the PWA:**
   - Open `http://localhost:5173` in browser
   - Look for install prompt or click install icon (➕) in address bar
   - Click **"Install"**
   - The new icon should appear!

### On Android

1. **Uninstall:**
   - Long-press the app icon
   - Drag to **"Uninstall"** or go to Settings → Apps → Everlast Intranet → Uninstall

2. **Clear browser data:**
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files

3. **Reinstall:**
   - Open the app URL in Chrome
   - Tap the install prompt or menu → "Install app"

### On iOS (Safari)

1. **Remove from home screen:**
   - Long-press the app icon
   - Tap **"Remove App"** → **"Delete App"**

2. **Clear Safari cache:**
   - Settings → Safari → Clear History and Website Data

3. **Reinstall:**
   - Open the app URL in Safari
   - Tap Share button → **"Add to Home Screen"**

## ✅ Verify Icon is Updated

After reinstalling, check:
- ✅ Desktop shortcut shows new icon
- ✅ Taskbar icon shows new icon
- ✅ App window title bar shows new icon
- ✅ Mobile home screen shows new icon

## 🔍 Troubleshooting

If icon still doesn't update:

1. **Check icon file exists:**
   - Verify `frontend/public/icon.png` exists
   - File should be a valid PNG image

2. **Check manifest:**
   - Open DevTools → Application → Manifest
   - Verify icons are listed correctly
   - Check for any errors

3. **Force rebuild:**
   ```bash
   cd frontend
   npm run build
   npm run preview
   ```

4. **Clear all caches:**
   - Browser cache
   - Service worker cache
   - PWA installation cache

---

**Note:** The PWA icon is cached at the OS level, so uninstalling and reinstalling is the only way to update it after initial installation.
