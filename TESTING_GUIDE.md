# Ouiimi Testing Guide

This guide provides step-by-step instructions to test all functionalities as both a **Business Owner** and a **Customer (Shopper)**.

---

## Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Seed the database (optional but recommended):**
   - Visit: `http://localhost:3000/api/seed` (GET or POST)
   - This creates test data: businesses, services, staff, and time slots

3. **Have MongoDB Compass open** (optional) to verify data storage

---

## Part 1: Business Owner Testing Flow

### Step 1: Create Business Owner Account

1. Go to: `http://localhost:3000/signup`
2. Fill in:
   - First Name: `Business`
   - Last Name: `Owner`
   - Email: `business@test.com`
   - Username: `businessowner`
   - Password: `password123`
3. Click **Sign Up**
4. You should be redirected to the home page

### Step 2: Register Your Business

1. Navigate to: `http://localhost:3000/business/register`
2. Fill in business details:
   - Business Name: `Test Beauty Salon`
   - Email: `salon@test.com`
   - Phone: `0412345678`
   - Address: `123 Beauty Street, Sydney NSW 2000`
   - Story: `We provide the best beauty services in town!`
3. Click **Register Business**
4. You should be redirected to `/business/dashboard`

### Step 3: View Business Dashboard

1. You should see the dashboard with:
   - Business stats (Services, Staff, Bookings)
   - Tabs: Bookings, List (Services), Staff, Details
2. Verify all tabs are accessible

### Step 4: Add Staff Members

1. Click on **Staff** tab
2. Click **Add Staff** button
3. Fill in:
   - Name: `Alice Johnson`
   - Photo URL: `https://via.placeholder.com/150`
   - Role: `Senior Stylist`
   - Bio: `Expert in modern hair trends with 10 years of experience`
4. Click **Add Staff**
5. Verify staff appears in the list
6. Click **Edit** on the staff member to update details
7. Test editing and saving changes

### Step 5: Create Services

1. Click on **List** tab (Services)
2. Click **Add Service** button
3. Fill in service details:
   - Category: `Hair Services`
   - Service Name: `Women's Haircut & Style`
   - Duration: `1h 0m`
   - Base Cost: `75`
   - Address: `123 Beauty Street, Sydney NSW 2000`
   - Description: `Professional haircut and styling service`
4. Click **Create Service**
5. Verify service appears in the list

### Step 6: Add Time Slots to Service

1. Click **Edit** on the service you just created
2. Scroll down to **Time Slots** section
3. Click **Add Time Slot** button
4. Fill in:
   - Date: Select a future date
   - Start Time: `10:00`
   - End Time: `11:00`
   - Cost: `75` (or leave default)
   - Staff: Select `Alice Johnson` (if available)
5. Click **Add**
6. Verify time slot appears in the list
7. Add 2-3 more time slots with different dates/times
8. Test deleting an unbooked time slot

### Step 7: Add Add-Ons to Service

1. Still in the service edit page
2. In the service form, you can add add-ons (if the form supports it)
3. Or create another service with add-ons:
   - Service Name: `Full Head Highlights`
   - Base Cost: `150`
   - Add add-ons like "Toner" for `$30`

### Step 8: Edit Business Profile

1. Go to: `http://localhost:3000/business/profile/edit`
2. Update business details:
   - Change business name
   - Update story
   - Add/change logo URL
3. Click **Update Business**
4. Verify changes are saved

### Step 9: Add Bank Details

1. In the dashboard, click **Details** tab
2. Scroll to **Bank Details** section
3. Fill in:
   - Account Name: `Test Beauty Salon`
   - BSB: `123456`
   - Account Number: `12345678`
4. Click **Save Bank Details**
5. Verify bank details are saved

### Step 10: View Bookings (After Customer Books)

1. In the dashboard, click **Bookings** tab
2. You should see:
   - **Up-coming** bookings
   - **Pending** bookings
   - **Finished** bookings
3. Test filtering and viewing booking details
4. Test **Complete** and **Cancel** booking actions

---

## Part 2: Customer (Shopper) Testing Flow

### Step 1: Create Customer Account

1. Go to: `http://localhost:3000/signup`
2. Fill in:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `customer@test.com`
   - Username: `johndoe`
   - Password: `password123`
3. Click **Sign Up**
4. You should be redirected to the home page

### Step 2: Browse Services

1. On the home page, you should see services by category:
   - Hair Services
   - Nails
   - Beauty & Brows
   - Massage & Wellness
   - Skin & Facials
   - Dog Grooming
2. Scroll through different categories
3. Verify service cards show:
   - Service name
   - Business name
   - Price
   - Location
   - Next available date/time

### Step 3: View Service Details

1. Click on any service card
2. You should see:
   - Full service description
   - Business information
   - Available time slots
   - Add-ons (if any)
   - Booking form on the right sidebar

### Step 4: View Business Profile

1. Click on the business name/link in the service detail page
2. Or go to: `http://localhost:3000/business/[businessId]`
3. You should see:
   - Business logo and name
   - Tabs: Story, Services, Staff
4. Test all tabs:
   - **Story**: View business story and contact info
   - **Services**: Browse all services from this business
   - **Staff**: View staff members with photos and bios

### Step 5: Book a Service

1. Go back to a service detail page
2. In the booking form (right sidebar):
   - Select a **Date** from dropdown
   - Select a **Time** slot
   - Select **Staff** (if available)
   - Add **Add-ons** (check boxes)
   - Add **Description** (optional notes)
3. Review the total cost
4. Click **Book Now**
5. You should be redirected to `/cart`

### Step 6: Review Cart

