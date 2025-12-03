# Debug Staff Creation Issue

## Steps to Debug:

1. **Open Browser Console** (F12 or Cmd+Option+I)
2. **Try to add a staff member**
3. **Check Console Logs** for:
   - "Submitting staff data:" - Should show the data being sent
   - "Staff API response status:" - Should be 201 for success
   - "Staff API response:" - Should show the created staff object
   - Any error messages

## Common Issues:

### Issue 1: Business Not Found
- **Symptom**: Error "No business found"
- **Fix**: Make sure you've registered a business first at `/business/register`

### Issue 2: Authentication Error
- **Symptom**: Error "Unauthorized" or "Invalid token"
- **Fix**: Sign out and sign back in to refresh your token

### Issue 3: Validation Error
- **Symptom**: Error "Validation error"
- **Fix**: Make sure all required fields are filled (Name is required)

### Issue 4: Business Status Issue
- **Symptom**: Error "Cannot add staff to a rejected business"
- **Fix**: Your business should be auto-approved now, but if not, check business status

### Issue 5: Redirect Issue
- **Symptom**: Redirects to wrong page
- **Fix**: Check browser console for any errors, and verify the redirect path is `/business/staff`

## Test the API Directly:

You can test the staff creation API directly using curl:

```bash
# Replace YOUR_TOKEN and YOUR_BUSINESS_ID
curl -X POST http://localhost:3000/api/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "businessId": "YOUR_BUSINESS_ID",
    "name": "Test Staff",
    "qualifications": "Test Qualifications",
    "about": "Test About"
  }'
```

## Check Database:

1. Open MongoDB Compass
2. Connect to your database
3. Check the `staff` collection
4. Verify if staff was actually created

## What to Look For:

1. **Browser Console**: Check for JavaScript errors
2. **Network Tab**: Check the POST request to `/api/staff`
   - Status code (should be 201)
   - Response body (should have staff object)
3. **Server Console**: Check for server-side errors
4. **Database**: Verify staff exists in MongoDB

