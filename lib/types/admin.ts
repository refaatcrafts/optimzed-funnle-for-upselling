export interface AdminConfig {
  upselling: {
    frequentlyBoughtTogether: boolean
    youMightAlsoLike: boolean
    freeShippingProgressBar: boolean
    postCartUpsellOffers: boolean
    crossSellRecommendations: boolean
  }
  productConfiguration: ProductConfiguration
  taagerApi: TaagerApiConfig
  lastUpdated: string
}

export interface ProductConfiguration {
  homePagePrimary: string | null           // Single SKU for home page
  recommendations: string[]                // Up to 3 SKUs
  frequentlyBoughtTogether: string[]       // Up to 3 SKUs per product
  upsellOffers: string[]                   // Multiple SKUs for post-checkout
  crossSellRecommendations: string[]       // Multiple SKUs for cross-sell
}

export interface TaagerApiConfig {
  apiKey: string | null
  taagerId: number | null
  baseUrl: string
  country: string
  isConfigured: boolean
  lastValidated: string | null
}

export interface AdminSession {
  isAuthenticated: boolean
  expiresAt: string
  lastActivity: string
}

export interface FeatureToggle {
  id: keyof AdminConfig['upselling']
  name: string
  description: string
  enabled: boolean
  category: 'upselling' | 'cart' | 'product'
}

export interface LoginAttempt {
  timestamp: number
  success: boolean
}

export interface AdminAuthState {
  session: AdminSession | null
  loginAttempts: LoginAttempt[]
}

// Product configuration validation types
export interface ValidationResult {
  sku: string
  isValid: boolean
  error?: string
  productName?: string
  lastChecked: string
}

export interface ConfigurationValidationResult {
  isValid: boolean
  results: ValidationResult[]
  summary: {
    total: number
    valid: number
    invalid: number
    unchecked: number
  }
}

// Taager API response types
export interface TaagerVariantGroup {
  id: string
  primaryVariant: TaagerProductVariant
  variants: TaagerProductVariant[]
  country: string
  attributeSets: Array<{
    type: string
    attibutes: string[]
  }>
  commercialCategoryIds: string[]
  introducedAt: string
  isLockedForMe: boolean
  category: Array<{
    id: string
    name: string
    text: string
    icon: string
    createdAt: string
    updatedAt: string
    __v: number
    sorting: number
    featured: boolean
    country: string
  }>
}

export interface TaagerProductVariant {
  id: string
  productName: string
  name: {
    ar: string
    en: string
    id: string
  }
  description: {
    ar: string
    en: string
    id: string
  }
  productPrice: number
  productProfit: number
  productQuantity: number
  productDescription: string
  productWeight: number
  country: string
  prodID: string
  category: string
  categoryId: string
  sellerName: string
  productPicture: string
  featured: boolean
  inStock: boolean
  extraImage1?: string
  extraImage2?: string
  extraImage3?: string
  extraImage4?: string
  extraImage5?: string
  extraImage6?: string
  isExpired: boolean
  isExternalRetailer: boolean
  productAvailability: string
  orderCount: number
  additionalMedia: string[]
  embeddedVideos: string[]
  specifications: string
  howToUse: string
  variants: {
    colors: string[]
    sizes: string[]
    numericSizes: string[]
  }
  attributes: Array<{
    type: string
    value: string
  }>
  type: string
  bundleVariants: Array<{
    id: string
    variantId: string
    quantity: number
  }>
  sale: string
  upSellableVariants: string[]
  isPrimary: boolean
  isPreOrderable: boolean
  keywords: string[]
  createdAt: string
  updatedAt: string
}

export interface TaagerSearchResponse {
  count: number
  variantGroups: TaagerVariantGroup[]
}

export interface TaagerSearchParams {
  page: number
  pageSize: number
  country?: string
  commercialCategoryId?: string
  variantId?: string
}