/**
 * Prescription Page
 * Handles prescription form and final add to cart
 */

// Lens Options Configuration (matching shopify_lenses_and_prescription.md spec)
const LENS_OPTIONS = {
  type: [
    { code: 'SV', label: 'Single Vision', price: 60 },
    { code: 'VARI', label: 'Varifocal', price: 120 },
    { code: 'BIF', label: 'Bifocal', price: 110 },
  ],
  index: [
    { code: '1.50', label: 'Standard (1.50)', price: 0 },
    { code: '1.60', label: 'Thin (1.60)', price: 25 },
    { code: '1.67', label: 'Ultra-thin (1.67)', price: 45 },
  ],
  coatings: [
    { code: 'AR', label: 'Anti-reflective', price: 20 },
    { code: 'BL', label: 'Blue light filter', price: 25 },
    { code: 'TR', label: 'Transitions', price: 60 },
  ],
};

// Shopify API Configuration
const SHOPIFY_CONFIG = {
  domain: window.SHOPIFY_STORE_DOMAIN || '',
  accessToken: window.SHOPIFY_STOREFRONT_TOKEN || '',
  apiVersion: '2025-01',
};

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

let selectedVariantId = '';
let selectedColour = '';
let prescriptionUsageType = 'Distance'; // Distance, Intermediate, Reading

// Default "not required" value for add fields
const NOT_REQUIRED_VALUE = '';
let lensOptions = {
  lensType: 'SV',
  lensIndex: '1.50',
  coatings: [],
  prescription: {
    r_sph: '',
    r_cyl: '',
    r_axis: '',
    l_sph: '',
    l_cyl: '',
    l_axis: '',
    left_pd: '',
    right_pd: '',
    combined_pd: '',
    intermediate_add: '',
    near_add: '',
    notes: ''
  }
};

/**
 * Generate picklist options for SPH (+5.00 to -5.00, increment 0.25, includes 0.00/Plano)
 */
function generateSPHOptions() {
  const options = [];
  // Positive values: +5.00 down to +0.25
  for (let i = 5.00; i >= 0.25; i -= 0.25) {
    options.push({ value: `+${i.toFixed(2)}`, label: `+${i.toFixed(2)}` });
  }
  // Plano/0.00
  options.push({ value: '0.00', label: '0.00 / Plano' });
  // Negative values: -0.25 down to -5.00
  for (let i = 0.25; i <= 5.00; i += 0.25) {
    options.push({ value: `-${i.toFixed(2)}`, label: `-${i.toFixed(2)}` });
  }
  return options;
}

/**
 * Generate picklist options for CYL (+2.00 to -2.00, increment 0.25)
 */
function generateCYLOptions() {
  const options = [];
  // Default "Not required" option
  options.push({ value: '', label: 'Not required' });
  // Positive values: +2.00 down to +0.25
  for (let i = 2.00; i >= 0.25; i -= 0.25) {
    options.push({ value: `+${i.toFixed(2)}`, label: `+${i.toFixed(2)}` });
  }
  // Negative values: -0.25 down to -2.00
  for (let i = 0.25; i <= 2.00; i += 0.25) {
    options.push({ value: `-${i.toFixed(2)}`, label: `-${i.toFixed(2)}` });
  }
  return options;
}

/**
 * Generate picklist options for Add power (+0.25 to +3.00, increment 0.25)
 */
function generateAddOptions() {
  const options = [];
  options.push({ value: '', label: 'Not required' });
  for (let i = 0.25; i <= 3.00; i += 0.25) {
    options.push({ value: `+${i.toFixed(2)}`, label: `+${i.toFixed(2)}` });
  }
  return options;
}

/**
 * Generate axis options (1 to 180)
 */
function generateAxisOptions() {
  const options = [];
  for (let i = 1; i <= 180; i++) {
    options.push({ value: i.toString(), label: i.toString() });
  }
  return options;
}

/**
 * Format attributes for cart (matching shopify_lenses_and_prescription.md spec)
 */
function formatAttributes() {
  const attributes = [];

  // Colour
  if (selectedColour) {
    attributes.push({ key: 'Colour', value: selectedColour });
  }

  // Lens Type (both code and label)
  const lensType = LENS_OPTIONS.type.find(lt => lt.code === lensOptions.lensType);
  if (lensType) {
    attributes.push({ key: 'Lens Type Code', value: lensType.code });
    attributes.push({ key: 'Lens Type', value: lensType.label });
  }

  // Lens Index (both code and label)
  const lensIndex = LENS_OPTIONS.index.find(i => i.code === lensOptions.lensIndex);
  if (lensIndex) {
    attributes.push({ key: 'Lens Index Code', value: lensIndex.code });
    attributes.push({ key: 'Lens Index', value: lensIndex.label });
  }

  // Coatings
  if (lensOptions.coatings.length > 0) {
    const coatingCodes = lensOptions.coatings.map(code => {
      const coating = LENS_OPTIONS.coatings.find(c => c.code === code);
      return coating ? coating.code : null;
    }).filter(Boolean);
    const coatingLabels = lensOptions.coatings.map(code => {
      const coating = LENS_OPTIONS.coatings.find(c => c.code === code);
      return coating ? coating.label : null;
    }).filter(Boolean);
    if (coatingCodes.length > 0) {
      attributes.push({ key: 'Coatings Code', value: coatingCodes.join(', ') });
    }
    if (coatingLabels.length > 0) {
      attributes.push({ key: 'Coatings', value: coatingLabels.join(', ') });
    }
  }

  // Prescription (matching spec naming: Rx R SPH, Rx L SPH, etc.)
  const rx = lensOptions.prescription;
  
  // Right Eye
  if (rx.r_sph) attributes.push({ key: 'Rx R SPH', value: rx.r_sph });
  if (rx.r_cyl) attributes.push({ key: 'Rx R CYL', value: rx.r_cyl });
  if (rx.r_axis) attributes.push({ key: 'Rx R AXIS', value: rx.r_axis });
  
  // Left Eye
  if (rx.l_sph) attributes.push({ key: 'Rx L SPH', value: rx.l_sph });
  if (rx.l_cyl) attributes.push({ key: 'Rx L CYL', value: rx.l_cyl });
  if (rx.l_axis) attributes.push({ key: 'Rx L AXIS', value: rx.l_axis });
  
  // PD handling: prefer individual values, fallback to combined
  if (rx.left_pd && rx.right_pd) {
    attributes.push({ key: 'PD Left', value: rx.left_pd });
    attributes.push({ key: 'PD Right', value: rx.right_pd });
  } else if (rx.combined_pd) {
    attributes.push({ key: 'PD', value: rx.combined_pd });
  }
  if (rx.intermediate_add) attributes.push({ key: 'Intermediate Add', value: rx.intermediate_add });
  if (rx.near_add) attributes.push({ key: 'Near Add', value: rx.near_add });
  if (rx.notes) attributes.push({ key: 'Rx Notes', value: rx.notes });
  
  // Usage Type
  if (prescriptionUsageType) {
    attributes.push({ key: 'Prescription Usage Type', value: prescriptionUsageType });
  }

  return attributes;
}

