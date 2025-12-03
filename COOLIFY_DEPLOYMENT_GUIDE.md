# Coolify Deployment Guide - Everlast Intranet

## Project Overview

**Full-Stack Monorepo Application**
- **Frontend**: React 18 + Vite + TypeScript + PWA
- **Backend**: NestJS 10 + TypeScript + Prisma + Socket.IO
- **Database**: PostgreSQL
- **Port**: 3001

## Prerequisites

Before deploying, ensure you have:
1. ✅ Coolify instance running and accessible
2. ✅ GitHub repository with latest code pushed
3. ✅ PostgreSQL database (can be created in Coolify)

---

## Step-by-Step Deployment

### Step 1: Create PostgreSQL Database in Coolify

1. In Coolify dashboard, navigate to **"Databases"**
2. Click **"Add Database"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `everlast-intranet-db`
   - **Version**: `16-alpine` (or latest stable)
   - **Database Name**: `everlast_intranet`
   - **Username**: (auto-generated or set custom)
   - **Password**: (auto-generated or set custom)
4. Click **"Create Database"**
5. **Copy the connection string** - you'll need it in Step 3

The connection string format will be:
```
postgresql://username:password@hostname:5432/everlast_intranet
```

---

### Step 2: Create Application in Coolify

1. In Coolify dashboard, click **"Add New Resource"** → **"Application"**
2. Select **"Public Repository"**
3. Configure repository:
   - **Repository URL**: `https://github.com/youssef-george/Everlast-Intranet`
   - **Branch**: `main`
   - **Application Name**: `everlast-intranet`
4. Click **"Continue"**

---

### Step 3: Configure Build Settings

1. In the application settings, find **"Build Pack"**
2. Select **"Dockerfile"** from the dropdown
3. Set build configuration:
   - **Dockerfile Location**: `./Dockerfile`
   - **Docker Build Context**: `.` (root directory)
   - **Base Directory**: (leave empty or set to `.`)
4. **Save** the build settings

---

### Step 4: Configure Environment Variables

Navigate to **"Environment Variables"** section and add the following:

#### Required Variables:

```bash
DATABASE_URL=postgresql://username:password@hostname:5432/everlast_intranet?schema=public&sslmode=require
NODE_ENV=production
PORT=3001
```

**Important**: Replace the `DATABASE_URL` with the actual connection string from Step 1.

#### Optional Variables (for custom domains):

```bash
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
```

**Note**: If you don't have a custom domain yet, you can skip these and add them later.

---

### Step 5: Configure Persistent Storage

To ensure uploaded files persist across deployments:

1. In application settings, find **"Volumes"** or **"Storage"**
2. Click **"Add Volume"**
3. Configure:
   - **Host Path**: `/var/lib/coolify/volumes/everlast-uploads`
   - **Container Path**: `/app/backend/uploads`
   - **Type**: Bind mount
4. **Save** the volume configuration

---

### Step 6: Configure Port Mapping

1. In application settings, find **"Ports"** or **"Network"**
2. Verify that port **3001** is exposed
3. Coolify will automatically assign a public URL

---

### Step 7: Deploy Application

1. Click the **"Deploy"** button
2. Monitor the deployment logs

### Expected Deployment Stages:

You should see these stages in the logs:

```
✓ Stage 1: Building Frontend
  - Installing frontend dependencies
  - Building React application with Vite
  - Output: frontend/dist

✓ Stage 2: Building Backend
  - Installing backend dependencies
  - Generating Prisma Client
  - Compiling TypeScript to JavaScript
  - Output: backend/dist

✓ Stage 3: Creating Production Image
  - Installing production dependencies only
  - Copying built frontend to backend/public
  - Setting up non-root user
  - Configuring health check

✓ Starting Container
  - Running Prisma migrations
  - Starting NestJS server
  - Listening on port 3001
```

---

### Step 8: Verify Deployment

After successful deployment, verify:

1. **Access the application**:
   - Open the Coolify-provided URL (e.g., `https://your-app.coolify.local`)
   
2. **Check health status**:
   - Navigate to: `https://your-app.coolify.local/api`
   - Should return backend status or a response

3. **Test functionality**:
   - [ ] Frontend loads correctly
   - [ ] Login/authentication works
   - [ ] API endpoints respond
   - [ ] WebSocket connections work (check browser console)
   - [ ] File uploads work
   - [ ] No CORS errors in browser console

