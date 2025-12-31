# Shopify Token Security Explained

## Storefront API Token (What You're Using) ✅ SAFE for Client-Side

**Storefront API tokens are DESIGNED to be used in client-side code.**

### Why It's Safe:
1. **Limited Scopes**: Only has permissions you explicitly grant:
   - `unauthenticated_read_product_listings` (read products)
   - `unauthenticated_write_checkouts` (create carts)
   - No admin access
   - No customer data access
   - No order management

2. **Public by Design**: Shopify Storefront API is meant for:
   - Headless storefronts
   - Mobile apps
   - Client-side JavaScript
   - Public-facing applications

3. **What It CAN'T Do**:
   - ❌ Access admin functions
   - ❌ View customer data
   - ❌ Manage orders
   - ❌ Change product prices
   - ❌ Access payment information

### What It CAN Do:
- ✅ Read products (public info anyway)
- ✅ Create shopping carts
- ✅ Read inventory (public info)

## Admin API Token (Different Thing) ⚠️ NEVER Client-Side

**Admin API tokens MUST stay server-side only.**

These have full admin access and should NEVER be exposed in client code.

## Your Current Setup

### On Vercel (Production):
- ✅ Credentials stored in environment variables (secure)
- ✅ Serverless function returns them (secure)
- ✅ Token still ends up in browser (but that's OK for Storefront API)

### On Localhost (Development):
- ⚠️ Token visible in HTML source (but OK for Storefront API)
- ✅ Only for local testing
- ✅ Not committed to Git

## Best Practice

**For Storefront API:**
- ✅ Safe to use client-side
- ✅ This is how Shopify intended it
- ✅ All major headless stores do this

**If Still Concerned:**
- Use server-side proxy (more complex)
- But Storefront API tokens are designed for client-side use

## Summary

**Storefront API token in client-side code = SAFE ✅**

This is the standard way to use Shopify Storefront API. The token has limited permissions and is designed for public use.

