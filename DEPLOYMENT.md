# Deployment Guide - Ouiimi to DigitalOcean

This guide covers the complete setup for deploying Ouiimi to DigitalOcean VPS with Cloudflare and Nginx.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Domain Configuration (Cloudflare)](#domain-configuration-cloudflare)
4. [Nginx Configuration](#nginx-configuration)
5. [Application Deployment](#application-deployment)
6. [CI/CD Setup](#cicd-setup)
7. [Monitoring & Maintenance](#monitoring--maintenance)

## Prerequisites

- DigitalOcean VPS (Ubuntu 22.04 LTS recommended)
- Domain name (ouiimi.com)
- Cloudflare account
- GitHub repository
- SSH access to VPS

## Server Setup

### 1. Initial Server Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Create Application User

```bash
# Create user for application
sudo adduser --disabled-password --gecos "" ouiimi
sudo usermod -aG sudo ouiimi

# Switch to application user
su - ouiimi
```

### 3. Setup Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/ouiimi
sudo chown ouiimi:ouiimi /var/www/ouiimi

# Clone repository
cd /var/www/ouiimi
git clone https://github.com/yourusername/ouiimi-NEXT.git .

# Install dependencies
npm ci --production
```

### 4. Environment Variables

Create `/var/www/ouiimi/.env.production`:

```env
# Production Environment Variables
NODE_ENV=production

# MongoDB (DigitalOcean Managed Database)
MONGODB_URI=mongodb+srv://doadmin:780LgfUa92B45Am3@db-mongodb-syd1-51575-b8378040.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=db-mongodb-syd1-51575/ouiimi

# JWT Configuration
JWT_SECRET=your-production-jwt-secret-here
JWT_EXPIRES_IN=7d

# NextAuth Configuration
NEXTAUTH_URL=https://ouiimi.com
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

**⚠️ Security Note**: Generate secure secrets:
```bash
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For NEXTAUTH_SECRET
```

### 5. Build Application

```bash
cd /var/www/ouiimi
npm run build
```

### 6. Setup PM2

Create `/var/www/ouiimi/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'ouiimi',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/ouiimi',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/ouiimi/error.log',
    out_file: '/var/log/ouiimi/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

Create log directory:
```bash
sudo mkdir -p /var/log/ouiimi
sudo chown ouiimi:ouiimi /var/log/ouiimi
```

Start application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Domain Configuration (Cloudflare)

### 1. Add Domain to Cloudflare

1. Log in to Cloudflare dashboard
2. Click "Add a Site"
3. Enter `ouiimi.com`
4. Select Free plan (or Pro if needed)
5. Cloudflare will scan your DNS records

### 2. Update Nameservers

1. Go to your domain registrar (where you bought ouiimi.com)
2. Update nameservers to Cloudflare's nameservers:
   - `[name].ns.cloudflare.com`
   - `[name].ns.cloudflare.com`
   (Cloudflare will provide exact names)

### 3. DNS Configuration in Cloudflare

Add these DNS records:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| A | @ | Your VPS IP | Proxied (Orange Cloud) |
| A | www | Your VPS IP | Proxied (Orange Cloud) |
| CNAME | api | ouiimi.com | Proxied |

**Important**: 
- Enable "Proxy" (Orange Cloud) for DDoS protection
- This hides your server IP
- Cloudflare will handle SSL automatically

### 4. SSL/TLS Settings

In Cloudflare dashboard:
1. Go to SSL/TLS → Overview
2. Set encryption mode to **"Full (strict)"**
3. Go to SSL/TLS → Edge Certificates
4. Enable "Always Use HTTPS"
5. Enable "Automatic HTTPS Rewrites"

### 5. Performance Settings

1. Go to Speed → Optimization
2. Enable "Auto Minify" (JavaScript, CSS, HTML)
3. Enable "Brotli" compression
4. Enable "Rocket Loader" (optional)

## Nginx Configuration

### 1. Create Nginx Configuration

Create `/etc/nginx/sites-available/ouiimi`:

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
    server_name ouiimi.com www.ouiimi.com;

    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ouiimi.com www.ouiimi.com;

    # SSL Configuration (Cloudflare will handle this, but good to have)
    ssl_certificate /etc/letsencrypt/live/ouiimi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ouiimi.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Real IP from Cloudflare
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

### 2. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/ouiimi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Setup SSL Certificate

```bash
sudo certbot --nginx -d ouiimi.com -d www.ouiimi.com
```

**Note**: Since you're using Cloudflare, SSL is handled by them. The Let's Encrypt cert is a backup.

## Application Deployment

### Manual Deployment

```bash
cd /var/www/ouiimi
git pull origin main
npm ci --production
npm run build
pm2 restart ouiimi
```

### Automated Deployment (CI/CD)

See [CI/CD Setup](#cicd-setup) section below.

## CI/CD Setup

### 1. GitHub Secrets

Add these secrets in GitHub repository settings:

- `DO_SSH_PRIVATE_KEY`: Your SSH private key for VPS access
- `DO_HOST`: Your VPS IP address
- `DO_USER`: SSH user (usually `ouiimi` or `root`)
- `DO_APP_PATH`: Application path (`/var/www/ouiimi`)
- `MONGODB_URI`: Production MongoDB URI
- `JWT_SECRET`: Production JWT secret
- `NEXTAUTH_SECRET`: Production NextAuth secret
- `NEXTAUTH_URL`: `https://ouiimi.com`
- `MAILJET_API_KEY`: Your Mailjet API key
- `MAILJET_SECRET_KEY`: Your Mailjet secret key
- `MAILJET_FROM_EMAIL`: `information@ouiimi.com`
- `MAILJET_FROM_NAME`: `Ouiimi`

### 2. Generate SSH Key for GitHub Actions

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/github-actions.pub ouiimi@your-vps-ip

# Add private key to GitHub Secrets
cat ~/.ssh/github-actions
# Copy output to GitHub Secrets → DO_SSH_PRIVATE_KEY
```

### 3. Workflow File

The workflow file is already created at `.github/workflows/ci-cd.yml`. It will:
1. Run tests
2. Build application
3. Deploy to VPS on push to main/master

## Monitoring & Maintenance

### 1. PM2 Monitoring

```bash
# View logs
pm2 logs ouiimi

# Monitor
pm2 monit

# View status
pm2 status
```

### 2. Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/ouiimi-access.log

# Error logs
sudo tail -f /var/log/nginx/ouiimi-error.log
```

### 3. Application Health

Check health endpoint:
```bash
curl https://ouiimi.com/api/health
```

### 4. Backup Strategy

```bash
# Database backup (if using managed DB, backups are automatic)
# Application backup
tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/ouiimi
```

## Troubleshooting

### Application won't start
```bash
pm2 logs ouiimi
pm2 restart ouiimi
```

### Nginx errors
```bash
sudo nginx -t
sudo systemctl status nginx
```

### SSL issues
- Check Cloudflare SSL/TLS settings
- Verify DNS records are correct
- Check certificate: `sudo certbot certificates`

### Database connection issues
- Verify MongoDB URI is correct
- Check firewall rules allow connection
- Verify credentials

## Best Practices

1. **Always test in staging first**
2. **Keep backups** before major deployments
3. **Monitor logs** regularly
4. **Update dependencies** monthly
5. **Use environment-specific configs**
6. **Enable Cloudflare caching** for static assets
7. **Set up monitoring** (UptimeRobot, Pingdom, etc.)
8. **Regular security updates**: `sudo apt update && sudo apt upgrade`

## Support

For issues:
1. Check application logs: `pm2 logs ouiimi`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/ouiimi-error.log`
3. Check system resources: `htop` or `df -h`

