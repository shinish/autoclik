#!/bin/bash

# Production Startup Script for Automation Platform
echo "🚀 Starting Automation Platform in Production Mode..."

# Set environment
export NODE_ENV=production

# Kill any existing process on port 3000
echo "📌 Checking for existing processes on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma generate
npx prisma db push --accept-data-loss

# Start the production server
echo "✨ Starting production server..."
npm start
