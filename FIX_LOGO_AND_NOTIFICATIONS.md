# Fix Logo and Notifications

## Logo Files Issue

The logo files need to be manually copied to the `frontend/public` directory:

1. **Copy these files manually:**
   - From: `EWMC-Logo-1.png` (root directory)
   - To: `frontend/public/logo-light.png`
   
   - From: `EWMC-Logo-1-768x199-1.webp` (root directory)
   - To: `frontend/public/logo-dark.webp`

2. **After copying, restart your Vite dev server** for the changes to take effect.

3. The Header component now has a fallback that will show "Everlast" text if the images fail to load.

## Notifications Fixes Applied

### Changes Made:

1. **Added better error handling** in `NotificationsContext.tsx`:
   - Added console logging to track notification events
   - Improved error handling for API calls
   - Added retry logic (only retry once on failure)
   - Better handling of browser notification permissions

2. **Improved browser notification display**:
   - Added auto-close after 5 seconds
   - Better permission request handling
   - More detailed logging for debugging

### To Test Notifications:

1. Make sure the backend is running and the notifications module is properly set up
2. Check browser console for notification-related logs:
   - `📬 Fetched notifications: X` - Shows how many notifications were fetched
   - `🔔 Unread count: X` - Shows unread notification count
   - `🔔 Received newNotification event:` - Shows when a new notification arrives via socket
   - `✅ Browser notification shown` - Confirms browser notification was displayed

3. **Grant notification permissions** when prompted by the browser

4. **Send a test message** to yourself or another user to trigger a notification

### Common Issues:

- **Notifications not showing**: Check browser console for errors, ensure notification permissions are granted
- **Logo not appearing**: Verify files are in `frontend/public/` and restart dev server
- **Socket not connecting**: Check SocketContext and ensure backend WebSocket gateway is running
