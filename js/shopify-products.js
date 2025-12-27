/**
 * Shopify Products Preview
 * Fetches and displays product previews on products.html
 */

// Shopify API Configuration
// These should be set in your environment or passed from server
const SHOPIFY_CONFIG = {
  domain: window.SHOPIFY_STORE_DOMAIN || '', // Set via script tag
  accessToken: window.SHOPIFY_STOREFRONT_TOKEN || '', // Set via script tag
  apiVersion: '2025-01',
};

// GraphQL Query for Products
const PRODUCTS_QUERY = `
  query getProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          featuredImage {
            url
            altText
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

/**
 * Fetch products from Shopify Storefront API
 */
async function fetchProducts(limit = 6) {
  if (!SHOPIFY_CONFIG.domain || !SHOPIFY_CONFIG.accessToken) {
    console.warn('Shopify credentials not configured');
    return [];
  }

  const endpoint = `https://${SHOPIFY_CONFIG.domain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.accessToken,
      },
      body: JSON.stringify({
        query: PRODUCTS_QUERY,
        variables: { first: limit },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    if (json.errors) {
      console.error('Shopify GraphQL errors:', json.errors);
      return [];
    }

    return json.data?.products?.edges?.map((edge) => edge.node) || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Render product grid
 */
function renderProductGrid(products, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container #${containerId} not found`);
    return;
  }

  if (products.length === 0) {
    container.innerHTML = `
      <div class="products-preview-empty">
        <p>Products will appear here once Shopify is configured.</p>
        <p><a href="/frames-store/shop" class="btn-primary">Browse Full Store</a></p>
      </div>
    `;
    return;
  }

  const productsHTML = products
    .map(
      (product) => `
      <div class="product-preview-card" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); transition: transform 0.3s; display: flex; flex-direction: column;">
        <a href="/frames-store/product/${product.handle}" class="product-preview-link" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; height: 100%;">
          <div class="product-preview-image" style="width: 100%; aspect-ratio: 1; overflow: hidden; background: #F4F7F8; display: flex; align-items: center; justify-content: center;">
            ${
              product.featuredImage
                ? `<img src="${product.featuredImage.url}" alt="${product.featuredImage.altText || product.title}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; display: block;">`
                : `<div class="product-preview-placeholder" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #A3B8C2; font-size: 0.9rem; background: #F4F7F8;">No Image</div>`
            }
          </div>
          <div class="product-preview-info" style="padding: 1.5rem; flex-grow: 1; display: flex; flex-direction: column;">
            <h3 style="font-size: 1.1rem; color: #5B6770; margin: 0 0 0.5rem 0; font-weight: 600; line-height: 1.3;">${product.title}</h3>
            <p class="product-preview-price" style="font-size: 1rem; font-weight: 600; color: #4B8A8A; margin: auto 0 0 0;">
              From £${parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}
            </p>
          </div>
        </a>
      </div>
    `
    )
    .join('');

  container.innerHTML = `
    <div class="products-preview-grid" style="display: grid !important; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important; gap: 2rem !important; margin-bottom: 2rem; width: 100%;">
      ${productsHTML}
    </div>
    <div class="products-preview-footer">
      <a href="/frames-store/shop" class="btn-primary">View All Frames</a>
    </div>
  `;
}

/**
 * Initialize product preview
 */
async function initProductPreview(containerId = 'products-preview', limit = 6) {
  // Wait for credentials to be available
  let attempts = 0;
  while ((!window.SHOPIFY_STORE_DOMAIN || !window.SHOPIFY_STOREFRONT_TOKEN) && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  // Update config with loaded credentials
  SHOPIFY_CONFIG.domain = window.SHOPIFY_STORE_DOMAIN || '';
  SHOPIFY_CONFIG.accessToken = window.SHOPIFY_STOREFRONT_TOKEN || '';
  
  // Fetch products
  const products = await fetchProducts(limit);
  
  // Render the grid
  renderProductGrid(products, containerId);
}

// Wait for DOM and credentials, then initialize
function startInit() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initProductPreview();
    });
  } else {
    initProductPreview();
  }
}

// Start initialization
startInit();

// Export for manual initialization if needed
window.initShopifyProducts = initProductPreview;


