here /**
 * Shopify Configuration API Endpoint
 * Returns Shopify credentials securely (server-side only)
 * 
 * For Vercel: Add environment variables in Vercel dashboard
 * Settings → Environment Variables:
 * - SHOPIFY_STORE_DOMAIN
 * - SHOPIFY_STOREFRONT_ACCESS_TOKEN
 */

export default function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return credentials from environment variables
  res.json({
    domain: process.env.SHOPIFY_STORE_DOMAIN || '',
    token: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || ''
  });
}
