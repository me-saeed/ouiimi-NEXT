# Step-by-Step Deployment Guide for ouiimi.com.au

This guide will help you deploy your Next.js application to DigitalOcean VPS at `/root/ouiimi` with domain `https://ouiimi.com.au/`.

## Prerequisites

- ✅ DigitalOcean VPS (Ubuntu 22.04 LTS recommended)
- ✅ Domain `ouiimi.com.au` pointing to your VPS
- ✅ SSH access to your VPS
- ✅ GitHub repository with your code

---

## Step 1: Initial Server Setup

### 1.1 Connect to Your VPS

```bash
ssh root@your-vps-ip
```

### 1.2 Update System

```bash
apt update && apt upgrade -y
```

### 1.3 Install Required Software

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 (Process Manager)
npm install -g pm2

# Install Git
apt install -y git

# Install Nginx
apt install -y nginx

# Install Yarn (if not already installed)
npm install -g yarn
```

### 1.4 Verify Installations

```bash
node --version  # Should show v20.x
npm --version
pm2 --version
nginx -v
```

---

## Step 2: Setup Application Directory

### 2.1 Create Application Directory

```bash
mkdir -p /root/ouiimi
cd /root/ouiimi
```

### 2.2 Clone Your Repository

```bash
# If using HTTPS
git clone https://github.com/yourusername/ouiimi-NEXT.git .

# OR if using SSH (recommended)
git clone git@github.com:yourusername/ouiimi-NEXT.git .
```

### 2.3 Install Dependencies

```bash
cd /root/ouiimi
yarn install --frozen-lockfile
```

---

## Step 3: Create Environment File

### 3.1 Create Production Environment File

```bash
nano /root/ouiimi/.env.production
```

### 3.2 Add These Variables

```env
NODE_ENV=production

# MongoDB (Your production MongoDB URI)
MONGODB_URI=mongodb+srv://doadmin:780LgfUa92B45Am3@db-mongodb-syd1-51575-b8378040.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=db-mongodb-syd1-51575/ouiimi

# JWT Configuration (Generate secure secrets)
JWT_SECRET=your-production-jwt-secret-here
JWT_EXPIRES_IN=7d

# NextAuth Configuration
NEXTAUTH_URL=https://ouiimi.com.au
NEXTAUTH_SECRET=your-production-nextauth-secret-here

# OAuth Providers (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

# Mailjet Configuration
MAILJET_API_KEY=6c5afba9421a25308809ce27ee20a7df
MAILJET_SECRET_KEY=46413525c090257962796ac7c3e2ef46
MAILJET_FROM_EMAIL=information@ouiimi.com
MAILJET_FROM_NAME=Ouiimi

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3.3 Generate Secure Secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

Copy the output and replace `your-production-jwt-secret-here` and `your-production-nextauth-secret-here` in your `.env.production` file.

### 3.4 Save and Exit

Press `Ctrl+X`, then `Y`, then `Enter` to save.

---

## Step 4: Build Application

```bash
cd /root/ouiimi
yarn build
```

If build succeeds, you're ready to proceed!

---

## Step 5: Setup PM2

### 5.1 Update PM2 Config

Check if `ecosystem.config.js` exists:

```bash
cat /root/ouiimi/ecosystem.config.js
```

If it needs updating, edit it:

```bash
nano /root/ouiimi/ecosystem.config.js
```

Make sure it looks like this:

```javascript
module.exports = {
  apps: [{
    name: 'ouiimi',
    script: 'npm',
    args: 'start',
    cwd: '/root/ouiimi',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/root/ouiimi/logs/error.log',
    out_file: '/root/ouiimi/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

### 5.2 Create Logs Directory

```bash
mkdir -p /root/ouiimi/logs
```

### 5.3 Start Application with PM2

```bash
cd /root/ouiimi
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

The last command will output a command like:
```
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
```

**Copy and run that command** to enable PM2 on system startup.

### 5.4 Verify PM2 Status

```bash
pm2 status
pm2 logs ouiimi
```

You should see your application running!

---

