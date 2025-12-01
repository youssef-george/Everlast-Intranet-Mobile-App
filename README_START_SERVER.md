# How to Start the Backend Server

## Quick Start (Easiest Method)

**Double-click `START_SERVER.bat`** in the project root folder.

This will automatically:
- Install dependencies if needed
- Generate Prisma client
- Run database migrations
- Start the server

---

## Manual Start (If you see errors)

### Step 1: Open Terminal
Open PowerShell or Command Prompt

### Step 2: Navigate to Backend Folder
```bash
cd "c:\Users\youssef.george\Downloads\Everlast Intranet\backend"
```

### Step 3: Install Dependencies (if not already done)
```bash
npm install
```

### Step 4: Generate Prisma Client
```bash
npm run prisma:generate
```

### Step 5: Run Database Migrations (if database doesn't exist)
```bash
npm run prisma:migrate
```

### Step 6: Start the Server
```bash
npm run start:dev
```

### Step 7: Wait for Success Message
You should see:
```
🚀 Server running on http://localhost:3001
```

---

## Verify Server is Running

**Option 1:** Double-click `CHECK_SERVER.bat` to check if server is running

**Option 2:** Open browser and go to: `http://localhost:3001`

**Option 3:** Run in terminal:
```bash
curl http://localhost:3001
```

---

## Troubleshooting

### Port 3001 Already in Use
If you get "port already in use" error:
1. Find the process: `netstat -ano | findstr :3001`
2. Kill the process: `taskkill /PID <process_id> /F`
3. Or change PORT in `.env` file

### Missing Dependencies
Run: `npm install` in the backend folder

### Prisma Errors
Run these in order:
```bash
npm run prisma:generate
npm run prisma:migrate
```

### TypeScript Compilation Errors
Check `tsconfig.json` and ensure all dependencies are installed

---

## Once Server is Running

1. ✅ You'll see: `🚀 Server running on http://localhost:3001`
2. ✅ Refresh your browser
3. ✅ Connection errors will stop
4. ✅ The app will work normally

---

**Note:** Keep the terminal window open while the server is running. Press `Ctrl+C` to stop it.
