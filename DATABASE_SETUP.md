# Database Setup Instructions

## Error: 401 Unauthorized on Login

If you're getting a 401 error when trying to log in, the `drivers` table likely doesn't exist in your Supabase database yet.

## Solution: Run the Migration SQL

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project (same one used by the main jeffy app)

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**
   - Open the file: `/Users/tredouxwillemse/Desktop/jeffy-delivery/migration-delivery-app.sql`
   - Copy ALL the contents of that file
   - Paste it into the SQL Editor in Supabase
   - Click "Run" or press Cmd/Ctrl + Enter

4. **Verify the Table Exists**
   - After running, go to "Table Editor" in Supabase
   - You should see these new tables:
     - `drivers`
     - `delivery_assignments`
     - `delivery_status_updates`

5. **Check the Test Driver**
   - In the `drivers` table, you should see a test driver:
     - Email: `driver@jeffy.com`
     - Password: `driver123`

6. **Set Row Level Security (RLS) Policies**
   - Go to "Authentication" > "Policies" in Supabase
   - Make sure RLS is enabled for the `drivers` table
   - Create policies to allow:
     - Drivers to read their own data
     - API to read/write driver data (for login/registration)

## Quick Check: Does the Table Exist?

Run this query in Supabase SQL Editor:
```sql
SELECT * FROM drivers LIMIT 1;
```

If you get an error "relation 'drivers' does not exist", you need to run the migration SQL file.

## After Running Migration

1. Restart your dev server:
   ```bash
   cd /Users/tredouxwillemse/Desktop/jeffy-delivery
   npm run dev
   ```

2. Try logging in with:
   - Email: `driver@jeffy.com`
   - Password: `driver123`

The login should now work!

