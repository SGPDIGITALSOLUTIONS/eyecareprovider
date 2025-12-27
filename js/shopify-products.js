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
      <div class="product-preview-card">
        <a href="/frames-store/product/${product.handle}" class="product-preview-link">
          <div class="product-preview-image">
            ${
              product.featuredImage
                ? `<img src="${product.featuredImage.url}" alt="${product.featuredImage.altText || product.title}" loading="lazy">`
                : `<div class="product-preview-placeholder">No Image</div>`
            }
          </div>
          <div class="product-preview-info">
            <h3>${product.title}</h3>
            <p class="product-preview-price">
              From £${parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}
            </p>
          </div>
        </a>
      </div>
    `
    )
    .join('');

  container.innerHTML = `
    <div class="products-preview-grid">
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


