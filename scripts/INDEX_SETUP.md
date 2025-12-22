# Database Index Setup Instructions

## Quick Start

Run this command from your project root:

```bash
MONGODB_URI="$(grep MONGODB_URI .env.local | cut -d '=' -f2-)" npx tsx scripts/create-indexes.ts
```

## Alternative: Export Environment Variable

```bash
# Load from .env.local
export MONGODB_URI=$(grep MONGODB_URI .env.local | cut -d '=' -f2-)

# Run the script
npx tsx scripts/create-indexes.ts
```

## Manual Method

If the above doesn't work, run with your MongoDB connection string directly:

```bash
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/database" npx tsx scripts/create-indexes.ts
```

## What It Does

Creates 10 performance indexes:
- **Bookings** (4): userId+status, businessId+status, timeSlot.date, adminPaymentStatus+updatedAt
- **Services** (2): businessId+status, category+status
- **Businesses** (2): userId, status+createdAt
- **Users** (1): roles
- **Staff** (1): businessId+isActive

## Success Output

You should see:
```
🔧 Creating database indexes...
Connecting to MongoDB...
✅ Connected

Creating Booking indexes...
✅ bookings.userId + status
...
✨ Success! Created 10 indexes
```

## Troubleshooting

**Cannot find MONGODB_URI:**
- Check `.env.local` file exists
- Ensure MONGODB_URI is set in the file
- Try exporting it manually first

**Connection errors:**
- Verify your MongoDB URI is correct
- Check network/VPN connectivity
- Ensure IP is whitelisted in MongoDB Atlas
