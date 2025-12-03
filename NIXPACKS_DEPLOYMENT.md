# Nixpacks Deployment Guide for Coolify

## ✅ Changes Made

I've updated the configuration to work with Nixpacks:

### 1. **Updated `nixpacks.toml`**
- Simplified phases for better detection
- Removed `providers` section (Nixpacks will auto-detect)
- Changed `postgresql` to `openssl` (lighter, Prisma only needs OpenSSL)
- Streamlined install and build commands

### 2. **Updated `package.json`**
- Added explicit `engines` for Node 22.x and npm 10.x
- Added `build` script that Nixpacks will use
- Added `start` script for runtime
- Removed `workspaces` config that may confuse Nixpacks
- Added empty `dependencies` object for detection

---

## 🚀 Deploy to Coolify with Nixpacks

### Step 1: Pull Latest Code in Coolify

Since you're still deploying old commit `b4a7b3f`, you need to force pull:

1. Go to your Coolify application
2. Find **"Source"** or **"General"** tab
3. Click **"Force Pull"** or **"Redeploy with Latest Commit"**
4. Verify it's no longer showing commit `b4a7b3f`

---

### Step 2: Verify Build Pack is Nixpacks

1. In Coolify, go to **"General"** or **"Build"** settings
2. Verify **Build Pack** is set to **"Nixpacks"** (it already is)
3. If there's a Nixpacks version option, use latest

---

### Step 3: Set Environment Variables

Make sure these are set in Coolify **Environment Variables**:

```bash
DATABASE_URL=postgresql://username:password@hostname:5432/everlast_intranet?schema=public&sslmode=require
NODE_ENV=production
PORT=3001
```

**Important**: Replace with your actual PostgreSQL connection string!

---

### Step 4: Deploy

1. Click **"Deploy"** button
2. Watch the logs

---

## 📊 Expected Deployment Logs

You should now see:

```
✓ Nixpacks detected Node.js application
✓ Using Node.js 22.x
✓ Installing backend dependencies...
✓ Installing frontend dependencies...
✓ Generating Prisma Client...
✓ Building frontend...
✓ Building backend...
✓ Copying frontend to backend/public...
✓ Starting application...
✓ Running Prisma migrations...
✓ Server running on port 3001
```

**NOT**:
```
❌ Nixpacks failed to detect application type
```

---

## 🔧 How Nixpacks Will Build Your App

### Phase 1: Setup
- Installs Node.js 22.x
- Installs OpenSSL for Prisma

### Phase 2: Install
```bash
npm install --prefix backend --legacy-peer-deps
npm install --prefix frontend --legacy-peer-deps
cd backend && npx prisma generate
```

### Phase 3: Build
```bash
cd frontend && npm run build
cd backend && npm run build
mkdir -p backend/public
cp -r frontend/dist/* backend/public/
mkdir -p backend/uploads
```

### Phase 4: Start
```bash
cd backend && npx prisma migrate deploy && node dist/main.js
```

---

## 🆘 Troubleshooting

### Issue 1: Still Says "Nixpacks failed to detect"

**Solution**:
1. Make sure latest code is pulled (not commit b4a7b3f)
2. Check that `package.json` and `nixpacks.toml` exist at root
3. Clear build cache in Coolify
4. Try deploying again

### Issue 2: Build Fails During npm install

**Error**: `npm ERR! peer dependencies`

**Solution**: 
The `--legacy-peer-deps` flag is already added. If still failing:
1. Check Coolify logs for specific error
2. Verify `backend/package.json` and `frontend/package.json` exist
3. Ensure GitHub repo is accessible

### Issue 3: "Cannot find module '@prisma/client'"

**Error**: Prisma Client not generated

**Solution**:
1. Verify `npx prisma generate` runs in install phase
2. Check that `backend/prisma/schema.prisma` exists
3. Look at build logs for Prisma generation errors

### Issue 4: Frontend Build Fails

**Error**: `vite build` fails

**Solution**:
1. Check `frontend/package.json` has correct vite version
2. Verify TypeScript compilation succeeds
3. Look for specific error in build logs

### Issue 5: Backend Build Fails

**Error**: TypeScript compilation fails

**Solution**:
1. Check `backend/tsconfig.json` exists
2. Verify `backend/src/main.ts` exists
3. Check for TypeScript errors in build logs

---

## ✅ Verification Checklist

After deployment succeeds:

- [ ] Application accessible via Coolify URL
- [ ] Frontend loads without errors
- [ ] API responds at `/api` endpoint
- [ ] WebSocket connections work
- [ ] Database migrations applied
- [ ] File uploads work (if volume configured)
- [ ] No errors in application logs

---

## 📝 Configuration Files

Your repository now has these Nixpacks files:

1. **`nixpacks.toml`** - Main Nixpacks configuration
2. **`package.json`** - Root package.json for Nixpacks detection
3. **`backend/package.json`** - Backend dependencies
4. **`frontend/package.json`** - Frontend dependencies

---

## 🔄 Comparison: Nixpacks vs Dockerfile

### Nixpacks (Current Setup)
✅ Simpler configuration
✅ Automatic dependency detection
✅ Faster builds with better caching
✅ No need to understand Docker
⚠️ Less control over build process

### Dockerfile (Alternative)
✅ Full control over build process
✅ Multi-stage builds for smaller images
✅ Custom security configurations
✅ Works everywhere Docker works
⚠️ More complex to configure

---

## 🎯 Next Steps

1. **Force pull latest code** in Coolify (to get past commit b4a7b3f)
2. **Deploy** with updated Nixpacks configuration
3. **Monitor logs** for successful build
4. **Test application** after deployment

---

## 💡 Pro Tips

### Faster Rebuilds
Nixpacks caches dependencies between builds. If you only change code:
- Frontend/backend dependencies won't reinstall
- Only changed files will rebuild

### Debug Mode
If build fails, check Coolify logs with "Show Debug Logs" for detailed output.

### Rollback
If deployment fails, Coolify keeps previous working version running.

---

## 📞 Still Having Issues?

### Check These:
1. ✅ Latest code pulled (not b4a7b3f)
2. ✅ Build Pack is "Nixpacks"
3. ✅ Environment variables set (DATABASE_URL, NODE_ENV, PORT)
4. ✅ Database is accessible
5. ✅ GitHub repo is public or Coolify has access

### Common Fixes:
- Clear build cache
- Disconnect and reconnect repository
- Manually trigger redeploy
- Check Coolify server has enough disk space

---

**Your application is now configured for Nixpacks deployment!** 

After you force pull the latest code in Coolify, the deployment should work. 🚀

