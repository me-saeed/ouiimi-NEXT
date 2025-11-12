#!/bin/bash

# Deployment script for DigitalOcean VPS
# This script should be run on the server

set -e

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/ouiimi"
BACKUP_DIR="/var/backups/ouiimi"
NODE_VERSION="20"

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
  echo -e "${RED}Please do not run as root${NC}"
  exit 1
fi

# Create backup
echo -e "${YELLOW}Creating backup...${NC}"
mkdir -p $BACKUP_DIR
if [ -d "$APP_DIR" ]; then
  tar -czf "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz" -C "$APP_DIR" . 2>/dev/null || true
fi

# Navigate to app directory
cd $APP_DIR

# Pull latest code
echo -e "${YELLOW}Pulling latest code...${NC}"
git fetch origin
git reset --hard origin/main || git reset --hard origin/master

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci --production

# Build application
echo -e "${YELLOW}Building application...${NC}"
npm run build

# Restart application
echo -e "${YELLOW}Restarting application...${NC}"
if command -v pm2 &> /dev/null; then
  pm2 restart ouiimi || pm2 start npm --name ouiimi -- start
elif systemctl is-active --quiet ouiimi; then
  sudo systemctl restart ouiimi
else
  echo -e "${YELLOW}No process manager found. Please restart manually.${NC}"
fi

# Reload Nginx
echo -e "${YELLOW}Reloading Nginx...${NC}"
sudo nginx -t && sudo systemctl reload nginx || echo -e "${RED}Nginx reload failed${NC}"

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"