1. In the cart page, verify:
   - All selected services are listed
   - Correct dates and times
   - Add-ons are included
   - Cost breakdown:
     - Subtotal
     - Ouiimi Fee ($1.99)
     - Total
     - Deposit (10%)
     - Remaining (90%)
2. Fill in payment details (placeholder form)
3. Click **Book Now**

### Step 7: Booking Confirmation

1. After booking, you should be redirected to `/bookings/[id]/confirm`
2. Verify confirmation page shows:
   - ✅ Success message
   - Booking ID
   - Business name
   - Service name
   - Date and time
   - Staff (if selected)
   - Payment summary
3. Click **View My Bookings** to go to profile

### Step 8: View Profile & Bookings

1. Go to: `http://localhost:3000/profile`
2. You should see:
   - Profile header with avatar
   - Tabs: Bookings, Finished Bookings, Details
3. Click **Bookings** tab:
   - View all upcoming bookings
   - Click on a booking to see details
   - Test **Reschedule** button
   - Test **Contact** button
   - Test **Cancel** button

### Step 9: Reschedule a Booking

1. In profile, click on an upcoming booking
2. Click **Reschedule** button
3. Fill in:
   - New Date
   - New Start Time
   - New End Time
4. Click **Confirm Reschedule**
5. Verify booking is updated

### Step 10: Cancel a Booking

1. In profile, click on an upcoming booking
2. Click **Cancel** button
3. Confirm cancellation
4. Verify:
   - Booking moves to "Finished Bookings" tab
   - Status shows as "Cancelled"
   - Email notification sent (check console logs)

### Step 11: View Finished Bookings

1. Click **Finished Bookings** tab
2. You should see:
   - Completed bookings
   - Cancelled bookings
3. Click on a finished booking to see details
4. Test **Rebook** button (redirects to business page)

### Step 12: Update Profile Details

1. Click **Details** tab in profile
2. Update:
   - Name
   - Email
   - Number
3. Click **Save**
4. Verify changes are saved

### Step 13: Browse Services by Category

1. Go to: `http://localhost:3000/services`
2. Browse services by category
3. Use filters if available
4. Click on services to view details

---

## Part 3: Cross-Flow Testing

### Test Email Notifications

1. **Booking Confirmation Email:**
   - Create a booking as customer
   - Check server console for email sent log
   - Email should be sent to customer email

2. **Cancellation Email:**
   - Cancel a booking as customer
   - Check console for cancellation email log

3. **Completion Email:**
   - As business owner, mark booking as "Completed"
   - Check console for completion email log

### Test Data Persistence

1. **MongoDB Compass:**
   - Open MongoDB Compass
   - Connect to your database
   - Verify collections:
     - `users` - User accounts
     - `businesses` - Business registrations
     - `services` - Services with time slots
     - `staff` - Staff members
     - `bookings` - All bookings

2. **Refresh Test:**
   - Create data as business owner
   - Refresh page
   - Verify data persists
   - Logout and login again
   - Verify data still loads

### Test Error Handling

1. **Invalid Booking:**
   - Try to book a past date
   - Try to book without selecting time
   - Verify error messages appear

2. **Unauthorized Access:**
   - Try to access `/business/dashboard` without business
   - Try to edit another user's booking
   - Verify proper error handling

3. **Cart Validation:**
   - Add services from different businesses to cart
   - Verify error message appears
   - Clear cart and add from one business only

---

## Part 4: Quick Test Checklist

### Business Owner ✅
- [ ] Sign up and register business
- [ ] View dashboard with stats
- [ ] Add staff members
- [ ] Create services
- [ ] Add time slots to services
- [ ] Edit business profile
- [ ] Add bank details
- [ ] View and manage bookings
- [ ] Complete/cancel bookings

### Customer ✅
- [ ] Sign up account
- [ ] Browse services on home page
- [ ] View service details
- [ ] View business profiles
- [ ] Book a service
- [ ] Review cart
- [ ] Complete booking
- [ ] View booking confirmation
- [ ] View profile and bookings
- [ ] Reschedule booking
- [ ] Cancel booking
- [ ] View finished bookings
- [ ] Update profile details

### System ✅
- [ ] Email notifications work
- [ ] Data persists in database
- [ ] Error handling works
- [ ] Cart validation works
- [ ] Payment calculations correct
- [ ] Time slot booking works
- [ ] Staff assignment works

---

## Troubleshooting

### Common Issues:

1. **"No business found" error:**
   - Make sure you've registered a business first
   - Check `/business/register` page

2. **Time slots not showing:**
   - Verify time slots are added to the service
   - Check date is in the future
   - Check time slot is not already booked

3. **Email not sending:**
   - Check `MAILJET_API_KEY` and `MAILJET_SECRET_KEY` in `.env.local`
   - Check server console for email errors
   - Emails may fail silently in development

4. **Build errors:**
   - Run `npm run build` to check for TypeScript errors
   - Clear `.next` folder: `rm -rf .next`
   - Restart dev server

5. **Database connection:**
   - Verify `MONGODB_URI` in `.env.local`
   - Check MongoDB is running
   - Test connection in MongoDB Compass

---

## Test Data Summary

After seeding (`/api/seed`), you'll have:

- **1 Test User:** `john.doe@example.com` / `password123`
- **4 Businesses:** Hair Haven, Nail Nook, Pawsome Grooming, Zen Massage
- **6 Services:** Various services with time slots
- **3 Staff Members:** Assigned to different businesses

You can use these for quick testing or create your own accounts.

---

## Next Steps

1. Test all flows above
2. Report any bugs or issues
3. Verify all data saves correctly
4. Test on different browsers
5. Test responsive design on mobile

Happy Testing! 🎉

