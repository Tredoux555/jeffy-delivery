-- Update the test driver password hash to the correct one for "driver123"
-- Run this in Supabase SQL Editor
-- This hash has been verified to work with password "driver123"

UPDATE drivers 
SET password_hash = '$2b$10$GmPb4gpKgFlh/8v9mPEZE..wNHEUjXjXwguZUopzGHGH5sGu1CK9O'
WHERE email = 'driver@jeffy.com';

-- Verify the update
SELECT id, name, email, status FROM drivers WHERE email = 'driver@jeffy.com';

