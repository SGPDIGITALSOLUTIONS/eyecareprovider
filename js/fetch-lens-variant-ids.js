/**
 * Helper script to fetch Lens Addon Variant IDs from Shopify
 * 
 * This script queries Shopify to find variant IDs for the "Lenses" 
 * and "Photochromic Add On" products based on variant titles/codes.
 * 
 * Usage:
 * 1. Open browser console on any page with Shopify credentials loaded
 * 2. Run: fetchLensVariantIds()
 * 3. Copy the output and replace the placeholders in frame.html and prescription.html
 */

async function fetchLensVariantIds() {
  if (!window.SHOPIFY_STORE_DOMAIN || !window.SHOPIFY_STOREFRONT_TOKEN) {
    console.error('Shopify credentials not loaded. Please wait for credentials to load.');
    return;
  }

  const domain = window.SHOPIFY_STORE_DOMAIN;
  const token = window.SHOPIFY_STOREFRONT_TOKEN;
  const apiVersion = '2025-01';
  const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`;

  // GraphQL query to fetch products and their variants
  const query = `
    query getLensProducts {
      # Lenses product
      lensesInternal: product(handle: "lenses") {
        id
        title
        handle
        variants(first: 20) {
          nodes {
            id
            title
            sku
            price {
              amount
              currencyCode
            }
          }
        }
      }
      # Photochromic Add On product (try multiple possible handles)
      photochromic: product(handle: "photochromic-add-on") {
        id
        title
        handle
        variants(first: 20) {
          nodes {
            id
            title
            sku
            price {
              amount
              currencyCode
            }
          }
        }
      }
      # Add Ons product (alternative name)
      addOns: product(handle: "add-ons") {
        id
        title
        handle
        variants(first: 20) {
          nodes {
            id
            title
            sku
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    if (json.errors) {
      console.error('GraphQL errors:', json.errors);
      return;
    }

    const data = json.data;
    const variantMap = {};

    // Process Lenses variants
    if (data.lensesInternal && data.lensesInternal.variants) {
      console.log('\n=== Lenses Product ===');
      console.log(`Product: ${data.lensesInternal.title} (${data.lensesInternal.handle})`);
      
      data.lensesInternal.variants.nodes.forEach(variant => {
        const skuDisplay = variant.sku ? `SKU: ${variant.sku} | ` : '';
        console.log(`  Variant: ${variant.title} | ${skuDisplay}ID: ${variant.id} | Price: £${variant.price.amount}`);
        
        // Map variant titles/codes/SKUs to our codes
        const title = variant.title.toUpperCase();
        const sku = (variant.sku || '').toUpperCase();
        const searchText = `${title} ${sku}`;
        
        if (searchText.includes('SV15HC') || searchText.includes('1.5 HARDCOAT') || searchText.includes('1.5 HC')) {
          variantMap['SV15HC'] = variant.id;
        } else if (searchText.includes('SV15AR') || (searchText.includes('1.5') && searchText.includes('MAR') && !searchText.includes('BLUE'))) {
          variantMap['SV15AR'] = variant.id;
        } else if (searchText.includes('SV15BAR') || searchText.includes('SV15B') || (searchText.includes('1.5') && searchText.includes('BLUE'))) {
          variantMap['SV15BAR'] = variant.id;
        } else if (searchText.includes('SV16AR') || searchText.includes('1.6 MAR')) {
          variantMap['SV16AR'] = variant.id;
        } else if (searchText.includes('SV167AR') || searchText.includes('1.67 MAR')) {
          variantMap['SV167AR'] = variant.id;
        } else if (searchText.includes('SV174AR') || searchText.includes('1.74 MAR')) {
          variantMap['SV174AR'] = variant.id;
        }
      });
    } else {
      console.warn('Lenses product not found. Check the product handle.');
    }

    // Process Photochromic Add On variants (try photochromic-add-on first)
    let photochromicProduct = data.photochromic || data.addOns;
    
    if (photochromicProduct && photochromicProduct.variants) {
      console.log('\n=== Photochromic Add On / Add Ons Product ===');
      console.log(`Product: ${photochromicProduct.title} (${photochromicProduct.handle})`);
      
      photochromicProduct.variants.nodes.forEach(variant => {
        const skuDisplay = variant.sku ? `SKU: ${variant.sku} | ` : '';
        console.log(`  Variant: ${variant.title} | ${skuDisplay}ID: ${variant.id} | Price: £${variant.price.amount}`);
        
        // Map variant titles/SKUs to our codes
        const title = variant.title.toUpperCase();
        const sku = (variant.sku || '').toUpperCase();
        const searchText = `${title} ${sku}`;
        
        if (searchText.includes('PHOTOGR') || searchText.includes('GREY') || searchText.includes('GRAY')) {
          variantMap['PHOTOGR'] = variant.id;
        } else if (searchText.includes('PHOTOBR') || searchText.includes('BROWN')) {
          variantMap['PHOTOBR'] = variant.id;
        }
      });
    } else {
      console.warn('Photochromic Add On / Add Ons product not found.');
      console.warn('Tried handles: "photochromic-add-on" and "add-ons"');
      console.warn('Please check your Shopify product handle and update the script if needed.');
    }

    // Output the configuration object
    console.log('\n=== Configuration Object ===');
    console.log('Copy this and replace the window.SHOPIFY_LENS_ADDON_VARIANTS in frame.html and prescription.html:');
    console.log('\nwindow.SHOPIFY_LENS_ADDON_VARIANTS = {');
    console.log(`    'SV15HC': '${variantMap['SV15HC'] || 'NOT_FOUND'}',   // Single Vision 1.5 Hardcoat`);
    console.log(`    'SV15AR': '${variantMap['SV15AR'] || 'NOT_FOUND'}',    // Single Vision 1.5 MAR`);
    console.log(`    'SV15BAR': '${variantMap['SV15BAR'] || 'NOT_FOUND'}',  // Single Vision 1.5 Blue MAR`);
    console.log(`    'SV16AR': '${variantMap['SV16AR'] || 'NOT_FOUND'}',   // Single Vision 1.6 MAR`);
    console.log(`    'SV167AR': '${variantMap['SV167AR'] || 'NOT_FOUND'}', // Single Vision 1.67 MAR`);
    console.log(`    'SV174AR': '${variantMap['SV174AR'] || 'NOT_FOUND'}',  // Single Vision 1.74 MAR`);
    console.log(`    'PHOTOGR': '${variantMap['PHOTOGR'] || 'NOT_FOUND'}',   // Photochromic Grey`);
    console.log(`    'PHOTOBR': '${variantMap['PHOTOBR'] || 'NOT_FOUND'}',   // Photochromic Brown`);
    console.log('};');

    // Also output as JSON for easy copying
    console.log('\n=== JSON Format (for easy copy) ===');
    console.log(JSON.stringify(variantMap, null, 2));

    return variantMap;
  } catch (error) {
    console.error('Error fetching variant IDs:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure Shopify credentials are loaded');
    console.error('2. Check that product handles are correct:');
    console.error('   - "lenses" for the lens product');
    console.error('   - "photochromic-add-on" or "add-ons" for the photochromic product');
    console.error('3. Verify variant titles or SKUs match expected codes (SV15HC, SV15AR, PHOTOGR, PHOTOBR, etc.)');
    console.error('4. Note: Variant ID is NOT the same as SKU. The script will show both.');
    return null;
  }
}

// Make function available globally
window.fetchLensVariantIds = fetchLensVariantIds;

console.log('Helper script loaded! Run fetchLensVariantIds() in the console to fetch variant IDs.');

