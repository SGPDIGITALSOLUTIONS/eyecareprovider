# Complete Setup Guide - Hybrid Store + Products Page

Since you already have products in Shopify, let's get everything working!

---

## Part 1: Set Up Hybrid Preview on products.html

### Step 1: Add Your Shopify Credentials

1. **Open `products.html`** in your editor

2. **Find line ~230** (look for the comment `<!-- Shopify Products Preview -->`)

3. **Uncomment and fill in your credentials:**

```javascript
<script>
    // Set Shopify credentials directly
    window.SHOPIFY_STORE_DOMAIN = 'your-store.myshopify.com';  // ← Replace with your store domain
    window.SHOPIFY_STOREFRONT_TOKEN = 'your-token-from-headless-channel';  // ← Replace with your token
</script>
```

**Example:**
```javascript
window.SHOPIFY_STORE_DOMAIN = 'eyecare-frames.myshopify.com';
window.SHOPIFY_STOREFRONT_TOKEN = 'abc123def456...';
```

4. **Save the file**

### Step 2: Test the Hybrid Preview

1. **Open `products.html`** in your browser
2. **Scroll down** to "Featured Frame Collections" section
3. **Products should appear** automatically (6 products in a grid)
4. **If you see "Loading frames..."** - check browser console (F12) for errors

---

## Part 2: Set Up Next.js Store Pages

### Step 1: Configure Environment Variables

1. **Go to `frames-store` folder**

2. **Create `.env.local` file** (if it doesn't exist)

3. **Add your Shopify credentials:**

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-token-from-headless-channel
SHOPIFY_API_VERSION=2025-01
```

**Example:**
```env
SHOPIFY_STORE_DOMAIN=eyecare-frames.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=abc123def456...
SHOPIFY_API_VERSION=2025-01
```

### Step 2: Install Dependencies

Open terminal in the `frames-store` folder:

```bash
cd frames-store
npm install
```

### Step 3: Start the Development Server

```bash
npm run dev
```

You should see:
```
✓ Ready in 2.3s
○ Local: http://localhost:3000
```

### Step 4: Test the Store Pages

1. **Open browser:** `http://localhost:3000/shop`
2. **You should see:** All your products in a grid
3. **Click a product:** Should go to product detail page
4. **Test features:**
   - Select colour variant
   - Choose lens options
   - Add prescription
   - Add to cart
   - View cart

---

## Part 3: Verify Your Products Are Set Up Correctly

### In Shopify Admin, check each product:

- [ ] **Product is published** (not draft)
- [ ] **Variants have Option1 Name = "Colour"** (exactly, case-sensitive)
- [ ] **Each variant has an image** (for colour switching)
- [ ] **Product has tags:** `men`, `women`, or `unisex` (for filtering)
- [ ] **Product has featured image** (shows in listings)

### Quick Fix for Products:

1. **Go to Products** in Shopify Admin
2. **Click on a product**
3. **In Variants section:**
   - Set **Option1 name** = `Colour`
   - Add variants: `Black`, `Brown`, etc.
   - Upload image for each variant
4. **Add Tags:** `men` or `women` or `unisex`
5. **Save**

---

## Part 4: Test Everything Works

### Test Hybrid Preview (products.html):

1. ✅ Products appear in grid
2. ✅ Click product → Goes to `/frames-store/product/[handle]`
3. ✅ "View All Frames" button → Goes to `/frames-store/shop`

### Test Full Store (Next.js):

1. ✅ `/shop` shows all products
2. ✅ Filter by men/women/unisex works
3. ✅ Product detail page loads
4. ✅ Colour selection works
5. ✅ Add to cart works
6. ✅ Cart page shows items
7. ✅ Checkout redirects to Shopify

---

## Troubleshooting

### Products not showing on products.html?

**Check:**
- Browser console (F12) for errors
- Credentials are set correctly
- Token has read permissions
- Products are published in Shopify

**Fix:**
```javascript
// Make sure credentials are set BEFORE shopify-products.js loads
window.SHOPIFY_STORE_DOMAIN = 'your-store.myshopify.com';
window.SHOPIFY_STOREFRONT_TOKEN = 'your-token';
```

### Products not showing in Next.js store?

**Check:**
- `.env.local` file exists in `frames-store` folder
- Credentials are correct (no extra spaces)
- Server is running (`npm run dev`)
- Check terminal for errors

**Fix:**
```bash
# Stop server (Ctrl+C)
# Check .env.local file
# Restart server
npm run dev
```

### "Failed to add to cart" error?

**Check:**
- Storefront API token has write permissions
- Variants exist and are available
- Browser console for specific errors

---

## Quick Checklist

**Hybrid Preview (products.html):**
- [ ] Credentials added to products.html
- [ ] Products appear in preview grid
- [ ] Links work correctly

**Next.js Store:**
- [ ] `.env.local` created with credentials
- [ ] Dependencies installed (`npm install`)
- [ ] Server running (`npm run dev`)
- [ ] `/shop` page shows products
- [ ] Product detail pages work
- [ ] Cart functionality works

**Shopify Products:**
- [ ] Products published
- [ ] Variants have "Colour" as Option1
- [ ] Variants have images
- [ ] Products have tags (men/women/unisex)

---

## Next Steps

Once everything works locally:

1. **Deploy Next.js app** (Vercel recommended)
2. **Update links** in `products.html` if needed
3. **Test in production**
4. **Add more products** in Shopify

---

## Need Help?

- Check browser console (F12) for errors
- Check terminal for Next.js errors
- Verify Shopify credentials
- See `SHOPIFY_SETUP_GUIDE.md` for product configuration

