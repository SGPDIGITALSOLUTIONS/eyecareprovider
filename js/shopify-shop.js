/**
 * Shopify Shop Page
 * Displays all products with filtering
 */

// Shopify API Configuration
const SHOPIFY_CONFIG = {
  domain: window.SHOPIFY_STORE_DOMAIN || '',
  accessToken: window.SHOPIFY_STOREFRONT_TOKEN || '',
  apiVersion: '2025-01',
};

// GraphQL Query for Products with Tag Filtering, Vendor, and Variants
const PRODUCTS_QUERY = `
  query getProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          title
          handle
          vendor
          tags
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
          variants(first: 20) {
            nodes {
              id
              availableForSale
              selectedOptions {
                name
                value
              }
              image {
                url
                altText
              }
            }
          }
        }
      }
    }
  }
`;

let allProducts = [];
let currentFilter = 'all';

/**
 * Fetch products from Shopify Storefront API
 */
async function fetchProducts(limit = 50, tag = null) {
  if (!SHOPIFY_CONFIG.domain || !SHOPIFY_CONFIG.accessToken) {
    console.warn('Shopify credentials not configured');
    return [];
  }

  const query = tag ? `tag:${tag}` : undefined;
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
        variables: { first: limit, query },
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
 * Get favorites from localStorage
 */
function getFavorites() {
  const favorites = localStorage.getItem('shopify_favorites');
  return favorites ? JSON.parse(favorites) : [];
}

/**
 * Save favorites to localStorage
 */
function saveFavorites(favorites) {
  localStorage.setItem('shopify_favorites', JSON.stringify(favorites));
}

/**
 * Toggle favorite
 */
function toggleFavorite(productId, event) {
  event.preventDefault();
  event.stopPropagation();
  
  let favorites = getFavorites();
  const index = favorites.indexOf(productId);
  
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(productId);
  }
  
  saveFavorites(favorites);
  
  // Update heart icon
  const heartIcon = event.currentTarget.querySelector('.favorite-icon');
  if (heartIcon) {
    if (favorites.includes(productId)) {
      heartIcon.classList.add('active');
      heartIcon.innerHTML = '❤️';
    } else {
      heartIcon.classList.remove('active');
      heartIcon.innerHTML = '🤍';
    }
  }
}

/**
 * Extract brand from product title or use vendor
 */
function getBrand(product) {
  if (product.vendor) {
    return product.vendor;
  }
  // Try to extract brand from title (common patterns)
  const titleParts = product.title.split(' ');
  if (titleParts.length > 1) {
    return titleParts[0];
  }
  return 'Brand';
}

/**
 * Map color names to CSS colors
 */
