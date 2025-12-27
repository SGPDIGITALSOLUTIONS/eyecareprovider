# Quick Setup Guide

## Step 1: Configure Shopify

1. **Get Storefront API Access Token:**
   - Go to Shopify Admin → Settings → Apps and sales channels
   - Click "Develop apps" → Create app
   - Name it "Storefront API"
   - Configure Storefront API scopes (read products, write checkout)
   - Install app
   - Copy the "Storefront access token"

2. **Note Your Store Domain:**
   - Format: `your-store.myshopify.com`
   - Found in Shopify Admin URL

3. **Prepare Products:**
   - Ensure products have variants with Option1 Name = "Colour"
   - Add images to variants (for colour-specific display)
   - Add tags: `men`, `women`, `unisex` for filtering

## Step 2: Set Environment Variables

Create `frames-store/.env.local`:

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
SHOPIFY_API_VERSION=2025-01
```

## Step 3: Install & Run

```bash
cd frames-store
npm install
npm run dev
```

Visit: http://localhost:3000/shop

## Step 4: Test

1. Browse products at `/shop`
2. Click a product → select colour, lens options, add prescription
3. Add to cart
4. View cart at `/cart`
5. Click checkout → redirects to Shopify checkout

## Integration with Main Site

The `products.html` page now links to:
- `/frames-store/shop` - Browse frames
- `/frames-store/cart` - View cart

For production, you'll need to:
1. Deploy the Next.js app (Vercel recommended)
2. Update links in `products.html` to match your deployment URL
   OR
3. Configure reverse proxy/routing to serve `/frames-store/*` from Next.js app

## Troubleshooting

**"No products found"**
- Check `.env.local` has correct credentials
- Verify products exist in Shopify Admin
- Check browser console for errors

**"Failed to add to cart"**
- Verify Storefront API token has write permissions
- Check Network tab for GraphQL errors
- Ensure variant IDs are valid

**Images not showing**
- Verify variant images are set in Shopify
- Check image URLs are accessible
- Ensure CDN is working

