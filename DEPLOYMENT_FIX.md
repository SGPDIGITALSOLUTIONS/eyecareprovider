# Fix: "View All Frames" Not Working

## The Problem

The link `/frames-store/shop` points to a Next.js app that needs to be deployed separately on Vercel.

## Solution: Deploy frames-store as Separate Vercel Project

### Option 1: Deploy frames-store Separately (Recommended)

1. **Go to Vercel Dashboard**
2. **Click "Add New Project"**
3. **Import Git Repository** → Select your repo
4. **Configure:**
   - **Root Directory:** `frames-store` (important!)
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build` (or leave default)
   - **Output Directory:** `.next` (or leave default)
5. **Add Environment Variables:**
   - `SHOPIFY_STORE_DOMAIN`
   - `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
   - `SHOPIFY_API_VERSION=2025-01`
6. **Deploy**

7. **After deployment, update products.html:**
   - Change `/frames-store/shop` to `https://your-frames-store.vercel.app/shop`
   - Change `/frames-store/cart` to `https://your-frames-store.vercel.app/cart`

### Option 2: Use Vercel Rewrites (Advanced)

Create/update `vercel.json` in root:

```json
{
  "rewrites": [
    {
      "source": "/frames-store/:path*",
      "destination": "https://your-frames-store.vercel.app/:path*"
    }
  ]
}
```

But Option 1 is simpler and better.

## Quick Fix Right Now

Update `products.html` links to point to the deployed Next.js app URL:

```html
<a href="https://your-frames-store.vercel.app/shop" class="btn-primary">View All Frames</a>
<a href="https://your-frames-store.vercel.app/cart" class="btn-secondary">View Cart</a>
```



