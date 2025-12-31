# Localhost Setup - Shopify Products

## Why Products Don't Show on Localhost

The `/api/shopify-config` endpoint is a **Vercel serverless function** - it only works on Vercel, not on localhost.

## Solution: Add Credentials for Local Testing

### Step 1: Get Your Shopify Credentials

From Shopify Headless channel or Dev Dashboard:
- Store Domain: `your-store.myshopify.com`
- Storefront Access Token: `your-token-here`

### Step 2: Add to HTML Files

**In `products.html` (around line 230):**

Uncomment and fill in:
```javascript
window.SHOPIFY_STORE_DOMAIN = 'your-store.myshopify.com';
window.SHOPIFY_STOREFRONT_TOKEN = 'your-token-here';
```

**In `shop.html` (around line 130):**

Same thing - uncomment and fill in:
```javascript
window.SHOPIFY_STORE_DOMAIN = 'your-store.myshopify.com';
window.SHOPIFY_STOREFRONT_TOKEN = 'your-token-here';
```

### Step 3: Test Locally

1. Open `products.html` in browser
2. Products should load
3. Open `shop.html` - all products should show

## Important Notes

⚠️ **Security Warning:**
- These credentials will be visible in your HTML source code
- **DO NOT commit** these credentials to Git
- Only use for local testing
- Production uses server-side credentials (secure)

## Alternative: Use .env File (Advanced)

If you want to avoid hardcoding:

1. Create a simple Node.js server
2. Serve credentials from environment variables
3. Update fetch URL to `http://localhost:3000/api/shopify-config`

But for quick testing, just uncomment the lines in the HTML files.

## Quick Fix

1. Open `products.html`
2. Find line ~232
3. Uncomment the two lines
4. Add your credentials
5. Save and refresh

Same for `shop.html` around line 132.

