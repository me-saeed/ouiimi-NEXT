# Create .env.production on Server

## Quick Fix for Build Error

The build is failing because `.env.production` is missing or incomplete on your server.

## Option 1: SSH into Server and Create It

```bash
# SSH into your server
ssh root@170.64.150.64

# Navigate to app directory
cd /root/ouiimi

# Create .env.production
nano .env.production
```

Paste this content (update JWT_SECRET and NEXTAUTH_SECRET):

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://doadmin:780LgfUa92B45Am3@db-mongodb-syd1-51575-b8378040.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=db-mongodb-syd1-51575/ouiimi
JWT_SECRET=YOUR_JWT_SECRET_HERE
NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET_HERE
NEXTAUTH_URL=https://ouiimi.com.au
MAILJET_API_KEY=6c5afba9421a25308809ce27ee20a7df
MAILJET_SECRET_KEY=46413525c090257962796ac7c3e2ef46
MAILJET_FROM_EMAIL=information@ouiimi.com
MAILJET_FROM_NAME=Ouiimi
```

**Generate secrets:**
```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate NEXTAUTH_SECRET  
openssl rand -base64 32
```

Save: `Ctrl+X`, then `Y`, then `Enter`

## Option 2: Let Deployment Script Create It

The deployment script will now automatically create `.env.production` if it doesn't exist. However, you still need to:

1. **Update JWT_SECRET and NEXTAUTH_SECRET** after first deployment
2. **Restart PM2** after updating: `pm2 restart ouiimi`

## Verify It Works

```bash
# Check if file exists
ls -la /root/ouiimi/.env.production

# View contents (be careful - contains secrets!)
cat /root/ouiimi/.env.production

# Test build
cd /root/ouiimi
yarn build
```

## After Creating/Updating .env.production

```bash
# Restart the application
pm2 restart ouiimi

# Check logs
pm2 logs ouiimi
```

