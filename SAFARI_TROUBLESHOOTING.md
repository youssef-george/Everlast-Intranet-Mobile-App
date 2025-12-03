# Safari Troubleshooting Guide

## Common Safari Issues and Solutions

### Issue: "Safari can't open the page" or Blank Page

#### Solution 1: Clear Safari Cache
1. Open Safari
2. Go to **Settings** → **Safari**
3. Tap **Clear History and Website Data**
4. Try accessing the page again

#### Solution 2: Disable Safari Content Blockers
1. Open Safari
2. Go to **Settings** → **Safari**
3. Scroll to **Privacy & Security**
4. Disable **Block All Cookies** (temporarily)
5. Disable any content blockers
6. Try accessing the page again

#### Solution 3: Check Network Connection
1. Ensure both devices are on the **same WiFi network**
2. Verify the IP address is correct: `http://192.168.11.211:5173`
3. Try accessing from Safari on the same computer first to verify it works

#### Solution 4: Safari Private Browsing
1. Open Safari in **Private Browsing** mode
2. Try accessing the page
3. If it works in private mode, it's likely a cache/cookie issue

#### Solution 5: Check Console for Errors
1. On Mac: Open Safari → **Develop** → **Show Web Inspector**
2. On iPhone/iPad: Connect to Mac, then use Safari Develop menu
3. Check the **Console** tab for JavaScript errors
4. Check the **Network** tab to see if requests are failing

### Issue: "This Connection is Not Private" or Security Warning

Safari may show security warnings for HTTP connections. This is normal for local development.

**Solution:**
1. Click **Show Details** or **Advanced**
2. Click **Proceed to [IP Address] (unsafe)**
3. Safari will remember this for the session

### Issue: Service Worker Errors

If you see service worker errors in Safari:

**Solution:**
1. Open Safari Settings
2. Go to **Advanced** → **Website Data**
3. Search for your IP address
4. Click **Remove** to clear service worker data
5. Refresh the page

### Issue: WebSocket Connection Fails

Safari sometimes has issues with WebSocket connections.

**Solution:**
- The app is configured to automatically fall back to polling if WebSocket fails
- Check the browser console to see which transport is being used
- If you see "polling" in the console, that's normal and working correctly

### Issue: Page Loads But Shows Blank Screen

**Possible Causes:**
1. JavaScript error preventing React from rendering
2. CSS not loading
3. Service worker caching old version

**Solutions:**
1. **Hard Refresh**: Press `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
2. **Clear Cache**: Settings → Safari → Clear History and Website Data
3. **Check Console**: Look for JavaScript errors in Safari Developer Tools
4. **Disable Service Worker**: 
   - Safari → Develop → Disable Service Workers
   - Refresh the page

### Issue: CORS Errors in Console

If you see CORS errors:

**Check:**
1. Backend server is running on port 3001
2. Backend CORS is configured to allow all origins (already done)
3. Both frontend and backend are accessible from the network

### Quick Diagnostic Steps

1. **Test from Same Computer First**
   - Open Safari on the same computer
   - Go to `http://192.168.11.211:5173`
   - If this works, the server is configured correctly

2. **Test from Another Device**
   - Ensure both devices on same WiFi
   - Use the exact IP address shown in Vite output
   - Try different browsers (Chrome, Firefox) to compare

3. **Check Network Tab**
   - Open Safari Developer Tools
   - Go to Network tab
   - Reload the page
   - Check if any requests are failing (red status)

4. **Check Console**
   - Look for JavaScript errors
   - Look for CORS errors
   - Look for WebSocket connection errors

### Safari-Specific Settings

**For Best Compatibility:**
1. **JavaScript**: Must be enabled (Settings → Safari → Advanced → JavaScript)
2. **Cookies**: Allow from websites you visit
3. **Content Blockers**: Disable for testing
4. **Private Browsing**: Try both normal and private mode

### Still Not Working?

1. **Check Server Logs**: Look at backend and frontend console output for errors
2. **Try Different Browser**: Test in Chrome/Firefox to see if it's Safari-specific
3. **Check Firewall**: Ensure Windows Firewall allows ports 5173 and 3001
4. **Verify IP Address**: Run `get-ip-address.bat` to confirm correct IP
5. **Router Settings**: Check if router has AP Isolation enabled (disable it)

### Debugging Commands

**From Safari on Mac:**
- `Cmd + Option + I` - Open Developer Tools
- `Cmd + Option + E` - Open Console
- `Cmd + R` - Refresh
- `Cmd + Shift + R` - Hard Refresh

**From iPhone/iPad:**
- Connect to Mac via USB
- On Mac: Safari → Develop → [Your Device] → [Your Page]
- This opens Safari Developer Tools for the mobile device
