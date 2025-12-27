# Shopify Quick Start - 5 Minute Setup

## 🚀 Fast Track Setup

### 1. Get Your Storefront API Token (2 minutes)

**⚠️ IMPORTANT: Use Dev Dashboard, NOT "Build legacy custom apps"**

**Option A: Via Headless Sales Channel (Easiest - What You're Using Now)**
1. Go to: **Shopify Admin** → **Settings** → **Apps and sales channels**
2. Find **"Headless"** in sales channels → Click **"Add channel"** or **"Install"**
3. Click on **"Headless"** channel
4. Find **"Storefront API access token"** section
5. Click **"Reveal"** or **"Show"** to see the token
6. **Copy the Storefront access token**
7. Verify API scopes are enabled (should be pre-configured)
8. **Note your store domain**: `your-store.myshopify.com`

**Option B: Via Shopify Dev Dashboard**
1. Go to Dev Dashboard (`dev.shopify.com`)
2. **Click "Home"** in the left sidebar
3. Find **"Storefront API access token"** section
4. Click **"Reveal"** to see the token
5. **Copy the Storefront access token**
6. Configure scopes if needed

**Option C: Via Shopify Partners**
1. Go to: `https://partners.shopify.com` (create free account if needed)
2. Click **Apps** → **Create app** → **Custom app**
3. Name it: `Storefront API`
4. **Click on your app name** to open it
5. Click **"API credentials"** tab
6. Scroll to **"Storefront API access scopes"** section
7. Click **"Configure Storefront API scopes"** button
8. Select: `unauthenticated_read_product_listings` and `unauthenticated_write_checkouts`
9. Click **Save**
10. **Copy the Storefront access token**

**Option B: Via Admin (If Dev Dashboard Available)**
1. Go to: **Shopify Admin** → **Settings** → **Apps and sales channels**
2. Click **Develop apps** → **Create an app**
3. Name it: `Storefront API`
4. Click **Configure Storefront API scopes**
5. Select: `unauthenticated_read_product_listings` and `unauthenticated_write_checkouts`
6. Click **Save** → **Install app**
7. **Copy the Storefront access token** (starts with `shpat_`)

**If you only see "Build legacy custom apps":**
- Click **"Allow legacy custom app development"** (temporary)
- Then use Shopify Partners dashboard (Option A) for better long-term solution

### 2. Set Up One Product (2 minutes)

1. Go to **Products** → **Add product**
2. Add product name, description, images
3. In **Variants** section:
   - Set **Option1 name** = `Colour`
   - Add variants: `Black`, `Brown`, `Tortoise`
   - Upload image for each variant
4. Add **Tags**: `men` or `women` or `unisex`
5. **Save**

### 3. Add Credentials to Website (1 minute)

Edit `products.html` (around line 230):

```javascript
window.SHOPIFY_STORE_DOMAIN = 'your-store.myshopify.com';
window.SHOPIFY_STOREFRONT_TOKEN = 'shpat_your-token-here';
```

### 4. Test It!

1. Open `products.html` in browser
2. Products should appear automatically
3. Click a product to customize

---

## 📋 What You Need

- ✅ Shopify store (any plan)
- ✅ Products with Colour variants
- ✅ Storefront API access token
- ✅ Website credentials configured

---

## 🎯 Critical Requirements

**For products to work correctly:**

1. **Option1 Name MUST be "Colour"** (exactly, case-sensitive)
2. **Variants need images** (for colour switching)
3. **Products need tags** (`men`, `women`, `unisex` for filtering)
4. **Products must be published** (not draft)

---

## ⚡ That's It!

Your store is ready. See `SHOPIFY_SETUP_GUIDE.md` for detailed instructions.

