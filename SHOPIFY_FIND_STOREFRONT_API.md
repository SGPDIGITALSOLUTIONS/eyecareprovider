# Where to Find "Configure Storefront API Scopes"

## Step-by-Step Location Guide

### After Creating Your App in Shopify Partners:

1. **You're in Shopify Partners Dashboard**
   - URL: `https://partners.shopify.com`

2. **Click on your app name** (the app you just created)
   - It will be in the list under "Apps" section

3. **You'll see several tabs/sections:**
   - **Overview**
   - **API credentials** ← **CLICK THIS ONE**
   - **App setup**
   - **Extensions**
   - etc.

4. **Click "API credentials" tab**

5. **Scroll down** - You'll see sections for:
   - **Admin API access scopes** (ignore this)
   - **Storefront API access scopes** ← **THIS IS WHAT YOU NEED**

6. **Click "Configure Storefront API scopes"** button
   - It's usually a button or link next to "Storefront API access scopes"

## Visual Guide

```
Shopify Partners Dashboard
├── Apps
    └── Your App Name (click this)
        ├── Overview
        ├── API credentials ← CLICK HERE
        │   ├── Admin API access scopes
        │   └── Storefront API access scopes ← LOOK HERE
        │       └── [Configure Storefront API scopes] ← CLICK THIS BUTTON
        ├── App setup
        └── Extensions
```

## Alternative Location

Sometimes it's under:
- **Settings** → **API credentials** → **Storefront API**

## What You'll See After Clicking

A page with checkboxes for permissions:
- ☐ `unauthenticated_read_product_listings`
- ☐ `unauthenticated_read_product_inventory`
- ☐ `unauthenticated_read_checkouts`
- ☐ `unauthenticated_write_checkouts`

**Select these checkboxes** and click **Save**.

## If You Can't Find It

1. **Make sure you're in Shopify Partners** (`partners.shopify.com`), not Shopify Admin
2. **Check you've created the app** - it should appear in your Apps list
3. **Look for "API credentials"** or "Credentials" section
4. **Try clicking directly on your app** from the Apps list

## Quick Checklist

- [ ] In Shopify Partners dashboard
- [ ] Clicked on your app name
- [ ] Clicked "API credentials" tab
- [ ] Found "Storefront API access scopes" section
- [ ] Clicked "Configure Storefront API scopes" button

## Still Stuck?

If you can't find it:
1. Take a screenshot of what you see
2. Check if you're in the right dashboard (Partners vs Admin)
3. Make sure the app was created successfully