/**
 * Add to cart
 */
/**
 * Validate that PD is filled
 */
function validatePD() {
  const leftPd = document.getElementById('left-pd')?.value;
  const rightPd = document.getElementById('right-pd')?.value;
  const combinedPd = document.getElementById('combined-pd')?.value;
  
  // At least one PD measurement must be provided
  const hasLeftPd = leftPd && leftPd.trim() !== '' && !isNaN(parseFloat(leftPd));
  const hasRightPd = rightPd && rightPd.trim() !== '' && !isNaN(parseFloat(rightPd));
  const hasCombinedPd = combinedPd && combinedPd.trim() !== '' && !isNaN(parseFloat(combinedPd));
  
  return (hasLeftPd && hasRightPd) || hasCombinedPd;
}

/**
 * Validate usage type selection based on add fields
 */
function validateUsageTypeSelection() {
  const intermediateAdd = document.getElementById('intermediate-add')?.value;
  const nearAdd = document.getElementById('near-add')?.value;
  const usageTypeSelect = document.getElementById('usage-type');
  
  if (!usageTypeSelect) return;
  
  // Update Intermediate option
  const intermediateOption = usageTypeSelect.querySelector('option[value="Intermediate"]');
  if (intermediateOption) {
    const hasIntermediateAdd = intermediateAdd && intermediateAdd !== '';
    intermediateOption.disabled = !hasIntermediateAdd;
    intermediateOption.textContent = hasIntermediateAdd ? 'Intermediate' : 'Intermediate (requires Intermediate Add)';
  }
  
  // Update Reading option
  const readingOption = usageTypeSelect.querySelector('option[value="Reading"]');
  if (readingOption) {
    const hasNearAdd = nearAdd && nearAdd !== '';
    readingOption.disabled = !hasNearAdd;
    readingOption.textContent = hasNearAdd ? 'Reading' : 'Reading (requires Near Add)';
  }
  
  // If current selection is invalid, reset to Distance and show error
  const currentValue = usageTypeSelect.value;
  const errorDiv = document.getElementById('usage-type-error');
  
  if (currentValue === 'Intermediate' && (!intermediateAdd || intermediateAdd === '')) {
    usageTypeSelect.value = 'Distance';
    prescriptionUsageType = 'Distance';
    sessionStorage.setItem('prescriptionUsageType', 'Distance');
    if (errorDiv) {
      errorDiv.style.display = 'block';
      errorDiv.textContent = 'Intermediate Add is required to select Intermediate usage type.';
    }
  } else if (currentValue === 'Reading' && (!nearAdd || nearAdd === '')) {
    usageTypeSelect.value = 'Distance';
    prescriptionUsageType = 'Distance';
    sessionStorage.setItem('prescriptionUsageType', 'Distance');
    if (errorDiv) {
      errorDiv.style.display = 'block';
      errorDiv.textContent = 'Near Add is required to select Reading usage type.';
    }
  } else {
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }
}

