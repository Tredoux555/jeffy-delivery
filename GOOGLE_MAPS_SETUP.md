# Google Maps API Setup Guide

## Overview

The delivery app uses Google Maps to display delivery routes and navigation. This guide explains how to set up the Google Maps API key for local development and production deployment.

## Requirements

- Google Cloud Platform account
- Google Maps JavaScript API enabled
- Google Maps Directions API enabled
- API key with proper restrictions (recommended)

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Give it a name (e.g., "Jeffy Delivery App")
4. Click "Create"

---

## Step 2: Enable Required APIs

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for and enable:
   - **Maps JavaScript API** (required for displaying maps)
   - **Directions API** (required for route calculation)

### To Enable Each API:
1. Click on the API name
2. Click **"Enable"** button
3. Wait for confirmation

---

## Step 3: Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"API Key"**
3. Copy the API key (starts with `AIza...`)

### Recommended: Restrict API Key

1. Click on the created API key to edit it
2. Under **"API restrictions"**, select **"Restrict key"**
3. Choose only:
   - Maps JavaScript API
   - Directions API
4. Under **"Application restrictions"** (optional but recommended):
   - Select **"HTTP referrers (web sites)"**
   - Add your domains:
     - `http://localhost:*` (for local development)
     - `https://jeffy-delivery.vercel.app/*` (for production)
     - `https://*.vercel.app/*` (for preview deployments)

5. Click **"Save"**

---

## Step 4: Local Development Setup

### Add to `.env.local` File

1. Create or edit `.env.local` in the project root:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

2. Replace `your_api_key_here` with your actual API key

3. Restart your development server:
   ```bash
   npm run dev
   ```

**Note**: Never commit `.env.local` to git (it's already in `.gitignore`)

---

## Step 5: Vercel Deployment Setup

### Add Environment Variable in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `jeffy-delivery` project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Add:
   - **Name**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value**: Your Google Maps API key
   - **Environments**: 
     - ✅ Production
     - ✅ Preview
     - ✅ Development
6. Click **"Save"**
7. **Redeploy** your application for changes to take effect

---

## Step 6: Verify Setup

### Test Local Development

1. Start development server: `npm run dev`
2. Login to the delivery app
3. Scan a QR code or open a delivery assignment
4. Check delivery details page:
   - **With API key**: Map should load with route
   - **Without API key**: Should show fallback with "Open in Google Maps" button

### Test Production

1. Deploy to Vercel with API key configured
2. Open delivery app URL
3. Navigate to a delivery assignment
4. Verify map loads correctly

---

## Troubleshooting

### Error: "Google Maps API key not configured"

**Cause**: API key not set in environment variables

**Solution**:
- Check `.env.local` file exists and has correct key
- Verify key name is `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Restart development server
- For Vercel, check environment variables in dashboard

### Error: "Failed to load Google Maps. Please check your API key configuration."

**Cause**: Invalid API key or API not enabled

**Solution**:
- Verify API key is correct (no typos, no extra spaces)
- Check Maps JavaScript API is enabled in Google Cloud Console
- Check Directions API is enabled
- Verify API key restrictions allow your domain

### Error: "This API project is not authorized to use this API"

**Cause**: API not enabled for the project

**Solution**:
1. Go to Google Cloud Console → APIs & Services → Library
2. Search for "Maps JavaScript API"
3. Click "Enable" if not already enabled
4. Repeat for "Directions API"

### Map Shows But No Route

**Cause**: Directions API not enabled or route calculation failed

**Solution**:
- Enable Directions API in Google Cloud Console
- Check browser console for specific error messages
- Verify addresses are valid
- Fallback button "Open in Google Maps" should still work

### Error: "injectScript error"

**Cause**: Network issue or invalid API key

**Solution**:
- Check internet connection
- Verify API key is valid
- Check API key restrictions (may be blocking requests)
- Try fallback "Open in Google Maps" button

---

## Fallback Behavior

If the Google Maps API key is missing or invalid, the app will:

1. **Show fallback UI** with message: "Google Maps Not Configured"
2. **Display delivery address** for reference
3. **Provide "Open in Google Maps" button** that opens external Google Maps with directions
4. **Not crash** - app continues to work normally

This ensures drivers can still navigate even if the API key isn't configured.

---

## Cost Considerations

### Google Maps Pricing

- **Free Tier**: $200/month credit (covers most small apps)
- **Usage**: Pay-as-you-go after free credit
- **Maps JavaScript API**: Free until July 2024, then usage-based
- **Directions API**: Usage-based pricing

### Monitoring Usage

1. Go to Google Cloud Console → APIs & Services → Dashboard
2. Monitor API usage and costs
3. Set up billing alerts if needed

### Reducing Costs

- Cache route calculations when possible
- Use static maps for simple display (not implemented currently)
- Monitor usage and optimize

---

## Security Best Practices

### ✅ Do:

- Restrict API key to specific APIs (Maps JavaScript, Directions)
- Add HTTP referrer restrictions (domain-based)
- Use different keys for development and production
- Monitor API usage regularly
- Set up billing alerts

### ❌ Don't:

- Don't commit API keys to git
- Don't share API keys publicly
- Don't use unrestricted keys in production
- Don't expose keys in client-side code (already handled with `NEXT_PUBLIC_` prefix)

---

## Summary

1. ✅ Create Google Cloud project
2. ✅ Enable Maps JavaScript API and Directions API
3. ✅ Create API key
4. ✅ Add to `.env.local` for local development
5. ✅ Add to Vercel environment variables for production
6. ✅ Verify map loads correctly

**Note**: The app works without the API key (shows fallback), but for full functionality with embedded maps and routes, the API key is required.

---

## Quick Reference

### Environment Variable Name
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

### Required APIs
- Maps JavaScript API
- Directions API

### File Locations
- Local: `.env.local` (project root)
- Production: Vercel Dashboard → Environment Variables

### Test
- Local: `http://localhost:3001` (or your dev port)
- Production: `https://jeffy-delivery.vercel.app` (or your domain)

