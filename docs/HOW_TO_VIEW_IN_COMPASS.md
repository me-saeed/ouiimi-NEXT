# How to View Database Collections in MongoDB Compass

## Step 1: Open MongoDB Compass

1. Open MongoDB Compass application on your Mac
2. If you don't have it installed, download from: https://www.mongodb.com/try/download/compass

## Step 2: Connect to Your Database

### Option A: If using Local MongoDB (default)
1. In the connection string field, enter:
   ```
   mongodb://localhost:27017
   ```
2. Click **Connect**

### Option B: If using MongoDB Atlas (cloud)
1. Get your connection string from `.env.local` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ouiimi
   ```
2. Copy the connection string
3. Paste it in MongoDB Compass
4. Click **Connect**

### Option C: If using custom connection
1. Check your `.env.local` file for `MONGODB_URI`
2. Copy the connection string
3. Paste it in MongoDB Compass
4. Click **Connect**

## Step 3: Select Your Database

1. After connecting, you'll see a list of databases
2. Look for database named: **`ouiimi`**
3. Click on **`ouiimi`** to open it

## Step 4: View Collections

Once inside the `ouiimi` database, you'll see **6 collections**:

### Collections You Should See:

1. **`users`**
   - Contains user accounts
   - Currently has: 1 document
   - Indexes: email, username, oauthProvider+oauthId

2. **`businesses`**
   - Contains business registrations
   - Currently has: 1 document
   - Indexes: userId, businessName, status

3. **`staffs`**
   - Contains staff members
   - Currently has: 0 documents (empty)
   - Indexes: businessId+isActive

4. **`services`**
   - Contains service listings
   - Currently has: 0 documents (empty)
   - Indexes: businessId+status, category+subCategory, status

5. **`bookings`**
   - Contains service bookings
   - Currently has: 0 documents (empty)
   - Indexes: userId+status, businessId+status, serviceId, timeSlot.date+status, createdAt

6. **`forgetpasses`**
   - Contains password reset tokens
   - Currently has: 0 documents (empty)
   - Indexes: createdAt (TTL - auto-deletes after 15 minutes)

## Step 5: View Documents

1. Click on any collection name (e.g., `users` or `businesses`)
2. You'll see a list of documents
3. Click on a document to view its details
4. You can edit documents directly in Compass (be careful!)

## Step 6: View Indexes

1. Click on a collection
2. Click on the **"Indexes"** tab at the top
3. You'll see all indexes for that collection

## Quick Verification Checklist

✅ Database name: `ouiimi`  
✅ 6 collections visible  
✅ `users` collection has 1 document  
✅ `businesses` collection has 1 document  
✅ All other collections exist (even if empty)  
✅ Indexes are created for each collection  

## Troubleshooting

### Can't connect?
- Make sure MongoDB server is running: `brew services list | grep mongodb`
- Check if MongoDB is running: `mongosh --eval "db.version()"`

### Database not showing?
- Collections are created automatically when first document is inserted
- If you don't see `ouiimi` database, try creating a document via the app first

### Wrong database?
- Check your `.env.local` file for the correct database name
- Default database name is `ouiimi`

## Example: Viewing a Business Document

1. Click on `businesses` collection
2. You should see 1 document
3. Click on the document to view:
   - `_id`: ObjectId
   - `userId`: Reference to user
   - `businessName`: Your business name
   - `email`: Business email
   - `status`: "pending", "approved", or "rejected"
   - `createdAt`: Timestamp
   - `updatedAt`: Timestamp

## Visual Guide

```
MongoDB Compass
├── Databases
    └── ouiimi (database)
        ├── users (1 document)
        ├── businesses (1 document)
        ├── staffs (0 documents)
        ├── services (0 documents)
        ├── bookings (0 documents)
        └── forgetpasses (0 documents)
```

That's it! You can now see all your database collections and data in MongoDB Compass.

