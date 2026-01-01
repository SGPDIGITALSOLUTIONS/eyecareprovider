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
let currentPage = 1;
let productsPerPage = 20;

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
  
  // Update active thumbnail
  const thumbnails = card.querySelectorAll('.variant-thumbnail-btn');
  thumbnails.forEach(thumb => {
    thumb.classList.remove('active');
  });
  event.currentTarget.classList.add('active');
}

/**
 * Optimize image URL for better performance
 */
function getOptimizedImageUrl(url, width = 400) {
  if (!url) return '';
  // Shopify image transformation - add width parameter
  if (url.includes('cdn.shopify.com')) {
    return url.replace(/\?.*$/, '') + `?width=${width}&height=${width}&fit=crop`;
  }
  return url;
}

/**
 * Render product card HTML
 */
function renderProductCard(product, favorites) {
  const brand = getBrand(product);
  const isFavorite = favorites.includes(product.id);
  const price = parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2);
  const colorVariants = getColorVariants(product);
  const defaultImage = product.featuredImage?.url || '';
  const firstColorImage = colorVariants.length > 0 ? colorVariants[0].image : defaultImage;
  const displayImage = firstColorImage || defaultImage;
  const optimizedImage = getOptimizedImageUrl(displayImage, 400);
  
  let variantsHTML = '';
  if (colorVariants.length > 1) {
    variantsHTML = colorVariants.map((variant, index) => {
      const variantImage = getOptimizedImageUrl(variant.image, 80);
      return `
        <button 
          class="variant-thumbnail-btn ${index === 0 ? 'active' : ''}" 
          data-image-url="${variant.image}"
          onclick="window.changeProductImage('${product.id}', '${variant.image}', event)"
          title="${variant.color}"
        >
          <img src="${variantImage}" alt="${variant.color}" loading="lazy">
        </button>
      `;
    }).join('');
  }
  
  return `
    <div class="product-card-specsavers" data-product-id="${product.id}">
      <div class="product-card-image-wrapper">
        <a href="frame.html?handle=${product.handle}" class="product-card-link">
          <div class="product-card-image">
            ${displayImage
              ? `<img src="${optimizedImage}" alt="${product.featuredImage?.altText || product.title}" loading="lazy" class="product-main-img">`
              : `<div class="product-placeholder">No Image</div>`
            }
          </div>
        </a>
        <button 
          class="favorite-btn" 
          data-product-id="${product.id}"
          onclick="window.toggleFavorite('${product.id}', event)"
        >
          <span class="favorite-icon">${isFavorite ? '❤️' : '🤍'}</span>
        </button>
      </div>
      <div class="product-card-info">
        <div class="product-card-info-header">
          <p class="product-brand">${brand}</p>
          <h3 class="product-title">${product.title}</h3>
        </div>
        <div class="product-card-footer">
          <p class="product-price">£${price}</p>
          ${variantsHTML ? `<div class="variant-thumbnails-strip">${variantsHTML}</div>` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render product grid with pagination
 */
function renderProductGrid(products, containerId, append = false) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container #${containerId} not found`);
    return;
  }

  if (products.length === 0 && !append) {
    container.innerHTML = `
      <div class="products-preview-empty">
        <p>No products found in this category.</p>
      </div>
    `;
    return;
  }

  const favorites = getFavorites();
  
  // Always create fresh grid container (not appending)
  container.innerHTML = `
    <div class="products-grid-specsavers"></div>
    <div class="shop-results-count"></div>
  `;
  
  const gridContainer = container.querySelector('.products-grid-specsavers');

  // Render products efficiently
  const fragment = document.createDocumentFragment();
  products.forEach((product) => {
    const cardHTML = renderProductCard(product, favorites);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cardHTML.trim();
    fragment.appendChild(tempDiv.firstChild);
  });
  
  gridContainer.appendChild(fragment);
  
  // Update results count with pagination info
  const paginationInfo = getPaginatedProducts();
  const resultsCount = container.querySelector('.shop-results-count');
  resultsCount.textContent = `Showing ${paginationInfo.startIndex}-${paginationInfo.endIndex} of ${paginationInfo.total} products`;
  
  // Render pagination controls
  renderPagination(containerId);
}

/**
 * Get filtered products based on current filter
 */
function getFilteredProducts() {
  if (currentFilter === 'all') {
    return allProducts;
  }
  return allProducts.filter(product => 
    product.tags && product.tags.includes(currentFilter)
  );
}

