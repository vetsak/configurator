import { storefrontFetch } from './shopify-client';

// ── Types ──────────────────────────────────────────────────────
interface CartLine {
  variantId: string;
  quantity: number;
}

interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  lines: {
    edges: Array<{
      node: {
        id: string;
        quantity: number;
        merchandise: { id: string; title: string };
        cost: { totalAmount: { amount: string; currencyCode: string } };
      };
    }>;
  };
  cost: {
    totalAmount: { amount: string; currencyCode: string };
  };
}

interface CreateCartResponse {
  cartCreate: {
    cart: ShopifyCart;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

interface AddToCartResponse {
  cartLinesAdd: {
    cart: ShopifyCart;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

// ── Queries ────────────────────────────────────────────────────

const CART_CREATE_MUTATION = `
  mutation CartCreate($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                }
              }
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_LINES_ADD_MUTATION = `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                }
              }
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// ── Cart state ─────────────────────────────────────────────────
let currentCartId: string | null = null;

// ── Public API ─────────────────────────────────────────────────

/**
 * Creates a new Shopify cart with the given line items.
 * Returns the cart object with checkoutUrl.
 */
export async function createCart(lines: CartLine[]): Promise<ShopifyCart> {
  const data = await storefrontFetch<CreateCartResponse>(CART_CREATE_MUTATION, {
    lines: lines.map((l) => ({
      merchandiseId: l.variantId,
      quantity: l.quantity,
    })),
  });

  if (data.cartCreate.userErrors.length > 0) {
    throw new Error(data.cartCreate.userErrors[0].message);
  }

  const cart = data.cartCreate.cart;
  currentCartId = cart.id;
  return cart;
}

/**
 * Adds items to an existing cart, or creates a new one if no cart exists.
 */
export async function addToCart(lines: CartLine[]): Promise<ShopifyCart> {
  if (!currentCartId) {
    return createCart(lines);
  }

  const data = await storefrontFetch<AddToCartResponse>(CART_LINES_ADD_MUTATION, {
    cartId: currentCartId,
    lines: lines.map((l) => ({
      merchandiseId: l.variantId,
      quantity: l.quantity,
    })),
  });

  if (data.cartLinesAdd.userErrors.length > 0) {
    throw new Error(data.cartLinesAdd.userErrors[0].message);
  }

  return data.cartLinesAdd.cart;
}

/**
 * Posts a cart event to the parent window (for Shopify iframe embedding).
 */
export function postCartMessage(checkoutUrl: string, cartId: string): void {
  if (typeof window === 'undefined') return;

  window.parent?.postMessage(
    {
      type: 'cart:add',
      checkoutUrl,
      cartId,
    },
    '*'
  );
}

export function getCurrentCartId(): string | null {
  return currentCartId;
}
