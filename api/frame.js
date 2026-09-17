import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const site = 'https://www.eyecareprovider.co.uk';
const template = readFileSync(fileURLToPath(new URL('../frame.html', import.meta.url)), 'utf8');

const html = (value = '') => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

export default async function handler(req, res) {
  const handle = typeof req.query.handle === 'string' ? req.query.handle : '';
  if (!/^[a-z0-9][a-z0-9-]{0,199}$/.test(handle)) {
    return res.status(404).send('Frame not found');
  }

  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) return res.status(503).send('Frame catalogue unavailable');

  try {
    const response = await fetch(`https://${domain}/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
      body: JSON.stringify({
        query: `query FrameSeo($handle: String!) { product(handle: $handle) { title description featuredImage { url altText } variants(first: 1) { nodes { availableForSale price { amount currencyCode } } } } }`,
        variables: { handle }
      })
    });
    if (!response.ok) throw new Error(`Shopify returned ${response.status}`);
    const data = await response.json();
    const product = data.data?.product;
    if (!product) return res.status(404).send('Frame not found');

    const canonical = `${site}/frames/${handle}`;
    const title = `${product.title} | Eyewear Frames | I Care Service`;
    const description = (product.description || `Shop ${product.title} frames with tailored lens options at I Care Service.`).slice(0, 300);
    const image = product.featuredImage?.url;
    const variant = product.variants?.nodes?.[0];
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description,
      url: canonical,
      ...(image ? { image: [image] } : {}),
      ...(variant ? { offers: {
        '@type': 'Offer',
        url: canonical,
        price: variant.price.amount,
        priceCurrency: variant.price.currencyCode,
        availability: variant.availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
      } } : {})
    };
    const intro = `<article class="product-seo-intro">
      <h1>${html(product.title)}</h1>
      ${image ? `<img src="${html(image)}" alt="${html(product.featuredImage.altText || product.title)}" width="500" height="500">` : ''}
      <p>${html(description)}</p>
      ${variant ? `<p>From ${html(variant.price.currencyCode)} ${html(variant.price.amount)}</p>` : ''}
    </article>`;

    const page = template
      .replace('<head>', '<head>\n    <base href="/">')
      .replace(/<title>[^<]*<\/title>/, `<title>${html(title)}</title>`)
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${html(description)}">`)
      .replace('<meta name="robots" content="noindex, nofollow">', '<meta name="robots" content="index, follow">')
      .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${canonical}">`)
      .replace('</head>', `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>\n</head>`)
      .replace('<div class="product-loading">', `${intro}\n                <div class="product-loading">`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(page);
  } catch (error) {
    console.error('Frame rendering failed', error);
    return res.status(503).send('Frame catalogue temporarily unavailable');
  }
}