4. **Check logs**:
   - In Coolify, view application logs
   - Look for: `🚀 Server running on http://localhost:3001`
   - No error messages or connection failures

---

## Environment Variables Reference

### Complete List of Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db?schema=public&sslmode=require` |
| `NODE_ENV` | ✅ Yes | Node environment | `production` |
| `PORT` | ✅ Yes | Application port | `3001` |
| `FRONTEND_URL` | ❌ No | Frontend base URL | `https://intranet.company.com` |
| `CORS_ORIGIN` | ❌ No | Allowed CORS origin | `https://intranet.company.com` |

---

## PostgreSQL Connection String Formats

### For Coolify-Managed PostgreSQL (with SSL):
```
postgresql://username:password@postgres-host:5432/everlast_intranet?schema=public&sslmode=require
```

### For Coolify-Managed PostgreSQL (without SSL):
```
postgresql://username:password@postgres-host:5432/everlast_intranet?schema=public
```

### For External PostgreSQL:
```
postgresql://username:password@external-host:5432/everlast_intranet?schema=public&sslmode=disable
```

---

## Troubleshooting

### Issue 1: Deployment Fails - "Cannot find module '@prisma/client'"

**Cause**: Prisma Client not generated during build

**Solution**:
- Verify `npx prisma generate` runs in the Dockerfile
- Check build logs for errors during Prisma generation
- Ensure `backend/prisma/schema.prisma` exists in repository

### Issue 2: "Migration failed" or "Schema out of sync"

**Cause**: Database connection issues or migration conflicts

**Solution**:
1. Verify `DATABASE_URL` is correct in environment variables
2. Check database is accessible from the container
3. View container logs for specific Prisma error messages
4. If needed, connect to database manually and run:
   ```bash
   npx prisma migrate deploy
   ```

### Issue 3: Frontend Shows Blank Page or 404

**Cause**: Frontend build not served correctly

**Solution**:
1. Check that frontend build succeeded in logs
2. Verify `backend/public` contains `index.html`
3. Ensure backend main.ts serves static files from `public/`
4. Check browser console for JavaScript errors

### Issue 4: "CORS policy blocked" Errors

**Cause**: CORS misconfiguration

**Solution**:
1. Add `CORS_ORIGIN` environment variable with your domain
2. For development, you can temporarily set backend CORS to `origin: true`
3. Restart the application after adding environment variables

### Issue 5: WebSocket Connection Fails

**Cause**: Socket.IO connection blocked or misconfigured

**Solution**:
1. Check browser console for Socket.IO errors
2. Verify WebSocket is enabled in Coolify (usually automatic)
3. Ensure `/socket.io` path is not blocked by proxy
4. Check application logs for Socket.IO connection messages

### Issue 6: Uploaded Files Disappear After Redeploy

**Cause**: No persistent volume configured

**Solution**:
1. Follow Step 5 to create persistent volume for `/app/backend/uploads`
2. Redeploy application
3. Test file upload to verify persistence

### Issue 7: Build Fails - "npm ci: command not found"

**Cause**: Docker build stage issue

**Solution**:
1. Verify Dockerfile uses `node:22-alpine` as base image
2. Check build logs for specific error line
3. Ensure `package.json` and `package-lock.json` exist in correct folders

### Issue 8: Application Crashes on Startup

**Cause**: Missing environment variables or database connection failure

**Solution**:
1. Check application logs in Coolify
2. Verify all required environment variables are set
3. Test database connection manually
4. Look for specific error messages in startup logs

---

## Post-Deployment Steps

### 1. Create Super Admin User

After first deployment, you need to create an admin user:

1. **Option A: Use Coolify Console**:
   - In Coolify, open application console/terminal
   - Run:
     ```bash
     npx prisma studio
     ```
   - Access Prisma Studio via forwarded port
   - Create user with `role: "SUPER_ADMIN"`

2. **Option B: Direct Database Access**:
   - Connect to PostgreSQL database
   - Insert admin user manually:
     ```sql
     INSERT INTO "User" (id, name, email, "jobTitle", department, role, "accountState")
     VALUES (gen_random_uuid(), 'Admin User', 'admin@company.com', 'System Admin', 'IT', 'SUPER_ADMIN', 'ACTIVE');
     ```

