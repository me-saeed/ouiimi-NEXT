# Fix Nginx Setup

## Check Current Nginx Status

Run these commands on your VPS:

```bash
# Check if Nginx is running
systemctl status nginx

# Check all enabled sites
ls -la /etc/nginx/sites-enabled/

# Check all available sites
ls -la /etc/nginx/sites-available/

# Test Nginx config
nginx -t

# Check what's listening on port 80
netstat -tulpn | grep :80
```

## Check for Conflicts

```bash
# See all Nginx server blocks
grep -r "server_name" /etc/nginx/sites-enabled/

# Check if ouiimi.com.au config exists
cat /etc/nginx/sites-available/ouiimi.com.au

# Check if it's enabled
ls -la /etc/nginx/sites-enabled/ | grep ouiimi
```

## Fix Steps

### 1. Check Current Setup

```bash
# List all enabled sites
ls -la /etc/nginx/sites-enabled/
```

### 2. Create/Update ouiimi.com.au Config

```bash
# Edit the config
nano /etc/nginx/sites-available/ouiimi.com.au
```

### 3. Enable the Site

```bash
# Make sure it's enabled
ln -sf /etc/nginx/sites-available/ouiimi.com.au /etc/nginx/sites-enabled/ouiimi.com.au

# Test config
nginx -t

# If test passes, reload
systemctl reload nginx
```

### 4. Check for Port Conflicts

If other apps are using port 80, you might need to:
- Use different server_name (subdomain)
- Or configure multiple domains on same port

