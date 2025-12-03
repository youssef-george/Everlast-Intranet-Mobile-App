# Deployment Guide

This guide explains how to deploy the Everlast Intranet application using Docker or Coolify/Nixpacks.

## Prerequisites

- Docker (for Docker deployment)
- PostgreSQL database (for production)
- Environment variables configured

## Environment Variables

Create a `.env` file in the `backend/` directory or set these environment variables in your deployment platform:

```env
DATABASE_URL="postgresql://user:password@host:5432/database_name"
PORT=3001
NODE_ENV=production
```

### Database Setup

The application uses PostgreSQL in production. Make sure your database is accessible and the connection string is correct.

## Deployment Options

### Option 1: Docker (Recommended)

The project includes a `Dockerfile` that builds both frontend and backend:

```bash
# Build the image
docker build -t everlast-intranet .

# Run the container
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://user:password@host:5432/dbname" \
  -e PORT=3001 \
  -e NODE_ENV=production \
  everlast-intranet
```

### Option 2: Coolify/Nixpacks

The project includes a `nixpacks.toml` configuration file. Coolify will automatically detect and use this configuration.

**Important:** Make sure to set the following environment variables in Coolify:

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Set to `production`

## How It Works

1. **Build Process:**
   - Frontend is built using Vite and output to `frontend/dist`
   - Backend is built using TypeScript compiler
   - Frontend build is copied to `backend/public` directory

2. **Runtime:**
   - Backend serves the frontend static files from `/public`
   - API routes are prefixed with `/api`
   - Socket.IO is available at `/socket.io`
   - File uploads are served from `/uploads`

3. **Database Migrations:**
   - Migrations run automatically on container startup using `prisma migrate deploy`

## Architecture

- **Single Container:** Both frontend and backend run in the same container
- **Port:** Application runs on port 3001 (configurable via `PORT` env var)
- **Static Files:** Frontend is served as static files by the NestJS backend
- **API Routes:** All API endpoints are under `/api` prefix
- **SPA Routing:** All non-API routes serve the frontend `index.html` for client-side routing

## Troubleshooting

### Nixpacks Detection Failed

If you see "Nixpacks failed to detect the application type":
- Ensure `Dockerfile` or `nixpacks.toml` exists in the root directory
- Check that the repository structure is correct
- Verify that `package.json` files exist in `backend/` and `frontend/` directories

### Database Connection Issues

- Verify `DATABASE_URL` is correctly formatted
- Ensure database is accessible from the deployment environment
- Check that migrations have run successfully

### Port Issues

- Default port is 3001
- Change via `PORT` environment variable
- Ensure the port is exposed in your deployment configuration

## Production Checklist

- [ ] Set `DATABASE_URL` environment variable
- [ ] Set `NODE_ENV=production`
- [ ] Configure `PORT` if different from 3001
- [ ] Ensure PostgreSQL database is accessible
- [ ] Verify file upload directory permissions (if using file uploads)
- [ ] Configure CORS if needed (currently allows all origins)
- [ ] Set up SSL/HTTPS for production
- [ ] Configure proper logging and monitoring

## Notes

- The application automatically runs database migrations on startup
- Frontend and backend are served from the same origin in production
- Socket.IO uses WebSocket with polling fallback for compatibility
- File uploads are stored in the `backend/uploads` directory
