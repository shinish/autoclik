#!/bin/bash

# Production Startup Script with PM2 for Automation Platform
echo "🚀 Starting Automation Platform with PM2 in Production Mode..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 not found. Installing PM2..."
    npm install -g pm2
fi

# Set environment
export NODE_ENV=production

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma generate
npx prisma db push --accept-data-loss

# Stop any existing PM2 process
echo "📌 Stopping existing PM2 processes..."
pm2 stop automation-platform 2>/dev/null || true
pm2 delete automation-platform 2>/dev/null || true

# Start with PM2
echo "✨ Starting production server with PM2..."
pm2 start ecosystem.config.js --env production

# Show status
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "✅ Application started successfully!"
echo "📍 Access at: http://localhost:3000"
echo ""
echo "💡 Useful PM2 Commands:"
echo "   pm2 status              - Check application status"
echo "   pm2 logs                - View logs"
echo "   pm2 restart automation-platform - Restart application"
echo "   pm2 stop automation-platform    - Stop application"
echo "   pm2 monit               - Monitor resources"
