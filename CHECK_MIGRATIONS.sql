-- Check Migration Status
-- Run this in Supabase SQL Editor to verify all migrations have been run

-- 1. Check if drivers table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers')
    THEN '✓ drivers table exists'
    ELSE '✗ drivers table NOT found - Run migration-delivery-app.sql'
  END AS drivers_table_status;

-- 2. Check if delivery_assignments table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'delivery_assignments')
    THEN '✓ delivery_assignments table exists'
    ELSE '✗ delivery_assignments table NOT found - Run migration-delivery-app.sql'
  END AS delivery_assignments_table_status;

-- 3. Check if delivery_status_updates table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'delivery_status_updates')
    THEN '✓ delivery_status_updates table exists'
    ELSE '✗ delivery_status_updates table NOT found - Run migration-delivery-app.sql'
  END AS delivery_status_updates_table_status;

-- 4. Check if driver_location_history table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_location_history')
    THEN '✓ driver_location_history table exists'
    ELSE '✗ driver_location_history table NOT found - Run migration-delivery-app.sql'
  END AS driver_location_history_table_status;

-- 5. Check if ready_for_delivery column exists in orders table
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'ready_for_delivery'
    )
    THEN '✓ ready_for_delivery column exists in orders'
    ELSE '✗ ready_for_delivery column NOT found - Run migration-delivery-app.sql'
  END AS ready_for_delivery_status;

-- 6. Check if payment_status column exists in orders table
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'payment_status'
    )
    THEN '✓ payment_status column exists in orders'
    ELSE '✗ payment_status column NOT found - Run migration-add-payment-status.sql'
  END AS payment_status_column_status;

-- 7. Check if test driver exists and has correct password hash
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM drivers 
      WHERE email = 'driver@jeffy.com' 
      AND password_hash = '$2b$10$GmPb4gpKgFlh/8v9mPEZE..wNHEUjXjXwguZUopzGHGH5sGu1CK9O'
    )
    THEN '✓ Test driver exists with correct password hash'
    WHEN EXISTS (
      SELECT 1 FROM drivers 
      WHERE email = 'driver@jeffy.com'
    )
    THEN '⚠ Test driver exists but password hash may be incorrect - Run UPDATE_PASSWORD_HASH.sql'
    ELSE '✗ Test driver NOT found - Run migration-delivery-app.sql'
  END AS test_driver_status;

-- 8. Summary - Show all tables that should exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('drivers', 'delivery_assignments', 'delivery_status_updates', 'driver_location_history', 'orders')
    THEN 'Expected'
    ELSE 'Unexpected'
  END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('drivers', 'delivery_assignments', 'delivery_status_updates', 'driver_location_history', 'orders')
ORDER BY table_name;

