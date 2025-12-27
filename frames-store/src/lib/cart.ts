/**
 * Cart Management Functions
 * Uses localStorage to store cartId
 */

'use client';

import { shopifyFetch } from './shopify';
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_QUERY,
} from './queries';

const CART_ID_KEY = 'shopify_cart_id';

export interface CartLineAttribute {
  key: string;
  value: string;
}

export interface CartLineInput {
  merchandiseId: string;
  quantity: number;
  attributes?: CartLineAttribute[];
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  cost: {
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
  };
  lines: {
    edges: Array<{
      node: {
        id: string;
        quantity: number;
        merchandise: {
          id: string;
          title: string;
          price: {
            amount: string;
            currencyCode: string;
          };
          image?: {
            url: string;
            altText?: string;
          };
          product: {
            title: string;
          };
          selectedOptions: Array<{
            name: string;
            value: string;
          }>;
        };
        attributes: CartLineAttribute[];
      };
    }>;
  };
}

/**
 * Get cart ID from localStorage
 */
export function getCartId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CART_ID_KEY);
}

/**
 * Save cart ID to localStorage
 */
export function saveCartId(cartId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_ID_KEY, cartId);
}

/**
 * Clear cart ID from localStorage
 */
export function clearCartId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_ID_KEY);
}

/**
 * Create a new cart
 */
export async function createCart(
  lines: CartLineInput[]
): Promise<{ cart: Cart | null; errors: string[] }> {
  const response = await shopifyFetch<{
    cartCreate: {
      cart: Cart | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(CART_CREATE_MUTATION, {
    input: {
      lines,
    },
  });

  if (response.errors) {
    return {
      cart: null,
      errors: response.errors.map((e) => e.message),
    };
  }

  const cart = response.data?.cartCreate.cart || null;
  const userErrors = response.data?.cartCreate.userErrors || [];

  if (cart) {
    saveCartId(cart.id);
  }

  return {
    cart,
    errors: userErrors.map((e) => e.message),
  };
}

/**
 * Add lines to existing cart
 */
export async function addToCart(
  cartId: string,
  lines: CartLineInput[]
): Promise<{ cart: Cart | null; errors: string[] }> {
  const response = await shopifyFetch<{
    cartLinesAdd: {
      cart: Cart | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(CART_LINES_ADD_MUTATION, {
    cartId,
    lines,
  });

  if (response.errors) {
    return {
      cart: null,
      errors: response.errors.map((e) => e.message),
    };
  }

  const cart = response.data?.cartLinesAdd.cart || null;
  const userErrors = response.data?.cartLinesAdd.userErrors || [];

  return {
    cart,
    errors: userErrors.map((e) => e.message),
  };
}

/**
 * Update cart line quantities
 */
export async function updateCartLines(
  cartId: string,
  lines: Array<{ id: string; quantity: number }>
): Promise<{ cart: Cart | null; errors: string[] }> {
  const response = await shopifyFetch<{
    cartLinesUpdate: {
      cart: Cart | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(CART_LINES_UPDATE_MUTATION, {
    cartId,
    lines,
  });

  if (response.errors) {
    return {
      cart: null,
      errors: response.errors.map((e) => e.message),
    };
  }

  const cart = response.data?.cartLinesUpdate.cart || null;
  const userErrors = response.data?.cartLinesUpdate.userErrors || [];

  return {
    cart,
    errors: userErrors.map((e) => e.message),
  };
}

/**
 * Remove lines from cart
 */
export async function removeCartLines(
  cartId: string,
  lineIds: string[]
): Promise<{ cart: Cart | null; errors: string[] }> {
  const response = await shopifyFetch<{
    cartLinesRemove: {
      cart: Cart | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(CART_LINES_REMOVE_MUTATION, {
    cartId,
    lineIds,
  });

  if (response.errors) {
    return {
      cart: null,
      errors: response.errors.map((e) => e.message),
    };
  }

  const cart = response.data?.cartLinesRemove.cart || null;
  const userErrors = response.data?.cartLinesRemove.userErrors || [];

  return {
    cart,
    errors: userErrors.map((e) => e.message),
  };
}

/**
 * Get cart by ID
 */
export async function getCart(cartId: string): Promise<{ cart: Cart | null; errors: string[] }> {
  const response = await shopifyFetch<{
    cart: Cart | null;
  }>(CART_QUERY, {
    id: cartId,
  });

  if (response.errors) {
    return {
      cart: null,
      errors: response.errors.map((e) => e.message),
    };
  }

  return {
    cart: response.data?.cart || null,
    errors: [],
  };
}

/**
 * Add item to cart (creates cart if needed)
 */
export async function addItemToCart(
  variantId: string,
  quantity: number = 1,
  attributes: CartLineAttribute[] = []
): Promise<{ success: boolean; cart: Cart | null; errors: string[] }> {
  const line: CartLineInput = {
    merchandiseId: variantId,
    quantity,
    attributes: attributes.length > 0 ? attributes : undefined,
  };

  const existingCartId = getCartId();

  if (existingCartId) {
    // Add to existing cart
    const result = await addToCart(existingCartId, [line]);
    return {
      success: result.errors.length === 0,
      cart: result.cart,
      errors: result.errors,
    };
  } else {
    // Create new cart
    const result = await createCart([line]);
    return {
      success: result.errors.length === 0,
      cart: result.cart,
      errors: result.errors,
    };
  }
}

