# Testing API Calls - Debug Guide

## How to Test

1. **Open Browser Console** (F12 or Cmd+Option+I)
2. **Open Network Tab** in DevTools
3. **Try to create a service or add staff**
4. **Check for:**

### In Console:
- `=== SERVICE FORM SUBMITTED ===` or `=== FORM SUBMITTED ===`
- `Form data:` - Should show your input
- `Making POST request to /api/services...` or `/api/staff...`
- `Service API response status:` or `Staff API response status:`
- Any error messages

### In Network Tab:
- Look for POST requests to `/api/services` or `/api/staff`
- Check the request payload
- Check the response status (should be 201 for success)
- Check the response body

## Common Issues:

### Issue 1: Form Validation Failing
**Symptom**: No API call in Network tab, console shows "Form validation failed"
**Fix**: Fill all required fields (marked with *)

### Issue 2: No Console Logs
**Symptom**: Nothing happens when clicking submit
**Fix**: 
- Check if JavaScript is enabled
- Check for JavaScript errors in console
- Verify the form element exists

### Issue 3: API Returns 401/403
**Symptom**: API call made but returns error
**Fix**: 
- Sign out and sign back in
- Check if token is valid in localStorage

### Issue 4: API Returns 404
**Symptom**: API route not found
**Fix**: 
- Check if server is running
- Verify API route exists at `/api/services` or `/api/staff`

### Issue 5: Business Not Found
**Symptom**: Error "No business found"
**Fix**: Register a business first at `/business/register`

## Manual API Test:

You can test the API directly using curl:

```bash
# Test Staff API
curl -X POST http://localhost:3000/api/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "businessId": "YOUR_BUSINESS_ID",
    "name": "Test Staff"
  }'

# Test Service API
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "businessId": "YOUR_BUSINESS_ID",
    "category": "Hair Services",
    "serviceName": "Test Service",
    "duration": "30mins",
    "baseCost": 50,
    "address": "123 Test St"
  }'
```

## What Should Happen:

1. Click submit button
2. Console shows form submission logs
3. Network tab shows POST request
4. API returns 201 status
5. Toast notification appears
6. Redirects to list page
7. New item appears in list

