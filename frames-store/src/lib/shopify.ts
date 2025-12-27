/**
 * Shopify Storefront API Client
 * Handles GraphQL requests to Shopify
 */

const domain = process.env.SHOPIFY_STORE_DOMAIN!;
const storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;
const apiVersion = process.env.SHOPIFY_API_VERSION || '2025-01';

const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`;

export interface ShopifyError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: string[];
}

export interface ShopifyResponse<T> {
  data?: T;
  errors?: ShopifyError[];
}

export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, any> = {}
): Promise<ShopifyResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    if (json.errors) {
      console.error('Shopify GraphQL errors:', json.errors);
      return { errors: json.errors };
    }

    return { data: json.data };
  } catch (error) {
    console.error('Shopify fetch error:', error);
    return {
      errors: [
        {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      ],
    };
  }
}

