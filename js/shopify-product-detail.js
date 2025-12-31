/**
 * Shopify Product Detail Page
 * Handles variant selection, lens options, prescription form, and add to cart
 */

// Lens Options Configuration
const LENS_TYPES = [
  { id: 'singleVision', label: 'Single Vision', priceDelta: 0 },
  { id: 'varifocal', label: 'Varifocal', priceDelta: 50 },
  { id: 'bifocal', label: 'Bifocal', priceDelta: 30 },
];

const LENS_THICKNESS = [
  { id: 'standard', label: 'Standard', priceDelta: 0 },
  { id: 'thin', label: 'Thin', priceDelta: 25 },
  { id: 'ultraThin', label: 'Ultra Thin', priceDelta: 50 },
];

const LENS_COATINGS = [
  { id: 'none', label: 'No Coating', priceDelta: 0 },
  { id: 'ar', label: 'Anti-Reflective (AR)', priceDelta: 30 },
  { id: 'blueLight', label: 'Blue Light Filter', priceDelta: 40 },
  { id: 'transitions', label: 'Transitions (Photochromic)', priceDelta: 60 },
  { id: 'arBlueLight', label: 'AR + Blue Light', priceDelta: 65 },
];

// Shopify API Configuration
const SHOPIFY_CONFIG = {
  domain: window.SHOPIFY_STORE_DOMAIN || '',
  accessToken: window.SHOPIFY_STOREFRONT_TOKEN || '',
  apiVersion: '2025-01',
};

// GraphQL Query for Product by Handle
const PRODUCT_QUERY = `
  query getProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      descriptionHtml
      images(first: 10) {
        nodes {
          url
          altText
        }
      }
      variants(first: 100) {
        nodes {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
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
`;

// Cart Create Mutation
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

let currentProduct = null;
let selectedVariantId = '';
let selectedColour = '';
let lensOptions = {
  lensType: 'singleVision',
  thickness: 'standard',
  coatings: [],
  prescription: {}
};

/**
 * Get product handle from URL
 */
function getProductHandle() {
  const params = new URLSearchParams(window.location.search);
  return params.get('handle') || params.get('product');
}

/**
 * Fetch product from Shopify
 */
