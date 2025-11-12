# Ouiimi-NEXT

A modern, secure authentication system built with Next.js 14, TypeScript, MongoDB, and Shadcn UI.

## Features

- ✅ **Signup & Signin Pages** - Beautiful, responsive authentication pages
- ✅ **MongoDB Integration** - Secure user data storage
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **OAuth Support** - Google and Facebook authentication
- ✅ **High Security** - bcrypt password hashing, rate limiting, CSRF protection, XSS protection
- ✅ **Dynamic Color Scheme** - Modular color system for easy theming
- ✅ **TypeScript** - Full type safety
- ✅ **Tailwind CSS** - Modern, utility-first styling
- ✅ **Shadcn UI** - Beautiful, accessible components

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database (local or cloud)

### Installation

1. Clone the repository and navigate to the project:
```bash
cd ouiimi-NEXT
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your configuration:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/ouiimi

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-change-this-in-production

# OAuth - Google (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth - Facebook (Optional)
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
ouiimi-NEXT/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── signup/route.ts
│   │       ├── signin/route.ts
│   │       ├── csrf/route.ts
│   │       └── oauth/
│   │           ├── google/route.ts
│   │           └── facebook/route.ts
│   ├── signup/
│   │   └── page.tsx
│   ├── signin/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── card.tsx
│       └── alert.tsx
├── lib/
│   ├── db.ts
│   ├── models/
│   │   └── User.ts
│   ├── jwt.ts
│   ├── validation.ts
│   ├── colors.ts
│   ├── utils.ts
│   ├── theme-provider.tsx
│   └── security/
│       ├── rate-limit.ts
│       └── csrf.ts
├── middleware.ts
└── package.json
```

## Security Features

### Password Hashing
- Uses bcryptjs with 12 salt rounds for secure password storage

### Rate Limiting
- Configurable rate limiting to prevent brute force attacks
- Default: 100 requests per 15 minutes per IP

### CSRF Protection
- CSRF tokens required for all POST requests
- Token validation on server-side

### XSS Protection
- Content Security Policy headers
- Input validation and sanitization
- React's built-in XSS protection

### HTTPS Enforcement
- Automatic HTTPS redirect in production

## API Endpoints

### POST `/api/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "fname": "John",
  "lname": "Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "securepassword123",
  "address": "123 Main St",
  "contactNo": "1234567890"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "...",
    "fname": "John",
    "lname": "Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "token": "jwt-token-here"
  }
}
```

### POST `/api/auth/signin`
Sign in with email/username and password.

**Request Body:**
```json
{
  "username": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "fname": "John",
    "lname": "Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "token": "jwt-token-here"
  }
}
```

### GET `/api/auth/csrf`
Get a CSRF token for form submissions.

**Response:**
```json
{
  "csrfToken": "token-here"
}
```

## Color Scheme

The project includes a modular color system. To change colors, update the `colorSchemes` object in `lib/colors.ts`:

```typescript
export const colorSchemes: Record<string, ColorScheme> = {
  default: {
    primary: "142 76% 36%", // HSL values
    secondary: "25 95% 53%",
    // ...
  },
};
```

Colors are applied via CSS variables in `app/globals.css`.

## OAuth Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Update `.env.local` with client ID and secret

### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs
5. Update `.env.local` with app ID and secret

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## License

MIT

