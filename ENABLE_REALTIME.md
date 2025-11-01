# Enable Supabase Realtime for Order Updates

## Overview
The delivery app dashboard now uses Supabase Realtime to automatically update when orders are marked as ready for delivery in the commerce app. To enable this functionality, you need to enable Realtime replication for the required tables in Supabase.

## Steps to Enable Realtime

1. **Go to Supabase Dashboard**
   - Navigate to your Supabase project: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Database → Replication**
   - Click on "Database" in the left sidebar
   - Click on "Replication" in the submenu

3. **Enable Realtime for Required Tables**
   Enable replication for these tables:
   - ✅ `orders` (to listen for `ready_for_delivery` changes)
   - ✅ `delivery_assignments` (to track when orders get assigned to drivers)

4. **Verify Realtime is Enabled**
   - After enabling, you should see green checkmarks next to the enabled tables
   - Realtime subscriptions will start working automatically

## What This Enables

- **Automatic Updates**: When an order is marked as `ready_for_delivery` in the commerce app, the delivery app dashboard will automatically refresh and show the new order
- **Real-Time Counts**: The "Orders to Process" card updates instantly when new orders are created or assigned
- **Multi-Driver Sync**: If multiple drivers are viewing the dashboard, they all see updates in real-time

## Testing

After enabling Realtime:
1. Open the delivery app dashboard
2. Place an order in the commerce app (using mock payment)
3. Watch the dashboard automatically update without refreshing

## Troubleshooting

If real-time updates don't work:
- Verify Realtime is enabled in Supabase Dashboard → Database → Replication
- Check browser console for any subscription errors
- Ensure you're using the latest version of the Supabase client library
- Verify your Supabase project has Realtime enabled (some free tier limits may apply)

