# Quick Fix: Deploy frames-store on Vercel

## The Problem
`/frames-store/shop` doesn't work because the Next.js app isn't deployed yet.

## Solution: Deploy frames-store as Separate Project

### Step 1: Deploy frames-store

1. **Go to Vercel Dashboard** → **Add New Project**
2. **Import your GitHub repo** (same repo)
3. **Configure:**
   - **Root Directory:** `frames-store` ← **IMPORTANT!**
   - Framework: Next.js (auto-detected)
4. **Environment Variables** (already set, but verify):
   - `SHOPIFY_STORE_DOMAIN`
   - `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
   - `SHOPIFY_API_VERSION=2025-01`
5. **Deploy**

### Step 2: Get the URL

After deployment, Vercel gives you a URL like:
`https://frames-store-xxxxx.vercel.app`

### Step 3: Update products.html

Change the links to use the full URL:

```html
<a href="https://your-frames-store-url.vercel.app/shop" class="btn-primary">View All Frames</a>
<a href="https://your-frames-store-url.vercel.app/cart" class="btn-secondary">View Cart</a>
```

**OR** use a custom domain if you set one up.

## That's It!

Once deployed, the links will work.



