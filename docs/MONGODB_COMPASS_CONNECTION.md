# MongoDB Compass Connection Guide

## Current MongoDB Setup

Your project uses MongoDB with the connection string stored in `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/ouiimi
```

## Connect MongoDB Compass to Your Database

### Step 1: Check Your MongoDB Connection String

1. Open your `.env.local` file
2. Find the `MONGODB_URI` variable
3. Copy the connection string

**Common Connection Strings:**

**Local MongoDB:**
```
mongodb://localhost:27017/ouiimi
```

**MongoDB Atlas (Cloud):**
```
mongodb+srv://username:password@cluster.mongodb.net/ouiimi?retryWrites=true&w=majority
```

**MongoDB with Authentication:**
```
mongodb://username:password@localhost:27017/ouiimi?authSource=admin
```

### Step 2: Open MongoDB Compass

1. Launch MongoDB Compass application
2. You'll see the connection screen

### Step 3: Enter Connection String

**Option A: Direct Connection (Local)**
- If using local MongoDB:
  - Click "Fill in connection fields individually"
  - Host: `localhost`
  - Port: `27017`
  - Authentication: None (or enter username/password if required)
  - Authentication Database: `admin` (if using auth)
  - Click "Connect"

**Option B: Connection String (Recommended)**
- Paste your full connection string in the connection string field
- Click "Connect"

### Step 4: Verify Connection

Once connected, you should see:
- Database: `ouiimi` (or your database name)
- Collections will appear as you create data

## Collections Created by CRUD Operations

After using the APIs, you'll see these collections:

### 1. **users**
   - Created by: User registration
   - Fields: fname, lname, email, username, password, etc.

### 2. **businesses**
   - Created by: POST /api/business/create
   - Fields: userId, businessName, email, phone, address, logo, story, status, bankDetails
   - Indexes: userId (unique), businessName, status

### 3. **staff**
   - Created by: POST /api/staff
   - Fields: businessId, name, photo, qualifications, about, isActive
   - Indexes: businessId, isActive

### 4. **services**
   - Created by: POST /api/services
   - Fields: businessId, category, subCategory, serviceName, duration, baseCost, description, address, addOns, timeSlots, status
   - Indexes: businessId, status, category, subCategory

### 5. **forgetpasses** (if exists)
   - Created by: Password reset flow
   - Fields: email, token, expiresAt

## Testing Connection with CRUD Operations

### Test 1: Create a Business

1. Make sure your Next.js server is running:
   ```bash
   npm run dev
   ```

2. Use Postman, curl, or your frontend to call:
   ```
   POST http://localhost:3000/api/business/create
   Content-Type: application/json
   
   {
     "userId": "YOUR_USER_ID_HERE",
     "businessName": "Test Salon",
     "email": "test@salon.com",
     "address": "123 Main St, City",
     "phone": "1234567890"
   }
   ```

3. Check MongoDB Compass:
   - Open `ouiimi` database
   - Click on `businesses` collection
   - You should see the new business document

### Test 2: Create Staff

```
POST http://localhost:3000/api/staff
Content-Type: application/json

{
  "businessId": "YOUR_BUSINESS_ID",
  "name": "John Doe",
  "qualifications": "Certified Hair Stylist",
  "about": "10 years of experience"
}
```

Check in Compass: `staff` collection

### Test 3: Create Service

```
POST http://localhost:3000/api/services
Content-Type: application/json

{
  "businessId": "YOUR_BUSINESS_ID",
  "category": "Hair Services",
  "subCategory": "Haircuts",
  "serviceName": "Men's Haircut",
  "duration": "30mins",
  "baseCost": 50,
  "address": "123 Main St, City",
  "addOns": [
    {
      "name": "Hair Wash",
      "cost": 10
    }
  ],
  "timeSlots": [
    {
      "date": "2024-12-25T00:00:00.000Z",
      "startTime": "10:00am",
      "endTime": "10:30am"
    }
  ]
}
```

Check in Compass: `services` collection

## Viewing Data in MongoDB Compass

### View Documents
1. Click on a collection name
2. You'll see all documents in a table view
3. Click on a document to see full JSON

### Query Documents
1. Click "Filter" button
2. Enter MongoDB query:
   ```json
   { "status": "approved" }
   ```
3. Click "Find" to filter results

### Edit Documents
1. Click on a document
2. Click "Edit Document"
3. Modify JSON directly
4. Click "Update" to save

### Delete Documents
1. Click on a document
2. Click "Delete Document"
3. Confirm deletion

## Troubleshooting

### Connection Refused
- **Problem**: Can't connect to MongoDB
- **Solution**: 
  - Make sure MongoDB is running: `mongod` or `brew services start mongodb-community`
  - Check if port 27017 is correct
  - Check firewall settings

### Authentication Failed
- **Problem**: Username/password incorrect
- **Solution**: 
  - Verify credentials in connection string
  - Check authentication database

### Database Not Found
- **Problem**: Database doesn't exist
- **Solution**: 
  - MongoDB creates databases automatically when first document is inserted
  - Use the API to create a business, and the database will be created

### Collections Not Showing
- **Problem**: Collections don't appear
- **Solution**: 
  - Collections are created when first document is inserted
  - Use the APIs to create data first
  - Refresh Compass view

## Quick Connection Test Script

Create a test file to verify connection:

```typescript
// test-connection.ts
import dbConnect from "./lib/db";
import Business from "./lib/models/Business";

async function testConnection() {
  try {
    await dbConnect();
    console.log("✅ MongoDB connected successfully");
    
    const count = await Business.countDocuments();
    console.log(`📊 Total businesses: ${count}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Connection failed:", error);
    process.exit(1);
  }
}

testConnection();
```

Run with: `npx ts-node test-connection.ts`

## Environment Variables Check

Make sure your `.env.local` has:

```env
MONGODB_URI=mongodb://localhost:27017/ouiimi
```

Or for MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ouiimi?retryWrites=true&w=majority
```

## Next Steps

1. ✅ Connect MongoDB Compass
2. ✅ Test creating a business via API
3. ✅ Verify data appears in Compass
4. ✅ Create UI pages to interact with APIs
5. ✅ Test full CRUD flow through UI

