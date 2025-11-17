# Production Deployment Guide

## ✅ Production Setup Complete

Your Automation Platform is now configured and running in **Production Mode**.

## 🚀 Server Information

- **Environment**: Production
- **Local URL**: http://localhost:3000
- **Network URL**: http://10.0.0.111:3000
- **Status**: Running ✓

## 📋 What's Configured

### 1. **Environment Variables** (`.env.production`)
- ✅ NODE_ENV=production
- ✅ AWX_BASE_URL=http://localhost:8080/api/v2
- ✅ AWX_TOKEN=vOlNLjf2PVxeEnPmBDpBAsUymWo68Z
- ✅ Database configured

### 2. **Build Artifacts**
- ✅ Production build created (`npm run build`)
- ✅ Optimized bundles generated
- ✅ 35 routes compiled

### 3. **Production Server**
- ✅ Running on port 3000
- ✅ Process ID available
- ✅ Background process active

## 🎯 Quick Start Commands

### Start Production Server
```bash
# Option 1: Simple startup
npm start

# Option 2: With startup script
./start-prod.sh

# Option 3: With PM2 (recommended for production)
./start-prod-pm2.sh
```

### Stop Production Server
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or with PM2
pm2 stop automation-platform
```

### Rebuild Application
```bash
npm run build
```

### View Logs
```bash
# PM2 logs (if using PM2)
pm2 logs automation-platform

# Or check logs directory
tail -f logs/pm2-out.log
tail -f logs/pm2-error.log
```

## 🔧 Production Management

### Using PM2 (Recommended)

PM2 provides process management, auto-restart, and monitoring:

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js --env production

# View status
pm2 status

# Monitor resources
pm2 monit

# View logs
pm2 logs automation-platform

# Restart
pm2 restart automation-platform

# Stop
pm2 stop automation-platform

# Auto-start on system reboot
pm2 startup
pm2 save
```

### PM2 Configuration (`ecosystem.config.js`)
- Auto-restart on crash
- Memory limit: 1GB
- Logs stored in `./logs/`
- Production environment variables

## 🎯 Run Your First Automation

### Via Web Interface
1. Navigate to: http://localhost:3000
2. Go to Catalog
3. Find "Network Connectivity Test"
4. Click "Run" and fill in:
   - Source System: VRT-PDC
   - Destination IP: 10.118.234.75
   - Ports: 9419
5. Click "Run Automation"
6. View results and click "Show More Information"

### Via Direct URL
http://localhost:3000/catalog/8cd0bfc2-ed33-4828-bb38-1149b22af081/run

### Via API
```bash
curl -X POST "http://localhost:3000/api/automations/8cd0bfc2-ed33-4828-bb38-1149b22af081/run" \
  -H "Content-Type: application/json" \
  -d '{
    "parameters": {
      "source_system": "VRT-PDC",
      "destn_ip": "10.118.234.75",
      "ports_input": "9419"
    },
    "user": {
      "name": "System",
      "email": "system@localhost"
    }
  }'
```

## 📊 Monitoring & Logs

### Application Health
```bash
# Check if server is running
curl http://localhost:3000

# Check specific route
curl http://localhost:3000/api/dashboard
```

### Database
```bash
# View database
npx prisma studio

# Run migrations
npx prisma db push
```

### Activity & Runs
- Activity Page: http://localhost:3000/activity
- View all historical runs
- See AWX responses and artifacts
- Filter by status

## 🔐 Security Recommendations

1. **Change Default Credentials**: Update AWX token in Settings
2. **Enable Authentication**: Configure user authentication
3. **HTTPS**: Set up reverse proxy (Nginx/Apache) with SSL
4. **Firewall**: Restrict access to port 3000
5. **Environment Variables**: Move sensitive data to `.env.local` (not in git)

## 🌐 Production Deployment Options

### Option 1: Standalone Server
Current setup - runs on single server with Node.js

### Option 2: Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Option 3: Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📈 Performance Tips

1. **Memory**: Monitor with `pm2 monit` or `htop`
2. **CPU**: Adjust PM2 instances based on CPU cores
3. **Database**: Regular backups of `prisma/dev.db`
4. **Logs**: Rotate logs to prevent disk space issues
5. **Cache**: Enable browser caching via reverse proxy

## 🆘 Troubleshooting

### Server won't start
```bash
# Check port availability
lsof -i:3000

# View error logs
pm2 logs --err

# Rebuild application
npm run build
```

### Database errors
```bash
# Reset database (⚠️ data loss)
npx prisma db push --accept-data-loss

# Regenerate Prisma client
npx prisma generate
```

### AWX connection issues
1. Check AWX is running: `curl http://localhost:8080/api/v2/`
2. Verify token in Settings page
3. Check AWX logs

## 📞 Support

For issues or questions:
1. Check logs: `pm2 logs` or `logs/` directory
2. Verify configuration in `.env.production`
3. Check AWX connectivity
4. Review application logs

---

**Last Updated**: 2025-01-12
**Version**: 1.0.0
**Status**: Production Ready ✅

---

## Author

**Shinish Sasidharan**

---

**Autoclik v1.0 - Automation Platform**
