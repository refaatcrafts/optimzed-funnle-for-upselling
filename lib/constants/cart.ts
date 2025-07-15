export const CART_CONFIG = {
  freeShippingThreshold: 300,
  maxQuantityPerItem: 10,
  sessionStorageKey: 'coffeecraft-cart',
  defaultQuantity: 1,
} as const

export const SHIPPING_CONFIG = {
  freeThreshold: 300,
  standardRate: 9.99,
  expressRate: 19.99,
} as const

export const CART_MESSAGES = {
  empty: 'Your cart is empty',
  emptySubtext: 'Add some coffee products to get started!',
  freeShippingQualified: '🎉 You qualify for free shipping!',
  freeShippingProgress: (remaining: number) => `Add $${remaining} more for free shipping!`,
} as const