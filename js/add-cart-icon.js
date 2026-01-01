/**
 * Add cart icon to navigation on all pages
 * This script should be included after cart.js
 */

function addCartIconToNavigation() {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;
  
  // Check if cart icon already exists
  if (document.querySelector('.cart-icon')) return;
  
  // Find the Contact link to insert before it
  const contactLink = Array.from(navLinks.children).find(link => 
    link.textContent.includes('Contact') && !link.classList.contains('cta-nav')
  );
  
  const cartIconHTML = `
    <a href="cart.html" class="nav-item cart-icon" style="position: relative; display: flex; align-items: center;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
      <span id="cart-badge" class="cart-badge" style="display: none; position: absolute; top: -8px; right: -8px; background: #dc3545; color: white; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; font-weight: 700; align-items: center; justify-content: center;">0</span>
    </a>
  `;
  
  if (contactLink) {
    contactLink.insertAdjacentHTML('beforebegin', cartIconHTML);
  } else {
    // If no contact link found, add before the CTA button
    const ctaLink = document.querySelector('.cta-nav');
    if (ctaLink) {
      ctaLink.insertAdjacentHTML('beforebegin', cartIconHTML);
    } else {
      navLinks.insertAdjacentHTML('beforeend', cartIconHTML);
    }
  }
  
  // Update badge after adding icon
  if (window.CartManager && window.CartManager.updateBadge) {
    window.CartManager.updateBadge();
  }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addCartIconToNavigation);
} else {
  addCartIconToNavigation();
}