/**
 * Get paginated products for current page
 */
function getPaginatedProducts() {
  const filtered = getFilteredProducts();
  const totalPages = Math.ceil(filtered.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const paginatedProducts = filtered.slice(startIndex, endIndex);
  
  return {
    products: paginatedProducts,
    total: filtered.length,
    totalPages: totalPages,
    currentPage: currentPage,
    startIndex: startIndex + 1,
    endIndex: Math.min(endIndex, filtered.length)
  };
}

/**
 * Render pagination controls
 */
function renderPagination(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const paginationInfo = getPaginatedProducts();
  const { total, totalPages, currentPage, startIndex, endIndex } = paginationInfo;
  
  if (totalPages <= 1) {
    // Hide pagination if only one page
    const paginationContainer = container.querySelector('.pagination-controls');
    if (paginationContainer) {
      paginationContainer.remove();
    }
    return;
  }
  
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  
  let paginationHTML = `
    <div class="pagination-controls" style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 2rem; padding: 1rem;">
      <button 
        class="pagination-btn pagination-prev" 
        ${!hasPrev ? 'disabled' : ''}
        onclick="window.goToPage(${currentPage - 1})"
        style="padding: 0.5rem 1rem; background: ${hasPrev ? '#4b8a8a' : '#e3e7eb'}; color: ${hasPrev ? 'white' : '#9ca3af'}; border: none; border-radius: 6px; cursor: ${hasPrev ? 'pointer' : 'not-allowed'}; font-weight: 600; transition: all 0.2s;"
        onmouseover="${hasPrev ? "this.style.background='#3a6f6f'" : ""}"
        onmouseout="${hasPrev ? "this.style.background='#4b8a8a'" : ""}"
      >
        ← Previous
      </button>
      
      <div class="pagination-info" style="color: #5B6770; font-size: 0.95rem;">
        Showing ${startIndex}-${endIndex} of ${total} products
      </div>
      
      <button 
        class="pagination-btn pagination-next" 
        ${!hasNext ? 'disabled' : ''}
        onclick="window.goToPage(${currentPage + 1})"
        style="padding: 0.5rem 1rem; background: ${hasNext ? '#4b8a8a' : '#e3e7eb'}; color: ${hasNext ? 'white' : '#9ca3af'}; border: none; border-radius: 6px; cursor: ${hasNext ? 'pointer' : 'not-allowed'}; font-weight: 600; transition: all 0.2s;"
        onmouseover="${hasNext ? "this.style.background='#3a6f6f'" : ""}"
        onmouseout="${hasNext ? "this.style.background='#4b8a8a'" : ""}"
      >
        Next →
      </button>
    </div>
  `;
  
  const existingPagination = container.querySelector('.pagination-controls');
  if (existingPagination) {
    existingPagination.outerHTML = paginationHTML;
  } else {
    container.insertAdjacentHTML('beforeend', paginationHTML);
  }
}

/**
 * Navigate to specific page
 */
function goToPage(page) {
  const paginationInfo = getPaginatedProducts();
  if (page < 1 || page > paginationInfo.totalPages) return;
  
  currentPage = page;
  const filtered = getFilteredProducts();
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const pageProducts = filtered.slice(startIndex, endIndex);
  
  renderProductGrid(pageProducts, 'shop-products', false);
  renderPagination('shop-products');
  
  // Scroll to top of products section
  const container = document.getElementById('shop-products');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Filter products by tag
 */
function filterProducts(tag) {
  currentFilter = tag;
  currentPage = 1; // Reset to first page when filtering
  
  // Update active button
  document.querySelectorAll('.filter-btn-modern').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.filter === tag) {
      btn.classList.add('active');
    }
  });

  // Get paginated products for current page
  const paginationInfo = getPaginatedProducts();
  renderProductGrid(paginationInfo.products, 'shop-products', false);
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
  
  // Initialize with first page
  currentPage = 1;
  const paginationInfo = getPaginatedProducts();
  renderProductGrid(paginationInfo.products, 'shop-products', false);

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
  
  // Update allProducts with sorted order
  allProducts = sorted;
  currentPage = 1; // Reset to first page when sorting
  
  // Get paginated products for current page
  const paginationInfo = getPaginatedProducts();
  renderProductGrid(paginationInfo.products, 'shop-products', false);
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
window.toggleFavorite = toggleFavorite;
window.changeProductImage = changeProductImage;
window.goToPage = goToPage;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShop);
} else {
  initShop();
}



