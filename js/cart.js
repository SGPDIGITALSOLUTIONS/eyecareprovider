/**
 * Cart Management System
 * Uses persistent cookies to store cart items between sessions
 */

// Cookie helper functions
function setCookie(name, value, days = 365) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

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

function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// Cart structure: { items: [{ variantId, productTitle, colour, price, lensOptions, attributes, imageUrl }], cartId: null }
// Initialize cart from cookie
function loadCart() {
  return getCookie('eyecare_cart') || { items: [], cartId: null };
}

let cart = loadCart();

/**
 * Add item to cart
 */
function addToLocalCart(item) {
  // Reload cart from cookie to ensure we have latest state
  cart = loadCart();
  cart.items.push(item);
  saveCart();
  updateCartBadge();
  return cart.items.length;
}

/**
 * Remove item from cart
 */
function removeFromCart(index) {
  // Reload cart from cookie to ensure we have latest state
  cart = loadCart();
  cart.items.splice(index, 1);
  saveCart();
  updateCartBadge();
}

/**
 * Clear cart
 */
function clearCart() {
  cart = { items: [], cartId: null };
  saveCart();
  updateCartBadge();
}

/**
 * Save cart to cookie
 */
function saveCart() {
  try {
    setCookie('eyecare_cart', cart, 365);
    // Debug: verify cookie was saved
    const saved = getCookie('eyecare_cart');
    if (!saved || !saved.items) {
      console.warn('Cart save verification failed');
    }
  } catch (error) {
    console.error('Error saving cart:', error);
  }
}

/**
 * Get cart item count
 */
function getCartItemCount() {
  // Reload cart from cookie to ensure we have latest state
  cart = loadCart();
  return cart.items.length;
}

/**
 * Get cart total
 */
function getCartTotal() {
  // Reload cart from cookie to ensure we have latest state
  cart = loadCart();
  return cart.items.reduce((total, item) => total + (parseFloat(item.price) || 0), 0);
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
  updateCartBadge();
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCartBadge);
} else {
  initCartBadge();
}

// Export for use in other scripts
window.CartManager = {
  add: addToLocalCart,
  remove: removeFromCart,
  clear: clearCart,
  getItems: () => {
    // Always reload from cookie to ensure latest state
    cart = loadCart();
    return cart.items;
  },
  getCount: getCartItemCount,
  getTotal: getCartTotal,
  updateBadge: updateCartBadge
};

