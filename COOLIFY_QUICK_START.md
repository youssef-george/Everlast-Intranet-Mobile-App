# Coolify Quick Start Checklist

## ✅ Completed (Ready to Deploy)

- ✅ **Dockerfile Optimized**: Multi-stage build with production optimizations
- ✅ **Security Enhanced**: Non-root user, minimal dependencies, health check
- ✅ **Documentation Created**: Comprehensive deployment guide available
- ✅ **Code Pushed**: All changes committed and pushed to GitHub

## 📋 Your Checklist (Do in Order)

### 1️⃣ Create PostgreSQL Database in Coolify

**Time**: ~2 minutes

1. Go to Coolify → **Databases** → **Add Database** → **PostgreSQL**
2. Set:
   - Name: `everlast-intranet-db`
   - Version: `16-alpine`
   - Database: `everlast_intranet`
3. Click **Create**
4. **Copy the connection string** (you'll need it next)

---

### 2️⃣ Create Application in Coolify

**Time**: ~1 minute

1. Coolify → **Add New Resource** → **Application**
2. Select **Public Repository**
3. Set:
   - Repository: `https://github.com/youssef-george/Everlast-Intranet`
   - Branch: `main`
   - Name: `everlast-intranet`
4. Click **Continue**

---

### 3️⃣ Configure Build Pack

**Time**: ~30 seconds

1. In application settings → **Build Pack**
2. Select: **Dockerfile**
3. Set:
   - Dockerfile Location: `./Dockerfile`
   - Build Context: `.`
4. Click **Save**

---

### 4️⃣ Set Environment Variables

**Time**: ~2 minutes

Go to **Environment Variables** and add:

```bash
DATABASE_URL=<paste_connection_string_from_step_1>
NODE_ENV=production
PORT=3001
```

**Important**: Replace `<paste_connection_string_from_step_1>` with actual connection string!

The DATABASE_URL should look like:
```
postgresql://username:password@hostname:5432/everlast_intranet?schema=public&sslmode=require
```

Click **Save**

---

### 5️⃣ Configure Persistent Storage

**Time**: ~1 minute

1. Go to **Volumes** → **Add Volume**
2. Set:
   - Host Path: `/var/lib/coolify/volumes/everlast-uploads`
   - Container Path: `/app/backend/uploads`
3. Click **Save**

---

### 6️⃣ Deploy!

**Time**: ~5-10 minutes (build time)

1. Click the big **Deploy** button
2. Watch the deployment logs
3. Wait for: ✅ `Server running on http://localhost:3001`

---

### 7️⃣ Verify Deployment

**Time**: ~2 minutes

After deployment succeeds:

1. Click the application URL provided by Coolify
2. Verify:
   - [ ] Frontend loads
   - [ ] No errors in browser console (F12)
   - [ ] Can navigate pages
3. Check `/api` endpoint works

---

### 8️⃣ Create First Admin User

**Time**: ~2 minutes

**Option A: Via Coolify Console**
1. Go to application → **Console**
2. Run: `npx prisma studio`
3. Access Prisma Studio and create user with:
   - role: `SUPER_ADMIN`
   - accountState: `ACTIVE`

**Option B: Direct Database**
Connect to PostgreSQL and run:
```sql
INSERT INTO "User" (id, name, email, "jobTitle", department, role, "accountState")
VALUES (gen_random_uuid(), 'Admin User', 'admin@company.com', 'System Admin', 'IT', 'SUPER_ADMIN', 'ACTIVE');
```

---

## 🎉 Done!

Your application should now be running at the Coolify-provided URL!

---

## 📞 Need Help?

### If Build Fails:
1. Check deployment logs in Coolify
2. Look for the specific error message
3. Refer to `COOLIFY_DEPLOYMENT_GUIDE.md` → Troubleshooting section

### If Application Won't Start:
1. Verify `DATABASE_URL` is correct
2. Check application logs for errors
3. Ensure database is accessible

### If Frontend Shows Blank Page:
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify API endpoints are accessible

---

## 📚 Documentation

- **Full Guide**: `COOLIFY_DEPLOYMENT_GUIDE.md` (comprehensive 500+ line guide)
- **This Checklist**: `COOLIFY_QUICK_START.md` (quick reference)
- **Dockerfile**: Optimized for production with comments

---

## 🔧 Quick Commands

Test database connection:
```bash
npx prisma studio
```

View application logs:
```bash
# In Coolify dashboard → Application → Logs
```

Check health:
```bash
curl https://your-app.coolify.local/api
```

---

## 📊 Expected Deployment Time

| Step | Time |
|------|------|
| Database creation | ~2 min |
| App configuration | ~4 min |
| First deployment | ~5-10 min |
| Verification | ~2 min |
| **Total** | **~15-20 min** |

---

## 🎯 Success Indicators

You'll know it's working when:
- ✅ Coolify shows application as "Running"
- ✅ Health check passes (green indicator)
- ✅ Application URL loads frontend
- ✅ No errors in browser console
- ✅ Can login with admin user

---

**Good luck with your deployment!** 🚀

If you encounter any issues, check the comprehensive `COOLIFY_DEPLOYMENT_GUIDE.md` for detailed troubleshooting steps.