### 2. Configure Custom Domain (Optional)

1. In Coolify, navigate to application **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `intranet.company.com`)
4. Update DNS records as instructed by Coolify
5. Update environment variables:
   - `FRONTEND_URL=https://intranet.company.com`
   - `CORS_ORIGIN=https://intranet.company.com`
6. Redeploy application

### 3. Enable SSL/HTTPS

Coolify automatically provisions SSL certificates via Let's Encrypt for custom domains:
1. Ensure domain is properly configured
2. Wait for SSL certificate generation (automatic)
3. Force HTTPS redirect in Coolify settings (recommended)

### 4. Set Up Backups

**Database Backups**:
1. In Coolify, navigate to your PostgreSQL database
2. Enable automated backups
3. Configure backup schedule (recommended: daily)
4. Set retention period

**Uploads Backups**:
1. Set up backup script for `/var/lib/coolify/volumes/everlast-uploads`
2. Use Coolify backup features or external backup service

### 5. Monitor Application

**Health Monitoring**:
- Coolify provides built-in health check monitoring
- View application health status in dashboard
- Set up alerts for downtime (if available)

**Logs**:
- Access real-time logs in Coolify dashboard
- Monitor for errors or performance issues
- Set up log aggregation if needed

**Resource Usage**:
- Monitor CPU and memory usage in Coolify
- Scale resources if needed
- Consider horizontal scaling for high traffic

---

## Scaling Considerations

### Vertical Scaling (Single Container)
- Increase container resources in Coolify settings
- Suitable for: up to 100 concurrent users

### Horizontal Scaling (Multiple Containers)
**Requirements**:
1. Shared session store (Redis)
2. Shared file storage (S3 or network volume)
3. Load balancer (provided by Coolify)

**Note**: Current implementation uses in-memory sessions. For horizontal scaling, implement Redis session store.

---

## Maintenance

### Updating the Application

1. Push changes to GitHub `main` branch
2. In Coolify, click **"Redeploy"** (manual) or wait for webhook (automatic)
3. Monitor deployment logs
4. Verify application after deployment

### Database Migrations

Migrations run automatically on container startup via:
```bash
npx prisma migrate deploy
```

To create new migrations locally:
```bash
cd backend
npx prisma migrate dev --name description_of_changes
git add prisma/migrations
git commit -m "Add database migration"
git push
```

### Rollback Procedure

If deployment fails:
1. In Coolify, view deployment history
2. Click **"Rollback"** to previous working version
3. Investigate issue in logs
4. Fix code and redeploy

---

## Security Best Practices

1. ✅ **Non-root user**: Dockerfile runs as `nestjs` user (UID 1001)
2. ✅ **Environment variables**: Sensitive data in Coolify secrets
3. ✅ **SSL/HTTPS**: Enabled via Coolify automatic certificates
4. ✅ **Database**: PostgreSQL with strong password
5. ⚠️ **CORS**: Configure `CORS_ORIGIN` to your domain only
6. ⚠️ **Rate limiting**: Consider adding rate limiting middleware
7. ⚠️ **Authentication**: Implement proper JWT or session auth

---

## Support and Resources

- **Coolify Documentation**: https://coolify.io/docs
- **NestJS Documentation**: https://docs.nestjs.com
- **Prisma Documentation**: https://www.prisma.io/docs
- **Docker Best Practices**: https://docs.docker.com/develop/dev-best-practices/

---

## Quick Command Reference

### View Application Logs
In Coolify dashboard → Application → Logs

### Access Application Console
In Coolify dashboard → Application → Console

### Test Database Connection
```bash
npx prisma studio
```

### Run Migrations Manually
```bash
npx prisma migrate deploy
```

### Check Application Health
```bash
curl https://your-app.coolify.local/api
```

---

## Success Criteria

Your deployment is successful when:
- ✅ Application accessible via Coolify URL
- ✅ Frontend loads without errors
- ✅ API endpoints respond correctly
- ✅ Database connection working
- ✅ File uploads work and persist
- ✅ WebSocket connections established
- ✅ No CORS errors in browser
- ✅ Health check passing in Coolify
- ✅ Logs show no critical errors

---

**Last Updated**: December 2024
**Version**: 1.0.0

