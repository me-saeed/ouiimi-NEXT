# Quick Start - CI/CD & Deployment

## 🚀 Quick Setup Guide

### 1. Install Dependencies (including test dependencies)

```bash
npm install
```

### 2. Run Tests Locally

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### 3. GitHub Actions Setup

1. **Add GitHub Secrets** (Repository → Settings → Secrets and variables → Actions):

   ```
   DO_SSH_PRIVATE_KEY     # SSH private key for VPS access
   DO_HOST                # Your VPS IP address
   DO_USER                # SSH user (e.g., ouiimi)
   DO_APP_PATH            # /var/www/ouiimi
   MONGODB_URI            # Production MongoDB URI
   JWT_SECRET             # Production JWT secret
   NEXTAUTH_SECRET        # Production NextAuth secret
   NEXTAUTH_URL           # https://ouiimi.com.au
   MAILJET_API_KEY        # Your Mailjet API key
   MAILJET_SECRET_KEY     # Your Mailjet secret key
   MAILJET_FROM_EMAIL     # information@ouiimi.com
   MAILJET_FROM_NAME      # Ouiimi
   ```

2. **Generate SSH Key for GitHub Actions**:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions
   ssh-copy-id -i ~/.ssh/github-actions.pub ouiimi@your-vps-ip
   # Copy private key content to GitHub Secrets → DO_SSH_PRIVATE_KEY
   cat ~/.ssh/github-actions
   ```

### 4. How It Works

- **On Push to main/master**: 
  1. ✅ Tests run automatically
  2. ✅ Application builds
  3. ✅ If tests pass → Deploys to DigitalOcean VPS
  4. ✅ Application restarts automatically

- **On Pull Request**:
  1. ✅ Tests run
  2. ✅ Build verification
  3. ❌ No deployment (only on merge to main)

### 5. Manual Deployment

If you need to deploy manually:

```bash
# On your VPS
cd /var/www/ouiimi
./scripts/deploy.sh
```

Or use the script directly:
```bash
cd /var/www/ouiimi
git pull origin main
npm ci --production
npm run build
pm2 restart ouiimi
```

## 📋 Test Coverage

Current test suites:
- ✅ Signup API (`/api/auth/signup`)
- ✅ Signin API (`/api/auth/signin`)
- ✅ Forgot Password API (`/api/auth/forgot-password`)
- ✅ Reset Password API (`/api/auth/reset-password`)

## 🔧 Troubleshooting

### Tests failing?
- Check MongoDB connection (tests use local MongoDB)
- Verify environment variables are set
- Check test database is accessible

### Deployment failing?
- Verify SSH key is correct
- Check VPS has correct permissions
- Verify PM2 is installed on VPS
- Check application logs: `pm2 logs ouiimi`

### Need help?
See full documentation in `DEPLOYMENT.md`

