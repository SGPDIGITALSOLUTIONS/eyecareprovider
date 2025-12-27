# Headless Shopify Frames Store

A Next.js 14+ application integrating Shopify Storefront API for selling eyewear frames with custom lens options and prescription input.

## Features

- ✅ Product listing with filtering (men/women/unisex)
- ✅ Product detail pages with variant (colour) selection
- ✅ Lens options (type, thickness, coatings) with pricing
- ✅ Prescription form (SPH, CYL, AXIS, PD, ADD, notes)
- ✅ Shopping cart with localStorage persistence
- ✅ Shopify checkout integration
- ✅ Responsive design matching I Care Services branding

## Setup Instructions

### 1. Shopify Configuration

1. In Shopify Admin, ensure products are imported with:
   - Variants set as Colour (Option1 Name: "Colour", Option1 Value: actual colour name)
   - Images attached to variants/products

2. Enable Storefront API:
   - Go to Settings → Apps and sales channels → Develop apps
   - Create App → Configure Storefront API access
   - Install app → Copy Storefront access token
   - Note your store domain: `xxxx.myshopify.com`

### 2. Environment Variables

Create `.env.local` in the `frames-store` directory:

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-access-token
SHOPIFY_API_VERSION=2025-01
```

### 3. Install Dependencies

```bash
cd frames-store
npm install
```

### 4. Development

```bash
npm run dev
```

The store will be available at `http://localhost:3000`

### 5. Production Build

```bash
npm run build
npm start
```

## Integration with Main Site

The store is integrated into `products.html` via links:
- Browse Frames: `/frames-store/shop`
- View Cart: `/frames-store/cart`

For production deployment, ensure the Next.js app is deployed and accessible at the `/frames-store` path, or update the links in `products.html` to match your deployment URL.

## Project Structure

```
frames-store/
├── src/
│   ├── app/
│   │   ├── shop/              # Product listing page
│   │   ├── product/[handle]/   # Product detail page
│   │   ├── cart/               # Shopping cart page
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   └── ProductClient.tsx    # Product detail client component
│   └── lib/
│       ├── shopify.ts          # Shopify GraphQL client
│       ├── queries.ts          # GraphQL queries
│       ├── cart.ts             # Cart management functions
│       └── lenses.ts           # Lens options & prescription schema
└── .env.local                  # Environment variables (create this)
```

## How It Works

1. **Product Listing** (`/shop`): Fetches products from Shopify, displays in a grid with filtering by tags (men/women/unisex)

2. **Product Detail** (`/product/[handle]`):
   - Displays product images (variant-specific if available)
   - Colour selector updates variant and image
   - Lens options (type, thickness, coatings) with price calculations
   - Prescription form captures Rx details
   - Add to cart sends variant ID + attributes to Shopify

3. **Cart** (`/cart`):
   - Displays cart items with lens/Rx attributes
   - Quantity controls and remove functionality
   - Redirects to Shopify checkout URL

4. **Cart Storage**: Uses localStorage to persist cart ID between sessions

## Lens Options & Pricing

Defined in `src/lib/lenses.ts`:
- **Lens Types**: Single Vision (free), Varifocal (+£50), Bifocal (+£30)
- **Thickness**: Standard (free), Thin (+£25), Ultra Thin (+£50)
- **Coatings**: AR (+£30), Blue Light (+£40), Transitions (+£60), AR+Blue Light (+£65)

## Prescription Fields

- Right Eye: SPH, CYL, AXIS
- Left Eye: SPH, CYL, AXIS
- PD (Pupillary Distance)
- ADD (for varifocal/bifocal)
- Notes

All prescription data is sent as line item attributes to Shopify and will appear in order details.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Ensure:
- Node.js 18+ runtime
- Environment variables are set
- Build command: `npm run build`
- Start command: `npm start`

## Notes

- Checkout happens on Shopify's domain (expected behavior)
- Cart ID is stored in localStorage (client-side)
- Variant images are prioritized over product images
- All lens/Rx selections are sent as cart line attributes
- Products should have tags: `men`, `women`, `unisex` for filtering

## Troubleshooting

**No products showing?**
- Check Shopify Storefront API token and domain
- Verify products exist in Shopify Admin
- Check browser console for GraphQL errors

**Cart not working?**
- Ensure localStorage is enabled
- Check Network tab for API errors
- Verify cart mutations are successful

**Images not loading?**
- Verify variant images are set in Shopify
- Check image URLs in Network tab
- Ensure Shopify CDN is accessible
