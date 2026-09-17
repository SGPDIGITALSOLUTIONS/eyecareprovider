const xml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
})[character]);

export default async function handler(req, res) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) return res.status(503).send('Catalogue unavailable');

  try {
    const handles = [];
    let cursor = null;
    let more = true;
    while (more) {
      const response = await fetch(`https://${domain}/api/2025-01/graphql.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
        body: JSON.stringify({
          query: `query FrameSitemap($after: String) { products(first: 100, after: $after) { edges { cursor node { handle } } pageInfo { hasNextPage } } }`,
          variables: { after: cursor }
        })
      });
      if (!response.ok) throw new Error(`Shopify returned ${response.status}`);
      const data = await response.json();
      const products = data.data?.products;
      if (!products) throw new Error('Shopify returned no product list');
      handles.push(...products.edges.map(edge => edge.node.handle));
      more = products.pageInfo.hasNextPage;
      cursor = products.edges.at(-1)?.cursor;
      if (more && !cursor) throw new Error('Missing pagination cursor');
    }

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${handles.map(handle => `  <url><loc>${xml(`https://www.eyecareprovider.co.uk/frames/${encodeURIComponent(handle)}`)}</loc></url>`).join('\n')}\n</urlset>`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=3600');
    return res.status(200).send(body);
  } catch (error) {
    console.error('Frame sitemap failed', error);
    return res.status(503).send('Catalogue temporarily unavailable');
  }
}
