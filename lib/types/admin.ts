export interface AdminConfig {
  upselling: {
    frequentlyBoughtTogether: boolean
    youMightAlsoLike: boolean
    freeShippingProgressBar: boolean
    postCartUpsellOffers: boolean
    crossSellRecommendations: boolean
  }
  lastUpdated: string
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