async function addToCart() {
  if (!selectedVariantId) {
    alert('Error: Product variant not found. Please go back and try again.');
    return;
  }

  // Ensure Shopify credentials are loaded (wait up to 5 seconds)
  let attempts = 0;
  while ((!window.SHOPIFY_STORE_DOMAIN || !window.SHOPIFY_STOREFRONT_TOKEN) && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (!window.SHOPIFY_STORE_DOMAIN || !window.SHOPIFY_STOREFRONT_TOKEN) {
    alert('Shopify configuration not available. Please refresh the page and try again.');
    return;
  }

  // Validate PD is filled
  if (!validatePD()) {
    alert('Please enter a Pupillary Distance (PD) measurement before proceeding. You can enter individual left/right measurements or a combined measurement.');
    return;
  }
  
  // Validate usage type selection
  const currentUsageType = document.getElementById('usage-type')?.value;
  const intermediateAdd = document.getElementById('intermediate-add')?.value;
  const nearAdd = document.getElementById('near-add')?.value;
  
  if (currentUsageType === 'Intermediate' && (!intermediateAdd || intermediateAdd === '')) {
    alert('Intermediate Add is required to select Intermediate usage type.');
    return;
  }
  
  if (currentUsageType === 'Reading' && (!nearAdd || nearAdd === '')) {
    alert('Near Add is required to select Reading usage type.');
    return;
  }

  // Validate prescription before adding to cart
  const validation = validatePrescription(lensOptions.prescription, prescriptionUsageType);
  if (!validation.valid) {
    const errorMessage = validation.errors.join('\n\n') + '\n\n' + 
      'This prescription exceeds our manufacturing limits when configured for the selected use. Please adjust the prescription type or contact us for assistance.';
    alert(errorMessage);
    return;
  }

  const attributes = formatAttributes();
  const productTitle = sessionStorage.getItem('productTitle') || 'Product';
  const basePrice = parseFloat(sessionStorage.getItem('basePrice') || '0');
  const totalPrice = parseFloat(sessionStorage.getItem('totalPrice') || '0');
  // Try to get product image from various sources
  let productImage = sessionStorage.getItem('productImage') || '';
  if (!productImage) {
    // Try to get from current page if available
    const mainImg = document.querySelector('#product-main-img');
    if (mainImg && mainImg.src) {
      productImage = mainImg.src;
    }
  }
  
  // Verify variant ID is in correct format (GraphQL global ID)
  // Should be in format: gid://shopify/ProductVariant/123456789
  let variantId = selectedVariantId;
  if (!variantId.startsWith('gid://shopify/ProductVariant/')) {
    console.warn('Variant ID format may be incorrect:', variantId);
    // If it's a numeric ID, convert to GraphQL global ID
    if (/^\d+$/.test(variantId)) {
      variantId = `gid://shopify/ProductVariant/${variantId}`;
    }
  }
  
  // Add to local cart instead of redirecting to Shopify checkout
  const cartItem = {
    variantId: variantId,
    productTitle: productTitle,
    colour: selectedColour,
    price: totalPrice.toFixed(2),
    basePrice: basePrice.toFixed(2),
    lensOptions: JSON.parse(JSON.stringify(lensOptions)),
    prescriptionUsageType: prescriptionUsageType,
    attributes: attributes,
    imageUrl: productImage,
    addedAt: new Date().toISOString()
  };
  
  // Use CartManager if available, otherwise fallback
  if (window.CartManager) {
    window.CartManager.add(cartItem);
    alert(`Added to cart! You have ${window.CartManager.getCount()} item(s) in your cart.`);
    // Optionally redirect to cart page or stay on page
    // window.location.href = 'cart.html';
  } else {
    // Fallback: store in sessionStorage temporarily
    const tempCart = JSON.parse(sessionStorage.getItem('temp_cart') || '[]');
    tempCart.push(cartItem);
    sessionStorage.setItem('temp_cart', JSON.stringify(tempCart));
    alert(`Added to cart! You have ${tempCart.length} item(s) in your cart.`);
  }
}

/**
 * Render prescription form
 */
function renderPrescriptionForm() {
  const productTitle = sessionStorage.getItem('productTitle') || 'Product';
  const basePrice = parseFloat(sessionStorage.getItem('basePrice') || '0');
  const totalPrice = parseFloat(sessionStorage.getItem('totalPrice') || '0');
  
  // Load saved data
  selectedVariantId = sessionStorage.getItem('selectedVariantId') || '';
  selectedColour = sessionStorage.getItem('selectedColour') || '';
  const savedUsageType = sessionStorage.getItem('prescriptionUsageType');
  if (savedUsageType) {
    prescriptionUsageType = savedUsageType;
  }
  const savedLensOptions = sessionStorage.getItem('lensOptions');
  if (savedLensOptions) {
    lensOptions = { ...lensOptions, ...JSON.parse(savedLensOptions) };
  }

  // Generate picklist options
  const sphOptions = generateSPHOptions();
  const cylOptions = generateCYLOptions();
  const addOptions = generateAddOptions();
  const axisOptions = generateAxisOptions();
  
  // Initialize add fields with default "not required" if not set
  if (!lensOptions.prescription.intermediate_add) {
    lensOptions.prescription.intermediate_add = '';
  }
  if (!lensOptions.prescription.near_add) {
    lensOptions.prescription.near_add = '';
  }

  const container = document.getElementById('prescription-container');
  container.innerHTML = `
    <div class="prescription-page-layout" style="max-width: 900px; margin: 0 auto; padding: 2rem 0;">
      <!-- Breadcrumb -->
      <div class="product-breadcrumb" style="margin-bottom: 1.5rem; font-size: 0.875rem; color: #6C757D;">
        <a href="shop.html" style="color: #4b8a8a; text-decoration: none;">All glasses</a>
        <span style="margin: 0 0.5rem; color: #6C757D;">></span>
        <a href="frame.html?handle=${sessionStorage.getItem('productHandle') || ''}" style="color: #4b8a8a; text-decoration: none;">${productTitle}</a>
        <span style="margin: 0 0.5rem; color: #6C757D;">></span>
        <span style="color: #212529; font-weight: 500;">Prescription</span>
      </div>

      <!-- Order Summary -->
      <div class="order-summary-card" style="background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
        <h2 style="font-size: 1.5rem; color: #212529; margin: 0 0 1rem 0; font-weight: 700;">Order Summary</h2>
        <div style="margin-bottom: 0.75rem;">
          <strong style="color: #212529;">${productTitle}</strong>
          ${selectedColour ? `<div style="color: #6C757D; font-size: 0.9rem; margin-top: 0.25rem;">Colour: ${selectedColour}</div>` : ''}
        </div>
        <div style="border-top: 1px solid #E9ECEF; padding-top: 0.75rem; margin-top: 0.75rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="color: #5B6770;">Frame:</span>
            <strong style="color: #212529;">£${basePrice.toFixed(2)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="color: #5B6770;">Lenses:</span>
            <strong style="color: #212529;">£${(totalPrice - basePrice).toFixed(2)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 2px solid #E9ECEF; font-size: 1.25rem;">
            <span style="color: #212529; font-weight: 600;">Total:</span>
            <strong style="color: #212529; font-weight: 700;">£${totalPrice.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      <!-- Prescription Form -->
      <div class="prescription-form-card" style="background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
        <h2 style="font-size: 1.5rem; color: #212529; margin: 0 0 1.5rem 0; font-weight: 700;">Prescription Details</h2>
        
        <!-- Error Message Container -->
        <div id="prescription-error" style="display: none; background: #FFF3CD; border: 1px solid #FFC107; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; color: #856404;"></div>
        
        <div class="prescription-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
          <div class="prescription-column" style="background: #f8fbfc; padding: 1.5rem; border-radius: 12px; border: 1px solid #e8ecef;">
            <h4 style="color: #4b8a8a; margin-bottom: 1.25rem; font-size: 1.1rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Right Eye (OD)</h4>
            <div class="prescription-field" style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.85rem; color: #5B6770; margin-bottom: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">SPH</label>
              <select id="right-sph" style="width: 100%; padding: 0.75rem; border: 2px solid #d7dde1; border-radius: 8px; font-size: 1rem; font-family: inherit; transition: border-color 0.3s, box-shadow 0.3s; background: white; cursor: pointer;">
                <option value="">Select SPH</option>
                ${sphOptions.map(opt => `<option value="${opt.value}" ${lensOptions.prescription.r_sph === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
              </select>
            </div>
            <div class="prescription-field" style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.85rem; color: #5B6770; margin-bottom: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">CYL</label>
              <select id="right-cyl" style="width: 100%; padding: 0.75rem; border: 2px solid #d7dde1; border-radius: 8px; font-size: 1rem; font-family: inherit; transition: border-color 0.3s, box-shadow 0.3s; background: white; cursor: pointer;">
                ${cylOptions.map(opt => `<option value="${opt.value}" ${(lensOptions.prescription.r_cyl === opt.value || (!lensOptions.prescription.r_cyl && opt.value === '')) ? 'selected' : ''}>${opt.label}</option>`).join('')}
              </select>
            </div>
            <div class="prescription-field">
              <label style="display: block; font-size: 0.85rem; color: #5B6770; margin-bottom: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">AXIS</label>
              <select id="right-axis" ${!lensOptions.prescription.r_cyl || lensOptions.prescription.r_cyl === '' ? 'disabled' : ''} style="width: 100%; padding: 0.75rem; border: 2px solid #d7dde1; border-radius: 8px; font-size: 1rem; font-family: inherit; transition: border-color 0.3s, box-shadow 0.3s; background: ${!lensOptions.prescription.r_cyl || lensOptions.prescription.r_cyl === '' ? '#f5f5f5' : 'white'}; cursor: ${!lensOptions.prescription.r_cyl || lensOptions.prescription.r_cyl === '' ? 'not-allowed' : 'pointer'}; color: ${!lensOptions.prescription.r_cyl || lensOptions.prescription.r_cyl === '' ? '#999' : 'inherit'};">
                <option value="">Select AXIS</option>
                ${axisOptions.map(opt => `<option value="${opt.value}" ${lensOptions.prescription.r_axis === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="prescription-column" style="background: #f8fbfc; padding: 1.5rem; border-radius: 12px; border: 1px solid #e8ecef;">
            <h4 style="color: #4b8a8a; margin-bottom: 1.25rem; font-size: 1.1rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Left Eye (OS)</h4>
            <div class="prescription-field" style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.85rem; color: #5B6770; margin-bottom: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">SPH</label>
              <select id="left-sph" style="width: 100%; padding: 0.75rem; border: 2px solid #d7dde1; border-radius: 8px; font-size: 1rem; font-family: inherit; transition: border-color 0.3s, box-shadow 0.3s; background: white; cursor: pointer;">
                <option value="">Select SPH</option>
                ${sphOptions.map(opt => `<option value="${opt.value}" ${lensOptions.prescription.l_sph === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
              </select>
            </div>
            <div class="prescription-field" style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.85rem; color: #5B6770; margin-bottom: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">CYL</label>
              <select id="left-cyl" style="width: 100%; padding: 0.75rem; border: 2px solid #d7dde1; border-radius: 8px; font-size: 1rem; font-family: inherit; transition: border-color 0.3s, box-shadow 0.3s; background: white; cursor: pointer;">
                ${cylOptions.map(opt => `<option value="${opt.value}" ${(lensOptions.prescription.l_cyl === opt.value || (!lensOptions.prescription.l_cyl && opt.value === '')) ? 'selected' : ''}>${opt.label}</option>`).join('')}
              </select>
            </div>
            <div class="prescription-field">
              <label style="display: block; font-size: 0.85rem; color: #5B6770; margin-bottom: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">AXIS</label>
              <select id="left-axis" ${!lensOptions.prescription.l_cyl || lensOptions.prescription.l_cyl === '' ? 'disabled' : ''} style="width: 100%; padding: 0.75rem; border: 2px solid #d7dde1; border-radius: 8px; font-size: 1rem; font-family: inherit; transition: border-color 0.3s, box-shadow 0.3s; background: ${!lensOptions.prescription.l_cyl || lensOptions.prescription.l_cyl === '' ? '#f5f5f5' : 'white'}; cursor: ${!lensOptions.prescription.l_cyl || lensOptions.prescription.l_cyl === '' ? 'not-allowed' : 'pointer'}; color: ${!lensOptions.prescription.l_cyl || lensOptions.prescription.l_cyl === '' ? '#999' : 'inherit'};">
                <option value="">Select AXIS</option>
                ${axisOptions.map(opt => `<option value="${opt.value}" ${lensOptions.prescription.l_axis === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
        
        <!-- Add Fields (always visible) -->
        <div class="prescription-additional" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
          <div class="prescription-field" id="intermediate-add-field">
            <label style="display: block; font-size: 0.85rem; color: #5B6770; margin-bottom: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Intermediate Add</label>
            <select id="intermediate-add" style="width: 100%; padding: 0.75rem; border: 2px solid #d7dde1; border-radius: 8px; font-size: 1rem; font-family: inherit; transition: border-color 0.3s, box-shadow 0.3s; background: white; cursor: pointer;">
              ${addOptions.map(opt => `<option value="${opt.value}" ${(lensOptions.prescription.intermediate_add === opt.value || (!lensOptions.prescription.intermediate_add && opt.value === '')) ? 'selected' : ''}>${opt.label}</option>`).join('')}
            </select>
          </div>
          <div class="prescription-field" id="near-add-field">
            <label style="display: block; font-size: 0.85rem; color: #5B6770; margin-bottom: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Near Add</label>
            <select id="near-add" style="width: 100%; padding: 0.75rem; border: 2px solid #d7dde1; border-radius: 8px; font-size: 1rem; font-family: inherit; transition: border-color 0.3s, box-shadow 0.3s; background: white; cursor: pointer;">
              ${addOptions.map(opt => `<option value="${opt.value}" ${(lensOptions.prescription.near_add === opt.value || (!lensOptions.prescription.near_add && opt.value === '')) ? 'selected' : ''}>${opt.label}</option>`).join('')}
            </select>
          </div>
        </div>
        
        <!-- PD Fields -->
        <div class="prescription-additional" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
          <div class="prescription-field">
            <label style="display: block; font-size: 0.85rem; color: #5B6770; margin-bottom: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">PD Left</label>
            <input type="text" id="left-pd" placeholder="e.g., 31" value="${lensOptions.prescription.left_pd || ''}" style="width: 100%; padding: 0.75rem; border: 2px solid #d7dde1; border-radius: 8px; font-size: 1rem; font-family: inherit; transition: border-color 0.3s, box-shadow 0.3s; background: white;">
          </div>
          <div class="prescription-field">
            <label style="display: block; font-size: 0.85rem; color: #5B6770; margin-bottom: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">PD Right</label>
            <input type="text" id="right-pd" placeholder="e.g., 31" value="${lensOptions.prescription.right_pd || ''}" style="width: 100%; padding: 0.75rem; border: 2px solid #d7dde1; border-radius: 8px; font-size: 1rem; font-family: inherit; transition: border-color 0.3s, box-shadow 0.3s; background: white;">
          </div>
          <div class="prescription-field">
            <label style="display: block; font-size: 0.85rem; color: #5B6770; margin-bottom: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">PD Combined</label>
            <input type="text" id="combined-pd" placeholder="e.g., 62" value="${lensOptions.prescription.combined_pd || ''}" style="width: 100%; padding: 0.75rem; border: 2px solid #d7dde1; border-radius: 8px; font-size: 1rem; font-family: inherit; transition: border-color 0.3s, box-shadow 0.3s; background: white;">
            <p style="font-size: 0.75rem; color: #6C757D; margin-top: 0.5rem; font-style: italic;">If you have one number, enter it here and it will split evenly</p>
          </div>
        </div>
        
        <!-- Usage Type Selector -->
        <div class="prescription-field" style="margin-bottom: 2rem;">
          <label style="display: block; font-size: 0.85rem; color: #5B6770; margin-bottom: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Prescription Usage Type</label>
          <select id="usage-type" style="width: 100%; padding: 0.75rem; border: 2px solid #d7dde1; border-radius: 8px; font-size: 1rem; font-family: inherit; transition: border-color 0.3s, box-shadow 0.3s; background: white; cursor: pointer;">
            <option value="Distance" ${prescriptionUsageType === 'Distance' ? 'selected' : ''}>Distance</option>
            <option value="Intermediate" ${prescriptionUsageType === 'Intermediate' ? 'selected' : ''} ${!lensOptions.prescription.intermediate_add || lensOptions.prescription.intermediate_add === '' ? 'disabled' : ''}>Intermediate${!lensOptions.prescription.intermediate_add || lensOptions.prescription.intermediate_add === '' ? ' (requires Intermediate Add)' : ''}</option>
            <option value="Reading" ${prescriptionUsageType === 'Reading' ? 'selected' : ''} ${!lensOptions.prescription.near_add || lensOptions.prescription.near_add === '' ? 'disabled' : ''}>Reading${!lensOptions.prescription.near_add || lensOptions.prescription.near_add === '' ? ' (requires Near Add)' : ''}</option>
          </select>
          <p style="font-size: 0.8rem; color: #6C757D; margin-top: 0.5rem; font-style: italic;">The selected usage type affects how prescription power is calculated and validated.</p>
          <div id="usage-type-error" style="display: none; color: #dc3545; font-size: 0.875rem; margin-top: 0.5rem;"></div>
        </div>
        
        <div class="prescription-field" style="margin-bottom: 2rem;">
          <label style="display: block; font-size: 0.85rem; color: #5B6770; margin-bottom: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Notes</label>
          <textarea id="prescription-notes" placeholder="Any additional prescription notes..." rows="3" style="width: 100%; padding: 0.75rem; border: 2px solid #d7dde1; border-radius: 8px; font-size: 1rem; font-family: inherit; transition: border-color 0.3s, box-shadow 0.3s; background: white; resize: vertical;">${lensOptions.prescription.notes || ''}</textarea>
        </div>
        
        <div style="background: #FFF3CD; border: 1px solid #FFC107; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
          <p style="font-size: 0.85rem; color: #856404; margin: 0; line-height: 1.5;">
            <strong>Note:</strong> Prescriptions containing <strong>prism values</strong> are not supported. If your prescription includes prism, please contact us before ordering.
          </p>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <button id="back-btn" class="btn-secondary" style="padding: 1rem 2rem; background: white; border: 2px solid #d7dde1; border-radius: 12px; color: #5B6770; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; flex: 1; min-width: 150px;">Back</button>
          <button type="button" id="add-to-cart-btn" class="add-to-cart-button" style="flex: 2; min-width: 200px;">Add to Cart</button>
        </div>
      </div>
    </div>
  `;

  // Set up event listeners
  setupEventListeners();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Store original PD values for recalculation
  let originalLeftPd = null;
  let originalRightPd = null;
  
  // Usage type selector with PD recalculation
  const usageTypeSelect = document.getElementById('usage-type');
  if (usageTypeSelect) {
    usageTypeSelect.addEventListener('change', (e) => {
      const newUsageType = e.target.value;
      const leftPdInput = document.getElementById('left-pd');
      const rightPdInput = document.getElementById('right-pd');
      
      // Store original PD values if not already stored OR if switching back to Distance
      // When switching to Distance, we should capture the current values as the new originals
      if (newUsageType === 'Distance') {
        if (leftPdInput && leftPdInput.value) {
          const value = parseFloat(leftPdInput.value);
          if (!isNaN(value) && value > 0) {
            originalLeftPd = value;
          }
        }
        if (rightPdInput && rightPdInput.value) {
          const value = parseFloat(rightPdInput.value);
          if (!isNaN(value) && value > 0) {
            originalRightPd = value;
          }
        }
      } else {
        // For Intermediate/Reading, only store if not already stored
        if (originalLeftPd === null && leftPdInput && leftPdInput.value) {
          const value = parseFloat(leftPdInput.value);
          if (!isNaN(value) && value > 0) {
            originalLeftPd = value;
          }
        }
        if (originalRightPd === null && rightPdInput && rightPdInput.value) {
          const value = parseFloat(rightPdInput.value);
          if (!isNaN(value) && value > 0) {
            originalRightPd = value;
          }
        }
      }
      
      // If we have original values, recalculate based on usage type
      if (originalLeftPd !== null && originalRightPd !== null && leftPdInput && rightPdInput) {
        let newLeftPd = originalLeftPd;
        let newRightPd = originalRightPd;
        let pdChanged = false;
        
        if (newUsageType === 'Intermediate') {
          newLeftPd = originalLeftPd - 1;
          newRightPd = originalRightPd - 1;
          pdChanged = true;
        } else if (newUsageType === 'Reading') {
          newLeftPd = originalLeftPd - 1.5;
          newRightPd = originalRightPd - 1.5;
          pdChanged = true;
        } else if (newUsageType === 'Distance') {
          // Restore original values
          newLeftPd = originalLeftPd;
          newRightPd = originalRightPd;
          const currentLeft = parseFloat(leftPdInput.value) || 0;
          const currentRight = parseFloat(rightPdInput.value) || 0;
          pdChanged = (Math.abs(currentLeft - originalLeftPd) > 0.01 || Math.abs(currentRight - originalRightPd) > 0.01);
        }
        
        // Update PD values
        if (pdChanged) {
          leftPdInput.value = newLeftPd.toFixed(1);
          rightPdInput.value = newRightPd.toFixed(1);
          lensOptions.prescription.left_pd = newLeftPd.toFixed(1);
          lensOptions.prescription.right_pd = newRightPd.toFixed(1);
          sessionStorage.setItem('lensOptions', JSON.stringify(lensOptions));
          
          // Show popup notification (only if not Distance, since Distance restores original)
          if (newUsageType !== 'Distance') {
            showPdRecalculatedPopup();
          }
        }
      }
      
      prescriptionUsageType = newUsageType;
      sessionStorage.setItem('prescriptionUsageType', prescriptionUsageType);
      
      // Validate prescription on change
      validatePrescriptionDisplay();
    });
  }
  
  // Function to show PD recalculated popup
  function showPdRecalculatedPopup() {
    // Create popup overlay
    const overlay = document.createElement('div');
    overlay.id = 'pd-recalc-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    
    // Create popup content
    const popup = document.createElement('div');
    popup.style.cssText = 'background: white; border-radius: 12px; padding: 2rem; max-width: 400px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); position: relative;';
    
    // Create tooltip explanation (initially hidden)
    const explanationText = 'Reading and intermediate specific glasses are for tasks closer up than for distance tasks (such as television). When you look at things nearer your eyes turn in (converge) and the distance between the eyes gets smaller. We automatically recalculate your PD to account for this';
    
    popup.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 1rem;">
        <h3 style="font-size: 1.25rem; color: #212529; margin: 0; font-weight: 700; flex: 1;">PD Recalculated</h3>
        <div id="pd-info-container" style="position: relative;">
          <button id="pd-info-icon" style="background: #4b8a8a; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 0.875rem; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 700; line-height: 1; padding: 0; transition: background 0.3s;" aria-label="More information">?</button>
          <div id="pd-info-tooltip" style="position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 0.5rem; background: #212529; color: white; padding: 0.75rem; border-radius: 8px; font-size: 0.875rem; line-height: 1.5; max-width: 280px; width: max-content; display: none; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); z-index: 10001; pointer-events: none;">
            ${explanationText}
            <div style="position: absolute; top: 100%; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid #212529;"></div>
          </div>
        </div>
      </div>
      <p style="font-size: 1rem; color: #5B6770; margin: 0 0 1.5rem 0; line-height: 1.5;">PD has been recalculated based on Usage Type.</p>
      <button id="pd-recalc-ok" style="width: 100%; padding: 0.75rem; background: #4b8a8a; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.3s;">OK</button>
    `;
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // Handle question mark icon - hover for desktop, click for mobile
    const infoIcon = document.getElementById('pd-info-icon');
    const tooltip = document.getElementById('pd-info-tooltip');
    let tooltipVisible = false;
    
    // Desktop: show on hover
    infoIcon.addEventListener('mouseenter', () => {
      tooltip.style.display = 'block';
      tooltipVisible = true;
    });
    
    infoIcon.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
      tooltipVisible = false;
    });
    
    // Mobile: toggle on click
    infoIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      if (tooltipVisible) {
        tooltip.style.display = 'none';
        tooltipVisible = false;
      } else {
        tooltip.style.display = 'block';
        tooltipVisible = true;
      }
    });
    
    // Close tooltip when clicking outside (mobile)
    document.addEventListener('click', function closeTooltip(e) {
      if (!popup.contains(e.target) && tooltipVisible) {
        tooltip.style.display = 'none';
        tooltipVisible = false;
      }
    });
    
    // Handle OK button click
    const okButton = document.getElementById('pd-recalc-ok');
    okButton.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    
    // Handle overlay click (close popup)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
    
    // Prevent popup clicks from closing overlay
    popup.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  // Store original PD values when PD fields are manually changed
  // Only update originals if we're on Distance (base) usage type
  ['left-pd', 'right-pd'].forEach(pdId => {
    const pdInput = document.getElementById(pdId);
    if (pdInput) {
      pdInput.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value) && value > 0) {
          // Only update original values if we're on Distance or if originals are null
          if (prescriptionUsageType === 'Distance' || originalLeftPd === null || originalRightPd === null) {
            if (pdId === 'left-pd') {
              originalLeftPd = value;
            } else {
              originalRightPd = value;
            }
          }
        }
      });
    }
  });
  
  // Handle combined PD field - when it splits, store as original values (only on Distance)
  const combinedPdInput = document.getElementById('combined-pd');
  if (combinedPdInput) {
    combinedPdInput.addEventListener('input', (e) => {
      const combinedValue = parseFloat(e.target.value);
      if (!isNaN(combinedValue) && combinedValue > 0) {
        const halfValue = combinedValue / 2;
        // Only update originals if on Distance or if originals are null
        if (prescriptionUsageType === 'Distance' || originalLeftPd === null || originalRightPd === null) {
          originalLeftPd = halfValue;
          originalRightPd = halfValue;
        }
      }
    });
  }
  
  // Initialize original PD values on page load
  const leftPdInput = document.getElementById('left-pd');
  const rightPdInput = document.getElementById('right-pd');
  if (leftPdInput && leftPdInput.value) {
    const value = parseFloat(leftPdInput.value);
    if (!isNaN(value)) {
      originalLeftPd = value;
    }
  }
  if (rightPdInput && rightPdInput.value) {
    const value = parseFloat(rightPdInput.value);
    if (!isNaN(value)) {
      originalRightPd = value;
    }
  }
  
  // Update usage type options when add fields change
  const intermediateAddSelect = document.getElementById('intermediate-add');
  const nearAddSelect = document.getElementById('near-add');
  
  if (intermediateAddSelect) {
    intermediateAddSelect.addEventListener('change', () => {
      validateUsageTypeSelection();
    });
  }
  
  if (nearAddSelect) {
    nearAddSelect.addEventListener('change', () => {
      validateUsageTypeSelection();
    });
  }
  
  // Initialize usage type validation on page load
  validateUsageTypeSelection();
  
  // Prescription inputs
  const prescriptionFields = {
    'right-sph': 'r_sph',
    'right-cyl': 'r_cyl',
    'right-axis': 'r_axis',
    'left-sph': 'l_sph',
    'left-cyl': 'l_cyl',
    'left-axis': 'l_axis',
    'left-pd': 'left_pd',
    'right-pd': 'right_pd',
    'combined-pd': 'combined_pd',
    'intermediate-add': 'intermediate_add',
    'near-add': 'near_add',
    'prescription-notes': 'notes'
  };

  Object.keys(prescriptionFields).forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(eventType, (e) => {
        lensOptions.prescription[prescriptionFields[inputId]] = e.target.value;
        sessionStorage.setItem('lensOptions', JSON.stringify(lensOptions));
        
        // Handle combined PD splitting
        if (inputId === 'combined-pd' && e.target.value) {
          const combinedValue = parseFloat(e.target.value);
          if (!isNaN(combinedValue) && combinedValue > 0) {
            const halfValue = (combinedValue / 2).toFixed(1);
            lensOptions.prescription.left_pd = halfValue;
            lensOptions.prescription.right_pd = halfValue;
            
            const leftPdInput = document.getElementById('left-pd');
            const rightPdInput = document.getElementById('right-pd');
            if (leftPdInput) leftPdInput.value = halfValue;
            if (rightPdInput) rightPdInput.value = halfValue;
            
            sessionStorage.setItem('lensOptions', JSON.stringify(lensOptions));
          }
        }
        
        // Validate prescription on change
        validatePrescriptionDisplay();
      });
      
      // Add focus styles
      input.addEventListener('focus', function() {
        this.style.borderColor = '#4b8a8a';
        this.style.boxShadow = '0 0 0 3px rgba(75, 138, 138, 0.1)';
      });
      input.addEventListener('blur', function() {
        this.style.borderColor = '#d7dde1';
        this.style.boxShadow = 'none';
      });
    }
  });
  
  // Handle CYL changes: enable/disable axis field and require axis when CYL is set
  ['right-cyl', 'left-cyl'].forEach(cylId => {
    const cylSelect = document.getElementById(cylId);
    if (cylSelect) {
      cylSelect.addEventListener('change', () => {
        const eye = cylId.includes('right') ? 'right' : 'left';
        const axisSelect = document.getElementById(`${eye}-axis`);
        const cylValue = cylSelect.value;
        
        if (axisSelect) {
          // If CYL is empty or "Not required", disable and clear axis
          if (!cylValue || cylValue === '') {
            axisSelect.disabled = true;
            axisSelect.style.background = '#f5f5f5';
            axisSelect.style.cursor = 'not-allowed';
            axisSelect.style.color = '#999';
            axisSelect.required = false;
            axisSelect.style.borderColor = '#d7dde1';
            // Clear axis value when CYL is cleared
            lensOptions.prescription[`${eye}_axis`] = '';
            axisSelect.value = '';
            sessionStorage.setItem('lensOptions', JSON.stringify(lensOptions));
          } else {
            // If CYL has a value, enable axis and require it
            axisSelect.disabled = false;
            axisSelect.style.background = 'white';
            axisSelect.style.cursor = 'pointer';
            axisSelect.style.color = 'inherit';
            axisSelect.required = true;
            axisSelect.style.borderColor = '#d7dde1';
          }
        }
        
        // Validate prescription on change
        validatePrescriptionDisplay();
      });
    }
  });
  
  // Initialize axis field states on page load
  ['right-cyl', 'left-cyl'].forEach(cylId => {
    const cylSelect = document.getElementById(cylId);
    if (cylSelect) {
      const eye = cylId.includes('right') ? 'right' : 'left';
      const axisSelect = document.getElementById(`${eye}-axis`);
      const cylValue = cylSelect.value;
      
      if (axisSelect) {
        if (!cylValue || cylValue === '') {
          axisSelect.disabled = true;
          axisSelect.style.background = '#f5f5f5';
          axisSelect.style.cursor = 'not-allowed';
          axisSelect.style.color = '#999';
        } else {
          axisSelect.disabled = false;
          axisSelect.style.background = 'white';
          axisSelect.style.cursor = 'pointer';
          axisSelect.style.color = 'inherit';
        }
      }
    }
  });

  // Back button
  document.getElementById('back-btn')?.addEventListener('click', () => {
    const handle = sessionStorage.getItem('productHandle');
    if (handle) {
      window.location.href = `frame.html?handle=${handle}`;
    } else {
      window.location.href = 'shop.html';
    }
  });

  // Add to cart button - prevent default form submission
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Disable button during processing
      addToCartBtn.disabled = true;
      addToCartBtn.textContent = 'Adding...';
      
      try {
        await addToCart();
      } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Error adding to cart. Please try again.');
      } finally {
        // Re-enable button
        addToCartBtn.disabled = false;
        addToCartBtn.textContent = 'Add to Cart';
      }
    });
  }
  
  // Initial validation display
  validatePrescriptionDisplay();
}

/**
 * Validate prescription and display errors
 */
function validatePrescriptionDisplay() {
  const errorContainer = document.getElementById('prescription-error');
  if (!errorContainer) return;
  
  const validation = validatePrescription(lensOptions.prescription, prescriptionUsageType);
  
  if (!validation.valid) {
    errorContainer.style.display = 'block';
    errorContainer.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 0.5rem;">Prescription Validation Error:</div>
      <ul style="margin: 0; padding-left: 1.5rem;">
        ${validation.errors.map(err => `<li style="margin-bottom: 0.25rem;">${err}</li>`).join('')}
      </ul>
      <p style="margin-top: 0.75rem; margin-bottom: 0; font-size: 0.9rem;">
        This prescription exceeds our manufacturing limits when configured for the selected use. Please adjust the prescription type or contact us for assistance.
      </p>
    `;
  } else {
    errorContainer.style.display = 'none';
  }
}

/**
 * Initialize prescription page
 */
async function initPrescription() {
  // Wait for credentials
  let attempts = 0;
  while ((!window.SHOPIFY_STORE_DOMAIN || !window.SHOPIFY_STOREFRONT_TOKEN) && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  SHOPIFY_CONFIG.domain = window.SHOPIFY_STORE_DOMAIN || '';
  SHOPIFY_CONFIG.accessToken = window.SHOPIFY_STOREFRONT_TOKEN || '';

  // Check if we have required data from previous page
  const variantId = sessionStorage.getItem('selectedVariantId');
  if (!variantId) {
    document.getElementById('prescription-container').innerHTML = `
      <div class="product-error" style="text-align: center; padding: 4rem 2rem; background: white; border-radius: 12px; max-width: 600px; margin: 0 auto;">
        <p style="color: #5B6770; font-size: 1.1rem; margin-bottom: 1.5rem;">No product selected. Please select a frame first.</p>
        <a href="shop.html" class="btn-primary" style="display: inline-block; padding: 0.75rem 1.5rem; background: #4b8a8a; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Back to Shop</a>
      </div>
    `;
    return;
  }

  renderPrescriptionForm();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPrescription);
} else {
  initPrescription();
}

