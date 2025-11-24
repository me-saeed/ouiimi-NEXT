# Database Models & Collections

## All Models Created

### ✅ User Model (`users` collection)
- **File**: `lib/models/User.ts`
- **Collection**: `users`
- **Fields**: fname, lname, email, username, password, address, contactNo, pic, isEnable, Roles, token, following, follower, sellerPoints, expotoken, verify, counterId, date, oauthProvider, oauthId
- **Indexes**: 
  - email (unique)
  - username (unique, sparse)
  - oauthProvider + oauthId (unique, sparse)

### ✅ Business Model (`businesses` collection)
- **File**: `lib/models/Business.ts`
- **Collection**: `businesses`
- **Fields**: userId, businessName, email, phone, address, logo, story, status, bankDetails, createdAt, updatedAt
- **Indexes**:
  - userId (unique)
  - businessName
  - status

### ✅ Staff Model (`staffs` collection)
- **File**: `lib/models/Staff.ts`
- **Collection**: `staffs`
- **Fields**: businessId, name, photo, qualifications, about, isActive, createdAt, updatedAt
- **Indexes**:
  - businessId + isActive

### ✅ Service Model (`services` collection)
- **File**: `lib/models/Service.ts`
- **Collection**: `services`
- **Fields**: businessId, category, subCategory, serviceName, duration, baseCost, description, address, addOns, timeSlots, status, createdAt, updatedAt
- **Indexes**:
  - businessId + status
  - category + subCategory
  - status

### ✅ Booking Model (`bookings` collection)
- **File**: `lib/models/Booking.ts`
- **Collection**: `bookings`
- **Fields**: userId, businessId, serviceId, staffId, timeSlot, addOns, totalCost, depositAmount, remainingAmount, status, paymentStatus, paymentIntentId, customerNotes, businessNotes, cancelledAt, cancellationReason, createdAt, updatedAt
- **Indexes**:
  - userId + status
  - businessId + status
  - serviceId
  - timeSlot.date + status
  - createdAt

### ✅ ForgetPass Model (`forgetpasses` collection)
- **File**: `lib/models/ForgetPass.ts`
- **Collection**: `forgetpasses`
- **Fields**: email, createdAt
- **TTL**: 15 minutes (auto-delete)

## Model Registration

All models use the pattern:
```typescript
const Model: Model<IModel> =
  mongoose.models.Model || mongoose.model<IModel>("Model", modelSchema);
```

This ensures:
- Models are registered with Mongoose
- Collections are created automatically on first insert
- Models can be reused across API routes

## Database Connection

- **File**: `lib/db.ts`
- **Connection**: Cached connection to prevent multiple connections
- **URI**: From `MONGODB_URI` environment variable

## Verification

Use the verification endpoint to check database status:
```
GET /api/db/verify
```

Returns:
- Connection status
- All collections
- Expected vs existing collections
- Model registration status
- Collection statistics (document counts, indexes)

## Data Storage Verification

All CRUD operations:
1. ✅ Connect to database
2. ✅ Use proper models
3. ✅ Save documents
4. ✅ Verify documents exist after save
5. ✅ Return proper responses

## Collections Auto-Creation

MongoDB automatically creates collections when:
- First document is inserted
- Index is created on non-existent collection

All models will create their collections automatically when first used.

## Indexes

All models have proper indexes for:
- Fast queries
- Unique constraints
- Relationship lookups
- Status filtering

## Testing Data Storage

1. Create a business → Check `businesses` collection
2. Create a staff → Check `staffs` collection
3. Create a service → Check `services` collection
4. All data persists correctly ✅

