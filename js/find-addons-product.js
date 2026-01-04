/**
 * Helper script to find the "Add Ons" product handle
 * Run this in the browser console to find the correct product handle
 */

async function findAddOnsProduct() {
  if (!window.SHOPIFY_STORE_DOMAIN || !window.SHOPIFY_STOREFRONT_TOKEN) {
    console.error('Shopify credentials not loaded. Please wait for credentials to load.');
    return;
  }

  const domain = window.SHOPIFY_STORE_DOMAIN;
  const token = window.SHOPIFY_STOREFRONT_TOKEN;
  const apiVersion = '2025-01';
  const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`;

  // Search for products with "add" or "photo" in the title
  const query = `
    query searchProducts {
      products(first: 50, query: "title:*add* OR title:*Add* OR title:*photo* OR title:*Photo*") {
        edges {
          node {
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

    const products = json.data.products.edges;
    
    console.log(`\n=== Found ${products.length} products ===\n`);
    
    // Look for "Add Ons" product
    const addOnsProduct = products.find(({node}) => 
      node.title.toLowerCase().includes('add on') || 
      node.title.toLowerCase().includes('addon') ||
      node.title === 'Add Ons'
    );

    if (addOnsProduct) {
      const product = addOnsProduct.node;
      console.log('✅ FOUND "Add Ons" PRODUCT!');
      console.log(`\nProduct: ${product.title}`);
      console.log(`Handle: "${product.handle}"`);
      console.log(`\nVariants:`);
      
      const variantMap = {};
      
      product.variants.nodes.forEach(variant => {
        const skuDisplay = variant.sku ? `SKU: ${variant.sku} | ` : '';
        console.log(`  - ${variant.title} | ${skuDisplay}ID: ${variant.id} | Price: £${variant.price.amount}`);
        
        // Map to our codes
        const sku = (variant.sku || '').toUpperCase();
        if (sku === 'PHOTOGR') {
          variantMap['PHOTOGR'] = variant.id;
        } else if (sku === 'PHOTOBR') {
          variantMap['PHOTOBR'] = variant.id;
        }
      });
      
      console.log('\n=== Variant IDs for Configuration ===');
      console.log('Copy these into frame.html and prescription.html:');
      console.log(`\n'PHOTOGR': '${variantMap['PHOTOGR'] || 'NOT_FOUND'}',   // Photochromic Grey`);
      console.log(`'PHOTOBR': '${variantMap['PHOTOBR'] || 'NOT_FOUND'}',   // Photochromic Brown`);
      
      return {
        handle: product.handle,
        variants: variantMap
      };
    } else {
      console.log('❌ "Add Ons" product not found in search results.');
      console.log('\nAll products found:');
      products.forEach(({node}) => {
        console.log(`  - ${node.title} (handle: "${node.handle}")`);
      });
      console.log('\n💡 Tip: Check the product URL in Shopify Admin to find the handle.');
      return null;
    }
  } catch (error) {
    console.error('Error searching for products:', error);
    return null;
  }
}

// Make function available globally
window.findAddOnsProduct = findAddOnsProduct;

console.log('Helper script loaded! Run findAddOnsProduct() in the console to find the Add Ons product.');