## Step 6: Setup Nginx

### 6.1 Create Nginx Configuration

```bash
nano /etc/nginx/sites-available/ouiimi.com.au
```

### 6.2 Add This Configuration

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;

# Upstream Next.js application
upstream ouiimi_backend {
    least_conn;
    server 127.0.0.1:3000;
    keepalive 64;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ouiimi.com.au www.ouiimi.com.au;

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ouiimi.com.au www.ouiimi.com.au;

    # SSL Configuration (Cloudflare will handle this, but good to have)
    # ssl_certificate /etc/letsencrypt/live/ouiimi.com.au/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/ouiimi.com.au/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Real IP from Cloudflare (if using Cloudflare)
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 131.0.72.0/22;
    real_ip_header CF-Connecting-IP;

    # Logging
    access_log /var/log/nginx/ouiimi-access.log;
    error_log /var/log/nginx/ouiimi-error.log;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Client body size
    client_max_body_size 10M;

    # API Routes with rate limiting
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://ouiimi_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static files (Next.js)
    location /_next/static/ {
        proxy_pass http://ouiimi_backend;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # Main application
    location / {
        limit_req zone=general_limit burst=50 nodelay;
        proxy_pass http://ouiimi_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /api/health {
        access_log off;
        proxy_pass http://ouiimi_backend;
    }
}
```

### 6.3 Enable Site

```bash
# Remove default site (optional)
rm /etc/nginx/sites-enabled/default

# Enable your site
ln -s /etc/nginx/sites-available/ouiimi.com.au /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## Step 7: Setup Cloudflare (Optional but Recommended)

### 7.1 Add Domain to Cloudflare

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click "Add a Site"
3. Enter `ouiimi.com.au`
4. Select Free plan
5. Follow the setup wizard

### 7.2 Update Nameservers

1. Go to your domain registrar (where you bought ouiimi.com.au)
2. Update nameservers to Cloudflare's nameservers
3. Wait for DNS propagation (can take up to 24 hours, usually 1-2 hours)

### 7.3 Add DNS Records in Cloudflare

| Type | Name | Content | Proxy Status |
|------|------|---------|---------------|
| A | @ | Your VPS IP | Proxied (Orange Cloud) |
| A | www | Your VPS IP | Proxied (Orange Cloud) |

**Important**: Enable "Proxy" (Orange Cloud) for DDoS protection.

### 7.4 SSL/TLS Settings in Cloudflare

1. Go to SSL/TLS → Overview
2. Set encryption mode to **"Full (strict)"**
3. Go to SSL/TLS → Edge Certificates
4. Enable "Always Use HTTPS"
5. Enable "Automatic HTTPS Rewrites"

---

## Step 8: Generate SSH Key for GitHub Actions

### 8.1 Generate SSH Key Pair

**On your local machine** (not the VPS):

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions-ouiimi

# This will create:
# ~/.ssh/github-actions-ouiimi (private key)
# ~/.ssh/github-actions-ouiimi.pub (public key)
```

**Important**: When prompted for a passphrase, press Enter (no passphrase needed for CI/CD).

### 8.2 Copy Public Key to VPS

```bash
# Copy public key to VPS
ssh-copy-id -i ~/.ssh/github-actions-ouiimi.pub root@your-vps-ip

# OR manually:
cat ~/.ssh/github-actions-ouiimi.pub
# Copy the output, then on VPS:
# mkdir -p ~/.ssh
# echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
# chmod 600 ~/.ssh/authorized_keys
```

### 8.3 Test SSH Connection

```bash
# Test SSH connection
ssh -i ~/.ssh/github-actions-ouiimi root@your-vps-ip
```

If it connects without password, you're good!

### 8.4 Get Private Key Content

```bash
# Display private key (you'll need this for GitHub Secrets)
cat ~/.ssh/github-actions-ouiimi
```

**Copy the entire output** - this is your `DO_SSH_PRIVATE_KEY`.

---

## Step 9: Setup GitHub Secrets

### 9.1 Go to GitHub Repository

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### 9.2 Add These Secrets

Add each secret one by one:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `DO_SSH_PRIVATE_KEY` | Content of `~/.ssh/github-actions-ouiimi` | From Step 8.4 |
| `DO_HOST` | Your VPS IP address | e.g., `123.45.67.89` |
| `DO_USER` | `root` | Since your path is `/root/ouiimi` |
| `DO_APP_PATH` | `/root/ouiimi` | Your application path |
| `MONGODB_URI` | Your MongoDB connection string | From Step 3.2 |
| `JWT_SECRET` | Generated secret | From Step 3.3 |
| `NEXTAUTH_SECRET` | Generated secret | From Step 3.3 |
| `NEXTAUTH_URL` | `https://ouiimi.com.au` | Your domain |
| `MAILJET_API_KEY` | `6c5afba9421a25308809ce27ee20a7df` | Your Mailjet key |
| `MAILJET_SECRET_KEY` | `46413525c090257962796ac7c3e2ef46` | Your Mailjet secret |
| `MAILJET_FROM_EMAIL` | `information@ouiimi.com` | Sender email |
| `MAILJET_FROM_NAME` | `Ouiimi` | Sender name |

### 9.3 How to Add Each Secret

1. Click **New repository secret**
2. Enter the **Name** (e.g., `DO_SSH_PRIVATE_KEY`)
3. Paste the **Value**
4. Click **Add secret**
5. Repeat for all secrets

---

## Step 10: Update CI/CD Workflow

### 10.1 Check Workflow File

The workflow file should already exist at `.github/workflows/ci-cd.yml`. Let's verify it's correct for your setup.

### 10.2 Update Health Check URL

Make sure the health check in the workflow uses your domain:

```yaml
- name: Health check
  run: |
    sleep 10
    curl -f https://ouiimi.com.au/api/health || exit 1
```

---

## Step 11: Test Deployment

### 11.1 Push to Main Branch

```bash
# On your local machine
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 11.2 Check GitHub Actions

1. Go to your GitHub repository
2. Click **Actions** tab
3. You should see the workflow running
4. Wait for it to complete

### 11.3 Verify Deployment

```bash
# Check if application is running
ssh root@your-vps-ip
pm2 status
pm2 logs ouiimi

# Test health endpoint
curl https://ouiimi.com.au/api/health
```

### 11.4 Visit Your Site

Open in browser: `https://ouiimi.com.au`

---

## Step 12: Troubleshooting

### Application Not Starting

```bash
# Check PM2 logs
pm2 logs ouiimi

# Check if port 3000 is in use
netstat -tulpn | grep 3000

# Restart application
pm2 restart ouiimi
```

### Nginx Errors

```bash
# Test Nginx configuration
nginx -t

# Check Nginx logs
tail -f /var/log/nginx/ouiimi-error.log

# Restart Nginx
systemctl restart nginx
```

### Database Connection Issues

```bash
# Test MongoDB connection from VPS
mongosh "your-mongodb-uri"

# Check firewall
ufw status
```

### GitHub Actions Deployment Failing

1. Check GitHub Actions logs
2. Verify SSH key is correct
3. Test SSH connection manually:
   ```bash
   ssh -i ~/.ssh/github-actions-ouiimi root@your-vps-ip
   ```
4. Verify all secrets are set correctly

---

## Quick Reference Commands

```bash
# View application logs
pm2 logs ouiimi

# Restart application
pm2 restart ouiimi

# View PM2 status
pm2 status

# View Nginx logs
tail -f /var/log/nginx/ouiimi-error.log

# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx

# Manual deployment
cd /root/ouiimi
git pull origin main
yarn install --frozen-lockfile
yarn build
pm2 restart ouiimi
```

---

## Summary

✅ **DO_SSH_PRIVATE_KEY**: Content of `~/.ssh/github-actions-ouiimi` (private key)  
✅ **DO_USER**: `root`  
✅ **DO_APP_PATH**: `/root/ouiimi`  
✅ **Domain**: `https://ouiimi.com.au/`

Your application should now be live! 🎉

