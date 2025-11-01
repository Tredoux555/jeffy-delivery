# Vercel Deployment Guide

## Status: Ready for Deployment

The delivery app has been initialized and committed to git. Follow these steps to deploy to Vercel.

---

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `jeffy-delivery` (or any name you prefer)
3. Description: "Delivery driver app for Jeffy commerce platform"
4. Choose Public or Private (your preference)
5. **IMPORTANT**: Do NOT initialize with:
   - README
   - .gitignore
   - License
   (The project already has these files)
6. Click "Create repository"

---

## Step 2: Push to GitHub

After creating the repository, run these commands in Terminal:

```bash
cd /Users/tredouxwillemse/Desktop/jeffy-delivery

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/jeffy-delivery.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Vercel

1. **Go to Vercel**
   - Visit https://vercel.com
   - Sign in (or create account if needed)

2. **Create New Project**
   - Click "Add New Project"
   - Import your GitHub repository: `jeffy-delivery`
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Next.js (should auto-detect)
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build` (should be auto-filled)
   - Output Directory: `.next` (should be auto-filled)
   - Click "Import"

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Add each variable from your `.env.local` file:
   
     ```
     NEXT_PUBLIC_SUPABASE_URL
     ```
     - Value: (copy from your .env.local file)
     
     ```
     NEXT_PUBLIC_SUPABASE_ANON_KEY
     ```
     - Value: (copy from your .env.local file)
     
     ```
     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
     ```
     - Value: (copy from your .env.local file, if you have one)
   
   - For each variable:
     - Select environments: Production, Preview, Development
     - Click "Add"

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete

---

## Step 4: Get Your URL

After deployment completes, you'll see:
- **Production URL**: `https://jeffy-delivery.vercel.app` (or similar)
- This URL will work on any device (mobile, tablet, desktop)

---

## Step 5: Test Deployment

1. Open the deployment URL in a browser
2. Test the login page loads correctly
3. Login with test credentials:
   - Email: `driver@jeffy.com`
   - Password: `driver123`
4. Verify dashboard loads
5. Test on mobile device using the same URL

---

## Troubleshooting

### Build Fails
- Check environment variables are all added correctly
- Verify Supabase URL and keys are correct
- Check build logs in Vercel dashboard

### Login Doesn't Work
- Ensure database migration has been run in Supabase
- Verify driver test account exists (see DATABASE_SETUP.md)
- Check environment variables are set correctly

### App Not Loading
- Clear browser cache
- Check Vercel deployment logs
- Verify all dependencies are in package.json

---

## Environment Variables Checklist

Make sure these are set in Vercel:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (optional)

---

## Next Steps

After deployment:
1. Test the full flow: commerce app → mock payment → delivery app
2. Share the URL with delivery drivers
3. Monitor deployment logs in Vercel dashboard
4. Set up custom domain if needed (optional)

---

## Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain (e.g., `delivery.jeffy.co.za`)
3. Follow DNS configuration instructions
4. Vercel will automatically provision SSL certificate

---

**Your deployment URL will be ready in 2-3 minutes after completing Step 3!**