async function fetchProduct(handle) {
  if (!SHOPIFY_CONFIG.domain || !SHOPIFY_CONFIG.accessToken) {
    console.warn('Shopify credentials not configured');
    return null;
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
        query: PRODUCT_QUERY,
        variables: { handle },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    if (json.errors) {
      console.error('Shopify GraphQL errors:', json.errors);
      return null;
    }

    return json.data?.product || null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

/**
 * Calculate total price
 */
function calculateTotalPrice() {
  if (!currentProduct || !selectedVariantId) return 0;

  const variant = currentProduct.variants.nodes.find(v => v.id === selectedVariantId);
  if (!variant) return 0;

  const basePrice = parseFloat(variant.price.amount);
  
  // Add lens type price
  const lensType = LENS_TYPES.find(lt => lt.id === lensOptions.lensType);
  const lensTypePrice = lensType ? lensType.priceDelta : 0;
  
  // Add thickness price
  const thickness = LENS_THICKNESS.find(t => t.id === lensOptions.thickness);
  const thicknessPrice = thickness ? thickness.priceDelta : 0;
  
  // Add coating prices
  const coatingPrice = lensOptions.coatings.reduce((sum, coatingId) => {
    const coating = LENS_COATINGS.find(c => c.id === coatingId);
    return sum + (coating ? coating.priceDelta : 0);
  }, 0);

  return basePrice + lensTypePrice + thicknessPrice + coatingPrice;
}

/**
 * Format lens options for cart attributes
 */
function formatAttributes() {
  const attributes = [];

  // Colour
  if (selectedColour) {
    attributes.push({ key: 'Colour', value: selectedColour });
  }

  // Lens type
  const lensType = LENS_TYPES.find(lt => lt.id === lensOptions.lensType);
  if (lensType) {
    attributes.push({ key: 'Lens Type', value: lensType.label });
  }

  // Thickness
  const thickness = LENS_THICKNESS.find(t => t.id === lensOptions.thickness);
  if (thickness) {
    attributes.push({ key: 'Lens Thickness', value: thickness.label });
  }

  // Coatings
  if (lensOptions.coatings.length > 0) {
    const coatingLabels = lensOptions.coatings
      .map(id => LENS_COATINGS.find(c => c.id === id)?.label)
      .filter(Boolean);
    attributes.push({ key: 'Coatings', value: coatingLabels.join(', ') });
  }

  // Prescription
  const rx = lensOptions.prescription;
  if (rx.rightSph || rx.rightCyl) {
    const rightRx = [rx.rightSph, rx.rightCyl, rx.rightAxis].filter(Boolean).join(' / ');
    if (rightRx) attributes.push({ key: 'Right Eye (OD)', value: rightRx });
  }

  if (rx.leftSph || rx.leftCyl) {
    const leftRx = [rx.leftSph, rx.leftCyl, rx.leftAxis].filter(Boolean).join(' / ');
    if (leftRx) attributes.push({ key: 'Left Eye (OS)', value: leftRx });
  }

  if (rx.pd) {
    attributes.push({ key: 'PD (Pupillary Distance)', value: rx.pd });
  }

  if (rx.add) {
    attributes.push({ key: 'ADD', value: rx.add });
  }

  if (rx.notes) {
    attributes.push({ key: 'Prescription Notes', value: rx.notes });
  }

  return attributes;
}

/**
 * Add to cart
 */
async function addToCart() {
  if (!selectedVariantId) {
    alert('Please select a colour');
    return;
  }

  const attributes = formatAttributes();
  const endpoint = `https://${SHOPIFY_CONFIG.domain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.accessToken,
      },
      body: JSON.stringify({
        query: CART_CREATE_MUTATION,
        variables: {
          input: {
            lines: [{
              merchandiseId: selectedVariantId,
              quantity: 1,
              attributes: attributes
            }]
          }
        },
      }),
    });

    const json = await response.json();

    if (json.errors || json.data?.cartCreate?.userErrors?.length > 0) {
      const errors = json.errors || json.data.cartCreate.userErrors;
      alert('Error adding to cart: ' + errors.map(e => e.message).join(', '));
      return;
    }

    const cart = json.data?.cartCreate?.cart;
    if (cart?.checkoutUrl) {
      // Store cart ID in localStorage
      localStorage.setItem('shopify_cart_id', cart.id);
      // Redirect to checkout
      window.location.href = cart.checkoutUrl;
    } else {
      alert('Added to cart! Checkout URL not available.');
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    alert('Error adding to cart. Please try again.');
  }
}

/**
 * Render product detail page
 */
function renderProductDetail(product) {
  currentProduct = product;
  
  // Get available colours
  const colours = Array.from(
    new Set(
      product.variants.nodes
        .filter(v => v.availableForSale)
        .map(v => {
          const colourOpt = v.selectedOptions.find(opt => opt.name === 'Colour');
          return colourOpt?.value || '';
        })
        .filter(Boolean)
    )
  );

  // Set first available variant
  const firstVariant = product.variants.nodes.find(v => v.availableForSale);
  if (firstVariant) {
    selectedVariantId = firstVariant.id;
    const colourOpt = firstVariant.selectedOptions.find(opt => opt.name === 'Colour');
    if (colourOpt) {
      selectedColour = colourOpt.value;
    }
  }

  const selectedVariant = product.variants.nodes.find(v => v.id === selectedVariantId);
  const displayImage = selectedVariant?.image?.url || product.images.nodes[0]?.url || '';
  const basePrice = selectedVariant ? parseFloat(selectedVariant.price.amount) : 0;
  const totalPrice = calculateTotalPrice();

  const container = document.getElementById('product-detail-container');
  container.innerHTML = `
    <div class="product-detail-layout">
      <!-- Image Section -->
      <div class="product-detail-image">
        <div class="product-main-image">
          ${displayImage ? `<img src="${displayImage}" alt="${product.title}" id="product-main-img">` : '<div class="no-image">No Image</div>'}
        </div>
      </div>

      <!-- Product Info -->
      <div class="product-detail-info">
        <h1>${product.title}</h1>
        
        <!-- Price Display -->
        <div class="price-display">
          <div class="price-breakdown">
            <div>Frame: £${basePrice.toFixed(2)}</div>
            <div id="lens-price-display"></div>
            <div class="total-price-display">Total: £<span id="total-price">${totalPrice.toFixed(2)}</span></div>
          </div>
        </div>

        <!-- Colour Selector -->
        <div class="option-section">
          <label>Colour</label>
          <div class="colour-selector">
            ${colours.map(colour => `
              <button 
                class="colour-btn ${selectedColour === colour ? 'active' : ''}" 
                data-colour="${colour}"
                style="background-color: ${colour.toLowerCase()}; border: ${selectedColour === colour ? '3px solid #4b8a8a' : '2px solid #d7dde1'};"
                title="${colour}"
              ></button>
            `).join('')}
          </div>
        </div>

        <!-- Lens Type -->
        <div class="option-section">
          <label>Lens Type</label>
          <select id="lens-type" class="form-select">
            ${LENS_TYPES.map(type => `
              <option value="${type.id}">${type.label} ${type.priceDelta > 0 ? `(+£${type.priceDelta})` : ''}</option>
            `).join('')}
          </select>
        </div>

        <!-- Lens Thickness -->
        <div class="option-section">
          <label>Lens Thickness</label>
          <select id="lens-thickness" class="form-select">
            ${LENS_THICKNESS.map(thickness => `
              <option value="${thickness.id}">${thickness.label} ${thickness.priceDelta > 0 ? `(+£${thickness.priceDelta})` : ''}</option>
            `).join('')}
          </select>
        </div>

        <!-- Coatings -->
        <div class="option-section">
          <label>Coatings</label>
          <div class="coating-checkboxes">
            ${LENS_COATINGS.filter(c => c.id !== 'none').map(coating => `
              <label class="checkbox-label">
                <input type="checkbox" value="${coating.id}" class="coating-checkbox">
                <span>${coating.label} ${coating.priceDelta > 0 ? `(+£${coating.priceDelta})` : ''}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Prescription Form -->
        <div class="prescription-section">
          <h3>Prescription Details</h3>
          <div class="prescription-grid">
            <div class="prescription-column">
              <h4>Right Eye (OD)</h4>
              <div class="prescription-field">
                <label>SPH</label>
                <input type="text" id="right-sph" placeholder="e.g., -2.50">
              </div>
              <div class="prescription-field">
                <label>CYL</label>
                <input type="text" id="right-cyl" placeholder="e.g., -0.75">
              </div>
              <div class="prescription-field">
                <label>AXIS</label>
                <input type="text" id="right-axis" placeholder="e.g., 180">
              </div>
            </div>
            <div class="prescription-column">
              <h4>Left Eye (OS)</h4>
              <div class="prescription-field">
                <label>SPH</label>
                <input type="text" id="left-sph" placeholder="e.g., -2.50">
              </div>
              <div class="prescription-field">
                <label>CYL</label>
                <input type="text" id="left-cyl" placeholder="e.g., -0.75">
              </div>
              <div class="prescription-field">
                <label>AXIS</label>
                <input type="text" id="left-axis" placeholder="e.g., 180">
              </div>
            </div>
          </div>
          <div class="prescription-additional">
            <div class="prescription-field">
              <label>PD (Pupillary Distance)</label>
              <input type="text" id="pd" placeholder="e.g., 62">
            </div>
            <div class="prescription-field" id="add-field" style="display: none;">
              <label>ADD</label>
              <input type="text" id="add" placeholder="e.g., +2.00">
            </div>
            <div class="prescription-field full-width">
              <label>Notes</label>
              <textarea id="prescription-notes" placeholder="Any additional prescription notes..." rows="3"></textarea>
            </div>
          </div>
        </div>

        <!-- Add to Cart Button -->
        <button id="add-to-cart-btn" class="add-to-cart-button">Add to Cart</button>
      </div>
    </div>
  `;

  // Set up event listeners
  setupEventListeners();
  updatePriceDisplay();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Colour selection
  document.querySelectorAll('.colour-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const colour = btn.dataset.colour;
      const variant = currentProduct.variants.nodes.find(v => 
        v.availableForSale &&
        v.selectedOptions.find(opt => opt.name === 'Colour' && opt.value === colour)
      );
      
      if (variant) {
        selectedVariantId = variant.id;
        selectedColour = colour;
        
        // Update UI
        document.querySelectorAll('.colour-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        btn.style.border = '3px solid #4b8a8a';
        
        // Update image
        const img = document.getElementById('product-main-img');
        if (variant.image?.url && img) {
          img.src = variant.image.url;
        }
        
        updatePriceDisplay();
      }
    });
  });

  // Lens type change
  document.getElementById('lens-type')?.addEventListener('change', (e) => {
    lensOptions.lensType = e.target.value;
    updatePriceDisplay();
    
    // Show/hide ADD field for varifocal/bifocal
    const addField = document.getElementById('add-field');
    if (addField) {
      addField.style.display = (e.target.value === 'varifocal' || e.target.value === 'bifocal') ? 'block' : 'none';
    }
  });

  // Lens thickness change
  document.getElementById('lens-thickness')?.addEventListener('change', (e) => {
    lensOptions.thickness = e.target.value;
    updatePriceDisplay();
  });

  // Coating checkboxes
  document.querySelectorAll('.coating-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        lensOptions.coatings.push(e.target.value);
      } else {
        lensOptions.coatings = lensOptions.coatings.filter(id => id !== e.target.value);
      }
      updatePriceDisplay();
    });
  });

  // Prescription inputs
  ['right-sph', 'right-cyl', 'right-axis', 'left-sph', 'left-cyl', 'left-axis', 'pd', 'add', 'prescription-notes'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', (e) => {
        const field = id.replace('right-', '').replace('left-', '').replace('prescription-', '');
        if (id.startsWith('right-')) {
          lensOptions.prescription[`right${field.charAt(0).toUpperCase() + field.slice(1)}`] = e.target.value;
        } else if (id.startsWith('left-')) {
          lensOptions.prescription[`left${field.charAt(0).toUpperCase() + field.slice(1)}`] = e.target.value;
        } else {
          lensOptions.prescription[field] = e.target.value;
        }
      });
    }
  });

  // Add to cart button
  document.getElementById('add-to-cart-btn')?.addEventListener('click', addToCart);
}

