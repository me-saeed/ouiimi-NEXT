# Testing Setup

## ✅ Jest is Working!

Tests are now configured to work with **Yarn** and Node.js v23+. The `strip-ansi` compatibility issue has been resolved using a custom Jest reporter.

## Prerequisites

### 1. MongoDB for Testing

Tests require a MongoDB instance. You can either:

**Option A: Use Docker (Recommended)**
```bash
docker run -d -p 27017:27017 --name test-mongodb mongo:7
```

**Option B: Install MongoDB locally**
```bash
# macOS
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

**Option C: Use MongoDB Atlas (Free tier)**
- Create a free cluster at https://www.mongodb.com/cloud/atlas
- Update `MONGODB_URI` in test environment

### 2. Install Dependencies

```bash
yarn install
```

## Running Tests

```bash
# Run all tests (using Yarn)
yarn test

# Watch mode
yarn test:watch

# With coverage
yarn test:coverage
```

**Note**: Make sure MongoDB is running before running tests, or tests will fail with connection timeouts.

## Test Structure

Tests are located in `__tests__/` directory:
- `__tests__/api/auth/signup.test.ts` - Signup API tests
- `__tests__/api/auth/signin.test.ts` - Signin API tests
- `__tests__/api/auth/forgot-password.test.ts` - Forgot password tests
- `__tests__/api/auth/reset-password.test.ts` - Reset password tests

## CI/CD

GitHub Actions will:
- Use Node.js v20 automatically (configured in `.github/workflows/ci-cd.yml`)
- Start MongoDB service for tests
- Run tests automatically on push/PR

## Troubleshooting

### Tests failing with MongoDB connection errors?
- Make sure MongoDB is running: `docker ps` or `brew services list`
- Check `MONGODB_URI` in your environment
- For CI/CD, MongoDB service is automatically started

### Tests failing with CSRF token errors?
- Tests need to fetch CSRF token from `/api/auth/csrf` endpoint
- Make sure the API server can be reached (or mock it)

### Still seeing strip-ansi errors?
- Make sure you're using **Yarn** (not npm)
- The custom Jest reporter (`jest-reporter.js`) should handle this
- If issues persist, try: `yarn install --force`

