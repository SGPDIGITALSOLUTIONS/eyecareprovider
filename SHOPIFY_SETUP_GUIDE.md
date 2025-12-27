# Shopify Setup Guide - Complete Instructions

## Step-by-Step Shopify Configuration

Follow these steps to configure your Shopify store for the headless integration.

---

## Step 1: Enable Storefront API Access

### ⚠️ IMPORTANT: Use Dev Dashboard (NOT Legacy Custom Apps)

**DO NOT** click "Build legacy custom apps" - that method is deprecated. Use the modern Dev Dashboard instead.

### 1.1 Access Dev Dashboard

1. **Log into Shopify Admin**
   - Go to: `https://your-store.myshopify.com/admin`

2. **Navigate to Dev Dashboard**
   - Click **Settings** (bottom left)
   - Click **Apps and sales channels**
   - Look for **"Dev Dashboard"** or **"Develop apps"** button
   - **OR** go directly to: `https://partners.shopify.com/[your-partner-id]/stores/[store-id]/apps`
   - **OR** use the Shopify Partners dashboard if you have one

### 1.2 Alternative: Use Shopify Partners (Recommended)

**If you see "Build legacy custom apps" page:**

1. **Go to Shopify Partners** (if you have an account)
   - Visit: `https://partners.shopify.com`
   - Create a partner account if needed (free)

2. **Create App in Partners Dashboard**
   - Click **Apps** → **Create app**
   - Choose **"Custom app"** or **"Public app"**
   - Name it: `Storefront API` or `Headless Store`

### 1.3 Configure Storefront API Scopes

1. **In your app settings**, find **"API credentials"** or **"Storefront API"** section

2. **Click "Configure Storefront API scopes"**

3. **Select Required Permissions:**
   - ✅ `unauthenticated_read_product_listings` (read products)
   - ✅ `unauthenticated_read_product_inventory` (read inventory)
   - ✅ `unauthenticated_read_checkouts` (read checkouts)
   - ✅ `unauthenticated_write_checkouts` (create/update checkouts)

4. **Click "Save"**

### 1.4 Get Storefront Access Token

1. **In your app**, find **"Storefront API access token"** section

2. **Click "Reveal token"** or **"Show token"**

3. **COPY THIS TOKEN** - You'll need it for your website
   - Format: `shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx` or `xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

4. **Note Your Store Domain**
   - Format: `your-store.myshopify.com`
   - Found in your Shopify Admin URL

### 1.5 If You Only See Legacy Custom Apps Option

If you're stuck on the legacy custom apps page:

1. **Click "Allow legacy custom app development"** (temporary workaround)
2. **Then follow Step 1.1 above** to use Dev Dashboard
3. **OR** use Shopify Partners dashboard (recommended for long-term)

---

## Step 2: Configure Products

### 2.1 Set Up Product Variants (Colour Options)

For each frame product:

1. **Go to Products** → Select a product

2. **Scroll to Variants section**

3. **Set Option 1 Name:**
   - Option name: **`Colour`** (exactly this, case-sensitive)
   - This is critical - the code looks for "Colour" as Option1

4. **Add Colour Variants:**
   - Click **"Add variant"**
   - Set Option1 values: `Black`, `Brown`, `Tortoise`, `Blue`, etc.
   - Each colour = one variant

5. **Set Variant Prices:**
   - Each variant can have different prices if needed
   - Or keep same price for all colours

### 2.2 Add Images to Variants

**Important**: Add images to variants (not just products) for colour-specific display:

1. **In Variants section**, click on a variant
2. **Click "Add image"** or drag image to variant
3. **Upload colour-specific images** for each variant
4. **Repeat for all colour variants**

**Why?** When users select a colour, the variant image will display automatically.

### 2.3 Add Product Tags (for Filtering)

Add tags to products for filtering:

1. **In product edit page**, scroll to **"Search engine listing"** or **"Tags"** section
2. **Add tags:**
   - `men` - for men's frames
   - `women` - for women's frames  
   - `unisex` - for unisex frames
   - You can add multiple tags: `men`, `designer`, `premium`

3. **Save product**

### 2.4 Set Featured Images

1. **Upload product images** in the Images section
2. **Set featured image** (first image) - this shows in product listings
3. **Add multiple images** - these show in product detail gallery

---

## Step 3: Test Your Setup

### 3.1 Verify Products Are Visible

1. **Go to Products** → Check products are published and available
2. **Check variants** - ensure they have "Colour" as Option1
3. **Check images** - ensure variants have images

### 3.2 Test Storefront API Access

You can test the API connection using this GraphQL query:

**In browser console or Postman:**

```bash
POST https://your-store.myshopify.com/api/2025-01/graphql.json
Headers:
  Content-Type: application/json
  X-Shopify-Storefront-Access-Token: your-token-here