function getColorValue(colorName) {
  const colorMap = {
    'black': '#000000',
    'white': '#FFFFFF',
    'brown': '#8B4513',
    'tortoise': '#8B4513',
    'tortoiseshell': '#8B4513',
    'blue': '#0000FF',
    'navy': '#000080',
    'red': '#FF0000',
    'green': '#008000',
    'grey': '#808080',
    'gray': '#808080',
    'silver': '#C0C0C0',
    'gold': '#FFD700',
    'rose': '#FF69B4',
    'pink': '#FFC0CB',
    'purple': '#800080',
    'beige': '#F5F5DC',
    'tan': '#D2B48C',
    'burgundy': '#800020',
    'gunmetal': '#2C3539',
    'matte': '#2C3539',
    'clear': '#F0F8FF',
    'transparent': '#F0F8FF',
  };
  
  const normalized = colorName.toLowerCase().trim();
  
  // Check exact match
  if (colorMap[normalized]) {
    return colorMap[normalized];
  }
  
  // Check partial matches
  for (const [key, value] of Object.entries(colorMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  // Default to a neutral gray if no match
  return '#CCCCCC';
}

/**
 * Get color variants from product
 */
function getColorVariants(product) {
  if (!product.variants || !product.variants.nodes) {
    return [];
  }
  
  const colorMap = new Map();
  
  product.variants.nodes
    .filter(v => v.availableForSale)
    .forEach(variant => {
      const colorOpt = variant.selectedOptions.find(opt => opt.name === 'Colour' || opt.name === 'Color');
      if (colorOpt) {
        const color = colorOpt.value;
        if (!colorMap.has(color)) {
          colorMap.set(color, {
            color: color,
            colorValue: getColorValue(color),
            image: variant.image?.url || product.featuredImage?.url || '',
            variantId: variant.id
          });
        }
      }
    });
  
  return Array.from(colorMap.values());
}

/**
 * Change product image on color swatch click
 */
function changeProductImage(productId, imageUrl, event) {
  event.preventDefault();
  event.stopPropagation();
  
  const card = event.currentTarget.closest('.product-card-specsavers');
  if (!card) return;
  
  const img = card.querySelector('.product-card-image img');
  if (img && imageUrl) {
    // Fade out
    img.style.opacity = '0';
    setTimeout(() => {
      img.src = imageUrl;
      // Fade in
      img.style.opacity = '1';
    }, 150);
  }
  
  // Update active swatch
  const swatches = card.querySelectorAll('.color-swatch');
  swatches.forEach(swatch => {
    swatch.classList.remove('active');
    swatch.style.borderColor = '#d7dde1';
    swatch.style.borderWidth = '2px';
  });
  event.currentTarget.classList.add('active');
  event.currentTarget.style.borderColor = '#4b8a8a';
  event.currentTarget.style.borderWidth = '3px';
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
        <p>No products found in this category.</p>
      </div>
    `;
    return;
  }

  const favorites = getFavorites();

  const productsHTML = products
    .map(
      (product) => {
        const brand = getBrand(product);
        const isFavorite = favorites.includes(product.id);
        const price = parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2);
        const colorVariants = getColorVariants(product);
        const defaultImage = product.featuredImage?.url || '';
        const firstColorImage = colorVariants.length > 0 ? colorVariants[0].image : defaultImage;
        const displayImage = firstColorImage || defaultImage;
        
        return `
        <div class="product-card-specsavers" data-product-id="${product.id}" style="background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); transition: all 0.3s ease; display: flex; flex-direction: column; position: relative;">
          <div style="position: relative;">
            <a href="frame.html?handle=${product.handle}" class="product-card-link" style="text-decoration: none; color: inherit; display: block;">
              <div class="product-card-image" style="width: 100%; aspect-ratio: 1; overflow: hidden; background: #F8F9FA; display: flex; align-items: center; justify-content: center; position: relative;">
                ${
                  displayImage
                    ? `<img src="${displayImage}" alt="${product.featuredImage?.altText || product.title}" loading="lazy" class="product-main-img" style="width: 100%; height: 100%; object-fit: contain; padding: 1rem; display: block; transition: opacity 0.3s ease;">`
                    : `<div class="product-placeholder" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #A3B8C2; font-size: 0.9rem; background: #F8F9FA;">No Image</div>`
                }
              </div>
            </a>
            <button 
              class="favorite-btn" 
              data-product-id="${product.id}"
              onclick="window.toggleFavorite('${product.id}', event)"
              style="position: absolute; top: 0.75rem; right: 0.75rem; background: rgba(255, 255, 255, 0.9); border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); transition: all 0.2s; z-index: 10; padding: 0;"
              onmouseover="this.style.background='rgba(255, 255, 255, 1)'; this.style.transform='scale(1.1)'"
              onmouseout="this.style.background='rgba(255, 255, 255, 0.9)'; this.style.transform='scale(1)'"
            >
              <span class="favorite-icon" style="font-size: 1.2rem; line-height: 1;">${isFavorite ? '❤️' : '🤍'}</span>
            </button>
          </div>
          <div class="product-card-info" style="padding: 1.25rem; flex-grow: 1; display: flex; flex-direction: column;">
            <div style="margin-bottom: 0.5rem;">
              <p class="product-brand" style="font-size: 0.85rem; color: #6C757D; margin: 0 0 0.25rem 0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">${brand}</p>
              <h3 class="product-title" style="font-size: 1rem; color: #212529; margin: 0; font-weight: 600; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${product.title}</h3>
            </div>
            <div style="margin-top: auto; padding-top: 0.75rem; border-top: 1px solid #E9ECEF;">
              <p class="product-price" style="font-size: 1.1rem; font-weight: 700; color: #212529; margin: 0 0 0.5rem 0;">
                £${price}
              </p>
              ${
                colorVariants.length > 1
                  ? `<div class="color-swatches" style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.5rem;">
                      ${colorVariants.map((variant, index) => `
                        <button 
                          class="color-swatch ${index === 0 ? 'active' : ''}" 
                          data-image-url="${variant.image}"
                          onclick="window.changeProductImage('${product.id}', '${variant.image}', event)"
                          style="width: 28px; height: 28px; border-radius: 50%; border: 2px solid ${index === 0 ? '#4b8a8a' : '#d7dde1'}; cursor: pointer; transition: all 0.2s; padding: 0; flex-shrink: 0; position: relative; background-color: ${variant.colorValue}; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);"
                          title="${variant.color}"
                          onmouseover="this.style.transform='scale(1.15)'; this.style.borderColor='#4b8a8a'"
                          onmouseout="if(!this.classList.contains('active')) { this.style.transform='scale(1)'; this.style.borderColor='#d7dde1'; }"
                        ></button>
                      `).join('')}
                    </div>`
                  : ''
              }
            </div>
          </div>
        </div>
      `;
      }
    )
    .join('');

  container.innerHTML = `
    <div class="products-grid-specsavers" style="display: grid !important; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)) !important; gap: 1.5rem !important; margin-bottom: 2rem; width: 100%;">
      ${productsHTML}
    </div>
    <div class="shop-results-count" style="text-align: center; color: #5B6770; margin-top: 1rem; font-size: 0.95rem;">
      Showing ${products.length} ${products.length === 1 ? 'product' : 'products'}
    </div>
  `;
  
  // Add hover effects via JavaScript
  const cards = container.querySelectorAll('.product-card-specsavers');
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-4px)';
      this.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.12)';
    });
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
    });
  });
}

/**
 * Filter products by tag
 */
function filterProducts(tag) {
  currentFilter = tag;
  
  // Update active button
  document.querySelectorAll('.filter-btn-modern').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.filter === tag) {
      btn.classList.add('active');
    }
  });

  // Filter products
  let filtered = allProducts;
  if (tag !== 'all') {
    filtered = allProducts.filter(product => 
      product.tags && product.tags.includes(tag)
    );
  }

  // Render filtered products
  renderProductGrid(filtered, 'shop-products');
  updateActiveFilters();
}

/**
 * Initialize shop page
 */
async function initShop() {
  // Wait for credentials
  let attempts = 0;
  while ((!window.SHOPIFY_STORE_DOMAIN || !window.SHOPIFY_STOREFRONT_TOKEN) && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  // Update config
  SHOPIFY_CONFIG.domain = window.SHOPIFY_STORE_DOMAIN || '';
  SHOPIFY_CONFIG.accessToken = window.SHOPIFY_STOREFRONT_TOKEN || '';

  // Fetch all products
  allProducts = await fetchProducts(100);
  
  // Render all products
  renderProductGrid(allProducts, 'shop-products');

  // Set up filter buttons
  document.querySelectorAll('.filter-btn-modern').forEach(btn => {
    btn.addEventListener('click', () => {
      filterProducts(btn.dataset.filter);
    });
  });
  
  // Set up sort dropdown
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortProducts(e.target.value);
    });
  }
}

/**
 * Sort products
 */
function sortProducts(sortBy) {
  let sorted = [...allProducts];
  
  switch(sortBy) {
    case 'price-low':
      sorted.sort((a, b) => {
        const priceA = parseFloat(a.priceRange.minVariantPrice.amount);
        const priceB = parseFloat(b.priceRange.minVariantPrice.amount);
        return priceA - priceB;
      });
      break;
    case 'price-high':
      sorted.sort((a, b) => {
        const priceA = parseFloat(a.priceRange.minVariantPrice.amount);
        const priceB = parseFloat(b.priceRange.minVariantPrice.amount);
        return priceB - priceA;
      });
      break;
    case 'name-asc':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'name-desc':
      sorted.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case 'recommended':
    default:
      // Keep original order
      break;
  }
  
  // Apply current filter
  let filtered = sorted;
  if (currentFilter !== 'all') {
    filtered = sorted.filter(product => 
      product.tags && product.tags.includes(currentFilter)
    );
  }
  
  renderProductGrid(filtered, 'shop-products');
  updateActiveFilters();
}

/**
 * Update active filters display
 */
function updateActiveFilters() {
  const container = document.getElementById('active-filters');
  const tagsContainer = container?.querySelector('.active-filters-tags');
  
  if (!container || !tagsContainer) return;
  
  const activeTags = [];
  
  if (currentFilter !== 'all') {
    activeTags.push({
      label: currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1),
      filter: currentFilter
    });
  }
  
  if (activeTags.length > 0) {
    container.style.display = 'flex';
    tagsContainer.innerHTML = activeTags.map(tag => `
      <span class="active-filter-tag">
        ${tag.label}
        <button class="filter-tag-remove" onclick="removeFilter('${tag.filter}')" aria-label="Remove ${tag.label} filter">×</button>
      </span>
    `).join('');
  } else {
    container.style.display = 'none';
  }
}

/**
 * Remove a specific filter
 */
function removeFilter(filter) {
  if (filter === currentFilter) {
    filterProducts('all');
  }
}

/**
 * Clear all filters
 */
function clearAllFilters() {
  filterProducts('all');
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.value = 'recommended';
  }
}

// Make functions available globally
window.removeFilter = removeFilter;
window.clearAllFilters = clearAllFilters;

// Make functions available globally
window.toggleFavorite = toggleFavorite;
window.changeProductImage = changeProductImage;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShop);
} else {
  initShop();
}



