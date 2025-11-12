# Check App Status and Ports on VPS

## Quick Commands to Check App Status

### 1. Check PM2 Process Status

```bash
# See all PM2 processes
pm2 list

# See detailed info about your app
pm2 info ouiimi

# See real-time logs
pm2 logs ouiimi

# See only error logs
pm2 logs ouiimi --err

# See only output logs
pm2 logs ouiimi --out
```

**Output will show:**
- Process ID
- Status (online/stopped)
- CPU/Memory usage
- Port (if configured)
- Restart count

### 2. Check What Ports Are Listening

```bash
# Check all listening ports
netstat -tulpn | grep LISTEN

# Or using ss (modern alternative)
ss -tulpn | grep LISTEN

# Check specific port (e.g., 3000)
netstat -tulpn | grep :3000

# Check if port 3000 is in use
lsof -i :3000
```

### 3. Check Next.js App Port

```bash
# Check the ecosystem.config.js file
cat /root/ouiimi/ecosystem.config.js

# Check environment variables
cat /root/ouiimi/.env.production | grep PORT

# Check if PORT is set in environment
echo $PORT
```

### 4. Check Nginx Configuration (Reverse Proxy)

```bash
# Check Nginx config
cat /etc/nginx/sites-available/ouiimi.com.au
# or
cat /etc/nginx/sites-enabled/ouiimi.com.au

# Test Nginx config
nginx -t

# Check Nginx status
systemctl status nginx
```

### 5. Check if App is Accessible

```bash
# Test local connection to app
curl http://localhost:3000

# Test health endpoint
curl http://localhost:3000/api/health

# Test from outside (your domain)
curl https://ouiimi.com.au/api/health
```

## Understanding Next.js Ports

**Important:** Next.js is a **full-stack framework**, so:
- ✅ **Frontend and Backend run on the SAME port** (typically 3000)
- ✅ Frontend: Served on `/` (e.g., `http://localhost:3000/`)
- ✅ Backend API: Served on `/api/*` (e.g., `http://localhost:3000/api/auth/signin`)

**There is NO separate backend port!** Everything runs on one port.

## Typical Setup

```
Internet → Nginx (Port 80/443) → Next.js App (Port 3000)
```

- **Nginx**: Listens on port 80 (HTTP) and 443 (HTTPS)
- **Next.js**: Listens on port 3000 (internal, behind Nginx)
- **PM2**: Manages the Next.js process

## Complete Status Check Script

Create this script to check everything at once:

```bash
#!/bin/bash
echo "=== PM2 Status ==="
pm2 list
echo ""
echo "=== Listening Ports ==="
netstat -tulpn | grep LISTEN | grep -E ':(80|443|3000)'
echo ""
echo "=== App Port from Config ==="
grep -E 'PORT|port' /root/ouiimi/ecosystem.config.js /root/ouiimi/.env.production 2>/dev/null
echo ""
echo "=== Nginx Status ==="
systemctl status nginx --no-pager | head -5
echo ""
echo "=== Test App ==="
curl -s http://localhost:3000/api/health || echo "App not responding on port 3000"
```

Save it as `check-app.sh` and run:
```bash
chmod +x check-app.sh
./check-app.sh
```

## Quick One-Liner Commands

```bash
# See PM2 status
pm2 list

# See what's running on port 3000
lsof -i :3000

# See all Node.js processes
ps aux | grep node

# See PM2 logs (last 50 lines)
pm2 logs ouiimi --lines 50

# Restart app
pm2 restart ouiimi

# Stop app
pm2 stop ouiimi

# Start app
pm2 start ouiimi
```

## Check App Configuration

```bash
# Go to app directory
cd /root/ouiimi

# Check package.json for start script
cat package.json | grep -A 2 '"start"'

# Check ecosystem.config.js for port
cat ecosystem.config.js

# Check .env.production for PORT
grep PORT .env.production
```

## Default Ports

- **Next.js Development**: Port 3000
- **Next.js Production**: Port 3000 (or PORT env variable)
- **Nginx HTTP**: Port 80
- **Nginx HTTPS**: Port 443

## Troubleshooting

### App not responding?

```bash
# Check if PM2 process is running
pm2 list

# Check logs for errors
pm2 logs ouiimi --err --lines 100

# Check if port is in use
lsof -i :3000

# Restart the app
pm2 restart ouiimi
```

### Port already in use?

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process (if needed)
kill -9 <PID>

# Or change port in .env.production
# Add: PORT=3001
# Then restart: pm2 restart ouiimi
```

