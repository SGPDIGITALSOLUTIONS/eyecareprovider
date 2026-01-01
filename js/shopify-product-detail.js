/**
 * Shopify Product Detail Page
 * Handles variant selection, lens options, prescription form, and add to cart
 */

// Lens Options Configuration
// Currently only Single Vision lenses are available
const LENS_OPTIONS = {
  type: [
    { code: 'SV', label: 'Single Vision' },
  ],
  // Step 2: Combined thickness + coating options
  lensConfigs: [
    { code: '1.5_HC', label: '1.5 Hard Coat', thickness: '1.50', coating: 'HC', price: 0 },
    { code: '1.5_MAR', label: '1.5 MAR', thickness: '1.50', coating: 'AR', price: 40 },
    { code: '1.5_MAR_BLUE', label: '1.5 MAR Blue', thickness: '1.50', coating: 'BLUE AR', price: 50 },
    { code: '1.6_MAR', label: '1.6 with MAR', thickness: '1.60', coating: 'AR', price: 60 },
    { code: '1.67_MAR', label: '1.67 with MAR', thickness: '1.67', coating: 'AR', price: 100 },
    { code: '1.74_MAR', label: '1.74 with MAR', thickness: '1.74', coating: 'AR', price: 140 },
  ],
  // Step 3: Transitions options
  transitions: [
    { code: 'TRANS_GREY', label: 'Transitions Grey', price: 79 },
    { code: 'TRANS_BROWN', label: 'Transitions Brown', price: 79 },
  ],
};

// Single Vision pricing structure
// Base prices for index + coating combinations
const SV_BASE_PRICES = {
  '1.50': {
    'HC': 0,
    'AR': 40,
    'BLUE AR': 50,
  },
  '1.60': {
    'AR': 60,
  },
  '1.67': {
    'AR': 100,
  },
  '1.74': {
    'AR': 140,
  },
};

// Photochromic add-on price
const PHOTOCHROMIC_ADDON = 79;

