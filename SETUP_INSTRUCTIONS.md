# Delivery App Setup Instructions

## Quick Fix for Supabase Error

The error "Your project's URL and API key are required" means the delivery app needs environment variables.

### Solution:

1. **Copy environment variables from main app:**
   ```bash
   # Copy .env.local from main app to delivery app
   cp /Users/tredouxwillemse/Desktop/jeffyb/.env.local /Users/tredouxwillemse/Desktop/jeffy-delivery/.env.local
   ```

2. **OR manually create `.env.local` in delivery app:**
   
   Create file: `/Users/tredouxwillemse/Desktop/jeffy-delivery/.env.local`
   
   Add these lines (use SAME values as main app):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

3. **Get values from main app:**
   - Open `/Users/tredouxwillemse/Desktop/jeffyb/.env.local`
   - Copy the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` values
   - Paste them into the delivery app's `.env.local` file

4. **Restart the dev server:**
   ```bash
   cd /Users/tredouxwillemse/Desktop/jeffy-delivery
   npm run dev
   ```

**Important:** Both apps use the SAME Supabase database, so use the SAME credentials from the main app.

