# Database Initialization Guide

## Quick Start

### Option 1: Use API Endpoint (Recommended)
```bash
curl -X POST http://localhost:3000/api/db/init
```

This will:
- Connect to MongoDB
- Create all collections (users, businesses, staffs, services, bookings, forgetpasses)
- Create all indexes
- Return a summary of what was created

### Option 2: Use Script (If tsx is installed)
```bash
npm run init-db
```

## What Gets Created

### Collections Created:
1. **users** - User accounts
2. **businesses** - Business registrations
3. **staffs** - Staff members
4. **services** - Service listings
5. **bookings** - Service bookings
6. **forgetpasses** - Password reset tokens (TTL: 15 minutes)

### Indexes Created:
- **users**: email (unique), username (unique), oauthProvider+oauthId (unique)
- **businesses**: userId (unique), businessName, status
- **staffs**: businessId + isActive
- **services**: businessId + status, category + subCategory, status
- **bookings**: userId + status, businessId + status, serviceId, timeSlot.date + status, createdAt
- **forgetpasses**: email (with TTL)

## Verify Collections in MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database (from MONGODB_URI)
3. You should see all 6 collections:
   - users
   - businesses
   - staffs
   - services
   - bookings
   - forgetpasses

## Check Database Status

```bash
curl http://localhost:3000/api/db/verify
```

This shows:
- Connection status
- All collections
- Document counts
- Index information

## Important Notes

- Collections are created **automatically** when first document is inserted
- You don't need to run init if you're just testing - collections will appear when you create data
- Running init is useful to see collections in MongoDB Compass before adding data
- All indexes are created automatically when models are used

## Troubleshooting

If collections don't appear:
1. Check MongoDB connection: `GET /api/db/verify`
2. Verify MONGODB_URI in `.env.local`
3. Make sure MongoDB server is running
4. Try creating a document first (collections auto-create on insert)

