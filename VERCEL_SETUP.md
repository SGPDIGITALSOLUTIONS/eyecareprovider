# Vercel Setup Guide - Proper Environment Variables

## Understanding the Two Parts

### 1. products.html (Static HTML - Needs `window.`)
- This is a **static HTML file** with **client-side JavaScript**
- Runs in the browser, so needs `window.` to access global variables
- **OR** use server-side injection (better for Vercel)

### 2. Next.js App (frames-store) - Uses `.env.local`)
- Uses **server-side environment variables**
- No `window.` needed - uses `process.env` instead
- Already configured correctly ✅

---

## Option 1: Server-Side Injection (Recommended for Vercel)

Since you're on Vercel, you can inject credentials server-side instead of exposing them in client-side code.

### For products.html:

Instead of:
```javascript
window.SHOPIFY_STORE_DOMAIN = 'your-store.myshopify.com';
window.SHOPIFY_STOREFRONT_TOKEN = 'your-token';
```

Use a **Vercel Serverless Function** to inject credentials:

1. **Create `api/shopify-config.js`:**

```javascript
export default function handler(req, res) {
  res.json({
    domain: process.env.SHOPIFY_STORE_DOMAIN,
    token: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
  });
}
```

2. **Update products.html script:**

```javascript
<script>
    // Fetch credentials from server (secure)
    fetch('/api/shopify-config')
      .then(res => res.json())
      .then(config => {
        window.SHOPIFY_STORE_DOMAIN = config.domain;
        window.SHOPIFY_STOREFRONT_TOKEN = config.token;
      });
</script>
```

3. **Add to Vercel Environment Variables:**
   - In Vercel dashboard → Your project → Settings → Environment Variables
   - Add:
     - `SHOPIFY_STORE_DOMAIN` = `your-store.myshopify.com`
     - `SHOPIFY_STOREFRONT_ACCESS_TOKEN` = `your-token`

---

## Option 2: Keep It Simple (Current Setup)

If you want to keep it simple for now:

- **products.html**: Keep `window.` variables (works fine)
- **Next.js app**: Uses `.env.local` (no `window.` needed)

The `window.` is only needed because `products.html` is static HTML with client-side JS. The Next.js app doesn't need it because it uses server-side environment variables.

---

## Why `window.` is Needed for products.html

- `products.html` is **static HTML** (not a React/Next.js component)
- The JavaScript runs **in the browser** (client-side)
- `window.` makes variables globally accessible to `shopify-products.js`
- This is normal for static HTML files

---

## Next.js App (No `window.` Needed)

The `frames-store` Next.js app uses:
- `.env.local` for local development
- `process.env.SHOPIFY_STORE_DOMAIN` in code
- Server-side rendering (no `window.` needed)

This is already set up correctly! ✅

---

## Summary

| File | Type | Environment Variables | Needs `window.`? |
|------|------|---------------------|------------------|
| `products.html` | Static HTML | Client-side JS | ✅ Yes (or use server-side injection) |
| `frames-store` | Next.js App | `.env.local` / `process.env` | ❌ No |

---

## Recommended: Use Server-Side Injection

For better security on Vercel:
1. Create `/api/shopify-config.js` serverless function
2. Use Vercel environment variables
3. Fetch credentials in `products.html` script

This keeps credentials server-side and never exposes them in client code!



