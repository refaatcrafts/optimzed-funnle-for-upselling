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
  productConfiguration: {
    homePagePrimary: null,
    recommendations: [],
    frequentlyBoughtTogether: [],
    upsellOffers: [],
    crossSellRecommendations: []
  },
  taagerApi: {
    apiKey: null,
    taagerId: null,
    baseUrl: 'https://public.api.taager.com',
    country: 'SAU',
    isConfigured: false,
    lastValidated: null
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
  PRODUCT_CONFIG: '/admin/product-config',
} as const

// Configuration limits
export const PRODUCT_CONFIG_LIMITS = {
  MAX_RECOMMENDATIONS: 3,
  MAX_FREQUENTLY_BOUGHT_TOGETHER: 3,
  MAX_UPSELL_OFFERS: 10,
  MAX_CROSS_SELL_RECOMMENDATIONS: 6,
  SKU_PATTERN: /^[A-Z0-9]{6,20}$/i, // Basic SKU pattern validation
} as const

// Validation functions
export function isValidProductConfiguration(config: any): config is import('@/lib/types/admin').ProductConfiguration {
  if (!config || typeof config !== 'object') return false
  
  return (
    (config.homePagePrimary === null || typeof config.homePagePrimary === 'string') &&
    Array.isArray(config.recommendations) &&
    config.recommendations.length <= PRODUCT_CONFIG_LIMITS.MAX_RECOMMENDATIONS &&
    Array.isArray(config.frequentlyBoughtTogether) &&
    config.frequentlyBoughtTogether.length <= PRODUCT_CONFIG_LIMITS.MAX_FREQUENTLY_BOUGHT_TOGETHER &&
    Array.isArray(config.upsellOffers) &&
    config.upsellOffers.length <= PRODUCT_CONFIG_LIMITS.MAX_UPSELL_OFFERS &&
    Array.isArray(config.crossSellRecommendations) &&
    config.crossSellRecommendations.length <= PRODUCT_CONFIG_LIMITS.MAX_CROSS_SELL_RECOMMENDATIONS
  )
}

export function isValidTaagerApiConfig(config: any): config is import('@/lib/types/admin').TaagerApiConfig {
  if (!config || typeof config !== 'object') return false
  
  return (
    (config.apiKey === null || typeof config.apiKey === 'string') &&
    (config.taagerId === null || typeof config.taagerId === 'number') &&
    typeof config.baseUrl === 'string' &&
    typeof config.country === 'string' &&
    typeof config.isConfigured === 'boolean' &&
    (config.lastValidated === null || typeof config.lastValidated === 'string')
  )
}

export function isValidExtendedAdminConfig(config: any): config is AdminConfig {
  if (!config || typeof config !== 'object') return false
  
  // Check existing upselling config
  if (!config.upselling || typeof config.upselling !== 'object') return false
  
  const requiredUpsellingFeatures = [
    'frequentlyBoughtTogether',
    'youMightAlsoLike', 
    'freeShippingProgressBar',
    'postCartUpsellOffers',
    'crossSellRecommendations'
  ]
  
  const hasValidUpselling = requiredUpsellingFeatures.every(
    feature => typeof config.upselling[feature] === 'boolean'
  )
  
  return (
    hasValidUpselling &&
    isValidProductConfiguration(config.productConfiguration) &&
    isValidTaagerApiConfig(config.taagerApi) &&
    typeof config.lastUpdated === 'string'
  )
}

export function validateSku(sku: string): boolean {
  return typeof sku === 'string' && 
         sku.length >= 6 && 
         sku.length <= 20 && 
         PRODUCT_CONFIG_LIMITS.SKU_PATTERN.test(sku)
}