/**
 * Cart Page Functionality
 * Displays cart items and handles checkout
 */

// Cookie helper functions (same as cart.js)
function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)));
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

function setCookie(name, value, days = 365) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Render cart page
 */
function renderCart() {
  const container = document.getElementById('cart-container');
  if (!container) return;
  
  // Use CartManager if available, otherwise fallback to cookie
  let cartItems = [];
  let cart = { items: [], cartId: null };
  
  if (window.CartManager) {
    cartItems = window.CartManager.getItems();
    cart = { items: cartItems, cartId: getCookie('eyecare_cart')?.cartId || null };
  } else {
    cart = getCookie('eyecare_cart') || { items: [], cartId: null };
    cartItems = cart.items || [];
  }
  
  if (cartItems.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 2rem; background: white; border-radius: 12px; max-width: 600px; margin: 0 auto;">
        <h1 style="font-size: 2rem; color: #212529; margin-bottom: 1rem; font-weight: 700;">Your Cart is Empty</h1>
        <p style="font-size: 1.1rem; color: #5B6770; margin-bottom: 2rem;">Start shopping to add items to your cart.</p>
        <a href="shop.html" class="btn-primary" style="display: inline-block; padding: 0.75rem 1.5rem; background: #4b8a8a; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Continue Shopping</a>
      </div>
    `;
    return;
  }
  
  const total = cartItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
  
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 0 auto;">
      <h1 style="font-size: 2rem; color: #212529; margin-bottom: 2rem; font-weight: 700;">Shopping Cart</h1>
      
      <div style="display: grid; grid-template-columns: 1fr 400px; gap: 2rem; margin-bottom: 2rem;">
        <!-- Cart Items -->
        <div style="background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
          <h2 style="font-size: 1.5rem; color: #212529; margin-bottom: 1.5rem; font-weight: 700;">Items (${cartItems.length})</h2>
          <div id="cart-items-list">
            ${cartItems.map((item, index) => `
              <div class="cart-item" style="display: flex; gap: 1.5rem; padding: 1.5rem 0; border-bottom: 1px solid #e8ecef; ${index === cartItems.length - 1 ? 'border-bottom: none;' : ''}">
                <div style="flex-shrink: 0;">
                  ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.productTitle}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;">` : '<div style="width: 120px; height: 120px; background: #f5f5f5; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999;">No Image</div>'}
                </div>
                <div style="flex: 1;">
                  <h3 style="font-size: 1.25rem; color: #212529; margin: 0 0 0.5rem 0; font-weight: 600;">${item.productTitle}</h3>
                  <p style="color: #5B6770; margin: 0 0 0.5rem 0; font-size: 0.9rem;">Colour: ${item.colour || 'N/A'}</p>
                  <div style="margin-top: 1rem;">
                    <p style="color: #212529; font-size: 1.1rem; font-weight: 700; margin: 0;">£${item.price}</p>
                  </div>
                </div>
                <div>
                  <button class="remove-item-btn" data-index="${index}" style="background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600; transition: background 0.3s;">Remove</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Order Summary -->
        <div style="background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); height: fit-content; position: sticky; top: 2rem;">
          <h2 style="font-size: 1.5rem; color: #212529; margin-bottom: 1.5rem; font-weight: 700;">Order Summary</h2>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
            <span style="color: #5B6770;">Subtotal:</span>
            <span style="color: #212529; font-weight: 600;">£${total.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem; padding-top: 1rem; border-top: 2px solid #e8ecef;">
            <span style="color: #212529; font-weight: 600; font-size: 1.1rem;">Total:</span>
            <span style="color: #212529; font-weight: 700; font-size: 1.25rem;">£${total.toFixed(2)}</span>
          </div>
          <button id="checkout-btn" style="width: 100%; padding: 1rem; background: #4b8a8a; color: white; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: background 0.3s; margin-bottom: 1rem;">Proceed to Checkout</button>
          <a href="shop.html" style="display: block; text-align: center; color: #4b8a8a; text-decoration: none; font-weight: 600;">Continue Shopping</a>
        </div>
      </div>
    </div>
  `;
  
  // Add event listeners
  setupCartEventListeners();
}

/**
 * Setup event listeners for cart page
 */
function setupCartEventListeners() {
  // Remove item buttons
  document.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      if (window.CartManager) {
        window.CartManager.remove(index);
        renderCart();
        if (window.CartManager.updateBadge) {
          window.CartManager.updateBadge();
        }
      }
    });
  });
  
  // Checkout button
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      await proceedToCheckout();
    });
  }
}

/**
 * Proceed to Shopify checkout
 */
async function proceedToCheckout() {
  // Use CartManager if available, otherwise fallback to cookie
  let cartItems = [];
  let cart = { items: [], cartId: null };
  
  if (window.CartManager) {
    cartItems = window.CartManager.getItems();
    cart = { items: cartItems, cartId: getCookie('eyecare_cart')?.cartId || null };
  } else {
    cart = getCookie('eyecare_cart') || { items: [], cartId: null };
    cartItems = cart.items || [];
  }
  
  if (cartItems.length === 0) {
    alert('Your cart is empty.');
    return;
  }
  
  // Wait for Shopify credentials
  let attempts = 0;
  while ((!window.SHOPIFY_STORE_DOMAIN || !window.SHOPIFY_STOREFRONT_TOKEN) && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (!window.SHOPIFY_STORE_DOMAIN || !window.SHOPIFY_STOREFRONT_TOKEN) {
    alert('Shopify configuration not available. Please refresh the page.');
    return;
  }
  
  const SHOPIFY_CONFIG = {
    domain: window.SHOPIFY_STORE_DOMAIN,
    accessToken: window.SHOPIFY_STOREFRONT_TOKEN,
    apiVersion: '2025-01',
  };
  
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
  
  try {
    // Create cart with all items
    const lines = cartItems.map(item => ({
      merchandiseId: item.variantId,
      quantity: 1,
      attributes: item.attributes || []
    }));
    
    const response = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.accessToken,
      },
      body: JSON.stringify({
        query: CART_CREATE_MUTATION,
        variables: {
          input: { lines }
        },
      }),
    });
    
    const json = await response.json();
    
    if (json.errors || json.data?.cartCreate?.userErrors?.length > 0) {
      const errors = json.errors || json.data.cartCreate.userErrors;
      alert('Error creating checkout: ' + errors.map(e => e.message).join(', '));
      return;
    }
    
    const shopifyCart = json.data?.cartCreate?.cart;
    if (shopifyCart?.checkoutUrl) {
      // Store cart ID if using CartManager
      if (window.CartManager) {
        const currentCart = getCookie('eyecare_cart') || { items: cartItems, cartId: null };
        currentCart.cartId = shopifyCart.id;
        setCookie('eyecare_cart', currentCart, 365);
      } else {
        cart.cartId = shopifyCart.id;
        setCookie('eyecare_cart', cart, 365);
      }
      // Redirect to checkout
      window.location.href = shopifyCart.checkoutUrl;
    } else {
      alert('Checkout URL not available. Please try again.');
    }
  } catch (error) {
    console.error('Checkout error:', error);
    alert('Error proceeding to checkout. Please try again.');
  }
}

// Initialize cart page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderCart);
} else {
  renderCart();
}

