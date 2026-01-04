/**
 * Fetch All Shopify Tags
 * 
 * This script fetches all products from Shopify and displays all unique tags.
 * 
 * Usage:
 * 1. Make sure SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN are set
 * 2. Open browser console on any page
 * 3. Run: fetchAllTags()
 * 
 * Or include this script in an HTML page and call the function.
 */

// Shopify API Configuration - reuse existing if available, otherwise create new
const SHOPIFY_TAGS_CONFIG = (function() {
  // Check if SHOPIFY_CONFIG already exists (from shopify-shop.js)
  if (typeof window.SHOPIFY_CONFIG !== 'undefined') {
    return window.SHOPIFY_CONFIG;
  }
  // Otherwise create our own
  return {
    domain: window.SHOPIFY_STORE_DOMAIN || '',
    accessToken: window.SHOPIFY_STOREFRONT_TOKEN || '',
    apiVersion: '2025-01',
  };
})();

// GraphQL Query to fetch all products with tags
const ALL_TAGS_QUERY = `
  query getAllProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          tags
        }
      }
    }
  }
`;

/**
 * Fetch all products and extract unique tags
 */
window.fetchAllTags = async function fetchAllTags() {
  const config = SHOPIFY_TAGS_CONFIG;
  
  if (!config.domain || !config.accessToken) {
    console.error('Shopify credentials not configured!');
    console.log('Make sure SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN are set.');
    return;
  }

  const endpoint = `https://${config.domain}/api/${config.apiVersion}/graphql.json`;
  const allTags = new Set();
  const tagUsage = {}; // Track which products use each tag
  let hasNextPage = true;
  let cursor = null;
  let productCount = 0;

  console.log('Fetching all products and tags from Shopify...');
  console.log('This may take a moment...\n');

  try {
    while (hasNextPage) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': config.accessToken,
        },
        body: JSON.stringify({
          query: ALL_TAGS_QUERY,
          variables: { 
            first: 250, // Maximum allowed
            after: cursor 
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();

      if (json.errors) {
        console.error('Shopify GraphQL errors:', json.errors);
        return;
      }

      const products = json.data?.products?.edges || [];
      
      products.forEach(({ node }) => {
        productCount++;
        if (node.tags && node.tags.length > 0) {
          node.tags.forEach(tag => {
            // Add to set for unique list
            allTags.add(tag);
            
            // Track usage
            if (!tagUsage[tag]) {
              tagUsage[tag] = [];
            }
            tagUsage[tag].push({
              title: node.title,
              handle: node.handle
            });
          });
        }
      });

      // Check if there are more pages
      hasNextPage = json.data?.products?.pageInfo?.hasNextPage || false;
      cursor = json.data?.products?.pageInfo?.endCursor || null;

      if (hasNextPage) {
        console.log(`Fetched ${productCount} products so far...`);
      }
    }

    // Convert Set to sorted array
    const sortedTags = Array.from(allTags).sort();

    // Display results
    console.log('\n========================================');
    console.log('ALL SHOPIFY TAGS');
    console.log('========================================');
    console.log(`Total Products: ${productCount}`);
    console.log(`Total Unique Tags: ${sortedTags.length}`);
    console.log('\n--- All Tags (Alphabetical) ---');
    sortedTags.forEach((tag, index) => {
      const usageCount = tagUsage[tag]?.length || 0;
      console.log(`${index + 1}. "${tag}" (used by ${usageCount} product${usageCount !== 1 ? 's' : ''})`);
    });

    // Group tags by category (if they follow a pattern)
    console.log('\n--- Tags by Category (if applicable) ---');
    const genderTags = sortedTags.filter(t => 
      t.toLowerCase().includes('men') || 
      t.toLowerCase().includes('ladies') || 
      t.toLowerCase().includes('unisex')
    );
    const shapeTags = sortedTags.filter(t => 
      t.toLowerCase().includes('rectangle') || 
      t.toLowerCase().includes('round') || 
      t.toLowerCase().includes('wayfare') ||
      t.toLowerCase().includes('square') ||
      t.toLowerCase().includes('oval')
    );
    const materialTags = sortedTags.filter(t => 
      t.toLowerCase().includes('metal') || 
      t.toLowerCase().includes('plastic')
    );

    if (genderTags.length > 0) {
      console.log('\nGender Tags:');
      genderTags.forEach(tag => console.log(`  - "${tag}"`));
    }
    if (shapeTags.length > 0) {
      console.log('\nShape Tags:');
      shapeTags.forEach(tag => console.log(`  - "${tag}"`));
    }
    if (materialTags.length > 0) {
      console.log('\nMaterial Tags:');
      materialTags.forEach(tag => console.log(`  - "${tag}"`));
    }

    // Show tags with leading/trailing spaces (common issue)
    const tagsWithSpaces = sortedTags.filter(t => t.trim() !== t);
    if (tagsWithSpaces.length > 0) {
      console.log('\n⚠️  WARNING: Tags with leading/trailing spaces:');
      tagsWithSpaces.forEach(tag => {
        console.log(`  - "${tag}" (length: ${tag.length}, trimmed: "${tag.trim()}")`);
      });
    }

    // Return data for programmatic use
    return {
      tags: sortedTags,
      tagUsage,
      productCount
    };

  } catch (error) {
    console.error('Error fetching tags:', error);
    return null;
  }
}

// Function is already assigned to window.fetchAllTags above (line 51)
// Just log that it's ready
if (typeof window !== 'undefined') {
  // Log instructions when script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('✅ fetchAllTags() function loaded!');
      console.log('Run fetchAllTags() in the console to see all your Shopify tags.');
    });
  } else {
    console.log('✅ fetchAllTags() function loaded!');
    console.log('Run fetchAllTags() in the console to see all your Shopify tags.');
  }
}

