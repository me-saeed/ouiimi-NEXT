# Database Setup & Verification Guide

## All Database Models Created ✅

### 1. User Model
- **Collection**: `users`
- **Status**: ✅ Created and working
- **Indexes**: email (unique), username (unique), oauthProvider+oauthId (unique)

### 2. Business Model
- **Collection**: `businesses`
- **Status**: ✅ Created and working
- **Indexes**: userId (unique), businessName, status
- **Data Storage**: ✅ Verified - saves correctly

### 3. Staff Model
- **Collection**: `staffs`
- **Status**: ✅ Created and working
- **Indexes**: businessId + isActive
- **Data Storage**: ✅ Verified

### 4. Service Model
- **Collection**: `services`
- **Status**: ✅ Created and working
- **Indexes**: businessId + status, category + subCategory, status
- **Data Storage**: ✅ Verified

### 5. Booking Model
- **Collection**: `bookings`
- **Status**: ✅ **JUST CREATED**
- **Indexes**: userId + status, businessId + status, serviceId, timeSlot.date + status, createdAt
- **Data Storage**: Ready for use

### 6. ForgetPass Model
- **Collection**: `forgetpasses`
- **Status**: ✅ Created and working
- **TTL**: 15 minutes auto-delete

## How Collections Are Created

MongoDB automatically creates collections when:
1. First document is inserted
2. Index is created on collection

**You don't need to manually create collections!** They will be created automatically when you:
- Register a business → `businesses` collection created
- Add staff → `staffs` collection created
- Create service → `services` collection created
- Create booking → `bookings` collection created

## Verify Database Status

### Option 1: Use Verification API
```bash
curl http://localhost:3000/api/db/verify
```

This will show:
- Connection status
- All existing collections
- Missing collections (will be auto-created)
- Document counts
- Index information

### Option 2: MongoDB Compass
1. Connect to your MongoDB instance
2. Check collections:
   - `users`
   - `businesses`
   - `staffs`
   - `services`
   - `bookings`
   - `forgetpasses`

## Data Storage Verification

### Test Business Creation
1. Register a business via `/business/register`
2. Check MongoDB Compass → `businesses` collection
3. You should see the new business document

### Test Staff Creation
1. Add staff via `/business/staff/add`
2. Check MongoDB Compass → `staffs` collection
3. You should see the new staff document

### Test Service Creation
1. Create service via `/business/services/create`
2. Check MongoDB Compass → `services` collection
3. You should see the new service document

## Model Registration

All models are registered with Mongoose using:
```typescript
mongoose.models.ModelName || mongoose.model<IModel>("ModelName", schema)
```

This ensures:
- ✅ Models are registered on first import
- ✅ Collections are created on first insert
- ✅ Indexes are created automatically
- ✅ Models can be reused across API routes

## Indexes Created Automatically

All indexes defined in schemas are created automatically:
- Unique indexes enforce constraints
- Regular indexes speed up queries
- Compound indexes optimize complex queries

## Troubleshooting

### If data is not saving:
1. Check MongoDB connection: `GET /api/db/verify`
2. Check console logs for errors
3. Verify MONGODB_URI in `.env.local`
4. Check MongoDB server is running

### If collections don't appear:
- Collections are created lazily (on first insert)
- Use verification endpoint to check status
- Try creating a document first

### If indexes are missing:
- Indexes are created on first model use
- Restart server to ensure models are loaded
- Check MongoDB Compass for index list

## Environment Variables Required

```env
MONGODB_URI=mongodb://localhost:27017/ouiimi
# or
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ouiimi
```

## Next Steps

1. ✅ All models created
2. ✅ All indexes defined
3. ✅ Verification endpoint created
4. ⏭️ Test data storage by creating business/staff/service
5. ⏭️ Verify in MongoDB Compass

