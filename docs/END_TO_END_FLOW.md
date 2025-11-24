# End-to-End Business Registration Flow

## Complete Flow Diagram

```
User → Form → Validation → API → Auth → Database → Response → UI
```

## Step-by-Step Flow

### 1. **User Authentication Check** (Frontend)
- Location: `app/business/register/page.tsx`
- Checks: `localStorage.getItem("token")` and `localStorage.getItem("user")`
- If not authenticated: Redirects to `/signin`
- If authenticated: Shows registration form

### 2. **Form Submission** (Frontend)
- Location: `app/business/register/page.tsx` → `onSubmit()`
- Validates form data with Zod schema (excluding userId)
- Prepares request body with:
  - `userId` from localStorage user data
  - `businessName` (trimmed, min 2 chars)
  - `email` (trimmed, valid format)
  - `phone` (optional, trimmed)
  - `address` (trimmed, min 5 chars)
  - `story` (optional, trimmed)
- Sends POST request to `/api/business/create` with:
  - Headers: `Content-Type: application/json`, `Authorization: Bearer {token}`
  - Body: JSON stringified request data

### 3. **API Route - Authentication** (Backend)
- Location: `app/api/business/create/route.ts`
- Extracts token from `Authorization: Bearer {token}` header
- Verifies token using `verifyToken()` from `lib/jwt.ts`
- Validates `decoded.userId` exists
- If invalid: Returns 401 error

### 4. **API Route - Request Validation** (Backend)
- Parses JSON body
- Validates with `businessCreateSchema` (Zod)
- Ensures `userId` from token matches `userId` in body (or uses token userId)
- If validation fails: Returns 400 error with details

### 5. **Database Connection** (Backend)
- Location: `lib/db.ts`
- Connects to MongoDB using `MONGODB_URI` from environment
- Uses connection caching to prevent multiple connections
- If connection fails: Returns 503 error

### 6. **User Verification** (Backend)
- Queries `User` collection by `userId` (ObjectId)
- Verifies user exists
- If user not found: Returns 404 error

### 7. **Duplicate Check** (Backend)
- Queries `Business` collection for:
  - Existing business with same `userId`
  - Existing business with same `businessName`
  - Existing business with same `email`
- If duplicate found: Returns 400 error

### 8. **Business Creation** (Backend)
- Location: `lib/models/Business.ts`
- Creates new Business document with:
  - `userId` (ObjectId reference to User)
  - `businessName` (trimmed)
  - `email` (lowercased, trimmed)
  - `phone` (optional, trimmed)
  - `address` (trimmed)
  - `story` (optional, trimmed)
  - `status: "pending"`
- Saves to MongoDB
- Verifies document was saved by querying again
- If save fails: Returns 500 error

### 9. **Response** (Backend → Frontend)
- Returns 201 status with:
  - `message`: Success message
  - `business`: Business data (id, name, email, status, userId)

### 10. **Success Handling** (Frontend)
- Shows success alert
- Redirects to `/business/dashboard` after 500ms

## Error Handling

### Frontend Errors
- **Form validation errors**: Displayed under each field
- **Network errors**: Displayed in error alert
- **API errors**: Displayed in error alert with message from server

### Backend Errors
- **401**: Authentication required/invalid token
- **400**: Validation error/duplicate business
- **403**: User ID mismatch
- **404**: User not found
- **500**: Server error (with details in development)
- **503**: Database connection failed

## Data Flow

```
localStorage (token, user) 
  → API Request (Bearer token + body)
    → JWT Verification (extract userId)
      → MongoDB (User lookup)
        → MongoDB (Business creation)
          → Response (business data)
            → localStorage (optional: update user with businessId)
              → Redirect (dashboard)
```

## Security Checks

1. ✅ Token verification before processing
2. ✅ User ID validation (token userId must match request userId)
3. ✅ User existence check
4. ✅ Duplicate business prevention
5. ✅ Input validation (Zod schema)
6. ✅ SQL injection prevention (Mongoose)
7. ✅ Rate limiting (via `withRateLimit`)

## Database Schema

### Business Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, unique),
  businessName: String (required, indexed),
  email: String (required, lowercase),
  phone: String (optional),
  address: String (required),
  story: String (optional),
  logo: String (optional),
  status: "pending" | "approved" | "rejected" (default: "pending", indexed),
  bankDetails: {
    name: String,
    bsb: String,
    accountNumber: String,
    contactNumber: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Testing Checklist

- [ ] User can access registration page when authenticated
- [ ] User is redirected to signin when not authenticated
- [ ] Form validation works (required fields, min lengths)
- [ ] API rejects requests without token
- [ ] API rejects requests with invalid token
- [ ] API rejects requests with mismatched userId
- [ ] API creates business in database
- [ ] API prevents duplicate businesses
- [ ] Success response is received
- [ ] User is redirected to dashboard on success
- [ ] Error messages are displayed correctly