// Backward compatibility aliases (for Next.js app compatibility)
const LENS_TYPES = LENS_OPTIONS.type.map(t => ({ id: t.code.toLowerCase(), label: t.label, priceDelta: 0, code: t.code }));
const LENS_THICKNESS = LENS_OPTIONS.lensConfigs.map(c => ({ id: c.thickness, label: c.label, priceDelta: c.price, code: c.thickness }));
const LENS_COATINGS = [
  { id: 'none', label: 'No Coating', priceDelta: 0, code: '' },
  { id: 'hc', label: 'Hard Coat', priceDelta: 0, code: 'HC' },
  { id: 'ar', label: 'Anti-Reflective', priceDelta: 0, code: 'AR' },
  { id: 'blue_ar', label: 'Blue Light Anti-Reflective', priceDelta: 0, code: 'BLUE AR' },
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

// Cart Create Mutation (removed - using CartManager from cart.js instead)
// const CART_CREATE_MUTATION = `...`; // Moved to cart.js

let currentProduct = null;
let selectedVariantId = '';
let selectedColour = '';
let currentBasePrice = 0;
let lensOptions = {
  lensType: 'SV', // Only Single Vision available
  lensConfig: '1.5_HC', // Selected lens configuration from Step 2
  transitions: null, // Selected transitions: 'TRANS_GREY', 'TRANS_BROWN', or null
  prescription: {
    r_sph: '',
    r_cyl: '',
    r_axis: '',
    l_sph: '',
    l_cyl: '',
    l_axis: '',
    pd: '',
    add: '',
    notes: ''
  }
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
 * Get base price for a lens type (at 1.5 index with HC coating) for display purposes
 */
function getBaseLensPrice(lensTypeCode) {
  if (lensTypeCode === 'SV') {
    return SV_BASE_PRICES['1.50']['HC'] || 0;
  }
  return 0;
}

/**
 * Calculate lens price for Single Vision lenses
 * Pricing structure:
 * - Base price from selected lens config (Step 2)
 * - Add £79 if transitions selected (Step 3)
 */
function calculateLensPrice() {
  // Find selected lens configuration
  const selectedConfig = LENS_OPTIONS.lensConfigs.find(c => c.code === lensOptions.lensConfig);
  if (!selectedConfig) {
    return 0;
  }
  
  let price = selectedConfig.price;
  
  // Add transitions if selected (not available with 1.74 or MAR Blue)
  if (lensOptions.transitions) {
    const is174 = selectedConfig.thickness === '1.74';
    const isBlue = selectedConfig.coating === 'BLUE AR';
    if (!is174 && !isBlue) {
      price += PHOTOCHROMIC_ADDON;
    }
  }
  
  return price;
}

/**
 * Calculate lens price for Single Vision lenses
 * Pricing structure:
 * - SV 1.5 HC = £0
 * - SV 1.5 MAR (AR) = £40
 * - SV 1.5 MAR Blue = £50
 * - SV 1.6 MAR = £60
 * - SV 1.67 MAR = £100
 * - SV 1.74 MAR = £140
 * - Photochromic adds £79 (not available with MAR Blue or 1.74)
 */
function calculateLensPriceForConfig(options = null) {
  const opts = options || lensOptions;
  const selectedConfig = LENS_OPTIONS.lensConfigs.find(c => c.code === opts.lensConfig);
  if (!selectedConfig) {
    return 0;
  }
  
  let price = selectedConfig.price;
  
  // Add transitions if selected (not available with 1.74 or MAR Blue)
  if (opts.transitions) {
    const is174 = selectedConfig.thickness === '1.74';
    const isBlue = selectedConfig.coating === 'BLUE AR';
    if (!is174 && !isBlue) {
      price += PHOTOCHROMIC_ADDON;
    }
  }
  
  return price;
}

/**
 * Calculate total price (frame + lenses)
 */
function calculateTotalPrice() {
  if (!currentProduct || !selectedVariantId) return 0;

  const variant = currentProduct.variants.nodes.find(v => v.id === selectedVariantId);
  if (!variant) return 0;

  const basePrice = parseFloat(variant.price.amount);
  const lensPrice = calculateLensPrice();

  return basePrice + lensPrice;
}

/**
 * Format attributes for cart (only colour, no lens options)
 */
function formatAttributes() {
  const attributes = [];

  // Colour
  if (selectedColour) {
    attributes.push({ key: 'Colour', value: selectedColour });
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

  // Store product data for prescription page
  const selectedVariant = currentProduct.variants.nodes.find(v => v.id === selectedVariantId);
  const productImage = selectedVariant?.image?.url || currentProduct.images.nodes[0]?.url || '';
  sessionStorage.setItem('productTitle', currentProduct.title);
  sessionStorage.setItem('productImage', productImage);
  sessionStorage.setItem('basePrice', currentBasePrice.toString());
  sessionStorage.setItem('totalPrice', calculateTotalPrice().toString());
  sessionStorage.setItem('selectedVariantId', selectedVariantId);
  sessionStorage.setItem('selectedColour', selectedColour);
  sessionStorage.setItem('lensOptions', JSON.stringify(lensOptions));
  
  // Navigate to prescription page
  window.location.href = 'prescription.html';
}

/**
 * Determine which lens illustration image to display based on current selection
 * @param {Object} selectedConfig - The selected lens configuration
 * @param {string|null} transitions - Selected transitions option (TRANS_GREY, TRANS_BROWN, or null)
 * @returns {string} Path to the appropriate illustration image
 */
function getLensIllustrationPath(selectedConfig, transitions) {
  if (!selectedConfig) {
    return 'assets/images/gallery/lens_option_1.png'; // Default to Hard Coat
  }
  
  // Check if transitions are selected and valid
  const hasTransitions = transitions !== null;
  const transitionsDisabled = selectedConfig.thickness === '1.74' || selectedConfig.coating === 'BLUE AR';
  
  // If transitions are selected and valid, show transitions illustration
  if (hasTransitions && !transitionsDisabled) {
    return 'assets/images/gallery/lens_option_5.png'; // Transitions
  }
  
  // If transitions are selected but disabled, show "not available" illustration
  if (hasTransitions && transitionsDisabled) {
    return 'assets/images/gallery/lens_option_6.png'; // Transitions Not Available
  }
  
  // Map lens configurations to illustrations
  switch (selectedConfig.code) {
    case '1.5_HC':
      return 'assets/images/gallery/lens_option_1.png'; // Hard Coat
    case '1.5_MAR':
      return 'assets/images/gallery/lens_option_2.png'; // MAR (Anti-Reflective)
    case '1.5_MAR_BLUE':
      return 'assets/images/gallery/lens_option_3.png'; // MAR Blue
    case '1.6_MAR':
    case '1.67_MAR':
    case '1.74_MAR':
      return 'assets/images/gallery/lens_option_4.png'; // Thinner, Lighter Lenses (1.6, 1.67, 1.74)
    default:
      return 'assets/images/gallery/lens_option_1.png'; // Default fallback
  }
}

/**
 * Update the lens illustration in the right panel
 */
function updateLensIllustration() {
  const container = document.getElementById('lens-illustration-container');
  if (!container) return;
  
  const selectedConfig = LENS_OPTIONS.lensConfigs.find(c => c.code === lensOptions.lensConfig);
  const imagePath = getLensIllustrationPath(selectedConfig, lensOptions.transitions);
  
  container.innerHTML = `<img src="${imagePath}" alt="Lens option illustration" style="max-width: 100%; height: auto; border-radius: 8px;" />`;
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
  currentBasePrice = selectedVariant ? parseFloat(selectedVariant.price.amount) : 0;
  const basePrice = currentBasePrice;
  
  // Calculate initial total price
  const totalPrice = calculateTotalPrice();

  // Get all variants with their images and color info
  const variantThumbnails = product.variants.nodes
    .filter(v => v.availableForSale)
    .map(v => {
      const colourOpt = v.selectedOptions.find(opt => opt.name === 'Colour');
      return {
        id: v.id,
        colour: colourOpt?.value || '',
        image: v.image?.url || product.images.nodes[0]?.url || '',
        title: v.title
      };
    });

  const container = document.getElementById('product-detail-container');
  if (!container) {
    console.error('Product detail container not found');
    return;
  }
  
  // Check if mobile
  const isMobile = window.innerWidth <= 968;
  const imageLayoutStyle = isMobile 
    ? 'display: grid !important; grid-template-columns: 1fr !important; gap: 1.5rem !important; align-items: start !important; position: static !important;'
    : 'display: grid !important; grid-template-columns: 1fr 200px !important; gap: 2rem !important; align-items: start !important; position: sticky !important; top: 2rem !important; height: fit-content !important;';
  
  const sidebarStyle = isMobile
    ? 'width: 100% !important;'
    : 'width: 200px !important; flex-shrink: 0 !important;';
  
  const thumbnailsStyle = isMobile
    ? 'display: grid !important; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important; gap: 0.75rem !important;'
    : 'display: flex !important; flex-direction: row !important; gap: 0.75rem !important; flex-wrap: wrap !important; justify-content: flex-start !important;';
  
  const thumbnailsContainerStyle = isMobile
    ? 'width: 100% !important;'
    : 'width: 100% !important; max-width: 500px !important;';
  
  const thumbnailButtonWidth = isMobile ? '100%' : '120px';
  
  container.innerHTML = `
    <div class="product-detail-layout" style="padding-top: 2rem !important;">
      <!-- Breadcrumb Navigation -->
      <div class="product-breadcrumb" style="margin-bottom: 1.5rem !important; font-size: 0.875rem !important; color: #6C757D !important; grid-column: 1 / -1 !important;">
        <a href="shop.html" style="color: #4b8a8a !important; text-decoration: none !important; transition: color 0.2s !important;" onmouseover="this.style.color='#3a6f6f'" onmouseout="this.style.color='#4b8a8a'">All glasses</a>
        <span style="margin: 0 0.5rem !important; color: #6C757D !important;">></span>
        <span style="color: #212529 !important; font-weight: 500 !important;">${product.title}</span>
      </div>
      
      <!-- Image Section -->
      <div class="product-detail-image" style="${imageLayoutStyle}">
        <!-- Main Image on Left -->
        <div class="product-main-image-wrapper" style="display: flex !important; flex-direction: column !important; align-items: flex-start !important; justify-content: flex-start !important; width: 100% !important;">
          <div class="product-main-image" style="width: 100% !important; aspect-ratio: 1 !important; max-height: 500px !important; background: linear-gradient(135deg, #f8fbfc 0%, #f5f7f9 50%, #ffffff 100%) !important; border-radius: 16px !important; overflow: hidden !important; display: flex !important; align-items: center !important; justify-content: center !important; border: 1px solid #e8ecef !important; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04) !important; margin-bottom: 2rem !important; padding: 2rem !important;">
            ${displayImage ? `<img src="${displayImage}" alt="${product.title}" id="product-main-img" style="width: 100%; height: 100%; object-fit: contain; padding: 0; transition: opacity 0.3s ease; filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));">` : '<div class="no-image">No Image</div>'}
          </div>
          <div style="margin-bottom: 0.5rem !important;">
            <label class="variant-thumbnails-label" style="display: block !important; font-weight: 600 !important; color: #5B6770 !important; margin-bottom: 0.25rem !important; font-size: 0.85rem !important; text-transform: uppercase !important; letter-spacing: 0.5px !important; width: 100% !important;">Select Colour</label>
            <p style="font-size: 0.8rem !important; color: #6C757D !important; margin: 0 0 0.75rem 0 !important; font-style: italic !important;">Shown in ${selectedColour || variantThumbnails[0]?.colour || 'selected colour'}</p>
          </div>
          <div class="variant-thumbnails-vertical" style="${thumbnailsStyle} ${thumbnailsContainerStyle}">
            ${variantThumbnails.map(variant => {
              const isActive = variant.id === selectedVariantId;
              const thumbnailButtonStyle = `width: ${thumbnailButtonWidth} !important; ${!isMobile ? 'flex: 0 0 120px !important;' : ''} padding: 0.75rem !important; background: white !important; border: ${isActive ? '3px' : '2px'} solid ${isActive ? '#4b8a8a' : '#d7dde1'} !important; border-radius: 8px !important; cursor: pointer !important; display: flex !important; flex-direction: column !important; align-items: center !important; text-align: center !important; position: relative !important; overflow: hidden !important; margin-bottom: 0 !important; transition: all 0.2s !important; ${isActive ? 'transform: scale(1.05) !important; box-shadow: 0 4px 12px rgba(75, 138, 138, 0.2) !important;' : ''}`;
              return `
                <button 
                  class="variant-thumbnail ${isActive ? 'active' : ''}" 
                  data-variant-id="${variant.id}"
                  data-colour="${variant.colour}"
                  type="button"
                  data-is-active="${isActive}"
                  style="${thumbnailButtonStyle}"
                  onmouseover="if(this.getAttribute('data-is-active') !== 'true') { this.style.borderColor='#4b8a8a'; this.style.transform='scale(1.02)'; this.style.boxShadow='0 2px 8px rgba(75, 138, 138, 0.15)'; }"
                  onmouseout="if(this.getAttribute('data-is-active') !== 'true') { this.style.borderColor='#d7dde1'; this.style.transform='scale(1)'; this.style.boxShadow='none'; }"
                >
                  <div class="variant-thumbnail-image" style="width: 100% !important; aspect-ratio: 1 !important; background: linear-gradient(135deg, #f8fbfc 0%, #ffffff 100%) !important; border-radius: 6px !important; overflow: hidden !important; margin-bottom: 0.5rem !important; display: flex !important; align-items: center !important; justify-content: center !important; border: 1px solid #e8ecef !important;">
                    <img src="${variant.image}" alt="${variant.colour}" loading="lazy" style="width: 100%; height: 100%; object-fit: contain; padding: 0.3rem;">
                  </div>
                  <div class="variant-thumbnail-info" style="display: flex !important; flex-direction: column !important; gap: 0.2rem !important; width: 100% !important;">
                    <span class="variant-thumbnail-name" style="font-weight: 600 !important; color: #5B6770 !important; font-size: 0.75rem !important; line-height: 1.2 !important;">${variant.colour}</span>
                    ${variant.title && variant.title !== variant.colour ? `<span class="variant-thumbnail-model" style="font-weight: 400 !important; color: #6C757D !important; font-size: 0.65rem !important; line-height: 1.2 !important;">${variant.title}</span>` : ''}
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </div>
        
        <!-- Right Sidebar: Frame Name + Description -->
        <div class="variant-thumbnails-sidebar" style="${sidebarStyle}">
          <h2 class="product-title-sidebar" style="font-size: 1.95rem !important; color: #212529 !important; margin: 0 0 2rem 0 !important; font-weight: 700 !important; line-height: 1.2 !important; letter-spacing: -0.02em !important;">${product.title}</h2>
          ${product.descriptionHtml ? `
            <div class="product-description" style="width: 100% !important; padding: 1.25rem !important; background: #FAFBFC !important; border-radius: 12px !important; border: 1px solid #E9ECEF !important; margin-top: 0 !important;">
              <h3 style="font-size: 0.95rem !important; font-weight: 600 !important; color: #6C757D !important; margin: 0 0 1rem 0 !important; text-transform: uppercase !important; letter-spacing: 0.5px !important;">About this frame</h3>
              <div style="font-size: 0.875rem !important; color: #5B6770 !important; line-height: 1.6 !important;">
                ${product.descriptionHtml}
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Product Info -->
      <div class="product-detail-info">
        <!-- Progress Indicator -->
        <div class="progress-indicator" style="display: flex; align-items: center; gap: 1rem; margin: 3rem 0 2.5rem 0; padding: 2rem 0 1.5rem 0; border-bottom: 2px solid #E9ECEF; justify-content: center;">
          <div class="progress-step active" style="display: flex; align-items: center; gap: 0.5rem; flex: 0 1 auto;">
            <div class="step-number" style="width: 36px; height: 36px; border-radius: 50%; background: #4b8a8a; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.9rem; flex-shrink: 0; box-shadow: 0 2px 8px rgba(75, 138, 138, 0.3);">1</div>
            <div class="step-label" style="font-size: 0.9rem; color: #212529; font-weight: 600;">Choose your lenses</div>
          </div>
          <div class="progress-line" style="height: 2px; background: linear-gradient(to right, #4b8a8a 0%, #E9ECEF 100%); flex: 0 1 80px; max-width: 80px; margin: 0 0.5rem;"></div>
          <div class="progress-step" style="display: flex; align-items: center; gap: 0.5rem; flex: 0 1 auto;">
            <div class="step-number" style="width: 32px; height: 32px; border-radius: 50%; background: #E9ECEF; color: #6C757D; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem; flex-shrink: 0;">2</div>
            <div class="step-label" style="font-size: 0.875rem; color: #6C757D;">Enter prescription</div>
          </div>
          <div class="progress-line" style="height: 2px; background: #E9ECEF; flex: 0 1 80px; max-width: 80px; margin: 0 0.5rem;"></div>
          <div class="progress-step" style="display: flex; align-items: center; gap: 0.5rem; flex: 0 1 auto;">
            <div class="step-number" style="width: 32px; height: 32px; border-radius: 50%; background: #E9ECEF; color: #6C757D; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem; flex-shrink: 0;">3</div>
            <div class="step-label" style="font-size: 0.875rem; color: #6C757D;">Review & checkout</div>
          </div>
        </div>
        <p style="text-align: center; font-size: 0.85rem; color: #6C757D; margin: -1.5rem 0 2rem 0; font-style: italic;">You'll enter your prescription next — it takes about 2 minutes.</p>

        <!-- Lens Configuration Layout -->
        <div class="lens-config-layout" style="display: grid; grid-template-columns: ${isMobile ? '1fr' : '1fr 380px'}; gap: 2rem; align-items: start;">
          <!-- Left: Lens Selection Steps -->
          <div class="lens-selection-steps">
            <!-- Lens Type Selection -->
            <div class="config-section" style="margin-bottom: 2.5rem;">
              <h3 class="section-title" style="font-size: 1.25rem; color: #212529; margin: 0 0 1rem 0; font-weight: 700;">Step 1: Lens Type</h3>
              <p class="section-subtitle" style="font-size: 0.9rem; color: #6C757D; margin: 0 0 1.5rem 0;">Your lens type has been selected</p>
              <div class="lens-type-cards" style="display: flex; gap: 1rem;">
                ${LENS_OPTIONS.type.map(type => {
                  return `
                    <div 
                      class="lens-type-card selected" 
                      style="background: #F8F9FA; border: 2px solid #4b8a8a; border-radius: 12px; padding: 1.5rem; text-align: left; position: relative; box-shadow: 0 4px 12px rgba(75, 138, 138, 0.15); flex: 1; max-width: 300px; opacity: 1; cursor: default;"
                    >
                      <div style="position: absolute; top: 0.75rem; right: 0.75rem; width: 24px; height: 24px; background: #4b8a8a; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem;">✓</div>
                      <div style="font-size: 1.1rem; font-weight: 600; color: #212529; margin-bottom: 0.5rem;">${type.label}</div>
                      <div style="font-size: 0.875rem; color: #6C757D; margin-bottom: 0.75rem; line-height: 1.4;">
                        Clear vision at one distance
                      </div>
                      <div style="font-size: 1rem; font-weight: 700; color: #212529; margin-bottom: 0.75rem;">
                        Included
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
              <p style="font-size: 0.85rem; color: #6C757D; margin: 1rem 0 0 0; font-style: italic; line-height: 1.5;">
                Currently available for single vision prescriptions only.
              </p>
            </div>

            <!-- Step 2: Choose Lens Configuration -->
            <div class="config-section" style="margin-bottom: 2.5rem;">
              <h3 class="section-title" style="font-size: 1.25rem; color: #212529; margin: 0 0 1rem 0; font-weight: 700;">Step 2: Choose Your Lens</h3>
              <p class="section-subtitle" style="font-size: 0.9rem; color: #6C757D; margin: 0 0 1.5rem 0;">Choose your lens thickness and coating combination</p>
              
              <!-- Standard thickness (1.5) group -->
              <div style="margin-bottom: 1.5rem;">
                <h4 style="font-size: 0.875rem; font-weight: 600; color: #6C757D; margin: 0 0 0.75rem 0; text-transform: uppercase; letter-spacing: 0.5px;">Standard thickness (1.5)</h4>
                <div class="lens-config-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
                  ${LENS_OPTIONS.lensConfigs.filter(c => c.thickness === '1.50').map(config => {
                    const isSelected = lensOptions.lensConfig === config.code;
                    const displayLabel = config.code === '1.5_HC' ? 'Hard Coat' : config.code === '1.5_MAR' ? 'MAR' : 'MAR Blue';
                    return `
                      <button 
                        class="lens-config-card ${isSelected ? 'selected' : ''}" 
                        data-lens-config="${config.code}"
                        style="background: white; border: 2px solid ${isSelected ? '#4b8a8a' : '#E9ECEF'}; border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all 0.2s; text-align: center; position: relative; box-shadow: ${isSelected ? '0 4px 12px rgba(75, 138, 138, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)'};"
                        onmouseover="if(!this.classList.contains('selected')) { this.style.borderColor='#4b8a8a'; this.style.boxShadow='0 4px 12px rgba(75, 138, 138, 0.1)'; }"
                        onmouseout="if(!this.classList.contains('selected')) { this.style.borderColor='#E9ECEF'; this.style.boxShadow='0 2px 4px rgba(0, 0, 0, 0.05)'; }"
                      >
                        ${isSelected ? '<div style="position: absolute; top: 0.75rem; right: 0.75rem; width: 24px; height: 24px; background: #4b8a8a; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem;">✓</div>' : ''}
                        <div style="font-size: 1.1rem; font-weight: 600; color: #212529; margin-bottom: 0.5rem;">${displayLabel}</div>
                        <div style="font-size: 0.9rem; font-weight: 700; color: #212529;">
                          ${config.price === 0 ? 'Included' : `+£${config.price}`}
                        </div>
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>
              
              <!-- Thinner options -->
              <div>
                <h4 style="font-size: 0.875rem; font-weight: 600; color: #6C757D; margin: 0 0 0.75rem 0; text-transform: uppercase; letter-spacing: 0.5px;">Thinner lenses</h4>
                <div class="lens-config-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
                  ${LENS_OPTIONS.lensConfigs.filter(c => c.thickness !== '1.50').map(config => {
                    const isSelected = lensOptions.lensConfig === config.code;
                    const recommendation = config.thickness === '1.60' || config.thickness === '1.67' ? 'Recommended for stronger prescriptions' : '';
                    return `
                      <button 
                        class="lens-config-card ${isSelected ? 'selected' : ''}" 
                        data-lens-config="${config.code}"
                        style="background: white; border: 2px solid ${isSelected ? '#4b8a8a' : '#E9ECEF'}; border-radius: 12px; padding: 1.5rem; cursor: pointer; transition: all 0.2s; text-align: center; position: relative; box-shadow: ${isSelected ? '0 4px 12px rgba(75, 138, 138, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)'};"
                        onmouseover="if(!this.classList.contains('selected')) { this.style.borderColor='#4b8a8a'; this.style.boxShadow='0 4px 12px rgba(75, 138, 138, 0.1)'; }"
                        onmouseout="if(!this.classList.contains('selected')) { this.style.borderColor='#E9ECEF'; this.style.boxShadow='0 2px 4px rgba(0, 0, 0, 0.05)'; }"
                      >
                        ${isSelected ? '<div style="position: absolute; top: 0.75rem; right: 0.75rem; width: 24px; height: 24px; background: #4b8a8a; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem;">✓</div>' : ''}
                        <div style="font-size: 1.1rem; font-weight: 600; color: #212529; margin-bottom: 0.5rem;">${config.label}</div>
                        <div style="font-size: 0.9rem; font-weight: 700; color: #212529; margin-bottom: ${recommendation ? '0.5rem' : '0'};">
                          £${config.price}
                        </div>
                        ${recommendation ? `<div style="font-size: 0.8rem; color: #6C757D; font-style: italic;">${recommendation}</div>` : ''}
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>

            <!-- Step 3: Transitions Selection -->
            <div class="config-section" style="margin-bottom: 2.5rem;">
              ${(() => {
                const selectedConfig = LENS_OPTIONS.lensConfigs.find(c => c.code === lensOptions.lensConfig);
                const isDisabled = !selectedConfig || selectedConfig.thickness === '1.74' || selectedConfig.coating === 'BLUE AR';
                const stepTitle = isDisabled 
                  ? 'Step 3: Transitions (not available with your lens choice)'
                  : 'Step 3: Add Transitions (optional)';
                return `
                  <h3 class="section-title" style="font-size: 1.25rem; color: #212529; margin: 0 0 1rem 0; font-weight: 700;">${stepTitle}</h3>
                  ${!isDisabled ? '<p class="section-subtitle" style="font-size: 0.9rem; color: #6C757D; margin: 0 0 1.5rem 0;">Optional photochromic lenses that darken in sunlight</p>' : ''}
                `;
              })()}
              <div class="transitions-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                ${LENS_OPTIONS.transitions.map(trans => {
                  const selectedConfig = LENS_OPTIONS.lensConfigs.find(c => c.code === lensOptions.lensConfig);
                  const isDisabled = !selectedConfig || selectedConfig.thickness === '1.74' || selectedConfig.coating === 'BLUE AR';
                  const isSelected = lensOptions.transitions === trans.code;
                  return `
                    <button 
                      class="transitions-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}" 
                      data-transitions="${trans.code}"
                      ${isDisabled ? 'disabled' : ''}
                      style="background: ${isDisabled ? '#F8F9FA' : 'white'}; border: 2px solid ${isSelected ? '#4b8a8a' : '#E9ECEF'}; border-radius: 12px; padding: 1.25rem; cursor: ${isDisabled ? 'not-allowed' : 'pointer'}; transition: all 0.2s; text-align: center; position: relative; box-shadow: ${isSelected ? '0 4px 12px rgba(75, 138, 138, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)'}; opacity: ${isDisabled ? '0.5' : '1'};"
                      onmouseover="if(!this.classList.contains('selected') && !this.disabled) { this.style.borderColor='#4b8a8a'; this.style.boxShadow='0 4px 12px rgba(75, 138, 138, 0.1)'; }"
                      onmouseout="if(!this.classList.contains('selected') && !this.disabled) { this.style.borderColor='#E9ECEF'; this.style.boxShadow='0 2px 4px rgba(0, 0, 0, 0.05)'; }"
                    >
                      ${isSelected ? '<div style="position: absolute; top: 0.75rem; right: 0.75rem; width: 24px; height: 24px; background: #4b8a8a; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem;">✓</div>' : ''}
                      <div style="font-size: 1.1rem; font-weight: 600; color: #212529; margin-bottom: 0.5rem;">${trans.label}</div>
                      <div style="font-size: 0.9rem; font-weight: 600; color: #212529;">+£${trans.price}</div>
                    </button>
                  `;
                }).join('')}
              </div>
              ${(() => {
                const selectedConfig = LENS_OPTIONS.lensConfigs.find(c => c.code === lensOptions.lensConfig);
                const isDisabled = !selectedConfig || selectedConfig.thickness === '1.74' || selectedConfig.coating === 'BLUE AR';
                return isDisabled ? '<p style="font-size: 0.85rem; color: #6C757D; margin: 1rem 0 0 0; font-style: italic; line-height: 1.5;">Transitions are not available with 1.74 lenses or MAR Blue.</p>' : '';
              })()}
            </div>

            <!-- CTA Button -->
            <div class="cta-section" style="margin-top: 2.5rem; margin-bottom: 2rem; padding: 2rem; background: #4b8a8a; border-radius: 16px;">
              <button id="continue-to-prescription-btn" class="premium-cta-button" style="width: 100%; padding: 1.25rem 2rem; background: #3a6f6f; color: white; border: none; border-radius: 12px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(58, 111, 111, 0.3);"
                onmouseover="this.style.background='#2d5656'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(58, 111, 111, 0.4)';"
                onmouseout="this.style.background='#3a6f6f'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(58, 111, 111, 0.3)';"
              >
                Enter your prescription
              </button>
              <div style="display: flex; justify-content: center; gap: 1rem; margin-top: 0.75rem; font-size: 0.85rem; color: rgba(255, 255, 255, 0.9);">
                <span>Takes ~2 minutes</span>
                <span>•</span>
                <span>Prescription checked by qualified opticians</span>
              </div>
            </div>
          </div>

          <!-- Right: Price Summary & Lens Details -->
          <div style="display: flex; flex-direction: column; gap: 1.5rem; position: ${isMobile ? 'static' : 'sticky'}; top: 2rem;">
            <!-- Price Summary -->
            <div class="price-summary-card" style="background: white; border-radius: 16px; padding: 2rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); border: 1px solid #E9ECEF; height: fit-content;">
              <h3 style="font-size: 1.1rem; color: #212529; margin: 0 0 1.5rem 0; font-weight: 700;">Order Summary</h3>
              <div class="price-breakdown-summary" style="display: flex; flex-direction: column; gap: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 0.9rem; color: #6C757D;">Frame</span>
                  <strong style="font-size: 0.95rem; color: #212529; font-weight: 600;">£${basePrice.toFixed(2)}</strong>
                </div>
                <div id="lens-price-summary" style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 0.9rem; color: #6C757D;">Lenses</span>
                  <strong style="font-size: 0.95rem; color: #212529; font-weight: 600;">£0.00</strong>
                </div>
                <div id="coatings-price-summary" style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 0.9rem; color: #6C757D;">Add-ons</span>
                  <strong style="font-size: 0.95rem; color: #212529; font-weight: 600;">£0.00</strong>
                </div>
              </div>
              <div style="height: 1px; background: #E9ECEF; margin: 1.5rem 0;"></div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 1.1rem; color: #212529; font-weight: 600;">Total</span>
                <strong style="font-size: 1.75rem; color: #212529; font-weight: 700;">£<span id="total-price-summary">${totalPrice.toFixed(2)}</span></strong>
              </div>
            </div>
            
            <!-- Lens Details Panel -->
            <div class="lens-details-panel" style="background: white; border-radius: 16px; padding: 2rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); border: 1px solid #E9ECEF;">
              <h3 style="font-size: 1.1rem; color: #212529; margin: 0 0 1.5rem 0; font-weight: 700;">Lens Details</h3>
              <div id="lens-illustration-container" style="width: 100%; text-align: center;">
                ${(() => {
                  const selectedConfig = LENS_OPTIONS.lensConfigs.find(c => c.code === lensOptions.lensConfig);
                  if (!selectedConfig) {
                    return '<img src="assets/images/gallery/lens_option_1.png" alt="Lens option illustration" style="max-width: 100%; height: auto; border-radius: 8px;" />';
                  }
                  
                  // Check if transitions are selected and valid
                  const hasTransitions = lensOptions.transitions !== null;
                  const transitionsDisabled = selectedConfig.thickness === '1.74' || selectedConfig.coating === 'BLUE AR';
                  
                  // If transitions are selected and valid, show transitions illustration
                  if (hasTransitions && !transitionsDisabled) {
                    return '<img src="assets/images/gallery/lens_option_5.png" alt="Lens option illustration" style="max-width: 100%; height: auto; border-radius: 8px;" />';
                  }
                  
                  // If transitions are selected but disabled, show "not available" illustration
                  if (hasTransitions && transitionsDisabled) {
                    return '<img src="assets/images/gallery/lens_option_6.png" alt="Lens option illustration" style="max-width: 100%; height: auto; border-radius: 8px;" />';
                  }
                  
                  // Map lens configurations to illustrations
                  let imagePath = 'assets/images/gallery/lens_option_1.png'; // Default
                  switch (selectedConfig.code) {
                    case '1.5_HC':
                      imagePath = 'assets/images/gallery/lens_option_1.png';
                      break;
                    case '1.5_MAR':
                      imagePath = 'assets/images/gallery/lens_option_2.png';
                      break;
                    case '1.5_MAR_BLUE':
                      imagePath = 'assets/images/gallery/lens_option_3.png';
                      break;
                    case '1.6_MAR':
                    case '1.67_MAR':
                    case '1.74_MAR':
                      imagePath = 'assets/images/gallery/lens_option_4.png';
                      break;
                  }
                  
                  return `<img src="${imagePath}" alt="Lens option illustration" style="max-width: 100%; height: auto; border-radius: 8px;" />`;
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Set up event listeners
  setupEventListeners();
  updatePriceDisplay();
  updateLensIllustration();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Variant thumbnail selection
  document.querySelectorAll('.variant-thumbnail').forEach(btn => {
    btn.addEventListener('click', () => {
      const variantId = btn.dataset.variantId;
      const colour = btn.dataset.colour;
      const variant = currentProduct.variants.nodes.find(v => v.id === variantId);
      
      if (variant && variant.availableForSale) {
        selectedVariantId = variant.id;
        selectedColour = colour;
        
        // Update UI - remove active from all thumbnails and reset their styles
        document.querySelectorAll('.variant-thumbnail').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('data-is-active', 'false');
          b.style.borderColor = '#d7dde1';
          b.style.borderWidth = '2px';
        });
        
        // Add active to clicked thumbnail
        btn.classList.add('active');
        btn.setAttribute('data-is-active', 'true');
        btn.style.borderColor = '#4b8a8a';
        btn.style.borderWidth = '3px';
        
        // Update main image with fade effect
        const img = document.getElementById('product-main-img');
        const variantImage = variant.image?.url || currentProduct.images.nodes[0]?.url || '';
        if (variantImage && img) {
          img.style.opacity = '0';
          setTimeout(() => {
            img.src = variantImage;
            img.alt = `${currentProduct.title} - ${colour}`;
            img.style.opacity = '1';
          }, 150);
        }
        
        updatePriceDisplay();
      }
    });
  });


  // Lens type is fixed to Single Vision - no click handler needed

  // Step 2: Lens configuration card selection
  document.querySelectorAll('.lens-config-card').forEach(card => {
    card.addEventListener('click', () => {
      const lensConfig = card.dataset.lensConfig;
      lensOptions.lensConfig = lensConfig;
      
      // Update UI
      document.querySelectorAll('.lens-config-card').forEach(c => {
        c.classList.remove('selected');
        c.style.borderColor = '#E9ECEF';
        c.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
        const checkmark = c.querySelector('div[style*="position: absolute"]');
        if (checkmark) checkmark.remove();
      });
      card.classList.add('selected');
      card.style.borderColor = '#4b8a8a';
      card.style.boxShadow = '0 4px 12px rgba(75, 138, 138, 0.15)';
      
      // Add checkmark if not present
      if (!card.querySelector('div[style*="position: absolute"]')) {
        const checkmark = document.createElement('div');
        checkmark.style.cssText = 'position: absolute; top: 0.75rem; right: 0.75rem; width: 24px; height: 24px; background: #4b8a8a; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem;';
        checkmark.textContent = '✓';
        card.appendChild(checkmark);
      }
      
      // Update transitions disabled states when lens config changes
      updateTransitionsDisabledStates();
      updateStep3Title();
      updateLensIllustration();
      // Clear transitions if they become unavailable
      const selectedConfig = LENS_OPTIONS.lensConfigs.find(c => c.code === lensConfig);
      if (selectedConfig && (selectedConfig.thickness === '1.74' || selectedConfig.coating === 'BLUE AR')) {
        lensOptions.transitions = null;
        // Clear selected state from transitions cards
        document.querySelectorAll('.transitions-card').forEach(c => {
          c.classList.remove('selected');
          c.style.borderColor = '#E9ECEF';
          c.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
          const checkmark = c.querySelector('div[style*="position: absolute"]');
          if (checkmark) checkmark.remove();
        });
      }
      updatePriceDisplay();
    });
  });

  // Step 3: Transitions card selection
  document.querySelectorAll('.transitions-card').forEach(card => {
    card.addEventListener('click', () => {
      if (card.disabled) return;
      
      const transitions = card.dataset.transitions;
      const isSelected = lensOptions.transitions === transitions;
      
      if (isSelected) {
        lensOptions.transitions = null;
        card.classList.remove('selected');
        card.style.borderColor = '#E9ECEF';
        card.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
        const checkmark = card.querySelector('div[style*="position: absolute"]');
        if (checkmark) checkmark.remove();
      } else {
        lensOptions.transitions = transitions;
        // Update UI - remove selected from all
        document.querySelectorAll('.transitions-card').forEach(c => {
          c.classList.remove('selected');
          c.style.borderColor = '#E9ECEF';
          c.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
          const checkmark = c.querySelector('div[style*="position: absolute"]');
          if (checkmark) checkmark.remove();
        });
        card.classList.add('selected');
        card.style.borderColor = '#4b8a8a';
        card.style.boxShadow = '0 4px 12px rgba(75, 138, 138, 0.15)';
        // Add checkmark
        const checkmark = document.createElement('div');
        checkmark.style.cssText = 'position: absolute; top: 0.75rem; right: 0.75rem; width: 24px; height: 24px; background: #4b8a8a; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem;';
        checkmark.textContent = '✓';
        card.appendChild(checkmark);
      }
      
      updateLensIllustration();
      updatePriceDisplay();
    });
  });
  
  // Update disabled states for transitions cards
  function updateTransitionsDisabledStates() {
    const selectedConfig = LENS_OPTIONS.lensConfigs.find(c => c.code === lensOptions.lensConfig);
    const isDisabled = !selectedConfig || selectedConfig.thickness === '1.74' || selectedConfig.coating === 'BLUE AR';
    
    document.querySelectorAll('.transitions-card').forEach(card => {
      if (isDisabled) {
        card.disabled = true;
        card.classList.add('disabled');
        card.style.opacity = '0.5';
        card.style.cursor = 'not-allowed';
      } else {
        card.disabled = false;
        card.classList.remove('disabled');
        card.style.opacity = '1';
        card.style.cursor = 'pointer';
      }
    });
  }
  
  // Update Step 3 title dynamically based on availability
  function updateStep3Title() {
    const selectedConfig = LENS_OPTIONS.lensConfigs.find(c => c.code === lensOptions.lensConfig);
    const isDisabled = !selectedConfig || selectedConfig.thickness === '1.74' || selectedConfig.coating === 'BLUE AR';
    const step3Section = document.querySelector('.config-section:has(.transitions-cards)');
    if (step3Section) {
      const step3Title = step3Section.querySelector('.section-title');
      const step3Subtitle = step3Section.querySelector('.section-subtitle');
      if (step3Title) {
        step3Title.textContent = isDisabled 
          ? 'Step 3: Transitions (not available with your lens choice)'
          : 'Step 3: Add Transitions (optional)';
      }
      if (step3Subtitle) {
        if (isDisabled) {
          step3Subtitle.style.display = 'none';
        } else {
          step3Subtitle.style.display = 'block';
          step3Subtitle.textContent = 'Optional photochromic lenses that darken in sunlight';
        }
      }
    }
  }
  
  // Helper function to re-render transitions section
  function renderTransitionsSection() {
    const transitionsSection = document.querySelector('.config-section:has(.transitions-cards)');
    if (!transitionsSection) return;
    
    const selectedConfig = LENS_OPTIONS.lensConfigs.find(c => c.code === lensOptions.lensConfig);
    const isDisabled = !selectedConfig || selectedConfig.thickness === '1.74' || selectedConfig.coating === 'BLUE AR';
    
    const transitionsHTML = `
      <div class="transitions-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        ${LENS_OPTIONS.transitions.map(trans => {
          const isSelected = lensOptions.transitions === trans.code;
          return `
            <button 
              class="transitions-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}" 
              data-transitions="${trans.code}"
              ${isDisabled ? 'disabled' : ''}
              style="background: ${isDisabled ? '#F8F9FA' : 'white'}; border: 2px solid ${isSelected ? '#4b8a8a' : '#E9ECEF'}; border-radius: 12px; padding: 1.25rem; cursor: ${isDisabled ? 'not-allowed' : 'pointer'}; transition: all 0.2s; text-align: center; position: relative; box-shadow: ${isSelected ? '0 4px 12px rgba(75, 138, 138, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)'}; opacity: ${isDisabled ? '0.5' : '1'};"
              onmouseover="if(!this.classList.contains('selected') && !this.disabled) { this.style.borderColor='#4b8a8a'; this.style.boxShadow='0 4px 12px rgba(75, 138, 138, 0.1)'; }"
              onmouseout="if(!this.classList.contains('selected') && !this.disabled) { this.style.borderColor='#E9ECEF'; this.style.boxShadow='0 2px 4px rgba(0, 0, 0, 0.05)'; }"
            >
              ${isSelected ? '<div style="position: absolute; top: 0.75rem; right: 0.75rem; width: 24px; height: 24px; background: #4b8a8a; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem;">✓</div>' : ''}
              <div style="font-size: 1.1rem; font-weight: 600; color: #212529; margin-bottom: 0.5rem;">${trans.label}</div>
              <div style="font-size: 0.9rem; font-weight: 600; color: #212529;">+£${trans.price}</div>
            </button>
          `;
        }).join('')}
      </div>
      ${isDisabled ? '<p style="font-size: 0.85rem; color: #6C757D; margin: 1rem 0 0 0; font-style: italic; line-height: 1.5;">Transitions are not available with 1.74 lenses or MAR Blue.</p>' : ''}
    `;
    
    const cardsContainer = transitionsSection.querySelector('.transitions-cards');
    const helperText = transitionsSection.querySelector('p');
    if (cardsContainer) {
      cardsContainer.outerHTML = transitionsHTML;
      // Re-attach event listeners
      document.querySelectorAll('.transitions-card').forEach(card => {
        card.addEventListener('click', function() {
          if (this.disabled) return;
          const transitions = this.dataset.transitions;
          const isSelected = lensOptions.transitions === transitions;
          
          if (isSelected) {
            lensOptions.transitions = null;
            this.classList.remove('selected');
            this.style.borderColor = '#E9ECEF';
            this.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
            const checkmark = this.querySelector('div[style*="position: absolute"]');
            if (checkmark) checkmark.remove();
          } else {
            lensOptions.transitions = transitions;
            document.querySelectorAll('.transitions-card').forEach(c => {
              c.classList.remove('selected');
              c.style.borderColor = '#E9ECEF';
              c.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
              const checkmark = c.querySelector('div[style*="position: absolute"]');
              if (checkmark) checkmark.remove();
            });
            this.classList.add('selected');
            this.style.borderColor = '#4b8a8a';
            this.style.boxShadow = '0 4px 12px rgba(75, 138, 138, 0.15)';
            const checkmark = document.createElement('div');
            checkmark.style.cssText = 'position: absolute; top: 0.75rem; right: 0.75rem; width: 24px; height: 24px; background: #4b8a8a; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem;';
            checkmark.textContent = '✓';
            this.appendChild(checkmark);
          }
          updatePriceDisplay();
        });
      });
    }
  }

  // Continue to prescription button
  document.getElementById('continue-to-prescription-btn')?.addEventListener('click', () => {
    if (!currentProduct || !selectedVariantId) {
      alert('Please select a frame variant first');
      return;
    }
    
    // Save lens options to sessionStorage
    sessionStorage.setItem('selectedVariantId', selectedVariantId);
    sessionStorage.setItem('selectedColour', selectedColour);
    sessionStorage.setItem('productHandle', currentProduct.handle);
    sessionStorage.setItem('productTitle', currentProduct.title);
    sessionStorage.setItem('lensOptions', JSON.stringify(lensOptions));
    sessionStorage.setItem('basePrice', currentBasePrice.toString());
    sessionStorage.setItem('totalPrice', calculateTotalPrice().toString());
    
    // Store product image
    const selectedVariant = currentProduct.variants.nodes.find(v => v.id === selectedVariantId);
    const productImage = selectedVariant?.image?.url || currentProduct.images.nodes[0]?.url || '';
    sessionStorage.setItem('productImage', productImage);
    
    // Redirect to prescription page
    window.location.href = `prescription.html?handle=${currentProduct.handle}`;
  });
}

/**
 * Update price display
 */
function updatePriceDisplay() {
  if (!currentProduct || !selectedVariantId) return;
  
  const variant = currentProduct.variants.nodes.find(v => v.id === selectedVariantId);
  if (variant) {
    currentBasePrice = parseFloat(variant.price.amount);
  }
  
  const totalPrice = calculateTotalPrice();
  const basePrice = currentBasePrice;
  const lensPrice = calculateLensPrice();
  
  // Get selected lens config
  const selectedConfig = LENS_OPTIONS.lensConfigs.find(c => c.code === lensOptions.lensConfig);
  const baseLensPrice = selectedConfig ? selectedConfig.price : 0;
  const transitionsPrice = lensOptions.transitions ? PHOTOCHROMIC_ADDON : 0;
  
  // Update price summary card
  const lensPriceSummary = document.getElementById('lens-price-summary');
  if (lensPriceSummary) {
    lensPriceSummary.innerHTML = `
      <span style="font-size: 0.9rem; color: #6C757D;">Lenses</span>
      <strong style="font-size: 0.95rem; color: #212529; font-weight: 600;">£${baseLensPrice.toFixed(2)}</strong>
    `;
  }
  
  // Show transitions separately
  const coatingsPriceSummary = document.getElementById('coatings-price-summary');
  if (coatingsPriceSummary) {
    coatingsPriceSummary.innerHTML = `
      <span style="font-size: 0.9rem; color: #6C757D;">Transitions</span>
      <strong style="font-size: 0.95rem; color: #212529; font-weight: 600;">£${transitionsPrice.toFixed(2)}</strong>
    `;
  }
  
  const totalPriceSummary = document.getElementById('total-price-summary');
  if (totalPriceSummary) {
    totalPriceSummary.textContent = totalPrice.toFixed(2);
  }
}

/**
 * Initialize page
 */
async function initProductDetail() {
  const container = document.getElementById('product-detail-container');
  if (!container) {
    console.error('Product detail container not found');
    return;
  }

  // Wait for credentials (with longer timeout)
  let attempts = 0;
  while ((!window.SHOPIFY_STORE_DOMAIN || !window.SHOPIFY_STOREFRONT_TOKEN) && attempts < 100) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (!window.SHOPIFY_STORE_DOMAIN || !window.SHOPIFY_STOREFRONT_TOKEN) {
    container.innerHTML = `
      <div class="product-error" style="text-align: center; padding: 2rem;">
        <p style="color: #dc3545; margin-bottom: 1rem;">Shopify configuration not available. Please refresh the page.</p>
        <a href="shop.html" class="btn-primary" style="display: inline-block; padding: 0.75rem 1.5rem; background: #4b8a8a; color: white; text-decoration: none; border-radius: 8px;">Back to Shop</a>
      </div>
    `;
    console.error('Shopify credentials not available after waiting');
    return;
  }

  SHOPIFY_CONFIG.domain = window.SHOPIFY_STORE_DOMAIN;
  SHOPIFY_CONFIG.accessToken = window.SHOPIFY_STOREFRONT_TOKEN;

  const handle = getProductHandle();
  if (!handle) {
    container.innerHTML = `
      <div class="product-error" style="text-align: center; padding: 2rem;">
        <p style="color: #dc3545; margin-bottom: 1rem;">Product not found. Please select a product from the shop.</p>
        <a href="shop.html" class="btn-primary" style="display: inline-block; padding: 0.75rem 1.5rem; background: #4b8a8a; color: white; text-decoration: none; border-radius: 8px;">Back to Shop</a>
      </div>
    `;
    return;
  }

  try {
    const product = await fetchProduct(handle);
    if (!product) {
      container.innerHTML = `
        <div class="product-error" style="text-align: center; padding: 2rem;">
          <p style="color: #dc3545; margin-bottom: 1rem;">Product not found or error loading product. Please try again.</p>
          <a href="shop.html" class="btn-primary" style="display: inline-block; padding: 0.75rem 1.5rem; background: #4b8a8a; color: white; text-decoration: none; border-radius: 8px;">Back to Shop</a>
        </div>
      `;
      console.error('Failed to fetch product:', handle);
      return;
    }

    renderProductDetail(product);
  } catch (error) {
    console.error('Error initializing product detail:', error);
    container.innerHTML = `
      <div class="product-error" style="text-align: center; padding: 2rem;">
        <p style="color: #dc3545; margin-bottom: 1rem;">Error loading product: ${error.message}</p>
        <a href="shop.html" class="btn-primary" style="display: inline-block; padding: 0.75rem 1.5rem; background: #4b8a8a; color: white; text-decoration: none; border-radius: 8px;">Back to Shop</a>
      </div>
    `;
  }
}

// Handle window resize to update layout
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Re-render if product is already loaded to update responsive styles
    if (currentProduct) {
      renderProductDetail(currentProduct);
    }
  }, 250);
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductDetail);
} else {
  initProductDetail();
}

