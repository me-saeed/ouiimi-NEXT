#!/bin/bash

# Initial server setup script
# Run this ONCE on your VPS to set up the application

set -e

APP_PATH="/root/ouiimi"
REPO_URL="https://github.com/me-saeed/ouiimi-NEXT.git"

echo "🚀 Setting up Ouiimi application on server..."

# Create application directory
if [ ! -d "$APP_PATH" ]; then
  echo "Creating application directory: $APP_PATH"
  mkdir -p "$APP_PATH"
fi

cd "$APP_PATH"

# Clone repository if not already a git repo
if [ ! -d ".git" ]; then
  echo "Cloning repository..."
  if [ "$(ls -A $APP_PATH 2>/dev/null)" ]; then
    echo "Directory is not empty. Backing up..."
    cd /root
    mv "$APP_PATH" "${APP_PATH}.backup.$(date +%s)"
    mkdir -p "$APP_PATH"
    cd "$APP_PATH"
  fi
  git clone "$REPO_URL" .
else
  echo "Already a git repository. Pulling latest..."
  git pull origin main || git pull origin master
fi

# Install dependencies
echo "Installing dependencies..."
yarn install --frozen-lockfile

# Create .env.production if it doesn't exist
if [ ! -f ".env.production" ]; then
  echo "Creating .env.production file..."
  cat > .env.production << 'ENVEOF'
NODE_ENV=production
MONGODB_URI=your-mongodb-uri-here
JWT_SECRET=your-jwt-secret-here
NEXTAUTH_URL=https://ouiimi.com.au
NEXTAUTH_SECRET=your-nextauth-secret-here
MAILJET_API_KEY=6c5afba9421a25308809ce27ee20a7df
MAILJET_SECRET_KEY=46413525c090257962796ac7c3e2ef46
MAILJET_FROM_EMAIL=information@ouiimi.com
MAILJET_FROM_NAME=Ouiimi
ENVEOF
  echo "⚠️  Please edit .env.production with your actual values!"
fi

# Create logs directory
mkdir -p "$APP_PATH/logs"

# Build application
echo "Building application..."
yarn build

# Setup PM2
echo "Setting up PM2..."
if ! command -v pm2 &> /dev/null; then
  echo "PM2 not found. Installing..."
  npm install -g pm2
fi

# Start application with PM2
if pm2 list | grep -q "ouiimi"; then
  echo "Restarting existing PM2 process..."
  pm2 restart ouiimi
else
  echo "Starting new PM2 process..."
  cd "$APP_PATH"
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup
fi

echo ""
echo "✅ Server setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env.production with your actual values"
echo "2. Restart the application: pm2 restart ouiimi"
echo "3. Check logs: pm2 logs ouiimi"
echo "4. Setup Nginx (see DEPLOYMENT_STEP_BY_STEP.md)"

