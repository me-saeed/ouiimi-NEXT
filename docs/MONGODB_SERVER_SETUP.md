# MongoDB Server Setup Guide

## Quick Start

### Check if MongoDB is Running
```bash
# Check if MongoDB process is running
ps aux | grep mongod

# Or check if port 27017 is in use
lsof -i :27017
```

---

## Installation Methods

### Method 1: Homebrew (Recommended for macOS)

**Install MongoDB:**
```bash
# Tap the MongoDB Homebrew repository
brew tap mongodb/brew

# Install MongoDB Community Edition
brew install mongodb-community
```

**Start MongoDB:**
```bash
# Start MongoDB as a service (runs in background)
brew services start mongodb-community

# OR start manually (runs in foreground)
mongod --config /opt/homebrew/etc/mongod.conf
```

**Stop MongoDB:**
```bash
# Stop the service
brew services stop mongodb-community

# OR if running manually, press Ctrl+C
```

**Check Status:**
```bash
brew services list | grep mongodb
```

**Restart MongoDB:**
```bash
brew services restart mongodb-community
```

---

### Method 2: MongoDB Atlas (Cloud - No Local Installation)

If you don't want to install MongoDB locally, use MongoDB Atlas (free tier available):

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a cluster (free M0 tier)
4. Get connection string
5. Update `.env.local`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ouiimi?retryWrites=true&w=majority
   ```

---

### Method 3: Manual Installation

**Download MongoDB:**
1. Visit: https://www.mongodb.com/try/download/community
2. Select: macOS, Community Server
3. Download and install

**Start MongoDB:**
```bash
# Default data directory
mongod --dbpath /usr/local/var/mongodb

# OR with custom data directory
mongod --dbpath ~/data/db
```

---

## Common Commands

### Start MongoDB
```bash
# Via Homebrew service (recommended)
brew services start mongodb-community

# Manual start
mongod --config /opt/homebrew/etc/mongod.conf
```

### Stop MongoDB
```bash
# Via Homebrew service
brew services stop mongodb-community

# Manual stop (if running in terminal)
# Press Ctrl+C
```

### Check if MongoDB is Running
```bash
# Method 1: Check process
ps aux | grep mongod

# Method 2: Check port
lsof -i :27017

# Method 3: Try to connect
mongosh --eval "db.version()"
```

### View MongoDB Logs
```bash
# If installed via Homebrew
tail -f /opt/homebrew/var/log/mongodb/mongo.log

# OR check system logs
tail -f /usr/local/var/log/mongodb/mongo.log
```

---

## Troubleshooting

### Problem: "mongod: command not found"
**Solution:**
```bash
# Install MongoDB via Homebrew
brew tap mongodb/brew
brew install mongodb-community

# OR add MongoDB to PATH
export PATH="/usr/local/bin:$PATH"
```

### Problem: "Port 27017 already in use"
**Solution:**
```bash
# Find process using port 27017
lsof -i :27017

# Kill the process
kill -9 <PID>

# OR use different port
mongod --port 27018
```

### Problem: "Data directory not found"
**Solution:**
```bash
# Create data directory
mkdir -p /usr/local/var/mongodb
mkdir -p /usr/local/var/log/mongodb

# OR use custom directory
mongod --dbpath ~/data/db
```

### Problem: "Permission denied"
**Solution:**
```bash
# Fix permissions
sudo chown -R $(whoami) /usr/local/var/mongodb
sudo chown -R $(whoami) /usr/local/var/log/mongodb

# OR use custom directory in home folder
mongod --dbpath ~/data/db
```

---

## Verify Connection

### Test from Terminal
```bash
# Connect to MongoDB shell
mongosh

# Or with connection string
mongosh "mongodb://localhost:27017/ouiimi"
```

### Test from Your App
```bash
# Start your Next.js app
npm run dev

# The app will automatically connect when you use any API endpoint
```

### Test with MongoDB Compass
1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Should see your databases

---

## Configuration File Location

**Homebrew Installation:**
- Config: `/opt/homebrew/etc/mongod.conf`
- Data: `/opt/homebrew/var/mongodb`
- Logs: `/opt/homebrew/var/log/mongodb/mongo.log`

**Manual Installation:**
- Config: `/usr/local/etc/mongod.conf`
- Data: `/usr/local/var/mongodb`
- Logs: `/usr/local/var/log/mongodb/mongo.log`

---

## Auto-Start on Boot (macOS)

**Using Homebrew Services:**
```bash
# Start MongoDB on boot
brew services start mongodb-community

# Stop auto-start
brew services stop mongodb-community
```

**Using LaunchAgent (Manual):**
Create `~/Library/LaunchAgents/homebrew.mxcl.mongodb-community.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>homebrew.mxcl.mongodb-community</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/opt/mongodb-community/bin/mongod</string>
    <string>--config</string>
    <string>/opt/homebrew/etc/mongod.conf</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <false/>
</dict>
</plist>
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| Install | `brew install mongodb-community` |
| Start | `brew services start mongodb-community` |
| Stop | `brew services stop mongodb-community` |
| Restart | `brew services restart mongodb-community` |
| Status | `brew services list \| grep mongodb` |
| Connect | `mongosh` or `mongosh "mongodb://localhost:27017/ouiimi"` |
| Logs | `tail -f /opt/homebrew/var/log/mongodb/mongo.log` |

---

## Next Steps

1. ✅ Install MongoDB
2. ✅ Start MongoDB server
3. ✅ Verify connection
4. ✅ Connect MongoDB Compass
5. ✅ Test with your Next.js app

Your connection string: `mongodb://localhost:27017/ouiimi`

