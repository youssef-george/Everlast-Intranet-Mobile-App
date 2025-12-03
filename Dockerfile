# Multi-stage build for Everlast Intranet
# Optimized for production deployment on Coolify

# Stage 1: Build Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps

# Copy frontend source
COPY frontend/ ./

# Build frontend (outputs to dist/)
RUN npm run build

# Stage 2: Build Backend
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci

# Copy Prisma schema first for better caching
COPY backend/prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy backend source
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Build backend (outputs to dist/)
RUN npm run build

# Stage 3: Production Runtime
FROM node:22-alpine
WORKDIR /app/backend

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Install only production dependencies
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy Prisma files for migrations
COPY --from=backend-builder /app/backend/prisma ./prisma
COPY --from=backend-builder /app/backend/node_modules/.prisma ./node_modules/.prisma

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./dist

# Copy frontend build to backend/public
COPY --from=frontend-builder /app/frontend/dist ./public

# Create uploads directory with proper permissions
RUN mkdir -p ./uploads && \
    chown -R nestjs:nodejs ./uploads && \
    chown -R nestjs:nodejs ./public && \
    chown -R nestjs:nodejs ./dist

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
