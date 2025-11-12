# Quick Deployment Guide - ouiimi.com.au

## 🚀 Quick Setup Summary

### Step 1: Get SSH Private Key

**On your local machine:**

```bash
# Generate SSH key for GitHub Actions
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions-ouiimi

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/github-actions-ouiimi.pub root@170.64.150.64

# Get private key content (copy this entire output)
cat ~/.ssh/github-actions-ouiimi
```

**This is your `DO_SSH_PRIVATE_KEY`** - copy the entire output.

---

### Step 2: Add GitHub Secrets

Go to: **GitHub Repository → Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `DO_SSH_PRIVATE_KEY` | Output from `cat ~/.ssh/github-actions-ouiimi` |
| `DO_HOST` | Your VPS IP address (e.g., `123.45.67.89`) |
| `DO_USER` | `root` |
| `DO_APP_PATH` | `/root/ouiimi` |
| `MONGODB_URI` | `mongodb+srv://doadmin:780LgfUa92B45Am3@db-mongodb-syd1-51575-b8378040.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=db-mongodb-syd1-51575/ouiimi` |
| `JWT_SECRET` | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://ouiimi.com.au` |
| `MAILJET_API_KEY` | `6c5afba9421a25308809ce27ee20a7df` |
| `MAILJET_SECRET_KEY` | `46413525c090257962796ac7c3e2ef46` |
| `MAILJET_FROM_EMAIL` | `information@ouiimi.com` |
| `MAILJET_FROM_NAME` | `Ouiimi` |

---

### Step 3: Initial Server Setup

**SSH into your VPS:**

```bash
ssh root@YOUR_VPS_IP
```

**Run these commands:**

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2, Git, Nginx, Yarn
npm install -g pm2 yarn
apt install -y git nginx

# Create app directory and clone repository
cd /root
git clone https://github.com/me-saeed/ouiimi-NEXT.git ouiimi
cd ouiimi

# Install dependencies
yarn install --frozen-lockfile

# Create .env.production
nano .env.production
```

**Add to `.env.production`:**


```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://doadmin:780LgfUa92B45Am3@db-mongodb-syd1-51575-b8378040.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=db-mongodb-syd1-51575/ouiimi
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-characters
NEXTAUTH_URL=https://ouiimi.com.au
NEXTAUTH_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-characters
MAILJET_API_KEY=6c5afba9421a25308809ce27ee20a7df
MAILJET_SECRET_KEY=46413525c090257962796ac7c3e2ef46
MAILJET_FROM_EMAIL=information@ouiimi.com
MAILJET_FROM_NAME=Ouiimi
```

**⚠️ Important Note:**
- **GitHub Secrets** are used during CI/CD build and deployment process
- **`.env.production`** on the server is used when the application runs
- **You need BOTH** because:
  - GitHub Actions uses secrets to build and deploy
  - The server uses `.env.production` when the app runs
  - Use the **SAME values** in both places for consistency

**Generate secrets:**

```bash
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For NEXTAUTH_SECRET
```

**Build and start:**

```bash
# Build application
yarn build

# Create logs directory
mkdir -p /root/ouiimi/logs

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the output command

# Test
pm2 status
pm2 logs ouiimi
```

---

### Step 4: Setup Nginx

**Create Nginx config:**

```bash
nano /etc/nginx/sites-available/ouiimi.com.au
```

**Paste this config:**

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;

upstream ouiimi_backend {
    least_conn;
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name ouiimi.com.au www.ouiimi.com.au;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ouiimi.com.au www.ouiimi.com.au;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    access_log /var/log/nginx/ouiimi-access.log;
    error_log /var/log/nginx/ouiimi-error.log;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript;

    client_max_body_size 10M;

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
    }

    location /_next/static/ {
        proxy_pass http://ouiimi_backend;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

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

    location /api/health {
        access_log off;
        proxy_pass http://ouiimi_backend;
    }
}
```

**Enable site:**

```bash
rm /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/ouiimi.com.au /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

### Step 5: Setup Cloudflare (Optional)

1. Add domain to Cloudflare
2. Update nameservers at your registrar
3. Add DNS records:
   - A record: `@` → Your VPS IP (Proxied)
   - A record: `www` → Your VPS IP (Proxied)
4. SSL/TLS → Set to "Full (strict)"
5. Enable "Always Use HTTPS"

---

### Step 6: Deploy!

**Push to main branch:**

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

**Check GitHub Actions** - it will automatically deploy!

---

## ✅ Summary

- **DO_SSH_PRIVATE_KEY**: Content of `~/.ssh/github-actions-ouiimi`
- **DO_USER**: `root`
- **DO_APP_PATH**: `/root/ouiimi`
- **Domain**: `https://ouiimi.com.au/`

For detailed instructions, see `DEPLOYMENT_STEP_BY_STEP.md`

