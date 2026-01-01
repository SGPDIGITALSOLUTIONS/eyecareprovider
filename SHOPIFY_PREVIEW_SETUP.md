# Shopify Product Preview Setup Guide

## Overview

The hybrid approach displays a preview grid of products directly on `products.html`, with a "View All" link to the full Next.js store. Products are fetched from Shopify Storefront API and displayed inline.

## How It Works

1. **Product Preview Grid**: Shows 6 featured products directly on `products.html`
2. **Full Store Link**: "View All Frames" button links to `/frames-store/shop` for complete browsing
3. **Direct Product Links**: Each preview card links to `/frames-store/product/[handle]` for customization

## Setup Instructions

### Option 1: Direct Configuration (Quick Setup)

Edit `products.html` and uncomment/modify the Shopify credentials section:

```html
<script>
    // Set Shopify credentials directly
    window.SHOPIFY_STORE_DOMAIN = 'your-store.myshopify.com';
    window.SHOPIFY_STOREFRONT_TOKEN = 'your-storefront-access-token';
</script>
```

**⚠️ Security Note**: This exposes credentials in client-side code. Use Option 2 for production.

### Option 2: Server-Side Configuration (Recommended)

#### For Express.js Server

1. Add environment variables to your `.env`:
```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-access-token
```

2. Create API endpoint in `api/shopify-config.js`:
```javascript
const express = require('express');
const router = express.Router();

router.get('/api/shopify-config', (req, res) => {
  res.json({
    domain: process.env.SHOPIFY_STORE_DOMAIN,
    token: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
  });
});

module.exports = router;
```

3. Update `products.html` script section:
```html
<script>
    // Fetch credentials from server
    fetch('/api/shopify-config')
      .then(res => res.json())
      .then(config => {
        window.SHOPIFY_STORE_DOMAIN = config.domain;
        window.SHOPIFY_STOREFRONT_TOKEN = config.token;
      });
</script>
```

#### For Vercel/Netlify Serverless

1. Create `api/shopify-config.js`:
```javascript
export default function handler(req, res) {
  res.json({
    domain: process.env.SHOPIFY_STORE_DOMAIN,
    token: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
  });
}
```

2. Add environment variables in Vercel/Netlify dashboard

3. Update `products.html` to fetch from `/api/shopify-config`

#### For Static Site (Build-Time Injection)

If using a static site generator, inject credentials at build time:

```javascript
// In your build script
const config = {
  domain: process.env.SHOPIFY_STORE_DOMAIN,
  token: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
};

// Inject into HTML template
const html = template.replace(
  'window.SHOPIFY_STORE_DOMAIN = \'\';',
  `window.SHOPIFY_STORE_DOMAIN = '${config.domain}';`
);
```

## Testing

1. Open `products.html` in your browser
2. Check browser console for any errors
3. Products should load automatically
4. Click a product card to go to product detail page
5. Click "View All Frames" to see full store

## Troubleshooting

**No products showing?**
- Check browser console for errors
- Verify Shopify credentials are set correctly
- Ensure Storefront API token has read permissions
- Check Network tab for API requests

**CORS errors?**
- Shopify Storefront API should allow CORS from your domain
- If issues persist, use server-side proxy

**Products not loading?**
- Verify products exist in Shopify Admin
- Check GraphQL query syntax
- Ensure API version matches (`2025-01`)

## Customization

### Change Number of Products

Edit `js/shopify-products.js`:
```javascript
initProductPreview('products-preview', 8); // Show 8 products instead of 6
```

### Change Grid Layout

Edit CSS in `css/styles.css`:
```css
.products-preview-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); /* Larger cards */
}
```

### Add Filtering

Extend `js/shopify-products.js` to add tag filtering:
```javascript
async function fetchProducts(limit = 6, tag = null) {
    const query = tag ? `tag:${tag}` : undefined;
    // ... rest of function
}
```

## Files Modified

- `products.html` - Added product preview section
- `js/shopify-products.js` - Product fetching and rendering logic
- `css/styles.css` - Product preview grid styles
- `api/shopify-config.js` - Server-side config template (optional)

## Next Steps

1. Configure Shopify credentials (choose Option 1 or 2 above)
2. Test product loading
3. Customize number of products and styling as needed
4. Deploy and verify in production