/**
 * Update price display
 */
function updatePriceDisplay() {
  const totalPrice = calculateTotalPrice();
  const basePrice = currentProduct?.variants.nodes.find(v => v.id === selectedVariantId) 
    ? parseFloat(currentProduct.variants.nodes.find(v => v.id === selectedVariantId).price.amount) 
    : 0;
  
  const lensPrice = totalPrice - basePrice;
  
  const lensPriceDisplay = document.getElementById('lens-price-display');
  if (lensPriceDisplay) {
    if (lensPrice > 0) {
      lensPriceDisplay.innerHTML = `<div>Lenses: +£${lensPrice.toFixed(2)}</div>`;
    } else {
      lensPriceDisplay.innerHTML = '';
    }
  }
  
  const totalPriceDisplay = document.getElementById('total-price');
  if (totalPriceDisplay) {
    totalPriceDisplay.textContent = totalPrice.toFixed(2);
  }
}

/**
 * Initialize page
 */
async function initProductDetail() {
  // Wait for credentials
  let attempts = 0;
  while ((!window.SHOPIFY_STORE_DOMAIN || !window.SHOPIFY_STOREFRONT_TOKEN) && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  SHOPIFY_CONFIG.domain = window.SHOPIFY_STORE_DOMAIN || '';
  SHOPIFY_CONFIG.accessToken = window.SHOPIFY_STOREFRONT_TOKEN || '';

  const handle = getProductHandle();
  if (!handle) {
    document.getElementById('product-detail-container').innerHTML = `
      <div class="product-error">
        <p>Product not found. Please select a product from the shop.</p>
        <a href="shop.html" class="btn-primary">Back to Shop</a>
      </div>
    `;
    return;
  }

  const product = await fetchProduct(handle);
  if (!product) {
    document.getElementById('product-detail-container').innerHTML = `
      <div class="product-error">
        <p>Product not found or error loading product.</p>
        <a href="shop.html" class="btn-primary">Back to Shop</a>
      </div>
    `;
    return;
  }

  renderProductDetail(product);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductDetail);
} else {
  initProductDetail();
}

