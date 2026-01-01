/**
 * Headless Shopify Cart Management System
 * Uses Shopify Storefront Cart API (GraphQL) with localStorage for cart ID
 * 
 * Core Principle: In headless Shopify, there is NO native cart cookie.
 * The frontend manages cart state and uses GraphQL mutations to sync with Shopify.
 */

// Storage key for cart ID
const CART_ID_KEY = 'shopify_cart_id';

/**
 * Get Shopify Storefront API endpoint
 */
function getShopifyEndpoint() {
  const domain = window.SHOPIFY_STORE_DOMAIN || '';
  const apiVersion = '2025-01';
  if (!domain) {
    throw new Error('Shopify store domain not configured');
  }
  return `https://${domain}/api/${apiVersion}/graphql.json`;
}

/**
 * Get Shopify Storefront Access Token
 */
function getShopifyToken() {
  const token = window.SHOPIFY_STOREFRONT_TOKEN || '';
  if (!token) {
    throw new Error('Shopify Storefront Access Token not configured');
  }
  return token;
}

/**
 * Check if Shopify credentials are available (non-blocking)
 */
function hasShopifyCredentials() {
  return !!(window.SHOPIFY_STORE_DOMAIN && window.SHOPIFY_STOREFRONT_TOKEN);
}

/**
 * Execute GraphQL query/mutation
 */
async function shopifyGraphQL(query, variables = {}) {
  const endpoint = getShopifyEndpoint();
  const token = getShopifyToken();
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const json = await response.json();
  
  if (json.errors) {
    const errorMessages = json.errors.map(e => e.message || JSON.stringify(e)).join(', ');
    throw new Error(`GraphQL error: ${errorMessages}`);
  }
  
  if (json.data?.cartCreate?.userErrors?.length > 0) {
    const userErrors = json.data.cartCreate.userErrors.map(e => e.message || JSON.stringify(e)).join(', ');
    throw new Error(`Cart error: ${userErrors}`);
  }
  
  if (json.data?.cartLinesAdd?.userErrors?.length > 0) {
    const userErrors = json.data.cartLinesAdd.userErrors.map(e => e.message || JSON.stringify(e)).join(', ');
    throw new Error(`Cart error: ${userErrors}`);
  }
  
  return json.data;
}

/**
 * Get or create cart ID from localStorage
 */
function getCartId() {
  return localStorage.getItem(CART_ID_KEY);
}

/**
 * Save cart ID to localStorage
 */
function saveCartId(cartId) {
  localStorage.setItem(CART_ID_KEY, cartId);
}

/**
 * Clear cart ID from localStorage
 */
function clearCartId() {
  localStorage.removeItem(CART_ID_KEY);
}

/**
 * Create a new Shopify cart
 */
const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function createCart(lines = []) {
  const data = await shopifyGraphQL(CART_CREATE_MUTATION, {
    input: { lines }
  });
  
  if (data.cartCreate.userErrors?.length > 0) {
    throw new Error(data.cartCreate.userErrors.map(e => e.message).join(', '));
  }
  
  const cartId = data.cartCreate.cart.id;
  saveCartId(cartId);
  return data.cartCreate.cart;
}

/**
 * Add lines to existing cart
 */
