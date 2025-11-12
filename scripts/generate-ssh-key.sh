#!/bin/bash

# Script to generate SSH key for GitHub Actions deployment
# This ensures the key is properly formatted

set -e

echo "🔑 Generating SSH key for GitHub Actions..."

# Generate SSH key (ed25519 is preferred, but RSA works too)
KEY_TYPE="ed25519"
KEY_FILE="$HOME/.ssh/github-actions-ouiimi"
VPS_IP="170.64.150.64"
VPS_USER="root"

# Check if key already exists
if [ -f "$KEY_FILE" ]; then
  read -p "Key already exists. Overwrite? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
  fi
  rm -f "$KEY_FILE" "$KEY_FILE.pub"
fi

# Generate new key (no passphrase for CI/CD)
echo "Generating $KEY_TYPE key..."
ssh-keygen -t "$KEY_TYPE" -C "github-actions-ouiimi" -f "$KEY_FILE" -N ""

# Set correct permissions
chmod 600 "$KEY_FILE"
chmod 644 "$KEY_FILE.pub"

echo "✅ SSH key generated: $KEY_FILE"

# Copy public key to VPS
echo ""
echo "📤 Copying public key to VPS..."
echo "You may be prompted for your VPS password..."

if ssh-copy-id -i "$KEY_FILE.pub" "$VPS_USER@$VPS_IP"; then
  echo "✅ Public key copied to VPS"
else
  echo "⚠️  Failed to copy key automatically. Please copy manually:"
  echo ""
  echo "Run this command:"
  echo "  ssh-copy-id -i $KEY_FILE.pub $VPS_USER@$VPS_IP"
  echo ""
  echo "Or manually add this public key to ~/.ssh/authorized_keys on your VPS:"
  cat "$KEY_FILE.pub"
fi

# Test connection
echo ""
echo "🧪 Testing SSH connection..."
if ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" "echo 'Connection successful!'" 2>/dev/null; then
  echo "✅ SSH connection test passed!"
else
  echo "⚠️  SSH connection test failed. Please verify:"
  echo "  1. Public key is in ~/.ssh/authorized_keys on VPS"
  echo "  2. VPS allows SSH key authentication"
  echo "  3. Firewall allows SSH connections"
fi

# Display private key for GitHub Secrets
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📋 COPY THIS PRIVATE KEY TO GITHUB SECRETS → DO_SSH_PRIVATE_KEY"
echo "═══════════════════════════════════════════════════════════════"
echo ""
cat "$KEY_FILE"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ Instructions:"
echo "  1. Copy the entire output above (including BEGIN and END lines)"
echo "  2. Go to: GitHub → Settings → Secrets → Actions"
echo "  3. Update or create secret: DO_SSH_PRIVATE_KEY"
echo "  4. Paste the entire key (make sure no extra spaces)"
echo ""
echo "🔒 Keep your private key secure! Never commit it to git."