Body:
{
  "query": "{ products(first: 5) { edges { node { id title handle } } } }"
}
```

**Expected Response:**
```json
{
  "data": {
    "products": {
      "edges": [...]
    }
  }
}
```

---

## Step 4: Configure Your Website

### 4.1 Add Credentials to Website

**Option A: Quick Test (Client-Side)**

Edit `products.html` around line 230:

```javascript
window.SHOPIFY_STORE_DOMAIN = 'your-store.myshopify.com';
window.SHOPIFY_STOREFRONT_TOKEN = 'shpat_xxxxxxxxxxxxx';
```

**Option B: Production (Server-Side)**

Set environment variables:
```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
```

### 4.2 Test Product Loading

1. **Open `products.html`** in browser
2. **Check browser console** (F12) for errors
3. **Products should appear** in the preview grid
4. **Click a product** - should go to product detail page

---

## Step 5: Product Checklist

For each product, ensure:

- [ ] Product is **published** (not draft)
- [ ] Product is **available for sale**
- [ ] Variants have **Option1 Name = "Colour"**
- [ ] Variants have **images** (colour-specific)
- [ ] Product has **featured image**
- [ ] Product has **tags** (`men`, `women`, or `unisex`)
- [ ] Variants are **available** (inventory > 0 or track inventory disabled)

---

## Step 6: Common Issues & Solutions

### Issue: "No products found"

**Solutions:**
- Check products are published (not draft)
- Verify Storefront API token is correct
- Check API version matches (`2025-01`)
- Verify products exist in Shopify Admin

### Issue: "Colour selection not working"

**Solutions:**
- Ensure Option1 Name is exactly **"Colour"** (case-sensitive)
- Check variants have images
- Verify variants are available for sale

### Issue: "CORS errors"

**Solutions:**
- Shopify Storefront API allows CORS by default
- If issues persist, use server-side proxy
- Check browser console for specific error

### Issue: "Images not showing"

**Solutions:**
- Verify variant images are uploaded
- Check image URLs are accessible
- Ensure featured images are set

---

## Step 7: Security Best Practices

### ✅ DO:
- Store credentials in environment variables (production)
- Use server-side API endpoint for credentials
- Rotate tokens periodically
- Limit Storefront API scopes to minimum needed

### ❌ DON'T:
- Commit credentials to Git
- Expose tokens in client-side code (production)
- Share tokens publicly
- Use Admin API token instead of Storefront token

---

## Step 8: Next Steps After Setup

1. **Test locally** - Verify products load
2. **Add more products** - Import via CSV or add manually
3. **Configure checkout** - Set up payment methods in Shopify
4. **Test purchase flow** - Add to cart → Checkout
5. **Monitor orders** - Check Shopify Admin for orders

---

## Quick Reference

### Storefront API Endpoint:
```
https://your-store.myshopify.com/api/2025-01/graphql.json
```

### Required Headers:
```
Content-Type: application/json
X-Shopify-Storefront-Access-Token: your-token
```

### Where to Find:
- **Store Domain**: Shopify Admin URL
- **Access Token**: Apps → Your App → Storefront API → Reveal token
- **API Version**: Use `2025-01` (or latest stable)

---

## Support

If you encounter issues:
1. Check Shopify Admin → Apps → Your App → API credentials
2. Verify products are published and available
3. Test API connection using GraphQL query above
4. Check browser console for specific errors

---

## Summary Checklist

- [ ] Created Storefront API app
- [ ] Configured Storefront API scopes
- [ ] Installed app and copied access token
- [ ] Set products with Colour variants (Option1 = "Colour")
- [ ] Added images to variants
- [ ] Added tags to products (men/women/unisex)
- [ ] Set featured images
- [ ] Added credentials to website
- [ ] Tested product loading
- [ ] Verified checkout works

Once complete, your headless Shopify store will be fully functional! 🎉