const CART_LINES_ADD_MUTATION = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product {
                    title
                  }
                }
              }
              attributes {
                key
                value
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function addLinesToCart(cartId, lines) {
  const data = await shopifyGraphQL(CART_LINES_ADD_MUTATION, {
    cartId,
    lines
  });
  
  if (data.cartLinesAdd.userErrors?.length > 0) {
    throw new Error(data.cartLinesAdd.userErrors.map(e => e.message).join(', '));
  }
  
  return data.cartLinesAdd.cart;
}

/**
 * Get cart from Shopify
 */
const CART_QUERY = `
  query getCart($id: ID!) {
    cart(id: $id) {
      id
      checkoutUrl
      lines(first: 100) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                product {
                  title
                }
              }
            }
            attributes {
              key
              value
            }
          }
        }
      }
      cost {
        totalAmount {
          amount
          currencyCode
        }
      }
    }
  }
`;

async function getCart(cartId) {
  try {
    const data = await shopifyGraphQL(CART_QUERY, { id: cartId });
    return data.cart;
  } catch (error) {
    // Cart might not exist anymore, clear it
    clearCartId();
    throw error;
  }
}

/**
 * Remove line from cart
 */
const CART_LINES_REMOVE_MUTATION = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        id
        checkoutUrl
        lines(first: 100) {
          edges {
            node {
              id
              quantity
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function removeLineFromCart(cartId, lineId) {
  const data = await shopifyGraphQL(CART_LINES_REMOVE_MUTATION, {
    cartId,
    lineIds: [lineId]
  });
  
  if (data.cartLinesRemove.userErrors?.length > 0) {
    throw new Error(data.cartLinesRemove.userErrors.map(e => e.message).join(', '));
  }
  
  return data.cartLinesRemove.cart;
}

/**
 * Local cart state (for UI purposes before syncing to Shopify)
 * This is a temporary cache that gets synced to Shopify
 */
let localCartCache = {
  items: [],
  cartId: null
};

/**
 * Load local cart cache from sessionStorage (fallback)
 */
function loadLocalCache() {
  try {
    const cached = sessionStorage.getItem('local_cart_cache');
    if (cached) {
      localCartCache = JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Failed to load local cart cache:', e);
  }
}

/**
 * Save local cart cache to sessionStorage
 */
function saveLocalCache() {
  try {
    sessionStorage.setItem('local_cart_cache', JSON.stringify(localCartCache));
  } catch (e) {
    console.warn('Failed to save local cart cache:', e);
  }
}

/**
 * Ensure Shopify credentials are loaded
 */
async function ensureCredentials() {
  let attempts = 0;
  while ((!window.SHOPIFY_STORE_DOMAIN || !window.SHOPIFY_STOREFRONT_TOKEN) && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (!window.SHOPIFY_STORE_DOMAIN || !window.SHOPIFY_STOREFRONT_TOKEN) {
    throw new Error('Shopify configuration not available. Please refresh the page.');
  }
}

/**
 * Add item to cart (syncs to Shopify)
 */
async function addToCart(item) {
  await ensureCredentials();
  
  // Validate item
  if (!item || !item.variantId) {
    throw new Error('Invalid cart item: variant ID is required');
  }
  
  // Ensure variant ID is in GraphQL format
  let variantId = item.variantId;
  if (typeof variantId !== 'string') {
    variantId = String(variantId);
  }
  
  if (!variantId.startsWith('gid://shopify/ProductVariant/')) {
    if (/^\d+$/.test(variantId)) {
      variantId = `gid://shopify/ProductVariant/${variantId}`;
    } else {
      throw new Error(`Invalid variant ID format: ${variantId}`);
    }
  }
  
  // Attributes should already be in Shopify format [{key, value}, ...]
  // If it's an object, convert it; otherwise use as-is
  let attributes = [];
  if (Array.isArray(item.attributes)) {
    attributes = item.attributes.map(attr => ({
      key: attr.key || attr.name,
      value: String(attr.value || attr)
    }));
  } else if (item.attributes && typeof item.attributes === 'object') {
    attributes = Object.entries(item.attributes).map(([key, value]) => ({
      key,
      value: String(value)
    }));
  }
  
  const line = {
    merchandiseId: variantId,
    quantity: 1,
    attributes: attributes
  };
  
  let cartId = getCartId();
  
  try {
    if (!cartId) {
      // Create new cart
      const cart = await createCart([line]);
      cartId = cart.id;
      localCartCache.cartId = cartId;
    } else {
      // Add to existing cart
      try {
        await addLinesToCart(cartId, [line]);
      } catch (error) {
        // Cart might be invalid, create new one
        console.warn('Cart invalid, creating new cart:', error);
        const cart = await createCart([line]);
        cartId = cart.id;
        localCartCache.cartId = cartId;
      }
    }
    
    // Update local cache
    localCartCache.items.push({
      ...item,
      variantId: variantId,
      shopifyLineId: null // Will be set when we fetch cart
    });
    saveLocalCache();
    
    updateCartBadge();
    return localCartCache.items.length;
  } catch (error) {
    console.error('Error adding to cart:', error);
    const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
    throw new Error(`Failed to add item to cart: ${errorMessage}`);
  }
}

/**
 * Remove item from cart
 */
async function removeFromCart(index) {
  await ensureCredentials();
  
  const cartId = getCartId();
  if (!cartId) {
    // No cart, just remove from local cache
    localCartCache.items.splice(index, 1);
    saveLocalCache();
    updateCartBadge();
    return;
  }
  
  try {
    // Get current cart to find line IDs
    const cart = await getCart(cartId);
    const lines = cart.lines.edges;
    
    if (index < lines.length) {
      const lineId = lines[index].node.id;
      await removeLineFromCart(cartId, lineId);
    }
    
    // Update local cache
    localCartCache.items.splice(index, 1);
    saveLocalCache();
    updateCartBadge();
  } catch (error) {
    console.error('Error removing from cart:', error);
    // Fallback: just remove from local cache
    localCartCache.items.splice(index, 1);
    saveLocalCache();
    updateCartBadge();
  }
}

/**
 * Clear cart
 */
async function clearCart() {
  clearCartId();
  localCartCache = { items: [], cartId: null };
  saveLocalCache();
  updateCartBadge();
}

/**
 * Get cart items (from local cache)
 */
function getCartItems() {
  loadLocalCache();
  return localCartCache.items || [];
}

/**
 * Get cart item count
 */
function getCartItemCount() {
  loadLocalCache();
  return localCartCache.items.length;
}

/**
 * Get cart total
 */
function getCartTotal() {
  loadLocalCache();
  return localCartCache.items.reduce((total, item) => total + (parseFloat(item.price) || 0), 0);
}

/**
 * Get checkout URL
 */
async function getCheckoutUrl() {
  await ensureCredentials();
  
  const cartId = getCartId();
  if (!cartId) {
    throw new Error('No cart found');
  }
  
  try {
    const cart = await getCart(cartId);
    return cart.checkoutUrl;
  } catch (error) {
    console.error('Error getting checkout URL:', error);
    throw error;
  }
}

/**
 * Update cart badge in navigation
 */
function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  const count = getCartItemCount();
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
  
  // Also update any cart icons
  const cartIcons = document.querySelectorAll('.cart-icon');
  cartIcons.forEach(icon => {
    const iconBadge = icon.querySelector('.cart-badge');
    if (iconBadge) {
      iconBadge.textContent = count;
      iconBadge.style.display = count > 0 ? 'flex' : 'none';
    }
  });
}

/**
 * Initialize cart badge on page load
 */
function initCartBadge() {
  try {
    loadLocalCache();
    updateCartBadge();
  } catch (error) {
    console.warn('Cart badge initialization error:', error);
    // Don't block page load if cart badge fails
  }
}

// Initialize on load (with error handling)
try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCartBadge);
  } else {
    initCartBadge();
  }
} catch (error) {
  console.error('Cart initialization error:', error);
  // Don't block page load
}

// Export for use in other scripts (with error handling)
try {
  window.CartManager = {
    add: addToCart,
    remove: removeFromCart,
    clear: clearCart,
    getItems: getCartItems,
    getCount: getCartItemCount,
    getTotal: getCartTotal,
    getCheckoutUrl: getCheckoutUrl,
    updateBadge: updateCartBadge,
    getCartId: getCartId,
    hasCredentials: hasShopifyCredentials
  };
} catch (error) {
  console.error('Failed to initialize CartManager:', error);
  // Provide a minimal fallback to prevent page breakage
  window.CartManager = {
    add: async () => { throw new Error('CartManager not initialized'); },
    remove: async () => { throw new Error('CartManager not initialized'); },
    clear: () => {},
    getItems: () => [],
    getCount: () => 0,
    getTotal: () => 0,
    getCheckoutUrl: async () => { throw new Error('CartManager not initialized'); },
    updateBadge: () => {},
    getCartId: () => null,
    hasCredentials: () => false
  };
}
