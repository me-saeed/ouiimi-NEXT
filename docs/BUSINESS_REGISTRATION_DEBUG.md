# Business Registration Debug Guide

## Complete Flow

1. **Form Submission** (`app/business/register/page.tsx`)
   - Form uses React Hook Form with Zod validation
   - `onSubmit` handler validates data and sends to API
   - Console logs at every step for debugging

2. **API Route** (`app/api/business/create/route.ts`)
   - Receives POST request with business data
   - Validates with Zod schema
   - Connects to MongoDB
   - Converts userId to ObjectId
   - Checks for existing business
   - Creates new business record
   - Returns success/error response

## Debugging Steps

1. **Open Browser Console** (F12)
2. **Fill out the form** with:
   - Business Name (required)
   - Email (required, valid format)
   - Phone (optional)
   - Address (required, min 5 chars)
   - Business Story (optional)

3. **Click "Register Business"**
4. **Check console for logs:**
   - "Form submitted with data:"
   - "Token exists: true/false"
   - "User data exists: true/false"
   - "User ID: [id]"
   - "Submitting business registration:"
   - "Response status: [status]"
   - "Business registration response:"

5. **Check server logs** for:
   - "=== Business Create API Called ==="
   - "Request body received:"
   - "Validation passed"
   - "Database connected successfully"
   - "User found: [email]"
   - "Business created successfully"

## Common Issues

1. **"User not found"**
   - Check if user is signed in
   - Verify userId in localStorage matches database
   - Check MongoDB connection

2. **"Business already exists"**
   - User already has a business registered
   - Business name or email already taken

3. **"Validation error"**
   - Check required fields are filled
   - Email must be valid format
   - Address must be at least 5 characters

4. **Network errors**
   - Check MongoDB is running
   - Check MONGODB_URI in .env.local
   - Check API route is accessible

## Testing

1. Sign in first
2. Navigate to `/business/register`
3. Fill form completely
4. Submit and watch console
5. Check for success message or error details

