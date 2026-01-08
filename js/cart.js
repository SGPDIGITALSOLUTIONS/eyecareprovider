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
                price {
                  amount
                  currencyCode
                }
                image {
                  url
                  altText
                }
                selectedOptions {
                  name
                  value
                }
                product {
                  title
                  images(first: 1) {
                    edges {
                      node {
                        url
                        altText
                      }
                    }
                  }
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
 * 
 * frameAssociations: Maps frame variant IDs to arrays of associated addon variant IDs
 * This is stored separately because Shopify doesn't persist custom attributes reliably
 */
let localCartCache = {
  items: [],
  cartId: null,
  frameAssociations: {} // { frameVariantId: [addonVariantId1, addonVariantId2, ...] }
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
 * Format variant ID to GraphQL format
 */
function formatVariantId(variantId) {
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
  
  return variantId;
}

/**
 * Format attributes to Shopify format
 */
function formatAttributes(attributes) {
  if (Array.isArray(attributes)) {
    return attributes.map(attr => ({
      key: attr.key || attr.name,
      value: String(attr.value || attr)
    }));
  } else if (attributes && typeof attributes === 'object') {
    return Object.entries(attributes).map(([key, value]) => ({
      key,
      value: String(value)
    }));
  }
  return [];
}

/**
 * Add item to cart (syncs to Shopify)
 * Supports adding multiple line items (e.g., frame + lens addons)
 * 
 * @param {Object} item - Main cart item with variantId and attributes
 * @param {Array} additionalLines - Optional array of additional line items (e.g., lens addons)
 */
async function addToCart(item, additionalLines = []) {
  await ensureCredentials();
  
  // Validate item
  if (!item || !item.variantId) {
    throw new Error('Invalid cart item: variant ID is required');
  }
  
  // Format main variant ID
  const variantId = formatVariantId(item.variantId);
  
  // Format attributes
  const attributes = formatAttributes(item.attributes);
  
  // Validate attributes (ensure they're in correct format)
  let validAttributes = [];
  if (attributes.length > 0) {
    console.log('Adding item with attributes:', attributes);
    // Ensure all attributes have valid key/value
    validAttributes = attributes.filter(attr => {
      if (!attr.key || attr.key.trim() === '') {
        console.warn('Skipping attribute with empty key:', attr);
        return false;
      }
      if (attr.value === undefined || attr.value === null || String(attr.value).trim() === '') {
        console.warn('Skipping attribute with empty/null value:', attr);
        return false;
      }
      return true;
    });
    
    if (validAttributes.length !== attributes.length) {
      console.warn(`Filtered ${attributes.length - validAttributes.length} invalid attributes`);
    }
  } else {
    console.warn('No attributes to add for item:', item);
  }
  
  // Build main line item with validated attributes
  const mainLine = {
    merchandiseId: variantId,
    quantity: 1,
    attributes: validAttributes
  };
  
  // Log what we're adding for this specific frame
  console.log(`Adding frame to cart - Variant ID: ${variantId}, Attributes (${validAttributes.length}):`, validAttributes);
  
  // Build additional line items (e.g., lens addons)
  // Initialize frameAssociations to track frame->addon relationships
  if (!localCartCache.frameAssociations) {
    localCartCache.frameAssociations = {};
  }
  
  // Store association: this frame variant ID -> array of addon variant IDs
  const associatedAddonVariantIds = [];
  
  const allLines = [mainLine];
  
  if (Array.isArray(additionalLines) && additionalLines.length > 0) {
    for (const addon of additionalLines) {
      if (!addon || !addon.variantId) {
        console.warn('Skipping invalid addon line item:', addon);
        continue;
      }
      
      try {
        const addonVariantId = formatVariantId(addon.variantId);
        // Track this addon as associated with the frame
        associatedAddonVariantIds.push(addonVariantId);
        
        // Addon items should ONLY have their specific attribute
        // Lens addons: only "Lens: Configuration"
        // Photochromic addons: only "Lens: Photochromic Type"
        let addonAttributes = formatAttributes(addon.attributes || []);
        
        // Validate and filter addon attributes to ensure only the correct one is included
        if (addonAttributes.length > 0) {
          // Check which type of attribute this addon should have
          const hasPhotochromicAttr = addonAttributes.some(attr => 
            attr.key === 'Lens: Photochromic Type'
          );
          const hasConfigAttr = addonAttributes.some(attr => 
            attr.key === 'Lens: Configuration'
          );
          
          if (hasPhotochromicAttr) {
            // Photochromic addon: keep ONLY "Lens: Photochromic Type"
            addonAttributes = addonAttributes.filter(attr => 
              attr.key === 'Lens: Photochromic Type'
            );
            console.log('Photochromic addon - filtered to only Photochromic Type attribute');
          } else if (hasConfigAttr) {
            // Lens addon: keep ONLY "Lens: Configuration"
            addonAttributes = addonAttributes.filter(attr => 
              attr.key === 'Lens: Configuration'
            );
            console.log('Lens addon - filtered to only Configuration attribute');
          } else {
            // No expected attribute found, clear all
            console.warn('Addon has no expected attribute, clearing all attributes');
            addonAttributes = [];
          }
          
          // Log what we're sending to Shopify
          console.log(`Adding addon line item with ${addonAttributes.length} attribute(s):`, addonAttributes);
        }
        
        allLines.push({
          merchandiseId: addonVariantId,
          quantity: addon.quantity || 1,
          attributes: addonAttributes // Only specific attribute for this addon
        });
      } catch (error) {
        console.warn('Error formatting addon line item:', error, addon);
        // Continue with other addons even if one fails
      }
    }
  }
  
  // Store the frame->addon associations in local cache
  if (associatedAddonVariantIds.length > 0) {
    localCartCache.frameAssociations[variantId] = associatedAddonVariantIds;
    saveLocalCache(); // Save immediately to persist associations
  }
  
  let cartId = getCartId();
  
  try {
    let cart;
    if (!cartId) {
      // Create new cart with all lines
      cart = await createCart(allLines);
      cartId = cart.id;
      localCartCache.cartId = cartId;
    } else {
      // Add all lines to existing cart
      try {
        cart = await addLinesToCart(cartId, allLines);
      } catch (error) {
        // Cart might be invalid, create new one
        console.warn('Cart invalid, creating new cart:', error);
        cart = await createCart(allLines);
        cartId = cart.id;
        localCartCache.cartId = cartId;
      }
    }
    
    // Fetch the cart from Shopify to get actual product/variant data
    // This ensures we have correct titles, prices, and all variant information
    try {
      const verifiedCart = await getCart(cartId);
      if (verifiedCart && verifiedCart.lines && verifiedCart.lines.edges) {
        // Sync local cache with Shopify cart data
        localCartCache.items = [];
        
        verifiedCart.lines.edges.forEach((lineEdge) => {
          const line = lineEdge.node;
          const variant = line.merchandise;
          
          // Extract colour from attributes or selectedOptions
          let colour = 'N/A';
          if (line.attributes && line.attributes.length > 0) {
            const colourAttr = line.attributes.find(attr => attr.key === 'Colour');
            if (colourAttr) {
              colour = colourAttr.value;
            }
          }
          if (colour === 'N/A' && variant.selectedOptions) {
            const colourOpt = variant.selectedOptions.find(opt => opt.name === 'Colour');
            if (colourOpt) {
              colour = colourOpt.value;
            }
          }
          
          // Determine if this is an addon based on product title ONLY
          // Frame products won't have "lens" or "add on" in the title
          const productTitleLower = variant.product.title.toLowerCase();
          const isLensAddon = productTitleLower === 'lenses' || productTitleLower === 'lens';
          const isPhotochromicAddon = productTitleLower === 'add ons' || 
                                      productTitleLower === 'add-ons' ||
                                      productTitleLower.includes('add on') ||
                                      productTitleLower.includes('addon');
          const isAddon = isLensAddon || isPhotochromicAddon;
          
          // Build cart item from Shopify data
          // IMPORTANT: Only filter attributes for addon items, NEVER for frames
          // BUT preserve "Associated Frame" attribute for addons so we can link them to frames
          let filteredAttributes = line.attributes || [];
          if (isAddon) {
            // For addon items, keep their specific attribute AND the "Associated Frame" attribute
            if (isPhotochromicAddon) {
              // Photochromic addon: keep "Lens: Photochromic Type" AND "Associated Frame"
              filteredAttributes = (line.attributes || []).filter(attr => 
                attr.key === 'Lens: Photochromic Type' || 
                attr.key === 'Associated Frame' ||
                attr.key === 'associated frame'
              );
              console.log(`Photochromic addon "${variant.product.title}" - filtered to ${filteredAttributes.length} attribute(s):`, filteredAttributes);
            } else if (isLensAddon) {
              // Lens addon: keep "Lens: Configuration" AND "Associated Frame"
              filteredAttributes = (line.attributes || []).filter(attr => 
                attr.key === 'Lens: Configuration' || 
                attr.key === 'Associated Frame' ||
                attr.key === 'associated frame'
              );
              console.log(`Lens addon "${variant.product.title}" - filtered to ${filteredAttributes.length} attribute(s):`, filteredAttributes);
              console.log(`Original attributes from Shopify:`, line.attributes);
            } else {
              // Unknown addon type, but still keep "Associated Frame" if present
              filteredAttributes = (line.attributes || []).filter(attr => 
                attr.key === 'Associated Frame' ||
                attr.key === 'associated frame'
              );
            }
          } else {
            // Frame item - keep all attributes
            console.log(`Frame "${variant.product.title}" - keeping all ${filteredAttributes.length} attribute(s)`);
          }
          // For frame items (not addons), keep all attributes - no filtering
          
          // Get image for this specific frame variant
          // Priority: variant.image > product.images[0] > null
          let frameImageUrl = null;
          if (variant.image && variant.image.url) {
            frameImageUrl = variant.image.url;
          } else if (variant.product.images && variant.product.images.edges && variant.product.images.edges.length > 0) {
            frameImageUrl = variant.product.images.edges[0].node.url;
          }
          
          // Log image source for debugging
          if (!isAddon) {
            console.log(`Frame "${variant.product.title}" (${colour}) - Image: ${frameImageUrl || 'NONE'}`);
          }
          
          const cartItem = {
            variantId: variant.id,
            productTitle: variant.product.title,
            colour: colour,
            price: parseFloat(variant.price.amount).toFixed(2),
            basePrice: parseFloat(variant.price.amount).toFixed(2),
            quantity: line.quantity,
            shopifyLineId: line.id,
            isAddon: isAddon,
            attributes: filteredAttributes, // Each frame gets its own attributes from Shopify
            imageUrl: frameImageUrl // Each frame gets its own image from Shopify
          };
          
          // Try to restore "Associated Frame" from frameAssociations if this is an addon
          if (isAddon && !localCartCache.frameAssociations) {
            localCartCache.frameAssociations = {};
          }
          
          localCartCache.items.push(cartItem);
        });
        
        // Log attributes for debugging - show which frame/addon each line belongs to
        verifiedCart.lines.edges.forEach((line, index) => {
          const variant = line.node.merchandise;
          const productTitle = variant.product.title;
          const isAddon = productTitle.toLowerCase().includes('lens') || 
                         productTitle.toLowerCase().includes('add on') ||
                         productTitle.toLowerCase().includes('addon');
          
          if (line.node.attributes && line.node.attributes.length > 0) {
            console.log(`Line ${index} (${isAddon ? 'ADDON' : 'FRAME'}): "${productTitle}" - ${line.node.attributes.length} attribute(s):`, line.node.attributes);
          } else {
            console.warn(`Line ${index} (${isAddon ? 'ADDON' : 'FRAME'}): "${productTitle}" - has no attributes!`, line.node);
          }
        });
      }
    } catch (verifyError) {
      console.warn('Could not fetch cart from Shopify, using local cache:', verifyError);
      // Fallback: Update local cache with what we have
      localCartCache.items.push({
        ...item,
        variantId: variantId,
        shopifyLineId: null
      });
      
      additionalLines.forEach(addon => {
        if (addon && addon.variantId) {
          localCartCache.items.push({
            ...addon,
            variantId: formatVariantId(addon.variantId),
            shopifyLineId: null,
            isAddon: true
          });
        }
      });
    }
    
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
 * If removing a frame, also removes all associated add-ons (lenses, photochromic)
 */
async function removeFromCart(index) {
  await ensureCredentials();
  
  // Load local cache to ensure we have the latest data
  loadLocalCache();
  
  if (index >= localCartCache.items.length) {
    console.warn('Index out of bounds');
    return;
  }
  
  const removedItem = localCartCache.items[index];
  if (!removedItem) {
    console.warn('Item not found at index:', index);
    return;
  }
  
  const cartId = getCartId();
  if (!cartId) {
    // No cart, just remove from local cache
    if (!removedItem.isAddon) {
      // If removing a frame, also remove associated add-ons
      const frameVariantId = removedItem.variantId;
      // Get associated addon variant IDs from frameAssociations
      if (!localCartCache.frameAssociations) {
        localCartCache.frameAssociations = {};
      }
      const frameAssociations = localCartCache.frameAssociations[frameVariantId] || [];
      const associatedAddonVariantIdSet = new Set(frameAssociations);
      
      localCartCache.items = localCartCache.items.filter((item, idx) => {
        if (idx === index) return false; // Remove the frame itself
        if (item.isAddon && associatedAddonVariantIdSet.has(item.variantId)) {
          return false; // Remove associated addon
        }
        return true;
      });
      
      // Remove the frame association entry
      delete localCartCache.frameAssociations[frameVariantId];
    } else {
      // Clean up frame associations
      const removedAddonVariantId = removedItem.variantId;
      if (localCartCache.frameAssociations) {
        Object.keys(localCartCache.frameAssociations).forEach(frameVariantId => {
          const associations = localCartCache.frameAssociations[frameVariantId];
          if (Array.isArray(associations)) {
            localCartCache.frameAssociations[frameVariantId] = associations.filter(id => id !== removedAddonVariantId);
            if (localCartCache.frameAssociations[frameVariantId].length === 0) {
              delete localCartCache.frameAssociations[frameVariantId];
            }
          }
        });
      }
      // Just remove the single item
      localCartCache.items.splice(index, 1);
    }
    saveLocalCache();
    updateCartBadge();
    return;
  }
  
  try {
    // Get current cart to find line IDs
    const cart = await getCart(cartId);
    const lines = cart.lines.edges;
    
    // Find the Shopify line ID for the item at this index
    // We need to match by variant ID since indices might not align
    const frameVariantId = removedItem.variantId;
    let removedLineId = null;
    let removedLineIndex = -1;
    
    lines.forEach((lineEdge, idx) => {
      if (lineEdge.node.merchandise.id === frameVariantId) {
        removedLineId = lineEdge.node.id;
        removedLineIndex = idx;
      }
    });
    
    if (!removedLineId) {
      console.warn('Could not find line in Shopify cart for variant:', frameVariantId);
      // Fallback to local cache removal
      if (!removedItem.isAddon) {
        const frameVariantId = removedItem.variantId;
        localCartCache.items = localCartCache.items.filter((item, idx) => {
          if (idx === index) return false;
          if (item.isAddon) {
            const associatedFrame = item.attributes?.find(attr => 
              (attr.key === 'Associated Frame' || attr.key === 'associated frame') &&
              attr.value === frameVariantId
            );
            return !associatedFrame;
          }
          return true;
        });
      } else {
        localCartCache.items.splice(index, 1);
      }
      saveLocalCache();
      updateCartBadge();
      return;
    }
    
    // Check if this is a frame (not an addon)
    const isFrame = !removedItem.isAddon;
    
    // Collect all line IDs to remove (frame + associated add-ons)
    const lineIdsToRemove = [removedLineId];
    
    if (isFrame) {
      // Find all add-ons associated with this frame using frameAssociations
      const associatedAddonVariantIds = new Set();
      
      // Load frameAssociations if not already loaded
      if (!localCartCache.frameAssociations) {
        localCartCache.frameAssociations = {};
      }
      
      // Get associated addon variant IDs from frameAssociations
      const frameAssociations = localCartCache.frameAssociations[frameVariantId] || [];
      frameAssociations.forEach(addonVariantId => {
        associatedAddonVariantIds.add(addonVariantId);
      });
      
      // Now find the Shopify line IDs for these add-ons
      lines.forEach((lineEdge) => {
        if (associatedAddonVariantIds.has(lineEdge.node.merchandise.id)) {
          console.log(`Removing associated addon from Shopify: ${lineEdge.node.merchandise.product.title}`);
          lineIdsToRemove.push(lineEdge.node.id);
        }
      });
    }
    
    // Remove all associated lines from Shopify cart
    if (lineIdsToRemove.length > 1) {
      // Use cartLinesRemove mutation with multiple line IDs
      const data = await shopifyGraphQL(CART_LINES_REMOVE_MUTATION, {
        cartId,
        lineIds: lineIdsToRemove
      });
      
      if (data.cartLinesRemove.userErrors?.length > 0) {
        throw new Error(data.cartLinesRemove.userErrors.map(e => e.message).join(', '));
      }
    } else {
      // Single item removal
      await removeLineFromCart(cartId, removedLineId);
    }
    
    // Update local cache - remove frame and associated add-ons
    const itemsBeforeRemoval = localCartCache.items.length;
    if (isFrame) {
      // Get associated addon variant IDs from frameAssociations
      const frameAssociations = localCartCache.frameAssociations[frameVariantId] || [];
      const associatedAddonVariantIdSet = new Set(frameAssociations);
      
      // Remove frame and all associated add-ons from local cache
      localCartCache.items = localCartCache.items.filter((item, idx) => {
        // Remove the frame itself
        if (idx === index) return false;
        // If this is an addon, check if it's associated with the removed frame
        if (item.isAddon && associatedAddonVariantIdSet.has(item.variantId)) {
          return false; // Remove associated addon
        }
        return true; // Keep all other items
      });
      
      // Remove the frame association entry
      delete localCartCache.frameAssociations[frameVariantId];
    } else {
      // Just remove the single item (addon being removed directly)
      // Also clean up any frame associations that reference this addon
      const removedAddonVariantId = removedItem.variantId;
      if (localCartCache.frameAssociations) {
        Object.keys(localCartCache.frameAssociations).forEach(frameVariantId => {
          const associations = localCartCache.frameAssociations[frameVariantId];
          if (Array.isArray(associations)) {
            localCartCache.frameAssociations[frameVariantId] = associations.filter(id => id !== removedAddonVariantId);
            if (localCartCache.frameAssociations[frameVariantId].length === 0) {
              delete localCartCache.frameAssociations[frameVariantId];
            }
          }
        });
      }
      localCartCache.items.splice(index, 1);
    }
    saveLocalCache();
    updateCartBadge();
  } catch (error) {
    console.error('Error removing from cart:', error);
    // Fallback: remove from local cache
    if (!removedItem.isAddon) {
      const frameVariantId = removedItem.variantId;
      // Get associated addon variant IDs from frameAssociations
      const frameAssociations = (localCartCache.frameAssociations || {})[frameVariantId] || [];
      const associatedAddonVariantIdSet = new Set(frameAssociations);
      
      localCartCache.items = localCartCache.items.filter((item, idx) => {
        if (idx === index) return false;
        if (item.isAddon && associatedAddonVariantIdSet.has(item.variantId)) {
          return false; // Remove associated addon
        }
        return true;
      });
      
      // Remove the frame association entry
      if (localCartCache.frameAssociations) {
        delete localCartCache.frameAssociations[frameVariantId];
      }
    } else {
      // Clean up frame associations
      const removedAddonVariantId = removedItem.variantId;
      if (localCartCache.frameAssociations) {
        Object.keys(localCartCache.frameAssociations).forEach(frameVariantId => {
          const associations = localCartCache.frameAssociations[frameVariantId];
          if (Array.isArray(associations)) {
            localCartCache.frameAssociations[frameVariantId] = associations.filter(id => id !== removedAddonVariantId);
            if (localCartCache.frameAssociations[frameVariantId].length === 0) {
              delete localCartCache.frameAssociations[frameVariantId];
            }
          }
        });
      }
      localCartCache.items.splice(index, 1);
    }
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
 * Fetches fresh cart data to ensure attributes are included
 */
async function getCheckoutUrl() {
  await ensureCredentials();
  
  const cartId = getCartId();
  if (!cartId) {
    throw new Error('No cart found');
  }
  
  try {
    // Fetch fresh cart data to ensure all attributes are persisted
    const cart = await getCart(cartId);
    
    // Verify attributes are present (for debugging)
    if (cart && cart.lines && cart.lines.edges) {
      cart.lines.edges.forEach((line, index) => {
        if (line.node.attributes && line.node.attributes.length > 0) {
          console.log(`Checkout - Line ${index} has ${line.node.attributes.length} attributes:`, line.node.attributes);
        } else {
          console.warn(`Checkout - Line ${index} has NO attributes!`, line.node);
        }
      });
    }
    
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
