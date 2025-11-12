# Environment Variables Explanation

## Why We Need Environment Variables in Two Places

### 1. GitHub Secrets (for CI/CD)
**Location**: GitHub Repository → Settings → Secrets and variables → Actions

**Used for**:
- Building the application in GitHub Actions
- Testing the build process
- Deployment automation

**When they're used**:
- During the `build` job in GitHub Actions
- When GitHub Actions runs tests
- When GitHub Actions deploys to your server

### 2. `.env.production` on Server
**Location**: `/root/ouiimi/.env.production` on your VPS

**Used for**:
- Running the application in production
- Building the application on the server (if needed)
- Runtime environment variables

**When they're used**:
- When you run `yarn build` on the server
- When PM2 starts the application
- When the application makes API calls, connects to database, etc.

---

## Do You Need Both?

**YES, you need both!** Here's why:

### Scenario 1: Building in GitHub Actions
- GitHub Actions builds with secrets
- Deploys built files to server
- Server still needs `.env.production` for runtime

### Scenario 2: Building on Server (Current Setup)
- GitHub Actions deploys code
- Server builds with `.env.production`
- Server runs with `.env.production`

**Our current setup builds on the server**, so:
- ✅ GitHub Secrets are still used for deployment automation
- ✅ `.env.production` on server is **REQUIRED** for building and running

---

## What Values Should You Use?

**Use the SAME values in both places!**

For example:
- GitHub Secret `JWT_SECRET` = `abc123xyz`
- Server `.env.production` `JWT_SECRET` = `abc123xyz` (same value)

---

## Complete Environment Variables List

### Required for Both GitHub Secrets AND `.env.production`:

```env
# Database
MONGODB_URI=mongodb+srv://doadmin:780LgfUa92B45Am3@db-mongodb-syd1-51575-b8378040.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=db-mongodb-syd1-51575/ouiimi

# JWT
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRES_IN=7d

# NextAuth
NEXTAUTH_URL=https://ouiimi.com.au
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Mailjet
MAILJET_API_KEY=6c5afba9421a25308809ce27ee20a7df
MAILJET_SECRET_KEY=46413525c090257962796ac7c3e2ef46
MAILJET_FROM_EMAIL=information@ouiimi.com
MAILJET_FROM_NAME=Ouiimi

# OAuth (if using)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
FACEBOOK_CLIENT_ID=<your-facebook-client-id>
FACEBOOK_CLIENT_SECRET=<your-facebook-client-secret>

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Step-by-Step Setup

### Step 1: Generate Secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 32
# Output: abc123xyz789... (copy this)

# Generate NEXTAUTH_SECRET
openssl rand -base64 32
# Output: def456uvw012... (copy this)
```

### Step 2: Add to GitHub Secrets

1. Go to: GitHub → Your Repo → Settings → Secrets and variables → Actions
2. Add each secret with the generated values
3. Save all secrets

### Step 3: Add to Server `.env.production`

```bash
# SSH into server
ssh root@170.64.150.64

# Create/edit .env.production
cd /root/ouiimi
nano .env.production

# Paste the same values (use the same secrets you generated)
# Save: Ctrl+X, Y, Enter
```

---

## Quick Checklist

- [ ] Generated `JWT_SECRET` with `openssl rand -base64 32`
- [ ] Generated `NEXTAUTH_SECRET` with `openssl rand -base64 32`
- [ ] Added all secrets to GitHub (Settings → Secrets)
- [ ] Created `.env.production` on server at `/root/ouiimi/.env.production`
- [ ] Used the **SAME values** in both places
- [ ] Verified `.env.production` has `NODE_ENV=production`

---

## Troubleshooting

### "Environment variable not found" error

**Check**:
1. Is `.env.production` in `/root/ouiimi/`?
2. Does it have `NODE_ENV=production`?
3. Are all required variables present?
4. Did you restart PM2 after changing `.env.production`?

```bash
# Restart after changing .env.production
pm2 restart ouiimi
```

### Build fails in GitHub Actions

**Check**:
1. Are all GitHub Secrets set?
2. Are the values correct?
3. Check GitHub Actions logs for specific errors

### Application runs but can't connect to database

**Check**:
1. Is `MONGODB_URI` correct in `.env.production`?
2. Can you connect from server? Test:
   ```bash
   mongosh "your-mongodb-uri"
   ```
3. Is firewall allowing MongoDB connection?

---

## Summary

✅ **GitHub Secrets** = For CI/CD automation  
✅ **`.env.production`** = For server runtime  
✅ **Use SAME values** in both places  
✅ **Both are required** for the setup to work

