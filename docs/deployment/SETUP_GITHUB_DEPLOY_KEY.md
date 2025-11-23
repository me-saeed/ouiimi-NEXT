# Setup GitHub Deploy Key for Private Repository

If your repository is **private**, you need to set up a deploy key so the VPS can clone it.

## Option 1: Use GitHub Personal Access Token (Easier)

### Step 1: Create GitHub Personal Access Token

1. Go to: **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Click **"Generate new token (classic)"**
3. Give it a name: `ouiimi-deployment`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click **"Generate token"**
6. **Copy the token immediately** (you won't see it again!)

### Step 2: Add Token to GitHub Secrets

1. Go to: **GitHub Repository → Settings → Secrets → Actions**
2. Click **"New repository secret"**
3. Name: `GITHUB_TOKEN`
4. Value: Paste the token you just created
5. Click **"Add secret"**

### Step 3: Update CI/CD Workflow

The workflow is already updated to use `GITHUB_TOKEN` if available.

## Option 2: Use SSH Deploy Key (More Secure)

### Step 1: Generate Deploy Key on VPS

**SSH into your VPS:**

```bash
ssh root@170.64.150.64

# Generate deploy key
ssh-keygen -t ed25519 -C "deploy-key-ouiimi" -f ~/.ssh/github_deploy_key -N ""

# Display public key
cat ~/.ssh/github_deploy_key.pub
```

### Step 2: Add Deploy Key to GitHub

1. Go to: **GitHub Repository → Settings → Deploy keys**
2. Click **"Add deploy key"**
3. Title: `VPS Deploy Key`
4. Key: Paste the public key from Step 1
5. ✅ Check **"Allow write access"** (if you need to push)
6. Click **"Add key"**

### Step 3: Add Private Key to GitHub Secrets

**On your local machine:**

```bash
# Get the private key
ssh root@170.64.150.64 "cat ~/.ssh/github_deploy_key"
```

1. Go to: **GitHub Repository → Settings → Secrets → Actions**
2. Click **"New repository secret"**
3. Name: `GITHUB_SSH_KEY`
4. Value: Paste the private key (entire output including BEGIN/END lines)
5. Click **"Add secret"**

### Step 4: Test on VPS

**SSH into your VPS:**

```bash
# Test GitHub connection
ssh -T -i ~/.ssh/github_deploy_key git@github.com

# Should see: "Hi me-saeed/ouiimi-NEXT! You've successfully authenticated..."
```

## Option 3: Make Repository Public (Simplest)

If the repository doesn't contain sensitive code:

1. Go to: **GitHub Repository → Settings → General → Danger Zone**
2. Click **"Change visibility"**
3. Select **"Make public"**
4. Confirm

This allows HTTPS cloning without authentication.

## Recommended: Use GitHub Token

For CI/CD, **GitHub Personal Access Token** is the easiest option:
- ✅ Simple to set up
- ✅ Works with HTTPS
- ✅ Can be revoked easily
- ✅ No SSH key management needed

The CI/CD workflow will automatically use the token if `GITHUB_TOKEN` secret is set.

