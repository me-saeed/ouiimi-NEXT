# Setup Guide for Ouiimi-NEXT

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Fill in your MongoDB connection string
   - Generate secure secrets for JWT and NextAuth
   - (Optional) Add OAuth credentials for Google/Facebook

3. **Start MongoDB**
   - Make sure MongoDB is running locally, or use a cloud service like MongoDB Atlas

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Open [http://localhost:3000](http://localhost:3000)
   - You'll be redirected to `/signin`
   - Navigate to `/signup` to create an account

## Environment Variables Explained

### Required Variables

- `MONGODB_URI`: Your MongoDB connection string
  - Local: `mongodb://localhost:27017/ouiimi`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/ouiimi`

- `JWT_SECRET`: Secret key for signing JWT tokens
  - Generate with: `openssl rand -base64 32`

- `NEXTAUTH_SECRET`: Secret for NextAuth.js
  - Generate with: `openssl rand -base64 32`

- `NEXTAUTH_URL`: Your application URL
  - Development: `http://localhost:3000`
  - Production: `https://yourdomain.com`

### Optional Variables (for OAuth)

- `GOOGLE_CLIENT_ID`: From Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
- `FACEBOOK_CLIENT_ID`: From Facebook Developers
- `FACEBOOK_CLIENT_SECRET`: From Facebook Developers

### Security Variables

- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds (default: 900000 = 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 100)

## MongoDB Setup

### Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/ouiimi`

### MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get connection string
4. Replace `<password>` with your password
5. Add to `.env.local`

## OAuth Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env.local`

### Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Facebook Login" product
4. Go to Settings → Basic
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/facebook`
6. Copy App ID and Secret to `.env.local`

## Testing

### Test Signup
1. Navigate to `/signup`
2. Fill in the form
3. Submit and verify account creation

### Test Signin
1. Navigate to `/signin`
2. Use credentials from signup
3. Verify successful login

### Test OAuth (if configured)
1. Click Google or Facebook button
2. Complete OAuth flow
3. Verify account creation/login

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running
- Check connection string format
- Ensure network access (for Atlas)

### JWT Errors
- Verify `JWT_SECRET` is set
- Check token expiration settings

### OAuth Not Working
- Verify credentials in `.env.local`
- Check redirect URIs match exactly
- Ensure OAuth apps are in development mode (for testing)

### Rate Limiting
- Adjust `RATE_LIMIT_MAX_REQUESTS` if needed
- Check rate limit headers in response

## Production Deployment

1. **Update Environment Variables**
   - Use production MongoDB URI
   - Use production URLs
   - Use strong, unique secrets

2. **Enable HTTPS**
   - Middleware automatically enforces HTTPS in production

3. **Set Up OAuth Redirect URIs**
   - Update OAuth apps with production URLs
   - Add production callback URLs

4. **Build and Deploy**
   ```bash
   npm run build
   npm start
   ```

## Security Checklist

- [ ] Strong JWT secret (32+ characters)
- [ ] Strong NextAuth secret (32+ characters)
- [ ] MongoDB connection secured
- [ ] HTTPS enabled in production
- [ ] Rate limiting configured
- [ ] CSRF protection enabled
- [ ] OAuth credentials secured
- [ ] Environment variables not committed to git

