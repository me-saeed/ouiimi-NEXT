# Fix SSH Key Error in GitHub Actions

## Problem
```
Error loading key "(stdin)": error in libcrypto
Error: Command failed: ssh-add -
```

This error occurs when the SSH private key in GitHub Secrets is not properly formatted.

## Solution

### Step 1: Generate a New SSH Key (if needed)

**On your local machine:**

```bash
# Generate a new SSH key specifically for GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-ouiimi" -f ~/.ssh/github-actions-ouiimi

# When prompted for passphrase, press Enter (no passphrase needed for CI/CD)
```

### Step 2: Copy Public Key to VPS

```bash
# Copy public key to your VPS
ssh-copy-id -i ~/.ssh/github-actions-ouiimi.pub root@170.64.150.64

# OR manually:
cat ~/.ssh/github-actions-ouiimi.pub
# Then on VPS:
# mkdir -p ~/.ssh
# echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
# chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Get Private Key Content (IMPORTANT - Format Correctly)

```bash
# Display the private key
cat ~/.ssh/github-actions-ouiimi
```

**CRITICAL**: The private key must include:
- The BEGIN and END lines
- All content between them
- No extra spaces or characters
- Proper line breaks

It should look exactly like this:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACD... (many lines) ...
-----END OPENSSH PRIVATE KEY-----
```

### Step 4: Add to GitHub Secrets (Properly)

1. Go to: **GitHub Repository → Settings → Secrets and variables → Actions**
2. Click **"Update"** on `DO_SSH_PRIVATE_KEY` (or delete and create new)
3. **IMPORTANT**: 
   - Copy the ENTIRE private key including `-----BEGIN` and `-----END` lines
   - Paste it EXACTLY as it appears
   - Don't add extra spaces or line breaks
   - Don't remove any characters

### Step 5: Verify Key Format

The key should:
- Start with `-----BEGIN OPENSSH PRIVATE KEY-----` or `-----BEGIN RSA PRIVATE KEY-----`
- End with `-----END OPENSSH PRIVATE KEY-----` or `-----END RSA PRIVATE KEY-----`
- Have no extra whitespace at the beginning or end
- Have proper line breaks (each line should end with a newline)

### Step 6: Test SSH Connection Locally

```bash
# Test the SSH connection
ssh -i ~/.ssh/github-actions-ouiimi root@170.64.150.64

# If it connects without password, the key is correct
```

## Alternative: Use RSA Key (if ed25519 doesn't work)

If ed25519 keys cause issues, use RSA:

```bash
# Generate RSA key
ssh-keygen -t rsa -b 4096 -C "github-actions-ouiimi" -f ~/.ssh/github-actions-ouiimi-rsa

# Copy to VPS
ssh-copy-id -i ~/.ssh/github-actions-ouiimi-rsa.pub root@170.64.150.64

# Get private key
cat ~/.ssh/github-actions-ouiimi-rsa
```

## Troubleshooting

### If key still doesn't work:

1. **Check key permissions:**
   ```bash
   chmod 600 ~/.ssh/github-actions-ouiimi
   ```

2. **Verify key format:**
   ```bash
   ssh-keygen -l -f ~/.ssh/github-actions-ouiimi
   # Should show: "256 SHA256:..." for ed25519
   ```

3. **Test key manually:**
   ```bash
   ssh-add ~/.ssh/github-actions-ouiimi
   ssh -v root@170.64.150.64
   ```

4. **Check VPS authorized_keys:**
   ```bash
   # On VPS
   cat ~/.ssh/authorized_keys
   # Should contain your public key
   ```

## Quick Fix Script

Run this to regenerate and format the key properly:

```bash
#!/bin/bash
# Generate new key
ssh-keygen -t ed25519 -C "github-actions-ouiimi" -f ~/.ssh/github-actions-ouiimi -N ""

# Copy to VPS
ssh-copy-id -i ~/.ssh/github-actions-ouiimi.pub root@170.64.150.64

# Display private key (copy this to GitHub Secrets)
echo "=== Copy this entire output to GitHub Secrets → DO_SSH_PRIVATE_KEY ==="
cat ~/.ssh/github-actions-ouiimi
echo "=== End of private key ==="
```

