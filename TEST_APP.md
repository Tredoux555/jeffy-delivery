# Testing the Delivery App

## App URL
- **Production:** https://jeffy-delivery.vercel.app
- **Alternative:** https://jeffy-delivery-79iolugh8-tredoux555s-projects.vercel.app

## Test Credentials
- **Email:** driver@jeffy.com
- **Password:** driver123

## Testing Checklist

### 1. Deployment Test ✓/✗
- [ ] Open https://jeffy-delivery.vercel.app on mobile/desktop
- [ ] Login page loads correctly
- [ ] Yellow background theme displays
- [ ] Test credentials box is visible

### 2. Login Test ✓/✗
- [ ] Can enter email and password
- [ ] Click "Sign In" button
- [ ] Login succeeds (no 401 error)
- [ ] Redirects to dashboard

### 3. Dashboard Test ✓/✗
- [ ] Dashboard loads after login
- [ ] Shows "Money Earned Today" section
- [ ] Shows delivery stats cards
- [ ] Navigation works

### 4. Mock Payment Integration Test ✓/✗
- [ ] Create order in commerce app with "Test Payment (Mock)"
- [ ] Order completes successfully
- [ ] Check admin panel - order shows as "Paid" and "Ready for Delivery"
- [ ] Check delivery app - order appears in "Available Deliveries"

## Troubleshooting

### Login Fails with 401 Error
- Run `UPDATE_PASSWORD_HASH.sql` in Supabase
- Verify driver exists: Check Supabase Table Editor → `drivers` table

### Dashboard Doesn't Load
- Check browser console for errors
- Verify Supabase environment variables are set in Vercel
- Check database migrations are run

### Orders Don't Appear
- Verify `ready_for_delivery` column exists in `orders` table
- Check mock payment processed successfully
- Verify order was created in Supabase Table Editor

### Tables Don't Exist
- Run `migration-delivery-app.sql` in Supabase SQL Editor
- Verify tables appear in Supabase Table Editor

