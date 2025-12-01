# 🚀 Running Everlast Intranet Locally

This guide will help you run the Everlast Intranet application on your local machine.

## 📋 Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **Git** (optional, for cloning)

Verify installation:
```powershell
node --version
npm --version
```

## 🎯 Quick Start (Easiest Method)

### Method 1: Using Batch Files (Windows)

1. **Start Backend Server:**
   - Double-click `start-backend.bat` in the root folder
   - Wait for: `Server starting on http://localhost:3001`
   - **Keep this window open**

2. **Start Frontend Server:**
   - Double-click `start-frontend.bat` in the root folder
   - Wait for: `Local: http://localhost:5173/`
   - **Keep this window open**

3. **Open in Browser:**
   - Navigate to: `http://localhost:5173`
   - The app should load!

---

## 📝 Manual Start (Step-by-Step)

### Step 1: Start Backend Server

1. Open **PowerShell** or **Command Prompt**
2. Navigate to backend folder:
   ```powershell
   cd "c:\Users\youssef.george\Downloads\Everlast Intranet\backend"
   ```
3. Install dependencies (first time only):
   ```powershell
   npm install
   ```
4. Generate Prisma client:
   ```powershell
   npm run prisma:generate
   ```
5. Run database migrations (if needed):
   ```powershell
   npx prisma migrate dev
   ```
6. Start the development server:
   ```powershell
   npm run start:dev
   ```
7. **Wait for:** `Server starting on http://localhost:3001`
8. **Keep this terminal window open!**

### Step 2: Start Frontend Server

1. Open a **NEW** PowerShell or Command Prompt window
2. Navigate to frontend folder:
   ```powershell
   cd "c:\Users\youssef.george\Downloads\Everlast Intranet\frontend"
   ```
3. Install dependencies (first time only):
   ```powershell
   npm install
   ```
4. Start the development server:
   ```powershell
   npm run dev
   ```
5. **Wait for:** `Local: http://localhost:5173/`
6. **Keep this terminal window open!**

### Step 3: Access the Application

1. Open your web browser
2. Navigate to: **http://localhost:5173**
3. The Everlast Intranet app should load!

---

## ✅ Verification Checklist

- [ ] Backend server running on `http://localhost:3001`
- [ ] Frontend server running on `http://localhost:5173`
- [ ] No errors in backend terminal
- [ ] No errors in frontend terminal
- [ ] Browser shows the app (not blank page)
- [ ] No "Backend Server Not Running" warning in browser

---

## 🔧 Troubleshooting

### Backend won't start

**Error: `await is only valid in async functions`**
- This was fixed in `chat.service.ts`. Make sure you have the latest code.

**Error: `Cannot find module`**
- Run `npm install` in the backend folder

**Error: `Prisma Client not generated`**
- Run `npm run prisma:generate` in the backend folder

**Port 3001 already in use**
- Close other applications using port 3001
- Or change the port in `backend/src/main.ts`

### Frontend won't start

**Error: `ERR_CONNECTION_REFUSED`**
- Make sure the frontend dev server is running
- Check that port 5173 is not blocked by firewall

**Error: `Cannot find module`**
- Run `npm install` in the frontend folder

**Blank page in browser**
- Check browser console for errors (F12)
- Verify both servers are running
- Try hard refresh: `Ctrl + Shift + R`

### Backend connection errors

**"Backend Server Not Running" warning**
- Verify backend is running on port 3001
- Check backend terminal for errors
- Try accessing `http://localhost:3001` directly in browser

**Socket.IO connection errors**
- Ensure backend is running
- Check that port 3001 is accessible
- Verify CORS settings in backend

---

## 🛑 Stopping the Servers

To stop the servers:
1. Go to each terminal window
2. Press `Ctrl + C`
3. Confirm if prompted

---

## 📁 Project Structure

```
Everlast Intranet/
├── backend/          # NestJS backend server
│   ├── src/         # Source code
│   ├── prisma/      # Database schema
│   └── package.json
├── frontend/         # React frontend
│   ├── src/         # Source code
│   └── package.json
├── start-backend.bat    # Windows script to start backend
└── start-frontend.bat   # Windows script to start frontend
```

---

## 🔄 Development Workflow

1. **Start both servers** (backend first, then frontend)
2. **Make code changes** - servers will auto-reload
3. **Test in browser** at `http://localhost:5173`
4. **Check terminal windows** for errors
5. **Stop servers** with `Ctrl + C` when done

---

## 💡 Tips

- **Keep both terminal windows visible** to monitor for errors
- **Use browser DevTools** (F12) to debug frontend issues
- **Check terminal output** for backend errors
- **First run takes longer** (installing dependencies)
- **Subsequent runs are faster** (dependencies cached)

---

## 🆘 Need Help?

If you encounter issues:
1. Check the error messages in terminal windows
2. Verify both servers are running
3. Check browser console (F12) for frontend errors
4. Ensure ports 3001 and 5173 are not in use by other apps

---

**Happy Coding! 🎉**
