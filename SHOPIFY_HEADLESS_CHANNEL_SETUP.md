# Shopify Headless Channel Setup Guide

## Using the Headless Sales Channel

The Headless sales channel in Shopify is specifically designed for headless storefronts and makes getting Storefront API credentials easier.

---

## Step 1: Enable Headless Channel

1. **Go to Shopify Admin**
   - Navigate to: `https://your-store.myshopify.com/admin`

2. **Go to Settings → Apps and sales channels**

3. **Find "Headless" in the sales channels list**
   - It might be under "Available channels" or "Installed channels"

4. **Click "Add channel" or "Install"** on Headless

---

## Step 2: Get Storefront API Credentials

Once Headless channel is installed:

1. **Click on "Headless" channel** (in your sales channels)

2. **You'll see Storefront API credentials:**
   - **Storefront API endpoint** (your store domain)
   - **Storefront API access token** ← **THIS IS WHAT YOU NEED**

3. **Copy the Storefront API access token**
   - It should be visible or click "Reveal" to show it
   - Format: Usually a long string (not starting with `shpat_`)

4. **Note your store domain**
   - Format: `your-store.myshopify.com`

---

## Step 3: Configure API Scopes

The Headless channel typically comes with default scopes, but you may need to verify:

1. **In Headless channel settings**, look for **"API scopes"** or **"Permissions"**

2. **Ensure these scopes are enabled:**
   - ✅ `unauthenticated_read_product_listings`
   - ✅ `unauthenticated_write_checkouts`
   - ✅ `unauthenticated_read_product_inventory`

3. **Save** if you made changes

---

## Step 4: Add Credentials to Your Website

Edit `products.html` (around line 230):

```javascript
window.SHOPIFY_STORE_DOMAIN = 'your-store.myshopify.com';
window.SHOPIFY_STOREFRONT_TOKEN = 'your-headless-channel-token-here';
```

---

## Step 5: Test

1. **Open `products.html`** in browser
2. **Check browser console** (F12) for any errors
3. **Products should load** automatically

---

## Benefits of Headless Channel

✅ **Simpler setup** - No need to create custom apps
✅ **Pre-configured** - Scopes already set up
✅ **Easy access** - Credentials in one place
✅ **Designed for headless** - Perfect for your use case

---

## Troubleshooting

**Can't find Headless channel?**
- Go to: Settings → Apps and sales channels
- Look under "Available channels"
- If not there, you may need to enable it in your Shopify plan

**Token not working?**
- Verify token is copied correctly (no extra spaces)
- Check API scopes are enabled
- Ensure products are published

**Products not loading?**
- Check browser console for errors
- Verify store domain is correct
- Test API connection with GraphQL query

---

## Quick Checklist

- [ ] Headless channel installed
- [ ] Storefront API access token copied
- [ ] Store domain noted
- [ ] API scopes verified
- [ ] Credentials added to `products.html`
- [ ] Tested product loading

---

## Next Steps

After getting credentials:
1. Add them to `products.html`
2. Set up your products with Colour variants
3. Test the integration
4. Deploy!

See `SHOPIFY_SETUP_GUIDE.md` for product configuration details.

