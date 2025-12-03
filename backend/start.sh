#!/bin/bash

echo "🔧 Starting Everlast Intranet Backend..."
echo "📂 Current directory: $(pwd)"
echo "🔍 Node version: $(node --version || echo 'not found')"
echo "🔍 NPM version: $(npm --version || echo 'not found')"

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not found!"
    ls -la
    exit 1
fi

# Check if main.js exists
if [ ! -f "dist/main.js" ]; then
    echo "❌ Error: dist/main.js not found!"
    ls -la dist/
    exit 1
fi

echo "✅ Build files found"

# Sync database schema (don't fail if this errors)
echo "🔄 Syncing database schema..."
npx prisma db push --skip-generate --accept-data-loss || echo "⚠️ Database sync had issues, but continuing..."

# Start the application
echo "🚀 Starting NestJS application..."
echo "📡 Listening on port: ${PORT:-3001}"
echo "🌍 Binding to: 0.0.0.0"

exec node dist/main.js
