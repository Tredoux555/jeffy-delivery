# Next Features to Build - Priority Order

## Feature Set 1: Real-Time Location Tracking (HIGH PRIORITY)

### What It Does:
- Driver location updates every 30 seconds when app is active
- Admin can see all drivers on a map in real-time
- Location stored in `drivers.current_location` (JSONB: {lat, lng})
- Location history tracked in `driver_location_history` table

### Implementation Steps:
1. Add location permission request to driver app
2. Create location tracking service (updates every 30 seconds)
3. Save location to database
4. Create admin driver map page in main app
5. Display drivers on map with color-coded markers

---

## Feature Set 2: Accurate ETA Calculation (HIGH PRIORITY)

### What It Does:
- Calculate accurate arrival times using Google Maps Distance Matrix API
- Account for traffic conditions
- Show ETA on customer tracking page
- Update ETA in real-time as driver moves

### Implementation Steps:
1. Create ETA calculation API route
2. Use Google Maps Distance Matrix API
3. Calculate from driver location to delivery address
4. Display ETA on customer tracking page
5. Update ETA every 30-60 seconds

---

## Feature Set 3: Customer Tracking Page (MEDIUM PRIORITY)

### What It Does:
- Customers can track their order in real-time
- See driver's current location on map
- See estimated arrival time
- Receive status updates

### Implementation Steps:
1. Create `/track/[orderId]` page in main app
2. Display driver location on map
3. Show order status timeline
4. Display ETA prominently
5. Make it shareable via link

---

## Feature Set 4: Real-Time Updates (MEDIUM PRIORITY)

### What It Does:
- Dashboard auto-refreshes when new deliveries available
- No need to manually refresh
- Real-time updates using Supabase Realtime

### Implementation Steps:
1. Add Supabase Realtime subscriptions
2. Listen for order changes
3. Auto-refresh dashboard
4. Real-time delivery status updates

---

**Recommended Build Order:**
1. Real-Time Location Tracking (most requested feature)
2. ETA Calculation (needed for customer experience)
3. Customer Tracking Page (completes the flow)
4. Real-Time Updates (enhances UX)

---

**Ready to start with Real-Time Location Tracking?**

