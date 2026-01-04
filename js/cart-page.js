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
  
  // Get cart items from CartManager
  let cartItems = [];
  if (window.CartManager) {
    cartItems = window.CartManager.getItems();
  } else {
    // Fallback: try to load from old cookie system
    cartItems = getCookie('eyecare_cart')?.items || [];
  }
  
  // Debug: Log each frame's attributes to verify they're unique
  console.log(`Rendering cart with ${cartItems.length} items:`);
  cartItems.forEach((item, index) => {
    if (!item.isAddon) {
      console.log(`Frame ${index}: "${item.productTitle}" - ${item.attributes?.length || 0} attribute(s):`, item.attributes);
    }
  });
  
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
                ${!item.isAddon ? `
                <div style="flex-shrink: 0;">
                  ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.productTitle}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;">` : '<div style="width: 120px; height: 120px; background: #f5f5f5; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999;">No Image</div>'}
                </div>
                ` : ''}
                <div style="flex: 1;">
                  <h3 style="font-size: 1.25rem; color: #212529; margin: 0 0 0.5rem 0; font-weight: 600;">${item.productTitle || 'Product'}</h3>
                  ${item.isAddon ? '' : `<p style="color: #5B6770; margin: 0 0 0.5rem 0; font-size: 0.9rem;">Colour: ${item.colour || 'N/A'}</p>`}
                  ${item.attributes && item.attributes.length > 0 && !item.isAddon ? (() => {
                    // Only show attributes for frame items, not for addon items
                    // For frame items, show all attributes except internal ones
                    const displayableAttributes = item.attributes.filter(attr => {
                      const key = attr.key.toLowerCase();
                      // Hide only internal/system attributes, show all lens and prescription info
                      if (key === 'associated frame') {
                        return false;
                      }
                      return true;
                    });
                    
                    if (displayableAttributes.length > 0) {
                      return `
                        <div style="margin: 0.5rem 0; font-size: 0.85rem; color: #6C757D; line-height: 1.6;">
                          ${displayableAttributes.map(attr => 
                            `<div style="margin-bottom: 0.25rem;"><strong>${attr.key}:</strong> ${attr.value}</div>`
                          ).join('')}
                        </div>
                      `;
                    }
                    return '';
                  })() : ''}
                  <div style="margin-top: 1rem;">
                    <p style="color: #212529; font-size: 1.1rem; font-weight: 700; margin: 0;">£${item.price || '0.00'}</p>
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
          <button id="checkout-btn" style="width: 100%; padding: 1rem; background: #4b8a8a; color: white; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: background 0.3s; margin-bottom: 0.75rem;">Proceed to Checkout</button>
          <button id="clear-cart-btn" style="width: 100%; padding: 0.75rem; background: #dc3545; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.3s; margin-bottom: 0.75rem;">Clear Cart</button>
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
    btn.addEventListener('click', async (e) => {
      const index = parseInt(e.target.dataset.index);
      if (window.CartManager) {
        try {
          await window.CartManager.remove(index);
          renderCart();
          if (window.CartManager.updateBadge) {
            window.CartManager.updateBadge();
          }
        } catch (error) {
          console.error('Error removing item:', error);
          alert('Error removing item: ' + error.message);
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
  
  // Clear cart button
  const clearCartBtn = document.getElementById('clear-cart-btn');
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear your cart? This action cannot be undone.')) {
        try {
          if (window.CartManager) {
            await window.CartManager.clear();
            renderCart(); // Re-render to show empty cart message
            if (window.CartManager.updateBadge) {
              window.CartManager.updateBadge();
            }
          }
        } catch (error) {
          console.error('Error clearing cart:', error);
          alert('Error clearing cart: ' + error.message);
        }
      }
    });
  }
}

/**
 * Proceed to Shopify checkout
 */
async function proceedToCheckout() {
  if (!window.CartManager) {
    alert('Cart system not available. Please refresh the page.');
    return;
  }
  
  const cartItems = window.CartManager.getItems();
  
  if (cartItems.length === 0) {
    alert('Your cart is empty.');
    return;
  }
  
  try {
    // Get checkout URL from Shopify cart
    const checkoutUrl = await window.CartManager.getCheckoutUrl();
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    } else {
      alert('Checkout URL not available. Please try again.');
    }
  } catch (error) {
    console.error('Checkout error:', error);
    alert('Error proceeding to checkout: ' + error.message + '. Please try again.');
  }
}

// Initialize cart page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderCart);
} else {
  renderCart();
}

