# Debug Guide - Dashboard Loading Issue

## Quick Fix Steps

### 1. Restart Dev Server
```bash
# Stop current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

### 2. Check Browser Console
Open browser console (F12 or Cmd+Option+I) and look for these logs:

```
[Dashboard] loadDashboardData started
[Dashboard] Loading business data for userId: xxx
[Dashboard] Business data received: 1 businesses
[Dashboard] Setting business: xxx
[Dashboard] Loading complete, setting isLoading to false
[Dashboard] Main render - Business: true, Active Tab: bookings
```

```
[ListTab] Loading services for business: xxx
[ListTab] Fetching services from API...
[ListTab] API response status: 200
[ListTab] Services received: X
```

```
[API /api/services GET] Request received
[API /api/services GET] Building filter with businessId: xxx
[API /api/services GET] Final filter: {"businessId":"xxx"}
[API /api/services GET] Query results - Total: X, Returned: X
```

### 3. Common Issues & Solutions

#### Issue: Stuck on "Loading dashboard..."
**Check console for:**
- `[Dashboard] No user, skipping loadDashboardData` → Sign in again
- `[Dashboard] Error loading dashboard data` → Check error message
- No dashboard logs at all → Hard refresh (Cmd+Shift+R)

#### Issue: Dashboard loads but Services tab empty
**Check console for:**
- `[ListTab] No business ID available` → Business not loaded
- `[ListTab] Services received: 0` → No services created yet
- `[API /api/services GET] Query results - Total: 0` → Database has no services

#### Issue: API returns 500 error
**Check terminal for:**
```
[API /api/services GET] Error occurred: ...
```

### 4. Clear Everything and Restart
```bash
# If nothing works, clean everything:
rm -rf .next node_modules/.cache
npm run build
npm run dev
```

### 5. Test Service Creation
1. Go to "Add Service" button
2. Check console for `[Create Service] Component mounted`
3. Fill form and submit
4. Check for `[Create Service] Service created successfully`
5. Check for redirect to dashboard

## What Was Fixed

1. ✅ **CSP Headers** - Google Maps now loads properly
2. ✅ **Comprehensive Logging** - Every operation logged with `[Component]` prefix
3. ✅ **Service Query Filter** - Fixed to not require "listed" status for business owner
4. ✅ **Null Business References** - Services with deleted businesses filtered out
5. ✅ **Error Handling** - All errors logged with stack traces
6. ✅ **Loading States** - Clear loading indicators with text

## Console Log Format

All logs follow this pattern:
```
[Component/API] Description
```

Examples:
- `[Dashboard] Loading business data...`
- `[ListTab] Services received: 5`
- `[API /api/services POST] Request received`
- `[Create Service] Form submission started`

## Performance Monitoring

Look for timing logs:
```
[API /api/services GET] Execution time: 234ms
[ListTab] loadServices execution: 156ms
```

If times > 2000ms, database might be slow.

