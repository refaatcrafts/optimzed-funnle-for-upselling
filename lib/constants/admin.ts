import { AdminConfig, FeatureToggle } from '@/lib/types/admin'

export const ADMIN_CREDENTIALS = {
  USERNAME: 'user',
  PASSWORD: 'password',
} as const

export const SESSION_CONFIG = {
  DURATION: 30 * 60 * 1000, // 30 minutes in milliseconds
  STORAGE_KEY: 'adminSession',
  CONFIG_STORAGE_KEY: 'adminConfig',
  AUTH_STATE_KEY: 'adminAuthState',
} as const

export const RATE_LIMITING = {
  MAX_ATTEMPTS: 5,
  WINDOW_DURATION: 15 * 60 * 1000, // 15 minutes in milliseconds
} as const

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  upselling: {
    frequentlyBoughtTogether: true,
    youMightAlsoLike: true,
    freeShippingProgressBar: true,
    postCartUpsellOffers: true,
    crossSellRecommendations: true,
  },
  lastUpdated: new Date().toISOString(),
}

export const FEATURE_TOGGLES: FeatureToggle[] = [
  {
    id: 'frequentlyBoughtTogether',
    name: 'Frequently Bought Together',
    description: 'Show bundle offers on product pages with related items',
    enabled: true,
    category: 'product',
  },
  {
    id: 'youMightAlsoLike',
    name: 'You Might Also Like',
    description: 'Display product recommendations in cart and checkout',
    enabled: true,
    category: 'cart',
  },
  {
    id: 'freeShippingProgressBar',
    name: 'Free Shipping Progress Bar',
    description: 'Show progress toward free shipping threshold in cart',
    enabled: true,
    category: 'cart',
  },
  {
    id: 'postCartUpsellOffers',
    name: 'Post-Cart Upsell Offers',
    description: 'Show special offers after adding items to cart',
    enabled: true,
    category: 'upselling',
  },
  {
    id: 'crossSellRecommendations',
    name: 'Cross-sell Recommendations',
    description: 'Display related product suggestions throughout the site',
    enabled: true,
    category: 'upselling',
  },
]

export const ADMIN_ROUTES = {
  LOGIN: '/admin/login',
  DASHBOARD: '/admin',
  CONFIG: '/admin/config',
} as const